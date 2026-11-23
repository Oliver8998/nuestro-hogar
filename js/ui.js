import { CATALOGO } from './muebles.js';
import { MATERIALES } from './materiales.js';

const DESPLAZAMIENTO = 70;

const CATEGORIAS = [
  { id: 'muebles', nombre: 'Muebles', icono: '🛋️' },
  { id: 'deco', nombre: 'Decoración', icono: '🪴' },
  { id: 'reparar', nombre: 'Reparación', icono: '🧰' }
];

function hex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}

export function infoItem(id) {
  const mueble = CATALOGO.find(d => d.id === id);
  if (mueble) return { ...mueble, tipo: 'mueble' };
  const material = MATERIALES.find(d => d.id === id);
  return material ? { ...material, tipo: 'material' } : null;
}

function iconoItem(info) {
  if (info.pinta) return `<span class="bote" style="background:${hex(info.pinta)}">${info.icono}</span>`;
  return `<span class="emoji">${info.icono}</span>`;
}

function puntoColor(info, color) {
  if (info.tipo !== 'mueble' || !info.colores || color === null || color === undefined) return '';
  return `<span class="punto" style="background:${hex(info.colores.paleta[color][0])}"></span>`;
}

export class UI {
  constructor(eventos) {
    const $ = id => document.getElementById(id);
    this.ev = eventos;
    this.elMonedas = $('monedas-valor');
    this.elMonedasTienda = $('monedas-tienda');
    this.elContador = $('contador');
    this.elRelleno = $('casa-relleno');
    this.elCasaIcono = $('casa-icono');
    this.elInventario = $('inventario');
    this.elBarra = $('barra');
    this.elTienda = $('tienda');
    this.elFondo = $('fondo');
    this.elRejilla = this.elTienda.querySelector('.rejilla');
    this.elPestanas = this.elTienda.querySelector('.pestanas');
    this.elMenu = $('menu-objeto');
    this.elAviso = $('aviso');
    this.elFantasma = $('fantasma');
    this.categoria = 'muebles';
    this.monedasActual = 0;
    this.inventario = null;
    this.cartas = [];
    this.menuAbierto = false;
    this.tAviso = null;

    for (const c of CATEGORIAS) {
      const b = document.createElement('button');
      b.dataset.cat = c.id;
      b.innerHTML = `${c.icono} ${c.nombre}`;
      b.addEventListener('click', () => {
        this.categoria = c.id;
        this.pintarTienda();
      });
      this.elPestanas.appendChild(b);
    }

    $('btn-tienda').addEventListener('click', () => this.abrirTienda());
    this.elFondo.addEventListener('click', () => this.cerrarTienda());
    this.elTienda.querySelector('.cerrar').addEventListener('click', () => this.cerrarTienda());
  }

  abrirTienda() {
    this.pintarTienda();
    this.elTienda.classList.add('abierta');
    this.elFondo.classList.add('abierta');
  }

  cerrarTienda() {
    this.elTienda.classList.remove('abierta');
    this.elFondo.classList.remove('abierta');
  }

  pintarTienda() {
    for (const b of this.elPestanas.children) b.classList.toggle('activa', b.dataset.cat === this.categoria);
    const lista = this.categoria === 'reparar'
      ? MATERIALES.map(m => ({ ...m, tipo: 'material' }))
      : CATALOGO.filter(d => d.enTienda !== false && d.categoria === this.categoria).map(d => ({ ...d, tipo: 'mueble' }));

    this.elRejilla.innerHTML = '';
    this.elRejilla.dataset.cat = this.categoria;
    this.elRejilla.scrollTop = 0;
    this.cartas = [];

    for (const info of lista) {
      const carta = document.createElement('div');
      carta.className = 'carta';
      const detalle = info.tipo === 'mueble' ? `${info.ancho * 0.5} × ${info.fondo * 0.5} m` : info.pista;
      carta.innerHTML = `
        <span class="tienes"></span>
        <div class="carta-icono">${iconoItem(info)}</div>
        <div class="carta-nombre">${info.nombre}</div>
        <div class="carta-info">${detalle}</div>
        <button class="comprar">🪙 ${info.precio}</button>`;
      const boton = carta.querySelector('.comprar');
      boton.addEventListener('click', () => {
        if (!this.ev.alComprar(info)) return;
        carta.classList.remove('comprada');
        void carta.offsetWidth;
        carta.classList.add('comprada');
      });
      this.elRejilla.appendChild(carta);
      this.cartas.push({ carta, info, boton, tienes: carta.querySelector('.tienes') });
    }
    this.refrescarTienda();
  }

  refrescarTienda() {
    for (const { info, boton, tienes } of this.cartas) {
      boton.disabled = info.precio > this.monedasActual;
      const n = this.inventario ? this.inventario.cantidad(info.id) : 0;
      tienes.textContent = n ? `×${n}` : '';
      tienes.classList.toggle('oculto', !n);
    }
  }

  monedas(n) {
    this.monedasActual = n;
    this.elMonedas.textContent = n;
    this.elMonedasTienda.textContent = n;
    this.refrescarTienda();
  }

  casa({ hechos, total }) {
    this.elContador.textContent = `${hechos}/${total}`;
    this.elRelleno.style.width = `${Math.round(hechos / total * 100)}%`;
    this.elCasaIcono.textContent = hechos >= total ? '🏡' : '🏚️';
  }

  pintarInventario(inventario) {
    this.inventario = inventario;
    this.elInventario.innerHTML = '';
    if (!inventario.items.length) {
      this.elInventario.innerHTML = '<div class="vacio">Aquí aparecerá lo que compres 🛍️</div>';
    }
    for (const item of inventario.items) {
      const info = infoItem(item.id);
      if (!info) continue;
      const ranura = document.createElement('div');
      ranura.className = 'ranura';
      ranura.innerHTML = `${iconoItem(info)}${puntoColor(info, item.color)}${item.cantidad > 1 ? `<span class="cuenta">${item.cantidad}</span>` : ''}`;
      ranura.addEventListener('pointerdown', e => this.tocarRanura(e, item, info, ranura));
      this.elInventario.appendChild(ranura);
    }
    this.refrescarTienda();
  }

  sobreBarra(y) {
    return y > this.elBarra.getBoundingClientRect().top;
  }

  tocarRanura(e, item, info, ranura) {
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let arrastrando = false;

    const mover = ev => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (!arrastrando) {
        if (!(dy < -12 && Math.abs(dy) > Math.abs(dx))) return;
        arrastrando = true;
        try { ranura.setPointerCapture(id); } catch (err) {}
        ranura.classList.add('levantada');
        this.cerrarMenu();
        this.mostrarFantasma(info);
        this.ev.alEmpezarArrastre(item, info);
      }
      const y = ev.clientY - DESPLAZAMIENTO;
      this.moverFantasma(ev.clientX, y);
      const estado = this.ev.alMoverArrastre(ev.clientX, y, this.sobreBarra(ev.clientY));
      this.elFantasma.classList.toggle('ok', estado === 'ok');
      this.elFantasma.classList.toggle('mal', estado === 'mal');
    };

    const fin = ev => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', fin);
      window.removeEventListener('pointercancel', fin);
      if (arrastrando) {
        ranura.classList.remove('levantada');
        this.ocultarFantasma();
        const cancelar = ev.type === 'pointercancel' || this.sobreBarra(ev.clientY);
        this.ev.alSoltarArrastre(ev.clientX, ev.clientY - DESPLAZAMIENTO, cancelar);
      } else if (ev.type === 'pointerup' && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 10) {
        this.ev.alTocarItem(item, info);
      }
    };

    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', fin);
    window.addEventListener('pointercancel', fin);
  }

  mostrarFantasma(info) {
    this.elFantasma.innerHTML = iconoItem(info);
    this.elFantasma.className = info.tipo === 'mueble' ? 'mueble' : '';
  }

  moverFantasma(x, y) {
    this.elFantasma.style.left = `${x}px`;
    this.elFantasma.style.top = `${y}px`;
  }

  ocultarFantasma() {
    this.elFantasma.className = 'oculto';
  }

  abrirMenu(opciones) {
    this.elMenu.innerHTML = '';
    for (const op of opciones) {
      const b = document.createElement('button');
      b.innerHTML = `<span class="icono">${op.icono}</span>${op.texto}`;
      b.disabled = !!op.desactivado;
      b.addEventListener('click', op.accion);
      this.elMenu.appendChild(b);
    }
    this.menuAbierto = true;
  }

  cerrarMenu() {
    this.menuAbierto = false;
    this.elMenu.classList.add('oculto');
  }

  posicionarMenu(x, y) {
    if (!this.menuAbierto) return;
    if (x === null) {
      this.elMenu.classList.add('oculto');
      return;
    }
    this.elMenu.classList.remove('oculto');
    const w = this.elMenu.offsetWidth;
    const h = this.elMenu.offsetHeight;
    const limiteAbajo = this.elBarra.getBoundingClientRect().top - 10;
    const izq = Math.min(Math.max(x, w / 2 + 8), window.innerWidth - w / 2 - 8);
    const abajo = Math.min(Math.max(y - 14, h + 64), limiteAbajo);
    this.elMenu.style.left = `${izq}px`;
    this.elMenu.style.top = `${abajo}px`;
  }

  aviso(texto) {
    this.elAviso.textContent = texto;
    this.elAviso.classList.add('visible');
    clearTimeout(this.tAviso);
    this.tAviso = setTimeout(() => this.elAviso.classList.remove('visible'), 2200);
  }
}
