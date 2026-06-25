// Form step logic, card renderers, summary, and lead submission.
// Depends on: utils.js ($, clamp, fmt), state.js, data.js (IRONS, ROOFS, STEPS_CONFIG)

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

function setStep(step) {
  state.step = Math.max(1, Math.min(4, step));
  document.querySelectorAll('.step').forEach(el => el.classList.add('hidden'));
  document.querySelector(`.step-${state.step}`).classList.remove('hidden');
  $('stepTitle').textContent  = STEPS_CONFIG[state.step][0];
  $('stepLead').textContent   = STEPS_CONFIG[state.step][1];
  $('stepNumber').textContent = state.step;
  $('backBtn').disabled       = state.step === 1;
  $('nextBtn').textContent    = state.step === 4 ? 'Enviar solicitud' : 'Continuar';
  document.querySelectorAll('.step-dot').forEach((dot, i) => dot.classList.toggle('active', i < state.step));
  if (state.step === 2) renderIronCards();
  if (state.step === 3) renderRoofCards();
  updateSummary();
  applyStepCamera(state.step);
  // Móvil: encoger visor si hace falta y scroll al inicio del panel del nuevo paso
  if (window.innerWidth <= 980) {
    if (typeof applyVisualSize === 'function') applyVisualSize();
    // Esperamos un frame para que el layout recalcule --visual-h antes de medir
    requestAnimationFrame(() => {
      const visual = document.querySelector('.visual');
      const panel  = document.querySelector('.panel');
      if (!panel) return;
      const visualH = visual ? visual.getBoundingClientRect().height : 0;
      // Scrollear justo hasta donde el panel empieza a quedar visible bajo el visor
      window.scrollTo({ top: Math.max(0, panel.offsetTop - visualH), behavior: 'smooth' });
    });
  }
}

function applyStepCamera(step) {
  const cam = STEP_CAMERAS[step];
  if (!cam) return;
  state.viewMode    = cam.name;
  state.targetYaw   = cam.yaw;
  state.targetPitch = cam.pitch;
  state.targetZoom  = cam.zoom;
  if (cam.focus) {
    setCameraFocus(cam.focus);
  } else {
    resetCameraFocus();
  }
  updateViewButtons();
  // Paso 1 = vista isométrica: marcar el botón iso como activo
  if (step === 1) {
    const isoBtn = document.querySelector('[data-view="iso"]');
    if (isoBtn) isoBtn.classList.add('active');
  }
}

function updateSummary() {
  const el = $('summary');
  if (!el) return;
  el.innerHTML = `
    <h3>Resumen de la solicitud</h3>
    <div class="summary-row"><span>Medidas</span><strong>${fmt(state.width)} × ${fmt(state.length)} × ${fmt(state.height)} m</strong></div>
    <div class="summary-row"><span>Hierro</span><strong>${state.iron} · ${state.profile}</strong></div>
    <div class="summary-row"><span>Techo</span><strong>${state.roof}</strong></div>
    <div class="summary-row"><span>Ubicación</span><strong>${state.contact.location || 'Pendiente'}</strong></div>
  `;
}

// ── LEAD SUBMISSION ───────────────────────────────────────────────────────────
// Replace the body of submitLead() to connect to a real backend.
// Options: fetch to a REST endpoint, Zapier webhook, Google Apps Script,
//          WhatsApp Business API, HubSpot, Mailchimp, etc.

function submitLead() {
  const payload = {
    dimensions: { width: state.width, length: state.length, height: state.height },
    iron:       { name: state.iron, color: state.ironColor, profile: state.profile },
    roof:       { name: state.roof, key: state.roofKey },
    contact:    { ...state.contact },
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
