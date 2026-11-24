import { OBRAS } from './progreso.js';

export const NIVEL_MAX = 30;

export function xpPara(n) {
  return 150 + 75 * (n - 1);
}

export function nivelDe(xp) {
  let n = 1;
  let resto = Math.max(0, Math.floor(xp || 0));
  while (n < NIVEL_MAX && resto >= xpPara(n)) {
    resto -= xpPara(n);
    n++;
  }
  return { nivel: n, dentro: resto, necesita: n >= NIVEL_MAX ? 0 : xpPara(n) };
}

export const XP_EVENTO = {
  trabajar: 40, 'trabajo-perfecto': 20, encargo: 35, minijuego: 10, reformar: 25, pintar: 12, mudanza: 0,
  limpiar: 4, 'limpiar-caca': 4, colocar: 3, pedido: 6, paquete: 3, ruleta: 5, cocinar: 15, comer: 5, 'comer-juntos': 8,
  regar: 3, cosechar: 6, mimos: 2, banar: 8, duo: 25, pasear: 8, jugar: 3, 'colgar-cuadro': 8, reto: 30, visita: 10, cria: 30,
  'aprender-truco': 10, truco: 3, reciclar: 5, averia: 15, tender: 4, piano: 3, cancion: 5, 'foto-editada': 5,
  relax: 3, peces: 3, 'gato-comida': 3, 'gato-callejero': 5, nieve: 5, tesoro: 10, 'like-recibido': 10,
  'ranking-primero': 25, fiesta: 30, 'fiesta-perfecta': 40, alquiler: 20, obra: 150, 'compra-piso': 60, 'cobrar-alquiler': 5, venta: 0
};

const SIN_TOPE = new Set(['trabajar', 'trabajo-perfecto', 'encargo', 'reformar', 'reto', 'cria', 'fiesta', 'fiesta-perfecta', 'ranking-primero', 'mision', 'logro', 'obra', 'gastar', 'alquiler', 'venta', 'compra-piso']);
const TOPE_DIA = 15;

export const NIVEL_OBJETO = { 2: 8, 3: 14, 4: 20 };

export function desbloqueos() {
  const l = [
    { nivel: 6, icono: '🎨', texto: 'Reto de decoración' },
    { nivel: 9, icono: '🔑', texto: 'Inmobiliaria: pisos para reformar y vender o alquilar' },
    { nivel: 8, icono: '🌿', texto: 'Objetos de exterior en la tienda (si tenéis terraza o jardín)' },
    { nivel: 14, icono: '🔥', texto: 'Chimenea, columpio, piscina hinchable y mesa de picnic' },
    { nivel: 20, icono: '⛲', texto: 'Piscina y fuente para el jardín' }
  ];
  for (const o of OBRAS) l.push({ nivel: o.nivel, icono: o.icono, texto: `Obra: ${o.nombre} · 🪙 ${o.precio}`, obra: o.id });
  return l.sort((a, b) => a.nivel - b.nivel);
}

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export class Experiencia {
  constructor(ctx) {
    this.ctx = ctx;
    this.pendiente = null;
    this.tPendiente = null;
  }

  get estado() {
    return this.ctx.estado();
  }

  xp() {
    return this.estado.xp || 0;
  }

  info() {
    return nivelDe(this.xp());
  }

  nivel() {
    return this.info().nivel;
  }

  migrar() {
    if (this.estado.xp !== undefined) return;
    const stats = this.estado.stats || {};
    let xp = 0;
    for (const [ev, n] of Object.entries(stats)) xp += (XP_EVENTO[ev] ?? 2) * Math.min(n, SIN_TOPE.has(ev) ? n : 200);
    xp += (this.estado.logros || []).length * 50;
    const nivelCasa = (this.estado.casa && this.estado.casa.nivel) || 0;
    xp += [0, 1500, 4000, 9000, 16000][nivelCasa] || 0;
    this.estado.xp = Math.round(xp);
    this.estado.xpVisto = nivelDe(this.estado.xp).nivel;
  }

  evento(ev, n = 1) {
    const base = XP_EVENTO[ev] ?? 2;
    if (!base) return;
    if (!SIN_TOPE.has(ev)) {
      const e = this.estado;
      if (!e.xpHoy || e.xpHoy.dia !== hoy()) e.xpHoy = { dia: hoy(), cuenta: {} };
      const c = e.xpHoy.cuenta[ev] || 0;
      const valen = Math.max(0, Math.min(n, TOPE_DIA - c));
      e.xpHoy.cuenta[ev] = c + n;
      if (!valen) return;
      n = valen;
    }
    this.ganar(base * n);
  }

  gastar(monedas) {
    if (monedas >= 15) this.ganar(Math.floor(monedas / 15));
  }

  ganar(cantidad, x = null, y = null) {
    cantidad = Math.round(cantidad);
    if (cantidad <= 0) return;
    const antes = this.nivel();
    this.estado.xp = this.xp() + cantidad;
    this.flotar(cantidad, x, y);
    this.ctx.alCambiar();
    const ahora = this.nivel();
    if (ahora > antes) this.subir(antes, ahora);
  }

  flotar(cantidad, x, y) {
    const pill = document.getElementById('pill-nivel');
    const r = pill && !pill.classList.contains('oculto') ? pill.getBoundingClientRect() : null;
    const el = document.createElement('div');
    el.className = 'xp-flota';
    el.textContent = `+${cantidad} ⭐`;
    el.style.left = `${x ?? (r ? r.left + r.width / 2 : window.innerWidth / 2)}px`;
    el.style.top = `${y ?? (r ? r.bottom + 4 : 80)}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
    if (pill) {
      pill.classList.remove('xp-latido');
      void pill.offsetWidth;
      pill.classList.add('xp-latido');
    }
  }

  subir(antes, ahora) {
    const e = this.estado;
    let monedas = 0;
    for (let n = antes + 1; n <= ahora; n++) monedas += 30 * n;
    e.monedas += monedas;
    e.tickets = (e.tickets || 0) + (ahora - antes);
    this.ctx.refrescarHud();
    this.pendiente = { antes, ahora, monedas };
    this.mostrarSubida();
  }

  retener(ms) {
    this.retenidoHasta = Date.now() + ms;
  }

  ocupado() {
    if (Date.now() < (this.retenidoHasta || 0)) return true;
    const dlg = document.getElementById('dialogo');
    return (dlg && dlg.classList.contains('abierto')) || this.ctx.ocupado();
  }

  mostrarSubida() {
    clearTimeout(this.tPendiente);
    if (!this.pendiente) return;
    if (this.ocupado()) {
      this.tPendiente = setTimeout(() => this.mostrarSubida(), 1500);
      return;
    }
    const { antes, ahora, monedas } = this.pendiente;
    this.pendiente = null;
    this.estado.xpVisto = ahora;
    const nuevos = desbloqueos().filter(d => d.nivel > antes && d.nivel <= ahora);
    const proximo = desbloqueos().find(d => d.nivel > ahora);
    this.ctx.sonido.premio();
    this.ctx.ui.dialogo({
      titulo: `⭐ ¡Nivel ${ahora}!`,
      texto: `Os lleváis 🪙 ${monedas} y ${ahora - antes > 1 ? `${ahora - antes} tickets` : 'un ticket'} para la ruleta.`,
      html: `${nuevos.length ? `<div class="xp-nuevos"><b>🔓 Desbloqueado</b>${nuevos.map(d => `<div>${d.icono} ${d.texto}</div>`).join('')}</div>` : ''}${proximo ? `<p class="xp-proximo">Siguiente desbloqueo en el nivel ${proximo.nivel}: <b>${proximo.icono} ${proximo.texto.split(' · ')[0]}</b></p>` : ''}`,
      confeti: true,
      botones: [
        ...(nuevos.some(d => d.obra) ? [{ texto: '🏗️ Ver obras', tipo: 'primario', accion: () => setTimeout(() => this.ctx.abrirObras(), 250) }] : []),
        { texto: '¡Genial!', tipo: nuevos.some(d => d.obra) ? 'secundario' : 'primario' }
      ]
    });
  }

  pintarPill() {
    const pill = document.getElementById('pill-nivel');
    if (!pill) return;
    const i = this.info();
    pill.querySelector('b').textContent = i.nivel;
    pill.querySelector('i').style.width = i.necesita ? `${Math.round(i.dentro / i.necesita * 100)}%` : '100%';
  }

  abrir(atras = null) {
    const i = this.info();
    const lista = desbloqueos();
    this.ctx.ui.abrirGen('⭐ Nivel', `
      <div class="xp-cabecera"><span>⭐</span><div><b>Nivel ${i.nivel}</b><small>${i.necesita ? `${i.dentro} / ${i.necesita} de experiencia` : 'Nivel máximo'}</small><i><b style="width:${i.necesita ? Math.round(i.dentro / i.necesita * 100) : 100}%"></b></i></div></div>
      <p class="gen-intro">Ganáis experiencia trabajando, haciendo encargos, completando misiones, comprando, reformando y cuidando la casa y las mascotas. Al subir de nivel se desbloquean obras y cosas nuevas.</p>
      <div class="xp-lista">${lista.map(d => `<div class="xp-fila ${d.nivel <= i.nivel ? 'hecho' : ''}"><em>${d.nivel <= i.nivel ? '✅' : `🔒 ${d.nivel}`}</em><span>${d.icono}</span><small>${d.texto}</small></div>`).join('')}</div>`, atras);
  }
}
