const INFO = {
  polvo: { titulo: 'Quita el polvo', instruccion: 'Frota con el dedo hasta que no quede nada', emoji: '🧽' },
  barro: { titulo: 'Friega las manchas', instruccion: 'Frota cada mancha hasta que desaparezca', emoji: '🧽' },
  telarana: { titulo: 'Fuera telarañas', instruccion: 'Desliza el dedo para romper los hilos', emoji: '🪶' },
  bichos: { titulo: '¡Hormigas!', instruccion: 'Toca para rociar insecticida. Que no se escapen', emoji: '🧴' },
  caca: { titulo: 'Recoge la caca', instruccion: 'Pon la bolsa encima y mantén', emoji: '🛍️' }
};

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
    this.capa.querySelector('.mj-exito').classList.remove('oculto');
    for (let i = 0; i < 30; i++) this.chispa(this.w / 2, this.h / 2, '✨');
    setTimeout(() => this.terminar(true), 1100);
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
      p.vy += 300 * dt;
      ctx.globalAlpha = Math.max(0, p.vida);
      if (p.emoji) {
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
}
