/* ============================
   RESUME BUILDER LOGIC
   ============================ */

// Resume data state
APP.resumeData = {
    template: 'modern',
    color: '#E8655A',
    photo: null,
    personal: { name: '', title: '', email: '', phone: '', location: '', website: '' },
    summary: '',
    experience: [],
    education: [],
    skills: ''
};

function initResumeBuilder() {
    // Populate with one default experience and education entry
    var expList = document.getElementById('rb-experience-list');
    var eduList = document.getElementById('rb-education-list');
    if (expList && expList.children.length === 0) addResumeItem('experience', 'Experience');
    if (eduList && eduList.children.length === 0) addResumeItem('education', 'Education');

    // Delegate input events from sidebar to auto-update preview
    var sidebar = document.querySelector('.rb-sidebar');
    if (sidebar) {
        sidebar.addEventListener('input', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                updateResumeDataFromUI();
                updateResumePreview();
            }
        });
    }

    // Initial preview render
    updateResumePreview();
}

/* ---------- Accordion ---------- */
function toggleAccordion(header) {
    var accordion = header.parentElement;
    accordion.classList.toggle('open');
}

/* ---------- Template Selector ---------- */
function setResumeTemplate(select) {
    APP.resumeData.template = select.value;
    updateResumePreview();
}

/* ---------- Color Selector ---------- */
function setResumeColor(colorBtn, colorValue) {
    document.querySelectorAll('.rb-color').forEach(function (btn) { btn.classList.remove('active'); });
    colorBtn.classList.add('active');
    APP.resumeData.color = colorValue;
    var sheet = document.getElementById('resumeDynamicSheet');
    if (sheet) sheet.style.setProperty('--resume-accent', colorValue);
    updateResumePreview();
}

/* ---------- Photo Upload ---------- */
function handleResumePhoto(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            APP.resumeData.photo = e.target.result;
            var previewImg = document.getElementById('rbPhotoPreview');
            if (previewImg) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'inline-block';
            }
            updateResumePreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/* ---------- Dynamic Item Add / Remove ---------- */
function addResumeItem(type, label) {
    var container = document.getElementById('rb-' + type + '-list');
    if (!container) return;
    var idx = container.children.length;

    var html = '<div class="rb-item-card" style="padding:14px; margin-bottom:12px; background:var(--gray-50); border:1px solid var(--border); border-radius:var(--r-sm); font-size:13px;" data-idx="' + idx + '">';
    html += '<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><strong>' + label + ' ' + (idx + 1) + '</strong><button type="button" onclick="removeResumeItem(this)" style="color:var(--danger); font-size:12px; cursor:pointer; background:none; border:none;">✕ Remove</button></div>';

    if (type === 'experience') {
        html += '<input type="text" class="ios-input rb-item-title" placeholder="Job Title" style="margin-bottom:8px;">';
        html += '<input type="text" class="ios-input rb-item-sub" placeholder="Company Name" style="margin-bottom:8px;">';
        html += '<input type="text" class="ios-input rb-item-date" placeholder="Date (e.g. Jan 2020 - Present)" style="margin-bottom:8px;">';
        html += '<textarea class="ios-textarea rb-item-desc" placeholder="Responsibilities / Achievements" rows="3"></textarea>';
        html += '<div style="text-align:right; margin-top:6px;"><span class="rb-ai-btn" onclick="aiEnhanceField(this, \'experience\')" style="cursor:pointer;">✨ Improve with AI</span></div>';
    } else {
        html += '<input type="text" class="ios-input rb-item-title" placeholder="Degree / Certificate" style="margin-bottom:8px;">';
        html += '<input type="text" class="ios-input rb-item-sub" placeholder="Institution" style="margin-bottom:8px;">';
        html += '<input type="text" class="ios-input rb-item-date" placeholder="Year (e.g. 2020-2024)" style="margin-bottom:8px;">';
    }

    html += '</div>';
    container.insertAdjacentHTML('beforeend', html);
}

function removeResumeItem(btn) {
    var card = btn.closest('.rb-item-card');
    if (card) card.remove();
    updateResumeDataFromUI();
    updateResumePreview();
}

/* ---------- Read UI → Data ---------- */
function updateResumeDataFromUI() {
    var d = APP.resumeData;
    var el;

    el = document.getElementById('rbName');     if (el) d.personal.name = el.value;
    el = document.getElementById('rbTitle');    if (el) d.personal.title = el.value;
    el = document.getElementById('rbEmail');    if (el) d.personal.email = el.value;
    el = document.getElementById('rbPhone');    if (el) d.personal.phone = el.value;
    el = document.getElementById('rbLocation'); if (el) d.personal.location = el.value;
    el = document.getElementById('rbWebsite');  if (el) d.personal.website = el.value;
    el = document.getElementById('rbSummary');  if (el) d.summary = el.value;
    el = document.getElementById('rbSkills');   if (el) d.skills = el.value;

    d.experience = [];
    document.querySelectorAll('#rb-experience-list .rb-item-card').forEach(function (card) {
        d.experience.push({
            title: (card.querySelector('.rb-item-title') || {}).value || '',
            company: (card.querySelector('.rb-item-sub') || {}).value || '',
            date: (card.querySelector('.rb-item-date') || {}).value || '',
            desc: (card.querySelector('.rb-item-desc') || {}).value || ''
        });
    });

    d.education = [];
    document.querySelectorAll('#rb-education-list .rb-item-card').forEach(function (card) {
        d.education.push({
            degree: (card.querySelector('.rb-item-title') || {}).value || '',
            school: (card.querySelector('.rb-item-sub') || {}).value || '',
            year: (card.querySelector('.rb-item-date') || {}).value || ''
        });
    });
}

/* ---------- Render Preview ---------- */
function updateResumePreview() {
    var sheet = document.getElementById('resumeDynamicSheet');
    if (!sheet) return;

    var d = APP.resumeData;
    var accent = d.color || '#E8655A';
    sheet.style.setProperty('--resume-accent', accent);

    function esc(txt) { return (txt || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function nl2br(txt) { return esc(txt).replace(/\n/g, '<br>'); }

    var html = '';

    // ===== MODERN =====
    if (d.template === 'modern') {
        html += '<div class="template-modern">';
        // Left
        html += '<div class="mod-left">';
        if (d.photo) html += '<div class="mod-photo-wrap"><img src="' + d.photo + '" class="mod-photo"></div>';
        html += '<div><div class="mod-name">' + esc(d.personal.name || 'Your Name') + '</div>';
        html += '<div class="mod-title">' + esc(d.personal.title || 'Professional Title') + '</div></div>';
        html += '<div><div class="mod-section-title">Contact</div>';
        if (d.personal.email) html += '<div class="mod-contact-item">✉️ ' + esc(d.personal.email) + '</div>';
        if (d.personal.phone) html += '<div class="mod-contact-item">📞 ' + esc(d.personal.phone) + '</div>';
        if (d.personal.location) html += '<div class="mod-contact-item">📍 ' + esc(d.personal.location) + '</div>';
        if (d.personal.website) html += '<div class="mod-contact-item">🔗 ' + esc(d.personal.website) + '</div>';
        html += '</div>';
        if (d.skills) {
            html += '<div><div class="mod-section-title">Skills</div><div>';
            d.skills.split(',').forEach(function (s) { s = s.trim(); if (s) html += '<span class="mod-skill-tag">' + esc(s) + '</span>'; });
            html += '</div></div>';
        }
        if (d.education.length > 0) {
            html += '<div><div class="mod-section-title">Education</div>';
            d.education.forEach(function (edu) {
                if (edu.degree || edu.school) {
                    html += '<div style="margin-bottom:15px;">';
                    html += '<div class="mod-item-title" style="color:white;">' + esc(edu.degree || 'Degree') + '</div>';
                    html += '<div class="mod-item-sub">' + esc(edu.school || 'Institution') + '</div>';
                    html += '<div class="mod-item-date" style="color:#94a3b8;">' + esc(edu.year || 'Year') + '</div></div>';
                }
            });
            html += '</div>';
        }
        html += '</div>'; // end left

        // Right
        html += '<div class="mod-right">';
        if (d.summary) {
            html += '<div><div class="mod-section-title">Professional Summary</div>';
            html += '<div class="mod-summary">' + nl2br(d.summary) + '</div></div>';
        }
        html += '<div><div class="mod-section-title">Experience</div>';
        if (d.experience.length === 0) html += '<div style="color:#94a3b8; font-style:italic;">Add experience in the sidebar.</div>';
        d.experience.forEach(function (exp) {
            if (exp.title || exp.company) {
                html += '<div style="margin-bottom:20px;">';
                html += '<div class="mod-item-title">' + esc(exp.title || 'Job Title') + '</div>';
                html += '<div class="mod-item-sub">' + esc(exp.company || 'Company') + '</div>';
                html += '<div class="mod-item-date">' + esc(exp.date || 'Date Range') + '</div>';
                html += '<div class="mod-item-desc">' + nl2br(exp.desc) + '</div></div>';
            }
        });
        html += '</div>';
        html += '</div>'; // end right
        html += '</div>'; // end modern
    }

    // ===== MINIMAL =====
    else if (d.template === 'minimal') {
        html += '<div class="template-minimal">';
        html += '<div class="min-header">';
        html += '<div class="min-name">' + esc(d.personal.name || 'Your Name') + '</div>';
        html += '<div class="min-title">' + esc(d.personal.title || 'Professional Title') + '</div>';
        html += '<div class="min-contact">';
        if (d.personal.email) html += '<span>' + esc(d.personal.email) + '</span>';
        if (d.personal.phone) html += '<span>• ' + esc(d.personal.phone) + '</span>';
        if (d.personal.location) html += '<span>• ' + esc(d.personal.location) + '</span>';
        if (d.personal.website) html += '<span>• ' + esc(d.personal.website) + '</span>';
        html += '</div></div>';
        if (d.summary) {
            html += '<div class="min-section"><div class="min-section-title">Summary</div>';
            html += '<div class="min-summary">' + nl2br(d.summary) + '</div></div>';
        }
        html += '<div class="min-section"><div class="min-section-title">Experience</div>';
        d.experience.forEach(function (exp) {
            if (exp.title || exp.company) {
                html += '<div class="min-item">';
                html += '<div class="min-item-head"><span class="min-item-title">' + esc(exp.title || 'Job Title') + '</span><span class="min-item-date">' + esc(exp.date || '') + '</span></div>';
                html += '<div class="min-item-sub">' + esc(exp.company || 'Company') + '</div>';
                html += '<div class="min-item-desc">' + nl2br(exp.desc) + '</div></div>';
            }
        });
        html += '</div>';
        if (d.education.length > 0) {
            html += '<div class="min-section"><div class="min-section-title">Education</div>';
            d.education.forEach(function (edu) {
                if (edu.degree || edu.school) {
                    html += '<div class="min-item">';
                    html += '<div class="min-item-head"><span class="min-item-title">' + esc(edu.degree || 'Degree') + '</span><span class="min-item-date">' + esc(edu.year || '') + '</span></div>';
                    html += '<div class="min-item-sub">' + esc(edu.school || 'Institution') + '</div></div>';
                }
            });
            html += '</div>';
        }
        if (d.skills) {
            html += '<div class="min-section"><div class="min-section-title">Skills</div>';
            html += '<div class="min-skills">' + esc(d.skills) + '</div></div>';
        }
        html += '</div>';
    }

    // ===== CREATIVE =====
    else if (d.template === 'creative') {
        html += '<div class="template-creative">';
        html += '<div class="cre-header">';
        if (d.photo) html += '<div class="cre-photo-wrap"><img src="' + d.photo + '" class="cre-photo"></div>';
        html += '<div><div class="cre-name">' + esc(d.personal.name || 'Your Name') + '</div>';
        html += '<div class="cre-title">' + esc(d.personal.title || 'Professional Title') + '</div></div></div>';
        html += '<div class="cre-body">';
        // Left
        html += '<div class="cre-left">';
        html += '<div><div class="cre-section-title">Contact</div>';
        if (d.personal.email) html += '<div class="cre-contact-item"><div class="cre-contact-icon">✉️</div>' + esc(d.personal.email) + '</div>';
        if (d.personal.phone) html += '<div class="cre-contact-item"><div class="cre-contact-icon">📞</div>' + esc(d.personal.phone) + '</div>';
        if (d.personal.location) html += '<div class="cre-contact-item"><div class="cre-contact-icon">📍</div>' + esc(d.personal.location) + '</div>';
        if (d.personal.website) html += '<div class="cre-contact-item"><div class="cre-contact-icon">🔗</div>' + esc(d.personal.website) + '</div>';
        html += '</div>';
        if (d.education.length > 0) {
            html += '<div><div class="cre-section-title">Education</div>';
            d.education.forEach(function (edu) {
                if (edu.degree || edu.school) {
                    html += '<div class="cre-item">';
                    html += '<div class="cre-item-title">' + esc(edu.degree || 'Degree') + '</div>';
                    html += '<div class="cre-item-sub">' + esc(edu.school || 'Institution') + '</div>';
                    html += '<div class="cre-item-date">' + esc(edu.year || 'Year') + '</div></div>';
                }
            });
            html += '</div>';
        }
        if (d.skills) {
            html += '<div><div class="cre-section-title">Expertise</div>';
            d.skills.split(',').forEach(function (s) {
                s = s.trim();
                if (s) {
                    var pct = Math.floor(Math.random() * 30) + 65;
                    html += '<div class="cre-skill-bar"><span class="cre-skill-name">' + esc(s) + '</span>';
                    html += '<div class="cre-skill-track"><div class="cre-skill-fill" style="width:' + pct + '%"></div></div></div>';
                }
            });
            html += '</div>';
        }
        html += '</div>'; // end left
        // Right
        html += '<div class="cre-right">';
        if (d.summary) {
            html += '<div><div class="cre-section-title">Profile</div>';
            html += '<div class="cre-summary">' + nl2br(d.summary) + '</div></div>';
        }
        html += '<div><div class="cre-section-title">Experience</div>';
        d.experience.forEach(function (exp) {
            if (exp.title || exp.company) {
                html += '<div class="cre-item">';
                html += '<div class="cre-item-title">' + esc(exp.title || 'Job Title') + '</div>';
                html += '<div class="cre-item-sub">' + esc(exp.company || 'Company') + '</div>';
                html += '<div class="cre-item-date">' + esc(exp.date || 'Date') + '</div>';
                html += '<div class="cre-item-desc">' + nl2br(exp.desc) + '</div></div>';
            }
        });
        html += '</div>';
        html += '</div>'; // end body
        html += '</div>'; // end creative
    }

    sheet.innerHTML = html;
}

/* ---------- PDF Download ---------- */
function downloadResumePDF() {
    var element = document.getElementById('resumeDynamicSheet');
    if (!element) return;
    
    // Inject print styles if not already present to isolate the resume section
    if (!document.getElementById('rbPrintStyles')) {
        var style = document.createElement('style');
        style.id = 'rbPrintStyles';
        style.innerHTML = `
            @media print {
                body * { visibility: hidden !important; }
                #resumeDynamicSheet, #resumeDynamicSheet * { 
                    visibility: visible !important; 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                #resumeDynamicSheet {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 210mm !important; /* A4 width */
                    min-height: 297mm !important; /* A4 height */
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                }
                @page { size: A4 portrait; margin: 0; }
                /* Hide any app scrollbars or UI overflows during print */
                html, body { overflow: visible !important; height: auto !important; background: white !important; }
            }
        `;
        document.head.appendChild(style);
    }
    
    showToast('Preparing Native Text PDF...', '⏳');
    
    // Short delay to allow toast to render and any dynamic fonts to settle
    setTimeout(function() {
        window.print();
        showToast('PDF Print Dialog Opened!', '✅');
    }, 500);
}

/* ---------- AI Enhance ---------- */
async function aiEnhanceField(btnElement, fieldType) {
    if (fieldType === 'summary') {
        var inputEl = document.getElementById('rbSummary');
        var text = inputEl ? inputEl.value : '';
        if (!text || text.length < 10) { showToast('Write a bit more first for AI to improve.', '⚠️'); return; }

        btnElement.textContent = '⏳ Enhancing…';
        btnElement.style.pointerEvents = 'none';

        var prompt = 'Rewrite and enhance this professional summary to be impactful, concise (2-3 sentences max), action-oriented, and ATS-friendly. Use strong verbs and quantify achievements where possible. Output ONLY the rewritten text, no quotes, no explanation:\n\n' + text;
        var systemMsg = 'You are an elite resume writer with 15+ years of experience at top recruiting firms. You write concise, powerful resume content that passes ATS systems and impresses hiring managers. Output ONLY the improved text, never add explanations or formatting.';

        try {
            var improved = await callAISimple(prompt, 500, systemMsg);
            if (improved && inputEl) {
                inputEl.value = improved.trim().replace(/^"|"$/g, '');
                updateResumeDataFromUI();
                updateResumePreview();
                showToast('AI enhanced your summary!', '✨');
            } else {
                showToast('AI returned empty. Try again.', '⚠️');
            }
        } catch (e) { showToast('AI failed to enhance.', '❌'); }
        finally {
            btnElement.textContent = '🧠 AI Enhance';
            btnElement.style.pointerEvents = 'auto';
        }
    }
    else if (fieldType === 'experience') {
        var card = btnElement.closest('.rb-item-card');
        if (!card) return;
        var descEl = card.querySelector('.rb-item-desc');
        var titleEl = card.querySelector('.rb-item-title');
        var jobTitle = titleEl ? titleEl.value : 'various tasks';
        var text = descEl ? descEl.value : '';
        if (!text || text.length < 5) { showToast('Add some basic bullet points first.', '⚠️'); return; }

        btnElement.textContent = '⏳ Enhancing…';
        btnElement.style.pointerEvents = 'none';

        var prompt = 'Improve these job experience bullet points for a "' + jobTitle + '" role. Make each point:\n- Start with a strong action verb\n- Include measurable impact where possible\n- Be concise (1 line each)\n- Be ATS-optimized\n\nOutput ONLY the improved bullet points as plain text lines (no markdown bullets, no numbering). Original:\n\n' + text;
        var systemMsg = 'You are an elite resume writer. Transform weak bullet points into powerful, results-driven achievements. Output ONLY the improved text lines, nothing else.';

        try {
            var improved = await callAISimple(prompt, 800, systemMsg);
            if (improved && descEl) {
                descEl.value = improved.replace(/^- /gm, '').replace(/^\* /gm, '').replace(/^\d+\.\s*/gm, '').trim();
                updateResumeDataFromUI();
                updateResumePreview();
                showToast('AI enhanced your experience!', '✨');
            } else {
                showToast('AI returned empty. Try again.', '⚠️');
            }
        } catch (e) { showToast('AI failed to enhance.', '❌'); }
        finally {
            btnElement.textContent = '✨ Improve with AI';
            btnElement.style.pointerEvents = 'auto';
        }
    }
}

/* ---------- Init on DOM load ---------- */
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initResumeBuilder, 800);
});
