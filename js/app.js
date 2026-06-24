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

// ── MOBILE PICTURE-IN-PICTURE VIEWER ─────────────────────────────────────────
// When the user scrolls down on mobile the 3D viewer shrinks to a floating
// corner window so the form is fully readable while changes remain visible live.
//
// Threshold = 12% of viewport height (min 60 px). This is well within the
// actual scrollable range on any phone, so the mini mode is always reachable.

(function initMiniViewer() {
  if (window.innerWidth > 980) return;

  const visual    = document.querySelector('.visual');
  const threshold = Math.max(60, window.innerHeight * 0.12);

  function onScroll() {
    // pageYOffset is the cross-browser fallback for scrollY
    visual.classList.toggle('mini', (window.pageYOffset || window.scrollY) > threshold);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) visual.classList.remove('mini');
  });
})();

// Initialise
syncMeasures();
setStep(1);
