import { idioma, traducirTexto } from './i18n.js';

const CLAVE = 'hogar-guia4';

function traducir(html) {
  if (idioma() !== 'en') return html;
  const negritas = [...html.matchAll(/<b>(.*?)<\/b>/g)].map(m => m[1]);
  let t = traducirTexto(html.replace(/<\/?b>/g, ''));
  for (const n of negritas) {
    const tn = traducirTexto(n);
    t = t.replace(tn, `<b>${tn}</b>`);
  }
  return t;
}

const PASOS = [
  {
    id: 'tienda', objetivo: () => '#btn-tienda',
    texto: 'Este piso necesita un arreglo. Empezamos por mi tienda: tócala 🛒',
    avanza: ['abrir:tienda']
  },
  {
    id: 'reparar', objetivo: () => '#tienda .pestanas-v button[data-cat="reparar"]',
    texto: 'En <b>Reparar</b> está todo lo que hace falta para arreglar la casa',
    avanza: ['clic:#tienda .pestanas-v button[data-cat="reparar"]'],
    saltaSi: c => c.categoriaTienda() === 'reparar'
  },
  {
    id: 'comprar', objetivo: () => '#det-comprar',
    texto: 'Elige algo de la lista (el martillo para la tabla del suelo, por ejemplo) y dale a <b>Comprar</b>',
    avanza: ['pedido']
  },
  {
    id: 'cerrar', objetivo: () => '#tienda .tienda-cabecera .cerrar',
    texto: '¡Pedido hecho! Lo trae un dron en unos segundos. Cierra la tienda para verlo llegar',
    avanza: ['cerrar:tienda']
  },
  {
    id: 'paquete', objetivo: c => c.posPaquete(),
    texto: c => (c.posPaquete() ? '¡Ya está aquí! Toca el <b>paquete</b> que cuelga del dron para cogerlo' : 'El dron viene de camino… 🛸'),
    avanza: ['paquete']
  },
  {
    id: 'arrastrar', objetivo: () => '#inventario',
    texto: 'Mantén el dedo sobre lo que has comprado y <b>arrástralo</b> hasta lo que está roto o sucio',
    avanza: ['arreglar', 'colocar', 'limpiar']
  },
  {
    id: 'reforma', objetivo: () => '#hud .pastilla.casa',
    texto: '¡Muy bien! Cada arreglo sube la <b>Reforma</b>. Arreglad las 10 cosas para dejar el piso como nuevo',
    boton: 'Entendido'
  },
  {
    id: 'cerrarInv', objetivo: () => '#cerrar-inv',
    texto: 'Ahora cierra el <b>inventario</b> con la ✕ para ver bien la casa',
    avanza: ['clic:#cerrar-inv'],
    saltaSi: c => !c.ui.inventarioAbierto
  },
  {
    id: 'misiones', objetivo: () => '#btn-misiones',
    texto: 'Si no sabéis qué hacer, mirad las <b>Misiones</b>: os guían y dan monedas',
    avanza: ['clic:#btn-misiones']
  },
  {
    id: 'cerrarMis', objetivo: () => '#misiones .cerrar',
    texto: 'Aquí tenéis las misiones. Ciérralas con la ✕ para seguir',
    avanza: ['clic:#misiones .cerrar'],
    saltaSi: c => c.ui.hojaAbierta !== 'misiones'
  },
  {
    id: 'trabajar', objetivo: () => '#btn-trabajar',
    texto: 'Y lo más importante: en <b>Trabajar</b> ganáis monedas cada día para comprar cosas. ¡Ya sabéis lo básico!',
    avanza: ['clic:#btn-trabajar']
  }
];

const SALTOS = { pedido: 3, paquete: 5, arreglar: 6, colocar: 6, limpiar: 6 };

export class Guia {
  constructor(ctx) {
    this.ctx = ctx;
    this.paso = this.leer();
    this.burbuja = null;
    this.aro = null;
    this.oculta = false;
    document.addEventListener('click', e => {
      if (!this.activa()) return;
      for (const a of PASOS[this.paso].avanza || []) {
        if (a.startsWith('clic:') && e.target.closest && e.target.closest(a.slice(5))) {
          setTimeout(() => this.evento(a), 0);
          return;
        }
      }
    }, true);
    setInterval(() => this.tic(), 250);
  }

  leer() {
    try {
      const v = localStorage.getItem(CLAVE);
      if (v !== null) return Number(v);
      const v3 = localStorage.getItem('hogar-guia3');
      if (v3 !== null) return Number(v3) >= 9 ? Number(v3) + 1 : Number(v3);
      const v2 = localStorage.getItem('hogar-guia2');
      if (v2 !== null) return Number(v2) >= 8 ? Number(v2) + 2 : Number(v2) >= 7 ? Number(v2) + 1 : Number(v2);
      const vieja = localStorage.getItem('hogar-guia');
      return vieja !== null && Number(vieja) >= 5 ? PASOS.length : null;
    } catch (e) {
      return null;
    }
  }

  escribir(n) {
    this.paso = n;
    try {
      localStorage.setItem(CLAVE, String(n));
    } catch (e) {}
  }

  empezar(veterano) {
    if (this.paso === null) this.escribir(veterano ? PASOS.length : 0);
  }

  activa() {
    return this.paso !== null && this.paso < PASOS.length;
  }

  ir(n) {
    this.escribir(n);
    this.quitar();
    if (this.ctx.sonido) this.ctx.sonido.pop();
    if (!this.activa()) this.ctx.ui.aviso('🎉 ¡Ya sabéis lo básico! A disfrutar de vuestra casa');
  }

  evento(e) {
    if (!this.activa()) return;
    if (SALTOS[e] !== undefined && SALTOS[e] > this.paso) return this.ir(SALTOS[e]);
    if ((PASOS[this.paso].avanza || []).includes(e)) this.ir(this.paso + 1);
  }

  saltar() {
    this.escribir(PASOS.length);
    this.quitar();
  }

  quitar() {
    if (this.burbuja) this.burbuja.remove();
    if (this.aro) this.aro.remove();
    this.burbuja = null;
    this.aro = null;
  }

  ocultarSi(si) {
    this.oculta = si;
  }

  rectObjetivo(p) {
    const o = p.objetivo(this.ctx);
    if (!o) return null;
    if (typeof o === 'string') {
      const el = document.querySelector(o);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || el.offsetParent === null) return null;
      if (r.bottom < 0 || r.top > innerHeight) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    return { x: o.x - 28, y: o.y - 28, w: 56, h: 56 };
  }

  tic() {
    if (!this.activa()) return;
    const p = PASOS[this.paso];
    if (p.saltaSi && p.saltaSi(this.ctx)) return this.ir(this.paso + 1);
    const hoja = this.ctx.ui.hojaAbierta;
    if (this.paso <= 2 && this.paso >= 1 && hoja !== 'tienda') {
      if (this.paso === 1 || this.paso === 2) this.escribir(0);
    }
    if (this.paso === 0 && hoja === 'tienda') return this.ir(1);
    if (this.paso === 3 && hoja !== 'tienda') return this.ir(4);
    if (this.oculta) {
      this.quitar();
      return;
    }
    this.pintar(p);
  }

  pintar(p) {
    const r = this.rectObjetivo(p);
    const texto = traducir(typeof p.texto === 'function' ? p.texto(this.ctx) : p.texto);
    if (!this.burbuja) {
      this.burbuja = document.createElement('div');
      this.burbuja.className = 'guia-burbuja';
      this.burbuja.setAttribute('data-no-traducir', '');
      document.body.appendChild(this.burbuja);
      this.burbuja.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.a === 'saltar') this.saltar();
        else if (b.dataset.a === 'ok') this.ir(this.paso + 1);
      });
    }
    const html = `<img src="${this.ctx.cara || ''}" alt=""><div><p>${texto}</p><span class="guia-pie"><small>${this.paso + 1}/${PASOS.length}</small>${p.boton ? `<button data-a="ok" class="guia-ok">${traducir(p.boton)}</button>` : ''}<button data-a="saltar" class="guia-saltar">${traducir('Saltar guía')}</button></span></div>`;
    if (this.burbuja.dataset.html !== html) {
      this.burbuja.innerHTML = html;
      this.burbuja.dataset.html = html;
      this.burbuja.classList.remove('entra');
      void this.burbuja.offsetWidth;
      this.burbuja.classList.add('entra');
    }
    const ancho = Math.min(280, innerWidth - 24);
    this.burbuja.style.width = `${ancho}px`;
    const alto = this.burbuja.offsetHeight || 90;
    let x;
    let y;
    let flecha = 'ninguna';
    if (r) {
      const cx = r.x + r.w / 2;
      x = Math.max(12, Math.min(innerWidth - ancho - 12, cx - ancho / 2));
      if (r.y + r.h / 2 > innerHeight / 2) {
        y = r.y - alto - 16;
        flecha = 'abajo';
      } else {
        y = r.y + r.h + 16;
        flecha = 'arriba';
      }
      y = Math.max(8, Math.min(innerHeight - alto - 8, y));
      this.burbuja.style.setProperty('--fx', `${Math.max(18, Math.min(ancho - 18, cx - x))}px`);
      if (!this.aro) {
        this.aro = document.createElement('div');
        this.aro.className = 'guia-aro';
        document.body.appendChild(this.aro);
      }
      Object.assign(this.aro.style, { left: `${r.x - 6}px`, top: `${r.y - 6}px`, width: `${r.w + 12}px`, height: `${r.h + 12}px` });
    } else {
      x = (innerWidth - ancho) / 2;
      y = 120;
      if (this.aro) {
        this.aro.remove();
        this.aro = null;
      }
    }
    this.burbuja.dataset.flecha = flecha;
    this.burbuja.style.left = `${x}px`;
    this.burbuja.style.top = `${y}px`;
  }
}
