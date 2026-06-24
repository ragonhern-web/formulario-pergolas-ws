// Shared utility functions — loaded first, available globally

const $ = (id) => document.getElementById(id);

const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));

const fmt = (v) => Number(v).toFixed(1).replace('.', ',');

const lerp = (a, b, t) => a + (b - a) * t;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Returns a lighter or darker shade of a hex color by an integer amount (positive = lighter)
function shade(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${clamp(r + amt, 0, 255)},${clamp(g + amt, 0, 255)},${clamp(b + amt, 0, 255)})`;
}
