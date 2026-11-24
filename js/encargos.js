import { paga } from './balance.js';
import { RECETAS, INGREDIENTES } from './casa2.js';
import { JUEGOS_FAVOR as JF1 } from './favores.js';
import { JUEGOS_FAVOR2 } from './favores2.js';

const JUEGOS_FAVOR = { ...JF1, ...JUEGOS_FAVOR2 };

const HORA = 3600000;
const MAX_ACTIVOS = 2;

export const CLIENTES = {
  mama: { nombre: 'Mamá', icono: '👵', personaje: 'mama', confianza: 60 },
  ramon: { nombre: 'Don Ramón', sub: 'el vecino de abajo', icono: '👴', personaje: 'ramon', confianza: 45 },
  sol: { nombre: 'Sol', sub: 'la vecina del tercero', icono: '👩', personaje: 'sol', confianza: 45 },
  amigos: { nombre: 'Vuestros amigos', icono: '🧑‍🤝‍🧑', personaje: 'amigos', confianza: 50 },
  pilar: { nombre: 'Pilar', sub: 'la de la tienda', icono: '🛍️', personaje: 'lola', confianza: 40 }
};

const RECETAS_MAMA = ['tortilla', 'pizza', 'crema', 'pisto', 'ensalada', 'tarta'];

const TIPOS = [
  { id: 'medico', quien: 'mama', min: 15, favor: 'conducir', titulo: () => 'Llevarla al médico', texto: () => 'Tengo cita en el médico y vuestro padre se ha llevado el coche. ¿Me lleváis? ¡Que llegamos tarde!', pago: () => 110 },
  { id: 'pasatiempos', quien: 'mama', min: 45, favor: 'diferencias', titulo: () => 'Encontrar las diferencias', texto: () => 'Me han regalado un libro de pasatiempos y me he atascado con las diferencias. ¿Me echáis una mano?', pago: () => 90 },
  { id: 'mercado', quien: 'ramon', min: 20, favor: 'cruzar', titulo: () => 'Acompañarle al mercado', texto: () => 'Quiero ir al mercado, pero cruzar esa avenida me da pánico. ¿Me acompañáis? Son tres viajes, que pesa mucho la compra.', pago: () => 100 },
  { id: 'toby', quien: 'sol', min: 15, favor: 'pasear', titulo: () => 'Pasear a Toby', texto: () => '¿Sacáis a pasear a Toby? Le encanta buscar huesos, pero no dejéis que se enrede con la correa.', pago: () => 90 },
  { id: 'cometa', quien: 'amigos', min: 20, favor: 'cometa', titulo: () => 'Volar la cometa', texto: () => 'Domingo de parque: ¿quién mantiene la cometa en el aire sin que se enganche en los árboles?', pago: () => 95 },
  { id: 'almacen-pilar', quien: 'pilar', min: 20, favor: 'almacen', titulo: () => 'Ordenar el almacén', texto: () => 'Me ha llegado un camión de cajas y no caben. ¿Me las empujáis cada una a su sitio?', pago: () => 105 },
  { id: 'receta', quien: 'mama', min: 0, horas: 36, titulo: r => `Cocinar ${r.nombre.toLowerCase()}`, texto: r => `¿Me hacéis ${r.nombre.toLowerCase()}? Es para la comida del domingo y a mí ya no me sale como antes. Usad vuestra cocina, ¿eh?`, pago: r => Math.round(r.valor * 1.6) },
  { id: 'album', quien: 'mama', min: 40, juego: 'puzzle', titulo: () => 'Recomponer una foto', texto: () => 'Se me ha caído el álbum y las fotos se han hecho pedazos. ¿Me ayudáis a recomponer una?', pago: () => 75 },
  { id: 'tarta-tia', quien: 'mama', min: 65, favor: 'tartaletas', titulo: () => 'Rellenar las tartaletas', texto: () => 'Es el cumple de vuestra tía y he hecho tartaletas. ¿Me ayudáis a rellenarlas de crema sin que se desborden?', pago: () => 125 },
  { id: 'cesped', quien: 'ramon', min: 0, favor: 'cesped', titulo: () => 'Cortar el césped', texto: () => 'Se me ha puesto el césped como una selva. ¿Me lo cortáis? Y cuidado con mis margaritas, que les tengo cariño.', pago: () => 85 },
  { id: 'grifo', quien: 'ramon', min: 40, favor: 'gotas', titulo: () => 'Recoger las goteras', texto: () => 'Se me ha roto una tubería y gotea por todas partes hasta que venga el fontanero. ¿Me ayudáis con los cubos?', pago: () => 115 },
  { id: 'libros', quien: 'ramon', min: 65, favor: 'buscar', titulo: () => 'Buscar sus cosas en el trastero', texto: () => 'He perdido las gafas, las llaves… ¡todo! Está en el trastero, pero yo ya no veo nada. ¿Me ayudáis?', pago: () => 120 },
  { id: 'mudanza', quien: 'sol', min: 0, favor: 'escalera', titulo: () => 'Subir las cajas de la mudanza', texto: () => '¡Me mudo al tercero y no hay ascensor! ¿Me ayudáis a subir las cajas por la escalera?', pago: () => 85 },
  { id: 'limpieza', quien: 'sol', min: 30, juego: 'duelo', titulo: () => 'Limpiar antes de la visita', texto: () => 'Viene mi suegra en una hora y tengo el piso hecho un desastre. ¿Una carrera limpiando?', pago: () => 95 },
  { id: 'ramo', quien: 'sol', min: 55, favor: 'regar', titulo: () => 'Cuidarle las plantas', texto: () => 'Me voy el finde de viaje con mi novio. ¿Me cuidáis las plantas? Ni mucha agua ni poca, que son muy delicadas.', pago: () => 110 },
  { id: 'pintar', quien: 'sol', min: 75, favor: 'cuadros', titulo: () => 'Colgar sus cuadros', texto: () => 'Ya tengo el piso nuevo pintado, pero no sé colgar cuadros rectos. ¿Os animáis? Os invito a pizza.', pago: () => 140 },
  { id: 'cena', quien: 'amigos', min: 0, juego: 'equipo', titulo: () => 'Cena a medias', texto: () => 'Cena en casa: cada uno tiene la mitad de los ingredientes. ¡Coordinaos!', pago: () => 90 },
  { id: 'barbacoa', quien: 'amigos', min: 30, favor: 'parrilla', titulo: () => 'Hacer la carne de la barbacoa', texto: () => 'Barbacoa el sábado. ¿Os ponéis vosotros a la parrilla? Que no se nos queme nada.', pago: () => 105 },
  { id: 'cumple', quien: 'amigos', min: 60, favor: 'globos', titulo: () => 'Inflar los globos del cumple', texto: () => '¡Es mi cumple y quiero la casa llena de globos! ¿Me ayudáis a inflarlos?', pago: () => 130 },
  { id: 'excursion', quien: 'amigos', min: 75, favor: 'hoguera', titulo: () => 'Encender la hoguera', texto: () => 'Nos vamos de acampada y ninguno sabe encender un fuego. ¿Venís y nos salváis?', pago: () => 130 },
  { id: 'caja', quien: 'pilar', min: 0, favor: 'cola', titulo: () => 'Atender la tienda', texto: () => 'Tengo que ir al médico un rato. ¿Me atendéis a los clientes? Que no se me enfade nadie.', pago: () => 90 },
  { id: 'etiquetas', quien: 'pilar', min: 30, juego: 'memory', titulo: () => 'Emparejar etiquetas', texto: () => 'Se me han mezclado las etiquetas del almacén. ¿Me ayudáis a emparejarlas?', pago: () => 75 },
  { id: 'reparto', quien: 'pilar', min: 55, favor: 'bici', titulo: () => 'Repartir en bici', texto: () => 'Hoy tengo muchos pedidos y la furgoneta está en el taller. ¿Los repartís en bici?', pago: () => 115 },
  { id: 'cafe', quien: 'pilar', min: 70, favor: 'bandeja', titulo: () => 'Llevar las bandejas', texto: () => 'Mi prima se ha quedado sin camarero en su cafetería. ¿Le lleváis las bandejas sin tirar nada?', pago: () => 125 }
];

const REACCION = {
  genial: ['¡Perfecto! No sé qué haría sin vosotros.', '¡Qué maravilla! Os llamaré más a menudo.', '¡De diez! Se lo voy a contar a todo el barrio.'],
  bien: ['¡Muchas gracias! Ha quedado muy bien.', 'Bien hecho, me habéis salvado el día.'],
  regular: ['Bueno… gracias por intentarlo.', 'No ha quedado como yo quería, pero gracias.'],
  mal: ['Uy… mejor la próxima vez lo hago yo.', 'Vaya desastre… creo que tardaré en volver a pediros algo.']
};

const azar = l => l[Math.floor(Math.random() * l.length)];

export class Encargos {
  constructor(ctx) {
    this.ctx = ctx;
    this.t = 0;
  }

  get estado() {
    return this.ctx.estado;
  }

  datos() {
    const e = this.estado;
    if (!e.encargos) e.encargos = { conf: {}, activos: [], proximo: Date.now() + 8 * 60000, hechos: 0 };
    const d = e.encargos;
    for (const [id, c] of Object.entries(CLIENTES)) if (d.conf[id] === undefined) d.conf[id] = c.confianza;
    if (!Array.isArray(d.activos)) d.activos = [];
    return d;
  }

  tipo(e) {
    return TIPOS.find(t => t.id === e.tipo);
  }

  receta(e) {
    return e.receta ? RECETAS.find(r => r.id === e.receta) : null;
  }

  crear(forzarQuien = null, forzarTipo = null) {
    const d = this.datos();
    const ocupados = new Set(d.activos.map(a => a.quien));
    const quienes = Object.keys(CLIENTES).filter(q => !ocupados.has(q) && d.conf[q] >= 12 && (!forzarQuien || q === forzarQuien));
    if (!quienes.length) return null;
    const pesos = quienes.map(q => 0.15 + d.conf[q] / 100);
    let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
    let quien = quienes[0];
    for (let i = 0; i < quienes.length; i++) {
      r -= pesos[i];
      if (r <= 0) { quien = quienes[i]; break; }
    }
    const posibles = TIPOS.filter(t => t.quien === quien && d.conf[quien] >= t.min);
    const ultimos = d.ultimosTipos || [];
    const frescos = posibles.filter(t => !ultimos.includes(t.id));
    const t = (forzarTipo && TIPOS.find(x => x.id === forzarTipo)) || azar(frescos.length ? frescos : posibles);
    const e = { id: `e${Date.now()}`, quien, tipo: t.id, inicio: Date.now(), fin: Date.now() + (t.horas || 24) * HORA, visto: false };
    if (t.id === 'receta') {
      const ya = (d.ultimasRecetas || []).slice(-2);
      const opciones = RECETAS_MAMA.filter(x => !ya.includes(x));
      e.receta = azar(opciones.length ? opciones : RECETAS_MAMA);
      d.ultimasRecetas = [...(d.ultimasRecetas || []), e.receta].slice(-3);
    }
    const r2 = this.receta(e);
    e.pago = paga(Math.round(t.pago(r2) * (0.8 + d.conf[quien] / 250)));
    d.activos.push(e);
    d.ultimosTipos = [...ultimos, t.id].slice(-4);
    return e;
  }

  actualizar(dt) {
    this.t += dt;
    if (this.t < 20) return;
    this.t = 0;
    const d = this.datos();
    const ahora = Date.now();
    for (const e of [...d.activos]) {
      if (ahora < e.fin) continue;
      d.activos = d.activos.filter(x => x !== e);
      d.conf[e.quien] = Math.max(0, d.conf[e.quien] - 8);
      const c = CLIENTES[e.quien];
      this.ctx.ui.aviso(`😕 ${c.nombre} se cansó de esperar`, true);
      this.ctx.guardar();
    }
    if (!this.ctx.puedeLlamar()) return;
    if (d.activos.length >= MAX_ACTIVOS || ahora < (d.proximo || 0)) return;
    const e = this.crear();
    d.proximo = ahora + (2 + Math.random() * 3) * HORA;
    if (!e) return;
    this.anunciar(e);
    this.ctx.guardar();
  }

  anunciar(e) {
    const c = CLIENTES[e.quien];
    const { sonido, ui } = this.ctx;
    for (let i = 0; i < 2; i++) [0, 0.12].forEach(t => sonido.tono(1320, i * 0.55 + t, 0.1, { tipo: 'triangle', volumen: 0.07 }));
    ui.aviso(`📞 ¡Ring, ring! ${c.nombre} os ha llamado`);
    if (this.ctx.avisarPareja) this.ctx.avisarPareja('encargo', `📞 ${c.nombre} os ha pedido un favor`);
    this.ctx.chip();
  }

  chips() {
    return this.datos().activos.map(e => {
      const c = CLIENTES[e.quien];
      const t = this.tipo(e);
      return { id: `enc-${e.id}`, texto: `📞 ${c.icono} ${c.nombre}: ${t.titulo(this.receta(e))}`, encargo: true, accion: () => this.abrir(e) };
    });
  }

  restante(e) {
    const ms = Math.max(0, e.fin - Date.now());
    const h = Math.floor(ms / HORA);
    return h >= 1 ? `${h} h` : `${Math.max(1, Math.ceil(ms / 60000))} min`;
  }

  faltan(e) {
    const r = this.receta(e);
    if (!r) return { cocina: true, ingredientes: [], coste: 0 };
    const desp = this.estado.despensa || {};
    const ingredientes = Object.entries(r.ing).map(([k, n]) => ({ k, n, tengo: desp[k] || 0, falta: Math.max(0, n - (desp[k] || 0)) }));
    const coste = ingredientes.reduce((s, i) => s + i.falta * (INGREDIENTES[i.k].precio || 0), 0);
    return { cocina: this.ctx.tieneCocina(), ingredientes, coste };
  }

  corazones(q) {
    const n = Math.round(this.datos().conf[q] / 20);
    return '❤️'.repeat(n) + '🤍'.repeat(5 - n);
  }

  abrir(e) {
    const { ui, miniaturas } = this.ctx;
    const c = CLIENTES[e.quien];
    const t = this.tipo(e);
    const r = this.receta(e);
    e.visto = true;
    const f = this.faltan(e);
    let reqs = '';
    if (r) {
      reqs = `<div class="enc-reqs"><div class="${f.cocina ? 'ok' : ''}">${f.cocina ? '✅' : '❌'} Una cocina en casa${f.cocina ? '' : ' <small>(buscadla en el mostrador de Pilar)</small>'}</div>
        <div class="enc-ings">${f.ingredientes.map(i => `<span class="${i.falta ? '' : 'ok'}">${INGREDIENTES[i.k].icono} ${Math.min(i.tengo, i.n)}/${i.n}</span>`).join('')}</div></div>`;
    }
    const listo = !r || (f.cocina && f.coste === 0);
    const botones = [];
    if (listo) botones.push({ texto: '¡Vamos allá!', tipo: 'primario', accion: () => setTimeout(() => this.hacer(e), 250) });
    else if (r && f.coste > 0) botones.push({ texto: `🛒 Comprar lo que falta · 🪙 ${f.coste}`, tipo: 'primario', accion: () => setTimeout(() => this.comprarIngredientes(e), 200) });
    if (r && !f.cocina) botones.push({ texto: '🏪 Ir a la tienda', tipo: botones.length ? 'secundario' : 'primario', accion: () => setTimeout(() => ui.abrirTienda('mostrador'), 250) });
    botones.push({ texto: 'Más tarde', tipo: 'secundario' });
    botones.push({ texto: 'Decirle que no', tipo: 'secundario', accion: () => this.rechazar(e) });
    ui.dialogo({
      imagen: miniaturas.personaje(c.personaje), personaje: true,
      etiqueta: { texto: `🪙 ${e.pago}`, color: '#f2a03c' },
      titulo: `${c.nombre}${c.sub ? `, ${c.sub}` : ''}`,
      texto: t.texto(r),
      html: `${reqs}<div class="enc-pie"><span>${this.corazones(e.quien)}</span><span>⏳ ${this.restante(e)}</span></div>`,
      botones,
      columna: true
    });
    this.ctx.chip();
  }

  comprarIngredientes(e) {
    const { ui, sonido } = this.ctx;
    const f = this.faltan(e);
    if (this.estado.monedas < f.coste) {
      sonido.error();
      ui.aviso(`Os faltan ${f.coste - this.estado.monedas} monedas. ¡A trabajar!`, true);
      return;
    }
    this.estado.monedas -= f.coste;
    const desp = this.estado.despensa || (this.estado.despensa = {});
    for (const i of f.ingredientes) if (i.falta) desp[i.k] = (desp[i.k] || 0) + i.falta;
    sonido.comprar();
    this.ctx.refrescarHud();
    this.ctx.guardar();
    this.abrir(e);
  }

  rechazar(e) {
    const d = this.datos();
    d.activos = d.activos.filter(x => x !== e);
    d.conf[e.quien] = Math.max(0, d.conf[e.quien] - 3);
    this.ctx.ui.aviso(`${CLIENTES[e.quien].nombre} lo entiende… esta vez`);
    this.ctx.guardar();
    this.ctx.chip();
  }

  async hacer(e) {
    const { juegos, sonido, ui } = this.ctx;
    const t = this.tipo(e);
    const r = this.receta(e);
    ui.cerrarHojas();
    let puntos;
    if (r) {
      puntos = await this.ctx.cocinar(r);
    } else if (t.favor) {
      const f = JUEGOS_FAVOR[t.favor];
      puntos = await juegos.custom(f.icono, t.titulo(), j => f.jugar(j, { sonido }));
    } else {
      puntos = await juegos.jugar(t.juego, t.juego === 'puzzle' ? { imagen: this.ctx.imagenPuzzle() } : {});
    }
    if (puntos === null || puntos === undefined) return;
    this.terminar(e, puntos);
  }

  terminar(e, p) {
    const { ui, miniaturas } = this.ctx;
    const d = this.datos();
    d.activos = d.activos.filter(x => x.id !== e.id);
    const c = CLIENTES[e.quien];
    const antes = d.conf[e.quien];
    const delta = Math.round((p - 0.55) * 30);
    d.conf[e.quien] = Math.max(0, Math.min(100, antes + delta));
    d.hechos = (d.hechos || 0) + 1;
    const pago = Math.max(5, Math.round(e.pago * (0.35 + 0.65 * p)));
    const nivel = p >= 0.85 ? 'genial' : p >= 0.6 ? 'bien' : p >= 0.35 ? 'regular' : 'mal';
    const nuevos = TIPOS.filter(t => t.quien === e.quien && t.min > antes && t.min <= d.conf[e.quien]);
    if (delta > 0) d.proximo = Math.min(d.proximo || Infinity, Date.now() + (1 + Math.random()) * HORA);
    this.ctx.registrar('encargo');
    if (this.ctx.recordar && d.hechos === 1) this.ctx.recordar('primer-encargo', '📞', `Ayudamos a ${c.nombre === 'Mamá' ? 'mamá' : c.nombre} con un encargo`);
    ui.dialogo({
      imagen: miniaturas.personaje(c.personaje), personaje: true,
      etiqueta: { texto: `${Math.round(p * 100)}%`, color: p >= 0.85 ? '#6cc08a' : p >= 0.5 ? '#f2a03c' : '#e57373' },
      titulo: c.nombre,
      texto: azar(REACCION[nivel]),
      html: `<div class="enc-pie"><span>${this.corazones(e.quien)}</span><span>${delta > 0 ? '📈 Os llamará más' : delta < 0 ? '📉 Os llamará menos' : '➖ Igual que antes'}</span></div>${nuevos.length ? `<p class="enc-nuevo">✨ Ahora confía más en vosotros: os pedirá cosas nuevas</p>` : ''}`,
      confeti: p >= 0.85,
      botones: [{ texto: `Cobrar 🪙 ${pago}`, tipo: 'primario', accion: () => this.ctx.ganar(pago, null, '📞', true) }]
    });
    this.ctx.guardar();
    this.ctx.chip();
  }

  agenda() {
    const d = this.datos();
    return Object.entries(CLIENTES).map(([q, c]) => ({ q, c, conf: d.conf[q], activo: d.activos.find(a => a.quien === q) }));
  }
}
