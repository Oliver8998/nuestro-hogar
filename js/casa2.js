import * as THREE from 'three';
import { encarecer } from './balance.js';
import { PRECIO_VENTANA } from './paredObjs.js';

const MIN = 60000;
const HORA = 3600000;

function lienzo(n = 256) {
  const c = document.createElement('canvas');
  c.width = n;
  c.height = n;
  return [c, c.getContext('2d')];
}

function textura(c) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function azar(semilla) {
  let x = semilla >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function hexCss(h) {
  return `#${h.toString(16).padStart(6, '0')}`;
}

function veta(g, n) {
  const r = azar(7);
  g.fillStyle = '#f7f1ea';
  g.fillRect(0, 0, n, n);
  for (let k = 0; k < 70; k++) {
    g.strokeStyle = `rgba(90,60,35,${0.05 + r() * 0.12})`;
    g.lineWidth = 1 + r() * 2;
    const x = r() * n;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + (r() - 0.5) * 14, n * 0.3, x + (r() - 0.5) * 14, n * 0.7, x + (r() - 0.5) * 8, n);
    g.stroke();
  }
  for (const col of [0, 1]) {
    const y = (0.2 + r() * 0.6) * n;
    g.fillStyle = 'rgba(60,40,25,.35)';
    g.fillRect(col * n / 2 + 2, y, n / 2 - 4, 2);
  }
  for (let k = 0; k < 4; k++) {
    g.fillStyle = 'rgba(90,60,35,.18)';
    g.beginPath();
    g.ellipse(r() * n, r() * n, 3 + r() * 4, 8 + r() * 6, 0, 0, Math.PI * 2);
    g.fill();
  }
}

export const SUELOS = [
  { id: 'roble', nombre: 'Roble claro', precio: 180, tonos: [0xe6c69e, 0xdcbb92, 0xefd0a8, 0xd6b285], dibujar: veta },
  { id: 'nogal', nombre: 'Nogal oscuro', precio: 220, tonos: [0x7a5538, 0x6e4c31, 0x86603f, 0x65452c], dibujar: veta },
  { id: 'blanca', nombre: 'Tarima blanca', precio: 200, tonos: [0xf3eee6, 0xebe5dc, 0xf7f3ec, 0xe4ddd2], dibujar: veta },
  { id: 'ceniza', nombre: 'Gris ceniza', precio: 200, tonos: [0xbdb6ae, 0xb2aaa1, 0xc7c0b8, 0xa9a198], dibujar: veta },
  { id: 'ajedrez', nombre: 'Baldosa de ajedrez', precio: 260, dibujar(g, n) {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = (i + j) % 2 ? '#34343c' : '#f3efe7';
      g.fillRect(i * n / 2, j * n / 2, n / 2, n / 2);
    }
    g.strokeStyle = 'rgba(0,0,0,.15)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, n, n);
  } },
  { id: 'hidraulico', nombre: 'Suelo hidráulico', precio: 320, dibujar(g, n) {
    const t = n / 4;
    g.fillStyle = '#efe6d4';
    g.fillRect(0, 0, n, n);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = i * t + t / 2;
      const cy = j * t + t / 2;
      g.fillStyle = '#3f6e8c';
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(cx + Math.cos(k * Math.PI / 2) * t * 0.22, cy + Math.sin(k * Math.PI / 2) * t * 0.22, t * 0.18, t * 0.09, k * Math.PI / 2, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#c4673f';
      g.beginPath();
      g.arc(cx, cy, t * 0.12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c4673f';
      for (const [x, y] of [[i * t, j * t], [i * t + t, j * t], [i * t, j * t + t], [i * t + t, j * t + t]]) {
        g.beginPath();
        g.arc(x, y, t * 0.14, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = 'rgba(0,0,0,.12)';
      g.strokeRect(i * t, j * t, t, t);
    }
  } },
  { id: 'marmol', nombre: 'Mármol', precio: 400, dibujar(g, n) {
    const r = azar(11);
    g.fillStyle = '#f4f2ee';
    g.fillRect(0, 0, n, n);
    for (let k = 0; k < 14; k++) {
      g.strokeStyle = `rgba(120,120,130,${0.08 + r() * 0.2})`;
      g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      let x = r() * n;
      let y = 0;
      g.moveTo(x, y);
      while (y < n) {
        x += (r() - 0.45) * 40;
        y += 10 + r() * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,.1)';
    g.lineWidth = 2;
    g.strokeRect(0, 0, n / 2, n / 2);
    g.strokeRect(n / 2, n / 2, n / 2, n / 2);
  } },
  { id: 'terrazo', nombre: 'Terrazo', precio: 280, dibujar(g, n) {
    const r = azar(5);
    g.fillStyle = '#ece3d6';
    g.fillRect(0, 0, n, n);
    const cols = ['#c98f7a', '#8fa9a0', '#e0b85a', '#6f6a66', '#f2efe9', '#b0796b'];
    for (let k = 0; k < 260; k++) {
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      g.beginPath();
      const s = 1.5 + r() * 5;
      g.ellipse(r() * n, r() * n, s, s * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  } },
  { id: 'moqueta', nombre: 'Moqueta rosa', precio: 240, dibujar(g, n) {
    const r = azar(3);
    g.fillStyle = '#e9b9c0';
    g.fillRect(0, 0, n, n);
    for (let k = 0; k < 3000; k++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(150,80,90,.1)';
      g.fillRect(r() * n, r() * n, 2, 2);
    }
  } }
];

export const PAPELES = [
  { id: 'rayas', nombre: 'Rayas pastel', precio: 150, dibujar(g, n) {
    const cols = ['#f6e3d6', '#dfece6'];
    for (let k = 0; k < 8; k++) {
      g.fillStyle = cols[k % 2];
      g.fillRect(k * n / 8, 0, n / 8, n);
    }
    g.fillStyle = 'rgba(255,255,255,.5)';
    for (let k = 0; k < 8; k++) g.fillRect(k * n / 8 + n / 16 - 1, 0, 2, n);
  } },
  { id: 'lunares', nombre: 'Lunares', precio: 150, dibujar(g, n) {
    g.fillStyle = '#fbeff0';
    g.fillRect(0, 0, n, n);
    g.fillStyle = '#e8a3b0';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.beginPath();
      g.arc(i * n / 4 + (j % 2 ? n / 8 : 0) + n / 16, j * n / 4 + n / 8, n / 36, 0, Math.PI * 2);
      g.fill();
    }
  } },
  { id: 'flores', nombre: 'Flores', precio: 190, dibujar(g, n) {
    g.fillStyle = '#f4efe3';
    g.fillRect(0, 0, n, n);
    const flor = (x, y, s, c) => {
      g.fillStyle = c;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.arc(x + Math.cos(k * 1.256) * s, y + Math.sin(k * 1.256) * s, s * 0.75, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#f2d06b';
      g.beginPath();
      g.arc(x, y, s * 0.55, 0, Math.PI * 2);
      g.fill();
    };
    const hoja = (x, y, a) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = '#8fb38a';
      g.beginPath();
      g.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    const pos = [[40, 50, '#e8a3b0'], [170, 30, '#9cb8d9'], [110, 130, '#f0b48a'], [30, 190, '#9cb8d9'], [200, 170, '#e8a3b0'], [128, 240, '#c9a7d9']];
    for (const [x, y, c] of pos) {
      hoja(x + 14, y + 10, 0.6);
      hoja(x - 14, y + 12, -0.6);
      for (const dx of [0, n]) for (const dy of [0, n]) flor(x - dx * (x > n / 2 ? 1 : 0), y - dy * (y > n / 2 ? 1 : 0), 7, c);
    }
  } },
  { id: 'vichy', nombre: 'Cuadros vichy', precio: 170, dibujar(g, n) {
    g.fillStyle = '#fbf8f2';
    g.fillRect(0, 0, n, n);
    g.fillStyle = 'rgba(111,160,130,.35)';
    for (let k = 0; k < 8; k += 2) {
      g.fillRect(k * n / 8, 0, n / 8, n);
      g.fillRect(0, k * n / 8, n, n / 8);
    }
  } },
  { id: 'ladrillo', nombre: 'Ladrillo visto', precio: 230, dibujar(g, n) {
    const r = azar(9);
    g.fillStyle = '#e6dccd';
    g.fillRect(0, 0, n, n);
    const h = n / 8;
    const w = n / 4;
    for (let j = 0; j < 8; j++) for (let i = -1; i < 5; i++) {
      const x = i * w + (j % 2 ? w / 2 : 0);
      const t = 150 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${t + 40},${Math.floor(t * 0.55)},${Math.floor(t * 0.42)})`;
      g.fillRect(x + 2, j * h + 2, w - 4, h - 4);
    }
  } },
  { id: 'corazones', nombre: 'Corazones', precio: 190, dibujar(g, n) {
    g.fillStyle = '#fdf0f2';
    g.fillRect(0, 0, n, n);
    g.font = `${n / 9}px serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#e58f9e';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.save();
      g.translate(i * n / 4 + (j % 2 ? n / 8 : 0) + n / 16, j * n / 4 + n / 8);
      g.scale(1, 0.95);
      g.beginPath();
      const s = n / 28;
      g.moveTo(0, s * 0.9);
      g.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.6, -s * 1.4, 0, -s * 0.5);
      g.bezierCurveTo(s * 0.6, -s * 1.4, s * 1.6, -s * 0.2, 0, s * 0.9);
      g.fill();
      g.restore();
    }
  } },
  { id: 'estrellas', nombre: 'Noche estrellada', precio: 220, dibujar(g, n) {
    const r = azar(4);
    g.fillStyle = '#2e3a5c';
    g.fillRect(0, 0, n, n);
    for (let k = 0; k < 40; k++) {
      g.fillStyle = r() < 0.3 ? '#f2d06b' : '#e9eefc';
      g.beginPath();
      g.arc(r() * n, r() * n, 0.8 + r() * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#f2d06b';
    g.beginPath();
    g.arc(n * 0.7, n * 0.3, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2e3a5c';
    g.beginPath();
    g.arc(n * 0.7 + 7, n * 0.3 - 5, 12, 0, Math.PI * 2);
    g.fill();
  } },
  { id: 'hojas', nombre: 'Hojas tropicales', precio: 230, dibujar(g, n) {
    const r = azar(21);
    g.fillStyle = '#eef3e6';
    g.fillRect(0, 0, n, n);
    for (let k = 0; k < 14; k++) {
      const x = r() * n;
      const y = r() * n;
      const a = r() * Math.PI * 2;
      for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) {
        g.save();
        g.translate(x + dx, y + dy);
        g.rotate(a);
        g.fillStyle = r() < 0.5 ? '#6f9e6a' : '#4f8566';
        g.beginPath();
        g.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,.35)';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(-28, 0);
        g.lineTo(28, 0);
        g.stroke();
        g.restore();
      }
    }
  } }
];

export const CORTINAS = [
  { id: 'lino', nombre: 'Lino blanco', precio: 80, color: 0xf3eee4 },
  { id: 'rosa', nombre: 'Rosa empolvado', precio: 90, color: 0xf2b8c4 },
  { id: 'azul', nombre: 'Azul cielo', precio: 90, color: 0x9dbfe0 },
  { id: 'granate', nombre: 'Terciopelo granate', precio: 150, color: 0x8a2b3a, rugosidad: 0.55 },
  { id: 'mostaza', nombre: 'Mostaza', precio: 110, color: 0xd9a63a },
  { id: 'estor', nombre: 'Estor de bambú', precio: 120, color: 0xc9a66b, estor: true }
];

export const MARCOS = [
  { id: 'blanco', nombre: 'Marco blanco', precio: 80, color: 0xf2efe9 },
  { id: 'negro', nombre: 'Marco negro', precio: 90, color: 0x2b2b2b },
  { id: 'salvia', nombre: 'Verde salvia', precio: 90, color: 0x7d9a7a },
  { id: 'azul', nombre: 'Azul marino', precio: 90, color: 0x3f5f85 },
  { id: 'grande', nombre: 'Ventanal grande', precio: 350, grande: true }
];

export const LEDS = [
  { id: 'calida', nombre: 'Tira LED cálida', precio: 150, color: 0xffc27a },
  { id: 'rosa', nombre: 'Tira LED rosa', precio: 150, color: 0xff6fa8 },
  { id: 'azul', nombre: 'Tira LED azul', precio: 150, color: 0x5aa9ff },
  { id: 'morado', nombre: 'Tira LED morada', precio: 150, color: 0xa070ff },
  { id: 'verde', nombre: 'Tira LED verde', precio: 150, color: 0x5adf9a },
  { id: 'arcoiris', nombre: 'Tira LED arcoíris', precio: 300, color: 0xff0000, arcoiris: true }
];

export const BOMBILLAS = [
  { id: 'calida', nombre: 'Bombilla cálida', precio: 50, color: 0xffd9a0 },
  { id: 'fria', nombre: 'Bombilla fría', precio: 50, color: 0xdcecff },
  { id: 'rosa', nombre: 'Bombilla rosa', precio: 60, color: 0xffa8c4 },
  { id: 'ambar', nombre: 'Bombilla ámbar', precio: 60, color: 0xffa64d },
  { id: 'verde', nombre: 'Bombilla verde', precio: 60, color: 0xa8ffc4 }
];

for (const l of [SUELOS, PAPELES, CORTINAS, MARCOS, LEDS, BOMBILLAS]) encarecer(l);

const CATS = [
  { id: 'suelo', icono: '🪵', nombre: 'Suelos', lista: SUELOS },
  { id: 'papel', icono: '🧻', nombre: 'Papel pintado', lista: PAPELES },
  { id: 'cortina', icono: '🪟', nombre: 'Cortinas', lista: CORTINAS },
  { id: 'marco', icono: '🖼️', nombre: 'Ventana', lista: MARCOS },
  { id: 'led', icono: '🌈', nombre: 'Tiras LED', lista: LEDS },
  { id: 'bombilla', icono: '💡', nombre: 'Bombillas', lista: BOMBILLAS }
];

export const INGREDIENTES = {
  tomate: { icono: '🍅', nombre: 'Tomate', huerto: true, precio: 4 },
  lechuga: { icono: '🥬', nombre: 'Lechuga', huerto: true, precio: 4 },
  zanahoria: { icono: '🥕', nombre: 'Zanahoria', huerto: true, precio: 3 },
  patata: { icono: '🥔', nombre: 'Patata', huerto: true, precio: 3 },
  fresa: { icono: '🍓', nombre: 'Fresa', huerto: true, precio: 6 },
  pimiento: { icono: '🫑', nombre: 'Pimiento', huerto: true, precio: 4 },
  huevo: { icono: '🥚', nombre: 'Huevos', precio: 6 },
  harina: { icono: '🌾', nombre: 'Harina', precio: 5 },
  queso: { icono: '🧀', nombre: 'Queso', precio: 9 },
  leche: { icono: '🥛', nombre: 'Leche', precio: 5 },
  seta: { icono: '🍄', nombre: 'Setas', paseo: true },
  mora: { icono: '🫐', nombre: 'Moras', paseo: true }
};

encarecer(Object.values(INGREDIENTES));

export const RECETAS = [
  { id: 'ensalada', nombre: 'Ensalada', icono: '🥗', ing: { lechuga: 1, tomate: 1, zanahoria: 1 }, valor: 45 },
  { id: 'tortilla', nombre: 'Tortilla de patatas', icono: '🍳', ing: { patata: 2, huevo: 2 }, valor: 55 },
  { id: 'pizza', nombre: 'Pizza casera', icono: '🍕', ing: { harina: 1, tomate: 2, queso: 1 }, valor: 70 },
  { id: 'crema', nombre: 'Crema de verduras', icono: '🥣', ing: { zanahoria: 1, patata: 1, leche: 1 }, valor: 50 },
  { id: 'pisto', nombre: 'Pisto', icono: '🍲', ing: { pimiento: 1, tomate: 1, patata: 1 }, valor: 50 },
  { id: 'tarta', nombre: 'Tarta de fresas', icono: '🍰', ing: { fresa: 2, harina: 1, huevo: 1, leche: 1 }, valor: 95 },
  { id: 'revuelto', nombre: 'Revuelto de setas', icono: '🍄', ing: { seta: 2, huevo: 1 }, valor: 60 },
  { id: 'batido', nombre: 'Batido de moras', icono: '🥤', ing: { mora: 2, leche: 1 }, valor: 40 }
];

const PRENDAS = ['👕', '👖', '🧦', '👗', '🩳', '🧣', '👚', '🩲'];

export class Casa2 {
  constructor(ctx) {
    this.ctx = ctx;
    this.texs = new Map();
    this.t = 0;
    this.tChasquido = 0;
    this.cortinaId = undefined;
    this.cortina = null;
    this.tiras = [];
    const sala = ctx.sala;
    for (const p of sala.paredes) {
      const tira = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 0.035, 0.03),
        new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.4 })
      );
      tira.position.set(0, 2.56, sala.cara + 0.02);
      tira.visible = false;
      p.add(tira);
      this.tiras.push(tira);
    }
    this.luzLed = new THREE.PointLight(0xffffff, 0, 9, 1.6);
    this.luzLed.position.set(0, 2.3, 0);
    ctx.escena.add(this.luzLed);
    this.luzBombilla = new THREE.PointLight(0xffffff, 0, 10, 1.4);
    this.luzBombilla.position.set(0, 2.45, 0);
    ctx.escena.add(this.luzBombilla);
    this.coloresMarco = sala.ventana.children.slice(0, 5).map(o => o.material.color.getHex());
  }

  get estado() {
    return this.ctx.estado;
  }

  datos() {
    if (!this.estado.decor) this.estado.decor = { compras: [], salas: {} };
    const d = this.estado.decor;
    if (!d.compras) d.compras = [];
    if (!d.salas) d.salas = {};
    return d;
  }

  clave() {
    return `${this.ctx.nivelCasa()}-${this.estado.habActual || 0}`;
  }

  actual() {
    const d = this.datos();
    return d.salas[this.clave()] || {};
  }

  tex(tipo, item) {
    const k = `${tipo}:${item.id}`;
    if (!this.texs.has(k)) {
      const [c, g] = lienzo(256);
      item.dibujar(g, 256);
      this.texs.set(k, textura(c));
    }
    return this.texs.get(k);
  }

  muestra(tipo, item) {
    if (item.dibujar) {
      const [c, g] = lienzo(96);
      g.scale(96 / 256, 96 / 256);
      item.dibujar(g, 256);
      if (item.tonos) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'multiply';
        g.fillStyle = hexCss(item.tonos[0]);
        g.fillRect(0, 0, 96, 96);
      }
      return `<img src="${c.toDataURL()}" alt="">`;
    }
    if (item.grande) return '<span class="muestra-emoji">🪟</span>';
    if (item.arcoiris) return '<span class="muestra-color arcoiris"></span>';
    return `<span class="muestra-color" style="background:${hexCss(item.color)}"></span>`;
  }

  aplicar(decor = null) {
    const { sala } = this.ctx;
    const d = decor || this.actual();
    const fuera = sala.esExterior();
    const s = !fuera && d.suelo && SUELOS.find(x => x.id === d.suelo);
    if (s) sala.decorSuelo(s.tonos || [0xffffff], this.tex('suelo', s));
    else sala.decorSuelo(null, null);
    const p = !fuera && d.papel && PAPELES.find(x => x.id === d.papel);
    sala.ponerPapel(p ? this.tex('papel', p) : null);
    const marco = d.marco && MARCOS.find(x => x.id === d.marco && !x.grande);
    sala.ventana.children.slice(0, 5).forEach((o, i) => o.material.color.setHex(marco ? marco.color : this.coloresMarco[i]));
    this.ventanaGrande = (d.ventana || d.marco === 'grande') && !fuera;
    this.ponerCortina(fuera ? null : d.cortina || null);
    this.led = !fuera && d.led ? LEDS.find(x => x.id === d.led) : null;
    for (const t of this.tiras) {
      t.visible = !!this.led;
      if (this.led) t.material.emissive.setHex(this.led.color);
    }
    this.luzLed.color.setHex(this.led ? this.led.color : 0xffffff);
    this.bombilla = d.bombilla ? BOMBILLAS.find(x => x.id === d.bombilla) : null;
    if (this.bombilla) this.luzBombilla.color.setHex(this.bombilla.color);
    this.ajustarLuces();
    if (this.ctx.alAplicar) this.ctx.alAplicar();
  }

  ajustarLuces() {
    const noche = this.ctx.ambiente.esNoche();
    this.luzLed.intensity = this.led ? (noche ? 2.2 : 0.7) : 0;
    this.luzBombilla.intensity = this.bombilla ? (noche ? 2.4 : 0.8) : 0;
    for (const t of this.tiras) t.material.emissiveIntensity = noche ? 2.2 : 1.2;
  }

  ponerCortina(id) {
    if (id === this.cortinaId) return;
    this.cortinaId = id;
    const v = this.ctx.sala.ventana;
    if (this.cortina) {
      v.remove(this.cortina);
      this.cortina.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      this.cortina = null;
    }
    const c = id && CORTINAS.find(x => x.id === id);
    if (!c) return;
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: c.color, roughness: c.rugosidad ?? 0.9, side: THREE.DoubleSide });
    const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.85, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.5 }));
    barra.rotation.z = Math.PI / 2;
    barra.position.set(0, 0.8, 0.08);
    g.add(barra);
    if (c.estor) {
      const estor = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.5, 0.02), mat);
      estor.position.set(0, 0.42, 0.06);
      g.add(estor);
      const rollo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.28, 12), mat);
      rollo.rotation.z = Math.PI / 2;
      rollo.position.set(0, 0.18, 0.07);
      g.add(rollo);
      barra.visible = false;
    } else {
      for (const lado of [-1, 1]) {
        const geo = new THREE.PlaneGeometry(0.42, 1.6, 18, 1);
        const pos = geo.attributes.position;
        for (let k = 0; k < pos.count; k++) {
          const x = pos.getX(k);
          const y = pos.getY(k);
          const recogido = 1 - 0.5 * Math.exp(-(((y + 0.25) / 0.3) ** 2));
          pos.setX(k, x * recogido - lado * (1 - recogido) * 0.08);
          pos.setZ(k, Math.sin((x + 0.21) * Math.PI * 7) * 0.025);
        }
        geo.computeVertexNormals();
        const tela = new THREE.Mesh(geo, mat);
        tela.position.set(lado * 0.78, 0.0, 0.1);
        tela.castShadow = true;
        g.add(tela);
        const lazo = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 14), new THREE.MeshStandardMaterial({ color: 0xe0c060, metalness: 0.5, roughness: 0.4 }));
        lazo.position.set(lado * 0.78, -0.25, 0.12);
        g.add(lazo);
      }
    }
    v.add(g);
    this.cortina = g;
  }

  enUso(cat, id) {
    return (this.actual()[cat] || null) === id;
  }

  abrirReformas(cat = 'suelo') {
    const { ui } = this.ctx;
    const fuera = this.ctx.sala.esExterior();
    const info = CATS.find(c => c.id === cat);
    const compras = this.datos().compras;
    const hab = this.ctx.nombreHabitacion();
    const cuerpo = ui.abrirGen('Reformas', `
      <p class="gen-intro">${fuera ? 'Estáis fuera: aquí solo valen las bombillas. Entrad en una habitación para cambiar suelo, papel o ventana.' : `Cambiad el suelo, el papel, la ventana y las luces de <b>${hab}</b>. Lo que compréis se puede poner en todas las habitaciones.`}</p>
      <div class="reforma-tabs">${CATS.map(c => `<button data-cat="${c.id}" class="${c.id === cat ? 'activa' : ''}">${c.icono}<small>${c.nombre}</small></button>`).join('')}</div>
      ${cat === 'marco' && !fuera ? `<button class="reforma-otra-ventana">➕ Añadir otra ventana · 🪙 ${PRECIO_VENTANA}<small>Mantened pulsada una ventana para moverla o cambiarle el tamaño</small></button>` : ''}
      <div class="reforma-grid">
        <button class="reforma-item ${!this.actual()[cat] ? 'puesto' : ''}" data-id=""><span class="muestra-emoji">↩️</span><b>Original</b><small>${!this.actual()[cat] ? '✓ Puesto' : 'Quitar'}</small></button>
        ${info.lista.map(it => {
          const tiene = compras.includes(`${cat}:${it.id}`);
          const puesto = this.enUso(cat, it.id);
          return `<button class="reforma-item ${puesto ? 'puesto' : ''}" data-id="${it.id}">${this.muestra(cat, it)}<b>${it.nombre}</b><small>${puesto ? '✓ Puesto' : tiene ? 'Poner' : `🪙 ${it.precio}`}</small></button>`;
        }).join('')}
      </div>`, () => this.ctx.abrirMas());
    const otra = cuerpo.querySelector('.reforma-otra-ventana');
    if (otra) otra.addEventListener('click', () => this.ctx.comprarVentana());
    cuerpo.querySelectorAll('.reforma-tabs button').forEach(b => b.addEventListener('click', () => this.abrirReformas(b.dataset.cat)));
    cuerpo.querySelectorAll('.reforma-item').forEach(b => b.addEventListener('click', () => {
      if (fuera && cat !== 'bombilla') {
        ui.aviso('Esto no se puede poner fuera', true);
        return;
      }
      this.elegir(cat, b.dataset.id || null);
    }));
  }

  elegir(cat, id) {
    const { ui, sonido } = this.ctx;
    const d = this.datos();
    const k = this.clave();
    const poner = () => {
      const sala = { ...(d.salas[k] || {}) };
      if (id) sala[cat] = id;
      else delete sala[cat];
      d.salas[k] = sala;
      this.ctx.aplicarEstilo();
      sonido.arreglo();
      this.ctx.registrar('reformar');
      this.ctx.guardar();
      this.abrirReformas(cat);
    };
    if (!id || d.compras.includes(`${cat}:${id}`)) {
      poner();
      return;
    }
    const it = CATS.find(c => c.id === cat).lista.find(x => x.id === id);
    if (this.estado.monedas < it.precio) {
      sonido.error();
      ui.aviso(`Os faltan ${it.precio - this.estado.monedas} monedas`, true);
      return;
    }
    ui.dialogo({
      titulo: it.nombre,
      html: `<div class="reforma-previa">${this.muestra(cat, it)}</div>`,
      texto: `Cuesta 🪙 ${it.precio}. Una vez comprado, podéis ponerlo en todas las habitaciones.`,
      botones: [
        { texto: 'Mejor no', tipo: 'secundario' },
        {
          texto: `Comprar · 🪙 ${it.precio}`, tipo: 'primario', accion: () => {
            this.estado.monedas -= it.precio;
            d.compras.push(`${cat}:${id}`);
            sonido.comprar();
            this.ctx.refrescarHud();
            poner();
          }
        }
      ]
    });
  }

  extrasAcogedor(muebles) {
    const d = this.actual();
    const n = ['suelo', 'papel', 'cortina'].filter(k => d[k]).length + (d.led || d.bombilla ? 1 : 0);
    const partes = [{ texto: 'Reformas a vuestro gusto', valor: Math.min(10, n * 3), max: 10, consejo: 'Cambiad el suelo, papel o luces en Reformas' }];
    if (this.invierno()) {
      const chim = muebles.filter(m => m.userData.def.chimenea);
      if (chim.length) partes.push({ texto: 'Chimenea en invierno', valor: chim.some(m => m.userData.encendido) ? 10 : 0, max: 10, consejo: 'Encended la chimenea' });
    }
    return partes;
  }

  invierno() {
    const forzado = new URLSearchParams(location.search).get('temporada');
    if (forzado) return forzado === 'invierno' || forzado === 'navidad';
    const m = new Date().getMonth();
    return m === 11 || m <= 1;
  }

  despensa() {
    if (!this.estado.despensa) this.estado.despensa = {};
    return this.estado.despensa;
  }

  platos() {
    if (!this.estado.platos) this.estado.platos = {};
    return this.estado.platos;
  }

  anadirIngrediente(id, n = 1) {
    const d = this.despensa();
    d[id] = (d[id] || 0) + n;
  }

  cosecha() {
    const huerto = Object.keys(INGREDIENTES).filter(k => INGREDIENTES[k].huerto);
    const lista = [];
    const n = 2 + Math.floor(Math.random() * 2);
    for (let k = 0; k < n; k++) {
      const id = huerto[Math.floor(Math.random() * huerto.length)];
      this.anadirIngrediente(id);
      lista.push(INGREDIENTES[id].icono);
    }
    return lista;
  }

  puedeCocinar(r) {
    const d = this.despensa();
    return Object.entries(r.ing).every(([k, n]) => (d[k] || 0) >= n);
  }

  abrirCocina(m) {
    const { ui } = this.ctx;
    const d = this.despensa();
    const platos = this.platos();
    const hayPlatos = RECETAS.filter(r => platos[r.id]);
    const cuerpo = ui.abrirGen('🍳 Cocina', `
      <p class="gen-intro">Lo que cosechéis en el huerto va a la despensa. Cocinad platos para comer juntos, dar a las mascotas o servir en una fiesta.</p>
      <h4 class="gen-sub">Despensa</h4>
      <div class="despensa">${Object.entries(INGREDIENTES).map(([k, ing]) => `<div class="${d[k] ? '' : 'vacio'}"><span>${ing.icono}</span><b>${d[k] || 0}</b>${ing.precio ? `<button data-compra="${k}">+1 · 🪙${ing.precio}</button>` : '<small>Paseos</small>'}</div>`).join('')}</div>
      ${hayPlatos.length ? `<h4 class="gen-sub">Platos listos</h4><div class="platos">${hayPlatos.map(r => `<div class="plato"><span>${r.icono}</span><div><b>${r.nombre} ×${platos[r.id]}</b><small>
        <button data-comer="${r.id}">😋 Comer juntos</button><button data-mascota="${r.id}">🐾 A una mascota</button></small></div></div>`).join('')}</div>` : ''}
      <h4 class="gen-sub">Recetas</h4>
      <div class="recetas">${RECETAS.map(r => {
        const ok = this.puedeCocinar(r);
        return `<div class="receta ${ok ? 'lista' : ''}"><span>${r.icono}</span><div><b>${r.nombre}</b><small>${Object.entries(r.ing).map(([k, n]) => `<i class="${(d[k] || 0) >= n ? 'tengo' : ''}">${INGREDIENTES[k].icono}×${n}</i>`).join(' ')}</small></div><button data-cocinar="${r.id}" ${ok ? '' : 'disabled'}>Cocinar</button></div>`;
      }).join('')}</div>`, () => this.ctx.abrirMas());
    cuerpo.querySelectorAll('[data-compra]').forEach(b => b.addEventListener('click', () => {
      const ing = INGREDIENTES[b.dataset.compra];
      if (this.estado.monedas < ing.precio) {
        this.ctx.sonido.error();
        ui.aviso('No tenéis monedas suficientes', true);
        return;
      }
      this.estado.monedas -= ing.precio;
      this.anadirIngrediente(b.dataset.compra);
      this.ctx.sonido.comprar();
      this.ctx.refrescarHud();
      this.ctx.guardar();
      this.abrirCocina(m);
    }));
    cuerpo.querySelectorAll('[data-cocinar]').forEach(b => b.addEventListener('click', () => this.cocinar(RECETAS.find(r => r.id === b.dataset.cocinar), m)));
    cuerpo.querySelectorAll('[data-comer]').forEach(b => b.addEventListener('click', () => {
      const r = RECETAS.find(x => x.id === b.dataset.comer);
      if (!this.quitarPlato(r.id)) return;
      ui.cerrarHojas();
      this.ctx.ganar(Math.round(r.valor * 0.6), m, r.icono);
      this.ctx.registrar('comer-juntos');
      if (this.ctx.recordar) this.ctx.recordar(`plato-${r.id}`, r.icono, `Cenamos ${r.nombre.toLowerCase()} hecha en casa`);
      this.ctx.guardar();
    }));
    cuerpo.querySelectorAll('[data-mascota]').forEach(b => b.addEventListener('click', () => this.darMascota(RECETAS.find(x => x.id === b.dataset.mascota), m)));
  }

  quitarPlato(id) {
    const p = this.platos();
    if (!p[id]) return false;
    p[id]--;
    if (!p[id]) delete p[id];
    return true;
  }

  totalPlatos() {
    return Object.values(this.platos()).reduce((a, b) => a + b, 0);
  }

  darMascota(r, m) {
    const { ui, mascotas } = this.ctx;
    if (!mascotas.lista.length) {
      ui.aviso('No tenéis mascotas todavía', true);
      return;
    }
    ui.dialogo({
      titulo: `${r.icono} ¿Para quién?`,
      texto: 'Le llenará la tripa y le pondrá contentísimo.',
      botones: [...mascotas.lista.map(p => ({
        texto: p.nombre, tipo: 'primario', accion: () => {
          if (!this.quitarPlato(r.id)) return;
          p.hambre = 100;
          p.felicidad = Math.min(100, p.felicidad + 25);
          mascotas.eventos.particula('😋', p, 4);
          this.ctx.sonido.mascota();
          this.ctx.registrar('comer');
          this.ctx.guardar();
          ui.cerrarHojas();
        }
      })), { texto: 'Cancelar', tipo: 'secundario' }],
      columna: true
    });
  }

  async cocinar(r, m) {
    const { ui } = this.ctx;
    if (!this.puedeCocinar(r)) return;
    ui.cerrarHojas();
    const puntos = await this.juegoCoccion(r);
    if (puntos === null || puntos === undefined) return;
    const p = this.platos();
    const raciones = puntos >= 0.99 ? 2 : 1;
    p[r.id] = (p[r.id] || 0) + raciones;
    this.ctx.registrar('cocinar');
    if (puntos > 0) this.ctx.ganar(Math.round(10 + puntos * 20), m, r.icono);
    ui.aviso(`${r.icono} ${raciones > 1 ? '¡Os han salido 2 raciones!' : 'Plato listo'} · en la cocina`);
    this.ctx.guardar();
  }

  async juegoCoccion(r) {
    const { juegos, sonido } = this.ctx;
    if (!this.puedeCocinar(r)) return null;
    const d = this.despensa();
    for (const [k, n] of Object.entries(r.ing)) d[k] -= n;
    const puntos = await juegos.custom(r.icono, r.nombre, j => {
      let ronda = 0;
      let aciertos = 0;
      let x = 0;
      let v = 1.1;
      let zona = { a: 0.55, b: 0.75 };
      j.info('Pulsa cuando la aguja esté en la zona verde. ¡En su punto!');
      j.cuerpo.innerHTML = `<div class="coccion"><div class="olla">🍲</div><div class="barra-coccion"><div class="zona"></div><div class="aguja"></div></div><small class="rondas">Paso 1 de 3</small><button class="primario grande">¡Ya!</button></div>`;
      const zEl = j.cuerpo.querySelector('.zona');
      const aguja = j.cuerpo.querySelector('.aguja');
      const pintarZona = () => {
        zEl.style.left = `${zona.a * 100}%`;
        zEl.style.width = `${(zona.b - zona.a) * 100}%`;
      };
      pintarZona();
      let ultimo = performance.now();
      let vivo = true;
      const bucle = t => {
        if (!vivo) return;
        const dt = (t - ultimo) / 1000;
        ultimo = t;
        x += v * dt;
        if (x > 1) { x = 1; v = -Math.abs(v); }
        if (x < 0) { x = 0; v = Math.abs(v); }
        aguja.style.left = `${x * 100}%`;
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
      j.alTerminar = () => { vivo = false; };
      j.cuerpo.querySelector('button').addEventListener('click', () => {
        const bien = x >= zona.a && x <= zona.b;
        if (bien) aciertos++;
        sonido[bien ? 'arreglo' : 'error']();
        j.cuerpo.querySelector('.olla').textContent = bien ? '😋' : '💨';
        ronda++;
        if (ronda >= 3) {
          vivo = false;
          j.final(aciertos === 3 ? '¡De chef! Perfecto' : aciertos === 2 ? '¡Muy rico!' : aciertos === 1 ? 'Comestible…' : 'Un poco quemado 😅', aciertos / 3);
          return;
        }
        setTimeout(() => { j.cuerpo.querySelector('.olla') && (j.cuerpo.querySelector('.olla').textContent = '🍲'); }, 500);
        const ancho = 0.2 - ronda * 0.05;
        const a = 0.1 + Math.random() * (0.8 - ancho);
        zona = { a, b: a + ancho };
        v *= 1.25;
        pintarZona();
        j.cuerpo.querySelector('.rondas').textContent = `Paso ${ronda + 1} de 3`;
      });
    });
    if (puntos === null || puntos === undefined) {
      for (const [k, n] of Object.entries(r.ing)) d[k] += n;
      this.ctx.guardar();
      return null;
    }
    this.ctx.registrar('cocinar');
    return puntos;
  }

  ropa() {
    if (!this.estado.ropa) this.estado.ropa = { n: 2, t: Date.now() };
    return this.estado.ropa;
  }

  revisarRopa() {
    if (!this.ctx.idsEnCasa().includes('lavadora')) return;
    if (!this.ctx.genera()) return;
    const r = this.ropa();
    const pasos = Math.floor((Date.now() - r.t) / (3 * HORA));
    if (pasos > 0) {
      r.n = Math.min(12, r.n + pasos);
      r.t += pasos * 3 * HORA;
      this.ctx.guardar();
      this.ctx.chip();
    }
  }

  chips() {
    const lista = [];
    if (this.estado.ropa && this.estado.ropa.n >= 4 && this.ctx.idsEnCasa().includes('lavadora')) {
      lista.push({ id: 'ropa', texto: `🧺 ${this.estado.ropa.n}`, accion: () => this.ctx.ui.aviso(`🧺 Hay ${this.estado.ropa.n} prendas sucias. Mantened pulsada la lavadora para ponerla`) });
    }
    return lista;
  }

  opciones(m) {
    const def = m.userData.def;
    const ops = [];
    if (def.cocina) ops.push({ icono: '🍳', texto: 'Cocinar', accion: () => this.abrirCocina(m) });
    if (def.lavadora) {
      if (!m.userData.datos) m.userData.datos = {};
      const d = m.userData.datos;
      const r = this.ropa();
      if (d.lavando && Date.now() < d.lavando.fin) {
        const min = Math.max(1, Math.ceil((d.lavando.fin - Date.now()) / MIN));
        ops.push({ icono: '🫧', texto: `${min} min`, accion: () => this.ctx.ui.aviso(`🫧 Lavando ${d.lavando.prendas} prendas… ${min} min`) });
      } else if (d.lavando) {
        ops.push({ icono: '👕', texto: 'Tender', accion: () => this.tender(m) });
      } else {
        ops.push({
          icono: '🧺', texto: r.n ? `Lavar (${r.n})` : 'Lavar', accion: () => {
            if (!r.n) {
              this.ctx.ui.aviso('No hay ropa sucia ahora mismo ✨');
              return;
            }
            const prendas = Math.min(8, r.n);
            r.n -= prendas;
            d.lavando = { fin: Date.now() + 15 * MIN, prendas };
            this.ctx.sonido.agua();
            this.ctx.ui.aviso(`🫧 Lavadora puesta con ${prendas} prendas. En 15 min, a tender`);
            this.ctx.guardar();
            this.ctx.chip();
            this.ctx.refrescarMenu();
          }
        });
      }
    }
    return ops;
  }

  async tender(m) {
    const { juegos, sonido, ui } = this.ctx;
    const d = m.userData.datos;
    const total = d.lavando.prendas;
    ui.cerrarMenu && ui.cerrarMenu();
    const puntos = await juegos.custom('👕', 'Tender la ropa', j => {
      j.info('La cuerda se mueve: suelta cada prenda encima de una pinza libre');
      const huecos = [0.12, 0.31, 0.5, 0.69, 0.88].map(x => ({ x, prenda: null }));
      const extra = total > 5 ? [0.215, 0.405, 0.595].map(x => ({ x, prenda: null })) : [];
      const todos = [...huecos, ...extra].sort((a, b) => a.x - b.x);
      j.cuerpo.innerHTML = `<div class="tendedero"><div class="cielo">☀️</div><div class="prenda-cae">${PRENDAS[0]}</div><div class="cuerda"><div class="carril">${todos.map((h, i) => `<span class="pinza" data-i="${i}" style="left:${h.x * 100}%"><i>📎</i><b></b></span>`).join('')}</div></div><small class="quedan">Quedan ${total}</small><button class="primario grande">Soltar</button></div>`;
      const carril = j.cuerpo.querySelector('.carril');
      const cae = j.cuerpo.querySelector('.prenda-cae');
      let off = 0;
      let dir = 1;
      let hechas = 0;
      let bien = 0;
      let vivo = true;
      let ultimo = performance.now();
      let ocupado = false;
      const bucle = t => {
        if (!vivo) return;
        const dt = (t - ultimo) / 1000;
        ultimo = t;
        off += dir * dt * (0.18 + hechas * 0.02);
        if (off > 0.25) dir = -1;
        if (off < -0.25) dir = 1;
        carril.style.transform = `translateX(${off * 100}%)`;
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
      j.alTerminar = () => { vivo = false; };
      j.cuerpo.querySelector('button').addEventListener('click', () => {
        if (ocupado || !vivo) return;
        ocupado = true;
        const centro = 0.5 - off;
        let mejor = null;
        for (const h of todos) if (!h.prenda && Math.abs(h.x - centro) < 0.06 && (!mejor || Math.abs(h.x - centro) < Math.abs(mejor.x - centro))) mejor = h;
        const prenda = PRENDAS[hechas % PRENDAS.length];
        cae.classList.add('cayendo');
        setTimeout(() => {
          cae.classList.remove('cayendo');
          if (mejor) {
            mejor.prenda = prenda;
            const el = carril.querySelector(`.pinza[data-i="${todos.indexOf(mejor)}"] b`);
            el.textContent = prenda;
            bien++;
            sonido.pop();
          } else {
            sonido.error();
            j.info('¡Al suelo! Hay que volver a lavarla…');
          }
          hechas++;
          j.cuerpo.querySelector('.quedan').textContent = `Quedan ${total - hechas}`;
          cae.textContent = PRENDAS[hechas % PRENDAS.length];
          ocupado = false;
          if (hechas >= total) {
            vivo = false;
            setTimeout(() => j.final(bien === total ? '¡Todo tendido! Huele a limpio' : `${bien} de ${total} tendidas`, bien / total), 400);
          }
        }, 380);
      });
    });
    if (puntos === null || puntos === undefined) return;
    const caidas = Math.round(total - puntos * total);
    d.lavando = null;
    if (caidas) this.ropa().n += caidas;
    this.ctx.registrar('tender');
    this.ctx.ganar(Math.round(8 * puntos * total) + 5, m, '👕');
    this.ctx.guardar();
    this.ctx.chip();
  }

  actualizar(dt) {
    this.t += dt;
    if (this.led && this.led.arcoiris) {
      const c = new THREE.Color().setHSL((this.t * 0.08) % 1, 1, 0.55);
      for (const t of this.tiras) t.material.emissive.copy(c);
      this.luzLed.color.copy(c);
    }
    this.tLuces = (this.tLuces || 0) + dt;
    if (this.tLuces > 2) {
      this.tLuces = 0;
      this.ajustarLuces();
    }
    let fuego = false;
    for (const m of this.ctx.gestor.muebles) {
      const def = m.userData.def;
      if (def.chimenea) {
        const ms = m.userData.mallas;
        const on = !!m.userData.encendido;
        for (const [k, i] of [[0, 8], [1, 9]]) {
          const f = ms[i];
          if (!f) continue;
          if (!f.userData.escala0) f.userData.escala0 = f.scale.clone();
          f.visible = on;
          if (on) {
            const s = f.userData.escala0;
            f.scale.set(s.x * (1 + Math.sin(this.t * 11 + k) * 0.08), s.y * (1 + Math.sin(this.t * 17 + k * 2) * 0.18 + Math.sin(this.t * 7.3) * 0.08), s.z * (1 + Math.cos(this.t * 13 + k) * 0.08));
          }
        }
        if (m.userData.luz && on) m.userData.luz.intensity = (def.encendible.intensidad ?? 3) * (0.8 + Math.sin(this.t * 9) * 0.12 + Math.sin(this.t * 23) * 0.08);
        if (on) fuego = true;
      }
      if (def.lavadora) {
        const d = m.userData.datos;
        const lavando = d && d.lavando && Date.now() < d.lavando.fin;
        m.rotation.z = lavando ? Math.sin(this.t * 38) * 0.012 : 0;
        const cristal = m.userData.mallas[3];
        if (cristal && cristal.material) cristal.material.color.setHex(lavando ? (Math.sin(this.t * 6) > 0 ? 0x9fc3df : 0xbcd8ee) : 0x7fa3bf);
      }
    }
    if (fuego) {
      this.tChasquido -= dt;
      if (this.tChasquido <= 0) {
        this.tChasquido = 0.15 + Math.random() * 0.9;
        this.ctx.sonido.chasquido();
      }
    }
    this.tRopa = (this.tRopa || 0) + dt;
    if (this.tRopa > 20) {
      this.tRopa = 0;
      this.revisarRopa();
    }
  }
}
