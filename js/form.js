// Form step logic, card renderers, summary, and lead submission.
// Depends on: utils.js ($, clamp, fmt), state.js, data.js (IRONS, ROOFS, STEPS_CONFIG, INSTALLATION_OPTIONS, USE_OPTIONS)

// SVG icons for use-type cards (step 5)
const USE_ICONS = {
  'parking': `<svg viewBox="0 0 72 40" fill="none">
    <rect x="4" y="22" width="64" height="12" rx="4" fill="currentColor" fill-opacity=".28"/>
    <path d="M14 22 C14 22 20 8 24 8 L48 8 C52 8 58 22 58 22" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-opacity=".28" stroke-width="1.5"/>
    <path d="M28 22 C28 22 32 11 35 11 L40 11 C43 11 46 22 46 22" fill="currentColor" fill-opacity=".10"/>
    <circle cx="20" cy="34" r="5" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-opacity=".32" stroke-width="1.5"/>
    <circle cx="52" cy="34" r="5" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-opacity=".32" stroke-width="1.5"/>
  </svg>`,
  'chill-out': `<svg viewBox="0 0 72 40" fill="none">
    <rect x="4"  y="18" width="44" height="16" rx="4" fill="currentColor" fill-opacity=".26"/>
    <rect x="4"  y="8"  width="10" height="26" rx="3" fill="currentColor" fill-opacity=".38"/>
    <rect x="38" y="8"  width="10" height="18" rx="3" fill="currentColor" fill-opacity=".38"/>
    <rect x="52" y="26" width="16" height="5"  rx="2" fill="currentColor" fill-opacity=".26"/>
    <line x1="54" y1="31" x2="54" y2="38" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
    <line x1="66" y1="31" x2="66" y2="38" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
  </svg>`,
  'dining': `<svg viewBox="0 0 72 40" fill="none">
    <rect x="16" y="14" width="40" height="14" rx="2" fill="currentColor" fill-opacity=".26"/>
    <rect x="20" y="4"  width="12" height="10" rx="2" fill="currentColor" fill-opacity=".20"/>
    <rect x="40" y="4"  width="12" height="10" rx="2" fill="currentColor" fill-opacity=".20"/>
    <rect x="20" y="28" width="12" height="10" rx="2" fill="currentColor" fill-opacity=".20"/>
    <rect x="40" y="28" width="12" height="10" rx="2" fill="currentColor" fill-opacity=".20"/>
  </svg>`,
  'protected-area': `<svg viewBox="0 0 72 40" fill="none">
    <rect x="2"  y="0"  width="6"  height="40" rx="2" fill="currentColor" fill-opacity=".52"/>
    <rect x="64" y="0"  width="6"  height="40" rx="2" fill="currentColor" fill-opacity=".52"/>
    <rect x="2"  y="4"  width="68" height="4"  rx="1" fill="currentColor" fill-opacity=".32"/>
    <rect x="8"  y="8"  width="56" height="18" rx="0" fill="currentColor" fill-opacity=".10"/>
    <rect x="10" y="27" width="52" height="5"  rx="1" fill="currentColor" fill-opacity=".26"/>
    <line x1="14" y1="32" x2="14" y2="38" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
    <line x1="58" y1="32" x2="58" y2="38" stroke="currentColor" stroke-opacity=".22" stroke-width="2"/>
  </svg>`
};

// SVG icons for installation type cards — use currentColor so they adapt to selected/unselected state
const INSTALL_ICONS = {
  'wall-attached':  `<svg viewBox="0 0 72 40" fill="none"><rect x="60" y="0" width="6" height="40" rx="2" fill="currentColor" fill-opacity=".60"/><rect x="10" y="4" width="50" height="4" rx="2" fill="currentColor" fill-opacity=".36"/><rect x="10" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".50"/><rect x="46" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".50"/></svg>`,
  'freestanding':   `<svg viewBox="0 0 72 40" fill="none"><rect x="6"  y="4" width="60" height="4" rx="2" fill="currentColor" fill-opacity=".36"/><rect x="6"  y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".54"/><rect x="62" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".54"/><rect x="24" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".22"/><rect x="44" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".22"/></svg>`,
  'between-walls':  `<svg viewBox="0 0 72 40" fill="none"><rect x="0"  y="0" width="6" height="40" rx="2" fill="currentColor" fill-opacity=".60"/><rect x="66" y="0" width="6" height="40" rx="2" fill="currentColor" fill-opacity=".60"/><rect x="6"  y="4" width="60" height="4" rx="2" fill="currentColor" fill-opacity=".32"/><rect x="23" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".26"/><rect x="45" y="4" width="4" height="34" rx="2" fill="currentColor" fill-opacity=".26"/></svg>`,
  'unsure':         `<svg viewBox="0 0 72 40" fill="none"><rect x="8" y="2" width="56" height="36" rx="5" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="2" stroke-dasharray="6 4"/><text x="36" y="29" font-family="system-ui,sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="currentColor" fill-opacity=".28">?</text></svg>`
};

function syncMeasures() {
  const pairs = [
    ['width',  'widthRange',  'widthInput',  'widthBadge',  2,   12  ],
    ['length', 'lengthRange', 'lengthInput', 'lengthBadge', 2,   12  ],
    ['height', 'heightRange', 'heightInput', 'heightBadge', 2.2, 4.5 ]
  ];
  pairs.forEach(([key, rangeId, inputId, badgeId, min, max]) => {
    const v = clamp(state[key], min, max);
    state[key] = v;
    $(rangeId).value = v; $(inputId).value = v; $(badgeId).textContent = fmt(v);
  });
  $('mWidth').textContent  = fmt(state.width);
  $('mLength').textContent = fmt(state.length);
  $('mHeight').textContent = fmt(state.height);
  $('mRoof').textContent   = { wood: 'Madera', slats: 'Lamas', poly: 'Poli.' }[state.roofKey] || 'Panel';
  updateSummary();
}

function renderInstallationCards() {
  $('installationCards').innerHTML = INSTALLATION_OPTIONS.map(opt => `
    <article class="option ${opt.id === state.installationType ? 'selected' : ''}" data-install="${opt.id}">
      <div class="install-icon">${INSTALL_ICONS[opt.id]}</div>
      <h3>${opt.title}</h3>
      <p>${opt.desc}</p>
    </article>
  `).join('');
  document.querySelectorAll('[data-install]').forEach(card => card.addEventListener('click', () => {
    state.installationType = card.dataset.install;
    renderInstallationCards();
    updateSummary();
  }));
}

function renderUseCards() {
  $('useCards').innerHTML = USE_OPTIONS.map(opt => `
    <article class="option ${opt.id === state.useType ? 'selected' : ''}" data-use="${opt.id}">
      <div class="install-icon">${USE_ICONS[opt.id]}</div>
      <h3>${opt.title}</h3>
      <p>${opt.desc}</p>
    </article>
  `).join('');
  document.querySelectorAll('[data-use]').forEach(card => card.addEventListener('click', () => {
    state.useType = card.dataset.use;
    renderUseCards();
    updateSummary();
  }));
}

// Renders iron finish cards. Shows image thumbnail if imagePath is set in data.js,
// falls back to colour swatch otherwise.
function renderIronCards() {
  $('ironCards').innerHTML = IRONS.map((item, i) => `
    <article class="option ${item.name === state.iron ? 'selected' : ''}" data-iron="${i}">
      ${item.imagePath
        ? `<img src="${item.imagePath}" alt="${item.name}" class="material-thumb" />`
        : `<div class="swatch" style="background:${item.color}"></div>`}
      <h3>${item.name}</h3>
      <p>${item.desc}<br><strong>${item.profile}</strong></p>
    </article>
  `).join('');
  document.querySelectorAll('[data-iron]').forEach(card => card.addEventListener('click', () => {
    const item = IRONS[Number(card.dataset.iron)];
    state.iron = item.name; state.ironColor = item.color; state.profile = item.profile;
    renderIronCards(); updateSummary();
  }));
}

// Renders roof option cards. Shows image thumbnail if imagePath is set in data.js,
// falls back to the CSS roof-icon shape otherwise.
function renderRoofCards() {
  $('roofCards').innerHTML = ROOFS.map((item, i) => `
    <article class="option ${item.name === state.roof ? 'selected' : ''}" data-roof="${i}">
      ${item.imagePath
        ? `<img src="${item.imagePath}" alt="${item.name}" class="material-thumb" />`
        : `<div class="roof-icon"></div>`}
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
    </article>
  `).join('');
  document.querySelectorAll('[data-roof]').forEach(card => card.addEventListener('click', () => {
    const item = ROOFS[Number(card.dataset.roof)];
    state.roof = item.name; state.roofKey = item.key; state.roofColor = item.color; state.slope = item.slope;
    renderRoofCards(); syncMeasures(); updateSummary();
  }));
}

function setCameraFocus(focus) {
  state.targetFocusX = focus.x || 0;
  state.targetFocusY = focus.y || 0;
  state.targetFocusZ = focus.z || 0;
}
function resetCameraFocus() {
  state.targetFocusX = 0;
  state.targetFocusY = 0;
  state.targetFocusZ = 0;
}
function updateViewButtons() {
  document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
}

function applyStepCamera(step) {
  const cam = STEP_CAMERAS[step];
  if (!cam) return;
  state.targetYaw   = cam.yaw;
  state.targetPitch = cam.pitch;
  state.targetZoom  = cam.zoom;
  if (cam.focus) setCameraFocus(cam.focus);
  else resetCameraFocus();
  updateViewButtons();
  if (step === 1) {
    const isoBtn = document.querySelector('[data-view="iso"]');
    if (isoBtn) isoBtn.classList.add('active');
  }
}

function setStep(step) {
  state.step = Math.max(1, Math.min(6, step));
  document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
  document.querySelector(`.step-${state.step}`).classList.remove('hidden');
  $('stepTitle').textContent  = STEPS_CONFIG[state.step][0];
  $('stepLead').textContent   = STEPS_CONFIG[state.step][1];
  $('stepNumber').textContent = state.step;
  $('backBtn').disabled       = state.step === 1;
  $('nextBtn').textContent    = state.step === 6 ? 'Enviar solicitud' : 'Continuar';
  document.querySelectorAll('.step-dot').forEach((dot, i) => dot.classList.toggle('active', i < state.step));
  if (state.step === 2) renderInstallationCards();
  if (state.step === 3) renderIronCards();
  if (state.step === 4) renderRoofCards();
  if (state.step === 5) renderUseCards();
  updateSummary();
  applyStepCamera(state.step);
  const panel = document.querySelector('.panel');
  if (panel) {
    if (window.innerWidth <= 980) {
      // Espera al siguiente frame para que el DOM del nuevo paso esté pintado,
      // luego scrollIntoView con scroll-margin-top (definido en responsive.css)
      // para que el panel aparezca justo debajo del visor sticky.
      requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      panel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function updateSummary() {
  const el = $('summary');
  if (!el) return;
  const installLabel = (INSTALLATION_OPTIONS.find(o => o.id === state.installationType) || {}).title || 'Pendiente';
  const useLabel     = (USE_OPTIONS.find(o => o.id === state.useType) || {}).title || 'Pendiente';
  el.innerHTML = `
    <h3>Resumen de la solicitud</h3>
    <div class="summary-row"><span>Medidas</span><strong>${fmt(state.width)} × ${fmt(state.length)} × ${fmt(state.height)} m</strong></div>
    <div class="summary-row"><span>Instalación</span><strong>${installLabel}</strong></div>
    <div class="summary-row"><span>Hierro</span><strong>${state.iron} · ${state.profile}</strong></div>
    <div class="summary-row"><span>Techo</span><strong>${state.roof}</strong></div>
    <div class="summary-row"><span>Uso principal</span><strong>${useLabel}</strong></div>
    <div class="summary-row"><span>Ubicación</span><strong>${state.contact.location || 'Pendiente'}</strong></div>
  `;
}

// ── LEAD SUBMISSION ───────────────────────────────────────────────────────────
// Replace the body of submitLead() to connect to a real backend.
// Options: fetch to a REST endpoint, Zapier webhook, Google Apps Script,
//          WhatsApp Business API, HubSpot, Mailchimp, etc.

function submitLead() {
  const payload = {
    dimensions:       { width: state.width, length: state.length, height: state.height },
    installationType: state.installationType,
    iron:             { name: state.iron, color: state.ironColor, profile: state.profile },
    roof:             { name: state.roof, key: state.roofKey },
    useType:          state.useType,
    contact:          { ...state.contact },
    submittedAt: new Date().toISOString()
  };

  // TODO: replace with real integration, e.g.:
  // fetch('/api/lead', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  console.log('[Welding Systems] Lead capturado:', JSON.stringify(payload, null, 2));
  return payload;
}

function submitMock() {
  submitLead();
  const toast = $('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}
