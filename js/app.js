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
// .visual is always position:fixed on mobile; .visual-spacer holds layout space.
// When the spacer scrolls out of view (user reads the form), body.pip-active
// shrinks the viewer to a floating corner. State is driven by IntersectionObserver,
// NOT by scroll arithmetic — PiP never interferes with step logic (state.step).

function updateMobilePipState() {
  if (window.innerWidth > 980) {
    document.body.classList.remove('pip-active', 'pip-expanded', 'pip-minimized');
    return;
  }
  requestAnimationFrame(resizeCanvas);
}

(function initMobilePip() {
  if (window.innerWidth > 980) return;

  const spacer      = document.querySelector('.visual-spacer');
  const expandBtn   = document.getElementById('expandPipBtn');
  const minimizeBtn = document.getElementById('minimizePipBtn');

  function activatePip(on) {
    if (on) {
      document.body.classList.add('pip-active');
      document.body.classList.remove('pip-minimized');
    } else {
      document.body.classList.remove('pip-active', 'pip-expanded', 'pip-minimized');
    }
    requestAnimationFrame(resizeCanvas);
  }

  // Primary: IntersectionObserver on spacer. When spacer exits viewport → PiP on.
  if (spacer && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      if (window.innerWidth > 980) { activatePip(false); return; }
      activatePip(!entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(spacer);
  } else if (spacer) {
    // Fallback: scroll listener
    function checkScroll() {
      if (window.innerWidth > 980) { activatePip(false); return; }
      activatePip(spacer.getBoundingClientRect().bottom < 80);
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  // Expand/collapse the PiP to a wider panel
  if (expandBtn) {
    expandBtn.addEventListener('click', () => {
      document.body.classList.toggle('pip-expanded');
      requestAnimationFrame(resizeCanvas);
    });
  }

  // Minimizar: visually hides the PiP (canvas keeps rendering)
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      document.body.classList.toggle('pip-minimized');
      requestAnimationFrame(resizeCanvas);
    });
  }

  // On desktop resize: clean up all PiP classes
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) {
      document.body.classList.remove('pip-active', 'pip-expanded', 'pip-minimized');
      requestAnimationFrame(resizeCanvas);
    }
  });
})();

// Initialise
syncMeasures();
setStep(1);
