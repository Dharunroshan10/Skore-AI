/* SKORE AI - FULLSTACK APP.JS */
const BACKEND_URL = '/api';

const APP = {
    currentPage: 'home', pageHistory: [], analysisData: null, arenaData: {}, streak: 0, xp: 0, level: 1,
    selectedRoles: [], resumeRoles: [], resumeSkillsList: [], parsedResume: null, generatedQuestions: [],
    currentArenaRole: null, currentLevel: 1, challengeTimer: null, challengeTimeLeft: 60, selectedAnswer: null,
    currentChallenge: null, streakDays: [], scoreHistory: [], currentResumeTemplate: null, currentPortfolioTemplate: null,
    interviewRole: null, interviewQuestions: [], interviewAnswers: [], interviewCurrentQ: 0, interviewTimer: null, interviewTimeLeft: 120,
    token: null
};

document.addEventListener('DOMContentLoaded', function () {
    try {
        // Capture Google OAuth token from URL hash
        captureOAuthToken();
        loadState(); initLoadingScreen(); initNavbar(); initHeroCounters(); initResumeDropZone(); initATSDropZones(); initRolesGrid(); initArenaRoles(); initResumeTemplates(); initPortfolioTemplates(); updateNavStats(); updateProfilePage();
        if (APP.analysisData) renderDashboard();
    } catch(e) {
        console.error('CRITICAL INIT ERROR:', e);
        var ls = document.getElementById('loadingScreen');
        if (ls) ls.style.display = 'none';
    }
});

// ============================
// AUTHENTICATION LOGIC
// ============================
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authModalTitle').textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
    document.getElementById('authModalDesc').textContent = isLoginMode ? 'Login to save your AI career progress.' : 'Sign up to start tracking your career.';
    document.getElementById('authSubmitBtn').textContent = isLoginMode ? 'Login' : 'Sign up';
    document.getElementById('authToggleText').textContent = isLoginMode ? 'Don\'t have an account?' : 'Already have an account?';
    document.getElementById('authToggleLink').textContent = isLoginMode ? 'Sign up' : 'Login';
    document.getElementById('authErrorMsg').style.display = 'none';
}

function openAuthModal() {
    document.getElementById('authModalOverlay').style.display = 'flex';
}

function closeAuthModal() {
    document.getElementById('authModalOverlay').style.display = 'none';
    document.getElementById('authErrorMsg').style.display = 'none';
}

async function handleAuthSubmit() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errEl = document.getElementById('authErrorMsg');
    const btn = document.getElementById('authSubmitBtn');
    
    if(!email || !password) { errEl.textContent = 'Please fill all fields'; errEl.style.display='block'; return; }
    
    btn.textContent = 'Loading...'; btn.disabled = true; errEl.style.display = 'none';
    
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    
    try {
        const res = await fetch(BACKEND_URL + endpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if(!res.ok) throw new Error(data.error || 'Authentication failed');
        
        if (data.session && data.session.access_token) {
            APP.token = data.session.access_token;
            localStorage.setItem('skore_token', APP.token);
            closeAuthModal();
            showToast(isLoginMode ? 'Logged in successfully! 🎉' : 'Account created! 🎉');
            updateAuthUI();
            await fetchProfile();
        } else if (!isLoginMode) {
            isLoginMode = true; toggleAuthMode();
            showToast('Registered! Please login now.');
        }
    } catch(err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        btn.textContent = isLoginMode ? 'Login' : 'Sign up'; btn.disabled = false;
    }
}

async function handleGoogleLogin() {
    try {
        const res = await fetch(BACKEND_URL + '/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ redirectTo: window.location.origin })
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            showToast('Google login failed: ' + (data.error || 'Unknown error'), '❌');
        }
    } catch(err) {
        console.error('Google login error:', err);
        showToast('Google login failed', '❌');
    }
}

function captureOAuthToken() {
    // After Google OAuth redirect, Supabase returns token in URL hash
    var hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        var params = new URLSearchParams(hash.substring(1));
        var accessToken = params.get('access_token');
        if (accessToken) {
            APP.token = accessToken;
            localStorage.setItem('skore_token', accessToken);
            // Clean the URL hash
            history.replaceState(null, '', window.location.pathname);
            showToast('Logged in with Google! 🎉', '✅');
            setTimeout(function() { updateAuthUI(); }, 500);
        }
    }
}

function logout() {
    APP.token = null; localStorage.removeItem('skore_token');
    APP.analysisData = null; APP.arenaData = {}; APP.xp=0; APP.level=1; APP.streak=0;
    updateAuthUI(); updateNavStats(); navigateTo('home');
    showToast('Logged out');
}

function updateAuthUI() {
    const loggedIn = !!APP.token;
    document.getElementById('navLoginBtn').style.display = loggedIn ? 'none' : 'inline-block';
    document.getElementById('mmLoginBtn').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('navProfileBtn').style.display = loggedIn ? 'flex' : 'none';
    document.getElementById('navStreakChip').style.display = loggedIn ? 'flex' : 'none';
    document.getElementById('navXPChip').style.display = loggedIn ? 'flex' : 'none';
}

async function fetchProfile() {
    if(!APP.token) return;
    try {
        const res = await fetch(BACKEND_URL + '/user/profile', {
            headers: { 'Authorization': 'Bearer ' + APP.token }
        });
        if(res.ok) {
            const data = await res.json();
            if(data.profile) {
                APP.xp = data.profile.xp || 0;
                APP.streak = data.profile.streak || 0;
                APP.level = data.profile.level || 1;
                updateNavStats();
            }
        }
    } catch(err) { console.error('Fetch profile err', err); }
}

async function syncProfile() {
    if(!APP.token) return;
    try {
        await fetch(BACKEND_URL + '/user/sync', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + APP.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ xp: APP.xp, streak: APP.streak, level: APP.level, analysisData: APP.analysisData })
        });
    } catch(err) {}
}

// ============================
// SYSTEM STATE
// ============================
function loadState() {
    APP.token = localStorage.getItem('skore_token');
    if(APP.token) { updateAuthUI(); fetchProfile(); } else updateAuthUI();
    try {
        var saved = localStorage.getItem('skoreAI_localdata');
        if (saved) {
            var parsed = JSON.parse(saved);
            APP.analysisData = parsed.analysisData || null; APP.arenaData = parsed.arenaData || {};
            APP.streakDays = parsed.streakDays || []; APP.scoreHistory = parsed.scoreHistory || [];
            APP.selectedRoles = parsed.selectedRoles || []; // Load selected roles
            if(!APP.token) { APP.xp = parsed.xp||0; APP.streak = parsed.streak||0; APP.level = parsed.level||1; }
        }
    } catch (e) { }
}
function saveState() {
    try {
        localStorage.setItem('skoreAI_localdata', JSON.stringify({ xp: APP.xp, streak: APP.streak, level: APP.level, analysisData: APP.analysisData, arenaData: APP.arenaData, streakDays: APP.streakDays, scoreHistory: APP.scoreHistory, selectedRoles: APP.selectedRoles }));
    } catch (e) {}
    if(APP.token) syncProfile();
}

// ============================
// SECURE AI ROUTING
// ============================

// Helper: strip <think>...</think> blocks from AI output
function stripThinkTags(text) {
    if (!text) return text;
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

async function callAI(prompt, onChunk, onDone, maxTokens, systemMsg) {
    if(!APP.token) { showToast('Please login to use AI features', '🔒'); openAuthModal(); return; }
    try {
        var bodyObj = { prompt: prompt, maxTokens: maxTokens || 2000, stream: true };
        if (systemMsg) bodyObj.system = systemMsg;
        
        const response = await fetch(BACKEND_URL + '/ai/call', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + APP.token, 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: JSON.stringify(bodyObj)
        });
        if (!response.ok) {
            if (response.status === 401) { logout(); showToast('Session expired. Please log in again.', '🔒'); openAuthModal(); }
            throw new Error('API error: ' + response.status);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '', fullText = '', insideThink = false;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
                        if (content) {
                            fullText += content;
                            // Strip think tags from streamed content for display
                            var cleanFull = stripThinkTags(fullText);
                            if (onChunk) onChunk(content, cleanFull);
                        }
                    } catch (e) {}
                }
            }
        }
        fullText = stripThinkTags(fullText);
        if (onDone) onDone(fullText);
        return fullText;
    } catch (err) { console.error('AI Error:', err); if (onDone) onDone(null, err.message); return null; }
}

async function callAISimple(prompt, maxTokens, systemMsg) {
    if(!APP.token) { showToast('Please login to use AI features', '🔒'); openAuthModal(); throw new Error('Not logged in'); }
    try {
        var bodyObj = { prompt: prompt, maxTokens: maxTokens || 2000, stream: false };
        if (systemMsg) bodyObj.system = systemMsg;
        
        const response = await fetch(BACKEND_URL + '/ai/call', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + APP.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
        });
        if (!response.ok) {
            if (response.status === 401) { logout(); showToast('Session expired. Please log in again.', '🔒'); openAuthModal(); }
            throw new Error('API ' + response.status);
        }
        const data = await response.json();
        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
        return stripThinkTags(content);
    } catch (err) { console.error('AI Simple Error:', err); return null; }
}

// Dedicated JSON AI call — uses /api/ai/json for reliable structured output
async function callAIJSON(prompt, maxTokens) {
    if(!APP.token) { showToast('Please login to use AI features', '🔒'); openAuthModal(); throw new Error('Not logged in'); }
    var response = await fetch(BACKEND_URL + '/ai/json', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + APP.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, maxTokens: maxTokens || 3000 })
    });
    if (!response.ok) {
        if (response.status === 401) { logout(); showToast('Session expired.', '🔒'); openAuthModal(); }
        var errData = await response.json().catch(function() { return {}; });
        throw new Error(errData.error || 'API error ' + response.status);
    }
    var result = await response.json();
    if (result.success && result.data) return result.data;
    throw new Error(result.error || 'Invalid JSON from AI');
}

// ============================
// UI NAVIGATION & UTILS
// ============================
function initLoadingScreen() { setTimeout(function () { var ls = document.getElementById('loadingScreen'); if (ls) { ls.classList.add('hidden'); setTimeout(function () { if (ls.parentNode) ls.parentNode.removeChild(ls); }, 600); } }, 2200); }

function navigateTo(page) {
    if (APP.currentPage !== page) APP.pageHistory.push(APP.currentPage);
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    APP.currentPage = page;
    document.querySelectorAll('.nav-pill').forEach(function(pill) { pill.classList.toggle('active', pill.dataset.page === page); });
    updateNavPillBg();
    var backBtn = document.getElementById('globalBackBtn');
    if (backBtn) backBtn.style.display = (page === 'home') ? 'none' : 'flex';
    var mm = document.getElementById('mobileMenu');
    if (mm && mm.classList.contains('open')) toggleMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'dashboard' && APP.analysisData) renderDashboard();
    if (page === 'profile') updateProfilePage();
    if (page === 'practice') initArenaRoles(); // Re-render Arena roles dynamically
}
function goBack() { if (APP.pageHistory.length > 0) { var prev = APP.pageHistory.pop(); navigateTo(prev); APP.pageHistory.pop(); } else { navigateTo('home'); } }
function initNavbar() { window.addEventListener('scroll', function () { var nav = document.getElementById('navbar'); if (nav) nav.classList.toggle('scrolled', window.scrollY > 20); }); setTimeout(updateNavPillBg, 150); }
function updateNavPillBg() {
    var activePill = document.querySelector('.nav-pill.active'), bg = document.getElementById('navPillBg'), pills = document.getElementById('navPills');
    if (activePill && bg && pills) { var pr = activePill.getBoundingClientRect(), plr = pills.getBoundingClientRect(); bg.style.width = pr.width + 'px'; bg.style.left = (pr.left - plr.left) + 'px'; }
}
function toggleMobileMenu() { var mm = document.getElementById('mobileMenu'), btn = document.getElementById('navHamburger'); if (mm) mm.classList.toggle('open'); if (btn) btn.classList.toggle('active'); }
function updateNavStats() { var s = document.getElementById('navStreak'), x = document.getElementById('navXP'); if (s) s.textContent = APP.streak; if (x) x.textContent = APP.xp; }
function initHeroCounters() {
    var counters = document.querySelectorAll('.hms-num[data-count]');
    var observer = new IntersectionObserver(function(entries) { entries.forEach(function(e) { if (e.isIntersecting) { animateCounter(e.target); observer.unobserve(e.target); } }); }, { threshold: 0.5 });
    counters.forEach(function(c) { observer.observe(c); });
}
function animateCounter(el) {
    var target = parseInt(el.dataset.count), start = Date.now(), dur = 2000;
    (function update() { var prog = Math.min((Date.now() - start) / dur, 1); el.textContent = Math.floor(target * (1 - Math.pow(1 - prog, 3))).toLocaleString(); if (prog < 1) requestAnimationFrame(update); })();
}
function showToast(message, icon) {
    if (!icon) icon = 'ok';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div'); toast.className = 'toast';
    toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3200);
}
function showToolToast(name) { showToast(name + ' coming soon!', 'WIP'); }
function renderMarkdown(text) {
    if (!text) return '';
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/#{3}\s(.+)/g, '<h4 style="margin:12px 0 4px;font-size:13px;font-weight:800;">$1</h4>')
        .replace(/#{2}\s(.+)/g, '<h3 style="margin:14px 0 6px;font-size:15px;font-weight:800;">$1</h3>')
        .replace(/#{1}\s(.+)/g, '<h2 style="margin:16px 0 8px;font-size:17px;font-weight:900;">$1</h2>')
        .replace(/^-\s(.+)/gm, '<li style="margin:3px 0;">$1</li>').replace(/\n\n/g, '</p><p style="margin:8px 0;">').replace(/\n/g, '<br>');
}
function toggleAISuggestion() {
    var panel = document.getElementById('aiSuggestionPanel');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) loadAISuggestions();
}
async function loadAISuggestions() {
    var body = document.getElementById('aiPanelBody');
    if (!body) return;
    body.innerHTML = '<div class="ai-panel-loading"><div class="ai-typing-indicator"><span></span><span></span><span></span></div><p>AI is thinking...</p></div>';

    var contextInfo = APP.analysisData ? ('Student: ' + APP.analysisData.name + ', Score: ' + APP.analysisData.overall + '/100') : 'No analysis yet.';
    var prompt = 'You are a career coach AI. Give 2 very short, actionable career suggestions. Context: ' + contextInfo + '. Format as 2 items with emoji. No generic advice.';

    body.innerHTML = '<div style="font-size:13px;line-height:1.7;color:var(--text-primary);"></div>';
    var contentDiv = body.querySelector('div');

    await callAI(prompt, function(chunk, full) { contentDiv.innerHTML = renderMarkdown(full); }, function(full) {
        if (!full) contentDiv.innerHTML = '<p style="color:var(--text-secondary);">AI suggestions unavailable.</p>';
    }, 400);
}

function initResumeDropZone() {
    var dropZone = document.getElementById('resumeDropZone'), fileInput = document.getElementById('resumeFileInput');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', function() { dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', function(e) { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length) handleResumeFile(e.dataTransfer.files[0]); });
    }
    if (fileInput) fileInput.addEventListener('change', function(e) { if (e.target.files.length) handleResumeFile(e.target.files[0]); });
}
function initATSDropZones() {
    var f1 = document.getElementById('atsHomeFile'), d1 = document.getElementById('atsHomeDrop');
    if (d1) {
        d1.addEventListener('dragover', function(e) { e.preventDefault(); d1.classList.add('dragover'); });
        d1.addEventListener('dragleave', function() { d1.classList.remove('dragover'); });
        d1.addEventListener('drop', function(e) { e.preventDefault(); d1.classList.remove('dragover'); if (e.dataTransfer.files.length) parseResumeFile(e.dataTransfer.files[0], 'atsHomePaste'); });
    }
    if (f1) f1.addEventListener('change', function(e) { if (e.target.files.length) parseResumeFile(e.target.files[0], 'atsHomePaste'); });

    // Full ATS Drop Zones
    var f2 = document.getElementById('atsFullFile'), d2 = document.getElementById('atsFullDrop');
    if (d2) {
        d2.addEventListener('dragover', function(e) { e.preventDefault(); d2.classList.add('dragover'); });
        d2.addEventListener('dragleave', function() { d2.classList.remove('dragover'); });
        d2.addEventListener('drop', function(e) { e.preventDefault(); d2.classList.remove('dragover'); if (e.dataTransfer.files.length) parseResumeFile(e.dataTransfer.files[0], 'atsFullPaste'); });
    }
    if (f2) f2.addEventListener('change', function(e) { if (e.target.files.length) parseResumeFile(e.target.files[0], 'atsFullPaste'); });
}

var ROLES_DATA = [
    { id: 'swe', name: 'Software Engineer', icon: '💻', skills: ['DSA', 'System Design', 'Algorithms', 'Java', 'C++', 'Git'] },
    { id: 'fe', name: 'Frontend Engineer', icon: '🎨', skills: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript', 'Web Performance'] },
    { id: 'be', name: 'Backend Engineer', icon: '⚙️', skills: ['Node.js', 'Python', 'SQL', 'MongoDB', 'Redis'] },
    { id: 'ds', name: 'Data Scientist', icon: '📊', skills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Stats'] },
    { id: 'pm', name: 'Product Manager', icon: '📋', skills: ['Agile', 'Jira', 'Product Strategy', 'UI/UX Basics'] },
    { id: 'devops', name: 'DevOps Engineer', icon: '🚀', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'] },
    { id: 'fs', name: 'Full Stack Engineer', icon: '🌐', skills: ['React', 'Node.js', 'SQL', 'API Design', 'JavaScript'] },
    { id: 'mob', name: 'Mobile Developer', icon: '📱', skills: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'Mobile UI'] },
    { id: 'sec', name: 'Cybersecurity Analyst', icon: '🛡️', skills: ['Network Security', 'Penetration Testing', 'Cryptography', 'Linux'] },
    { id: 'cloud', name: 'Cloud Architect', icon: '☁️', skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'System Design'] },
    { id: 'qa', name: 'QA Engineer', icon: '✅', skills: ['Selenium', 'Cypress', 'Test Automation', 'Manual Testing', 'Jira'] },
    { id: 'da', name: 'Data Analyst', icon: '📈', skills: ['SQL', 'Excel', 'Tableau', 'Power BI', 'Python'] }
];

function initRolesGrid() {
    var rg = document.getElementById('rolesGrid'); if (!rg) return;
    var html = '';
    for (var i = 0; i < ROLES_DATA.length; i++) {
        var r = ROLES_DATA[i];
        html += '<div class="role-card" id="rCard_' + r.id + '" onclick="toggleRole(\'' + r.id + '\')"><div class="role-icon">' + r.icon + '</div><div class="role-name">' + r.name + '</div></div>';
    }
    rg.innerHTML = html;
}

async function parseResumeFile(file, textAreaId) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        showToast('Processing PDF...', '⏳');
        var fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                var typedarray = new Uint8Array(this.result);
                if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
                
                // Add cMap config for better font parsing support
                var loadingTask = pdfjsLib.getDocument({
                    data: typedarray,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/standard_fonts/',
                });
                
                var pdf = await loadingTask.promise;
                var maxPages = pdf.numPages;
                var fullText = '';
                for (var j = 1; j <= maxPages; j++) {
                    var page = await pdf.getPage(j);
                    var textContent = await page.getTextContent();
                    var pageText = textContent.items.map(function(i){ return i.str; }).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                var cleanText = fullText.trim();
                var ta = document.getElementById(textAreaId);
                
                if (cleanText === '') {
                    // PDF parsed, but NO text was found (likely an image/scanned PDF)
                    showToast('Could not extract text. Is your PDF an image?', '❌');
                    if (ta) ta.value = '';
                } else {
                    if (ta) ta.value = cleanText;
                    showToast('PDF loaded successfully!', '✅');
                }
            } catch(e) {
                console.error('PDF Parse Error:', e);
                showToast('Failed to parse PDF. Try pasting text.', '❌');
            }
        };
        fileReader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var ta = document.getElementById(textAreaId);
            if (ta) ta.value = e.target.result;
            showToast('Text loaded!', '✅');
        };
        reader.readAsText(file);
    } else {
        showToast('Please upload a PDF or TXT file', '⚠️');
    }
}

function handleResumeFile(file) {
    var nameEl = document.getElementById('resumeFileName');
    if (nameEl) { nameEl.textContent = 'file: ' + file.name; nameEl.style.display = 'inline-block'; }
    parseResumeFile(file, 'resumePasteArea');
}

async function analyzeATSHome() {
    var text = document.getElementById('atsHomePaste').value;
    if (!text || text.trim().length < 50) {
        showToast('Please paste a full resume or upload a file first.', '⚠️');
        return;
    }
    if (!APP.token) {
        showToast('Please log in to use AI analysis.', '🔒');
        return;
    }
    var resultBox = document.getElementById('atsHomeResult'), resultInner = document.getElementById('atsHomeResultInner');
    if (!resultBox || !resultInner) return;
    
    resultBox.style.display = 'block';
    resultInner.innerHTML = '<div class="ai-panel-loading"><div class="ai-typing-indicator"><span></span><span></span><span></span></div><p>AI is scanning your ATS readiness...</p></div>';
    
    var prompt = "Act as an expert ATS (Applicant Tracking System). Analyze this resume text and provide:\n1. Overall ATS match score (0-100%).\n2. Missing crucial sections or weak keywords.\n3. 3-4 highly actionable formatting/content improvements.\nFormat strictly in simple clean Markdown.\n\nResumeText:\n" + text.substring(0, 4000);
    
    await callAI(prompt, 
        function(chunk, full) { resultInner.innerHTML = renderMarkdown(full); }, 
        function(full) { if (!full) resultInner.innerHTML = '<p style="color:red;">Scan failed. Try again later.</p>'; },
        false
    );
}

function generateSampleResume(filename) { return ''; }

function toggleRole(id) {
    var idx = APP.selectedRoles.indexOf(id), card = document.getElementById('rCard_' + id);
    if (idx > -1) { 
        APP.selectedRoles.splice(idx, 1); 
        if (card) card.classList.remove('selected'); 
    }
    else {
        if (APP.selectedRoles.length >= 4) { showToast('Max 4 roles allowed', '⚠️'); return; }
        APP.selectedRoles.push(id); 
        if (card) card.classList.add('selected');
    }
    var countText = document.getElementById('roleCount'); 
    if (countText) countText.textContent = APP.selectedRoles.length;
}

async function runFullATS() {
    var text = document.getElementById('atsFullPaste') ? document.getElementById('atsFullPaste').value : '';
    if (!text || text.trim().length < 50) {
        showToast('Please paste a full resume or upload a PDF first.', '⚠️');
        return;
    }
    if (!APP.token) {
        showToast('Please log in to use AI analysis.', '🔒');
        return;
    }
    
    var roleSelect = document.getElementById('atsFullRole');
    var targetRole = roleSelect ? roleSelect.value : '';
    
    var resultBox = document.getElementById('atsFullResults');
    if (!resultBox) return;
    
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div class="ai-panel-loading"><div class="ai-typing-indicator"><span></span><span></span><span></span></div><p>Performing deep ATS and keyword analysis...</p></div>';
    
    var roleContext = targetRole ? `You are specifically evaluating this candidate for a **${targetRole}** role. ` : '';
    var prompt = `Act as an expert ATS (Applicant Tracking System). ${roleContext}Analyze this resume and provide:
1. Overall ATS match score (0-100%).
2. Strongest Match Areas.
3. Missing crucial sections or weak keywords.
4. 4-5 highly actionable and specific improvements.
Format strictly in clean Markdown using headings, bold text, and lists. Do not wrap everything in code blocks.

ResumeText:
${text.substring(0, 4000)}`;

    await callAI(prompt, 
        function(chunk, full) { resultBox.innerHTML = renderMarkdown(full); }, 
        function(full, err) { 
            if (!full) {
                var errorMsg = err || 'Unknown AI Backend Error.';
                resultBox.innerHTML = '<p style="color:red; font-weight:bold;">Scan failed: ' + errorMsg + '</p>'; 
            }
        },
        false
    );
}
function initResumeTemplates() {}
function initPortfolioTemplates() {}
function initArenaRoles() {
    var container = document.getElementById('arenaRoleSelect');
    if (!container) return;

    var selected = APP.selectedRoles || [];
    var suggestedHtml = '';
    var otherHtml = '';

    var buildCard = function(r) {
        return '<div class="arena-role-card" onclick="startArenaChallenge(\'' + r.id + '\')">' +
            '<span class="arc-icon">' + r.icon + '</span>' +
            '<span class="arc-name">' + r.name + '</span>' +
            '<span class="arc-level">Level 1</span></div>';
    };

    ROLES_DATA.forEach(function(r) {
        if (selected.includes(r.id)) {
            suggestedHtml += buildCard(r);
        } else {
            otherHtml += buildCard(r);
        }
    });

    var finalHtml = '';
    
    // Header
    finalHtml += '<div class="section-header-ios center" style="margin-bottom:20px;">' +
                 '<h2>Choose Training Role</h2><p>Select to begin</p></div>';

    if (selected.length > 0 && suggestedHtml) {
        finalHtml += '<div style="max-width:800px; margin:0 auto 12px; font-weight:800; color:var(--text-primary); text-transform:uppercase; font-size:13px; letter-spacing:1px;">✨ Recommended for You</div>';
        finalHtml += '<div class="arena-role-grid" style="margin-bottom:30px;">' + suggestedHtml + '</div>';
        
        finalHtml += '<div style="max-width:800px; margin:0 auto 12px; font-weight:800; color:var(--text-secondary); text-transform:uppercase; font-size:13px; letter-spacing:1px;">Explore More Roles</div>';
        finalHtml += '<div class="arena-role-grid">' + otherHtml + '</div>';
    } else {
        finalHtml += '<div class="arena-role-grid">' + otherHtml + '</div>';
    }

    container.innerHTML = finalHtml;
}
function updateProfilePage() {}

function renderDashboard() {
    var d = APP.analysisData;
    if (!d) return;
    var emptyEl = document.getElementById('dashEmpty');
    var contentEl = document.getElementById('dashContent');
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Greeting
    var greet = document.getElementById('dashGreeting');
    if (greet) greet.textContent = 'Hi ' + (d.name || 'Student') + '! Your AI-generated readiness report is below.';

    // Overall score
    var dscScore = document.getElementById('dscScore');
    if (dscScore) dscScore.textContent = d.overall;
    var dscText = document.getElementById('dscText');
    if (dscText) {
        if (d.overall >= 80) { dscText.textContent = 'Excellent! You are placement ready.'; }
        else if (d.overall >= 60) { dscText.textContent = 'Good progress. A few areas need work.'; }
        else if (d.overall >= 40) { dscText.textContent = 'Moderate readiness. Focus on weak areas.'; }
        else { dscText.textContent = 'Needs improvement. Follow the roadmap below.'; }
    }
    var dscEmoji = document.getElementById('dscEmoji');
    if (dscEmoji) dscEmoji.textContent = d.overall >= 70 ? '🔥' : d.overall >= 40 ? '⚡' : '🎯';

    // Score grid
    var scoreGrid = document.getElementById('dashScoreGrid');
    if (scoreGrid) {
        var metrics = [
            { label: 'Resume', icon: '📄', val: d.resume },
            { label: 'Technical', icon: '💻', val: d.technical },
            { label: 'Communication', icon: '🗣️', val: d.communication },
            { label: 'Projects', icon: '🚀', val: d.projects },
            { label: 'Role Fit', icon: '🎯', val: d.roleFit },
            { label: 'Consistency', icon: '📈', val: d.consistency }
        ];
        scoreGrid.innerHTML = metrics.map(function(m) {
            var color = m.val >= 70 ? '#22c55e' : m.val >= 45 ? '#f59e0b' : '#ef4444';
            return '<div class="ios-card dash-score-item" style="padding:18px;text-align:center;">' +
                '<div style="font-size:28px;margin-bottom:6px;">' + m.icon + '</div>' +
                '<div style="font-size:28px;font-weight:900;color:' + color + ';">' + m.val + '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);font-weight:600;">' + m.label + '</div></div>';
        }).join('');
    }

    // Charts (using Chart.js)
    try {
        // Radar chart
        var radarCtx = document.getElementById('chartRadar');
        if (radarCtx && typeof Chart !== 'undefined') {
            if (radarCtx._chartInstance) radarCtx._chartInstance.destroy();
            radarCtx._chartInstance = new Chart(radarCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Resume', 'Technical', 'Communication', 'Projects', 'Role Fit', 'Consistency'],
                    datasets: [{
                        label: 'Your Scores',
                        data: [d.resume, d.technical, d.communication, d.projects, d.roleFit, d.consistency],
                        backgroundColor: 'rgba(255,107,107,0.2)',
                        borderColor: '#ff6b6b',
                        borderWidth: 2,
                        pointBackgroundColor: '#ff6b6b'
                    }]
                },
                options: { scales: { r: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }
            });
        }

        // Pie chart
        var pieCtx = document.getElementById('chartPie');
        if (pieCtx && typeof Chart !== 'undefined') {
            if (pieCtx._chartInstance) pieCtx._chartInstance.destroy();
            pieCtx._chartInstance = new Chart(pieCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Resume', 'Technical', 'Communication', 'Projects', 'Role Fit', 'Consistency'],
                    datasets: [{
                        data: [d.resume, d.technical, d.communication, d.projects, d.roleFit, d.consistency],
                        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#a29bfe']
                    }]
                },
                options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
            });
        }

        // Bar chart
        var barCtx = document.getElementById('chartBar');
        if (barCtx && typeof Chart !== 'undefined') {
            if (barCtx._chartInstance) barCtx._chartInstance.destroy();
            var roleLabels = d.roles || APP.selectedRoles || ['General'];
            var roleScores = roleLabels.map(function() { return Math.round(d.roleFit + (Math.random() * 10 - 5)); });
            barCtx._chartInstance = new Chart(barCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: roleLabels,
                    datasets: [{
                        label: 'Role Match %',
                        data: roleScores,
                        backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57'],
                        borderRadius: 8
                    }]
                },
                options: { scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }
            });
        }
    } catch(chartErr) { console.error('Chart error:', chartErr); }

    // Role cards
    var roleCards = document.getElementById('dashRoleCards');
    if (roleCards) {
        var roles = d.roles || APP.selectedRoles || [];
        var roleAnalysis = d.roleAnalysis || [];
        roleCards.innerHTML = roles.map(function(role, i) {
            var ra = roleAnalysis[i] || {};
            var fit = ra.fitPercent || 0;
            var advice = ra.advice || 'Complete your profile for personalized advice.';
            var color = fit >= 70 ? '#22c55e' : fit >= 40 ? '#f59e0b' : '#ef4444';
            return '<div class="ios-card" style="padding:20px;">' +
                '<h4 style="font-weight:800;margin-bottom:8px;">🎯 ' + role + '</h4>' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
                '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:99px;overflow:hidden;">' +
                '<div style="width:' + fit + '%;height:100%;background:linear-gradient(90deg,' + color + ',' + (fit >= 40 ? '#feca57' : '#ef4444') + ');border-radius:99px;"></div>' +
                '</div><span style="font-weight:800;font-size:14px;color:' + color + ';">' + fit + '%</span></div>' +
                '<p style="font-size:12px;color:var(--text-secondary);">' + advice + '</p></div>';
        }).join('');
    }

    // Roadmap
    var roadmap = document.getElementById('dashRoadmap');
    if (roadmap) {
        var roadmapIcons = ['📄', '🚀', '💻', '🎤', '🤝', '🎯'];
        var steps = d.roadmap || [
            { title: 'Improve Resume', desc: 'Add quantified achievements.' },
            { title: 'Build Projects', desc: 'Create portfolio-worthy projects.' },
            { title: 'Practice DSA', desc: 'Solve problems on LeetCode.' },
            { title: 'Mock Interviews', desc: 'Practice with peers or AI.' }
        ];
        roadmap.innerHTML = steps.map(function(s, i) {
            return '<div class="ios-card" style="padding:16px;display:flex;gap:14px;align-items:flex-start;">' +
                '<div style="width:36px;height:36px;border-radius:50%;background:var(--coral-50);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">' + (roadmapIcons[i] || '📌') + '</div>' +
                '<div><div style="font-weight:700;font-size:14px;">Step ' + (i+1) + ': ' + s.title + '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">' + s.desc + '</div></div></div>';
        }).join('');
    }

    // Action items
    var nextAction = document.getElementById('dashNextAction');
    if (nextAction) nextAction.textContent = d.nextAction || 'Complete your analysis for personalized recommendations.';
    var focus = document.getElementById('dashFocus');
    if (focus) focus.textContent = d.weeklyFocus || 'AI will suggest after analysis.';

    // 7-day plan
    var weekPlan = document.getElementById('dashWeekPlan');
    if (weekPlan) {
        var days = d.weekPlan || ['Mon: Review resume', 'Tue: Practice coding', 'Wed: Build project', 'Thu: Mock interview', 'Fri: Networking', 'Sat: Side project', 'Sun: Plan next week'];
        weekPlan.innerHTML = days.map(function(day) {
            var parts = day.split(':');
            return '<div style="padding:8px 0;border-bottom:1px solid var(--border-light);font-size:13px;"><span style="font-weight:700;">' + parts[0] + ':</span>' + (parts.slice(1).join(':')) + '</div>';
        }).join('');
    }
}

function updateWizProgress(step) {
    document.querySelectorAll('.wiz-dot').forEach(d => {
        if(parseInt(d.dataset.step) <= step) d.classList.add('active');
        else d.classList.remove('active');
    });
    var bar = document.getElementById('wizardFill');
    if(bar) bar.style.width = ((step - 1) * 25) + '%';
}

function wizNext(stepNum) { 
    document.querySelectorAll('.wiz-step').forEach(function(el) { el.classList.remove('active'); }); 
    var target = document.getElementById('wizStep' + (stepNum + 1)); 
    if (target) target.classList.add('active'); 
    updateWizProgress(stepNum + 1);
}
function wizPrev(stepNum) { 
    document.querySelectorAll('.wiz-step').forEach(function(el) { el.classList.remove('active'); }); 
    var target = document.getElementById('wizStep' + (stepNum - 1)); 
    if (target) target.classList.add('active'); 
    updateWizProgress(stepNum - 1);
}
function updateConfVal(slider, id) { var el = document.getElementById(id); if (el) el.textContent = slider.value; }

function parseResumeAndNext() {
    var ta = document.getElementById('resumePasteArea'), text = ta ? ta.value.trim() : '';
    if (!text) { showToast('Please paste your resume first', '⚠️'); return; }
    
    var step2 = document.getElementById('wizStep2'), step3 = document.getElementById('wizStep3');
    if (step2) step2.classList.remove('active');
    APP.parsedResume = text;
    if (step3) step3.classList.add('active');
    updateWizProgress(3);
    showToast('Resume saved! Select your dream roles.', '✅');
}

function genQuestionsNext() {
    if (APP.selectedRoles.length === 0) { showToast('Select at least 1 role', '⚠️'); return; }
    var step4 = document.getElementById('wizStep4'), step5 = document.getElementById('wizStep5');
    if (step4) step4.classList.remove('active');

    var container = document.getElementById('questionsContainer');
    if (container) {
        var roleText = APP.selectedRoles.join(', ');
        container.innerHTML = '<p style="margin-bottom: 20px; font-weight: 600;">Interview questions for: ' + roleText + '</p>' +
            '<div class="ios-card" style="margin-bottom:15px;text-align:left;">' +
            '<div style="font-weight:600;margin-bottom:10px;">Q1: Describe the most challenging project you\'ve worked on and how you overcame obstacles.</div>' +
            '<textarea class="ios-textarea" id="wizAnswer1" placeholder="Your answer (optional)..." rows="3"></textarea></div>' +
            '<div class="ios-card" style="margin-bottom:15px;text-align:left;">' +
            '<div style="font-weight:600;margin-bottom:10px;">Q2: How do you stay current with new technologies in your field?</div>' +
            '<textarea class="ios-textarea" id="wizAnswer2" placeholder="Your answer (optional)..." rows="3"></textarea></div>';
    }
    if (step5) step5.classList.add('active');
    updateWizProgress(5);
    showToast('Questions ready! Answer and submit.', '🧠');
}

function submitAnalysis() {
    if(!APP.token) {
        showToast('Please login to get AI analysis!', '🔒');
        openAuthModal();
        return; // STOP here, don't trigger fallback
    }

    // Collect all wizard data
    var name = (document.getElementById('wName') || {}).value || 'Student';
    var degree = (document.getElementById('wDegree') || {}).value || '';
    var tier = (document.getElementById('wTier') || {}).value || '';
    var cgpa = parseFloat((document.getElementById('wCGPA') || {}).value) || 0;
    var year = (document.getElementById('wYear') || {}).value || '';
    var resumeText = APP.parsedResume || '';
    var roles = APP.selectedRoles.slice();

    // Confidence sliders
    var cDSA = parseInt((document.getElementById('cDSA') || {}).value) || 0;
    var cCore = parseInt((document.getElementById('cCore') || {}).value) || 0;
    var cFW = parseInt((document.getElementById('cFW') || {}).value) || 0;
    var cComm = parseInt((document.getElementById('cComm') || {}).value) || 0;
    var cApt = parseInt((document.getElementById('cApt') || {}).value) || 0;
    var cProj = parseInt((document.getElementById('cProj') || {}).value) || 0;

    // Collect question answers
    var answer1 = (document.getElementById('wizAnswer1') || {}).value || '';
    var answer2 = (document.getElementById('wizAnswer2') || {}).value || '';

    // Show loading animation
    document.querySelectorAll('.wiz-step').forEach(function(el) { el.classList.remove('active'); });
    var stepLoading = document.getElementById('wizStepLoading');
    if (stepLoading) stepLoading.style.display = 'block';

    // Animate loading steps
    var loadSteps = ['as1','as2','as3','as4','as5'];
    loadSteps.forEach(function(id, i) {
        setTimeout(function() {
            var el = document.getElementById(id);
            if (el) { el.classList.add('active'); el.querySelector('span').textContent = '✅'; }
        }, i * 1500);
    });

    // Build AI prompt
    var prompt = 'You are an expert career counselor and placement readiness analyzer. Analyze this candidate and return ONLY valid JSON (no markdown, no explanation, no code fences).\n\n' +
        'CANDIDATE DATA:\n' +
        '- Name: ' + name + '\n' +
        '- Degree: ' + degree + '\n' +
        '- College Tier: ' + tier + '\n' +
        '- CGPA: ' + cgpa + '\n' +
        '- Year: ' + year + '\n' +
        '- Resume/Text Provided: ' + (resumeText ? '"' + resumeText.substring(0, 2000) + '"' : 'NONE') + '\n' +
        '- Selected Dream Roles: ' + roles.join(', ') + '\n' +
        '- Self-assessed DSA skill (0-5): ' + cDSA + '\n' +
        '- Self-assessed Core CS skill (0-5): ' + cCore + '\n' +
        '- Self-assessed Framework skill (0-5): ' + cFW + '\n' +
        '- Self-assessed Communication (0-5): ' + cComm + '\n' +
        '- Self-assessed Aptitude (0-5): ' + cApt + '\n' +
        '- Self-assessed Project experience (0-5): ' + cProj + '\n' +
        '- Interview Answer 1: ' + (answer1 || 'NOT PROVIDED') + '\n' +
        '- Interview Answer 2: ' + (answer2 || 'NOT PROVIDED') + '\n\n' +
        'SCORING RULES:\n' +
        '1. Score each metric INDEPENDENTLY.\n' +
        '2. Resume Score: If the resume text is gibberish, random characters, or missing, resumeScore MUST be 0. Do NOT let a fake resume reduce other scores.\n' +
        '3. Technical, Communication, and Project Scores: These MUST strictly mathematically correlate to the 0-5 sliders provided by the user (e.g. a slider of 4/5 means ~80/100). Do NOT zero these out if the slider is > 0.\n' +
        '4. Role Fit: Based on skills vs selected roles.\n' +
        '5. DO NOT GIVE PITY POINTS. If a slider or resume is truly 0, the score must be 0.\n' +
        '- Scores range 0-100.\n\n' +
        'Return this EXACT JSON structure:\n' +
        '{\n' +
        '  "resume": <number 0-100>,\n' +
        '  "technical": <number 0-100>,\n' +
        '  "communication": <number 0-100>,\n' +
        '  "projects": <number 0-100>,\n' +
        '  "roleFit": <number 0-100>,\n' +
        '  "consistency": <number 0-100>,\n' +
        '  "roleAnalysis": [{"role": "<role name>", "fitPercent": <0-100>, "advice": "<specific 1-line advice>"}],\n' +
        '  "roadmap": [{"title": "<step title>", "desc": "<specific action>"}],\n' +
        '  "nextAction": "<single most important next step>",\n' +
        '  "weeklyFocus": "<what to focus on this week>",\n' +
        '  "weekPlan": ["Mon: <task>", "Tue: <task>", "Wed: <task>", "Thu: <task>", "Fri: <task>", "Sat: <task>", "Sun: <task>"]\n' +
        '}';

    // Call AI backend with retry (up to 2 attempts)
    var attemptCount = 0;
    var maxAttempts = 2;

    function tryAIAnalysis() {
        attemptCount++;
        callAIJSON(prompt, 3000).then(function(aiData) {
            if (stepLoading) stepLoading.style.display = 'none';

            // Force strict mathematical calculation for Overall score
            var r = Math.max(0, Math.min(100, aiData.resume || 0));
            var t = Math.max(0, Math.min(100, aiData.technical || 0));
            var c = Math.max(0, Math.min(100, aiData.communication || 0));
            var p = Math.max(0, Math.min(100, aiData.projects || 0));
            var f = Math.max(0, Math.min(100, aiData.roleFit || 0));
            var s = Math.max(0, Math.min(100, aiData.consistency || 0));
            
            var calcOverall = Math.round(r * 0.15 + t * 0.25 + c * 0.15 + p * 0.2 + f * 0.15 + s * 0.1);

            APP.analysisData = {
                name: name, degree: degree, tier: tier, cgpa: cgpa, year: year,
                overall: calcOverall,
                resume: r,
                technical: t,
                communication: c,
                projects: p,
                roleFit: f,
                consistency: s,
                roles: roles,
                roleAnalysis: aiData.roleAnalysis || [],
                roadmap: aiData.roadmap || [],
                nextAction: aiData.nextAction || '',
                weeklyFocus: aiData.weeklyFocus || '',
                weekPlan: aiData.weekPlan || [],
                timestamp: new Date().toISOString()
            };
            
            saveState();
            showToast('AI Analysis complete! 🧠', '✅');
            navigateTo('dashboard');
        }).catch(function(err) {
            console.error('AI analysis attempt ' + attemptCount + ' failed:', err);
            if (attemptCount < maxAttempts) {
                showToast('Retrying AI analysis... (attempt ' + (attemptCount + 1) + ')', '🔄');
                setTimeout(tryAIAnalysis, 1000);
            } else {
                if (stepLoading) stepLoading.style.display = 'none';
                showToast('AI analysis failed after ' + maxAttempts + ' attempts. Error: ' + err.message, '❌');
                // Reshow the wizard so user can try again
                var step5 = document.getElementById('wizStep5');
                if (step5) step5.classList.add('active');
            }
        });
    }

    tryAIAnalysis();
}

function buildFallbackAnalysis(name, degree, tier, cgpa, year, roles, resumeText, cDSA, cCore, cFW, cComm, cApt, cProj) {
    // Honest scoring: if data is gibberish or empty, score is 0
    var isRealResume = resumeText && resumeText.length > 80 && /[aeiou]{2,}/i.test(resumeText) && (resumeText.match(/\s+/g) || []).length > 10;
    var resumeScore = isRealResume ? Math.min(100, Math.round(resumeText.length / 30)) : 0;
    var technicalScore = Math.round(((cDSA + cCore + cFW) / 15) * 100);
    var communicationScore = Math.round((cComm / 5) * 100);
    var projectsScore = Math.round((cProj / 5) * 100);
    var roleFitScore = Math.round(technicalScore * 0.4 + projectsScore * 0.3 + resumeScore * 0.3);
    var consistencyScore = Math.round((cApt / 5) * 50 + (isRealResume ? 20 : 0) + (cgpa >= 8 ? 15 : cgpa >= 7 ? 10 : 0));

    var overall = Math.round(
        resumeScore * 0.15 + technicalScore * 0.25 + communicationScore * 0.15 +
        projectsScore * 0.2 + roleFitScore * 0.15 + consistencyScore * 0.1
    );

    APP.analysisData = {
        name: name, degree: degree, tier: tier, cgpa: cgpa, year: year,
        overall: overall, resume: resumeScore, technical: technicalScore,
        communication: communicationScore, projects: projectsScore,
        roleFit: roleFitScore, consistency: consistencyScore,
        roles: roles,
        roleAnalysis: roles.map(function(r) { return { role: r, fitPercent: roleFitScore, advice: 'Improve your skills and upload a real resume for accurate analysis.' }; }),
        roadmap: [
            { title: 'Upload Real Resume', desc: 'Provide an actual resume for AI analysis.' },
            { title: 'Rate Your Skills Honestly', desc: 'Self-assess your abilities accurately.' },
            { title: 'Build Projects', desc: 'Create 2-3 portfolio projects.' },
            { title: 'Practice Interviews', desc: 'Do mock interviews regularly.' }
        ],
        nextAction: overall === 0 ? 'Start by uploading your real resume and rating your skills honestly.' : 'Focus on your weakest areas first.',
        weeklyFocus: technicalScore === 0 ? 'Start with basic coding practice.' : 'Continue building your skills.',
        weekPlan: ['Mon: Self-assessment review', 'Tue: Resume writing', 'Wed: Coding practice', 'Thu: Project work', 'Fri: Mock interview', 'Sat: Skill building', 'Sun: Plan ahead'],
        timestamp: new Date().toISOString()
    };
}

function exportPDF() { showToast('PDF export coming soon!', '📥'); }

// ============================
// ARENA CHALLENGE — AI-POWERED MCQ QUIZ
// ============================
async function startArenaChallenge(roleId) {
    if(!APP.token) { showToast('Please login to start a challenge!', '🔒'); openAuthModal(); return; }

    var role = ROLES_DATA.find(function(r) { return r.id === roleId; });
    if (!role) { showToast('Invalid role selected.', '⚠️'); return; }

    APP.currentArenaRole = role;
    APP.currentLevel = (APP.arenaData[roleId] && APP.arenaData[roleId].level) || 1;

    // Navigate to challenge view
    navigateTo('arena-challenge');

    var challengeContainer = document.getElementById('arenaChallengeContent');
    if (!challengeContainer) {
        // Create the arena challenge page if it doesn't exist
        var page = document.getElementById('page-arena-challenge');
        if (!page) {
            page = document.createElement('div');
            page.className = 'page active';
            page.id = 'page-arena-challenge';
            document.getElementById('page-practice').parentNode.appendChild(page);
        }
        page.innerHTML = '<div class="page-content" style="max-width:700px;margin:0 auto;padding:20px;"><div id="arenaChallengeContent"></div></div>';
        page.classList.add('active');
        challengeContainer = document.getElementById('arenaChallengeContent');
    }

    challengeContainer.innerHTML = '<div class="ios-card" style="padding:30px;text-align:center;"><div class="ai-typing-indicator" style="justify-content:center;margin-bottom:12px;"><span></span><span></span><span></span></div><h3 style="margin-bottom:8px;">🧠 Generating Challenge</h3><p style="color:var(--text-secondary);font-size:13px;">AI is preparing ' + role.name + ' questions (Level ' + APP.currentLevel + ')...</p></div>';

    var prompt = 'Generate exactly 5 multiple-choice questions for a "' + role.name + '" at difficulty level ' + APP.currentLevel + '/5. Skills to test: ' + role.skills.join(', ') + '.\n\n' +
        'Return ONLY valid JSON with this structure:\n' +
        '{"questions": [{"q": "question text", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": 0, "explanation": "brief explanation"}]}\n\n' +
        'Rules: correct is the 0-based index. Questions should be practical and specific, not trivial. Vary difficulty.';

    try {
        var data = await callAIJSON(prompt, 2000);
        if (!data || !data.questions || data.questions.length === 0) {
            challengeContainer.innerHTML = '<div class="ios-card" style="padding:30px;text-align:center;"><p style="color:red;">Failed to generate questions. <a href="#" onclick="startArenaChallenge(\'' + roleId + '\')">Try again</a></p></div>';
            return;
        }
        renderArenaQuiz(data.questions, role, roleId);
    } catch(err) {
        console.error('Arena AI error:', err);
        challengeContainer.innerHTML = '<div class="ios-card" style="padding:30px;text-align:center;"><p style="color:red;">AI Error: ' + err.message + '</p><button class="btn-ios-primary" style="margin-top:12px;" onclick="startArenaChallenge(\'' + roleId + '\')">Retry</button></div>';
    }
}

function renderArenaQuiz(questions, role, roleId) {
    var container = document.getElementById('arenaChallengeContent');
    if (!container) return;

    APP.arenaQuiz = { questions: questions, current: 0, score: 0, answers: [], roleId: roleId };
    showArenaQuestion(0);
}

function showArenaQuestion(idx) {
    var container = document.getElementById('arenaChallengeContent');
    var quiz = APP.arenaQuiz;
    if (!quiz || idx >= quiz.questions.length) { finishArenaQuiz(); return; }

    var q = quiz.questions[idx];
    var role = APP.currentArenaRole;
    var progress = Math.round(((idx) / quiz.questions.length) * 100);

    var html = '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<span style="font-weight:800;font-size:14px;">' + role.icon + ' ' + role.name + ' • Level ' + APP.currentLevel + '</span>' +
        '<span style="font-size:13px;color:var(--text-secondary);font-weight:600;">Q' + (idx + 1) + '/' + quiz.questions.length + '</span></div>' +
        '<div style="height:6px;background:var(--gray-100);border-radius:99px;overflow:hidden;"><div style="width:' + progress + '%;height:100%;background:linear-gradient(90deg,#ff6b6b,#feca57);border-radius:99px;transition:width 0.3s;"></div></div></div>';

    html += '<div class="ios-card" style="padding:24px;">';
    html += '<h3 style="font-size:16px;font-weight:700;margin-bottom:18px;line-height:1.5;">' + q.q + '</h3>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">';
    q.options.forEach(function(opt, i) {
        html += '<button class="arena-option-btn" id="arenaOpt' + i + '" onclick="selectArenaAnswer(' + idx + ',' + i + ')" ' +
            'style="text-align:left;padding:14px 18px;border-radius:12px;border:2px solid var(--border-light);background:var(--bg-primary);font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;">' +
            opt + '</button>';
    });
    html += '</div></div>';

    html += '<div id="arenaFeedback" style="display:none;margin-top:12px;"></div>';
    html += '<button id="arenaNextBtn" style="display:none;margin-top:16px;width:100%;" class="btn-ios-primary" onclick="showArenaQuestion(' + (idx + 1) + ')">' +
        (idx === quiz.questions.length - 1 ? '🏆 See Results' : 'Next Question →') + '</button>';

    container.innerHTML = html;
}

function selectArenaAnswer(qIdx, optIdx) {
    var quiz = APP.arenaQuiz;
    if (!quiz || quiz.answers[qIdx] !== undefined) return; // Already answered

    quiz.answers[qIdx] = optIdx;
    var q = quiz.questions[qIdx];
    var isCorrect = optIdx === q.correct;
    if (isCorrect) quiz.score++;

    // Highlight options
    q.options.forEach(function(_, i) {
        var btn = document.getElementById('arenaOpt' + i);
        if (!btn) return;
        btn.style.cursor = 'default';
        btn.onclick = null;
        if (i === q.correct) {
            btn.style.borderColor = '#22c55e';
            btn.style.background = 'rgba(34,197,94,0.1)';
            btn.style.color = '#16a34a';
        } else if (i === optIdx && !isCorrect) {
            btn.style.borderColor = '#ef4444';
            btn.style.background = 'rgba(239,68,68,0.1)';
            btn.style.color = '#dc2626';
        }
    });

    // Show feedback
    var feedback = document.getElementById('arenaFeedback');
    if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = '<div class="ios-card" style="padding:14px;background:' + (isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') + ';border:1px solid ' + (isCorrect ? '#22c55e' : '#ef4444') + ';">' +
            '<div style="font-weight:800;margin-bottom:4px;">' + (isCorrect ? '✅ Correct!' : '❌ Incorrect') + '</div>' +
            '<div style="font-size:13px;color:var(--text-secondary);">' + (q.explanation || '') + '</div></div>';
    }

    // Show next button
    var nextBtn = document.getElementById('arenaNextBtn');
    if (nextBtn) nextBtn.style.display = 'block';
}

function finishArenaQuiz() {
    var quiz = APP.arenaQuiz;
    if (!quiz) return;

    var total = quiz.questions.length;
    var score = quiz.score;
    var pct = Math.round((score / total) * 100);
    var xpEarned = score * 20;

    // Update arena data
    if (!APP.arenaData[quiz.roleId]) APP.arenaData[quiz.roleId] = { level: 1, bestScore: 0, totalXP: 0 };
    var rd = APP.arenaData[quiz.roleId];
    if (pct > rd.bestScore) rd.bestScore = pct;
    rd.totalXP = (rd.totalXP || 0) + xpEarned;
    if (pct >= 80 && rd.level < 5) rd.level++;

    // Update global XP
    APP.xp += xpEarned;
    updateNavStats();
    saveState();

    var container = document.getElementById('arenaChallengeContent');
    var grade = pct >= 90 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
    var gradeColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    var role = APP.currentArenaRole;

    container.innerHTML = '<div class="ios-card" style="padding:30px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:8px;">🏆</div>' +
        '<h2 style="font-size:22px;font-weight:900;margin-bottom:6px;">Challenge Complete!</h2>' +
        '<p style="color:var(--text-secondary);margin-bottom:20px;">' + role.icon + ' ' + role.name + ' • Level ' + APP.currentLevel + '</p>' +
        '<div style="display:flex;justify-content:center;gap:30px;margin-bottom:24px;">' +
        '<div><div style="font-size:36px;font-weight:900;color:' + gradeColor + ';">' + grade + '</div><div style="font-size:12px;color:var(--text-secondary);font-weight:600;">Grade</div></div>' +
        '<div><div style="font-size:36px;font-weight:900;">' + score + '/' + total + '</div><div style="font-size:12px;color:var(--text-secondary);font-weight:600;">Score</div></div>' +
        '<div><div style="font-size:36px;font-weight:900;color:#feca57;">+' + xpEarned + '</div><div style="font-size:12px;color:var(--text-secondary);font-weight:600;">XP Earned</div></div></div>' +
        (pct >= 80 ? '<p style="color:#22c55e;font-weight:700;margin-bottom:16px;">🎉 Level Up! You advanced to Level ' + rd.level + '!</p>' : '') +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
        '<button class="btn-ios-primary" onclick="startArenaChallenge(\'' + quiz.roleId + '\')">Play Again</button>' +
        '<button class="btn-ios-secondary" onclick="navigateTo(\'practice\')">Back to Arena</button></div></div>';
}

// ============================
// RESUME BUILDER LOGIC
// ============================
const RESUME_TEMPLATES = [
    { id: 'rt1', name: 'ATS Minimalist', type: 'free', icon: '📄', desc: 'Clean, highly parseable format ideal for strict ATS systems.', tags: ['Standard', 'High Success'] },
    { id: 'rt2', name: 'Tech Professional', type: 'free', icon: '💻', desc: 'Focuses heavily on technical skills and GitHub links.', tags: ['Developer', 'Engineering'] },
    { id: 'rt3', name: 'Executive Modern', type: 'premium', icon: '👑', desc: 'Sleek 2-column layout designed for human readability.', tags: ['Premium', 'Design'] },
    { id: 'rt4', name: 'Data Insights', type: 'premium', icon: '📊', desc: 'Highlights quantifiable metrics and project impacts.', tags: ['Premium', 'Analytics'] },
    { id: 'rt5', name: 'FAANG Targeted', type: 'company', icon: '🎯', desc: 'Optimized for top-tier tech company parsers.', tags: ['Google', 'Meta', 'Amazon'] },
    { id: 'rt6', name: 'Startup Hustler', type: 'company', icon: '🚀', desc: 'Dynamic layout emphasizing broad impact and speed.', tags: ['Startups', 'Agile'] }
];

function initResumeTemplates() {
    var defaultTab = document.querySelector('.rtab');
    if (defaultTab) filterResumeTemplates('free', defaultTab);
}

function filterResumeTemplates(type, btnEl) {
    if (btnEl) {
        document.querySelectorAll('.rtab').forEach(function(b) { b.classList.remove('active'); });
        btnEl.classList.add('active');
    }
    var grid = document.getElementById('resumeTemplatesGrid');
    if (!grid) return;
    
    var filtered = RESUME_TEMPLATES.filter(function(t) { return t.type === type; });
    
    grid.innerHTML = filtered.map(function(t) {
        var tagsHtml = t.tags.map(function(tag) {
            return '<span style="font-size: 11px; padding: 4px 8px; border-radius: 6px; background: var(--gray-100); color: var(--text-secondary); font-weight: 600;">' + tag + '</span>';
        }).join('');
        
        return '<div class="ios-card template-card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform=\'translateY(-4px)\'" onmouseout="this.style.transform=\'\'">' +
            '<div style="width: 48px; height: 48px; border-radius: 12px; background: var(--coral-50); display: flex; align-items: center; justify-content: center; font-size: 24px;">' + t.icon + '</div>' +
            '<h3 style="font-size: 18px; font-weight: 800;">' + t.name + '</h3>' +
            '<p style="font-size: 13px; color: var(--text-secondary); flex: 1; margin:0;">' + t.desc + '</p>' +
            '<div style="display: flex; gap: 8px; flex-wrap: wrap;">' + tagsHtml + '</div>' +
            '<button class="btn-ios-primary" style="margin-top: auto; width: 100%;" onclick="useResumeTemplate(\'' + t.id + '\')">Use Template</button>' +
        '</div>';
    }).join('');
}

function useResumeTemplate(id) {
    var t = RESUME_TEMPLATES.find(function(x) { return x.id === id; });
    if (!t) return;
    APP.currentResumeTemplate = t;
    showToast('AI preparing ' + t.name + ' template...', '✨');
    setTimeout(function() {
        showToast('Template editor unlocking soon!', '🛠️');
    }, 1500);
}
