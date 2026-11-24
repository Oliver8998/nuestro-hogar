import { paga } from './balance.js';
import { CATALOGO, MATERIALES, infoItem, PRECIO_RAREZA } from './catalogo.js';

const COSTE_PIEZAS = { raro: 8, epico: 18, legendario: 35 };

const TAREAS_PASE = [
  { id: 'limpiar', icono: '🧹', texto: 'Limpiad', meta: 40, premio: { monedas: 80 } },
  { id: 'regar', icono: '💧', texto: 'Regad plantas', meta: 20, premio: { monedas: 60 } },
  { id: 'encargo', icono: '📞', texto: 'Ayudad con encargos', meta: 5, premio: { tickets: 1 } },
  { id: 'colocar', icono: '🛋️', texto: 'Colocad muebles', meta: 30, premio: { monedas: 60 } },
  { id: 'mimos', icono: '🥰', texto: 'Dad mimos', meta: 30, premio: { monedas: 60 } },
  { id: 'cosechar', icono: '🍅', texto: 'Cosechad', meta: 5, premio: { monedas: 100 } },
  { id: 'trabajar', icono: '💼', texto: 'Cobrad trabajos', meta: 5, premio: { monedas: 100 } },
  { id: 'ruleta', icono: '🎡', texto: 'Tirad en la ruleta', meta: 10, premio: { tickets: 1 } },
  { id: 'visita', icono: '🚪', texto: 'Atended visitas', meta: 3, premio: { monedas: 80 } },
  { id: 'reto', icono: '🎨', texto: 'Haced retos de decoración', meta: 2, premio: { tickets: 2 } }
];

function semilla(texto) {
  let x = 0;
  for (const c of texto) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export class Economia {
  constructor(ctx) {
    this.ctx = ctx;
  }

  get estado() {
    return this.ctx.estado;
  }

  esFinde() {
    const forzado = new URLSearchParams(location.search).has('finde');
    const d = new Date().getDay();
    return forzado || d === 0 || d === 6;
  }

  mercadillo() {
    if (!this.esFinde()) return [];
    const d = new Date();
    const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const s = semilla(lunes.toDateString());
    const normales = CATALOGO.filter(x => x.enTienda !== false && !x.temporada && !x.exterior && x.precio >= 40);
    const raros = [...CATALOGO, ...MATERIALES].filter(x => (x.rareza === 'raro' || x.rareza === 'epico') && !x.mascota);
    const lista = [];
    for (let k = 0; k < 3; k++) {
      const it = normales[(s + k * 7) % normales.length];
      if (!lista.some(x => x.id === it.id)) lista.push({ id: it.id, precio: Math.round(it.precio * 0.65) });
    }
    for (let k = 0; k < 2; k++) {
      const it = raros[(s + k * 5) % raros.length];
      if (!lista.some(x => x.id === it.id)) lista.push({ id: it.id, precio: Math.round(PRECIO_RAREZA[it.rareza] * 1.2) });
    }
    return lista;
  }

  pase() {
    const mes = mesActual();
    if (!this.estado.pase || this.estado.pase.mes !== mes) {
      this.estado.pase = { mes, base: { ...(this.estado.stats || {}) }, reclamados: [] };
    }
    return this.estado.pase;
  }

  progresoTarea(t) {
    const p = this.pase();
    return Math.max(0, ((this.estado.stats || {})[t.id] || 0) - (p.base[t.id] || 0));
  }

  pendientesPase() {
    const p = this.pase();
    return TAREAS_PASE.filter(t => !p.reclamados.includes(t.id) && this.progresoTarea(t) >= t.meta).length;
  }

  abrirPase() {
    const { ui } = this.ctx;
    const p = this.pase();
    const hechas = p.reclamados.length;
    const fin = new Date();
    const dias = new Date(fin.getFullYear(), fin.getMonth() + 1, 0).getDate() - fin.getDate();
    const cuerpo = ui.abrirGen('Pase del mes', `
      <p class="gen-intro">Tareas de este mes (quedan ${dias} días). Si completáis las ${TAREAS_PASE.length}, os lleváis la <b>corona real</b> para una mascota y 3 tickets.</p>
      <div class="pase-barra"><i style="width:${hechas / TAREAS_PASE.length * 100}%"></i><span>${hechas}/${TAREAS_PASE.length}</span></div>
      <div class="pase">${TAREAS_PASE.map(t => {
        const n = Math.min(t.meta, this.progresoTarea(t));
        const reclamada = p.reclamados.includes(t.id);
        const lista = n >= t.meta && !reclamada;
        const premio = t.premio.monedas ? `🪙 ${paga(t.premio.monedas)}` : `🎟️ ${t.premio.tickets}`;
        return `<div class="pase-tarea ${reclamada ? 'hecha' : ''}"><span>${t.icono}</span><div><b>${t.texto}</b><i><b style="width:${n / t.meta * 100}%"></b></i><small>${n}/${t.meta}</small></div>${lista ? `<button class="primario reclamar" data-id="${t.id}">${premio}</button>` : `<em>${reclamada ? '✅' : premio}</em>`}</div>`;
      }).join('')}</div>`, () => (window.abrirObjetivos || this.ctx.abrirMas)());
    cuerpo.querySelectorAll('.reclamar').forEach(b => b.addEventListener('click', () => {
      const t = TAREAS_PASE.find(x => x.id === b.dataset.id);
      p.reclamados.push(t.id);
      this.estado.monedas += paga(t.premio.monedas || 0);
      this.estado.tickets += t.premio.tickets || 0;
      if (p.reclamados.length === TAREAS_PASE.length) {
        this.estado.tickets += 3;
        this.ctx.inventario.anadir('acc-corona', null);
        this.ctx.ui.pintarInventario(this.ctx.inventario);
        ui.aviso('👑 ¡Pase completo! Corona real y 3 tickets');
        this.ctx.recordar(null, '👑', `Completamos el pase de ${new Date().toLocaleDateString('es-ES', { month: 'long' })}`);
      }
      this.ctx.sonido.premio();
      this.ctx.refrescarHud();
      this.ctx.guardar();
      this.abrirPase();
    }));
  }

  abrirTaller() {
    const { ui, miniaturas, inventario } = this.ctx;
    const piezas = this.estado.piezas || 0;
    const reciclables = inventario.items.filter(i => {
      const info = infoItem(i.id);
      return info && info.tipo === 'mueble';
    });
    const fabricables = CATALOGO.filter(d => COSTE_PIEZAS[d.rareza]);
    const conColor = CATALOGO.filter(d => d.enTienda !== false && d.colores && !d.temporada);
    const cuerpo = ui.abrirGen('Taller', `
      <div class="pj-codigo"><small>Piezas recicladas</small><b>♻️ ${piezas}</b></div>
      <div class="seccion-titulo">♻️ Reciclar (del inventario)</div>
      <div class="taller-fila">${reciclables.length ? reciclables.map((i, k) => `<button class="taller-item reciclar" data-k="${k}"><img src="${miniaturas.item(i.id, i.color)}" alt=""><small>${infoItem(i.id).nombre}${i.cantidad > 1 ? ` ×${i.cantidad}` : ''}</small><em>+${this.piezasDe(i.id)} ♻️</em></button>`).join('') : '<p class="vacio">Guardad muebles en el inventario para reciclarlos.</p>'}</div>
      <div class="seccion-titulo">🔨 Fabricar exclusivos</div>
      <div class="taller-fila">${fabricables.map(d => `<button class="taller-item fabricar" data-id="${d.id}" ${piezas < COSTE_PIEZAS[d.rareza] ? 'disabled' : ''}><img src="${miniaturas.item(d.id, d.colores ? 0 : null)}" alt=""><small>${d.nombre}</small><em>${COSTE_PIEZAS[d.rareza]} ♻️</em></button>`).join('')}</div>
      <div class="seccion-titulo">🧵 Encargo a medida</div>
      <p class="gen-intro">Elegid un mueble y el color que queráis. Tarda un día en llegar (cuesta un 40% más).</p>
      <div class="ajustes"><div class="fila2"><select id="tm-mueble">${conColor.map(d => `<option value="${d.id}">${d.nombre} · 🪙 ${Math.round(d.precio * 1.4)}</option>`).join('')}</select><input id="tm-color" type="color" value="#e58f9e"></div>
      <div class="tm-vista"><img id="tm-img" alt=""></div>
      <button id="tm-pedir" class="primario">📦 Encargar</button></div>`, () => this.ctx.abrirMas());
    const vista = () => {
      cuerpo.querySelector('#tm-img').src = miniaturas.item(cuerpo.querySelector('#tm-mueble').value, cuerpo.querySelector('#tm-color').value);
    };
    cuerpo.querySelector('#tm-mueble').addEventListener('change', vista);
    cuerpo.querySelector('#tm-color').addEventListener('change', vista);
    vista();
    cuerpo.querySelector('#tm-pedir').addEventListener('click', () => {
      const id = cuerpo.querySelector('#tm-mueble').value;
      const color = cuerpo.querySelector('#tm-color').value;
      const precio = Math.round(infoItem(id).precio * 1.4);
      if (this.estado.monedas < precio) {
        this.ctx.sonido.error();
        ui.aviso('No os llega el dinero', true);
        return;
      }
      this.estado.monedas -= precio;
      this.ctx.entregas.pedir([{ id, color, cantidad: 1 }], 86400);
      this.ctx.sonido.comprar();
      this.ctx.refrescarHud();
      this.ctx.guardar();
      ui.aviso('🧵 ¡Encargado! Llega mañana a la puerta');
      this.ctx.recordar('medida', '🧵', `Nuestro primer mueble a medida: ${infoItem(id).nombre.toLowerCase()}`);
    });
    cuerpo.querySelectorAll('.reciclar').forEach(b => b.addEventListener('click', () => {
      const it = reciclables[Number(b.dataset.k)];
      const n = this.piezasDe(it.id);
      inventario.quitar(it.id, it.color);
      this.estado.piezas = (this.estado.piezas || 0) + n;
      ui.pintarInventario(inventario);
      this.ctx.registrar('reciclar');
      this.ctx.sonido.arreglo();
      this.ctx.guardar();
      this.abrirTaller();
    }));
    cuerpo.querySelectorAll('.fabricar').forEach(b => b.addEventListener('click', () => {
      const d = infoItem(b.dataset.id);
      const coste = COSTE_PIEZAS[d.rareza];
      if ((this.estado.piezas || 0) < coste) return;
      this.estado.piezas -= coste;
      inventario.anadir(d.id, d.colores ? 0 : null);
      ui.pintarInventario(inventario);
      this.ctx.sonido.premio();
      ui.aviso(`🔨 ¡${d.nombre} fabricado! Está en el inventario`);
      this.ctx.guardar();
      this.abrirTaller();
    }));
  }

  piezasDe(id) {
    const info = infoItem(id);
    if (info.rareza) return Math.round(COSTE_PIEZAS[info.rareza] / 2);
    return Math.max(1, Math.round((info.precio || 40) / 45));
  }
}
