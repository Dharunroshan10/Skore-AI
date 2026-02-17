/* ================================================== */
/* SKORE AI – MASTER APP.JS v2 (COMPLETE)             */
/* No ads, No copyrighted content                      */
/* Logo: Coral #E8655A                                 */
/* ================================================== */

// ============================
// GLOBAL STATE
// ============================
const APP = {
    currentPage: 'home',
    pageHistory: [],
    analysisData: null,
    arenaData: {},
    streak: 0,
    xp: 0,
    level: 1,
    selectedRoles: [],
    resumeRoles: [],
    resumeSkillsList: [],
    parsedResume: null,
    generatedQuestions: [],
    currentArenaRole: null,
    currentLevel: 1,
    challengeTimer: null,
    challengeTimeLeft: 60,
    selectedAnswer: null,
    currentChallenge: null,
    streakDays: [],
    scoreHistory: [],
    currentResumeTemplate: null,
    currentPortfolioTemplate: null,
};

// ============================
// INITIALIZATION
// ============================
document.addEventListener('DOMContentLoaded', function () {
    loadState();
    initLoadingScreen();
    initNavbar();
    initHeroCounters();
    initResumeDropZone();
    initATSDropZones();
    initRolesGrid();
    initArenaRoles();
    initResumeTemplates();
    initPortfolioTemplates();
    updateNavStats();
    updateStreakWidget();
    updateProfilePage();

    if (APP.analysisData) {
        renderDashboard();
    }
});

// ============================
// STATE MANAGEMENT
// ============================
function loadState() {
    try {
        var saved = localStorage.getItem('skoreAI_state');
        if (saved) {
            var parsed = JSON.parse(saved);
            APP.streak = parsed.streak || 0;
            APP.xp = parsed.xp || 0;
            APP.level = parsed.level || 1;
            APP.analysisData = parsed.analysisData || null;
            APP.arenaData = parsed.arenaData || {};
            APP.streakDays = parsed.streakDays || [];
            APP.scoreHistory = parsed.scoreHistory || [];
        }
    } catch (e) {
        console.log('Fresh state - no saved data');
    }
}

function saveState() {
    try {
        var toSave = {
            streak: APP.streak,
            xp: APP.xp,
            level: APP.level,
            analysisData: APP.analysisData,
            arenaData: APP.arenaData,
            streakDays: APP.streakDays,
            scoreHistory: APP.scoreHistory,
        };
        localStorage.setItem('skoreAI_state', JSON.stringify(toSave));
    } catch (e) {
        console.log('Could not save state');
    }
}

function clearAllData() {
    if (confirm('Clear all data? This cannot be undone.')) {
        localStorage.removeItem('skoreAI_state');
        location.reload();
    }
}

// ============================
// LOADING SCREEN
// ============================
function initLoadingScreen() {
    setTimeout(function () {
        var ls = document.getElementById('loadingScreen');
        if (ls) {
            ls.classList.add('hidden');
            setTimeout(function () {
                if (ls.parentNode) ls.parentNode.removeChild(ls);
            }, 600);
        }
    }, 2400);
}

// ============================
// NAVIGATION SYSTEM
// ============================
function navigateTo(page) {
    if (APP.currentPage !== page) {
        APP.pageHistory.push(APP.currentPage);
    }

    // Hide all pages
    var allPages = document.querySelectorAll('.page');
    for (var i = 0; i < allPages.length; i++) {
        allPages[i].classList.remove('active');
    }

    // Show target page
    var target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
    }

    APP.currentPage = page;

    // Update nav pills
    var allPills = document.querySelectorAll('.nav-pill');
    for (var j = 0; j < allPills.length; j++) {
        var pill = allPills[j];
        if (pill.dataset.page === page) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    }
    updateNavPillBg();

    // Back button visibility
    var backBtn = document.getElementById('globalBackBtn');
    if (backBtn) {
        backBtn.style.display = (page === 'home') ? 'none' : 'flex';
    }

    // Close mobile menu if open
    var mm = document.getElementById('mobileMenu');
    if (mm && mm.classList.contains('open')) {
        toggleMobileMenu();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Page-specific actions
    if (page === 'dashboard' && APP.analysisData) {
        renderDashboard();
    }
    if (page === 'profile') {
        updateProfilePage();
    }
}

function goBack() {
    if (APP.pageHistory.length > 0) {
        var prev = APP.pageHistory.pop();

        var allPages = document.querySelectorAll('.page');
        for (var i = 0; i < allPages.length; i++) {
            allPages[i].classList.remove('active');
        }

        var target = document.getElementById('page-' + prev);
        if (target) target.classList.add('active');

        APP.currentPage = prev;

        var allPills = document.querySelectorAll('.nav-pill');
        for (var j = 0; j < allPills.length; j++) {
            var pill = allPills[j];
            if (pill.dataset.page === prev) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        }
        updateNavPillBg();

        var backBtn = document.getElementById('globalBackBtn');
        if (backBtn) {
            backBtn.style.display = (prev === 'home') ? 'none' : 'flex';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (prev === 'dashboard' && APP.analysisData) renderDashboard();
        if (prev === 'profile') updateProfilePage();
    } else {
        navigateTo('home');
    }
}

function initNavbar() {
    window.addEventListener('scroll', function () {
        var nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 20) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }
    });
    setTimeout(updateNavPillBg, 150);
}

function updateNavPillBg() {
    var activePill = document.querySelector('.nav-pill.active');
    var bg = document.getElementById('navPillBg');
    var pills = document.getElementById('navPills');
    if (activePill && bg && pills) {
        var pillRect = activePill.getBoundingClientRect();
        var pillsRect = pills.getBoundingClientRect();
        bg.style.width = pillRect.width + 'px';
        bg.style.left = (pillRect.left - pillsRect.left) + 'px';
    }
}

function toggleMobileMenu() {
    var mm = document.getElementById('mobileMenu');
    var btn = document.getElementById('navHamburger');
    if (mm) mm.classList.toggle('open');
    if (btn) btn.classList.toggle('active');
}

function updateNavStats() {
    var streakEl = document.getElementById('navStreak');
    var xpEl = document.getElementById('navXP');
    if (streakEl) streakEl.textContent = APP.streak;
    if (xpEl) xpEl.textContent = APP.xp;
}

// ============================
// HERO ANIMATED COUNTERS
// ============================
function initHeroCounters() {
    var counters = document.querySelectorAll('.hms-num[data-count]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                animateCounter(entries[i].target);
                observer.unobserve(entries[i].target);
            }
        }
    }, { threshold: 0.5 });

    for (var i = 0; i < counters.length; i++) {
        observer.observe(counters[i]);
    }
}

function animateCounter(el) {
    var target = parseInt(el.dataset.count);
    var duration = 2000;
    var startTime = Date.now();

    function update() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ============================
// AI SUGGESTION PANEL
// ============================
function toggleAISuggestion() {
    var panel = document.getElementById('aiSuggestionPanel');
    if (!panel) return;
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        loadAISuggestions();
    }
}

function loadAISuggestions() {
    var body = document.getElementById('aiPanelBody');
    if (!body) return;

    body.innerHTML = '<div class="ai-panel-loading"><div class="ai-typing-indicator"><span></span><span></span><span></span></div><p>AI is thinking...</p></div>';

    setTimeout(function () {
        var suggestions = [];

        if (APP.analysisData) {
            var score = APP.analysisData.overall;
            if (score < 50) {
                suggestions = [
                    { title: '🎯 Focus on Fundamentals', desc: 'Your score suggests gaps in core skills. Start with DSA basics and build consistency.' },
                    { title: '📄 Improve Resume', desc: 'Add more projects with measurable impact. Use action verbs and quantify achievements.' },
                    { title: '🔥 Build Streak', desc: 'Practice daily in the Arena. Even 15 minutes/day compounds over time.' },
                ];
            } else if (score < 75) {
                suggestions = [
                    { title: '🚀 Level Up Projects', desc: 'Add 1-2 production-level projects. Deploy them and add links to resume.' },
                    { title: '🎙️ Mock Interviews', desc: 'Your technical skills are growing. Now practice explaining your approach.' },
                    { title: '📊 Target Companies', desc: 'Start applying to companies matching your current skill level.' },
                ];
            } else {
                suggestions = [
                    { title: '🏆 You\'re Ready!', desc: 'Your profile is strong. Focus on system design and advanced topics.' },
                    { title: '💡 Contribute Open Source', desc: 'Stand out with meaningful open source contributions.' },
                    { title: '🎯 Aim Higher', desc: 'Consider advanced preparation with system design and architectural patterns.' },
                ];
            }
        } else {
            suggestions = [
                { title: '📊 Get Your Score', desc: 'Complete the Placement Readiness analysis to get personalized AI suggestions.' },
                { title: '🎮 Start Practicing', desc: 'Head to Practice Arena and start earning XP with daily challenges.' },
                { title: '📄 Build Your Resume', desc: 'Use AI Resume Builder to create ATS-optimized resumes.' },
            ];
        }

        var html = '';
        for (var i = 0; i < suggestions.length; i++) {
            html += '<div class="ai-suggestion-item"><strong>' + suggestions[i].title + '</strong><p>' + suggestions[i].desc + '</p></div>';
        }
        body.innerHTML = html;
    }, 1500);
}

// ============================
// TOAST NOTIFICATION SYSTEM
// ============================
function showToast(message, icon) {
    if (!icon) icon = '✅';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3200);
}

function showToolToast(name) {
    showToast(name + ' coming soon!', '🚧');
}

// ============================
// RESUME FILE HANDLING
// ============================
function initResumeDropZone() {
    var dropZone = document.getElementById('resumeDropZone');
    var fileInput = document.getElementById('resumeFileInput');

    if (dropZone) {
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        dropZone.addEventListener('dragleave', function () {
            dropZone.classList.remove('dragover');
        });
        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleResumeFile(e.dataTransfer.files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            if (e.target.files.length) handleResumeFile(e.target.files[0]);
        });
    }
}

function handleResumeFile(file) {
    var nameEl = document.getElementById('resumeFileName');
    if (nameEl) {
        nameEl.textContent = '📎 ' + file.name;
        nameEl.style.display = 'inline-block';
    }

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var textarea = document.getElementById('resumePasteArea');
            if (textarea) textarea.value = e.target.result;
        };
        reader.readAsText(file);
    } else {
        var textarea = document.getElementById('resumePasteArea');
        if (textarea) textarea.value = generateSampleResume(file.name);
    }
    showToast('Resume uploaded!', '📄');
}

function generateSampleResume(filename) {
    return 'RESUME - Extracted from ' + filename + '\n\n' +
        'SKILLS: JavaScript, Python, React, Node.js, SQL, Git, Docker, AWS, TypeScript, MongoDB\n\n' +
        'EXPERIENCE:\n' +
        '- Software Intern at TechStartup (Jun 2024 - Aug 2024)\n' +
        '  - Built REST APIs serving 10K+ requests/day\n' +
        '  - Implemented CI/CD pipeline reducing deploy time by 40%\n\n' +
        'PROJECTS:\n' +
        '- E-Commerce Platform | React, Node.js, MongoDB\n' +
        '  - Full-stack app with payment integration, 500+ users\n' +
        '- ML Sentiment Analyzer | Python, TensorFlow\n' +
        '  - NLP model with 89% accuracy on movie reviews\n' +
        '- Portfolio Website | Next.js, Tailwind\n' +
        '  - Personal site with blog, 99 Lighthouse score\n\n' +
        'EDUCATION: B.Tech Computer Science, CGPA: 8.2\n\n' +
        'CERTIFICATIONS:\n' +
        '- Cloud Practitioner Certification\n' +
        '- Data Analytics Professional Certificate';
}

function initATSDropZones() {
    var atsHomeFile = document.getElementById('atsHomeFile');
    if (atsHomeFile) {
        atsHomeFile.addEventListener('change', function (e) {
            if (e.target.files.length) {
                var textarea = document.getElementById('atsHomePaste');
                if (textarea) textarea.value = generateSampleResume(e.target.files[0].name);
                showToast('Resume loaded for ATS check', '📄');
            }
        });
    }

    var atsFullFile = document.getElementById('atsFullFile');
    if (atsFullFile) {
        atsFullFile.addEventListener('change', function (e) {
            if (e.target.files.length) {
                var textarea = document.getElementById('atsFullPaste');
                if (textarea) textarea.value = generateSampleResume(e.target.files[0].name);
                showToast('Resume loaded', '📄');
            }
        });
    }
}

// ============================
// RESUME TEXT PARSING
// ============================
function parseResumeAndNext() {
    var textarea = document.getElementById('resumePasteArea');
    var text = textarea ? textarea.value.trim() : '';
    if (!text) {
        showToast('Please upload or paste your resume', '⚠️');
        return;
    }

    showToast('AI parsing resume...', '🧠');

    setTimeout(function () {
        var parsed = parseResumeText(text);
        APP.parsedResume = parsed;
        displayParsedData(parsed);
        wizNext(2);
    }, 1200);
}

function parseResumeText(text) {
    var lower = text.toLowerCase();

    // Skills database
    var allSkills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'Go', 'Rust', 'Swift', 'Kotlin',
        'React', 'Angular', 'Vue', 'Next.js', 'Svelte', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
        'Git', 'Linux', 'CI/CD', 'Jenkins', 'GitHub Actions',
        'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'SASS',
        'REST API', 'GraphQL', 'WebSocket', 'gRPC',
        'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
        'Prompt Engineering', 'LLM', 'OpenAI',
        'Agile', 'Scrum', 'JIRA',
        'Data Structures', 'Algorithms', 'System Design',
        'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
        'Blockchain', 'Solidity', 'Web3',
        'React Native', 'Flutter', 'Dart'
    ];

    var foundSkills = [];
    for (var i = 0; i < allSkills.length; i++) {
        if (lower.indexOf(allSkills[i].toLowerCase()) !== -1) {
            foundSkills.push(allSkills[i]);
        }
    }

    // Tools
    var allTools = ['VS Code', 'IntelliJ', 'Postman', 'Figma', 'Docker', 'Git', 'JIRA', 'Slack', 'Notion', 'Vercel', 'Netlify', 'Heroku', 'Tableau', 'Power BI'];
    var foundTools = [];
    for (var t = 0; t < allTools.length; t++) {
        if (lower.indexOf(allTools[t].toLowerCase()) !== -1) {
            foundTools.push(allTools[t]);
        }
    }

    // Projects
    var projects = [];
    if (lower.indexOf('e-commerce') !== -1 || lower.indexOf('ecommerce') !== -1) projects.push('E-Commerce Platform');
    if (lower.indexOf('portfolio') !== -1) projects.push('Portfolio Website');
    if (lower.indexOf('ml') !== -1 || lower.indexOf('machine learning') !== -1) projects.push('ML Project');
    if (lower.indexOf('chat') !== -1 || lower.indexOf('messaging') !== -1) projects.push('Chat Application');
    if (lower.indexOf('api') !== -1 && projects.length < 4) projects.push('API Development');
    if (lower.indexOf('dashboard') !== -1 && projects.length < 4) projects.push('Dashboard Application');

    // Experience
    var experience = [];
    if (lower.indexOf('intern') !== -1) experience.push('Has internship experience');
    if (lower.indexOf('developer') !== -1 || lower.indexOf('engineer') !== -1) experience.push('Has development experience');
    if (lower.indexOf('experience') !== -1 && experience.length === 0) experience.push('Has work experience');

    // Certifications
    var certs = [];
    if (lower.indexOf('certified') !== -1 || lower.indexOf('certification') !== -1) certs.push('Has certifications');
    if (lower.indexOf('certificate') !== -1 && certs.length === 0) certs.push('Has certificates');
    if (lower.indexOf('coursera') !== -1) certs.push('Coursera certification');
    if (lower.indexOf('udemy') !== -1) certs.push('Online course completion');

    return {
        skills: foundSkills,
        tools: foundTools,
        projects: projects,
        experience: experience,
        certifications: certs.slice(0, 4)
    };
}

function displayParsedData(parsed) {
    var preview = document.getElementById('parsedPreview');
    if (preview) preview.style.display = 'block';

    var skillsEl = document.getElementById('parsedSkills');
    if (skillsEl) {
        var skillsHTML = '';
        for (var i = 0; i < parsed.skills.length; i++) {
            skillsHTML += '<span class="parsed-tag">' + parsed.skills[i] + '</span>';
        }
        skillsEl.innerHTML = skillsHTML;
    }

    var projEl = document.getElementById('parsedProjects');
    if (projEl) {
        if (parsed.projects.length > 0) {
            var projHTML = '';
            for (var p = 0; p < parsed.projects.length; p++) {
                projHTML += '<div class="parsed-item">• ' + parsed.projects[p] + '</div>';
            }
            projEl.innerHTML = projHTML;
        } else {
            projEl.innerHTML = '<div class="parsed-item">No projects detected</div>';
        }
    }

    var expEl = document.getElementById('parsedExperience');
    if (expEl) {
        if (parsed.experience.length > 0) {
            var expHTML = '';
            for (var e = 0; e < parsed.experience.length; e++) {
                expHTML += '<div class="parsed-item">• ' + parsed.experience[e] + '</div>';
            }
            expEl.innerHTML = expHTML;
        } else {
            expEl.innerHTML = '<div class="parsed-item">No experience detected</div>';
        }
    }

    var certsEl = document.getElementById('parsedCerts');
    if (certsEl) {
        if (parsed.certifications.length > 0) {
            var certHTML = '';
            for (var c = 0; c < parsed.certifications.length; c++) {
                certHTML += '<div class="parsed-item">• ' + parsed.certifications[c] + '</div>';
            }
            certsEl.innerHTML = certHTML;
        } else {
            certsEl.innerHTML = '<div class="parsed-item">None detected</div>';
        }
    }

    var toolsEl = document.getElementById('parsedTools');
    if (toolsEl) {
        var toolsHTML = '';
        for (var tt = 0; tt < parsed.tools.length; tt++) {
            toolsHTML += '<span class="parsed-tag">' + parsed.tools[tt] + '</span>';
        }
        toolsEl.innerHTML = toolsHTML;
    }
}

// ============================
// WIZARD STEP NAVIGATION
// ============================
function wizNext(current) {
    // Validation
    if (current === 1) {
        var nameEl = document.getElementById('wName');
        if (!nameEl || !nameEl.value.trim()) {
            showToast('Please enter your name', '⚠️');
            return;
        }
    }
    if (current === 3) {
        if (APP.selectedRoles.length === 0) {
            showToast('Select at least one role', '⚠️');
            return;
        }
    }

    var nextStep = current + 1;
    var currentEl = document.getElementById('wizStep' + current);
    var nextEl = document.getElementById('wizStep' + nextStep);
    if (currentEl) currentEl.classList.remove('active');
    if (nextEl) nextEl.classList.add('active');

    // Update progress bar
    var fill = document.getElementById('wizardFill');
    if (fill) fill.style.width = (nextStep * 20) + '%';

    // Update dots
    var allDots = document.querySelectorAll('.wiz-dot');
    for (var i = 0; i < allDots.length; i++) {
        var step = parseInt(allDots[i].dataset.step);
        if (step === nextStep) {
            allDots[i].classList.add('active');
            allDots[i].classList.remove('completed');
        } else if (step < nextStep) {
            allDots[i].classList.remove('active');
            allDots[i].classList.add('completed');
        } else {
            allDots[i].classList.remove('active');
            allDots[i].classList.remove('completed');
        }
    }
}

function wizPrev(current) {
    var prevStep = current - 1;
    var currentEl = document.getElementById('wizStep' + current);
    var prevEl = document.getElementById('wizStep' + prevStep);
    if (currentEl) currentEl.classList.remove('active');
    if (prevEl) prevEl.classList.add('active');

    var fill = document.getElementById('wizardFill');
    if (fill) fill.style.width = (prevStep * 20) + '%';

    var allDots = document.querySelectorAll('.wiz-dot');
    for (var i = 0; i < allDots.length; i++) {
        var step = parseInt(allDots[i].dataset.step);
        if (step === prevStep) {
            allDots[i].classList.add('active');
            allDots[i].classList.remove('completed');
        } else if (step < prevStep) {
            allDots[i].classList.remove('active');
            allDots[i].classList.add('completed');
        } else {
            allDots[i].classList.remove('active');
            allDots[i].classList.remove('completed');
        }
    }
}

function updateConfVal(slider, targetId) {
    var el = document.getElementById(targetId);
    if (el) el.textContent = slider.value;
}

// ============================
// ROLES DATA
// ============================
var ROLES_DATA = [
    { id: 'frontend', name: 'Frontend Developer', icon: '🎨', desc: 'React, Vue, UI/UX', skills: ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Vue', 'Angular', 'Tailwind'] },
    { id: 'backend', name: 'Backend Developer', icon: '⚙️', desc: 'APIs, Databases, Server', skills: ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'REST API', 'Express', 'Django'] },
    { id: 'fullstack', name: 'Full Stack Developer', icon: '💻', desc: 'End-to-end dev', skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'Git', 'Docker', 'TypeScript'] },
    { id: 'ai-ml', name: 'AI/ML Engineer', icon: '🤖', desc: 'ML, Deep Learning, NLP', skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NLP', 'Deep Learning', 'Machine Learning'] },
    { id: 'data-sci', name: 'Data Scientist', icon: '📊', desc: 'Analytics, ML, Stats', skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Scikit-learn', 'Tableau', 'NumPy'] },
    { id: 'devops', name: 'DevOps Engineer', icon: '🔧', desc: 'CI/CD, Cloud, Infra', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Terraform', 'Jenkins', 'Git'] },
    { id: 'mobile', name: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, Cross-platform', skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Dart', 'Firebase', 'TypeScript'] },
    { id: 'cyber', name: 'Cybersecurity Analyst', icon: '🔒', desc: 'Security, Pen Testing', skills: ['Linux', 'Python', 'Networking', 'Cryptography', 'Pen Testing', 'OWASP', 'Firewall'] },
    { id: 'product', name: 'Product Manager', icon: '📋', desc: 'Strategy, Roadmaps', skills: ['Analytics', 'JIRA', 'Agile', 'SQL', 'Communication', 'Stakeholder Management'] },
    { id: 'ui-ux', name: 'UI/UX Designer', icon: '🎯', desc: 'Design, Prototyping', skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Wireframing', 'User Research', 'Prototyping'] },
    { id: 'cloud', name: 'Cloud Engineer', icon: '☁️', desc: 'AWS, Azure, GCP', skills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Networking'] },
    { id: 'blockchain', name: 'Blockchain Developer', icon: '⛓️', desc: 'Web3, Smart Contracts', skills: ['Solidity', 'Web3', 'JavaScript', 'Blockchain', 'Smart Contracts', 'Rust'] },
    { id: 'data-analyst', name: 'Data Analyst', icon: '📈', desc: 'SQL, Visualization', skills: ['SQL', 'Python', 'Tableau', 'Power BI', 'Excel', 'Pandas', 'Statistics'] },
    { id: 'game-dev', name: 'Game Developer', icon: '🎮', desc: 'Unity, Unreal, Graphics', skills: ['C++', 'C#', 'Unity', 'Unreal Engine', '3D Math', 'OpenGL', 'Game Design'] },
    { id: 'qa', name: 'QA Engineer', icon: '🧪', desc: 'Testing, Automation', skills: ['Selenium', 'Python', 'Java', 'Test Automation', 'JIRA', 'CI/CD'] },
    { id: 'solutions', name: 'Solutions Architect', icon: '🏗️', desc: 'Design, Architecture', skills: ['System Design', 'AWS', 'Microservices', 'Docker', 'Kubernetes', 'SQL', 'Communication'] }
];

function initRolesGrid() {
    var grid = document.getElementById('rolesGrid');
    if (!grid) return;

    var html = '';
    for (var i = 0; i < ROLES_DATA.length; i++) {
        var role = ROLES_DATA[i];
        html += '<div class="role-card" id="role-' + role.id + '" onclick="toggleRole(\'' + role.id + '\')">' +
            '<span class="role-card-icon">' + role.icon + '</span>' +
            '<div class="role-card-info"><h4>' + role.name + '</h4><p>' + role.desc + '</p></div>' +
            '<div class="role-check">✓</div></div>';
    }
    grid.innerHTML = html;
}

function toggleRole(roleId) {
    var idx = APP.selectedRoles.indexOf(roleId);
    if (idx > -1) {
        APP.selectedRoles.splice(idx, 1);
    } else {
        if (APP.selectedRoles.length >= 4) {
            showToast('Maximum 4 roles allowed', '⚠️');
            return;
        }
        APP.selectedRoles.push(roleId);
    }

    // Update UI
    for (var i = 0; i < ROLES_DATA.length; i++) {
        var role = ROLES_DATA[i];
        var card = document.getElementById('role-' + role.id);
        if (card) {
            var isSelected = APP.selectedRoles.indexOf(role.id) !== -1;
            var isDisabled = !isSelected && APP.selectedRoles.length >= 4;
            if (isSelected) { card.classList.add('selected'); } else { card.classList.remove('selected'); }
            if (isDisabled) { card.classList.add('disabled'); } else { card.classList.remove('disabled'); }
        }
    }

    var countEl = document.getElementById('roleCount');
    if (countEl) countEl.textContent = APP.selectedRoles.length;
    checkRoleMismatch();
}

function checkRoleMismatch() {
    var mismatchEl = document.getElementById('roleMismatch');
    var msgEl = document.getElementById('mismatchMsg');
    if (!mismatchEl || !msgEl) return;

    if (APP.selectedRoles.length >= 2) {
        var categories = [];
        for (var i = 0; i < APP.selectedRoles.length; i++) {
            var id = APP.selectedRoles[i];
            if (['frontend', 'backend', 'fullstack', 'mobile'].indexOf(id) !== -1) categories.push('dev');
            else if (['ai-ml', 'data-sci', 'data-analyst'].indexOf(id) !== -1) categories.push('data');
            else if (['product', 'ui-ux'].indexOf(id) !== -1) categories.push('non-tech');
            else categories.push('other');
        }
        var unique = [];
        for (var j = 0; j < categories.length; j++) {
            if (unique.indexOf(categories[j]) === -1) unique.push(categories[j]);
        }
        if (unique.length > 2) {
            mismatchEl.style.display = 'flex';
            msgEl.textContent = 'Your selected roles span very different domains. Consider focusing for better preparation.';
            return;
        }
    }
    mismatchEl.style.display = 'none';
}

// ============================
// QUESTIONS GENERATION
// ============================
function genQuestionsNext() {
    wizNext(4);
    setTimeout(function () {
        generateQuestions();
    }, 1500);
}

function generateQuestions() {
    var container = document.getElementById('questionsContainer');
    var loading = document.getElementById('qLoading');
    if (!container) return;

    var questions = [];

    var techQs = {
        'frontend': ['What is the Virtual DOM and how does React use it?', 'Explain CSS specificity and the cascade.'],
        'backend': ['Explain RESTful API design principles.', 'What is database indexing and when would you use it?'],
        'fullstack': ['How would you design a scalable web application?', 'Explain the difference between SQL and NoSQL databases.'],
        'ai-ml': ['Explain gradient descent and its variants.', 'What is overfitting and how do you prevent it?'],
        'data-sci': ['Explain the bias-variance tradeoff.', 'When would you use classification vs regression?'],
        'devops': ['Explain CI/CD pipeline stages.', 'What is container orchestration?'],
        'mobile': ['Explain the component lifecycle in mobile frameworks.', 'How do you handle offline data sync?'],
        'cyber': ['Explain SQL injection and prevention methods.', 'What are the top web security vulnerabilities?'],
        'product': ['How would you prioritize features for a new product?', 'Explain A/B testing methodology.'],
        'ui-ux': ['Explain the UX design process.', 'What are usability heuristics?'],
        'cloud': ['Explain IaaS vs PaaS vs SaaS.', 'What is auto-scaling?'],
        'blockchain': ['Explain consensus mechanisms.', 'What are smart contracts?'],
        'data-analyst': ['Explain correlation vs causation.', 'How would you clean a messy dataset?'],
        'game-dev': ['Explain game loop architecture.', 'What is the ECS pattern?'],
        'qa': ['Explain the testing pyramid.', 'Difference between unit and integration tests?'],
        'solutions': ['How would you design a microservices architecture?', 'Explain the CAP theorem.']
    };

    for (var r = 0; r < APP.selectedRoles.length; r++) {
        var roleId = APP.selectedRoles[r];
        var rqs = techQs[roleId] || ['Describe your technical approach to problem-solving.'];
        for (var q = 0; q < rqs.length; q++) {
            questions.push({ type: 'Technical', q: rqs[q], badge: 'q-badge-tech' });
        }
    }

    questions.push({ type: 'Behavioral', q: 'Describe a challenging project and how you overcame obstacles.', badge: 'q-badge-behave' });
    questions.push({ type: 'Behavioral', q: 'Tell me about a time you worked effectively in a team.', badge: 'q-badge-behave' });
    questions.push({ type: 'Case Study', q: 'If given 2 weeks, how would you build an MVP for a task management app?', badge: 'q-badge-case' });

    if (loading) loading.style.display = 'none';

    var html = '';
    for (var i = 0; i < questions.length; i++) {
        html += '<div class="question-card">' +
            '<span class="q-badge ' + questions[i].badge + '">' + questions[i].type + '</span>' +
            '<div class="q-text">' + questions[i].q + '</div>' +
            '<textarea class="q-answer" id="qa_' + i + '" placeholder="Your answer (optional)..."></textarea>' +
            '<div class="q-optional">Optional — improves AI analysis accuracy</div></div>';
    }
    container.innerHTML += html;
    APP.generatedQuestions = questions;
}

// ============================
// ANALYSIS SUBMISSION
// ============================
function submitAnalysis() {
    var step5 = document.getElementById('wizStep5');
    var stepLoading = document.getElementById('wizStepLoading');
    if (step5) step5.classList.remove('active');
    if (stepLoading) stepLoading.style.display = 'block';

    // Animate loading steps
    var steps = ['as1', 'as2', 'as3', 'as4', 'as5'];
    for (var i = 0; i < steps.length; i++) {
        (function (index) {
            setTimeout(function () {
                var el = document.getElementById(steps[index]);
                if (el) {
                    el.classList.remove('active');
                    el.classList.add('completed');
                    var span = el.querySelector('span');
                    if (span) span.textContent = '✓';
                }
                if (steps[index + 1]) {
                    var next = document.getElementById(steps[index + 1]);
                    if (next) {
                        next.classList.add('active');
                        var nextSpan = next.querySelector('span');
                        if (nextSpan) nextSpan.textContent = '⏳';
                    }
                }
            }, (index + 1) * 800);
        })(i);
    }

    setTimeout(function () {
        computeAnalysis();
        if (stepLoading) stepLoading.style.display = 'none';
        navigateTo('dashboard');
        showToast('Analysis complete! 🎉', '🧠');
    }, 4500);
}

function computeAnalysis() {
    var name = getVal('wName') || 'Student';
    var degree = getVal('wDegree') || 'B.Tech';
    var tier = getVal('wTier') || 'Tier 2';
    var cgpa = parseFloat(getVal('wCGPA')) || 7.5;
    var year = getVal('wYear') || '2025';

    var cDSA = getNum('cDSA');
    var cCore = getNum('cCore');
    var cFW = getNum('cFW');
    var cComm = getNum('cComm');
    var cApt = getNum('cApt');
    var cProj = getNum('cProj');

    var parsed = APP.parsedResume || { skills: [], projects: [], experience: [], certifications: [], tools: [] };

    // 1. Resume Quality (0-100)
    var resumeScore = 20;
    resumeScore += Math.min(parsed.skills.length * 3, 25);
    resumeScore += Math.min(parsed.projects.length * 8, 20);
    resumeScore += Math.min(parsed.experience.length * 10, 20);
    resumeScore += Math.min(parsed.certifications.length * 5, 10);
    resumeScore += Math.min(parsed.tools.length * 2, 5);
    resumeScore = Math.min(resumeScore, 95);

    // 2. Technical Skills (0-100)
    var techScore = 0;
    techScore += (cDSA / 5) * 30;
    techScore += (cCore / 5) * 25;
    techScore += (cFW / 5) * 20;
    techScore += Math.min(parsed.skills.length * 1.5, 25);
    techScore = Math.min(Math.round(techScore), 100);

    // 3. Communication - DIRECTLY from user input (0 input = 0 score)
    var commScore = Math.round((cComm / 5) * 100);

    // 4. Projects (0-100)
    var projScore = 0;
    projScore += (cProj / 5) * 40;
    projScore += Math.min(parsed.projects.length * 12, 40);
    projScore += Math.min(parsed.tools.length * 3, 20);
    projScore = Math.min(Math.round(projScore), 100);

    // 5. Aptitude (0-100)
    var aptScore = Math.round((cApt / 5) * 85 + (cgpa / 10) * 15);

    // 6. Consistency (0-100)
    var consistScore = Math.min(20 + APP.streak * 5 + Math.floor(APP.xp / 50), 100);

    // 7. Role Fit (0-100)
    var roleFitScore = 0;
    var roleDetails = [];

    for (var r = 0; r < APP.selectedRoles.length; r++) {
        var roleId = APP.selectedRoles[r];
        var role = null;
        for (var rd = 0; rd < ROLES_DATA.length; rd++) {
            if (ROLES_DATA[rd].id === roleId) { role = ROLES_DATA[rd]; break; }
        }
        if (role) {
            var matching = [];
            var missing = [];
            for (var s = 0; s < role.skills.length; s++) {
                var found = false;
                for (var ps = 0; ps < parsed.skills.length; ps++) {
                    if (parsed.skills[ps].toLowerCase() === role.skills[s].toLowerCase()) {
                        found = true;
                        break;
                    }
                }
                if (found) matching.push(role.skills[s]);
                else missing.push(role.skills[s]);
            }
            var fit = Math.round((matching.length / role.skills.length) * 100);
            roleFitScore += fit;
            roleDetails.push({
                id: role.id,
                name: role.name,
                icon: role.icon,
                fit: Math.min(fit + Math.round((cDSA + cCore + cFW) / 15 * 20), 100),
                matching: matching,
                missing: missing,
                ats: Math.round(60 + Math.random() * 30)
            });
        }
    }

    roleFitScore = APP.selectedRoles.length > 0 ? Math.round(roleFitScore / APP.selectedRoles.length) : 50;
    roleFitScore = Math.min(roleFitScore + Math.round((cDSA + cCore) / 10 * 15), 100);

    // Overall weighted score
    var overall = Math.round(
        resumeScore * 0.15 +
        techScore * 0.2 +
        commScore * 0.1 +
        projScore * 0.15 +
        aptScore * 0.1 +
        consistScore * 0.1 +
        roleFitScore * 0.2
    );

    // Tier bonus
    var tierBonus = 0;
    if (tier === 'Tier 1') tierBonus = 5;
    else if (tier === 'Tier 2') tierBonus = 2;
    var finalOverall = Math.min(overall + tierBonus, 100);

    // Save analysis
    APP.analysisData = {
        name: name,
        degree: degree,
        tier: tier,
        cgpa: cgpa,
        year: year,
        overall: finalOverall,
        scores: {
            resume: resumeScore,
            technical: techScore,
            communication: commScore,
            projects: projScore,
            aptitude: aptScore,
            consistency: consistScore,
            roleFit: roleFitScore
        },
        roles: roleDetails,
        parsedResume: parsed,
        confidence: { dsa: cDSA, core: cCore, fw: cFW, comm: cComm, apt: cApt, proj: cProj },
        timestamp: Date.now()
    };

    APP.xp += 100;
    APP.scoreHistory.push({ date: new Date().toLocaleDateString(), score: finalOverall });
    updateNavStats();
    saveState();
}

// Helper functions
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function getNum(id) {
    var el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
}

// ============================
// DASHBOARD RENDERING
// ============================
function renderDashboard() {
    var data = APP.analysisData;
    if (!data) return;

    var emptyEl = document.getElementById('dashEmpty');
    var contentEl = document.getElementById('dashContent');
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Greeting
    var greetEl = document.getElementById('dashGreeting');
    if (greetEl) greetEl.textContent = 'Welcome back, ' + data.name + '! Here\'s your AI analysis.';

    // Status card
    var emoji = data.overall >= 80 ? '🏆' : data.overall >= 60 ? '🔥' : data.overall >= 40 ? '📈' : '💪';
    var statusText = data.overall >= 80 ? 'Placement Ready!' : data.overall >= 60 ? 'Good Progress!' : data.overall >= 40 ? 'Building Up!' : 'Keep Going!';
    setTextById('dscEmoji', emoji);
    setTextById('dscText', statusText);
    setTextById('dscScore', data.overall);

    // Score grid
    var scoreItems = [
        { icon: '📄', label: 'Resume', value: data.scores.resume, bar: 'bar-coral' },
        { icon: '💻', label: 'Technical', value: data.scores.technical, bar: 'bar-black' },
        { icon: '🗣️', label: 'Communication', value: data.scores.communication, bar: 'bar-blue' },
        { icon: '🛠️', label: 'Projects', value: data.scores.projects, bar: 'bar-coral' },
        { icon: '🧠', label: 'Aptitude', value: data.scores.aptitude, bar: 'bar-green' },
        { icon: '📅', label: 'Consistency', value: data.scores.consistency, bar: 'bar-black' },
        { icon: '🎯', label: 'Role Fit', value: data.scores.roleFit, bar: 'bar-coral' }
    ];

    var scoreGrid = document.getElementById('dashScoreGrid');
    if (scoreGrid) {
        var sgHTML = '';
        for (var i = 0; i < scoreItems.length; i++) {
            var si = scoreItems[i];
            sgHTML += '<div class="ios-card dash-score-item">' +
                '<div class="dsi-icon">' + si.icon + '</div>' +
                '<span class="dsi-label">' + si.label + '</span>' +
                '<span class="dsi-value">' + si.value + '</span>' +
                '<div class="dsi-bar"><div class="dsi-bar-fill ' + si.bar + '" style="width:' + si.value + '%"></div></div></div>';
        }
        scoreGrid.innerHTML = sgHTML;
    }

    // Charts
    renderCharts(data);

    // Role cards
    var roleCards = document.getElementById('dashRoleCards');
    if (roleCards) {
        var rcHTML = '';
        for (var r = 0; r < data.roles.length; r++) {
            var role = data.roles[r];
            rcHTML += '<div class="ios-card dash-role-card">' +
                '<div class="drc-head"><span class="drc-icon">' + role.icon + '</span><span class="drc-name">' + role.name + '</span><span class="drc-match">' + role.fit + '%</span></div>' +
                '<div class="drc-row"><span class="drc-row-label">Skill Match</span><span class="drc-row-value">' + role.matching.length + '/' + (role.matching.length + role.missing.length) + '</span></div>' +
                '<div class="drc-row"><span class="drc-row-label">ATS Score</span><span class="drc-row-value">' + role.ats + '%</span></div>' +
                '<div class="drc-row"><span class="drc-row-label">Readiness</span><span class="drc-row-value">' + (role.fit >= 70 ? '✅ Ready' : role.fit >= 40 ? '📈 Growing' : '💪 Building') + '</span></div>';
            if (role.missing.length > 0) {
                rcHTML += '<div class="drc-missing"><div class="drc-missing-title">⚠️ Missing Skills</div><div class="drc-missing-tags">';
                for (var m = 0; m < role.missing.length; m++) {
                    rcHTML += '<span class="drc-missing-tag">' + role.missing[m] + '</span>';
                }
                rcHTML += '</div></div>';
            }
            rcHTML += '</div>';
        }
        roleCards.innerHTML = rcHTML;
    }

    // Roadmap
    renderRoadmap(data);

    // Actions
    renderDashActions(data);

    // Arena section
    renderDashArena();
}

function setTextById(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderCharts(data) {
    // Radar Chart
    var radarCtx = document.getElementById('chartRadar');
    if (radarCtx) {
        if (radarCtx._chart) radarCtx._chart.destroy();
        radarCtx._chart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Resume', 'Technical', 'Communication', 'Projects', 'Aptitude', 'Consistency', 'Role Fit'],
                datasets: [{
                    label: 'Your Score',
                    data: [data.scores.resume, data.scores.technical, data.scores.communication, data.scores.projects, data.scores.aptitude, data.scores.consistency, data.scores.roleFit],
                    backgroundColor: 'rgba(232, 101, 90, 0.12)',
                    borderColor: '#E8655A',
                    borderWidth: 2,
                    pointBackgroundColor: '#E8655A',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        beginAtZero: true, max: 100,
                        ticks: { stepSize: 20, font: { size: 10 } },
                        grid: { color: '#F3F3F3' },
                        pointLabels: { font: { size: 11, weight: '600' } }
                    }
                }
            }
        });
    }

    // Pie Chart
    var pieCtx = document.getElementById('chartPie');
    if (pieCtx) {
        if (pieCtx._chart) pieCtx._chart.destroy();
        var skills = (data.parsedResume && data.parsedResume.skills) ? data.parsedResume.skills : [];
        var categories = {
            'Languages': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'C#', 'Swift', 'Kotlin', 'Dart'],
            'Frameworks': ['React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Flutter', 'React Native'],
            'Databases': ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase'],
            'DevOps': ['AWS', 'Docker', 'Kubernetes', 'Azure', 'GCP', 'CI/CD', 'Terraform', 'Linux'],
            'AI/ML': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'NLP'],
            'Design': ['Figma', 'Adobe XD', 'Photoshop', 'Tailwind', 'CSS', 'HTML', 'Bootstrap']
        };
        var labels = [];
        var values = [];
        var catNames = Object.keys(categories);
        for (var c = 0; c < catNames.length; c++) {
            var count = 0;
            var techs = categories[catNames[c]];
            for (var s = 0; s < skills.length; s++) {
                for (var t = 0; t < techs.length; t++) {
                    if (skills[s].toLowerCase() === techs[t].toLowerCase()) { count++; break; }
                }
            }
            if (count > 0) { labels.push(catNames[c]); values.push(count); }
        }
        var colors = ['#E8655A', '#171717', '#34C759', '#007AFF', '#FF9F0A', '#FF3B30'];
        pieCtx._chart = new Chart(pieCtx, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, usePointStyle: true } } }, cutout: '60%' }
        });
    }

    // Bar Chart
    var barCtx = document.getElementById('chartBar');
    if (barCtx) {
        if (barCtx._chart) barCtx._chart.destroy();
        var roleNames = [];
        var roleFits = [];
        var roleGaps = [];
        for (var b = 0; b < data.roles.length; b++) {
            roleNames.push(data.roles[b].name);
            roleFits.push(data.roles[b].fit);
            roleGaps.push(100 - data.roles[b].fit);
        }
        barCtx._chart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: roleNames,
                datasets: [
                    { label: 'Fit', data: roleFits, backgroundColor: '#E8655A', borderRadius: 6 },
                    { label: 'Gap', data: roleGaps, backgroundColor: '#E5E5E5', borderRadius: 6 }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { stacked: true, max: 100, grid: { color: '#F5F5F5' }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }
}

function renderRoadmap(data) {
    var el = document.getElementById('dashRoadmap');
    if (!el) return;

    var levels = [
        { title: '🌱 Foundation', desc: 'Strengthen basics', tasks: ['DSA fundamentals', 'Learn 1 language', 'Setup GitHub'], duration: 'Week 1-2', status: data.overall >= 30 ? 'completed' : 'current' },
        { title: '📚 Core Skills', desc: 'Build depth', tasks: ['50+ DSA problems', 'Core CS concepts', 'Start project'], duration: 'Week 3-4', status: data.overall >= 45 ? 'completed' : data.overall >= 30 ? 'current' : 'locked' },
        { title: '🛠️ Projects', desc: 'Build portfolio', tasks: ['2 full-stack projects', 'Deploy to production', 'Documentation'], duration: 'Week 5-6', status: data.overall >= 60 ? 'completed' : data.overall >= 45 ? 'current' : 'locked' },
        { title: '📄 Resume', desc: 'Professional presence', tasks: ['ATS resume', 'LinkedIn optimization', 'Portfolio site'], duration: 'Week 7-8', status: data.overall >= 70 ? 'completed' : data.overall >= 60 ? 'current' : 'locked' },
        { title: '🎙️ Interview Prep', desc: 'Communication', tasks: ['Behavioral questions', 'Mock interviews', 'System design'], duration: 'Week 9-10', status: data.overall >= 80 ? 'completed' : data.overall >= 70 ? 'current' : 'locked' },
        { title: '🏆 Placement Ready', desc: 'Apply with confidence', tasks: ['Apply to targets', 'Follow up', 'Negotiate'], duration: 'Week 11-12', status: data.overall >= 90 ? 'completed' : data.overall >= 80 ? 'current' : 'locked' }
    ];

    var html = '';
    for (var i = 0; i < levels.length; i++) {
        var lvl = levels[i];
        var tasksHTML = '';
        for (var t = 0; t < lvl.tasks.length; t++) {
            tasksHTML += '<span class="rm-task">' + lvl.tasks[t] + '</span>';
        }
        html += '<div class="ios-card roadmap-card ' + lvl.status + '">' +
            '<div class="rm-badge">' + (lvl.status === 'completed' ? '✓' : lvl.title.split(' ')[0]) + '</div>' +
            '<div class="rm-content"><div class="rm-title">' + lvl.title + '</div><div class="rm-desc">' + lvl.desc + '</div>' +
            '<div class="rm-tasks">' + tasksHTML + '</div></div>' +
            '<div class="rm-duration">' + lvl.duration + '</div></div>';
    }
    el.innerHTML = html;
}

function renderDashActions(data) {
    // Find lowest score
    var scores = data.scores;
    var lowestKey = 'resume';
    var lowestVal = 100;
    var keys = Object.keys(scores);
    for (var i = 0; i < keys.length; i++) {
        if (scores[keys[i]] < lowestVal) {
            lowestVal = scores[keys[i]];
            lowestKey = keys[i];
        }
    }

    var nextAction = document.getElementById('dashNextAction');
    if (nextAction) nextAction.textContent = 'Focus on improving your ' + lowestKey + ' score (currently ' + lowestVal + '). Practice daily for best results.';

    var focus = document.getElementById('dashFocus');
    if (focus) {
        if (scores.technical < 60) focus.textContent = 'DSA: Solve 3 easy problems daily.';
        else if (scores.projects < 60) focus.textContent = 'Build a new project and deploy it.';
        else focus.textContent = 'Practice mock interviews and system design.';
    }

    // Week Plan
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var tasks = ['DSA: 3 Easy problems', 'Project: Setup + plan', 'DSA: 2 Medium problems', 'Project: Core features', 'Mock interview prep', 'Deploy + resume update', 'Review + Rest'];
    var weekPlan = document.getElementById('dashWeekPlan');
    if (weekPlan) {
        var wpHTML = '';
        for (var d = 0; d < days.length; d++) {
            wpHTML += '<div class="week-item"><span class="week-day">' + days[d] + '</span><span class="week-task">' + tasks[d] + '</span></div>';
        }
        weekPlan.innerHTML = wpHTML;
    }
}

function renderDashArena() {
    var arenaKeys = Object.keys(APP.arenaData);
    if (arenaKeys.length > 0) {
        var section = document.getElementById('dashArenaSection');
        var grid = document.getElementById('dashArenaGrid');
        if (section) section.style.display = 'block';
        if (grid) {
            var html = '';
            for (var i = 0; i < arenaKeys.length; i++) {
                var roleId = arenaKeys[i];
                var d = APP.arenaData[roleId];
                var roleName = roleId;
                var roleIcon = '🎮';
                // Find role info
                for (var r = 0; r < ARENA_ROLES.length; r++) {
                    if (ARENA_ROLES[r].id === roleId) {
                        roleName = ARENA_ROLES[r].name;
                        roleIcon = ARENA_ROLES[r].icon;
                        break;
                    }
                }
                var xpPercent = Math.min(((d.xp || 0) % 200) / 200 * 100, 100);
                html += '<div class="ios-card dash-arena-item">' +
                    '<div class="dai-head"><span class="dai-icon">' + roleIcon + '</span><span class="dai-name">' + roleName + '</span><span class="dai-level">Lvl ' + (d.level || 1) + '</span></div>' +
                    '<div class="dai-bar"><div class="dai-bar-fill" style="width:' + xpPercent + '%"></div></div>' +
                    '<span class="dai-xp">' + (d.xp || 0) + ' XP</span></div>';
            }
            grid.innerHTML = html;
        }
    }
}

// ============================
// ATS ANALYSIS
// ============================
function analyzeATSHome() {
    var textarea = document.getElementById('atsHomePaste');
    var text = textarea ? textarea.value.trim() : '';
    if (!text) {
        showToast('Please upload or paste resume text', '⚠️');
        return;
    }

    showToast('Running ATS analysis...', '🧠');

    setTimeout(function () {
        var parsed = parseResumeText(text);
        var score = calculateATSScore(parsed, text);
        var resultEl = document.getElementById('atsHomeResult');
        var innerEl = document.getElementById('atsHomeResultInner');
        if (resultEl) resultEl.style.display = 'block';
        if (innerEl) innerEl.innerHTML = renderATSResult(score, parsed, '');
    }, 1500);
}

function runFullATS() {
    var textarea = document.getElementById('atsFullPaste');
    var roleEl = document.getElementById('atsFullRole');
    var text = textarea ? textarea.value.trim() : '';
    var role = roleEl ? roleEl.value : '';

    if (!text) {
        showToast('Please upload or paste resume', '⚠️');
        return;
    }

    showToast('Running full ATS analysis...', '🧠');

    setTimeout(function () {
        var parsed = parseResumeText(text);
        var score = calculateATSScore(parsed, text, role);
        var resultEl = document.getElementById('atsFullResults');
        if (resultEl) {
            resultEl.style.display = 'block';
            resultEl.innerHTML = renderATSResult(score, parsed, role);
        }
    }, 1800);
}

function calculateATSScore(parsed, text, role) {
    var score = 25;
    var lower = text.toLowerCase();

    if (text.length > 200) score += 5;
    if (text.length > 500) score += 5;
    if (parsed.skills.length >= 5) score += 10;
    if (parsed.skills.length >= 10) score += 5;
    if (parsed.projects.length >= 2) score += 10;
    if (parsed.experience.length >= 1) score += 10;
    if (parsed.certifications.length >= 1) score += 5;
    if (lower.indexOf('education') !== -1) score += 3;
    if (lower.indexOf('experience') !== -1 || lower.indexOf('work') !== -1) score += 3;
    if (lower.indexOf('skill') !== -1) score += 3;
    if (lower.indexOf('project') !== -1) score += 3;
    if (lower.indexOf('@') !== -1) score += 2;
    if (lower.indexOf('linkedin') !== -1) score += 2;
    if (lower.indexOf('github') !== -1) score += 2;

    var actionVerbs = ['built', 'developed', 'implemented', 'designed', 'managed', 'led', 'created', 'optimized', 'improved', 'increased', 'reduced', 'deployed'];
    var verbCount = 0;
    for (var v = 0; v < actionVerbs.length; v++) {
        if (lower.indexOf(actionVerbs[v]) !== -1) verbCount++;
    }
    score += Math.min(verbCount * 2, 10);

    var numbers = text.match(/\d+%|\d+\+|\d+k|\d+x/gi);
    if (numbers && numbers.length >= 2) score += 5;

    return Math.min(score, 95);
}

function renderATSResult(score, parsed, role) {
    var statusEmoji, statusLabel, statusColor;
    if (score >= 80) { statusEmoji = '🟢'; statusLabel = 'Excellent'; statusColor = 'var(--success)'; }
    else if (score >= 60) { statusEmoji = '🟡'; statusLabel = 'Good'; statusColor = 'var(--warning)'; }
    else if (score >= 40) { statusEmoji = '🟠'; statusLabel = 'Needs Work'; statusColor = 'var(--primary)'; }
    else { statusEmoji = '🔴'; statusLabel = 'Poor'; statusColor = 'var(--danger)'; }

    var skillsPreview = parsed.skills.slice(0, 6).join(', ');
    if (parsed.skills.length > 6) skillsPreview += '...';

    var html = '<div style="text-align:center;margin-bottom:20px;">' +
        '<div style="font-size:48px;font-weight:900;color:' + statusColor + ';letter-spacing:-2px;">' + score + '%</div>' +
        '<div style="font-size:14px;font-weight:700;">' + statusEmoji + ' ' + statusLabel + ' ATS Score</div>';
    if (role) html += '<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">for ' + role + '</div>';
    html += '</div>';

    html += '<div style="display:grid;gap:8px;">' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;font-size:12px;"><strong>💻 Skills:</strong> ' + parsed.skills.length + ' (' + skillsPreview + ')</div>' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;font-size:12px;"><strong>🛠️ Projects:</strong> ' + parsed.projects.length + ' detected</div>' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;font-size:12px;"><strong>💼 Experience:</strong> ' + (parsed.experience.length > 0 ? 'Found' : 'Not detected') + '</div>' +
        '<div style="padding:10px;background:var(--gray-50);border-radius:8px;font-size:12px;"><strong>📜 Certifications:</strong> ' + parsed.certifications.length + '</div></div>';

    html += '<div style="margin-top:16px;"><h4 style="font-size:13px;font-weight:800;margin-bottom:8px;">💡 Recommendations</h4>' +
        '<ul style="font-size:12px;color:var(--text-secondary);line-height:1.8;">';
    if (score < 80) html += '<li>Add more quantified achievements (numbers, percentages)</li>';
    if (parsed.skills.length < 8) html += '<li>Add more relevant technical skills</li>';
    if (parsed.projects.length < 2) html += '<li>Add at least 2-3 projects</li>';
    if (parsed.experience.length === 0) html += '<li>Add internship or work experience</li>';
    html += '<li>Use strong action verbs: Built, Developed, Implemented, Optimized</li>';
    html += '<li>Keep format clean — avoid complex layouts</li></ul></div>';

    return html;
}

// ============================
// RESUME BUILDER
// ============================
var RESUME_TEMPLATES = [
    { id: 'clean', name: 'Clean Minimal', desc: 'Simple and ATS-friendly', tier: 'free', icon: '📄', color: '#F5F5F5' },
    { id: 'modern', name: 'Modern Pro', desc: 'Contemporary layout', tier: 'free', icon: '✨', color: '#EFF6FF' },
    { id: 'bold', name: 'Bold Impact', desc: 'Stand-out design', tier: 'free', icon: '💫', color: '#FEF2F0' },
    { id: 'sidebar', name: 'Sidebar Classic', desc: 'Two-column professional', tier: 'premium', icon: '📋', color: '#F0FDF4' },
    { id: 'creative', name: 'Creative Dev', desc: 'For creative roles', tier: 'premium', icon: '🎨', color: '#FDF4FF' },
    { id: 'executive', name: 'Executive Elite', desc: 'Senior-level format', tier: 'premium', icon: '👔', color: '#FFFBEB' },
    { id: 'tech-a', name: 'Tech Corp A', desc: 'Tech company format', tier: 'company', icon: '🔍', color: '#EFF6FF' },
    { id: 'tech-b', name: 'Tech Corp B', desc: 'Leadership format', tier: 'company', icon: '📦', color: '#FEF2F0' },
    { id: 'tech-c', name: 'Tech Corp C', desc: 'Engineering layout', tier: 'company', icon: '🪟', color: '#F0FDF4' },
    { id: 'tech-d', name: 'Tech Corp D', desc: 'Product-focused', tier: 'company', icon: '🏢', color: '#EFF6FF' },
    { id: 'design-co', name: 'Design Company', desc: 'Design-inspired', tier: 'company', icon: '🎯', color: '#F5F5F5' },
    { id: 'startup', name: 'Startup Ready', desc: 'Fast-paced startups', tier: 'company', icon: '🚀', color: '#FFFBEB' }
];

function initResumeTemplates() {
    filterResumeTemplates('free', document.querySelector('#resumeTabs .rtab.active'));
}

function filterResumeTemplates(tier, btn) {
    var tabs = document.querySelectorAll('#resumeTabs .rtab');
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.remove('active');
    if (btn) btn.classList.add('active');

    var grid = document.getElementById('resumeTemplatesGrid');
    if (!grid) return;

    var templates = [];
    for (var i = 0; i < RESUME_TEMPLATES.length; i++) {
        if (RESUME_TEMPLATES[i].tier === tier) templates.push(RESUME_TEMPLATES[i]);
    }

    var html = '';
    for (var j = 0; j < templates.length; j++) {
        var tpl = templates[j];
        var isPremium = (tpl.tier === 'premium' || tpl.tier === 'company');
        var badgeClass = tpl.tier === 'free' ? 'tpl-badge-free' : 'tpl-badge-premium';
        var badgeText = tpl.tier === 'free' ? 'Free' : 'Premium';

        html += '<div class="template-card ' + (isPremium ? 'premium-card' : '') + '" onclick="' +
            (isPremium ? "showToast('Premium template — Upgrade to unlock!', '👑')" : "selectResumeTemplate('" + tpl.id + "')") + '">';

        if (isPremium) {
            html += '<div class="tpl-premium-lock"><span class="tpl-lock-icon">🔒</span><span class="tpl-lock-text">Premium</span></div>';
        }

        html += '<span class="tpl-badge ' + badgeClass + '">' + badgeText + '</span>' +
            '<div class="tpl-preview" style="background:' + tpl.color + ';">' + tpl.icon + '</div>' +
            '<div class="tpl-name">' + tpl.name + '</div>' +
            '<div class="tpl-desc">' + tpl.desc + '</div></div>';
    }
    grid.innerHTML = html;
}

function selectResumeTemplate(id) {
    APP.currentResumeTemplate = id;
    var editor = document.getElementById('resumeEditorSection');
    var grid = document.getElementById('resumeTemplatesGrid');
    var tabs = document.getElementById('resumeTabs');
    if (editor) editor.style.display = 'block';
    if (grid) grid.style.display = 'none';
    if (tabs) tabs.style.display = 'none';

    // Pre-fill from analysis
    if (APP.analysisData) {
        var nameEl = document.getElementById('rbName');
        var skillsEl = document.getElementById('rbSkills');
        if (nameEl && APP.analysisData.name) nameEl.value = APP.analysisData.name;
        if (skillsEl && APP.analysisData.parsedResume && APP.analysisData.parsedResume.skills) {
            skillsEl.value = APP.analysisData.parsedResume.skills.join(', ');
        }
    }

    var tplName = id;
    for (var i = 0; i < RESUME_TEMPLATES.length; i++) {
        if (RESUME_TEMPLATES[i].id === id) { tplName = RESUME_TEMPLATES[i].name; break; }
    }
    showToast('Template "' + tplName + '" selected!', '✨');

    var editorEl = document.getElementById('resumeEditorSection');
    if (editorEl) window.scrollTo({ top: editorEl.offsetTop - 80, behavior: 'smooth' });
}

// Resume Roles Management
function addResumeRole(selectEl) {
    var value = selectEl.value;
    if (!value) return;
    if (APP.resumeRoles.length >= 5) { showToast('Maximum 5 roles allowed', '⚠️'); selectEl.value = ''; return; }
    if (APP.resumeRoles.indexOf(value) !== -1) { showToast('Role already added', '⚠️'); selectEl.value = ''; return; }
    APP.resumeRoles.push(value);
    selectEl.value = '';
    renderResumeRoles();
}

function addCustomResumeRole() {
    var input = document.getElementById('rbCustomRole');
    var value = input ? input.value.trim() : '';
    if (!value) return;
    if (APP.resumeRoles.length >= 5) { showToast('Maximum 5 roles allowed', '⚠️'); return; }
    if (APP.resumeRoles.indexOf(value) !== -1) { showToast('Role already added', '⚠️'); input.value = ''; return; }
    APP.resumeRoles.push(value);
    input.value = '';
    renderResumeRoles();
}

function removeResumeRole(role) {
    var newRoles = [];
    for (var i = 0; i < APP.resumeRoles.length; i++) {
        if (APP.resumeRoles[i] !== role) newRoles.push(APP.resumeRoles[i]);
    }
    APP.resumeRoles = newRoles;
    renderResumeRoles();
}

function renderResumeRoles() {
    var container = document.getElementById('rbRolesSelected');
    if (!container) return;
    var html = '';
    for (var i = 0; i < APP.resumeRoles.length; i++) {
        var role = APP.resumeRoles[i];
        var safeRole = role.replace(/'/g, "\\'");
        html += '<span class="rb-role-chip">' + role + '<span class="chip-remove" onclick="removeResumeRole(\'' + safeRole + '\')">✕</span></span>';
    }
    container.innerHTML = html;
}

// AI Skill Suggestions
var ROLE_SKILL_MAP = {
    'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS', 'Vue.js', 'Angular', 'Next.js', 'Webpack', 'Git', 'REST API', 'Figma', 'Redux'],
    'Backend Developer': ['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Express.js', 'Django', 'REST API', 'GraphQL', 'Docker', 'Redis', 'Git', 'Linux'],
    'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'MongoDB', 'Express.js', 'Next.js', 'Git', 'Docker', 'REST API', 'AWS', 'HTML', 'CSS'],
    'AI/ML Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Deep Learning', 'NLP', 'Computer Vision', 'Keras', 'MLOps', 'Docker', 'SQL'],
    'Data Scientist': ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Tableau', 'Statistics', 'Machine Learning', 'R', 'Power BI', 'Jupyter'],
    'Data Analyst': ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'Statistics', 'Data Visualization', 'R', 'Looker'],
    'Product Manager': ['Product Strategy', 'Agile', 'JIRA', 'SQL', 'Analytics', 'A/B Testing', 'Wireframing', 'Stakeholder Management', 'Roadmapping', 'Figma'],
    'UI/UX Designer': ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Design Systems'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Jenkins', 'Terraform', 'Linux', 'Ansible', 'Git', 'Prometheus', 'Grafana', 'Python', 'Bash'],
    'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Networking', 'IAM', 'Lambda', 'CI/CD', 'Python'],
    'Cybersecurity Analyst': ['Network Security', 'Linux', 'Python', 'Penetration Testing', 'OWASP', 'Firewalls', 'SIEM', 'Wireshark', 'Cryptography'],
    'Business Analyst': ['SQL', 'Excel', 'Power BI', 'Tableau', 'Requirements Gathering', 'JIRA', 'Stakeholder Management', 'Agile'],
    'Mobile Developer': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Dart', 'Firebase', 'REST API', 'Git', 'TypeScript'],
    'Game Developer': ['Unity', 'C#', 'C++', 'Unreal Engine', 'Game Design', '3D Modeling', 'OpenGL', 'Blender'],
    'Blockchain Developer': ['Solidity', 'Web3.js', 'JavaScript', 'Smart Contracts', 'Hardhat', 'Truffle', 'DeFi', 'IPFS'],
    'QA Engineer': ['Selenium', 'Python', 'Java', 'Test Automation', 'JIRA', 'Postman', 'CI/CD', 'Jest', 'Cypress'],
    'Technical Writer': ['Markdown', 'Git', 'API Documentation', 'Confluence', 'Technical Communication'],
    'Solutions Architect': ['System Design', 'AWS', 'Azure', 'Microservices', 'Docker', 'Kubernetes', 'SQL', 'API Design'],
    'Embedded Systems Engineer': ['C', 'C++', 'RTOS', 'Microcontrollers', 'ARM', 'UART', 'SPI', 'Embedded Linux']
};

function suggestSkillsForRoles() {
    if (APP.resumeRoles.length === 0) {
        showToast('Add roles first to get AI skill suggestions', '⚠️');
        return;
    }

    var container = document.getElementById('rbSkillSuggestions');
    if (!container) return;
    container.style.display = 'flex';
    container.innerHTML = '<div class="ai-typing-indicator" style="width:100%;justify-content:center;padding:8px;"><span></span><span></span><span></span></div>';

    setTimeout(function () {
        // Collect all suggested skills
        var allSuggested = [];
        for (var r = 0; r < APP.resumeRoles.length; r++) {
            var skills = ROLE_SKILL_MAP[APP.resumeRoles[r]] || [];
            for (var s = 0; s < skills.length; s++) {
                if (allSuggested.indexOf(skills[s]) === -1) allSuggested.push(skills[s]);
            }
        }

        // Get current skills
        var textarea = document.getElementById('rbSkills');
        var currentText = textarea ? textarea.value : '';
        var currentSkills = currentText.split(',');
        var currentLower = [];
        for (var c = 0; c < currentSkills.length; c++) {
            var trimmed = currentSkills[c].trim().toLowerCase();
            if (trimmed) currentLower.push(trimmed);
        }

        // Filter already added
        var suggestions = [];
        for (var a = 0; a < allSuggested.length; a++) {
            if (currentLower.indexOf(allSuggested[a].toLowerCase()) === -1) {
                suggestions.push(allSuggested[a]);
            }
        }

        if (suggestions.length === 0) {
            container.innerHTML = '<span style="font-size:12px;color:var(--text-secondary);padding:4px;">All suggested skills already added! 🎉</span>';
            return;
        }

        var html = '<div style="width:100%;font-size:11px;color:var(--coral-700);font-weight:700;margin-bottom:4px;">🧠 AI Suggestions based on your roles (click to add):</div>';
        for (var sg = 0; sg < suggestions.length; sg++) {
            var safeSkill = suggestions[sg].replace(/'/g, "\\'");
            html += '<span class="rb-skill-chip" onclick="addSuggestedSkill(this, \'' + safeSkill + '\')">' + suggestions[sg] + ' +</span>';
        }
        container.innerHTML = html;
    }, 800);
}

function addSuggestedSkill(chip, skill) {
    var textarea = document.getElementById('rbSkills');
    if (!textarea) return;
    var current = textarea.value.trim();
    textarea.value = current ? current + ', ' + skill : skill;
    chip.classList.add('added');
    chip.textContent = skill + ' ✓';
    chip.onclick = null;
    showToast('Added: ' + skill, '✅');
}

function addCustomSkill() {
    var input = document.getElementById('rbCustomSkill');
    var skill = input ? input.value.trim() : '';
    if (!skill) return;
    var textarea = document.getElementById('rbSkills');
    if (textarea) {
        var current = textarea.value.trim();
        textarea.value = current ? current + ', ' + skill : skill;
    }
    input.value = '';
    showToast('Added: ' + skill, '✅');
}

// AI Summary Generator
function aiGenerateSummary() {
    var roles = APP.resumeRoles;
    var skillsEl = document.getElementById('rbSkills');
    var nameEl = document.getElementById('rbName');
    var skills = skillsEl ? skillsEl.value.trim() : '';
    var name = nameEl ? nameEl.value.trim() : '';

    if (roles.length === 0 && !skills) {
        showToast('Add roles and skills first for better AI summary', '⚠️');
        return;
    }

    var summaryEl = document.getElementById('rbSummary');
    if (!summaryEl) return;
    summaryEl.value = 'AI generating summary...';
    summaryEl.style.opacity = '0.6';

    setTimeout(function () {
        var roleStr = roles.length > 0 ? roles.join(' and ') : 'software development';

        var skillArr = skills ? skills.split(',') : [];
        var cleanSkills = [];
        for (var i = 0; i < skillArr.length && cleanSkills.length < 6; i++) {
            var trimmed = skillArr[i].trim();
            if (trimmed) cleanSkills.push(trimmed);
        }
        var skillStr = cleanSkills.length > 0 ? cleanSkills.join(', ') : 'modern technologies';

        var summaries = [
            'Results-driven ' + roleStr + ' with strong expertise in ' + skillStr + '. Passionate about building scalable solutions and delivering high-quality code. Proven ability to learn quickly, collaborate effectively in cross-functional teams, and drive projects from concept to deployment. Seeking to leverage technical skills and creative problem-solving in a challenging role.',
            'Dedicated and detail-oriented professional specializing in ' + roleStr + '. Proficient in ' + skillStr + ' with a track record of developing impactful projects. Strong analytical mindset combined with excellent communication skills. Eager to contribute to innovative teams and grow as a ' + (roles[0] || 'technology professional') + '.',
            'Innovative ' + roleStr + ' with hands-on experience in ' + skillStr + '. Committed to writing clean, maintainable code and building user-centric solutions. Strong foundation in computer science fundamentals with a passion for continuous learning. Ready to make immediate impact in a fast-paced environment.'
        ];

        summaryEl.value = summaries[Math.floor(Math.random() * summaries.length)];
        summaryEl.style.opacity = '1';
        showToast('AI summary generated!', '🧠');
    }, 1200);
}

// Resume Preview & Download
function updateResumePreview() {
    var frame = document.getElementById('resumePreviewFrame');
    if (!frame) return;

    var name = getVal('rbName') || 'Your Name';
    var email = getVal('rbEmail');
    var phone = getVal('rbPhone');
    var linkedin = getVal('rbLinkedIn');
    var github = getVal('rbGitHub');
    var summary = getVal('rbSummary');
    var skills = getVal('rbSkills');
    var experience = getVal('rbExperience');
    var projects = getVal('rbProjects');
    var education = getVal('rbEducation');
    var certs = getVal('rbCerts');
    var roles = APP.resumeRoles;

    var contactParts = [];
    if (email) contactParts.push(email);
    if (phone) contactParts.push(phone);
    if (linkedin) contactParts.push(linkedin);
    if (github) contactParts.push(github);

    var html = '<div style="font-family:Inter,-apple-system,sans-serif;max-width:100%;color:#171717;">';

    // Header
    html += '<div style="text-align:center;margin-bottom:16px;border-bottom:2px solid #E8655A;padding-bottom:14px;">';
    html += '<h1 style="font-size:22px;font-weight:900;margin-bottom:4px;letter-spacing:-0.5px;">' + name + '</h1>';
    if (roles.length > 0) {
        html += '<div style="font-size:12px;color:#E8655A;font-weight:700;margin-bottom:6px;">' + roles.join(' | ') + '</div>';
    }
    html += '<div style="font-size:11px;color:#737373;">' + contactParts.join(' • ') + '</div></div>';

    // Sections
    if (summary) {
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Summary</h3><p style="font-size:11px;line-height:1.7;color:#525252;">' + summary + '</p></div>';
    }
    if (skills) {
        var skillList = skills.split(',');
        var skillChips = '';
        for (var s = 0; s < skillList.length; s++) {
            var trimmedSkill = skillList[s].trim();
            if (trimmedSkill) skillChips += '<span style="padding:2px 10px;background:#F5F5F5;border-radius:99px;font-size:10px;font-weight:600;">' + trimmedSkill + '</span>';
        }
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Skills</h3><div style="display:flex;flex-wrap:wrap;gap:4px;">' + skillChips + '</div></div>';
    }
    if (experience) {
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Experience</h3><div style="font-size:11px;line-height:1.8;color:#525252;white-space:pre-line;">' + experience + '</div></div>';
    }
    if (projects) {
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Projects</h3><div style="font-size:11px;line-height:1.8;color:#525252;white-space:pre-line;">' + projects + '</div></div>';
    }
    if (education) {
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Education</h3><div style="font-size:11px;line-height:1.8;color:#525252;white-space:pre-line;">' + education + '</div></div>';
    }
    if (certs) {
        html += '<div style="margin-bottom:14px;"><h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#E8655A;margin-bottom:6px;">Certifications</h3><div style="font-size:11px;line-height:1.8;color:#525252;white-space:pre-line;">' + certs + '</div></div>';
    }

    html += '</div>';
    frame.innerHTML = html;
    showToast('Resume preview updated!', '👁️');
}

function downloadResumePDF() {
    showToast('Preparing PDF...', '📥');
    setTimeout(function () {
        var frame = document.getElementById('resumePreviewFrame');
        if (!frame) return;
        var win = window.open('', '_blank');
        win.document.write('<!DOCTYPE html><html><head><title>Resume</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>body{font-family:"Inter",sans-serif;padding:40px;max-width:800px;margin:0 auto;}@media print{body{padding:20px;}}</style></head><body>' + frame.innerHTML + '</body></html>');
        win.document.close();
        setTimeout(function () { win.print(); }, 500);
    }, 500);
}

function downloadResumeHTML() {
    var frame = document.getElementById('resumePreviewFrame');
    if (!frame) return;
    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Resume</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"><style>body{font-family:"Inter",sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#171717;}</style></head><body>' + frame.innerHTML + '</body></html>';
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'resume.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('HTML resume downloaded!', '🌐');
}

// ============================
// PORTFOLIO BUILDER
// ============================
var PORTFOLIO_TEMPLATES = [
    { id: 'dev-minimal', name: 'Dev Minimal', desc: 'Clean developer portfolio', tier: 'free', icon: '💻', color: '#F5F5F5' },
    { id: 'creative-grad', name: 'Creative Gradient', desc: 'Colorful & modern', tier: 'free', icon: '🌈', color: '#FDF4FF' },
    { id: 'dark-dev', name: 'Dark Developer', desc: 'Dark theme portfolio', tier: 'free', icon: '🌙', color: '#171717' },
    { id: 'glass-morph', name: 'Glassmorphism', desc: 'Frosted glass effect', tier: 'premium', icon: '🧊', color: '#EFF6FF' },
    { id: 'neo-brutal', name: 'Neo-Brutalism', desc: 'Bold & trendy', tier: 'premium', icon: '🎯', color: '#FFFBEB' },
    { id: 'corp-dev', name: 'Corporate Dev', desc: 'Professional layout', tier: 'company', icon: '🏢', color: '#EFF6FF' },
    { id: 'oss-style', name: 'Open Source Style', desc: 'Developer-inspired', tier: 'company', icon: '🐙', color: '#F5F5F5' }
];

function initPortfolioTemplates() {
    filterPortfolioTemplates('free', document.querySelector('#portfolioTabs .rtab.active'));
}

function filterPortfolioTemplates(tier, btn) {
    var tabs = document.querySelectorAll('#portfolioTabs .rtab');
    for (var t = 0; t < tabs.length; t++) tabs[t].classList.remove('active');
    if (btn) btn.classList.add('active');

    var grid = document.getElementById('portfolioTemplatesGrid');
    if (!grid) return;

    var templates = [];
    for (var i = 0; i < PORTFOLIO_TEMPLATES.length; i++) {
        if (PORTFOLIO_TEMPLATES[i].tier === tier) templates.push(PORTFOLIO_TEMPLATES[i]);
    }

    var html = '';
    for (var j = 0; j < templates.length; j++) {
        var tpl = templates[j];
        var isPremium = (tpl.tier === 'premium' || tpl.tier === 'company');
        html += '<div class="template-card ' + (isPremium ? 'premium-card' : '') + '" onclick="' +
            (isPremium ? "showToast('Premium template — Upgrade to unlock!', '👑')" : "selectPortfolioTemplate('" + tpl.id + "')") + '">';
        if (isPremium) {
            html += '<div class="tpl-premium-lock"><span class="tpl-lock-icon">🔒</span><span class="tpl-lock-text">Premium</span></div>';
        }
        html += '<span class="tpl-badge ' + (tpl.tier === 'free' ? 'tpl-badge-free' : 'tpl-badge-premium') + '">' + (tpl.tier === 'free' ? 'Free' : 'Premium') + '</span>' +
            '<div class="tpl-preview" style="background:' + tpl.color + ';' + (tpl.id === 'dark-dev' ? 'color:#fff;' : '') + '">' + tpl.icon + '</div>' +
            '<div class="tpl-name">' + tpl.name + '</div><div class="tpl-desc">' + tpl.desc + '</div></div>';
    }
    grid.innerHTML = html;
}

function selectPortfolioTemplate(id) {
    APP.currentPortfolioTemplate = id;
    var editor = document.getElementById('portfolioEditor');
    var grid = document.getElementById('portfolioTemplatesGrid');
    var tabs = document.getElementById('portfolioTabs');
    if (editor) editor.style.display = 'block';
    if (grid) grid.style.display = 'none';
    if (tabs) tabs.style.display = 'none';

    if (APP.analysisData) {
        var nameEl = document.getElementById('pfName');
        var skillsEl = document.getElementById('pfSkills');
        if (nameEl && APP.analysisData.name) nameEl.value = APP.analysisData.name;
        if (skillsEl && APP.analysisData.parsedResume && APP.analysisData.parsedResume.skills) {
            skillsEl.value = APP.analysisData.parsedResume.skills.join(', ');
        }
    }
    showToast('Portfolio template selected!', '🌐');
}

function aiGeneratePortfolioBio() {
    var name = getVal('pfName') || 'a developer';
    var title = getVal('pfTitle') || 'Full Stack Developer';
    var skills = getVal('pfSkills') || '';
    var bioEl = document.getElementById('pfBio');
    if (!bioEl) return;
    bioEl.value = 'AI writing bio...';

    setTimeout(function () {
        var bios = [
            'Hi, I\'m ' + name + '! I\'m a passionate ' + title + ' who loves building beautiful, functional applications. With expertise in ' + (skills || 'modern web technologies') + ', I turn ideas into reality through clean code.',
            title + ' with a passion for creating impactful digital experiences. I specialize in ' + (skills || 'full-stack development') + ' and I\'m always excited to learn new technologies.',
            'Welcome! I\'m ' + name + ', a ' + title + ' focused on crafting elegant solutions to complex problems. Proficient in ' + (skills || 'cutting-edge technologies') + '.'
        ];
        bioEl.value = bios[Math.floor(Math.random() * bios.length)];
        showToast('Bio generated!', '🧠');
    }, 1000);
}

function downloadPortfolio() {
    var name = getVal('pfName') || 'Developer';
    var title = getVal('pfTitle') || 'Full Stack Developer';
    var bio = getVal('pfBio');
    var skills = getVal('pfSkills');
    var projects = getVal('pfProjects');
    var github = getVal('pfGitHub');
    var linkedin = getVal('pfLinkedIn');
    var email = getVal('pfEmail');

    var projLines = projects.split('\n');
    var projList = [];
    for (var p = 0; p < projLines.length; p++) {
        if (projLines[p].trim()) {
            var parts = projLines[p].split('-');
            projList.push({ name: (parts[0] || projLines[p]).trim(), desc: (parts[1] || '').trim() });
        }
    }

    var isDark = APP.currentPortfolioTemplate === 'dark-dev';
    var bg = isDark ? '#0A0A0A' : '#FFFFFF';
    var text = isDark ? '#FFFFFF' : '#171717';
    var sub = isDark ? '#A3A3A3' : '#737373';
    var cardBg = isDark ? '#171717' : '#FAFAFA';
    var border = isDark ? '#262626' : '#EBEBEB';
    var chipBg = isDark ? '#262626' : '#F5F5F5';

    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' + name + ' - Portfolio</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">' +
        '<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Inter",sans-serif;background:' + bg + ';color:' + text + ';min-height:100vh;}' +
        '.container{max-width:800px;margin:0 auto;padding:60px 24px;}.hero{text-align:center;margin-bottom:60px;}' +
        '.hero h1{font-size:42px;font-weight:900;letter-spacing:-2px;margin-bottom:8px;}.hero .title{font-size:18px;color:#E8655A;font-weight:700;margin-bottom:16px;}' +
        '.hero .bio{font-size:15px;color:' + sub + ';line-height:1.7;max-width:600px;margin:0 auto 24px;}' +
        '.links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}.links a{padding:10px 20px;background:' + chipBg + ';border-radius:99px;font-size:13px;font-weight:700;color:' + text + ';text-decoration:none;}' +
        '.links a:hover{background:#E8655A;color:#fff;}.section{margin-bottom:48px;}.section h2{font-size:22px;font-weight:800;margin-bottom:20px;}' +
        '.skills{display:flex;flex-wrap:wrap;gap:8px;}.skill{padding:6px 16px;background:' + chipBg + ';border-radius:99px;font-size:13px;font-weight:600;}' +
        '.project{padding:20px;background:' + cardBg + ';border:1px solid ' + border + ';border-radius:16px;margin-bottom:12px;}' +
        '.project h3{font-size:16px;font-weight:800;margin-bottom:4px;}.project p{font-size:13px;color:' + sub + ';}' +
        '.footer{text-align:center;padding:32px 0;border-top:1px solid ' + border + ';font-size:12px;color:' + sub + ';}</style></head><body>' +
        '<div class="container"><div class="hero"><h1>' + name + '</h1><div class="title">' + title + '</div>';

    if (bio) html += '<p class="bio">' + bio + '</p>';

    html += '<div class="links">';
    if (email) html += '<a href="mailto:' + email + '">📧 Email</a>';
    if (github) html += '<a href="https://' + github + '">🐙 GitHub</a>';
    if (linkedin) html += '<a href="https://' + linkedin + '">💼 LinkedIn</a>';
    html += '</div></div>';

    if (skills) {
        var skillList = skills.split(',');
        html += '<div class="section"><h2>Skills</h2><div class="skills">';
        for (var sk = 0; sk < skillList.length; sk++) {
            var trimmed = skillList[sk].trim();
            if (trimmed) html += '<span class="skill">' + trimmed + '</span>';
        }
        html += '</div></div>';
    }

    if (projList.length > 0) {
        html += '<div class="section"><h2>Projects</h2>';
        for (var pr = 0; pr < projList.length; pr++) {
            html += '<div class="project"><h3>' + projList[pr].name + '</h3>';
            if (projList[pr].desc) html += '<p>' + projList[pr].desc + '</p>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '<div class="footer">Built with Skore AI Portfolio Builder</div></div></body></html>';

    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Portfolio downloaded!', '📥');
}

// ============================
// PRACTICE ARENA
// ============================
var ARENA_ROLES = [
    { id: 'frontend', name: 'Frontend Dev', icon: '🎨' },
    { id: 'backend', name: 'Backend Dev', icon: '⚙️' },
    { id: 'fullstack', name: 'Full Stack', icon: '💻' },
    { id: 'ai-ml', name: 'AI/ML', icon: '🤖' },
    { id: 'data-sci', name: 'Data Science', icon: '📊' },
    { id: 'devops', name: 'DevOps', icon: '🔧' },
    { id: 'dsa', name: 'DSA Master', icon: '🧮' },
    { id: 'system-design', name: 'System Design', icon: '🏗️' }
];

function initArenaRoles() {
    var grid = document.getElementById('arenaRoleGrid');
    if (!grid) return;

    var html = '';
    for (var i = 0; i < ARENA_ROLES.length; i++) {
        var role = ARENA_ROLES[i];
        var d = APP.arenaData[role.id];
        var level = (d && d.level) ? d.level : 1;
        var hasProgress = d && d.xp > 0;
        html += '<div class="arena-role-card" onclick="selectArenaRole(\'' + role.id + '\')">' +
            '<span class="arc-icon">' + role.icon + '</span>' +
            '<span class="arc-name">' + role.name + '</span>' +
            '<span class="arc-level ' + (hasProgress ? 'has-progress' : '') + '">Level ' + level + '</span></div>';
    }
    grid.innerHTML = html;
}

function selectArenaRole(roleId) {
    APP.currentArenaRole = roleId;
    if (!APP.arenaData[roleId]) {
        APP.arenaData[roleId] = { level: 1, xp: 0, lives: 5, completedLevels: [] };
    }

    // Update header
    var role = null;
    for (var i = 0; i < ARENA_ROLES.length; i++) {
        if (ARENA_ROLES[i].id === roleId) { role = ARENA_ROLES[i]; break; }
    }

    var aghRole = document.getElementById('aghRole');
    if (aghRole && role) aghRole.innerHTML = '<span class="agh-icon">' + role.icon + '</span><span class="agh-name">' + role.name + '</span>';

    setTextById('aghXP', APP.arenaData[roleId].xp);
    setTextById('aghLives', APP.arenaData[roleId].lives);

    var roleSelect = document.getElementById('arenaRoleSelect');
    var gameView = document.getElementById('arenaGameView');
    if (roleSelect) roleSelect.style.display = 'none';
    if (gameView) gameView.style.display = 'block';

    renderLevelMap(roleId);
}

function backToArenaRoles() {
    var roleSelect = document.getElementById('arenaRoleSelect');
    var gameView = document.getElementById('arenaGameView');
    var challengeBox = document.getElementById('challengeBox');
    if (roleSelect) roleSelect.style.display = 'block';
    if (gameView) gameView.style.display = 'none';
    if (challengeBox) challengeBox.style.display = 'none';
    clearInterval(APP.challengeTimer);
    initArenaRoles();
}

function renderLevelMap(roleId) {
    var map = document.getElementById('levelMap');
    if (!map) return;

    var data = APP.arenaData[roleId];
    var completed = data.completedLevels || [];

    var levels = [
        { num: 1, name: 'Beginner', icon: '🌱', sub: 'Basics' },
        { num: 2, name: 'Explorer', icon: '🗺️', sub: 'Core Concepts' },
        { num: 3, name: 'Builder', icon: '🛠️', sub: 'Applied Skills' },
        { num: 4, name: 'Challenger', icon: '⚔️', sub: 'Advanced' },
        { num: 5, name: 'Expert', icon: '🏆', sub: 'Expert Level' },
        { num: 6, name: 'Master', icon: '👑', sub: 'Mastery' }
    ];

    var html = '';
    for (var i = 0; i < levels.length; i++) {
        var lvl = levels[i];
        var isCompleted = completed.indexOf(lvl.num) !== -1;
        var isCurrent = lvl.num === data.level;
        var isLocked = lvl.num > data.level;
        var statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : isLocked ? 'locked' : 'unlocked';

        var stars = '';
        for (var s = 0; s < 3; s++) {
            stars += '<span class="level-star ' + (isCompleted ? 'on' : '') + '">★</span>';
        }

        html += '<div class="level-node ' + statusClass + '" onclick="' + (isLocked ? '' : 'startLevel(' + lvl.num + ')') + '">' +
            '<div class="level-circle">' + (isCompleted ? '✓' : lvl.icon) + (isLocked ? '<span class="level-lock-badge">🔒</span>' : '') + '</div>' +
            '<span class="level-name">' + lvl.name + '</span>' +
            '<span class="level-sub">' + lvl.sub + '</span>' +
            '<div class="level-stars">' + stars + '</div></div>';
    }
    map.innerHTML = html;
}

function startLevel(levelNum) {
    APP.currentLevel = levelNum;
    generateChallenge();
}

function generateChallenge() {
    var roleId = APP.currentArenaRole;
    var questions = getChallengeQuestions(roleId);
    var q = questions[Math.floor(Math.random() * questions.length)];
    APP.currentChallenge = q;
    APP.selectedAnswer = null;

    var box = document.getElementById('challengeBox');
    if (box) {
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTextById('cbType', q.type || 'Technical');

    var cbQuestion = document.getElementById('cbQuestion');
    if (cbQuestion) cbQuestion.innerHTML = '<h3>' + q.question + '</h3>';

    var cbOptions = document.getElementById('cbOptions');
    if (cbOptions) {
        var optHTML = '';
        for (var i = 0; i < q.options.length; i++) {
            optHTML += '<div class="cb-option" id="opt_' + i + '" onclick="selectOption(' + i + ')">' +
                '<span class="cb-opt-letter">' + String.fromCharCode(65 + i) + '</span>' +
                '<span>' + q.options[i] + '</span></div>';
        }
        cbOptions.innerHTML = optHTML;
    }

    var cbResult = document.getElementById('cbResult');
    var cbSubmitBtn = document.getElementById('cbSubmitBtn');
    if (cbResult) cbResult.style.display = 'none';
    if (cbSubmitBtn) cbSubmitBtn.style.display = 'inline-flex';

    // Start timer
    APP.challengeTimeLeft = 60;
    setTextById('cbTimerNum', '60');
    var cbTimer = document.getElementById('cbTimer');
    if (cbTimer) cbTimer.classList.remove('warn');
    clearInterval(APP.challengeTimer);

    APP.challengeTimer = setInterval(function () {
        APP.challengeTimeLeft--;
        setTextById('cbTimerNum', APP.challengeTimeLeft);
        if (APP.challengeTimeLeft <= 10) {
            var timer = document.getElementById('cbTimer');
            if (timer) timer.classList.add('warn');
        }
        if (APP.challengeTimeLeft <= 0) {
            clearInterval(APP.challengeTimer);
            submitChallenge();
        }
    }, 1000);
}

function selectOption(idx) {
    var allOpts = document.querySelectorAll('.cb-option');
    for (var i = 0; i < allOpts.length; i++) allOpts[i].classList.remove('selected');
    var opt = document.getElementById('opt_' + idx);
    if (opt) opt.classList.add('selected');
    APP.selectedAnswer = idx;
}

function submitChallenge() {
    clearInterval(APP.challengeTimer);
    var q = APP.currentChallenge;
    if (!q) return;

    var correct = q.correct;
    var selected = APP.selectedAnswer;
    var isCorrect = (selected === correct);

    // Highlight correct/wrong
    var allOpts = document.querySelectorAll('.cb-option');
    for (var i = 0; i < allOpts.length; i++) {
        if (i === correct) allOpts[i].classList.add('correct');
        if (i === selected && !isCorrect) allOpts[i].classList.add('wrong');
        allOpts[i].onclick = null;
    }

    var cbSubmitBtn = document.getElementById('cbSubmitBtn');
    if (cbSubmitBtn) cbSubmitBtn.style.display = 'none';

    var resultEl = document.getElementById('cbResult');
    if (!resultEl) return;
    resultEl.style.display = 'block';

    var roleId = APP.currentArenaRole;

    if (isCorrect) {
        var xpGain = 20 + APP.currentLevel * 5;
        APP.arenaData[roleId].xp += xpGain;
        APP.xp += xpGain;

        // Level up check
        if (APP.arenaData[roleId].xp >= APP.arenaData[roleId].level * 200) {
            if (APP.arenaData[roleId].completedLevels.indexOf(APP.currentLevel) === -1) {
                APP.arenaData[roleId].completedLevels.push(APP.currentLevel);
            }
            APP.arenaData[roleId].level = Math.min(APP.arenaData[roleId].level + 1, 6);
        }

        resultEl.className = 'cb-result res-correct';
        resultEl.innerHTML = '<div class="res-emoji">🎉</div><div class="res-title">Correct!</div>' +
            '<div class="res-xp">+' + xpGain + ' XP</div>' +
            '<div class="res-explain">' + (q.explanation || 'Great job!') + '</div>' +
            '<button class="btn-ios-primary" onclick="nextChallenge()">Next Challenge →</button>';
    } else {
        APP.arenaData[roleId].lives = Math.max(0, APP.arenaData[roleId].lives - 1);
        resultEl.className = 'cb-result res-wrong';
        resultEl.innerHTML = '<div class="res-emoji">😔</div><div class="res-title">Incorrect</div>' +
            '<div class="res-explain">Correct: ' + q.options[correct] + '<br><br>' + (q.explanation || '') + '</div>' +
            '<button class="btn-ios-primary" onclick="nextChallenge()">Try Again →</button>';
    }

    setTextById('aghXP', APP.arenaData[roleId].xp);
    setTextById('aghLives', APP.arenaData[roleId].lives);
    updateNavStats();
    saveState();
    renderLevelMap(roleId);
}

function nextChallenge() {
    var resultEl = document.getElementById('cbResult');
    if (resultEl) resultEl.style.display = 'none';
    generateChallenge();
}

function skipChallenge() {
    clearInterval(APP.challengeTimer);
    generateChallenge();
}

// Question Bank
function getChallengeQuestions(roleId) {
    var bank = {
        'frontend': [
            { question: 'What does the "key" prop do in React lists?', options: ['Styling', 'Helps React identify elements', 'Creates URLs', 'Encrypts data'], correct: 1, explanation: 'Keys help React identify changed, added, or removed items.', type: 'Technical' },
            { question: 'Which CSS property creates a flex container?', options: ['display: block', 'display: flex', 'display: grid', 'display: inline'], correct: 1, explanation: 'display: flex creates a flex container.', type: 'Technical' },
            { question: 'What is the Virtual DOM?', options: ['Browser API', 'Lightweight copy of real DOM', 'CSS framework', 'Testing tool'], correct: 1, explanation: 'Virtual DOM is a JS representation for efficient updates.', type: 'Technical' },
            { question: 'Which hook handles side effects in React?', options: ['useState', 'useEffect', 'useMemo', 'useRef'], correct: 1, explanation: 'useEffect handles side effects like API calls.', type: 'Technical' }
        ],
        'backend': [
            { question: 'What HTTP method updates a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], correct: 2, explanation: 'PUT updates/replaces a resource.', type: 'Technical' },
            { question: 'What is an ORM?', options: ['Object Relational Mapping', 'Online Resource Manager', 'Open Request Method', 'Output Render Module'], correct: 0, explanation: 'ORM maps objects to database tables.', type: 'Technical' },
            { question: 'Which is a NoSQL database?', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle'], correct: 2, explanation: 'MongoDB is a NoSQL document database.', type: 'Technical' }
        ],
        'fullstack': [
            { question: 'What is CORS?', options: ['CSS Object Rendering', 'Cross-Origin Resource Sharing', 'Central Operations Routing', 'Client Object Request'], correct: 1, explanation: 'CORS controls cross-origin access.', type: 'Technical' },
            { question: 'JWT stands for?', options: ['Java Web Token', 'JSON Web Token', 'JS Web Transfer', 'Just Working Token'], correct: 1, explanation: 'JWT = JSON Web Token for auth.', type: 'Technical' }
        ],
        'ai-ml': [
            { question: 'What is overfitting?', options: ['Good only on training data', 'Model too simple', 'Model crashes', 'No data'], correct: 0, explanation: 'Overfitting: memorizes training data, fails on new.', type: 'Technical' },
            { question: 'Which is supervised learning?', options: ['K-Means', 'PCA', 'Linear Regression', 'Autoencoder'], correct: 2, explanation: 'Linear Regression learns from labeled data.', type: 'Technical' }
        ],
        'data-sci': [
            { question: 'What does describe() return?', options: ['Data types', 'Statistical summary', 'Column names', 'Row count'], correct: 1, explanation: 'describe() returns mean, std, min, quartiles, max.', type: 'Technical' }
        ],
        'devops': [
            { question: 'What is Docker?', options: ['Language', 'Container platform', 'Database', 'Web server'], correct: 1, explanation: 'Docker builds and runs containers.', type: 'Technical' },
            { question: 'CI/CD stands for?', options: ['Code Integration/Deployment', 'Continuous Integration/Deployment', 'Central Infrastructure/Development', 'Cloud Integration/Delivery'], correct: 1, explanation: 'CI/CD automates build, test, deploy.', type: 'Technical' }
        ],
        'dsa': [
            { question: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1, explanation: 'Binary search halves space = O(log n).', type: 'Technical' },
            { question: 'Which uses FIFO?', options: ['Stack', 'Queue', 'Array', 'Tree'], correct: 1, explanation: 'Queue = First In, First Out.', type: 'Technical' },
            { question: 'Worst-case quicksort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correct: 2, explanation: 'Quicksort worst is O(n²) with bad pivot.', type: 'Technical' },
            { question: 'Which traversal visits root first?', options: ['Inorder', 'Preorder', 'Postorder', 'Level-order'], correct: 1, explanation: 'Preorder: Root → Left → Right.', type: 'Technical' },
            { question: 'Best structure for LRU cache?', options: ['Array', 'HashMap + Doubly Linked List', 'Stack', 'BST'], correct: 1, explanation: 'HashMap O(1) lookup + DLL O(1) removal.', type: 'Technical' }
        ],
        'system-design': [
            { question: 'What is horizontal scaling?', options: ['Upgrade hardware', 'Add more servers', 'Add RAM', 'Faster disk'], correct: 1, explanation: 'Horizontal = more machines.', type: 'Technical' },
            { question: 'CAP theorem states?', options: ['Choose 2 of 3: C, A, P', 'All 3 always possible', 'Only 1', 'Not database related'], correct: 0, explanation: 'At most 2 of 3 in distributed systems.', type: 'Technical' },
            { question: 'What is a load balancer?', options: ['Database', 'Distributes traffic', 'CDN', 'Monitor'], correct: 1, explanation: 'Distributes requests across servers.', type: 'Technical' }
        ]
    };

    return bank[roleId] || bank['dsa'];
}

function startDailyChallenge() {
    if (!APP.currentArenaRole) {
        showToast('Select a role first', '⚠️');
        return;
    }
    APP.currentLevel = 1;
    generateChallenge();

    var today = new Date().toDateString();
    if (APP.streakDays.indexOf(today) === -1) {
        APP.streakDays.push(today);
        APP.streak++;
        APP.xp += 10;
        updateNavStats();
        updateStreakWidget();
        saveState();
        showToast('Daily streak updated! 🔥', '🔥');
    }
}

function showWeeklyProject() {
    var projects = [
        '🏗️ Build a Todo app with React + local storage',
        '🌐 Create a REST API with Node.js + Express',
        '📊 Build a dashboard with Chart.js',
        '🤖 Create a simple chatbot interface',
        '📄 Build a Markdown editor with live preview'
    ];
    showToast(projects[Math.floor(Math.random() * projects.length)], '🏗️');
}

// ============================
// STREAK WIDGET
// ============================
function updateStreakWidget() {
    setTextById('swDays', APP.streak);
    setTextById('swXPCurrent', APP.xp);

    var nextLevelXP = APP.level * 1000;
    setTextById('swXPTotal', '/ ' + nextLevelXP);

    var swBarFill = document.getElementById('swBarFill');
    if (swBarFill) swBarFill.style.width = Math.min((APP.xp / nextLevelXP) * 100, 100) + '%';

    setTextById('arenaStreak', APP.streak + ' Day Streak');
    setTextById('arenaXP', APP.xp + ' XP');

    APP.level = Math.max(1, Math.floor(APP.xp / 1000) + 1);
    setTextById('arenaLvl', 'Level ' + APP.level);

    // Week calendar
    var weekEl = document.getElementById('swWeek');
    if (weekEl) {
        var dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        var today = new Date();
        var html = '';
        for (var i = 0; i < 7; i++) {
            var date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + i + 1);
            var done = APP.streakDays.indexOf(date.toDateString()) !== -1;
            html += '<div class="sw-day"><div class="sw-day-circle ' + (done ? 'done' : '') + '">' + (done ? '🔥' : dayNames[i]) + '</div><span class="sw-day-name">' + dayNames[i] + '</span></div>';
        }
        weekEl.innerHTML = html;
    }
}

// ============================
// PROFILE PAGE
// ============================
function updateProfilePage() {
    if (APP.analysisData) {
        setTextById('profName', APP.analysisData.name);
        setTextById('profDegree', APP.analysisData.degree + ' | ' + APP.analysisData.tier + ' | CGPA: ' + APP.analysisData.cgpa);
        setTextById('profScore', APP.analysisData.overall);
    }
    setTextById('profXP', APP.xp);
    setTextById('profStreak', APP.streak);
    setTextById('profLvl', APP.level);

    // History
    var histEl = document.getElementById('profHistory');
    if (histEl && APP.scoreHistory.length > 0) {
        var html = '';
        for (var i = 0; i < APP.scoreHistory.length; i++) {
            html += '<div class="history-item"><span class="hi-date">' + APP.scoreHistory[i].date + '</span><span class="hi-score">' + APP.scoreHistory[i].score + '</span></div>';
        }
        histEl.innerHTML = html;
    }
}

// ============================
// EXPORT PDF REPORT
// ============================
function exportPDF() {
    if (!APP.analysisData) {
        showToast('Complete analysis first', '⚠️');
        return;
    }

    showToast('Generating PDF report...', '📥');

    setTimeout(function () {
        var data = APP.analysisData;
        var win = window.open('', '_blank');

        var scoreHTML = '';
        var scoreKeys = Object.keys(data.scores);
        for (var i = 0; i < scoreKeys.length; i++) {
            var key = scoreKeys[i];
            scoreHTML += '<div class="metric"><div class="metric-name">' + key.charAt(0).toUpperCase() + key.slice(1) + '</div><div class="metric-value">' + data.scores[key] + '</div></div>';
        }

        var roleHTML = '';
        for (var r = 0; r < data.roles.length; r++) {
            roleHTML += '<div class="role-item"><span class="role-name">' + data.roles[r].icon + ' ' + data.roles[r].name + '</span><span class="role-fit">' + data.roles[r].fit + '%</span></div>';
        }

        win.document.write('<!DOCTYPE html><html><head><title>Skore AI Report</title>' +
            '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">' +
            '<style>body{font-family:"Inter",sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#171717;}' +
            'h1{font-size:28px;font-weight:900;margin-bottom:4px;}.subtitle{color:#737373;font-size:14px;margin-bottom:24px;}' +
            '.score-big{font-size:64px;font-weight:900;color:#E8655A;text-align:center;margin:20px 0;}' +
            '.score-label{text-align:center;color:#737373;font-size:14px;margin-bottom:32px;}' +
            '.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}' +
            '.metric{padding:16px;background:#FAFAFA;border-radius:12px;border:1px solid #EBEBEB;}' +
            '.metric-name{font-size:12px;color:#737373;font-weight:600;}.metric-value{font-size:24px;font-weight:900;}' +
            '.section-title{font-size:18px;font-weight:800;margin:24px 0 12px;}' +
            '.role-item{padding:12px;background:#FEF2F0;border-radius:8px;margin-bottom:8px;}' +
            '.role-name{font-weight:800;}.role-fit{color:#E8655A;font-weight:900;float:right;}' +
            '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #EBEBEB;font-size:11px;color:#A3A3A3;text-align:center;}' +
            '@media print{body{padding:20px;}}</style></head><body>' +
            '<h1>Skore AI Placement Report</h1>' +
            '<div class="subtitle">' + data.name + ' | ' + data.degree + ' | ' + data.tier + ' | ' + new Date().toLocaleDateString() + '</div>' +
            '<div class="score-big">' + data.overall + '</div>' +
            '<div class="score-label">Overall Placement Readiness Score</div>' +
            '<div class="grid">' + scoreHTML + '</div>' +
            '<div class="section-title">Dream Roles</div>' + roleHTML +
            '<div class="footer">Generated by Skore AI | ' + new Date().toLocaleString() + '</div></body></html>');

        win.document.close();
        setTimeout(function () { win.print(); }, 500);
    }, 800);
}

// ============================
// CONTACT FORM
// ============================
function sendContactEmail(event) {
    event.preventDefault();
    var btn = document.getElementById('cfSubmitBtn');
    if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

    setTimeout(function () {
        showToast('Message sent successfully!', '📧');
        if (btn) btn.textContent = 'Sent! ✓';
        setTimeout(function () {
            var form = document.getElementById('contactForm');
            if (form) form.reset();
            if (btn) { btn.textContent = 'Send Message →'; btn.disabled = false; }
        }, 2000);
    }, 1500);
}

// ============================
// CONGRATS OVERLAY
// ============================
function showCongratsOverlay(title, subtitle, stats) {
    var overlay = document.createElement('div');
    overlay.className = 'congrats-overlay';

    var statsHTML = '';
    for (var i = 0; i < stats.length; i++) {
        statsHTML += '<div class="cg-stat"><span class="cg-stat-emoji">' + stats[i].emoji + '</span><span class="cg-stat-num">' + stats[i].value + '</span><span class="cg-stat-label">' + stats[i].label + '</span></div>';
    }

    overlay.innerHTML = '<div class="congrats-card">' +
        '<div class="cg-trophy">🏆</div>' +
        '<div class="cg-title">' + title + '</div>' +
        '<div class="cg-sub">' + subtitle + '</div>' +
        '<div class="cg-stats">' + statsHTML + '</div>' +
        '<button class="btn-ios-primary" onclick="this.closest(\'.congrats-overlay\').remove()">Continue →</button></div>';

    document.body.appendChild(overlay);
}