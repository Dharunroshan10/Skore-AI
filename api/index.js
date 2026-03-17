require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));

// Explicit root route for Express 5 compatibility
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
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
// SECURE AI ROUTES
// ============================

const AI_MODEL = 'meta/llama-3.1-70b-instruct'; // Standard available model on NIM
const DEFAULT_SYSTEM_MSG = 'You are Skore AI, an expert career counselor, resume analyst, and placement readiness coach. Be concise, actionable, and specific. Never use generic advice.';

// Helper: strip <think>...</think> blocks from AI output
function stripThinkingTags(text) {
    if (!text) return text;
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// General AI call (streaming + non-streaming)
app.post('/api/ai/call', authenticate, async (req, res) => {
    const { prompt, maxTokens, stream, system, temperature } = req.body;
    
    if (!process.env.NVIDIA_API_KEY) {
        return res.status(500).json({ error: 'NVIDIA_API_KEY missing on server' });
    }

    try {
        const messages = [
            { role: 'system', content: system || DEFAULT_SYSTEM_MSG },
            { role: 'user', content: prompt }
        ];

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
                ...(stream && { 'Accept': 'text/event-stream' })
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages,
                max_tokens: maxTokens || 4096,
                temperature: temperature || 0.6,
                top_p: 0.9,
                stream: stream || false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('NVIDIA API Error:', response.status, errText);
            return res.status(response.status).json({ error: 'NVIDIA API Error', details: errText });
        }

        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            response.body.pipe(res);
        } else {
            const json = await response.json();
            // Strip thinking tags from non-streaming responses
            if (json.choices && json.choices[0] && json.choices[0].message) {
                json.choices[0].message.content = stripThinkingTags(json.choices[0].message.content);
            }
            res.json(json);
        }

    } catch (err) {
        console.error('AI Call Error:', err);
        return res.status(500).json({ error: 'Server AI Request Failed', details: err.message });
    }
});

// Dedicated JSON endpoint — optimized for structured data responses
app.post('/api/ai/json', authenticate, async (req, res) => {
    const { prompt, maxTokens } = req.body;
    
    if (!process.env.NVIDIA_API_KEY) {
        return res.status(500).json({ error: 'NVIDIA_API_KEY missing on server' });
    }

    const systemMsg = 'You are an expert career analysis AI. You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences, no thinking, no preamble. Output raw JSON only.';

    try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: systemMsg },
                    { role: 'user', content: prompt }
                ],
                max_tokens: maxTokens || 3000,
                temperature: 0.2,
                top_p: 0.9,
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('NVIDIA JSON API Error:', response.status, errText);
            return res.status(response.status).json({ error: 'NVIDIA API Error', details: errText });
        }

        const json = await response.json();
        let content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content || '';
        
        // Strip thinking tags
        content = stripThinkingTags(content);
        
        // Try to extract valid JSON from the response
        let parsed = null;
        try {
            parsed = JSON.parse(content.trim());
        } catch(e) {
            // Try extracting JSON from markdown code block
            const match = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
            if (match) {
                try { parsed = JSON.parse(match[1]); } catch(e2) {}
            }
            // Try extracting between first { and last }
            if (!parsed) {
                const startIdx = content.indexOf('{');
                const endIdx = content.lastIndexOf('}');
                if (startIdx !== -1 && endIdx > startIdx) {
                    try { parsed = JSON.parse(content.substring(startIdx, endIdx + 1)); } catch(e3) {}
                }
            }
        }

        if (parsed) {
            return res.json({ success: true, data: parsed });
        } else {
            console.error('Failed to parse AI JSON. Raw:', content);
            return res.status(422).json({ error: 'AI returned invalid JSON', raw: content.substring(0, 500) });
        }

    } catch (err) {
        console.error('AI JSON Call Error:', err);
        return res.status(500).json({ error: 'Server AI Request Failed', details: err.message });
    }
});

// ============================
// AUTHENTICATION ROUTES
// ============================

app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    try {
        // Register with Supabase
        const { data, error } = await supabase.auth.signUpWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        // Create user profile in database
        if (data.user) {
            await supabase.from('user_profiles').insert({
                user_id: data.user.id,
                email: email,
                xp: 0,
                streak: 0,
                level: 1,
                created_at: new Date().toISOString()
            }).catch(() => {}); // Ignore if table doesn't exist
        }
        
        return res.json({ 
            session: data.session,
            user: data.user,
            message: 'Signup successful'
        });
    } catch (err) {
        console.error('Register Error:', err);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        return res.json({
            session: data.session,
            user: data.user,
            message: 'Login successful'
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/google', async (req, res) => {
    try {
        const { redirectTo } = req.body;
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo || `${req.protocol}://${req.get('host')}`
            }
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        return res.json({ url: data.url });
    } catch (err) {
        console.error('Google Auth Error:', err);
        return res.status(500).json({ error: 'Google authentication failed' });
    }
});

// ============================
// USER PROFILE ROUTES
// ============================

app.get('/api/user/profile', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch profile data
        const { data, error } = await supabase
            .from('profiles')
            .select('xp, streak, level')
            .eq('id', userId)
            .single();
        
        if (error || !data) {
            // Profile is created by DB trigger on signup, but defense here just in case
            return res.json({
                profile: {
                    xp: 0,
                    streak: 0,
                    level: 1,
                    analysisData: null
                }
            });
        }
        
        // Optional: fetch latest analysis if needed by frontend
        const { data: analysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return res.json({
            profile: {
                xp: data.xp || 0,
                streak: data.streak || 0,
                level: data.level || 1,
                analysisData: analysis || null
            }
        });
    } catch (err) {
        console.error('Fetch Profile Error:', err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/api/user/sync', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { xp, streak, level, analysisData } = req.body;
        
        // Update user profile
        const { error } = await supabase
            .from('profiles')
            .update({
                xp: xp || 0,
                streak: streak || 0,
                level: level || 1
            })
            .eq('id', userId);
        
        // If analysisData exists, save it to analyses table
        if (analysisData && analysisData.overall) {
            await supabase.from('analyses').insert({
                user_id: userId,
                overall_score: analysisData.overall,
                scores_json: analysisData.scores,
                roles_json: analysisData.roles,
                roadmap_json: analysisData.roadmap,
                parsed_resume: analysisData.parsedResume
            });
        }
        
        return res.json({ success: true, message: 'Profile synced' });
    } catch (err) {
        console.error('Sync Profile Error:', err);
        return res.json({ success: true, message: 'Data received' });
    }
});

// ============================
// CATCH-ALL & SERVER STARTUP
// ============================

// Catch-all to serve index.html for SPA routing (Express 5 compatible)
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Skore AI Backend running on http://localhost:${PORT}`);
});

module.exports = app;
