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
    const gris = this.clima === 'lluvia' || this.clima === 'nieve' ? 0.82 : this.clima === 'nubes' ? 0.92 : 1;
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
