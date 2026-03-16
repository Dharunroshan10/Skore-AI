require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

// Explicit root route for Express 5 compatibility
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Init Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Middleware to verify session token
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });
    
    req.user = user;
    next();
};

// ============================
// AUTH ROUTES
// ============================

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'User registered', data });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: 'Login successful', session: data.session });
});

// Google OAuth
app.post('/api/auth/google', async (req, res) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: (req.body.redirectTo || 'http://localhost:3000')
        }
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ url: data.url });
});

app.post('/api/auth/logout', async (req, res) => {
    // Supabase handles logout mostly on client side by clearing token, but can call signOut
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        await supabase.auth.signOut(token);
    }
    return res.json({ message: 'Logged out' });
});

// ============================
// USER DATA & PROFILE ROUTES
// ============================

app.get('/api/user/profile', authenticate, async (req, res) => {
    let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();
        
    // If profile doesn't exist, create a default one to avoid 400 error
    if (error && error.code === 'PGRST116') { // PGRST116 = JSON object not found (row missing)
        const newProfile = { id: req.user.id, email: req.user.email, xp: 0, streak: 0, level: 1 };
        const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();
        
        if (createError) return res.status(400).json({ error: createError.message });
        data = created;
    } else if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    return res.json({ profile: data });
});

app.post('/api/user/sync', authenticate, async (req, res) => {
    // Sync XP, streak, level from frontend to database
    const { xp, streak, level, analysisData, arenaData, streakDays, scoreHistory } = req.body;
    
    // Update profile stats
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp, streak, level })
        .eq('id', req.user.id);

    if (profileError) return res.status(400).json({ error: profileError.message });
    
    // Keep this simple: we could also insert/update the analysisData into `analyses` table directly
    if (analysisData && analysisData.overall) {
        await supabase.from('analyses').insert({
            user_id: req.user.id,
            overall_score: analysisData.overall,
            scores_json: analysisData.scores,
            roles_json: analysisData.roles,
            roadmap_json: analysisData.roadmap,
            parsed_resume: analysisData.parsedResume
        });
    }

    return res.json({ message: 'Data synced successfully' });
});

// ============================
// SECURE AI ROUTE
// ============================

app.post('/api/ai/call', authenticate, async (req, res) => {
    const { prompt, maxTokens, stream } = req.body;
    
    if (!process.env.NVIDIA_API_KEY) {
        return res.status(500).json({ error: 'NVIDIA_API_KEY missing on server' });
    }

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
                ...(stream && { 'Accept': 'text/event-stream' })
            },
            body: JSON.stringify({
                model: 'moonshotai/kimi-k2.5',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens || 16384,
                temperature: 1.00,
                top_p: 1.00,
                stream: stream || false,
                chat_template_kwargs: { thinking: true }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: 'NVIDIA API Error', details: errText });
        }

        // Handle streaming response directly passing it to the frontend via chunks
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            response.body.pipe(res);
        } else {
            const json = await response.json();
            res.json(json);
        }

    } catch (err) {
        console.error('AI Call Error:', err);
        return res.status(500).json({ error: 'Server AI Request Failed', details: err.message });
    }
});

// Catch-all to serve index.html for SPA routing (Express 5 compatible)
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Skore AI Backend running on http://localhost:${PORT}`);
});

module.exports = app;
