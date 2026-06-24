// Editable configuration data — change options here without touching logic files.

const STEPS_CONFIG = {
  1: ['Medidas de la pérgola',  'Empieza por las medidas aproximadas. No hace falta que sean exactas al milímetro; luego se revisan en llamada o visita técnica.'],
  2: ['Elegir el hierro',       'Selecciona el acabado visual de la estructura. La pérgola cambia de color en la vista para enseñar el resultado de forma rápida.'],
  3: ['Elegir el techo',        'Elige el tipo de cubierta. La parte superior y el interior cambian para simular el material seleccionado.'],
  4: ['Datos de contacto',      'Deja los datos para que el equipo pueda revisar la configuración y preparar un presupuesto personalizado.']
};

// Iron / steel finish options.
// imagePath: set to a relative path like 'assets/images/irons/negro-brillo.png' once images are uploaded.
// The card will show the image instead of the colour swatch when imagePath is not null.
const IRONS = [
  { name: 'Negro brillo',  desc: 'Acabado premium y contundente.',  color: '#070809', profile: '100×100 mm', imagePath: null },
  { name: 'Negro mate',    desc: 'Más sobrio, moderno y elegante.', color: '#111416', profile: '100×100 mm', imagePath: null },
  { name: 'Antracita',     desc: 'Gris oscuro técnico y limpio.',   color: '#30383a', profile: '100×100 mm', imagePath: null },
  { name: 'Efecto corten', desc: 'Industrial cálido con carácter.', color: '#8a4c2e', profile: '120×120 mm', imagePath: null }
];

// Roof / cover options.
// imagePath: set to a relative path like 'assets/images/roofs/panel-sandwich.png' once images are uploaded.
const ROOFS = [
  { name: 'Panel sándwich pizarra', key: 'panel', desc: 'Cubierta sólida y discreta.',  color: '#2c3031', slope: 0.12, imagePath: null },
  { name: 'PVC imitación madera',   key: 'wood',  desc: 'Interior cálido tipo chill out.', color: '#866340', slope: 0.10, imagePath: null },
  { name: 'Policarbonato',          key: 'poly',  desc: 'Ligero, luminoso y funcional.', color: '#aeb8b5', slope: 0.08, imagePath: null },
  { name: 'Lamas de aluminio',      key: 'slats', desc: 'Aspecto más arquitectónico.',   color: '#3b4243', slope: 0.06, imagePath: null }
];
