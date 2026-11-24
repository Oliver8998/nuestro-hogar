import { CATALOGO, infoItem } from './catalogo.js';
import { ESPECIES } from './mascotas.js';
import { paga } from './balance.js';

const PAGINAS = [
  { id: 'muebles', icono: '🛋️', nombre: 'Muebles', filtro: d => d.categoria === 'muebles' },
  { id: 'deco', icono: '🪴', nombre: 'Decoración', filtro: d => d.categoria === 'deco' },
  { id: 'exterior', icono: '🌳', nombre: 'Exterior', filtro: d => d.categoria === 'exterior' },
  { id: 'mascotas', icono: '🐾', nombre: 'Mascotas', mascotas: true },
  { id: 'cosas', icono: '🦴', nombre: 'Para mascotas', filtro: d => d.categoria === 'mascotas' || d.categoria === 'limpieza' },
  { id: 'temporada', icono: '🎃', nombre: 'Temporada', filtro: d => d.categoria === 'temporada' },
  { id: 'colecciones', icono: '📚', nombre: 'Colecciones', especial: true }
];

const HITOS = [
  { n: 5, monedas: 60, tickets: 0 },
  { n: 12, monedas: 120, tickets: 1 },
  { n: 20, monedas: 180, tickets: 1 },
  { n: 30, monedas: 250, tickets: 2 },
  { n: 42, monedas: 350, tickets: 2 },
  { n: 55, monedas: 500, tickets: 3 },
  { n: 68, monedas: 700, tickets: 3 },
  { n: 'todo', monedas: 1200, tickets: 5 }
];

export const PREMIOS_RACHA = [
  { icono: '🪙', monedas: 30, texto: '30 monedas' },
  { icono: '🪙', monedas: 45, texto: '45 monedas' },
  { icono: '🎟️', monedas: 20, tickets: 1, texto: 'Ticket + 20' },
  { icono: '🍖', monedas: 30, items: [['pienso', 2]], texto: 'Pienso + 30' },
  { icono: '💰', monedas: 80, texto: '80 monedas' },
  { icono: '🎟️', monedas: 40, tickets: 2, texto: '2 tickets + 40' },
  { icono: '🎁', monedas: 100, raro: true, texto: 'Objeto raro + 100' }
];

function todas() {
  const lista = [];
  for (const p of PAGINAS) {
    if (p.especial) continue;
    if (p.mascotas) for (const id of Object.keys(ESPECIES)) lista.push({ pagina: p.id, clave: `p:${id}`, id, mascota: true });
    else for (const d of CATALOGO.filter(p.filtro)) lista.push({ pagina: p.id, clave: `m:${d.id}`, id: d.id, raro: !!d.rareza });
  }
  return lista;
}

export class Album {
  constructor(ctx) {
    this.ctx = ctx;
    this.lista = todas();
    this.pagina = 'muebles';
  }

  get datos() {
    const e = this.ctx.estado;
    if (!e.album) e.album = { tiene: [], nuevas: [], hitos: [] };
    return e.album;
  }

  total() {
    return this.lista.length;
  }

  cuantas() {
    const tiene = new Set(this.datos.tiene);
    return this.lista.filter(x => tiene.has(x.clave)).length;
  }

  meta(h) {
    return h.n === 'todo' ? this.total() : h.n;
  }

  pendientes() {
    const n = this.cuantas();
    return HITOS.filter(h => n >= this.meta(h) && !this.datos.hitos.includes(String(h.n))).length;
  }

  revisar() {
    const d = this.datos;
    const primera = !d.iniciado;
    const vistos = new Set(d.tiene);
    const ahora = new Set();
    for (const id of this.ctx.idsEnCasa()) ahora.add(`m:${id}`);
    for (const it of this.ctx.inventario.items) if (infoItem(it.id) && CATALOGO.some(c => c.id === it.id)) ahora.add(`m:${it.id}`);
    for (const m of this.ctx.mascotas.lista) ahora.add(`p:${m.especie}`);
    const nuevas = [];
    for (const k of ahora) {
      if (vistos.has(k) || !this.lista.some(x => x.clave === k)) continue;
      d.tiene.push(k);
      nuevas.push(k);
    }
    d.iniciado = true;
    if (!nuevas.length) return;
    if (primera) return this.ctx.guardar();
    d.nuevas.push(...nuevas);
    const x = this.lista.find(l => l.clave === nuevas[0]);
    this.ctx.ui.aviso(`📒 ¡Pegatina nueva para el álbum: ${this.nombre(x)}!${nuevas.length > 1 ? ` (+${nuevas.length - 1})` : ''}`);
    if (this.pendientes()) setTimeout(() => this.ctx.ui.aviso('🎁 ¡Tenéis un premio del álbum por recoger!'), 2200);
    this.ctx.guardar();
  }

  nombre(x) {
    if (!x) return '';
    return x.mascota ? ESPECIES[x.id].nombre : (infoItem(x.id) || {}).nombre || x.id;
  }

  imagen(x) {
    return x.mascota ? this.ctx.miniaturas.mascota(x.id) : this.ctx.miniaturas.item(x.id, 0);
  }

  abrir(volver = null) {
    const { ui } = this.ctx;
    const d = this.datos;
    const tiene = new Set(d.tiene);
    const nuevas = new Set(d.nuevas);
    const n = this.cuantas();
    const total = this.total();
    const pag = PAGINAS.find(p => p.id === this.pagina) || PAGINAS[0];
    const items = this.lista.filter(x => x.pagina === pag.id);
    const sig = HITOS.find(h => !d.hitos.includes(String(h.n)));
    const html = `
      <div class="al-cabecera">
        <div class="al-progreso"><b>📒 ${n} / ${total} pegatinas</b><div class="al-barra"><i style="width:${(n / total) * 100}%"></i></div></div>
        <div class="al-hitos">${HITOS.map(h => {
          const m = this.meta(h);
          const cobrado = d.hitos.includes(String(h.n));
          const listo = !cobrado && n >= m;
          return `<button class="al-hito ${cobrado ? 'cobrado' : ''} ${listo ? 'listo' : ''}" data-h="${h.n}" ${listo ? '' : 'disabled'}><b>${h.n === 'todo' ? '💯' : m}</b><small>${cobrado ? '✅' : `🪙${paga(h.monedas)}${h.tickets ? ` 🎟️${h.tickets}` : ''}`}</small></button>`;
        }).join('')}</div>
        ${sig && n < this.meta(sig) ? `<small class="nota">Te faltan ${this.meta(sig) - n} para el siguiente premio</small>` : ''}
      </div>
      <div class="al-pestanas">${PAGINAS.map(p => {
        if (p.especial) {
          const n = (this.ctx.estado.colecciones || []).length;
          return `<button data-p="${p.id}" class="${p.id === pag.id ? 'activo' : ''}">${p.icono}<small>${n} hechas</small></button>`;
        }
        const its = this.lista.filter(x => x.pagina === p.id);
        const c = its.filter(x => tiene.has(x.clave)).length;
        const nueva = its.some(x => nuevas.has(x.clave));
        return `<button data-p="${p.id}" class="${p.id === pag.id ? 'activo' : ''}">${p.icono}<small>${c}/${its.length}</small>${nueva ? '<i class="al-punto"></i>' : ''}</button>`;
      }).join('')}</div>
      <h4 class="al-titulo">${pag.icono} ${pag.nombre}</h4>
      ${pag.especial ? (this.ctx.htmlColecciones ? this.ctx.htmlColecciones() : '') : `<div class="al-pagina">${items.map((x, i) => {
        const si = tiene.has(x.clave);
        return `<div class="al-pegatina ${si ? 'tiene' : 'falta'} ${x.raro ? 'rara' : ''} ${nuevas.has(x.clave) ? 'nueva' : ''}" style="--r:${((i * 37) % 9) - 4}deg" data-i="${i}">
          <img data-src="${i}" alt="">
          <small>${si ? this.nombre(x) : '???'}</small>
          ${nuevas.has(x.clave) ? '<em>¡Nueva!</em>' : ''}
        </div>`;
      }).join('')}</div>`}`;
    const cuerpo = ui.abrirGen('Álbum de pegatinas', html, volver);
    const imgs = [...cuerpo.querySelectorAll('.al-pegatina img')];
    let k = 0;
    const cargar = () => {
      if (!cuerpo.isConnected || k >= imgs.length) return;
      const ini = performance.now();
      while (k < imgs.length && performance.now() - ini < 12) {
        const el = imgs[k];
        el.src = this.imagen(items[Number(el.dataset.src)]);
        k++;
      }
      requestAnimationFrame(cargar);
    };
    requestAnimationFrame(cargar);
    cuerpo.querySelectorAll('.al-pestanas button').forEach(b => b.addEventListener('click', () => {
      this.pagina = b.dataset.p;
      this.abrir(volver);
    }));
    cuerpo.querySelectorAll('.al-hito.listo').forEach(b => b.addEventListener('click', () => this.cobrar(b.dataset.h, volver)));
    cuerpo.querySelectorAll('.al-pegatina').forEach(el => el.addEventListener('click', () => {
      const x = items[Number(el.dataset.i)];
      if (!tiene.has(x.clave)) {
        this.ctx.sonido.error();
        ui.aviso(x.mascota ? '🔒 Adoptad esta mascota para conseguir la pegatina' : x.raro ? '🔒 Es un objeto raro: sale en la ruleta, en premios o en sorpresas' : '🔒 Conseguid este objeto para pegarlo en el álbum');
        return;
      }
      el.classList.remove('nueva');
      this.ctx.sonido.pop();
      el.classList.add('salta');
      setTimeout(() => el.classList.remove('salta'), 400);
    }));
    if (items.some(x => nuevas.has(x.clave))) {
      d.nuevas = d.nuevas.filter(c => !items.some(x => x.clave === c));
      this.ctx.guardar();
    }
  }

  cobrar(id, volver) {
    const d = this.datos;
    const h = HITOS.find(x => String(x.n) === String(id));
    if (!h || d.hitos.includes(String(h.n)) || this.cuantas() < this.meta(h)) return;
    d.hitos.push(String(h.n));
    const monedas = paga(h.monedas);
    this.ctx.estado.monedas += monedas;
    this.ctx.estado.tickets += h.tickets;
    this.ctx.sonido.premio();
    this.ctx.refrescarHud();
    this.ctx.guardar();
    this.ctx.ui.dialogo({
      titulo: '📒 ¡Premio del álbum!',
      texto: `Por llegar a ${this.meta(h)} pegatinas: +${monedas} monedas${h.tickets ? ` y ${h.tickets} ticket${h.tickets > 1 ? 's' : ''} para la ruleta` : ''}.`,
      botones: [{ texto: '¡Genial!', tipo: 'primario', accion: () => this.abrir(volver) }],
      confeti: true
    });
  }

  rachaHtml(racha) {
    const dia = ((racha - 1) % 7) + 1;
    return `<div class="racha-semana">${PREMIOS_RACHA.map((p, i) => `<div class="racha-dia ${i + 1 < dia ? 'hecho' : i + 1 === dia ? 'hoy' : ''} ${i === 6 ? 'grande' : ''}">
      <small>Día ${i + 1}</small><span>${i + 1 < dia ? '✅' : p.icono}</span><em>${this.textoPremio(p)}</em></div>`).join('')}</div>`;
  }

  textoPremio(p) {
    const m = paga(p.monedas);
    const cosas = [p.raro ? 'Objeto raro' : null, p.items ? 'Pienso' : null, p.tickets ? `${p.tickets} ticket${p.tickets > 1 ? 's' : ''}` : null].filter(Boolean);
    return cosas.length ? `${cosas.join(' + ')} + ${m}` : `${m} monedas`;
  }

  premioRacha(racha) {
    const { estado, inventario } = this.ctx;
    const dia = ((racha - 1) % 7) + 1;
    const p = PREMIOS_RACHA[dia - 1];
    const extra = Math.min(3, Math.floor((racha - 1) / 7));
    const monedas = paga(p.monedas + extra * 10);
    estado.monedas += monedas;
    if (p.tickets) estado.tickets += p.tickets;
    const cosas = [];
    for (const [id, n] of p.items || []) {
      inventario.anadir(id, null, n);
      cosas.push(`${n} × ${(infoItem(id) || {}).nombre || id}`);
    }
    if (p.raro) {
      const raros = CATALOGO.filter(d => d.rareza && d.enTienda === false && !d.temporada && !d.exterior);
      const tiene = new Set(this.datos.tiene);
      const nuevos = raros.filter(d => !tiene.has(`m:${d.id}`));
      const d = (nuevos.length ? nuevos : raros)[Math.floor(Math.random() * (nuevos.length || raros.length))];
      if (d) {
        inventario.anadir(d.id, d.colores ? 0 : null);
        cosas.push(d.nombre);
      }
    }
    this.ctx.ui.pintarInventario(inventario);
    return { dia, monedas, tickets: p.tickets || 0, cosas };
  }
}
