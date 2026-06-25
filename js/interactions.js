// Canvas interaction events: drag to orbit, pinch to zoom, scroll wheel, double-click reset.
// Depends on: utils.js (clamp), state.js (state), renderer.js (canvas)

let isDragging    = false;
let dragPointerId = null;
let lastPos       = { x: 0, y: 0 };
let pinchStartDist = 0;
let pinchStartZoom = 1;
const activePointers = new Map();

function getDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function resetView() {
  state.targetYaw   = -0.72;
  state.targetPitch = -0.62;
  state.targetZoom  = 1;
}

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
    if (pinchStartDist) state.targetZoom = clamp(pinchStartZoom * (dist / pinchStartDist), 0.72, 1.48);
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
  state.targetZoom = clamp(state.targetZoom - Math.sign(e.deltaY) * 0.08, 0.72, 1.48);
}, { passive: false });
