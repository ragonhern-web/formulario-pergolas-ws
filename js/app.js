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

// ── MÓVIL: reducción progresiva del visor al hacer scroll ────────────────────
// En paso 1: interpolación continua 54vh → 36vh en los primeros 160px de scroll.
// En pasos 2+: siempre 36vh independientemente del scroll.
// JS escribe --visual-h en :root y CSS lo aplica al visual y al spacer.

let _vizRafPending = false;

function applyVisualSize() {
  if (window.innerWidth > 980) {
    document.documentElement.style.removeProperty('--visual-h');
    return;
  }
  const maxH    = window.innerHeight * 0.54;
  const minH    = window.innerHeight * 0.36;
  const scrollY = window.pageYOffset || window.scrollY;
  let h;
  if (state.step > 1) {
    h = minH;
  } else {
    const t = Math.min(Math.max(scrollY, 0) / 160, 1);
    h = maxH - (maxH - minH) * t;
  }
  document.documentElement.style.setProperty('--visual-h', Math.round(h) + 'px');
  _vizRafPending = false;
}

(function initVisualResize() {
  if (window.innerWidth > 980) return;
  applyVisualSize(); // valor inicial
  window.addEventListener('scroll', () => {
    if (!_vizRafPending) {
      _vizRafPending = true;
      requestAnimationFrame(applyVisualSize);
    }
  }, { passive: true });
  window.addEventListener('resize', applyVisualSize);
})();

// Initialise
syncMeasures();
setStep(1);
