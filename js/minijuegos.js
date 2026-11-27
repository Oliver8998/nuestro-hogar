const INFO = {
  polvo: { titulo: 'Quita el polvo', instruccion: 'Frota con el dedo hasta que no quede nada', emoji: '🧽' },
  barro: { titulo: 'Friega las manchas', instruccion: 'Frota cada mancha hasta que desaparezca', emoji: '🧽' },
  telarana: { titulo: 'Fuera telarañas', instruccion: 'Desliza el dedo para romper los hilos', emoji: '🪶' },
  bichos: { titulo: '¡Hormigas!', instruccion: 'Toca para rociar insecticida. Que no se escapen', emoji: '🧴' },
  caca: { titulo: 'Recoge la caca', instruccion: 'Pon la bolsa encima y mantén', emoji: '🛍️' },
  cucas: { titulo: '¡Cucarachas!', instruccion: 'Toca para rociarlas. ¡Huyen del dedo, acorrálalas!', emoji: '🧴', arreglo: true },
  mancha: { titulo: 'La mancha reseca', instruccion: 'Toca para echar limpiador y frota encima de la espuma', emoji: '🧽', arreglo: true },
  clavos: { titulo: 'Clava la tabla', instruccion: 'Martillea cada clavo hasta el fondo. ¡Cuidado con la mano!', emoji: '🔨', arreglo: true },
  cristal: { titulo: 'Cristal nuevo', instruccion: 'Arranca la cinta, coloca el cristal y sácale brillo', emoji: '🪟', arreglo: true },
  masilla: { titulo: 'Tapa las grietas', instruccion: 'Repasa cada grieta con la espátula de masilla', emoji: '🖌️', arreglo: true },
  antihumedad: { titulo: 'Fuera humedad', instruccion: 'Mantén pulsado para rociar. ¡Si las dejas, vuelven a crecer!', emoji: '🧴', arreglo: true }
};

const RAPIDO = { polvo: 9, barro: 8, telarana: 7, bichos: 13, caca: 10, cucas: 12, mancha: 11, clavos: 9, cristal: 15, masilla: 12, antihumedad: 11 };
const LARGO = 56;
const FROTAR = { polvo: 1, barro: 1, mancha: 1, cristal: 1 };

function suelo(ctx, w, h) {
  const tonos = ['#8a6a4a', '#7d5f42', '#93724f', '#75583c'];
  const ancho = Math.max(60, Math.round(w / 7));
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#5c4430';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i * ancho < w + ancho; i++) {
    ctx.fillStyle = tonos[i % tonos.length];
    ctx.fillRect(i * ancho, 0, ancho - 2, h);
    ctx.fillStyle = '#6a5038';
    ctx.fillRect(i * ancho, (i * 137) % h, ancho - 2, 2);
  }
  ctx.fillStyle = '#000';
}

function pared(ctx, w, h) {
  ctx.fillStyle = '#cfc3a8';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  for (let x = 0; x < w; x += 46) ctx.fillRect(x, 0, 2, h);
  ctx.fillStyle = '#000';
}

function cortan(a, b, c, d) {
  const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(det) < 1e-6) return false;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / det;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / det;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

import { conIntro } from './intro.js';

export class Minijuegos {
  constructor(sonido) {
    this.sonido = sonido;
    const capa = document.createElement('div');
    capa.id = 'minijuego';
    capa.className = 'oculto';
    capa.innerHTML = `
      <canvas></canvas>
      <div class="mj-cabecera">
        <div><b class="mj-titulo"></b><small class="mj-instruccion"></small></div>
        <button class="cerrar">✕</button>
      </div>
      <div class="mj-barra"><i></i></div>
      <div class="mj-exito oculto">✨ ¡Limpio! ✨</div>`;
    document.body.appendChild(capa);
    this.capa = capa;
    this.canvas = capa.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    capa.querySelector('.cerrar').addEventListener('click', () => this.terminar(false));
    this.canvas.addEventListener('pointerdown', e => this.evento('abajo', e));
    this.canvas.addEventListener('pointermove', e => this.evento('mover', e));
    this.canvas.addEventListener('pointerup', e => this.evento('arriba', e));
    this.canvas.addEventListener('pointercancel', e => this.evento('arriba', e));
  }

  jugar(tipo) {
    const info = INFO[tipo];
    let visto = [];
    try { visto = JSON.parse(localStorage.getItem('hogar-intro-limpieza')) || []; } catch (e) {}
    if (visto.includes(tipo)) return this.jugarYa(tipo);
    return conIntro({ clave: `limp:${tipo}`, icono: info.emoji, nombre: info.titulo, como: info.instruccion, sonido: this.sonido }, () => {
      try { localStorage.setItem('hogar-intro-limpieza', JSON.stringify([...visto, tipo])); } catch (e) {}
      return this.jugarYa(tipo);
    }).then(r => r ?? false);
  }

  jugarYa(tipo) {
    return new Promise(resolve => {
      this.resolver = resolve;
      this.tipo = tipo;
      const info = INFO[tipo];
      this.capa.querySelector('.mj-titulo').textContent = info.titulo;
      this.capa.querySelector('.mj-instruccion').textContent = info.instruccion;
      this.capa.querySelector('.mj-exito').classList.add('oculto');
      this.emojiPuntero = null;
      this.capa.classList.remove('oculto');
      requestAnimationFrame(() => this.capa.classList.add('abierto'));
      const r = window.devicePixelRatio || 1;
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = this.w * r;
      this.canvas.height = this.h * r;
      this.ctx.setTransform(r, 0, 0, r, 0, 0);
      this.progreso = 0;
      this.puntero = null;
      this.pulsado = false;
      this.particulas = [];
      this.acabado = false;
      this.t = 0;
      this[`iniciar_${tipo}`]();
      this.ultimo = performance.now();
      const bucle = ahora => {
        if (!this.resolver) return;
        const dt = Math.min(0.05, (ahora - this.ultimo) / 1000);
        this.ultimo = ahora;
        this.t += dt;
        this[`paso_${this.tipo}`](dt);
        this.dibujarParticulas(dt);
        if (this.puntero && !this.acabado) {
          this.ctx.font = '44px serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = '#000';
          this.ctx.fillText(this.emojiPuntero ?? info.emoji, this.puntero.x + 18, this.puntero.y - 30);
        }
        this.capa.querySelector('.mj-barra i').style.width = `${Math.round(Math.min(1, this.progreso) * 100)}%`;
        if (this.progreso >= 1 && !this.acabado) this.ganar();
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
    });
  }

  ganar() {
    this.acabado = true;
    this.sonido.arreglo();
    const seg = Math.max(1, Math.round(this.t));
    const rapido = RAPIDO[this.tipo] || 10;
    const estrellas = this.t <= rapido ? 3 : this.t <= rapido * 1.8 ? 2 : 1;
    let mejores = {};
    try { mejores = JSON.parse(localStorage.getItem('hogar-records-limpieza')) || {}; } catch (e) {}
    const previo = mejores[this.tipo];
    const record = previo !== undefined && seg < previo;
    if (previo === undefined || seg < previo) {
      mejores[this.tipo] = seg;
      try { localStorage.setItem('hogar-records-limpieza', JSON.stringify(mejores)); } catch (e) {}
    }
    const exito = this.capa.querySelector('.mj-exito');
    exito.innerHTML = `✨ ${INFO[this.tipo].arreglo ? '¡Arreglado!' : '¡Limpio!'} ✨<small>${'⭐'.repeat(estrellas)}${'☆'.repeat(3 - estrellas)} · ${seg} s${record ? ' · 🏆 ¡récord!' : previo !== undefined ? ` · mejor ${previo} s` : ''}</small>`;
    exito.classList.remove('oculto');
    for (let i = 0; i < 30; i++) this.chispa(this.w / 2, this.h / 2, i % 3 ? '✨' : '⭐');
    setTimeout(() => this.terminar(true), 1500);
  }

  flotar(x, y, texto, color = '#3a8f5a') {
    this.particulas.push({ x, y, vx: 0, vy: -70, vida: 1, texto, color, sinGravedad: true });
  }

  terminar(ok) {
    if (!this.resolver) return;
    const r = this.resolver;
    this.resolver = null;
    this.capa.classList.remove('abierto');
    setTimeout(() => this.capa.classList.add('oculto'), 250);
    r(ok);
  }

  evento(tipo, e) {
    if (this.acabado) return;
    const p = { x: e.clientX, y: e.clientY };
    if (tipo === 'abajo') {
      this.canvas.setPointerCapture(e.pointerId);
      this.pulsado = true;
      this.anterior = p;
      this.inicioToque = p;
    }
    if (tipo === 'arriba') this.pulsado = false;
    this.puntero = p;
    if (tipo === 'mover' && this.pulsado && FROTAR[this.tipo] && this.anterior) {
      const d = Math.hypot(p.x - this.anterior.x, p.y - this.anterior.y);
      this.frotado = (this.frotado || 0) + d;
      if (this.frotado > 90) {
        this.frotado = 0;
        this.sonido.ruido(0.05, { volumen: 0.025, freq: 1600 + Math.random() * 900, q: 0.7 });
      }
    }
    const f = this[`${tipo}_${this.tipo}`];
    if (f) f.call(this, p);
    if (tipo !== 'arriba') this.anterior = p;
  }

  chispa(x, y, emoji, v = 220) {
    const a = Math.random() * Math.PI * 2;
    const s = v * (0.4 + Math.random() * 0.6);
    this.particulas.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, vida: 1, emoji });
  }

  dibujarParticulas(dt) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const p of this.particulas) {
      p.vida -= dt * 1.4;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.sinGravedad) p.vy += 300 * dt;
      ctx.globalAlpha = Math.max(0, p.vida);
      if (p.texto) {
        ctx.font = '900 24px system-ui, sans-serif';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(p.texto, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.texto, p.x, p.y);
      } else if (p.emoji) {
        ctx.fillStyle = '#000';
        ctx.font = '22px serif';
        ctx.fillText(p.emoji, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.particulas = this.particulas.filter(p => p.vida > 0);
  }

  iniciar_polvo() {
    const capa = document.createElement('canvas');
    capa.width = this.w;
    capa.height = this.h;
    const c = capa.getContext('2d');
    const cx = this.w / 2;
    const cy = this.h * 0.52;
    const rx = this.w * 0.42;
    const ry = this.h * 0.3;
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const x = cx + Math.cos(a) * rx * d;
      const y = cy + Math.sin(a) * ry * d;
      c.fillStyle = `rgba(${170 + Math.random() * 30},${162 + Math.random() * 30},${150 + Math.random() * 30},${0.5 + Math.random() * 0.5})`;
      c.beginPath();
      c.arc(x, y, 8 + Math.random() * 22, 0, Math.PI * 2);
      c.fill();
    }
    this.capaPolvo = capa;
    this.muestra = document.createElement('canvas');
    this.muestra.width = 96;
    this.muestra.height = 96;
    this.restos = [];
    this.tPista = 0;
    this.inicialPolvo = this.contarPolvo();
    this.tMuestra = 0;
  }

  contarPolvo() {
    const m = this.muestra.getContext('2d', { willReadFrequently: true });
    m.clearRect(0, 0, 96, 96);
    m.drawImage(this.capaPolvo, 0, 0, 96, 96);
    const datos = m.getImageData(0, 0, 96, 96).data;
    let n = 0;
    this.restos = [];
    for (let i = 3; i < datos.length; i += 4) {
      if (datos[i] > 18) {
        n++;
        const k = (i - 3) / 4;
        if (this.restos.length < 400) this.restos.push({ x: ((k % 96) + 0.5) * this.w / 96, y: (Math.floor(k / 96) + 0.5) * this.h / 96 });
      }
    }
    return n;
  }

  mover_polvo(p) {
    if (!this.pulsado) return;
    const c = this.capaPolvo.getContext('2d');
    c.globalCompositeOperation = 'destination-out';
    c.lineCap = 'round';
    c.lineWidth = 70;
    c.beginPath();
    c.moveTo(this.anterior.x, this.anterior.y);
    c.lineTo(p.x, p.y);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
    if (Math.random() < 0.4) this.particulas.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 60, vy: -40, vida: 0.8, r: 3 + Math.random() * 4, color: 'rgba(190,180,168,.8)' });
  }

  abajo_polvo(p) {
    this.mover_polvo(p);
  }

  paso_polvo(dt) {
    suelo(this.ctx, this.w, this.h);
    this.ctx.drawImage(this.capaPolvo, 0, 0, this.w, this.h);
    this.tMuestra += dt;
    if (this.tMuestra > 0.25) {
      this.tMuestra = 0;
      const n = this.contarPolvo();
      const resto = n / Math.max(1, this.inicialPolvo);
      this.progreso = n === 0 ? 1 : Math.min(0.99, 1 - resto);
    }
    this.tPista += dt;
    if (this.progreso > 0.9 && this.progreso < 1 && this.restos.length && this.tPista > 0.7) {
      this.tPista = 0;
      const r = this.restos[Math.floor(Math.random() * this.restos.length)];
      this.chispa(r.x, r.y, '✨', 40);
    }
  }

  iniciar_barro() {
    this.manchas = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
      this.manchas.push({
        x: this.w * (0.2 + Math.random() * 0.6),
        y: this.h * (0.28 + Math.random() * 0.5),
        r: 45 + Math.random() * 35,
        sucio: 1,
        forma: Array.from({ length: 6 }, () => [Math.random() * 0.6 - 0.3, Math.random() * 0.6 - 0.3, 0.5 + Math.random() * 0.5])
      });
    }
  }

  mover_barro(p) {
    if (!this.pulsado) return;
    const d = Math.hypot(p.x - this.anterior.x, p.y - this.anterior.y);
    for (const m of this.manchas) {
      if (m.sucio <= 0) continue;
      if (Math.hypot(p.x - m.x, p.y - m.y) < m.r * 1.1) {
        m.sucio = Math.max(0, m.sucio - d / (m.r * 12));
        if (Math.random() < 0.5) this.particulas.push({ x: p.x + (Math.random() - 0.5) * 40, y: p.y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 40, vy: -60, vida: 1, r: 4 + Math.random() * 7, color: 'rgba(220,240,255,.75)' });
        if (m.sucio === 0) {
          this.sonido.pop();
          for (let k = 0; k < 8; k++) this.chispa(m.x, m.y, '🫧', 160);
        }
      }
    }
  }

  paso_barro() {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    for (const m of this.manchas) {
      if (m.sucio <= 0) continue;
      ctx.globalAlpha = m.sucio * 0.85;
      ctx.fillStyle = '#5e4128';
      for (const [dx, dy, s] of m.forma) {
        ctx.beginPath();
        ctx.arc(m.x + dx * m.r, m.y + dy * m.r, m.r * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    const quedan = this.manchas.some(m => m.sucio > 0);
    this.progreso = quedan ? Math.min(0.99, 1 - this.manchas.reduce((s, m) => s + m.sucio, 0) / this.manchas.length) : 1;
  }

  iniciar_telarana() {
    const cx = this.w / 2;
    const cy = this.h * 0.48;
    const R = Math.min(this.w, this.h) * 0.4;
    const radios = 8;
    const anillos = [0.3, 0.55, 0.8, 1];
    const puntos = (k, a) => ({ x: cx + Math.cos(a * Math.PI * 2 / radios - Math.PI / 2) * R * k, y: cy + Math.sin(a * Math.PI * 2 / radios - Math.PI / 2) * R * k });
    this.hilos = [];
    for (let a = 0; a < radios; a++) this.hilos.push({ a: { x: cx, y: cy }, b: puntos(1.05, a), roto: false, caida: 0 });
    for (const k of anillos) {
      for (let a = 0; a < radios; a++) this.hilos.push({ a: puntos(k, a), b: puntos(k, a + 1), roto: false, caida: 0 });
    }
    this.arana = { x: cx, y: cy, huye: false };
  }

  mover_telarana(p) {
    if (!this.pulsado) return;
    for (const h of this.hilos) {
      if (h.roto) continue;
      if (cortan(this.anterior, p, h.a, h.b)) {
        h.roto = true;
        this.sonido.tic();
        if (Math.random() < 0.5) this.chispa((h.a.x + h.b.x) / 2, (h.a.y + h.b.y) / 2, '✨', 120);
      }
    }
  }

  paso_telarana(dt) {
    const ctx = this.ctx;
    pared(ctx, this.w, this.h);
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.lineWidth = 2.5;
    for (const h of this.hilos) {
      if (h.roto) {
        h.caida += dt;
        if (h.caida > 1) continue;
        ctx.globalAlpha = 1 - h.caida;
      }
      const dy = h.roto ? h.caida * h.caida * 400 : 0;
      ctx.beginPath();
      ctx.moveTo(h.a.x, h.a.y + dy);
      ctx.lineTo(h.b.x, h.b.y + dy);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const rotos = this.hilos.filter(h => h.roto).length;
    this.progreso = rotos / this.hilos.length;
    const a = this.arana;
    if (this.progreso > 0.5) a.huye = true;
    if (a.huye) a.y += dt * 500;
    else {
      a.x += Math.sin(this.t * 3) * 0.6;
      a.y += Math.cos(this.t * 2) * 0.4;
    }
    if (a.y < this.h + 60) {
      ctx.font = '52px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕷️', a.x, a.y);
    }
  }

  iniciar_bichos() {
    this.hormigas = [];
    this.muertas = 0;
    this.meta = 15;
    this.tAparecer = 0;
    this.nubes = [];
    this.emojiPuntero = '🧴';
  }

  abajo_bichos(p) {
    this.nubes.push({ x: p.x, y: p.y, t: 0 });
    this.sonido.pop();
    for (const h of this.hormigas) {
      if (!h.viva) continue;
      if (Math.hypot(h.x - p.x, h.y - p.y) < 70) {
        h.viva = false;
        h.t = 0;
        this.muertas++;
      }
    }
  }

  paso_bichos(dt) {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    this.tAparecer -= dt;
    const vivas = this.hormigas.filter(h => h.viva).length;
    if (this.tAparecer <= 0 && vivas < 7 && this.muertas + vivas < this.meta) {
      this.tAparecer = 0.45;
      const lado = Math.random() < 0.5 ? -1 : 1;
      const y = this.h * (0.2 + Math.random() * 0.65);
      this.hormigas.push({ x: lado < 0 ? -20 : this.w + 20, y, vx: -lado * (70 + Math.random() * 70), fase: Math.random() * 6, viva: true, t: 0 });
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.shadowColor = 'rgba(255, 246, 220, .9)';
    ctx.shadowBlur = 8;
    for (const h of this.hormigas) {
      if (h.viva) {
        h.x += h.vx * dt;
        h.y += Math.sin(this.t * 8 + h.fase) * 40 * dt;
        if (h.x < -40 || h.x > this.w + 40) h.fuera = true;
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.scale(h.vx > 0 ? -1 : 1, 1);
        ctx.font = '40px serif';
        ctx.fillText('🐜', 0, 0);
        ctx.restore();
      } else {
        h.t += dt;
        ctx.globalAlpha = Math.max(0, 1 - h.t);
        ctx.font = '30px serif';
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(Math.PI);
        ctx.fillText('🐜', 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    this.hormigas = this.hormigas.filter(h => !h.fuera && (h.viva || h.t < 1));
    for (const n of this.nubes) {
      n.t += dt;
      ctx.globalAlpha = Math.max(0, 0.5 - n.t * 0.6);
      ctx.fillStyle = '#d8f2ea';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 30 + n.t * 90, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.nubes = this.nubes.filter(n => n.t < 0.9);
    const quedan = this.hormigas.some(h => h.viva);
    this.progreso = quedan ? Math.min(0.99, this.muertas / this.meta) : this.muertas / this.meta;
  }

  iniciar_caca() {
    this.fase = 0;
    this.bolsa = { x: this.w * 0.25, y: this.h * 0.8, llena: false, nudos: 0 };
    this.caca = { x: this.w / 2, y: this.h * 0.45 };
    this.basura = { x: this.w * 0.8, y: this.h * 0.78 };
    this.mantener = 0;
    this.emojiPuntero = '';
    this.agarrada = false;
  }

  instruccion(texto) {
    this.capa.querySelector('.mj-instruccion').textContent = texto;
  }

  abajo_caca(p) {
    this.agarrada = Math.hypot(p.x - this.bolsa.x, p.y - this.bolsa.y) < 80;
    this.inicioNudo = p.y;
  }

  mover_caca(p) {
    if (!this.pulsado) return;
    if (this.fase === 1) {
      if (this.inicioNudo - p.y > 90) {
        this.bolsa.nudos++;
        this.inicioNudo = p.y;
        this.sonido.pop();
        this.chispa(this.bolsa.x, this.bolsa.y - 40, '✨', 120);
        if (this.bolsa.nudos >= 2) {
          this.fase = 2;
          this.instruccion('Ahora arrástrala hasta la basura');
        }
      }
      if (p.y > this.inicioNudo) this.inicioNudo = p.y;
      return;
    }
    if (this.agarrada) {
      this.bolsa.x = p.x;
      this.bolsa.y = p.y;
    }
  }

  arriba_caca() {
    this.agarrada = false;
    this.mantener = 0;
  }

  paso_caca(dt) {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '86px serif';
    ctx.fillText('🗑️', this.basura.x, this.basura.y);

    if (this.fase === 0) {
      const encima = Math.hypot(this.bolsa.x - this.caca.x, this.bolsa.y - this.caca.y) < 60 && this.pulsado && this.agarrada;
      this.mantener = encima ? this.mantener + dt : Math.max(0, this.mantener - dt);
      ctx.font = '96px serif';
      ctx.save();
      ctx.translate(this.caca.x, this.caca.y);
      ctx.scale(1 + Math.sin(this.t * 6) * 0.04, 1 - Math.sin(this.t * 6) * 0.04);
      ctx.fillText('💩', 0, 0);
      ctx.restore();
      if (Math.random() < 0.05) this.particulas.push({ x: this.caca.x + (Math.random() - 0.5) * 60, y: this.caca.y - 50, vx: (Math.random() - 0.5) * 30, vy: -60, vida: 1, emoji: '〰️' });
      if (this.mantener > 0) {
        ctx.strokeStyle = '#6cc08a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.caca.x, this.caca.y, 70, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, this.mantener / 1));
        ctx.stroke();
      }
      if (this.mantener >= 1) {
        this.fase = 1;
        this.bolsa.llena = true;
        this.sonido.pop();
        this.instruccion('Ata la bolsa: desliza hacia arriba dos veces');
      }
    }

    const b = this.bolsa;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#6cc08a';
    ctx.beginPath();
    ctx.ellipse(0, 0, b.llena ? 46 : 40, b.llena ? 52 : 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4e9d6b';
    if (b.nudos >= 1) {
      ctx.beginPath();
      ctx.ellipse(-12, -56, 10, 16, -0.4, 0, Math.PI * 2);
      ctx.ellipse(12, -56, 10, 16, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-30, -52, 60, 10);
    }
    if (b.nudos >= 2) {
      ctx.beginPath();
      ctx.arc(0, -48, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (this.fase === 2 && Math.hypot(b.x - this.basura.x, b.y - this.basura.y) < 70) {
      this.fase = 3;
      b.x = -999;
      for (let k = 0; k < 10; k++) this.chispa(this.basura.x, this.basura.y - 40, '✨', 160);
    }
    this.progreso = this.fase === 0 ? this.mantener / 3 : this.fase === 1 ? 0.33 + b.nudos * 0.16 : this.fase === 2 ? 0.7 : 1;
  }

  // ——— arreglos ———

  iniciar_cucas() {
    this.meta = 9;
    this.muertas = 0;
    this.nubes = [];
    this.emojiPuntero = '🧴';
    this.cucas = Array.from({ length: this.meta }, () => ({
      x: this.w * (0.15 + Math.random() * 0.7), y: this.h * (0.25 + Math.random() * 0.6),
      a: Math.random() * Math.PI * 2, viva: true, t: 0, pausa: Math.random() * 2
    }));
  }

  abajo_cucas(p) {
    this.nubes.push({ x: p.x, y: p.y, t: 0 });
    this.sonido.ruido(0.18, { volumen: 0.06, freq: 3000, q: 0.5 });
    let n = 0;
    for (const c of this.cucas) {
      if (!c.viva || Math.hypot(c.x - p.x, c.y - p.y) > 62) continue;
      c.viva = false;
      c.t = 0;
      n++;
      this.muertas++;
    }
    if (n) {
      this.sonido.pop();
      if (n > 1) this.flotar(p.x, p.y - 40, n > 2 ? '¡Triple!' : '¡Doble!', '#d69a00');
    }
  }

  paso_cucas(dt) {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const c of this.cucas) {
      if (c.viva) {
        let v = 150;
        if (this.puntero) {
          const dx = c.x - this.puntero.x, dy = c.y - this.puntero.y;
          const d = Math.hypot(dx, dy);
          if (d < 150) {
            const huir = Math.atan2(dy, dx);
            let diff = huir - c.a;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            c.a += diff * Math.min(1, dt * 6);
            v = 260;
          }
        }
        c.pausa -= dt;
        if (c.pausa < 0) {
          if (c.pausa < -1.6) c.pausa = 0.4 + Math.random() * 1.8;
          v = v === 260 ? 260 : 0;
        }
        c.a += (Math.random() - 0.5) * 7 * dt;
        c.x += Math.cos(c.a) * v * dt;
        c.y += Math.sin(c.a) * v * dt;
        const m = 30;
        if (c.x < m) { c.x = m; c.a = Math.PI - c.a; }
        if (c.x > this.w - m) { c.x = this.w - m; c.a = Math.PI - c.a; }
        if (c.y < this.h * 0.16) { c.y = this.h * 0.16; c.a = -c.a; }
        if (c.y > this.h - m) { c.y = this.h - m; c.a = -c.a; }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.a + Math.PI / 2);
        ctx.font = '42px serif';
        ctx.fillStyle = '#000';
        ctx.fillText('🪳', 0, 0);
        ctx.restore();
      } else {
        c.t += dt;
        ctx.globalAlpha = Math.max(0, 1 - c.t);
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(Math.PI);
        ctx.font = '34px serif';
        ctx.fillText('🪳', 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    for (const n of this.nubes) {
      n.t += dt;
      ctx.globalAlpha = Math.max(0, 0.5 - n.t * 0.6);
      ctx.fillStyle = '#d8f2ea';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 30 + n.t * 90, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.nubes = this.nubes.filter(n => n.t < 0.9);
    this.progreso = this.muertas >= this.meta ? 1 : Math.min(0.99, this.muertas / this.meta);
  }

  iniciar_mancha() {
    this.celdas = [];
    const cx = this.w / 2, cy = this.h * 0.55;
    const R = Math.min(this.w, this.h) * 0.3;
    const lobulos = Array.from({ length: 6 }, () => [Math.random() * Math.PI * 2, 0.55 + Math.random() * 0.45]);
    for (let x = cx - R * 1.3; x < cx + R * 1.3; x += 20) {
      for (let y = cy - R * 1.3; y < cy + R * 1.3; y += 20) {
        const a = Math.atan2(y - cy, x - cx);
        let lim = R * 0.42;
        for (const [la, k] of lobulos) lim += Math.pow(Math.max(0, Math.cos(a - la)), 3) * R * 0.75 * k;
        if (Math.hypot(x - cx, y - cy) < lim) this.celdas.push({ x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, v: 1 });
      }
    }
    this.espumas = [];
    this.avisoEspuma = 0;
  }

  abajo_mancha(p) {
    this.espumas.push({ x: p.x, y: p.y, r: 46, vida: 1, t: 0 });
    this.sonido.ruido(0.15, { volumen: 0.05, freq: 2600, q: 0.6 });
  }

  mover_mancha(p) {
    if (!this.pulsado) return;
    const d = Math.hypot(p.x - this.anterior.x, p.y - this.anterior.y);
    const espuma = this.espumas.find(e => e.vida > 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 10);
    if (espuma) espuma.vida = Math.max(0, espuma.vida - d / 1400);
    const fuerza = espuma ? d / 160 : d / 1300;
    let toca = false;
    for (const c of this.celdas) {
      if (c.v <= 0 || Math.hypot(c.x - p.x, c.y - p.y) > 36) continue;
      c.v = Math.max(0, c.v - fuerza);
      toca = true;
    }
    if (toca && !espuma && this.t - this.avisoEspuma > 2.5) {
      this.avisoEspuma = this.t;
      this.flotar(p.x, p.y - 50, '¡Echa limpiador! 🧴', '#d9534f');
    }
    if (toca && espuma && Math.random() < 0.5) this.particulas.push({ x: p.x + (Math.random() - 0.5) * 40, y: p.y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 40, vy: -60, vida: 1, r: 4 + Math.random() * 7, color: 'rgba(220,240,255,.75)' });
  }

  paso_mancha(dt) {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    ctx.fillStyle = '#3f2b19';
    for (const c of this.celdas) {
      if (c.v <= 0) continue;
      ctx.globalAlpha = c.v * 0.85;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 17, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of this.espumas) {
      e.t += dt;
      if (e.vida <= 0) continue;
      ctx.globalAlpha = Math.min(1, e.t * 5) * Math.min(1, e.vida * 1.5) * 0.9;
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 11; k++) {
        const a = k * 2.4 + e.x;
        const d = (k % 3) * 0.3 + 0.1;
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(a) * e.r * d, e.y + Math.sin(a) * e.r * d, e.r * (0.18 + (k % 4) * 0.07), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.espumas = this.espumas.filter(e => e.vida > 0);
    const total = this.celdas.length;
    const resto = this.celdas.reduce((s, c) => s + c.v, 0) / total;
    this.progreso = resto < 0.03 ? 1 : Math.min(0.99, 1 - resto);
  }

  iniciar_clavos() {
    this.emojiPuntero = '🔨';
    const y = this.h * 0.55;
    this.tabla = { x0: this.w * 0.08, x1: this.w * 0.92, y };
    const n = 4;
    this.clavos = Array.from({ length: n }, (_, i) => ({ x: this.tabla.x0 + (this.tabla.x1 - this.tabla.x0) * (i + 0.5) / n, alto: 1, doblado: 0 }));
    this.mano = { i: 1, t: 0 };
    this.golpe = 0;
    this.ays = 0;
  }

  abajo_clavos(p) {
    this.golpe = 0.15;
    const ang = 0.14 * (1 - this.progreso);
    const mano = this.clavos[this.mano.i];
    if (mano && mano.alto > 0 && Math.hypot(p.x - (mano.x + 40), p.y - this.alturaTabla(mano.x, ang) - 4) < 34) {
      this.ays++;
      this.sonido.error();
      this.flotar(p.x, p.y - 50, '¡Ay, mi dedo! 🤕', '#d9534f');
      this.capa.classList.remove('j3-tiembla');
      void this.capa.offsetWidth;
      this.capa.classList.add('j3-tiembla');
      this.mano.t = 0;
      return;
    }
    let mejor = null, dist = 58;
    for (const c of this.clavos) {
      if (c.alto <= 0) continue;
      const cy = this.alturaTabla(c.x, ang) - c.alto * LARGO;
      const d = Math.hypot(p.x - c.x, p.y - cy);
      if (d < dist) { dist = d; mejor = c; }
    }
    if (!mejor) {
      this.sonido.tono(160, 0, 0.08, { tipo: 'square', volumen: 0.04 });
      return;
    }
    const preciso = dist < 22;
    mejor.alto = Math.max(0, mejor.alto - (preciso ? 0.5 : 0.25));
    this.sonido.tono(preciso ? 420 : 300, 0, 0.09, { tipo: 'square', volumen: 0.08, hasta: 120 });
    for (let k = 0; k < (preciso ? 6 : 3); k++) this.chispa(mejor.x, this.alturaTabla(mejor.x, ang) - 10, preciso ? '✨' : '💥', 140);
    if (mejor.alto === 0) {
      this.flotar(mejor.x, this.alturaTabla(mejor.x, ang) - 60, preciso ? '¡Clavado!' : '¡Hecho!', '#3a8f5a');
      const quedan = this.clavos.map((c, i) => [c, i]).filter(([c]) => c.alto > 0);
      if (quedan.length) this.mano.i = quedan[Math.floor(Math.random() * quedan.length)][1];
    }
  }

  alturaTabla(x, ang) {
    return this.tabla.y - (x - this.tabla.x0) * Math.tan(ang);
  }

  paso_clavos(dt) {
    const ctx = this.ctx;
    suelo(ctx, this.w, this.h);
    const ang = 0.14 * (1 - this.progreso);
    const { x0, x1 } = this.tabla;
    ctx.save();
    ctx.translate(x0, this.tabla.y);
    ctx.rotate(-ang);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, 26, x1 - x0, 22);
    ctx.fillStyle = '#a77b52';
    ctx.fillRect(0, -30, x1 - x0, 60);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let k = 0; k < 5; k++) ctx.fillRect(0, -20 + k * 11, x1 - x0, 2);
    ctx.restore();
    this.mano.t += dt;
    for (let i = 0; i < this.clavos.length; i++) {
      const c = this.clavos[i];
      const by = this.alturaTabla(c.x, ang);
      ctx.fillStyle = '#9aa0a6';
      ctx.fillRect(c.x - 4, by - c.alto * LARGO, 8, c.alto * LARGO);
      ctx.fillStyle = '#6d737a';
      ctx.beginPath();
      ctx.ellipse(c.x, by - c.alto * LARGO, 17, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      if (c.alto > 0) {
        ctx.globalAlpha = 0.35 + Math.sin(this.t * 6 + i) * 0.2;
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c.x, by - c.alto * LARGO, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (i === this.mano.i && c.alto > 0) {
        ctx.font = '58px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText('🤚', c.x + 40, by - 4 + Math.sin(this.mano.t * 3) * 2);
      }
    }
    if (this.golpe > 0) this.golpe -= dt;
    const hecho = this.clavos.reduce((s, c) => s + (1 - c.alto), 0) / this.clavos.length;
    this.progreso = this.clavos.every(c => c.alto <= 0) ? 1 : Math.min(0.99, hecho);
  }

  iniciar_cristal() {
    this.fase = 0;
    const fw = Math.min(this.w * 0.7, 340), fh = Math.min(this.h * 0.38, 300);
    this.marco = { x: this.w / 2 - fw / 2, y: this.h * 0.2, w: fw, h: fh };
    const m = this.marco;
    this.cintas = [[m.x + 10, m.y + 10], [m.x + m.w - 10, m.y + 10], [m.x + 10, m.y + m.h - 10], [m.x + m.w - 10, m.y + m.h - 10]].map(([x, y]) => ({ x, y, quitada: false, t: 0 }));
    this.carton = { caida: 0 };
    this.vidrio = { x: this.w / 2, y: this.h * 0.82, cogido: false, puesto: false };
    this.huellas = [];
  }

  abajo_cristal(p) {
    if (this.fase === 0) {
      for (const c of this.cintas) {
        if (c.quitada || Math.hypot(p.x - c.x, p.y - c.y) > 50) continue;
        c.quitada = true;
        this.sonido.ruido(0.2, { volumen: 0.08, freq: 1200, q: 0.4 });
        this.chispa(c.x, c.y, '📦', 200);
        if (this.cintas.every(x => x.quitada)) { this.fase = 1; this.carton.caida = 0.001; this.sonido.colocar(); }
        return;
      }
    } else if (this.fase === 2) {
      const v = this.vidrio;
      if (Math.abs(p.x - v.x) < this.marco.w / 2 && Math.abs(p.y - v.y) < this.marco.h / 2 + 20) {
        v.cogido = true;
        v.dx = v.x - p.x;
        v.dy = v.y - p.y;
      }
    }
  }

  mover_cristal(p) {
    const v = this.vidrio;
    if (this.fase === 2 && v.cogido) {
      v.x = p.x + v.dx;
      v.y = p.y + v.dy;
    } else if (this.fase === 3 && this.pulsado) {
      const d = Math.hypot(p.x - this.anterior.x, p.y - this.anterior.y);
      for (const h of this.huellas) {
        if (h.v <= 0 || Math.hypot(p.x - h.x, p.y - h.y) > h.r + 16) continue;
        h.v = Math.max(0, h.v - d / 420);
        if (h.v === 0) { this.sonido.pop(); this.chispa(h.x, h.y, '✨', 120); }
      }
    }
  }

  arriba_cristal() {
    const v = this.vidrio;
    if (this.fase !== 2 || !v.cogido) return;
    v.cogido = false;
    const cx = this.marco.x + this.marco.w / 2, cy = this.marco.y + this.marco.h / 2;
    if (Math.hypot(v.x - cx, v.y - cy) < 42) {
      v.x = cx;
      v.y = cy;
      v.puesto = true;
      this.fase = 3;
      this.sonido.arreglo();
      this.flotar(cx, cy - this.marco.h / 2 - 20, '¡Encaja!', '#3a8f5a');
      this.instruccion('Ahora frota las huellas para que brille');
      const m = this.marco;
      this.huellas = Array.from({ length: 5 }, () => ({ x: m.x + 30 + Math.random() * (m.w - 60), y: m.y + 30 + Math.random() * (m.h - 60), r: 22 + Math.random() * 12, v: 1 }));
    } else {
      this.sonido.error();
      this.flotar(v.x, v.y - 60, 'Más centrado…', '#d9534f');
    }
  }

  paso_cristal(dt) {
    const ctx = this.ctx;
    pared(ctx, this.w, this.h);
    const m = this.marco;
    const cielo = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
    cielo.addColorStop(0, '#8fd0f5');
    cielo.addColorStop(1, '#d4effc');
    ctx.fillStyle = cielo;
    ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText('☁️', m.x + m.w * 0.3 + Math.sin(this.t * 0.4) * 10, m.y + m.h * 0.3);
    if (this.fase === 1) {
      this.carton.caida += dt;
      if (this.carton.caida > 0.7) {
        this.fase = 2;
        this.instruccion('Arrastra el cristal nuevo hasta el marco');
      }
    }
    if (this.fase <= 1) {
      const k = this.carton.caida;
      ctx.save();
      ctx.translate(m.x + m.w / 2, m.y + m.h / 2 + k * k * 900);
      ctx.rotate(k * 0.8);
      ctx.fillStyle = '#b88a5a';
      ctx.fillRect(-m.w / 2 + 4, -m.h / 2 + 4, m.w - 8, m.h - 8);
      ctx.strokeStyle = 'rgba(0,0,0,.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-m.w / 2 + 20, -10);
      ctx.lineTo(m.w / 2 - 30, 20);
      ctx.stroke();
      ctx.restore();
      for (const c of this.cintas) {
        if (c.quitada) continue;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = 'rgba(230,220,180,.95)';
        ctx.fillRect(-34, -11, 68, 22);
        ctx.restore();
        ctx.globalAlpha = 0.4 + Math.sin(this.t * 6) * 0.25;
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 14;
    ctx.strokeRect(m.x, m.y, m.w, m.h);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(m.x + m.w / 2, m.y);
    ctx.lineTo(m.x + m.w / 2, m.y + m.h);
    ctx.stroke();
    if (this.fase >= 2) {
      const v = this.vidrio;
      if (!v.puesto) {
        ctx.setLineDash([10, 8]);
        ctx.strokeStyle = 'rgba(76,175,80,.8)';
        ctx.lineWidth = 3;
        ctx.strokeRect(m.x + 6, m.y + 6, m.w - 12, m.h - 12);
        ctx.setLineDash([]);
      }
      ctx.fillStyle = 'rgba(200,235,255,.45)';
      ctx.fillRect(v.x - m.w / 2 + 6, v.y - m.h / 2 + 6, m.w - 12, m.h - 12);
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(v.x - m.w / 2 + 30, v.y - m.h / 2 + 50);
      ctx.lineTo(v.x - m.w / 2 + 70, v.y - m.h / 2 + 15);
      ctx.stroke();
      for (const h of this.huellas) {
        if (h.v <= 0) continue;
        ctx.globalAlpha = h.v * 0.55;
        ctx.fillStyle = '#8c8c8c';
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.ellipse(h.x + (k - 1.5) * h.r * 0.45, h.y - Math.abs(k - 1.5) * 6, h.r * 0.22, h.r * 0.34, (k - 1.5) * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + h.r * 0.5, h.r * 0.55, h.r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    this.emojiPuntero = this.fase === 3 ? '🧽' : this.fase === 2 ? '✋' : '👆';
    const brillo = this.huellas.length ? 1 - this.huellas.reduce((s, h) => s + h.v, 0) / this.huellas.length : 0;
    const p = this.fase === 0 ? this.cintas.filter(c => c.quitada).length / 4 * 0.3 : this.fase <= 2 ? 0.35 : 0.5 + brillo * 0.5;
    this.progreso = this.fase === 3 && this.huellas.every(h => h.v <= 0) ? 1 : Math.min(0.99, p);
  }

  iniciar_masilla() {
    this.emojiPuntero = '🖌️';
    this.puntos = [];
    this.grietas = [];
    for (let g = 0; g < 3; g++) {
      let x = this.w * (0.2 + g * 0.3) + (Math.random() - 0.5) * 40;
      let y = this.h * (0.25 + Math.random() * 0.1);
      let a = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const linea = [{ x, y }];
      for (let k = 0; k < 9; k++) {
        a += (Math.random() - 0.5) * 1.1;
        a = Math.max(0.5, Math.min(Math.PI - 0.5, a));
        x += Math.cos(a) * this.h * 0.05;
        y += Math.sin(a) * this.h * 0.05;
        x = Math.max(30, Math.min(this.w - 30, x));
        linea.push({ x, y });
      }
      this.grietas.push(linea);
      for (let k = 0; k < linea.length - 1; k++) {
        const A = linea[k], B = linea[k + 1];
        const n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y) / 7);
        for (let i = 0; i < n; i++) this.puntos.push({ x: A.x + (B.x - A.x) * i / n, y: A.y + (B.y - A.y) * i / n, ok: false, g });
      }
    }
    this.completas = new Set();
  }

  mover_masilla(p) {
    if (!this.pulsado) return;
    const a = this.anterior;
    const pasos = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 8));
    let nuevos = 0;
    for (let s = 0; s <= pasos; s++) {
      const x = a.x + (p.x - a.x) * s / pasos, y = a.y + (p.y - a.y) * s / pasos;
      for (const q of this.puntos) {
        if (!q.ok && Math.hypot(q.x - x, q.y - y) < 24) { q.ok = true; nuevos++; }
      }
    }
    if (nuevos && Math.random() < 0.4) this.particulas.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 50, vy: -30, vida: 0.7, r: 3 + Math.random() * 3, color: 'rgba(240,236,228,.9)' });
    for (let g = 0; g < this.grietas.length; g++) {
      if (this.completas.has(g)) continue;
      const suyos = this.puntos.filter(q => q.g === g);
      if (suyos.filter(q => q.ok).length / suyos.length > 0.94) {
        this.completas.add(g);
        suyos.forEach(q => { q.ok = true; });
        this.sonido.pop();
        const fin = this.grietas[g][this.grietas[g].length - 1];
        this.flotar(fin.x, fin.y - 30, '¡Tapada!', '#3a8f5a');
      }
    }
  }

  paso_masilla() {
    const ctx = this.ctx;
    pared(ctx, this.w, this.h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const linea of this.grietas) {
      ctx.strokeStyle = '#3d3326';
      ctx.lineWidth = 4;
      ctx.beginPath();
      linea.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(61,51,38,.5)';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < linea.length - 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(linea[i].x, linea[i].y);
        ctx.lineTo(linea[i].x + (i % 4 ? 14 : -14), linea[i].y + 10);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#eeeae1';
    for (const q of this.puntos) {
      if (!q.ok) continue;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    const hechos = this.puntos.filter(q => q.ok).length / this.puntos.length;
    this.progreso = this.completas.size >= this.grietas.length ? 1 : Math.min(0.99, hechos);
  }

  iniciar_antihumedad() {
    this.manchasH = [];
    this.pendientes = [2.5, 5.5];
    this.totalH = 5 + this.pendientes.length;
    this.quitadas = 0;
    this.niebla = [];
    for (let i = 0; i < 5; i++) this.nuevaHumedad();
  }

  nuevaHumedad() {
    const r = 40 + Math.random() * 25;
    this.manchasH.push({ x: this.w * (0.15 + Math.random() * 0.7), y: this.h * (0.25 + Math.random() * 0.6), r, r0: r, max: r * 1.3, forma: Array.from({ length: 6 }, () => [Math.random() - 0.5, Math.random() - 0.5, 0.4 + Math.random() * 0.5]) });
  }

  paso_antihumedad(dt) {
    const ctx = this.ctx;
    pared(ctx, this.w, this.h);
    if (this.pendientes.length && this.t > this.pendientes[0]) {
      this.pendientes.shift();
      this.nuevaHumedad();
      const m = this.manchasH[this.manchasH.length - 1];
      this.flotar(m.x, m.y - m.r - 20, '¡Ha salido otra!', '#d9534f');
      this.sonido.tono(300, 0, 0.2, { tipo: 'sine', volumen: 0.06, hasta: 200 });
    }
    const p = this.puntero;
    if (this.pulsado && p) {
      for (let k = 0; k < 3; k++) this.niebla.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y + (Math.random() - 0.5) * 30, r: 10 + Math.random() * 16, t: 0 });
      if (Math.random() < 0.25) this.sonido.ruido(0.08, { volumen: 0.025, freq: 3200, q: 0.5 });
    }
    for (const m of this.manchasH) {
      const rociada = this.pulsado && p && Math.hypot(p.x - m.x, p.y - m.y) < m.r + 40;
      if (rociada) m.r -= 55 * dt;
      else m.r = Math.min(m.max, m.r + 6 * dt);
      if (m.r < 10) {
        m.fuera = true;
        this.quitadas++;
        this.sonido.pop();
        for (let k = 0; k < 8; k++) this.chispa(m.x, m.y, '✨', 150);
        continue;
      }
      ctx.fillStyle = 'rgba(96,110,70,.55)';
      for (const [dx, dy, k] of m.forma) {
        ctx.beginPath();
        ctx.arc(m.x + dx * m.r, m.y + dy * m.r, m.r * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(60,70,40,.4)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    this.manchasH = this.manchasH.filter(m => !m.fuera);
    for (const n of this.niebla) {
      n.t += dt;
      ctx.globalAlpha = Math.max(0, 0.35 - n.t * 0.5);
      ctx.fillStyle = '#e6f7ff';
      ctx.beginPath();
      ctx.arc(n.x, n.y - n.t * 20, n.r + n.t * 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.niebla = this.niebla.filter(n => n.t < 0.7);
    const parcial = this.manchasH.reduce((s, m) => s + Math.max(0, 1 - m.r / m.r0) * 0.5, 0);
    const acabado = !this.manchasH.length && !this.pendientes.length;
    this.progreso = acabado ? 1 : Math.min(0.99, (this.quitadas + parcial) / this.totalH);
  }
}
