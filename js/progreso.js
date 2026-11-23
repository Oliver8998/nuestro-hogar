export const CASAS = [
  { nombre: 'Piso cutre', icono: '🏚️', precio: 0, acogedor: 0, habitaciones: ['Salón'], suelo: null, pared: 0xb3a78d },
  { nombre: 'Piso reformado', icono: '🏠', precio: 1500, acogedor: 45, habitaciones: ['Salón', 'Dormitorio'], suelo: [0x9c7a55, 0x8f6f4c, 0xa4825c, 0x8a6a48], pared: 0xf3eadb, requisitoReforma: true },
  { nombre: 'Ático con terraza', icono: '🌇', precio: 4000, acogedor: 60, habitaciones: ['Salón', 'Dormitorio', 'Cocina', 'Terraza'], suelo: [0xc9a57a, 0xbf9b70, 0xd2ae84, 0xb8946a], pared: 0xf6efe4 },
  { nombre: 'Casa con jardín', icono: '🏡', precio: 9000, acogedor: 72, habitaciones: ['Salón', 'Dormitorio', 'Cocina', 'Estudio', 'Jardín'], suelo: [0xd9b98c, 0xcfae80, 0xe0c296, 0xc8a678], pared: 0xf8f1e7 },
  { nombre: 'Mansión', icono: '🏰', precio: 20000, acogedor: 85, habitaciones: ['Salón', 'Dormitorio', 'Cocina', 'Estudio', 'Baño', 'Sala de juegos', 'Jardín grande'], suelo: [0x6b4a33, 0x5e4130, 0x75523a, 0x664633], pared: 0xf4ece0 }
];

export const EXTERIORES = {
  Terraza: { tipo: 'terraza', suelo: [0xc9b8a2, 0xbfae98, 0xd2c1ab, 0xb8a790] },
  'Jardín': { tipo: 'jardin', suelo: [0x7cb35a, 0x74ab52, 0x84bb62, 0x6ea34c] },
  'Jardín grande': { tipo: 'jardin', suelo: [0x7cb35a, 0x74ab52, 0x84bb62, 0x6ea34c] }
};

export const COLECCIONES = [
  { id: 'verde', nombre: 'Rincón verde', icono: '🌿', items: ['planta', 'cactus', 'jarron', 'huerto'], premio: { monedas: 150, tickets: 1 } },
  { id: 'dormir', nombre: 'Dormir bien', icono: '🛏️', items: ['cama', 'mesita', 'lampara-mesa', 'alfombra'], premio: { monedas: 200, tickets: 1 } },
  { id: 'salon', nombre: 'Salón de revista', icono: '🛋️', items: ['sofa', 'tele', 'mesa', 'lampara', 'estanteria'], premio: { monedas: 250, tickets: 1 } },
  { id: 'mascotero', nombre: 'Paraíso mascotero', icono: '🐾', items: ['cama-mascota', 'comedero', 'rascador', 'pelota'], premio: { monedas: 200, tickets: 1 } },
  { id: 'gamer', nombre: 'Gamer', icono: '🎮', items: ['arcade', 'ordenador', 'tele', 'puff'], premio: { monedas: 300, tickets: 2 } },
  { id: 'retro', nombre: 'Retro', icono: '📻', items: ['radio', 'lampara-lava', 'globo', 'piano'], premio: { monedas: 400, tickets: 2 } },
  { id: 'navidad', nombre: 'Navidad', icono: '🎄', items: ['arbol-navidad', 'muneco-nieve', 'regalos'], premio: { monedas: 250, tickets: 2 } },
  { id: 'halloween', nombre: 'Halloween', icono: '🎃', items: ['calabaza', 'fantasma', 'caldero'], premio: { monedas: 250, tickets: 2 } },
  { id: 'terraceo', nombre: 'Tardes de terraza', icono: '🌇', items: ['barbacoa', 'tumbona', 'sombrilla', 'maceta-grande'], premio: { monedas: 400, tickets: 2 } },
  { id: 'verano', nombre: 'Verano en el jardín', icono: '🏖️', items: ['columpio', 'piscina-hinchable', 'mesa-picnic'], premio: { monedas: 500, tickets: 2 } },
  { id: 'lujo', nombre: 'Vida de lujo', icono: '💎', items: ['piscina', 'fuente'], premio: { monedas: 800, tickets: 3 } },
  { id: 'amor', nombre: 'San Valentín', icono: '💘', items: ['lampara-corazon', 'rosas', 'cojin-corazon'], premio: { monedas: 250, tickets: 2 } }
];

export const LOGROS = [
  { id: 'cucarachas', icono: '🪳', nombre: 'Adiós, cucarachas', texto: 'Echad a las cucarachas', check: c => c.arreglado('cucarachas') },
  { id: 'reforma', icono: '🔨', nombre: 'Manitas', texto: 'Reformad la primera habitación entera', check: c => c.reformaCompleta() },
  { id: 'muebles10', icono: '🛋️', nombre: 'Casa amueblada', texto: 'Tened 10 muebles colocados', check: c => c.numMuebles() >= 10 },
  { id: 'muebles25', icono: '🏬', nombre: 'Coleccionistas', texto: 'Tened 25 cosas colocadas', check: c => c.numMuebles() >= 25 },
  { id: 'mascota', icono: '🐶', nombre: 'Familia peluda', texto: 'Adoptad una mascota', check: c => c.numMascotas() >= 1 },
  { id: 'mascotas3', icono: '🐾', nombre: 'Zoo casero', texto: 'Tened 3 mascotas', check: c => c.numMascotas() >= 3 },
  { id: 'limpio', icono: '✨', nombre: 'La casa más limpia del mundo', texto: 'Limpieza al 100% con 8 muebles o más', check: c => c.limpieza() >= 100 && c.numMuebles() >= 8 },
  { id: 'limpiar50', icono: '🧹', nombre: 'Escoba de oro', texto: 'Limpiad 50 cosas', check: c => c.stat('limpiar') >= 50 },
  { id: 'cosecha', icono: '🍅', nombre: 'Huerto propio', texto: 'Cosechad por primera vez', check: c => c.stat('cosechar') >= 1 },
  { id: 'trabajo', icono: '💼', nombre: 'Teletrabajo', texto: 'Cobrad 5 jornadas de trabajo', check: c => c.stat('trabajar') >= 5 },
  { id: 'chef', icono: '👩‍🍳', nombre: 'Chef', texto: 'Jugad 10 minijuegos', check: c => c.stat('minijuego') >= 10 },
  { id: 'foto', icono: '🖼️', nombre: 'Recuerdos', texto: 'Colgad 3 fotos o cuadros en la pared', check: c => c.fotosPared() >= 3 },
  { id: 'piano', icono: '🎹', nombre: 'Concierto', texto: 'Tocad el piano', check: c => c.stat('piano') >= 1 },
  { id: 'pareja', icono: '💑', nombre: 'Juntos', texto: 'Conectad vuestros móviles', check: c => c.conPareja() },
  { id: 'acogedor80', icono: '🕯️', nombre: 'Hogar, dulce hogar', texto: 'Llegad a 80 de acogedor', check: c => c.acogedor() >= 80 },
  { id: 'coleccion', icono: '📚', nombre: 'Completistas', texto: 'Completad una colección', check: c => c.colecciones() >= 1 },
  { id: 'colecciones4', icono: '🏆', nombre: 'Museo', texto: 'Completad 4 colecciones', check: c => c.colecciones() >= 4 },
  { id: 'mudanza', icono: '🚚', nombre: '¡Nos mudamos!', texto: 'Mudaos a una casa mejor', check: c => c.nivelCasa() >= 1 },
  { id: 'mansion', icono: '🏰', nombre: 'Vida de lujo', texto: 'Vivid en la mansión', check: c => c.nivelCasa() >= 4 },
  { id: 'racha7', icono: '🔥', nombre: 'Constantes', texto: 'Entrad 7 días seguidos', check: c => c.racha() >= 7 },
  { id: 'ruleta', icono: '🎡', nombre: 'Con suerte', texto: 'Conseguid un objeto legendario', check: c => c.tieneLegendario() },
  { id: 'cocinitas', icono: '🍳', nombre: 'Cocinitas', texto: 'Cocinad vuestro primer plato', check: c => c.stat('cocinar') >= 1 },
  { id: 'colada', icono: '🧺', nombre: 'Día de colada', texto: 'Tended la ropa 5 veces', check: c => c.stat('tender') >= 5 },
  { id: 'reformas', icono: '🪵', nombre: 'Interioristas', texto: 'Cambiad suelo, papel, ventana o luces 5 veces', check: c => c.stat('reformar') >= 5 },
  { id: 'truco', icono: '🎓', nombre: 'Adiestradores', texto: 'Enseñad un truco a una mascota', check: c => c.stat('aprender-truco') >= 1 },
  { id: 'fiesta', icono: '🎉', nombre: 'Anfitriones', texto: 'Montad una fiesta en casa', check: c => c.stat('fiesta') + c.stat('fiesta-perfecta') >= 1 },
  { id: 'visitas', icono: '🏘️', nombre: 'Buenos vecinos', texto: 'Recibid un me gusta de unos amigos', check: c => c.stat('like-recibido') >= 1 },
  { id: 'artistas', icono: '🎨', nombre: 'Artistas', texto: 'Pintad un cuadro', check: c => c.stat('pintar') >= 1 },
  { id: 'galeria', icono: '🖼️', nombre: 'Galería de arte', texto: 'Tened 10 cuadros colgados en casa', check: c => c.fotosPared() >= 10 },
  { id: 'buho', secreto: true, icono: '🦉', nombre: 'Búhos', texto: 'Jugad entre las 3 y las 5 de la madrugada', check: c => c.hora() >= 3 && c.hora() < 5 },
  { id: 'tesoro', secreto: true, icono: '🗺️', nombre: 'Cazatesoros', texto: 'Encontrad un tesoro escondido', check: c => c.stat('tesoro') >= 1 },
  { id: 'gatito', secreto: true, icono: '🐈', nombre: 'Corazón blandito', texto: 'Adoptad al gatito de la puerta', check: c => c.stat('gato-callejero') >= 1 },
  { id: 'nieve', secreto: true, icono: '❄️', nombre: 'Nieva en casa', texto: 'Atrapad los copos de una nevada interior', check: c => c.stat('nieve') >= 1 },
  { id: 'fiesta5', secreto: true, icono: '🪩', nombre: 'Fiestón', texto: 'Una fiesta de 5 estrellas', check: c => c.stat('fiesta-perfecta') >= 1 },
  { id: 'chef10', secreto: true, icono: '👨‍🍳', nombre: 'Estrella Michelin', texto: 'Cocinad 15 platos', check: c => c.stat('cocinar') >= 15 },
  { id: 'campeones', secreto: true, icono: '🏅', nombre: 'Campeones', texto: 'Ganad 3 concursos de mascotas', check: c => c.stat('concurso-ganado') >= 3 },
  { id: 'circo', secreto: true, icono: '🎪', nombre: 'El gran circo', texto: 'Una mascota que sepa todos los trucos', check: c => c.trucosMax() >= 6 },
  { id: 'achuchones', secreto: true, icono: '🫶', nombre: 'Achuchones', texto: 'Dad 300 mimos', check: c => c.stat('mimos') >= 300 },
  { id: 'famosos', secreto: true, icono: '🌟', nombre: 'Famosos', texto: 'Recibid 10 me gusta', check: c => c.stat('like-recibido') >= 10 },
  { id: 'familia', secreto: true, icono: '🐣', nombre: 'Familia numerosa', texto: 'Que nazca una cría', check: c => c.stat('cria') >= 1 },
  { id: 'fotografos', secreto: true, icono: '📸', nombre: 'Fotógrafos', texto: 'Editad 5 fotos con filtros o pegatinas', check: c => c.stat('foto-editada') >= 5 },
  { id: 'reyes', secreto: true, icono: '👑', nombre: 'Reyes del barrio', texto: 'Quedad primeros en el ranking de amigos', check: c => c.stat('ranking-primero') >= 1 }
];

const LUCES = ['lampara', 'lampara-mesa', 'lampara-lava', 'arbol-navidad', 'calabaza', 'lampara-corazon', 'acuario', 'chimenea'];
const PLANTAS = ['planta', 'cactus', 'jarron', 'cerezo', 'huerto', 'rosas'];
const ASIENTOS = ['sofa', 'silla', 'puff', 'puff-corazon', 'sillon-huevo', 'cama'];
const TEXTILES = ['alfombra', 'cojin-corazon', 'peluche', 'cama'];

export function calcularAcogedor({ muebles, limpieza, paredesPintadas, fotos, mascotas, noche, extras = [] }) {
  const ids = muebles.map(m => m.userData.def.id);
  const tiene = lista => ids.filter(id => lista.includes(id)).length;
  const lucesEncendidas = muebles.filter(m => LUCES.includes(m.userData.def.id) && m.userData.encendido).length;
  const partes = [
    { texto: 'Muebles', valor: Math.min(20, ids.length * 2), max: 20, consejo: 'Poned más muebles y deco' },
    { texto: 'Plantas', valor: Math.min(12, tiene(PLANTAS) * 4), max: 12, consejo: 'Un par de plantas dan vida' },
    { texto: 'Luz cálida', valor: Math.min(12, (noche ? lucesEncendidas : tiene(LUCES)) * 6), max: 12, consejo: noche ? 'Encended alguna lámpara' : 'Poned alguna lámpara' },
    { texto: 'Dónde sentarse', valor: Math.min(10, tiene(ASIENTOS) * 5), max: 10, consejo: 'Un sofá o unos pufs' },
    { texto: 'Textiles', valor: Math.min(8, tiene(TEXTILES) * 4), max: 8, consejo: 'Alfombras y cojines' },
    { texto: 'Paredes pintadas', valor: paredesPintadas * 3, max: 12, consejo: 'Pintad las paredes' },
    { texto: 'Fotos vuestras', valor: Math.min(8, fotos * 4), max: 8, consejo: 'Colgad fotos en la pared' },
    { texto: 'Mascotas', valor: Math.min(6, mascotas * 3), max: 6, consejo: 'Adoptad una mascota' },
    { texto: 'Limpieza', valor: Math.round(limpieza / 100 * 12), max: 12, consejo: 'Limpiad la suciedad' },
    ...extras
  ];
  const total = Math.min(100, partes.reduce((a, p) => a + p.valor, 0));
  return { total, partes };
}

export function coleccionesCompletas(idsEnCasa) {
  return COLECCIONES.filter(c => c.items.every(id => idsEnCasa.includes(id)));
}
