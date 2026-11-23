import * as THREE from 'three';

const CIELO = [
  [0, 0x0b1430, 0x1d2a55],
  [5, 0x101c42, 0x2a3566],
  [6.5, 0x5a6fb0, 0xf3a27a],
  [8, 0x7fc0ea, 0xcfeaf7],
  [17.5, 0x7fc0ea, 0xcfeaf7],
  [19.2, 0x6a7fc4, 0xf49a6c],
  [20.6, 0x262a5a, 0x6b4f7a],
  [22, 0x0b1430, 0x1d2a55],
  [24, 0x0b1430, 0x1d2a55]
];

const LUZ = [
  [0, 0.55, 0x8ea0d8, 0.3, 0xaab8ff, 0x2b2b45, 0x1c1c30],
  [5.5, 0.6, 0x8ea0d8, 0.3, 0xaab8ff, 0x2b2b45, 0x1c1c30],
  [7, 1.2, 0xffd9c0, 1.1, 0xffb07a, 0xf6e3d6, 0xe8cdb8],
  [9, 1.5, 0xfff4e6, 1.7, 0xfff0dd, 0xfbf3ea, 0xf3e6d6],
  [17.5, 1.5, 0xfff4e6, 1.7, 0xfff0dd, 0xfbf3ea, 0xf3e6d6],
  [19.5, 1.15, 0xffc9a8, 1.1, 0xffa070, 0xf3d9c6, 0xdcbca6],
  [21, 0.65, 0x9aa6dc, 0.35, 0xaab8ff, 0x34324f, 0x22213a],
  [24, 0.55, 0x8ea0d8, 0.3, 0xaab8ff, 0x2b2b45, 0x1c1c30]
];

const ICONOS_CLIMA = { sol: '☀️', nubes: '⛅', lluvia: '🌧️', nieve: '❄️', luna: '🌙', nubesNoche: '☁️' };

function mezclar(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

function tramo(tabla, h) {
  for (let i = 0; i < tabla.length - 1; i++) {
    if (h >= tabla[i][0] && h <= tabla[i + 1][0]) {
      const t = (h - tabla[i][0]) / (tabla[i + 1][0] - tabla[i][0]);
      return [tabla[i], tabla[i + 1], t * t * (3 - 2 * t)];
    }
  }
  return [tabla[0], tabla[0], 0];
}

function azar(semilla) {
  let x = 0;
  for (const c of semilla) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5; x >>>= 0;
  return (x % 10000) / 10000;
}

export function temporada(fecha = new Date(), aniversario = null) {
  const m = fecha.getMonth() + 1;
  const d = fecha.getDate();
  if (aniversario) {
    const [am, ad] = aniversario.split('-').slice(1).map(Number);
    if (am === m && Math.abs(ad - d) <= 1) return 'aniversario';
  }
  if ((m === 10 && d >= 20) || (m === 11 && d <= 2)) return 'halloween';
  if ((m === 12 && d >= 10) || (m === 1 && d <= 6)) return 'navidad';
  if (m === 2 && d >= 7 && d <= 15) return 'sanvalentin';
  return null;
}

export const NOMBRE_TEMPORADA = {
  halloween: '🎃 Halloween',
  navidad: '🎄 Navidad',
  sanvalentin: '💘 San Valentín',
  aniversario: '💍 Vuestro aniversario'
};

export class Ambiente {
  constructor(sala, renderer) {
    this.sala = sala;
    this.renderer = renderer;
    const params = new URLSearchParams(location.search);
    this.horaFija = params.has('hora') ? Number(params.get('hora')) : null;
    this.climaFijo = params.get('clima');
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = 128;
    this.lienzo.height = 256;
    this.ctx = this.lienzo.getContext('2d');
    this.textura = new THREE.CanvasTexture(this.lienzo);
    this.textura.colorSpace = THREE.SRGBColorSpace;
    const cielo = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.2), new THREE.MeshBasicMaterial({ map: this.textura, toneMapped: false }));
    cielo.position.z = -0.002;
    sala.ventana.add(cielo);
    sala.matCristal.opacity = 0.32;
    this.gotas = Array.from({ length: 40 }, () => ({ x: Math.random() * 128, y: Math.random() * 256, v: 0.7 + Math.random() * 0.6 }));
    this.estrellas = Array.from({ length: 30 }, () => ({ x: Math.random() * 128, y: Math.random() * 170, f: Math.random() * 6 }));
    this.nubes = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * 160 - 20, y: 30 + i * 38 + Math.random() * 20, s: 0.6 + Math.random() * 0.6 }));
    this.t = 0;
    this.tDibujo = 1;
    this.hora = 12;
    this.clima = 'sol';
    this.calcular();
  }

  horaActual() {
    if (this.horaFija !== null) return this.horaFija;
    const d = new Date();
    return d.getHours() + d.getMinutes() / 60;
  }

  esNoche() {
    return this.hora >= 21 || this.hora < 6.5;
  }

  calcularClima() {
    if (this.climaFijo) return this.climaFijo;
    const d = new Date();
    const r = azar(`${d.toDateString()}-${Math.floor(d.getHours() / 4)}`);
    const invierno = [12, 1, 2].includes(d.getMonth() + 1);
    if (r < 0.22) return invierno && azar(d.toDateString()) < 0.6 ? 'nieve' : 'lluvia';
    if (r < 0.5) return 'nubes';
    return 'sol';
  }

  calcular() {
    this.hora = this.horaActual();
    this.clima = this.calcularClima();
    const h = this.hora;
    const [a, b, t] = tramo(LUZ, h);
    let gris = this.clima === 'lluvia' || this.clima === 'nieve' ? 0.82 : this.clima === 'nubes' ? 0.92 : 1;
    if (this.apagon) gris *= 0.5;
    const tardisimo = h >= 23.5 || h < 6;
    if (tardisimo) gris *= 0.85;
    this.sala.hemi.intensity = (a[1] + (b[1] - a[1]) * t) * (0.94 + 0.06 * gris);
    this.sala.hemi.color.copy(mezclar(a[2], b[2], t));
    this.sala.sol.intensity = (a[3] + (b[3] - a[3]) * t) * gris;
    this.sala.sol.color.copy(mezclar(a[4], b[4], t));
    const ang = ((h - 6) / 12) * Math.PI;
    const dia = h >= 6 && h <= 18;
    this.sala.sol.position.set(Math.cos(dia ? ang : 0.6) * 8, dia ? 6 + Math.sin(ang) * 5 : 9, 4);
    const fondoA = mezclar(a[5], b[5], t);
    const fondoB = mezclar(a[6], b[6], t);
    document.body.style.background = `radial-gradient(circle at 50% 40%, #${fondoA.getHexString()} 0%, #${fondoB.getHexString()} 70%)`;
    document.body.classList.toggle('noche', this.esNoche());
    const [c1, c2, tc] = tramo(CIELO, h);
    this.cieloArriba = mezclar(c1[1], c2[1], tc);
    this.cieloAbajo = mezclar(c1[2], c2[2], tc);
    if (gris < 1) {
      const g = new THREE.Color(0x8a93a0);
      this.cieloArriba.lerp(g, (1 - gris) * 2.5);
      this.cieloAbajo.lerp(g, (1 - gris) * 2.5);
    }
    this.sala.matCristal.color.copy(this.cieloAbajo).lerp(new THREE.Color(0xffffff), 0.5);
    this.sala.matCristal.emissive.copy(this.cieloAbajo);
    this.sala.matCristal.emissiveIntensity = this.esNoche() ? 0.15 : 0.35;
  }

  icono() {
    if (this.clima === 'lluvia' || this.clima === 'nieve') return ICONOS_CLIMA[this.clima];
    if (this.esNoche()) return this.clima === 'nubes' ? ICONOS_CLIMA.nubesNoche : ICONOS_CLIMA.luna;
    return ICONOS_CLIMA[this.clima];
  }

  textoHora() {
    const h = Math.floor(this.hora) % 24;
    const m = Math.floor((this.hora % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  dibujar() {
    const c = this.ctx;
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, `#${this.cieloArriba.getHexString()}`);
    g.addColorStop(1, `#${this.cieloAbajo.getHexString()}`);
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 256);
    const noche = this.esNoche();
    if (noche && this.clima !== 'lluvia') {
      for (const e of this.estrellas) {
        c.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 2 + e.f);
        c.fillStyle = '#fff8e0';
        c.fillRect(e.x, e.y, 2, 2);
      }
      c.globalAlpha = 1;
      if (this.clima === 'sol') {
        c.fillStyle = '#fff4c8';
        c.beginPath(); c.arc(88, 50, 14, 0, Math.PI * 2); c.fill();
        c.fillStyle = `#${this.cieloArriba.getHexString()}`;
        c.beginPath(); c.arc(95, 45, 12, 0, Math.PI * 2); c.fill();
      }
    } else if (this.clima === 'sol') {
      const y = 40 + Math.abs(this.hora - 13) * 10;
      c.fillStyle = 'rgba(255, 236, 150, .35)';
      c.beginPath(); c.arc(40, y, 26, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffe58a';
      c.beginPath(); c.arc(40, y, 16, 0, Math.PI * 2); c.fill();
    }
    this.dibujarVista(c, noche);
    if (this.clima !== 'sol') {
      const oscuro = this.clima === 'nubes' ? 1 : 0.75;
      for (const n of this.nubes) {
        n.x += 0.08 * n.s;
        if (n.x > 150) n.x = -40;
        c.fillStyle = noche ? `rgba(90, 95, 120, .9)` : `rgba(${Math.round(255 * oscuro)}, ${Math.round(255 * oscuro)}, ${Math.round(255 * oscuro)}, .95)`;
        for (const [dx, dy, r] of [[0, 0, 16], [16, -6, 18], [32, 0, 14], [14, 6, 14]]) {
          c.beginPath(); c.arc(n.x + dx * n.s, n.y + dy * n.s, r * n.s, 0, Math.PI * 2); c.fill();
        }
      }
    }
    if (this.clima === 'lluvia') {
      c.strokeStyle = 'rgba(210, 230, 255, .75)';
      c.lineWidth = 1.5;
      for (const d of this.gotas) {
        d.y += 9 * d.v;
        d.x -= 1.5 * d.v;
        if (d.y > 256) { d.y = -10; d.x = Math.random() * 140; }
        c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x - 3, d.y + 12); c.stroke();
      }
    } else if (this.clima === 'nieve') {
      c.fillStyle = 'rgba(255, 255, 255, .95)';
      for (const d of this.gotas) {
        d.y += 1.6 * d.v;
        d.x += Math.sin(this.t * 2 + d.v * 10) * 0.6;
        if (d.y > 256) { d.y = -6; d.x = Math.random() * 128; }
        c.beginPath(); c.arc(d.x, d.y, 2.2 * d.v, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#f4f8fb';
      c.fillRect(0, 238, 128, 18);
    }
    this.textura.needsUpdate = true;
  }

  dibujarVista(c, noche) {
    const v = this.vista || 'calle';
    if (!this.paseantes) {
      this.paseantes = Array.from({ length: 3 }, (_, i) => ({ x: Math.random() * 128, v: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.25), color: ['#e05050', '#5a9fd6', '#f2d06b', '#b39ddb'][i % 4], fase: Math.random() * 6 }));
      this.coches = [{ x: -40, v: 1.4, color: '#5a9fd6' }];
      this.edificios = Array.from({ length: 6 }, (_, i) => ({ x: i * 24 - 6, w: 20 + (i % 3) * 3, h: 80 + ((i * 37) % 60), color: ['#c9a98a', '#b8c4cc', '#d8b4a0', '#a9b8a0'][i % 4] }));
    }
    const suelo = 226;
    if (v === 'calle' || v === 'tejados') {
      for (const e of this.edificios) {
        const h = v === 'tejados' ? e.h * 0.55 + 30 : e.h;
        const y = (v === 'tejados' ? 200 : suelo) - h;
        c.fillStyle = noche ? '#2e2c44' : e.color;
        c.fillRect(e.x, y, e.w, h);
        for (let fy = y + 6; fy < y + h - 8; fy += 12) {
          for (let fx = e.x + 3; fx < e.x + e.w - 4; fx += 7) {
            const encendida = noche && ((fx * 7 + fy * 3) % 5 < 2);
            c.fillStyle = encendida ? '#ffd98a' : noche ? '#3a3858' : 'rgba(255,255,255,.55)';
            c.fillRect(fx, fy, 4, 6);
          }
        }
        if (v === 'tejados') {
          c.fillStyle = noche ? '#3a2e3a' : '#b0624a';
          c.beginPath(); c.moveTo(e.x - 2, y); c.lineTo(e.x + e.w / 2, y - 10); c.lineTo(e.x + e.w + 2, y); c.fill();
        }
      }
      if (v === 'calle') {
        c.fillStyle = noche ? '#3a3a48' : '#9a9a9a';
        c.fillRect(0, suelo, 128, 30);
        c.fillStyle = noche ? '#5a5a68' : '#c8c2b8';
        c.fillRect(0, suelo, 128, 6);
        for (const p of this.paseantes) {
          p.x += p.v;
          if (p.x > 140) p.x = -12;
          if (p.x < -12) p.x = 140;
          const paso = Math.sin(this.t * 6 + p.fase) * 1.5;
          c.fillStyle = p.color;
          c.fillRect(p.x - 3, suelo - 16, 6, 10);
          c.fillStyle = '#f2cdb4';
          c.beginPath(); c.arc(p.x, suelo - 19, 3, 0, 7); c.fill();
          c.fillStyle = '#3b2f26';
          c.fillRect(p.x - 3 + paso, suelo - 6, 2, 6);
          c.fillRect(p.x + 1 - paso, suelo - 6, 2, 6);
        }
        for (const k of this.coches) {
          k.x += k.v;
          if (k.x > 180) {
            k.x = -60 - Math.random() * 120;
            k.color = this.furgoneta ? '#f7f3e8' : ['#5a9fd6', '#e05050', '#6cc08a', '#f2d06b'][Math.floor(Math.random() * 4)];
          }
          c.fillStyle = k.color;
          c.fillRect(k.x, suelo + 10, 34, 10);
          c.fillRect(k.x + 6, suelo + 3, 20, 8);
          c.fillStyle = noche ? '#ffe7a0' : '#cfe8f2';
          c.fillRect(k.x + 8, suelo + 5, 7, 5);
          c.fillRect(k.x + 17, suelo + 5, 7, 5);
          c.fillStyle = '#222';
          c.beginPath(); c.arc(k.x + 8, suelo + 21, 3.5, 0, 7); c.arc(k.x + 26, suelo + 21, 3.5, 0, 7); c.fill();
        }
      }
    } else {
      const verde = noche ? '#24402e' : v === 'colinas' ? '#8cc27a' : '#7cb35a';
      if (v === 'colinas') {
        c.fillStyle = noche ? '#2c3a4a' : '#a8c8b0';
        c.beginPath(); c.moveTo(0, 190); c.quadraticCurveTo(40, 140, 80, 180); c.quadraticCurveTo(110, 150, 128, 175); c.lineTo(128, 256); c.lineTo(0, 256); c.fill();
        c.fillStyle = noche ? '#3a5a7a' : '#9fd3f0';
        c.fillRect(0, 205, 128, 10);
      }
      c.fillStyle = verde;
      c.fillRect(0, suelo - 6, 128, 40);
      for (let k = 0; k < 4; k++) {
        const x = 12 + k * 32;
        c.fillStyle = noche ? '#3a2e24' : '#7a5a3a';
        c.fillRect(x - 2, suelo - 30, 4, 26);
        c.fillStyle = noche ? '#1e3a28' : ['#5a9e4b', '#6db35a', '#4a8a3c'][k % 3];
        c.beginPath(); c.arc(x, suelo - 36, 12, 0, 7); c.fill();
      }
      if (v === 'jardin') {
        c.fillStyle = noche ? '#8a8478' : '#f2efe9';
        for (let x = 0; x < 128; x += 6) c.fillRect(x, suelo - 4, 3, 12);
        c.fillRect(0, suelo, 128, 2);
      }
      if (!noche && this.clima === 'sol') {
        const x = (this.t * 12) % 160 - 16;
        c.fillStyle = '#3b2f26';
        c.beginPath(); c.moveTo(x, 70); c.lineTo(x + 5, 74); c.lineTo(x + 10, 70); c.stroke();
        c.strokeStyle = '#3b2f26';
        c.beginPath(); c.moveTo(x, 70); c.quadraticCurveTo(x + 2.5, 66, x + 5, 70); c.quadraticCurveTo(x + 7.5, 66, x + 10, 70); c.stroke();
      }
    }
  }

  actualizar(dt) {
    this.t += dt;
    this.tCalculo = (this.tCalculo || 0) + dt;
    if (this.tCalculo > 20) {
      this.tCalculo = 0;
      this.calcular();
    }
    this.tDibujo += dt;
    if (this.tDibujo > 1 / 15) {
      this.tDibujo = 0;
      this.dibujar();
    }
  }
}
