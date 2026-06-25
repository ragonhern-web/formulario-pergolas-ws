// Bootstrap — wires up event listeners and initialises the UI.
// All modules (utils, state, data, renderer, form, interactions, validation) are already loaded.

// Dimension sliders and number inputs (step 1)
[['width', 2, 12], ['length', 2, 12], ['height', 2.2, 4.5]].forEach(([key, min, max]) => {
  const range = $(`${key}Range`), input = $(`${key}Input`);
  [range, input].forEach(el => el.addEventListener('input', () => {
    state[key] = clamp(el.value, min, max);
    syncMeasures();
  }));
});

// Quick-size preset chips (step 1)
document.querySelectorAll('[data-preset]').forEach(btn => {
  btn.addEventListener('click', () => {
    const [w, l, h] = btn.dataset.preset.split(',').map(Number);
    state.width = w; state.length = l; state.height = h;
    document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    syncMeasures();
  });
});

// Step navigation
$('backBtn').addEventListener('click', () => setStep(state.step - 1));
$('nextBtn').addEventListener('click', () => {
  if (state.step < 4) {
    setStep(state.step + 1);
  } else {
    if (validateStep(4)) submitMock();
  }
});

// Contact fields (step 4) — sync to state and clear validation errors as user types
['name', 'phone', 'email', 'location', 'notes'].forEach(id => {
  $(id).addEventListener('input', () => {
    state.contact[id] = $(id).value;
    clearValidation();
    updateSummary();
  });
});

// ── MÓVIL: reducir visor al hacer scroll o en pasos 2+ ───────────────────────
// Compact = scroll > 40px O paso actual > 1. setStep() también lo llama.
function updateCompactState() {
  if (window.innerWidth > 980) { document.body.classList.remove('visual-compact'); return; }
  const scrolled = (window.pageYOffset || window.scrollY) > 40;
  document.body.classList.toggle('visual-compact', scrolled || state.step > 1);
}

(function initCompactVisual() {
  if (window.innerWidth > 980) return;
  window.addEventListener('scroll', updateCompactState, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) document.body.classList.remove('visual-compact');
    else updateCompactState();
  });
})();

// Initialise
syncMeasures();
setStep(1);
