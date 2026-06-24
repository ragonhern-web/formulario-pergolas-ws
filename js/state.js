// Single source of truth for the configurator.
// All modules read from and write to this object — never duplicate values.

const state = {
  step: 1,

  // Dimensions (metres)
  width:  3,
  length: 4,
  height: 2.7,

  // Iron finish
  iron:      'Negro brillo',
  ironColor: '#0b0d0e',
  profile:   '100×100 mm',

  // Roof / cover
  roof:      'Panel sándwich pizarra',
  roofKey:   'panel',
  roofColor: '#2c3031',
  slope:     0.12,

  // Camera state (radians / scale)
  yaw:         -0.72,
  targetYaw:   -0.72,
  pitch:       -0.62,
  targetPitch: -0.62,
  zoom:         1,
  targetZoom:   1,

  // Contact form values
  contact: {}
};

// Smoothly interpolated display values used by the renderer so changes animate gradually
const display = {
  width:  state.width,
  length: state.length,
  height: state.height,
  slope:  state.slope
};
