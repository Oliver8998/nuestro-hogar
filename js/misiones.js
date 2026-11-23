export const DIARIAS = [
  { id: 'limpiar', texto: 'Limpia 3 cosas sucias', evento: 'limpiar', meta: 3, premio: { monedas: 30 } },
  { id: 'colocar', texto: 'Coloca 2 objetos en casa', evento: 'colocar', meta: 2, premio: { monedas: 20 } },
  { id: 'pedido', texto: 'Haz un pedido a Pilar', evento: 'pedido', meta: 1, premio: { monedas: 15 } },
  { id: 'ruleta', texto: 'Gira la ruleta', evento: 'ruleta', meta: 1, premio: { monedas: 15 } },
  { id: 'paquete', texto: 'Abre 2 paquetes', evento: 'paquete', meta: 2, premio: { monedas: 20 } },
  { id: 'mimos', texto: 'Dale mimos a una mascota 3 veces', evento: 'mimos', meta: 3, premio: { monedas: 25 }, mascota: true },
  { id: 'comer', texto: 'Da de comer a una mascota', evento: 'comer', meta: 1, premio: { monedas: 20 }, mascota: true },
  { id: 'jugar', texto: 'Juega con una mascota 2 veces', evento: 'jugar', meta: 2, premio: { tickets: 1 }, mascota: true },
  { id: 'caca', texto: 'Recoge 2 cacas', evento: 'limpiar-caca', meta: 2, premio: { monedas: 25 }, mascota: true }
];

export const HISTORIA = [
  { texto: 'Echa a las cucarachas', check: c => c.arreglado('cucarachas'), premio: { monedas: 30 } },
  { texto: 'Cambia el cristal de la ventana', check: c => c.arreglado('ventana'), premio: { monedas: 40 } },
  { texto: 'Friega la mancha y clava la tabla del suelo', check: c => c.arreglado('mancha') && c.arreglado('tabla'), premio: { monedas: 30 } },
  { texto: 'Tapa las grietas y quita la humedad', check: c => c.arreglado('grietas') && c.arreglado('humedad'), premio: { monedas: 40 } },
  { texto: 'Compra una cama de verdad y colócala', check: c => c.tieneMueble('cama'), premio: { monedas: 50, tickets: 1 } },
  { texto: 'Pinta las 4 paredes', check: c => c.paredesPintadas() >= 4, premio: { monedas: 60 } },
  { texto: 'Adopta una mascota', check: c => c.numMascotas() >= 1, premio: { tickets: 2 } },
  { texto: 'Pon un robot friegasuelos', check: c => c.tieneMueble('robot'), premio: { monedas: 60 } },
  { texto: 'Ten 12 objetos colocados en casa', check: c => c.numMuebles() >= 12, premio: { monedas: 80 } },
  { texto: 'Deja la casa al 100% de limpieza', check: c => c.limpieza() >= 100 && c.reformaCompleta(), premio: { monedas: 100, tickets: 2 } }
];

export const EVENTOS = [
  {
    id: 'mama', personaje: 'mama', dias: 10,
    titulo: '¡Viene tu madre de visita!',
    texto: 'Dentro de 10 días viene tu madre a ver el piso. Dejad la casa lo mejor posible: reformada, limpia y bonita… o ya sabéis lo que pasará.',
    pesos: { reforma: 40, limpieza: 40, muebles: 20 }, objetivoMuebles: 12,
    resultados: [
      { min: 80, titulo: '¡Tu madre está encantada!', texto: '"¡Qué casa más bonita y qué limpia! Tomad, para que os deis un capricho." Os deja 300 monedas, 3 tickets y un regalo especial.', premio: { monedas: 300, tickets: 3, item: 'legendario' } },
      { min: 50, titulo: 'Tu madre dice que no está mal…', texto: '"Bueno… se puede vivir. Pero esas esquinas…" Os deja 100 monedas para productos de limpieza.', premio: { monedas: 100 } },
      { min: 0, titulo: 'Tu madre se ha ido disgustada', texto: '"¡Pero cómo vivís así!" Se ha pasado la tarde limpiando y se ha llevado 50 monedas "para lejía". Para la próxima…', premio: { monedas: -50 } }
    ]
  },
  {
    id: 'fiesta', personaje: 'amigos', dias: 7,
    titulo: 'Fiesta de inauguración',
    texto: 'Habéis invitado a vuestros amigos dentro de 7 días. ¡Que la casa esté llena de cosas bonitas, limpia y con alguna mascota que les reciba!',
    pesos: { reforma: 20, limpieza: 30, muebles: 40, mascota: 10 }, objetivoMuebles: 16,
    resultados: [
      { min: 80, titulo: '¡Fiestón!', texto: 'Vuestros amigos no paran de hacer fotos. Os traen regalos: 200 monedas, 2 tickets y algo épico.', premio: { monedas: 200, tickets: 2, item: 'epico' } },
      { min: 50, titulo: 'Una fiesta maja', texto: 'Lo habéis pasado bien. Os traen 80 monedas de regalo.', premio: { monedas: 80 } },
      { min: 0, titulo: 'Fiesta un poco triste', texto: 'La casa estaba algo vacía y sucia… se fueron pronto. Al menos os ha sobrado comida.', premio: { monedas: 0 } }
    ]
  }
];

export function puntuacion(evento, c) {
  const p = evento.pesos;
  const partes = {
    reforma: c.reformaPct(),
    limpieza: c.limpieza() / 100,
    muebles: Math.min(1, c.numMuebles() / evento.objetivoMuebles),
    mascota: c.numMascotas() > 0 ? 1 : 0
  };
  let total = 0;
  for (const k of Object.keys(p)) total += p[k] * partes[k];
  return { total: Math.round(total), partes };
}

export function nuevasDiarias(hayMascota) {
  const pool = DIARIAS.filter(d => hayMascota || !d.mascota);
  const elegidas = [];
  while (elegidas.length < 3 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    elegidas.push({ id: pool[i].id, progreso: 0, reclamada: false });
    pool.splice(i, 1);
  }
  return elegidas;
}

export function infoDiaria(id) {
  return DIARIAS.find(d => d.id === id);
}

export function textoPremio(premio) {
  const partes = [];
  if (premio.monedas) partes.push(`🪙 ${premio.monedas}`);
  if (premio.tickets) partes.push(`🎟️ ${premio.tickets}`);
  if (premio.item) partes.push('🎁');
  return partes.join(' · ');
}
