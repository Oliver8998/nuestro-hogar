import { CATALOGO, MATERIALES, RAREZAS, infoItem } from './catalogo.js';
import { ESPECIES } from './mascotas.js';
import { SEGMENTOS, PIEZAS_PREMIO, COLOR_REGALO, COSTE_TIRADA, poolDe } from './ruleta.js';
import { EscenaTienda } from './tienda3d.js';
import { mostradorActual } from './mostrador.js';
import * as THREE from 'three';

const escapar = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DESPLAZAMIENTO = 70;

const CATEGORIAS = [
  { id: 'mostrador', nombre: 'Mostrador', icono: '🏪' },
  { id: 'reparar', nombre: 'Reparar', icono: '🧰' },
  { id: 'basicos', nombre: 'Básicos', icono: '🧴' },
  { id: 'temporada', nombre: 'Temporada', icono: '🎁' },
  { id: 'mercadillo', nombre: 'Mercadillo', icono: '🧺' }
];
const ALIAS_CATEGORIA = { muebles: 'mostrador', deco: 'mostrador', exterior: 'mostrador', limpieza: 'basicos', mascotas: 'basicos' };

const FRASES_MASCOTA = [
  '¡Mirad qué carita! Busca una familia.',
  'Este pequeñín lleva días esperando a alguien como vosotros.',
  'Se porta genial, os lo prometo.'
];

const FRASES_PRODUCTO = [
  'Mirad qué bonito queda dando vueltas.',
  'Este se vende muchísimo, ¿eh?',
  'Os lo dejo a buen precio.',
  'A mí me encanta, de verdad.',
  'Probad los colores, que hay para todos los gustos.'
];

const FRASES_LOLA = [
  '¡Hola, pareja! ¿Qué os llevo hoy?',
  'Todo recién llegado, ¡mirad, mirad!',
  'Cada dos días cambio lo del mostrador. ¡Si os gusta algo, no lo dejéis escapar!',
  'Hoy tengo una mascota buscando casa en el mostrador…',
  'Si tenéis algo roto, aquí está la solución.',
  'Ese sofá quedaría precioso en vuestra casa.',
  '¿Ya habéis probado la ruleta? Dicen que da cosas únicas…'
];

function hex(n) {
  return '#' + n.toString(16).padStart(6, '0');
}

function semillaHoy() {
  const d = new Date();
  return d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
}

export function ofertaDelDia() {
  const candidatos = CATALOGO.filter(d => d.enTienda !== false && !d.exterior && !d.temporada && d.precio >= 20);
  const d = candidatos[semillaHoy() % candidatos.length];
  return { id: d.id, precio: Math.round(d.precio * 0.7) };
}

export class UI {
  constructor(miniaturas, eventos) {
    const $ = id => document.getElementById(id);
    this.$ = $;
    this.mini = miniaturas;
    this.ev = eventos;
    this.elMonedas = $('monedas-valor');
    this.elTickets = $('tickets-valor');
    this.elContador = $('contador');
    this.elRelleno = $('casa-relleno');
    this.elCasaIcono = $('casa-icono');
    this.elInventario = $('inventario');
    this.elBarra = $('barra');
    this.elFondo = $('fondo');
    this.elMenu = $('menu-objeto');
    this.elAviso = $('aviso');
    this.elFantasma = $('fantasma');
    this.elParticulas = $('capa-particulas');
    this.elDialogo = $('dialogo');
    this.categoria = 'mostrador';
    this.monedasActual = 0;
    this.ticketsActual = 0;
    this.inventario = null;
    this.cartas = [];
    this.menuAbierto = false;
    this.tAviso = null;
    this.hojaAbierta = null;
    this.girando = false;
    this.anguloRuleta = 0;

    this.escena3d = new EscenaTienda($('tienda-escena'));
    this.sel = null;
    const pestanas = document.querySelector('#tienda .pestanas-v');
    for (const c of CATEGORIAS) {
      const b = document.createElement('button');
      b.dataset.cat = c.id;
      b.title = c.nombre;
      b.innerHTML = `<span>${c.icono}</span>${c.nombre}`;
      if (c.id === 'temporada' || c.id === 'mercadillo') b.classList.add('oculto');
      b.addEventListener('click', () => {
        if (this.categoria === c.id) return;
        this.categoria = c.id;
        this.ev.alSonido('tocar');
        this.pintarListaTienda(true);
      });
      pestanas.appendChild(b);
    }
    this.escena3d.alTocarHueco = i => {
      if (this.categoria !== 'mostrador' || !this.entradas[i]) return;
      this.ev.alSonido('tocar');
      this.seleccionarProducto(i);
    };
    $('det-comprar').addEventListener('click', () => this.comprarSeleccion());
    $('det-regalar').addEventListener('click', () => this.sel && this.ev.alRegalar(this.sel.info, this.sel.color, this.sel.precio));
    $('det-desear').addEventListener('click', () => {
      if (!this.sel) return;
      const si = this.ev.alDesear(this.sel.info, this.sel.color);
      this.$('det-desear').textContent = si ? '❤️' : '🤍';
    });
    $('det-proponer').addEventListener('click', () => this.sel && this.ev.alProponer(this.sel.info, this.sel.color, this.sel.precio));

    $('btn-tienda').addEventListener('click', () => this.abrirTienda());
    $('btn-inventario').addEventListener('click', () => this.alternarInventario());
    $('cerrar-inv').addEventListener('click', () => this.cerrarInventario());
    $('chip-reparto').addEventListener('click', () => this.ev.alChipReparto());
    $('btn-misiones').addEventListener('click', () => this.abrirMisiones());
    $('pill-evento').addEventListener('click', () => this.abrirMisiones());
    $('pill-limpieza').addEventListener('click', () => this.ev.alInfoLimpieza());
    this.inventarioAbierto = false;
    this.elInventario.addEventListener('scroll', () => this.actualizarScroll());
    window.addEventListener('resize', () => this.actualizarScroll());
    const pista = $('inv-scroll');
    const arrastrarScroll = e => {
      const r = pista.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      this.elInventario.scrollTop = k * (this.elInventario.scrollHeight - this.elInventario.clientHeight);
    };
    pista.addEventListener('pointerdown', e => {
      pista.setPointerCapture(e.pointerId);
      arrastrarScroll(e);
      const mover = ev => arrastrarScroll(ev);
      const fin = () => {
        pista.removeEventListener('pointermove', mover);
        pista.removeEventListener('pointerup', fin);
        pista.removeEventListener('pointercancel', fin);
      };
      pista.addEventListener('pointermove', mover);
      pista.addEventListener('pointerup', fin);
      pista.addEventListener('pointercancel', fin);
    });
    $('btn-ruleta').addEventListener('click', () => this.abrirRuleta());
    $('btn-mas').addEventListener('click', () => this.ev.alMas());
    $('pill-clima').addEventListener('click', () => this.ev.alClima());
    $('pill-hab').addEventListener('click', () => this.ev.alHabitaciones());
    $('pill-acogedor').addEventListener('click', () => this.ev.alAcogedor());
    $('gen-atras').addEventListener('click', () => this.genAtras && this.genAtras());
    $('btn-tirar').addEventListener('click', () => this.tirar());
    this.elFondo.addEventListener('click', () => this.cerrarHojas());
    document.querySelectorAll('.hoja .cerrar, .pantalla .cerrar').forEach(b => b.addEventListener('click', () => this.cerrarHojas()));
  }

  img(src, clase = '') {
    return `<img class="${clase}" src="${src}" alt="" draggable="false">`;
  }

  abrirHoja(id) {
    this.ev.alSonido('pop');
    this.cerrarMenu();
    if (this.hojaAbierta && this.hojaAbierta !== id) this.$(this.hojaAbierta).classList.remove('abierta');
    this.hojaAbierta = id;
    this.$(id).classList.add('abierta');
    this.elFondo.classList.add('abierta');
  }

  cerrarHojas() {
    if (this.girando) return;
    if (this.hojaAbierta) this.$(this.hojaAbierta).classList.remove('abierta');
    if (this.hojaAbierta === 'tienda') setTimeout(() => { if (this.hojaAbierta !== 'tienda') this.escena3d.cerrar(); }, 400);
    this.hojaAbierta = null;
    this.elFondo.classList.remove('abierta');
  }

  ponerNivelCasa(n) {
    this.nivelCasa = n;
  }

  ponerMercadillo(si) {
    const b = document.querySelector('#tienda .pestanas-v button[data-cat="mercadillo"]');
    if (b) b.classList.toggle('oculto', !si);
    if (!si && this.categoria === 'mercadillo') this.categoria = 'mostrador';
  }

  ponerTemporada(t, nombre) {
    this.temporada = t;
    const b = document.querySelector('#tienda .pestanas-v button[data-cat="temporada"]');
    if (b) {
      b.classList.toggle('oculto', !t);
      if (t) b.innerHTML = `<span>${nombre.split(' ')[0]}</span>${nombre.split(' ').slice(1).join(' ')}`;
    }
    if (!t && this.categoria === 'temporada') this.categoria = 'mostrador';
  }

  abrirGen(titulo, html, atras = null) {
    this.$('gen-titulo').textContent = titulo;
    const cuerpo = this.$('gen-cuerpo');
    cuerpo.innerHTML = html;
    cuerpo.scrollTop = 0;
    this.genAtras = atras;
    this.$('gen-atras').classList.toggle('oculto', !atras);
    if (this.hojaAbierta !== 'hoja-gen') this.abrirHoja('hoja-gen');
    return cuerpo;
  }

  decirLola(frase) {
    const el = this.$('frase-lola');
    el.textContent = frase;
    const b = el.parentElement;
    b.classList.remove('hablando');
    void b.offsetWidth;
    b.classList.add('hablando');
  }

  abrirTienda(categoria) {
    if (categoria) this.categoria = ALIAS_CATEGORIA[categoria] || categoria;
    this.decirLola(FRASES_LOLA[Math.floor(Math.random() * FRASES_LOLA.length)]);
    this.abrirHoja('tienda');
    this.escena3d.abrir();
    this.pintarListaTienda(!categoria && this.sel ? false : true);
  }

  entradasTienda() {
    const entradas = [];
    if (this.categoria === 'mostrador') {
      const m = mostradorActual({ nivelCasa: this.nivelCasa || 0, imprescindibles: this.ev.alImprescindibles ? this.ev.alImprescindibles() : [] });
      this.mostradorInfo = m;
      for (const x of m.items) entradas.push({ info: infoItem(x.id), precio: x.precio, oferta: x.oferta });
      const e = ESPECIES[m.mascota];
      const vendida = this.ev.alMascotaVendida ? this.ev.alMascotaVendida(m.periodo) : false;
      entradas.splice(5, 0, { mascota: m.mascota, vendida, info: { id: `mascota:${m.mascota}`, nombre: e.nombre, tipo: 'mascota' }, precio: e.precio, oferta: false });
      for (const id of (this.ev.alOfertasExtra ? this.ev.alOfertasExtra() : [])) {
        if (!infoItem(id) || entradas.some(x => x.info.id === id)) continue;
        entradas.push({ info: infoItem(id), precio: Math.round(infoItem(id).precio * 0.75), oferta: true, carta: true });
      }
      return entradas;
    }
    if (this.categoria === 'mercadillo') {
      for (const x of (this.ev.alMercadillo ? this.ev.alMercadillo() : [])) entradas.push({ info: infoItem(x.id), precio: x.precio, oferta: false, mercadillo: true });
      return entradas;
    }
    for (const d of [...CATALOGO, ...MATERIALES]) {
      if (this.categoria === 'temporada') {
        if (d.temporada && d.temporada === this.temporada) entradas.push({ info: infoItem(d.id), precio: d.precio, oferta: false });
        continue;
      }
      if (d.enTienda === false) continue;
      if (this.categoria === 'reparar' && d.categoria !== 'reparar') continue;
      if (this.categoria === 'basicos' && !(MATERIALES.includes(d) && (d.categoria === 'limpieza' || d.categoria === 'mascotas'))) continue;
      entradas.push({ info: infoItem(d.id), precio: d.precio, oferta: false });
    }
    return entradas;
  }

  pintarListaTienda(elegirPrimero) {
    for (const b of document.querySelectorAll('#tienda .pestanas-v button')) b.classList.toggle('activa', b.dataset.cat === this.categoria);
    const lista = document.querySelector('#tienda .lista-items');
    lista.innerHTML = '';
    lista.scrollLeft = 0;
    this.entradas = this.entradasTienda();
    const mostrador = this.categoria === 'mostrador';
    this.escena3d.modoMostrador(mostrador);
    if (mostrador) this.escena3d.ponerMostrador(this.entradas);
    const rot = this.$('tienda-rotacion');
    rot.classList.toggle('oculto', !mostrador);
    if (mostrador) rot.textContent = `🔄 Productos nuevos en ${this.mostradorInfo.cambia}`;
    this.entradas.forEach((entrada, i) => {
      const b = document.createElement('button');
      b.className = `item-lista${entrada.mascota ? ' es-mascota' : ''}${entrada.vendida ? ' vendida' : ''}`;
      const imagen = entrada.mascota ? this.mini.mascota(entrada.mascota) : this.mini.item(entrada.info.id, entrada.info.colores ? 0 : null);
      const etiqueta = entrada.mascota ? '<span class="etq-oferta etq-mascota">🐾</span>' : entrada.oferta ? `<span class="etq-oferta">${entrada.carta ? '✉️' : ''}-${entrada.carta ? 25 : 30}%</span>` : '';
      b.innerHTML = `${etiqueta}${this.img(imagen)}<span class="nombre-item">${entrada.info.nombre}</span><span>${entrada.vendida ? '💕' : `🪙 ${entrada.precio}`}</span>`;
      b.addEventListener('click', () => {
        this.ev.alSonido('tocar');
        this.seleccionarProducto(i);
      });
      entrada.boton = b;
      lista.appendChild(b);
    });
    let indice = 0;
    if (!elegirPrimero && this.sel) {
      const k = this.entradas.findIndex(e => e.info.id === this.sel.info.id && e.oferta === this.sel.oferta);
      if (k >= 0) indice = k;
    }
    if (this.entradas.length) this.seleccionarProducto(indice, elegirPrimero);
  }

  seleccionarProducto(indice, silencio = false) {
    const entrada = this.entradas[indice];
    const info = entrada.info;
    const misma = this.sel && this.sel.info.id === info.id && this.sel.oferta === entrada.oferta;
    if (!misma) {
      this.sel = {
        ...entrada,
        color: info.colores ? 0 : null,
        encendido: info.encendible ? true : false,
        cantidad: 1
      };
    } else {
      Object.assign(this.sel, { vendida: entrada.vendida, precio: entrada.precio, oferta: entrada.oferta });
    }
    this.entradas.forEach(e => e.boton.classList.toggle('activa', e === entrada));
    entrada.boton.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (this.categoria === 'mostrador' && indice < 8) this.escena3d.seleccionarHueco(indice, this.sel.color, this.sel.encendido);
    else this.escena3d.mostrar(info, this.sel.color, this.sel.encendido);
    if (!silencio && !misma) {
      const frases = entrada.mascota ? (entrada.vendida ? ['¡Ese ya se fue con vosotros! Pronto llegará otro.'] : FRASES_MASCOTA) : FRASES_PRODUCTO;
      this.decirLola(frases[Math.floor(Math.random() * frases.length)]);
    }
    this.pintarDetalle();
  }

  pintarDetalle() {
    const { info, oferta } = this.sel;
    this.$('det-nombre').textContent = info.nombre;
    if (this.sel.mascota) {
      const e = ESPECIES[this.sel.mascota];
      this.$('det-info').innerHTML = `<div class="det-mascota-texto">${e.texto}</div>` + this.rasgosEspecie(e).map(t => `<span class="chip">${t}</span>`).join('') + '<div class="det-mascota-nota">Llega con su propia personalidad 🎲</div>';
      this.$('det-opciones').innerHTML = '';
      this.refrescarTienda();
      this.ajustarListaTienda();
      return;
    }
    const chips = [];
    if (oferta) chips.push(`<span class="chip oferta">Oferta · antes ${info.precio}</span>`);
    if (this.sel.mercadillo) chips.push(`<span class="chip oferta">🧺 Mercadillo del finde</span>`);
    if (info.tipo === 'mueble') {
      chips.push(`<span class="chip">📐 ${info.ancho * 0.5} × ${info.fondo * 0.5} m</span>`);
      if (info.soporte) chips.push('<span class="chip">📚 Se puede apilar encima</span>');
      if (info.paraMascota || info.categoria === 'mascotas') chips.push('<span class="chip">🐾 Para mascotas</span>');
      if (info.suelo) chips.push('<span class="chip">Va en el suelo</span>');
    }
    if (info.usos > 1) chips.push(`<span class="chip">🔁 ${info.usos} usos</span>`);
    this.$('det-info').innerHTML = chips.join('') + (info.tipo === 'material' ? `<div>${info.pista}</div>` : '');

    const opciones = this.$('det-opciones');
    opciones.innerHTML = '';
    if (info.colores) {
      const fila = document.createElement('div');
      fila.className = 'opcion';
      fila.innerHTML = `<span>Color</span><div class="muestras">${info.colores.paleta.map((p, i) => `<button data-i="${i}" style="background:${hex(p[0])}" class="${i === this.sel.color ? 'activa' : ''}"></button>`).join('')}</div>`;
      fila.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        this.sel.color = +b.dataset.i;
        fila.querySelectorAll('button').forEach(x => x.classList.toggle('activa', x === b));
        this.escena3d.ponerColor(this.sel.color);
        this.ev.alSonido('tocar');
      }));
      opciones.appendChild(fila);
    }
    if (info.encendible) {
      const fila = document.createElement('div');
      fila.className = 'opcion';
      fila.innerHTML = '<span>Luz</span><button class="interruptor"></button>';
      const b = fila.querySelector('button');
      const pintar = () => {
        b.textContent = this.sel.encendido ? '💡 Encendida' : '🌙 Apagada';
        b.classList.toggle('encendido', this.sel.encendido);
      };
      pintar();
      b.addEventListener('click', () => {
        this.sel.encendido = !this.sel.encendido;
        this.escena3d.ponerEncendido(this.sel.encendido);
        pintar();
        this.ev.alSonido('pop');
      });
      opciones.appendChild(fila);
    }
    if (info.tipo === 'material' && !info.servicio && !info.mascota) {
      const fila = document.createElement('div');
      fila.className = 'opcion';
      fila.innerHTML = '<span>Cantidad</span><div class="cantidad"><button data-d="-1">−</button><b></b><button data-d="1">+</button></div>';
      const valor = fila.querySelector('b');
      valor.textContent = this.sel.cantidad;
      fila.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        this.sel.cantidad = Math.min(9, Math.max(1, this.sel.cantidad + +b.dataset.d));
        valor.textContent = this.sel.cantidad;
        this.ev.alSonido('tocar');
        this.refrescarTienda();
      }));
      opciones.appendChild(fila);
    }
    this.refrescarTienda();
    this.ajustarListaTienda();
  }

  ajustarListaTienda() {
    requestAnimationFrame(() => {
      const alto = document.querySelector('.tienda-detalle').offsetHeight;
      document.documentElement.style.setProperty('--alto-detalle', `${alto}px`);
    });
  }

  refrescarTienda() {
    if (!this.sel) return;
    const total = this.sel.precio * this.sel.cantidad;
    const boton = this.$('det-comprar');
    if (this.sel.mascota) {
      boton.innerHTML = this.sel.vendida ? '💕 Ya tiene casa' : `🐾 Adoptar · 🪙 ${this.sel.precio}`;
      boton.disabled = this.sel.vendida || this.sel.precio > this.monedasActual;
      ['det-regalar', 'det-desear', 'det-proponer'].forEach(id => this.$(id).classList.add('oculto'));
      this.$('det-tienes').classList.add('oculto');
      return;
    }
    boton.innerHTML = `Comprar${this.sel.cantidad > 1 ? ` ${this.sel.cantidad}` : ''} · 🪙 ${total}`;
    boton.disabled = total > this.monedasActual;
    const pareja = this.ev.alHayPareja && this.ev.alHayPareja();
    const regalable = pareja && this.sel.info.tipo === 'mueble' && this.sel.cantidad === 1;
    this.$('det-regalar').classList.toggle('oculto', !regalable);
    this.$('det-desear').classList.toggle('oculto', this.sel.info.tipo !== 'mueble');
    this.$('det-desear').textContent = this.ev.alEsDeseo && this.ev.alEsDeseo(this.sel.info.id) ? '❤️' : '🤍';
    this.$('det-proponer').classList.toggle('oculto', !regalable);
    const n = this.inventario ? this.inventario.cantidad(this.sel.info.id) : 0;
    const t = this.$('det-tienes');
    t.textContent = `Tienes ${n}`;
    t.classList.toggle('oculto', !n);
  }

  comprarSeleccion() {
    if (this.sel.mascota) {
      if (this.sel.vendida) return;
      this.escena3d.reaccionar('feliz');
      this.decirLola('¡Qué ilusión! Ponedle un nombre bonito.');
      this.ev.alAdoptarMostrador(this.sel.mascota, this.mostradorInfo.periodo);
      return;
    }
    const { info, color, precio, cantidad } = this.sel;
    if (!this.ev.alComprar(info, color, precio, cantidad)) {
      this.escena3d.reaccionar('no');
      this.decirLola('Uy… no os llega. ¡Probad suerte en la ruleta!');
      return;
    }
    this.escena3d.reaccionar('feliz');
    this.decirLola(['¡Buena elección!', '¡Me encanta ese!', '¡Os va a quedar genial!', '¡Marchando! Os lo mando a casa.'][Math.floor(Math.random() * 4)]);
  }

  rasgosEspecie(e) {
    const r = [];
    r.push(e.tam < 0.8 ? '🤏 Pequeñito' : e.tam < 1.05 ? '🐾 Mediano' : '🦮 Grande');
    r.push(e.velocidad < 0.3 ? '🐢 Muy tranquilo' : e.velocidad < 0.6 ? '😌 Tranquilo' : e.velocidad < 0.8 ? '⚡ Activo' : '🚀 Muy activo');
    if (e.gato) r.push('🧶 Usa el rascador');
    if (e.perro) r.push('🦴 Le encanta pasear');
    if (e.hocico === 'zorro') r.push('🦴 Sale de paseo');
    if (e.salta) r.push('🐇 Da saltitos');
    if (e.mofletes) r.push('🌰 Guarda comida en los mofletes');
    if (e.pinguino) r.push('🛷 Se desliza al correr');
    if (e.loro) r.push('💬 Repite lo que oye');
    if (e.dragon) r.push('🔥 Echa fueguitos');
    if (e.tortuga) r.push('⏳ Vive muchísimo');
    if (e.ave && !e.pinguino && !e.loro) r.push('🪶 Aletea cuando está contento');
    if (e.manchas) r.push('🍀 Hace ruiditos felices');
    return r;
  }

  fichaEspecie(id) {
    const e = ESPECIES[id];
    const rasgos = this.rasgosEspecie(e);
    const exclusivo = e.exclusivo;
    const puede = !exclusivo && e.precio <= this.monedasActual;
    this.dialogo({
      imagen: this.mini.mascota(id),
      titulo: e.nombre,
      etiqueta: exclusivo ? { texto: `✨ ${RAREZAS[exclusivo].nombre}`, color: RAREZAS[exclusivo].color } : null,
      html: `<p class="adopta-texto">${e.texto}</p><div class="adopta-rasgos">${rasgos.map(t => `<span>${t}</span>`).join('')}</div>
        <p class="adopta-nota">Cada mascota llega con su propia personalidad: dormilona, traviesa, glotona, cariñosa o juguetona.</p>`,
      botones: exclusivo
        ? [{ texto: '🎡 Solo sale en la ruleta', tipo: 'secundario' }]
        : [{ texto: 'Ahora no', tipo: 'secundario' }, { texto: puede ? `🐾 Adoptar · 🪙 ${e.precio}` : `Faltan 🪙 ${e.precio - this.monedasActual}`, tipo: puede ? 'primario' : 'secundario', accion: () => puede && this.ev.alAdoptar(id) }]
    });
  }

  abrirRefugio(propias = this.ev.alPedirMascotas(), soloMias = true) {
    this.$('img-mateo').src = this.mini.personaje('mateo');
    const lista = this.$('lista-mascotas');
    const barra = (v, color) => `<i class="adopta-barra"><b style="width:${Math.max(4, Math.round(v))}%;background:${color}"></b></i>`;
    const pers = { dormilona: '😴', traviesa: '😼', glotona: '🍖', carinosa: '🥰', juguetona: '🎾' };
    lista.innerHTML = propias.length
      ? propias.map((m, k) => `<button class="adopta-mia" data-k="${k}">
          <span class="adopta-mia-img">${this.img(this.mini.mascota(m.especie))}<em>${pers[m.personalidad] || '🐾'}</em></span>
          <span class="adopta-mia-datos"><b>${escapar(m.nombre)}</b><small>${m.edadDias() < 4 ? '🍼 Bebé' : ESPECIES[m.especie].nombre}</small>
          <span class="adopta-stats"><span>❤️${barra(m.felicidad, '#ef7f98')}</span><span>🍖${barra(m.hambre, '#f2a03c')}</span><span>⚡${barra(m.energia, '#6cc3a0')}</span></span></span>
        </button>`).join('')
      : '<div class="vacio adopta-vacio">🏠 Todavía no tenéis mascota. ¡Mirad quién espera abajo!</div>';
    lista.querySelectorAll('.adopta-mia').forEach(b => b.addEventListener('click', () => {
      const m = propias[Number(b.dataset.k)];
      if (this.ev.alVerMascota) this.ev.alVerMascota(m);
    }));
    const rejilla = document.querySelector('#refugio .rejilla');
    rejilla.classList.add('adopta-rejilla');
    if (soloMias) {
      rejilla.innerHTML = '';
      rejilla.classList.add('oculto');
      document.querySelector('#refugio .titulo-esperando').classList.add('oculto');
      this.abrirHoja('refugio');
      return;
    }
    rejilla.classList.remove('oculto');
    document.querySelector('#refugio .titulo-esperando').classList.remove('oculto');
    const filtros = [
      ['todas', 'Todas'], ['pelo', '🐾 Con pelo'], ['plumas', '🪶 Con plumas'], ['especiales', '✨ Especiales']
    ];
    const pinta = filtro => {
      const ids = Object.entries(ESPECIES).filter(([, e]) => filtro === 'todas' || (filtro === 'especiales' ? e.exclusivo : filtro === 'plumas' ? e.ave && !e.exclusivo : !e.ave && !e.exclusivo)).map(([id]) => id);
      rejilla.innerHTML = `<div class="adopta-filtros">${filtros.map(([f, t]) => `<button class="${f === filtro ? 'activo' : ''}" data-f="${f}">${t}</button>`).join('')}</div>` + ids.map((id, k) => {
        const e = ESPECIES[id];
        const tono = `#${new THREE.Color(e.color).lerp(new THREE.Color(0xffffff), 0.72).getHexString()}`;
        const rasgo = this.rasgosEspecie(e).slice(1, 2)[0] || '';
        return `<button class="adopta-carta${e.exclusivo ? ' exclusiva' : ''}" data-id="${id}" style="--tono:${tono};animation-delay:${k * 0.04}s">
          ${e.exclusivo ? `<span class="adopta-cinta" style="background:${RAREZAS[e.exclusivo].color}">✨ ${RAREZAS[e.exclusivo].nombre}</span>` : ''}
          <span class="adopta-foto">${this.img(this.mini.mascota(id))}</span>
          <b>${e.nombre}</b>
          <small>${rasgo}</small>
          <span class="adopta-precio ${e.exclusivo ? 'ruleta' : e.precio > this.monedasActual ? 'caro' : ''}">${e.exclusivo ? '🎡 Ruleta' : `🪙 ${e.precio}`}</span>
        </button>`;
      }).join('');
      rejilla.querySelectorAll('.adopta-filtros button').forEach(b => b.addEventListener('click', () => {
        this.ev.alSonido && this.ev.alSonido('tocar');
        pinta(b.dataset.f);
      }));
      rejilla.querySelectorAll('.adopta-carta').forEach(b => b.addEventListener('click', () => {
        this.ev.alSonido && this.ev.alSonido('tocar');
        this.fichaEspecie(b.dataset.id);
      }));
    };
    pinta('todas');
    this.abrirHoja('refugio');
  }

  async abrirRuleta() {
    this.abrirHoja('ruleta');
    this.refrescarRuleta();
    const tira = this.$('exclusivos');
    if (!tira.childElementCount) {
      for (const r of ['raro', 'epico', 'legendario']) {
        for (const id of poolDe(r)) {
          const info = infoItem(id);
          tira.insertAdjacentHTML('beforeend', `<div class="mini-premio" style="--c:${RAREZAS[r].color}">${this.img(this.mini.item(id))}<span>${info.nombre}</span></div>`);
        }
      }
    }
    if (!this.ruedaDibujada) await this.dibujarRueda();
  }

  async dibujarRueda() {
    const canvas = this.$('rueda');
    const tam = 600;
    canvas.width = tam;
    canvas.height = tam;
    const ctx = canvas.getContext('2d');
    const seg = Math.PI * 2 / SEGMENTOS.length;
    const R = tam / 2;
    const fuentes = SEGMENTOS.map(s => {
      if (s.tipo === 'monedas') return this.mini.piezas('premio:monedas', PIEZAS_PREMIO.monedas);
      if (s.tipo === 'ticket') return this.mini.piezas('premio:ticket', PIEZAS_PREMIO.ticket);
      return this.mini.piezas(`premio:regalo:${s.rareza}`, PIEZAS_PREMIO.regalo(COLOR_REGALO[s.rareza]));
    });
    const imagenes = await Promise.all(fuentes.map(src => new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    })));

    ctx.clearRect(0, 0, tam, tam);
    SEGMENTOS.forEach((s, i) => {
      const a0 = -Math.PI / 2 + i * seg;
      ctx.beginPath();
      ctx.moveTo(R, R);
      ctx.arc(R, R, R - 10, a0, a0 + seg);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fff';
      ctx.stroke();

      ctx.save();
      ctx.translate(R, R);
      ctx.rotate(a0 + seg / 2 + Math.PI / 2);
      const im = imagenes[i];
      if (im) ctx.drawImage(im, -48, -R + 34, 96, 96);
      ctx.fillStyle = '#3b2f26';
      ctx.font = '900 30px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const texto = s.tipo === 'monedas' ? `${s.cantidad}` : s.tipo === 'ticket' ? '+1' : RAREZAS[s.rareza].nombre;
      ctx.fillText(texto, 0, -R + 160);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(R, R, R - 6, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e58f9e';
    ctx.stroke();
    this.ruedaDibujada = true;
  }

  refrescarRuleta(estado = this.ev.alEstadoRuleta()) {
    const b = this.$('btn-tirar');
    b.disabled = this.girando;
    if (estado.gratis) b.innerHTML = '🎁 ¡Tirada gratis!';
    else if (estado.tickets > 0) b.innerHTML = `Tirar · 🎟️ 1 <small>(tienes ${estado.tickets})</small>`;
    else b.innerHTML = `Tirar · 🪙 ${COSTE_TIRADA}`;
  }

  async tirar() {
    if (this.girando) return;
    const resultado = this.ev.alGirar();
    if (!resultado) return;
    this.girando = true;
    this.refrescarRuleta();
    const seg = Math.PI * 2 / SEGMENTOS.length;
    const centro = (resultado.indice + 0.5) * seg;
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const vueltas = 5 + Math.floor(Math.random() * 2);
    const inicio = this.anguloRuleta;
    const base = inicio - (inicio % (Math.PI * 2));
    const fin = base + vueltas * Math.PI * 2 + (Math.PI * 2 - centro) + jitter;
    const rueda = this.$('rueda');
    const duracion = 4300;
    const t0 = performance.now();
    let ultimo = -1;

    await new Promise(res => {
      const paso = ahora => {
        const t = Math.min(1, (ahora - t0) / duracion);
        const e = 1 - Math.pow(1 - t, 4);
        const ang = inicio + (fin - inicio) * e;
        rueda.style.transform = `rotate(${ang}rad)`;
        const idx = Math.floor(((Math.PI * 2 - (ang % (Math.PI * 2))) % (Math.PI * 2)) / seg);
        if (idx !== ultimo) {
          ultimo = idx;
          this.ev.alSonido('tic');
          const p = this.$('puntero');
          p.classList.remove('golpe');
          void p.offsetWidth;
          p.classList.add('golpe');
        }
        if (t < 1) requestAnimationFrame(paso);
        else res();
      };
      requestAnimationFrame(paso);
    });

    this.anguloRuleta = fin;
    this.girando = false;
    this.refrescarRuleta();
    this.ev.alFinGiro(resultado.premio);
  }

  tiradaGratis(disponible) {
    this.$('btn-ruleta').querySelector('.insignia').classList.toggle('oculto', !disponible);
  }

  monedas(n) {
    if (n !== this.monedasActual) {
      this.elMonedas.parentElement.classList.remove('latido');
      void this.elMonedas.offsetWidth;
      this.elMonedas.parentElement.classList.add('latido');
    }
    this.monedasActual = n;
    this.elMonedas.textContent = n;
    document.querySelectorAll('.monedas-hoja').forEach(el => { el.textContent = n; });
    this.refrescarTienda();
  }

  tickets(n) {
    this.ticketsActual = n;
    this.elTickets.textContent = n;
    this.$('tickets-hoja').textContent = n;
    if (this.hojaAbierta === 'ruleta' && !this.girando) this.refrescarRuleta();
  }

  casa({ hechos, total }) {
    this.elContador.textContent = `${hechos}/${total}`;
    this.elRelleno.style.width = `${Math.round(hechos / total * 100)}%`;
    this.elCasaIcono.textContent = hechos >= total ? '🏡' : '🏚️';
  }

  iconoSonido() {}

  pintarInventario(inventario) {
    this.inventario = inventario;
    this.elInventario.innerHTML = '';
    if (!inventario.items.length) {
      this.elInventario.innerHTML = '<div class="vacio">Vacío. Lo que pidáis llegará en un paquete a la puerta 📦</div>';
    }
    const total = inventario.items.reduce((n, i) => n + i.cantidad, 0);
    const contador = this.$('btn-inventario').querySelector('.contador-inv');
    contador.textContent = total;
    contador.classList.toggle('oculto', !total);
    for (const item of inventario.items) {
      const info = infoItem(item.id);
      if (!info) continue;
      const ranura = document.createElement('div');
      ranura.className = 'ranura' + (info.rareza ? ` rareza-${info.rareza}` : '');
      const usos = info.usos > 1 ? `<span class="usos">${item.usos ?? info.usos}/${info.usos}</span>` : '';
      ranura.innerHTML = `${this.img(this.mini.item(item.id, item.color))}${item.cantidad > 1 ? `<span class="cuenta">${item.cantidad}</span>` : ''}${usos}`;
      ranura.addEventListener('pointerdown', e => this.tocarRanura(e, item, info, ranura));
      this.elInventario.appendChild(ranura);
    }
    this.refrescarTienda();
    requestAnimationFrame(() => this.actualizarScroll());
  }

  sobreBarra(y) {
    return this.inventarioAbierto && y > this.elBarra.getBoundingClientRect().top;
  }

  alternarInventario() {
    if (this.inventarioAbierto) this.cerrarInventario();
    else this.abrirInventario();
  }

  abrirInventario() {
    this.ev.alSonido('pop');
    this.inventarioAbierto = true;
    this.elBarra.classList.remove('cerrado');
    this.$('btn-inventario').querySelector('.contador-inv').classList.remove('nuevo');
    requestAnimationFrame(() => this.actualizarScroll());
  }

  cerrarInventario() {
    this.inventarioAbierto = false;
    this.elBarra.classList.add('cerrado');
  }

  actualizarScroll() {
    const el = this.elInventario;
    const pista = this.$('inv-scroll');
    const sobra = el.scrollHeight - el.clientHeight;
    pista.classList.toggle('oculto-scroll', sobra <= 2);
    if (sobra <= 2) return;
    const alto = pista.clientHeight;
    const tam = Math.max(24, alto * el.clientHeight / el.scrollHeight);
    const pulgar = pista.querySelector('i');
    pulgar.style.height = `${tam}px`;
    pulgar.style.top = `${(alto - tam) * (el.scrollTop / sobra)}px`;
  }

  chipReparto(texto, enPuerta) {
    const chip = this.$('chip-reparto');
    chip.classList.toggle('oculto', !texto);
    chip.classList.toggle('en-puerta', !!enPuerta);
    if (texto && chip.textContent !== texto) chip.textContent = texto;
  }

  limpieza(pct) {
    this.$('limpieza-valor').textContent = `${pct}%`;
    const p = this.$('pill-limpieza');
    p.classList.toggle('sucio', pct < 80 && pct >= 50);
    p.classList.toggle('muy-sucio', pct < 50);
  }

  chipEvento(texto) {
    const c = this.$('pill-evento');
    c.classList.toggle('oculto', !texto);
    if (texto && c.textContent !== texto) c.textContent = texto;
  }

  contadorMisiones(n) {
    const b = this.$('btn-misiones').querySelector('.contador-mis');
    b.textContent = n;
    b.classList.toggle('oculto', !n);
  }

  abrirMisiones() {
    this.pintarMisiones(this.ev.alPedirMisiones());
    this.abrirHoja('misiones');
  }

  pintarMisiones(d) {
    const ev = d.evento;
    this.$('evento-tarjeta').innerHTML = ev ? `
      <div class="evento">
        ${this.img(this.mini.personaje(ev.personaje))}
        <div>
          <h4>${ev.titulo}</h4>
          <p>${ev.texto}</p>
          <span class="cuenta-atras">⏳ ${ev.restante}</span>
          <div class="puntos">Cómo está la casa ahora: <b>${ev.puntos}/100</b>
            <div class="barra-stat"><i style="width:${ev.puntos}%;background:${ev.puntos >= 80 ? '#6cc08a' : ev.puntos >= 50 ? '#f2a03c' : '#e57373'}"></i></div>
            <small>${ev.detalle}</small>
          </div>
        </div>
      </div>` : '';

    const lista = this.$('lista-diarias');
    lista.innerHTML = '';
    for (const m of d.diarias) lista.appendChild(this.filaMision(m));
    const h = this.$('historia-tarjeta');
    h.innerHTML = '';
    if (d.historia) h.appendChild(this.filaMision(d.historia));
    else h.innerHTML = '<div class="vacio">¡Habéis completado toda la historia! 🏆</div>';
  }

  filaMision(m) {
    const fila = document.createElement('div');
    fila.className = 'mision' + (m.estado === 'hecha' ? ' hecha' : '');
    fila.innerHTML = `
      <span class="icono-m">${m.estado === 'hecha' ? '✅' : m.icono}</span>
      <div class="texto-m">${m.texto}<small>${m.premioTexto}${m.meta > 1 ? ` · ${m.progreso}/${m.meta}` : ''}</small>
        ${m.meta > 1 && m.estado === 'curso' ? `<div class="barra-stat"><i style="width:${Math.round(m.progreso / m.meta * 100)}%"></i></div>` : ''}
      </div>
      ${m.estado === 'lista' ? '<button>¡Recoger!</button>' : ''}`;
    const b = fila.querySelector('button');
    if (b) b.addEventListener('click', () => {
      m.accion();
      this.pintarMisiones(this.ev.alPedirMisiones());
    });
    return fila;
  }

  avisarInventarioNuevo() {
    const c = this.$('btn-inventario').querySelector('.contador-inv');
    c.classList.remove('nuevo');
    void c.offsetWidth;
    c.classList.add('nuevo');
  }

  tocarRanura(e, item, info, ranura) {
    const id = e.pointerId;
    const x0 = e.clientX;
    const y0 = e.clientY;
    let arrastrando = false;
    this.ev.alPrimerToque();

    const mover = ev => {
      if (ev.pointerId !== id) return;
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (!arrastrando) {
        if (Math.hypot(dx, dy) < 8 || info.mascota) return;
        arrastrando = true;
        try { ranura.setPointerCapture(id); } catch (err) {}
        ranura.classList.add('levantada');
        this.cerrarMenu();
        this.mostrarFantasma(item, info);
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

  mostrarFantasma(item, info) {
    this.elFantasma.innerHTML = this.img(this.mini.item(item.id, item.color));
    this.elFantasma.className = info.tipo === 'mueble' ? 'mueble' : '';
  }

  moverFantasma(x, y) {
    this.elFantasma.style.left = `${x}px`;
    this.elFantasma.style.top = `${y}px`;
  }

  ocultarFantasma() {
    this.elFantasma.className = 'oculto';
  }

  abrirMenu(opciones, cabecera = '') {
    this.elMenu.innerHTML = `${cabecera ? `<div class="menu-cabecera">${cabecera}</div>` : ''}<div class="menu-botones"></div>`;
    const fila = this.elMenu.querySelector('.menu-botones');
    for (const op of opciones) {
      const b = document.createElement('button');
      b.innerHTML = `<span class="icono">${op.icono}</span>${op.texto}`;
      b.disabled = !!op.desactivado;
      b.addEventListener('click', () => {
        this.ev.alSonido('tocar');
        op.accion();
      });
      fila.appendChild(b);
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
    const limiteAbajo = this.inventarioAbierto ? this.elBarra.getBoundingClientRect().top - 10 : window.innerHeight - 20;
    const izq = Math.min(Math.max(x, w / 2 + 8), window.innerWidth - w / 2 - 8);
    const abajo = Math.min(Math.max(y - 14, h + 64), limiteAbajo);
    this.elMenu.style.left = `${izq}px`;
    this.elMenu.style.top = `${abajo}px`;
  }

  aviso(texto, error = false) {
    this.elAviso.textContent = texto;
    this.elAviso.classList.toggle('error', error);
    this.elAviso.classList.add('visible');
    clearTimeout(this.tAviso);
    this.tAviso = setTimeout(() => this.elAviso.classList.remove('visible'), 2300);
  }

  particula(emoji, x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'particula';
      el.textContent = emoji;
      el.style.left = `${x + (Math.random() - 0.5) * 40}px`;
      el.style.top = `${y + (Math.random() - 0.5) * 20}px`;
      el.style.animationDelay = `${i * 0.12}s`;
      el.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
      this.elParticulas.appendChild(el);
      setTimeout(() => el.remove(), 1800 + i * 120);
    }
  }

  bocadillo(texto, x, y) {
    const el = document.createElement('span');
    el.className = 'bocadillo-obj';
    el.textContent = texto;
    el.style.left = `${Math.max(70, Math.min(innerWidth - 70, x))}px`;
    el.style.top = `${y}px`;
    this.elParticulas.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  confeti() {
    const colores = ['#e58f9e', '#f2d06b', '#6cc08a', '#5a9fd6', '#a35ee0'];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement('i');
      el.className = 'confeti';
      el.style.left = `${Math.random() * 100}vw`;
      el.style.background = colores[i % colores.length];
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      el.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
      el.style.setProperty('--giro', `${Math.random() * 720 - 360}deg`);
      this.elParticulas.appendChild(el);
      setTimeout(() => el.remove(), 3400);
    }
  }

  dialogo({ imagen = '', titulo = '', etiqueta = null, texto = '', html = '', botones = [{ texto: 'Vale', tipo: 'primario' }], confeti = false, personaje = false, columna = false }) {
    const caja = this.elDialogo.querySelector('.dialogo-caja');
    caja.innerHTML = `
      ${imagen ? `<div class="dialogo-imagen${personaje ? ' personaje' : ''}">${this.img(imagen)}</div>` : ''}
      ${etiqueta ? `<span class="etiqueta" style="background:${etiqueta.color}">${etiqueta.texto}</span>` : ''}
      ${titulo ? `<h3>${titulo}</h3>` : ''}
      ${texto ? `<p>${texto}</p>` : ''}
      ${html}
      <div class="dialogo-botones"></div>`;
    const fila = caja.querySelector('.dialogo-botones');
    fila.classList.toggle('columna', columna);
    const cerrar = () => {
      this.elDialogo.classList.remove('abierto');
      setTimeout(() => {
        if (!this.elDialogo.classList.contains('abierto')) this.elDialogo.classList.add('oculto');
      }, 220);
    };
    for (const b of botones) {
      const el = document.createElement('button');
      el.className = b.tipo || 'secundario';
      el.innerHTML = b.texto;
      el.disabled = !!b.desactivado;
      el.addEventListener('click', () => {
        this.ev.alSonido('tocar');
        if (!b.mantener) cerrar();
        if (b.accion) b.accion(caja);
      });
      fila.appendChild(el);
    }
    this.elDialogo.classList.remove('oculto');
    void this.elDialogo.offsetWidth;
    this.elDialogo.classList.add('abierto');
    if (confeti) this.confeti();
    return { cerrar, caja };
  }

  pedirNombre({ imagen, titulo, texto, sugerencias }) {
    return new Promise(resolve => {
      const azar = () => sugerencias[Math.floor(Math.random() * sugerencias.length)];
      const { caja } = this.dialogo({
        imagen, titulo, texto,
        html: `<div class="campo"><input type="text" maxlength="14" placeholder="Escribe un nombre" value="${azar()}"><button class="dado" type="button">🎲</button></div>`,
        botones: [
          { texto: 'Cancelar', tipo: 'secundario', accion: () => resolve(null) },
          {
            texto: '¡Listo!', tipo: 'primario', mantener: true, accion: c => {
              const v = c.querySelector('input').value.trim();
              if (!v) return;
              this.elDialogo.classList.remove('abierto');
              setTimeout(() => this.elDialogo.classList.add('oculto'), 220);
              resolve(v);
            }
          }
        ]
      });
      const input = caja.querySelector('input');
      caja.querySelector('.dado').addEventListener('click', () => {
        input.value = azar();
        this.ev.alSonido('tocar');
      });
      setTimeout(() => input.select(), 250);
    });
  }
}
