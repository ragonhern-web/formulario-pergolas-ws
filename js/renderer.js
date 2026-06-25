// 3D canvas renderer — projection, drawing primitives, and the animation loop.
// Depends on: utils.js (clamp, lerp, fmt, shade, hexToRgb), state.js (state, display)

const canvas = $('pergolaCanvas');
const ctx    = canvas.getContext('2d');
const DPR    = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

// Safari < 15.4 polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.round(rect.width  * DPR);
  canvas.height = Math.round(rect.height * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── PROJECTION ────────────────────────────────────────────────────────────────

function getProjector(w, h) {
  const cosy = Math.cos(state.yaw),   siny = Math.sin(state.yaw);
  const cosp = Math.cos(state.pitch), sinp = Math.sin(state.pitch);
  const maxDim  = Math.max(display.width, display.length, display.height) + 2.4;
  const camDist = maxDim * 2.65;
  const focal   = Math.min(w, h) * 1.18 * state.zoom;
  const origin  = { x: w * 0.50, y: h * 0.61 };

  return function project(pt) {
    const px = pt.x - state.focusX;
    const py = pt.y - state.focusY;
    const pz = pt.z - state.focusZ;
    const x1 = px * cosy - pz * siny;
    const z1 = px * siny + pz * cosy;
    const y2 = py * cosp - z1 * sinp;
    const z2 = py * sinp + z1 * cosp;
    const cz = z2 + camDist;
    const s  = focal / cz;
    return { x: origin.x + x1 * s, y: origin.y - y2 * s, depth: cz, scale: s };
  };
}

// ── DRAWING PRIMITIVES ────────────────────────────────────────────────────────

function _beginPath(points) {
  ctx.beginPath();
  points.forEach((pt, i) => i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y));
  ctx.closePath();
}

function drawPoly(points, fill, stroke = 'rgba(255,255,255,.08)', lw = 1) {
  _beginPath(points);
  ctx.fillStyle   = fill;   ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

function line(a, b, color = 'rgba(255,255,255,.20)', lw = 1) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
}

function roundedLabel(label, pt) {
  ctx.save();
  ctx.font = '900 12px Inter, system-ui, sans-serif';
  const padX = 10, tw = ctx.measureText(label).width, bw = tw + padX * 2, bh = 28;
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  ctx.beginPath(); ctx.roundRect(pt.x - bw / 2, pt.y - bh / 2, bw, bh, 14); ctx.fill();
  ctx.fillStyle = '#050707'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, pt.x, pt.y + 1);
  ctx.restore();
}

// ── SCENE ELEMENTS ────────────────────────────────────────────────────────────

function drawGroundGrid(project) {
  ctx.save();
  ctx.globalAlpha = 0.44;
  for (let i = -9; i <= 9; i++) {
    line(project({ x: i,  y: 0, z: -9 }), project({ x: i,  y: 0, z:  9 }), 'rgba(255,255,255,.028)', 1);
    line(project({ x: -9, y: 0, z:  i }), project({ x:  9, y: 0, z:  i }), 'rgba(255,255,255,.028)', 1);
  }
  ctx.restore();
}

function drawDimension(project, from, to, label, offset = { x: 0, y: 0 }) {
  const a  = project(from), b = project(to);
  const ao = { x: a.x + offset.x, y: a.y + offset.y };
  const bo = { x: b.x + offset.x, y: b.y + offset.y };
  line(ao, bo, 'rgba(255,255,255,.42)', 1.4);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.42)';
  [ao, bo].forEach(pt => { ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
  roundedLabel(label, { x: (ao.x + bo.x) / 2, y: (ao.y + bo.y) / 2 - 15 });
}

// Stick-figure human at 1.80 m — provides scale reference in the scene
function drawPersonSilhouette(project, base = { x: 0, y: 0, z: 0 }, height = 1.8) {
  const color = 'rgba(255,255,255,.74)';
  const soft  = 'rgba(255,255,255,.22)';
  const footL = project({ x: base.x - 0.10, y: 0,            z: base.z });
  const footR = project({ x: base.x + 0.10, y: 0,            z: base.z });
  const kneeL = project({ x: base.x - 0.06, y: height * .42, z: base.z + .01 });
  const kneeR = project({ x: base.x + 0.06, y: height * .42, z: base.z + .01 });
  const hip   = project({ x: base.x,        y: height * .55, z: base.z });
  const chest = project({ x: base.x,        y: height * .79, z: base.z });
  const head  = project({ x: base.x,        y: height * .93, z: base.z });
  const armL  = project({ x: base.x - 0.18, y: height * .62, z: base.z + .02 });
  const armR  = project({ x: base.x + 0.18, y: height * .62, z: base.z + .02 });
  const shadow = [
    project({ x: base.x - .25, y: 0, z: base.z - .20 }),
    project({ x: base.x + .25, y: 0, z: base.z - .20 }),
    project({ x: base.x + .18, y: 0, z: base.z + .24 }),
    project({ x: base.x - .18, y: 0, z: base.z + .24 })
  ];
  drawPoly(shadow, 'rgba(255,255,255,.03)', 'rgba(255,255,255,.02)', 1);
  line(footL, kneeL, soft, 9);  line(footR, kneeR, soft, 9);
  line(kneeL, hip,   soft, 10); line(kneeR, hip,   soft, 10);
  line(hip,   chest, soft, 12); line(armL,  chest, soft, 8); line(armR, chest, soft, 8);
  line(footL, kneeL, color, 4.5); line(footR, kneeR, color, 4.5);
  line(kneeL, hip,   color, 5);   line(kneeR, hip,   color, 5);
  line(hip,   chest, color, 5.5); line(armL,  chest, color, 3.6); line(armR, chest, color, 3.6);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.beginPath(); ctx.arc(head.x, head.y, Math.max(5, head.scale * 0.12), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  roundedLabel('1,80 m', { x: head.x, y: head.y - 26 });
}

// Draws a structural post with three visibility modes:
//   front  → fully opaque (posts in front of the roof)
//   rear   → semi-transparent (posts behind the roof)
//   hidden → dashed line (portion covered by the roof panel)
function drawPostLine(project, start3, end3, color, mode = 'front') {
  const a = project(start3), b = project(end3);
  if (mode === 'hidden') {
    ctx.save(); ctx.setLineDash([8, 8]);
    line(a, b, 'rgba(255,255,255,.24)', 3);
    ctx.restore(); return;
  }
  if (mode === 'rear') {
    const c = color.startsWith('#') ? hexToRgb(color) : null;
    const baseRear = c ? `rgba(${c.r},${c.g},${c.b},0.38)` : 'rgba(255,255,255,.38)';
    const glowRear = shade(color, 28).replace('rgb(', 'rgba(').replace(')', ',0.28)');
    line(a, b, glowRear, 10); line(a, b, baseRear, 6); return;
  }
  line(a, b, shade(color, 32), 10);
  line(a, b, color, 6);
}

// ── MAIN DRAW LOOP ────────────────────────────────────────────────────────────

function drawPergola() {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width, h = rect.height;
  ctx.clearRect(0, 0, w, h);

  // Animate display values towards state targets
  display.width  = lerp(display.width,  state.width,        0.11);
  display.length = lerp(display.length, state.length,       0.11);
  display.height = lerp(display.height, state.height,       0.11);
  display.slope  = lerp(display.slope,  state.slope,        0.11);
  state.yaw      = lerp(state.yaw,      state.targetYaw,    0.16);
  state.targetPitch = clamp(state.targetPitch, -1.18, 0);
  state.pitch    = lerp(state.pitch,    state.targetPitch,  0.16);
  state.zoom     = lerp(state.zoom,     state.targetZoom,   0.16);
  state.focusX   = lerp(state.focusX,   state.targetFocusX, 0.14);
  state.focusY   = lerp(state.focusY,   state.targetFocusY, 0.14);
  state.focusZ   = lerp(state.focusZ,   state.targetFocusZ, 0.14);

  const project = getProjector(w, h);
  const W = display.width, L = display.length, H = display.height;
  const over = 0.34, t = 0.24, slope = display.slope;
  const iron = state.ironColor, roof = state.roofColor;

  drawGroundGrid(project);

  // Ground shadow plane
  const floor = [
    project({ x: -W/2-.9, y: 0, z: -L/2-.9 }),
    project({ x:  W/2+.9, y: 0, z: -L/2-.9 }),
    project({ x:  W/2+.9, y: 0, z:  L/2+.9 }),
    project({ x: -W/2-.9, y: 0, z:  L/2+.9 })
  ];
  drawPoly(floor, 'rgba(255,255,255,.022)', 'rgba(255,255,255,.05)', 1);

  const corners = {
    fl: { x: -W/2+.18, z:  L/2-.18 },
    fr: { x:  W/2-.18, z:  L/2-.18 },
    br: { x:  W/2-.18, z: -L/2+.18 },
    bl: { x: -W/2+.18, z: -L/2+.18 }
  };

  const yBack  = H + slope;
  const yFront = H - slope;
  const roof3d = {
    btl: { x: -W/2-over, y: yBack +t, z: -L/2-over },
    btr: { x:  W/2+over, y: yBack +t, z: -L/2-over },
    ftr: { x:  W/2+over, y: yFront+t, z:  L/2+over },
    ftl: { x: -W/2-over, y: yFront+t, z:  L/2+over },
    bbl: { x: -W/2-over, y: yBack,    z: -L/2-over },
    bbr: { x:  W/2+over, y: yBack,    z: -L/2-over },
    fbr: { x:  W/2+over, y: yFront,   z:  L/2+over },
    fbl: { x: -W/2-over, y: yFront,   z:  L/2+over }
  };

  // Roof faces — sorted back-to-front so closer faces paint over farther ones
  const faces = [
    { pts: [roof3d.bbl, roof3d.bbr, roof3d.fbr, roof3d.fbl], fill: shade(roof,-28), stroke: 'rgba(255,255,255,.10)' },
    { pts: [roof3d.btl, roof3d.btr, roof3d.ftr, roof3d.ftl], fill: roof,            stroke: 'rgba(255,255,255,.15)' },
    { pts: [roof3d.fbl, roof3d.fbr, roof3d.ftr, roof3d.ftl], fill: shade(roof,-18), stroke: 'rgba(255,255,255,.10)' },
    { pts: [roof3d.bbr, roof3d.btr, roof3d.ftr, roof3d.fbr], fill: shade(roof,-38), stroke: 'rgba(255,255,255,.10)' },
    { pts: [roof3d.bbl, roof3d.btl, roof3d.ftl, roof3d.fbl], fill: shade(roof,-30), stroke: 'rgba(255,255,255,.06)' },
    { pts: [roof3d.bbl, roof3d.bbr, roof3d.btr, roof3d.btl], fill: shade(roof,-24), stroke: 'rgba(255,255,255,.06)' }
  ].map(face => {
    const projected = face.pts.map(project);
    const depth = projected.reduce((acc, p) => acc + p.depth, 0) / projected.length;
    return { ...face, projected, depth };
  }).sort((a, b) => b.depth - a.depth);

  // Posts — sorted so farther ones draw first
  const posts = [
    { base: { x: corners.fl.x, y: 0, z: corners.fl.z }, top: { x: corners.fl.x, y: H, z: corners.fl.z }, attachY: yFront },
    { base: { x: corners.fr.x, y: 0, z: corners.fr.z }, top: { x: corners.fr.x, y: H, z: corners.fr.z }, attachY: yFront },
    { base: { x: corners.br.x, y: 0, z: corners.br.z }, top: { x: corners.br.x, y: H, z: corners.br.z }, attachY: yBack  },
    { base: { x: corners.bl.x, y: 0, z: corners.bl.z }, top: { x: corners.bl.x, y: H, z: corners.bl.z }, attachY: yBack  }
  ].map(post => {
    const a = project(post.base), b = project(post.top);
    const depth = (a.depth + b.depth) / 2;
    // The section of the post hidden under the roof starts where the roof meets the column
    const hiddenStart = { x: post.base.x, y: Math.max(H * 0.66, post.attachY - 0.30), z: post.base.z };
    return { ...post, depth, hiddenStart };
  }).sort((a, b) => b.depth - a.depth);

  const rearPosts  = posts.slice(0, 2);
  const frontPosts = posts.slice(2);

  // Draw order: rear posts → roof faces → hidden-post hint → front posts → trim
  rearPosts.forEach(post => drawPostLine(project, post.base, post.top, iron, 'rear'));
  faces.forEach(face => drawPoly(face.projected, face.fill, face.stroke, 1));

  // Roof-surface details per material
  if (state.roofKey === 'wood' || state.roofKey === 'slats') {
    const count = state.roofKey === 'wood' ? 9 : 12;
    for (let i = 1; i < count; i++) {
      const x = -W/2 - over + (W + over*2) * i / count;
      line(
        project({ x, y: yBack  + .02, z: -L/2 - over }),
        project({ x, y: yFront + .02, z:  L/2 + over }),
        state.roofKey === 'wood' ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.24)', 1.1
      );
    }
  }
  if (state.roofKey === 'poly') {
    ctx.save(); ctx.globalAlpha = 0.18;
    drawPoly(
      [project(roof3d.bbl), project(roof3d.bbr), project(roof3d.fbr), project(roof3d.fbl)],
      'rgba(220,255,255,.34)', 'rgba(255,255,255,.18)', 1
    );
    ctx.restore();
  }

  // Dashed hint for the portion of rear posts hidden behind the roof
  rearPosts.forEach(post => drawPostLine(project, post.hiddenStart, post.top, iron, 'hidden'));

  // LED strip accent lines along front beam and right lateral
  if (state.roofKey !== 'poly') {
    line(project({ x: -W/2-.14, y: yFront+.04, z:  L/2+.18 }), project({ x:  W/2+.14, y: yFront+.04, z:  L/2+.18 }), 'rgba(255,245,196,.94)', 3);
    line(project({ x:  W/2+.16, y: yBack +.04, z: -L/2+.10 }), project({ x:  W/2+.16, y: yFront+.04, z:  L/2+.18 }), 'rgba(255,245,196,.74)', 2.2);
  }

  frontPosts.forEach(post => drawPostLine(project, post.base, post.top, iron, 'front'));

  // Roof frame edge lines
  [
    [roof3d.bbl, roof3d.bbr], [roof3d.bbr, roof3d.fbr], [roof3d.fbr, roof3d.fbl], [roof3d.fbl, roof3d.bbl],
    [roof3d.btl, roof3d.btr], [roof3d.btr, roof3d.ftr], [roof3d.ftr, roof3d.ftl], [roof3d.ftl, roof3d.btl]
  ].forEach(([a, b]) => line(project(a), project(b), 'rgba(255,255,255,.12)', 1));

  drawPersonSilhouette(project, { x: -W/2 - 0.95, y: 0, z: L/2 + 0.42 }, 1.8);

  drawDimension(project, { x: -W/2,       y: 0, z:  L/2+.86 }, { x:  W/2,       y: 0, z:  L/2+.86 }, `${fmt(state.width)} m ancho`,  { x:  0, y: 26 });
  drawDimension(project, { x:  W/2+.76,   y: 0, z: -L/2     }, { x:  W/2+.76,   y: 0, z:  L/2     }, `${fmt(state.length)} m largo`, { x: 36, y:  0 });
  drawDimension(project, { x: -W/2-.68,   y: 0, z: -L/2-.68 }, { x: -W/2-.68,   y: H, z: -L/2-.68 }, `${fmt(state.height)} m alto`,  { x:-26, y:  0 });

  requestAnimationFrame(drawPergola);
}

requestAnimationFrame(drawPergola);
