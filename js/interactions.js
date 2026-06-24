// Canvas interaction events: drag to orbit, pinch to zoom, scroll wheel, double-click reset.
// Depends on: utils.js (clamp), state.js (state), renderer.js (canvas)

const ZOOM_MIN = 0.38;
const ZOOM_MAX = 3.2;

// Predefined camera angles for the three quick-view buttons (step 1 only)
const PRESET_VIEWS = {
  front: { yaw:  0,            pitch: -0.18, zoom: 1 },
  side:  { yaw:  Math.PI / 2,  pitch: -0.18, zoom: 1 },
  iso:   { yaw: -0.72,         pitch: -0.62, zoom: 1 }
};

let isDragging    = false;
let dragPointerId = null;
let lastPos       = { x: 0, y: 0 };
let pinchStartDist = 0;
let pinchStartZoom = 1;
const activePointers = new Map();

function getDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function resetView() {
  state.targetYaw   = PRESET_VIEWS.iso.yaw;
  state.targetPitch = PRESET_VIEWS.iso.pitch;
  state.targetZoom  = PRESET_VIEWS.iso.zoom;
  // Reflect active state on buttons
  document.querySelectorAll('[data-view]').forEach(b =>
    b.classList.toggle('active', b.dataset.view === 'iso')
  );
}

// ── POINTER EVENTS (orbit + pinch zoom) ──────────────────────────────────────

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (activePointers.size === 1) {
    isDragging    = true;
    dragPointerId = e.pointerId;
    lastPos       = { x: e.clientX, y: e.clientY };
    canvas.classList.add('dragging');
  } else if (activePointers.size === 2) {
    const pts = [...activePointers.values()];
    pinchStartDist = getDistance(pts[0], pts[1]);
    pinchStartZoom = state.targetZoom;
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activePointers.size === 2) {
    const pts  = [...activePointers.values()];
    const dist = getDistance(pts[0], pts[1]);
    if (pinchStartDist) state.targetZoom = clamp(pinchStartZoom * (dist / pinchStartDist), ZOOM_MIN, ZOOM_MAX);
    return;
  }

  if (!isDragging || dragPointerId !== e.pointerId) return;
  const dx = e.clientX - lastPos.x;
  const dy = e.clientY - lastPos.y;
  lastPos = { x: e.clientX, y: e.clientY };
  state.targetYaw  += dx * 0.0095;
  state.targetPitch = clamp(state.targetPitch + dy * 0.0065, -1.18, 0);
});

function endPointer(e) {
  activePointers.delete(e.pointerId);
  if (e.pointerId === dragPointerId) {
    isDragging    = false;
    dragPointerId = null;
    canvas.classList.remove('dragging');
  }
  if (activePointers.size === 1) {
    const remaining = [...activePointers.entries()][0];
    dragPointerId = remaining[0];
    lastPos       = remaining[1];
    isDragging    = true;
  }
  if (activePointers.size < 2) pinchStartDist = 0;
}

canvas.addEventListener('pointerup',     endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave',  (e) => { if (!activePointers.has(e.pointerId)) return; endPointer(e); });
canvas.addEventListener('dblclick',      resetView);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  state.targetZoom = clamp(state.targetZoom - Math.sign(e.deltaY) * 0.12, ZOOM_MIN, ZOOM_MAX);
}, { passive: false });

// ── PREDEFINED VIEW BUTTONS (step 1) ─────────────────────────────────────────

document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = PRESET_VIEWS[btn.dataset.view];
    if (!v) return;
    state.targetYaw   = v.yaw;
    state.targetPitch = v.pitch;
    state.targetZoom  = v.zoom;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
