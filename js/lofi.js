import { audio } from './sonido.js';

const ESTILOS = {
  manana: { bpm: 84, corte: 2600, acordes: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], escala: [72, 74, 76, 79, 81, 84], hat: 0.5, melodia: 0.38 },
  tarde: { bpm: 76, corte: 1900, acordes: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 64], [48, 52, 55, 62]], escala: [69, 72, 74, 76, 79, 81], hat: 0.4, melodia: 0.3 },
  noche: { bpm: 66, corte: 1200, acordes: [[57, 60, 64, 71], [53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 64]], escala: [69, 71, 72, 76, 79], hat: 0, melodia: 0.22 }
};

function hz(n) {
  return 440 * 2 ** ((n - 69) / 12);
}

export class Lofi {
  constructor(sonido) {
    this.sonido = sonido;
    try {
      this.activo = localStorage.getItem('hogar-lofi') !== 'no';
    } catch (e) {
      this.activo = true;
    }
    this.volumen = 1;
    try {
      const v = parseFloat(localStorage.getItem('hogar-vol-musica'));
      if (!isNaN(v)) this.volumen = Math.max(0, Math.min(1, v));
    } catch (e) {}
    this.c = null;
    this.paso = 0;
    this.siguiente = 0;
    this.silencio = false;
    this.estilo = 'tarde';
  }

  alternar() {
    this.activo = !this.activo;
    try {
      localStorage.setItem('hogar-lofi', this.activo ? 'si' : 'no');
    } catch (e) {}
    if (!this.activo && this.master) this.master.gain.setTargetAtTime(0, this.c.currentTime, 0.3);
    return this.activo;
  }

  ponerVolumen(v) {
    this.volumen = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem('hogar-vol-musica', String(this.volumen));
    } catch (e) {}
  }

  montar() {
    const c = audio();
    if (!c) return false;
    this.c = c;
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.filtro = c.createBiquadFilter();
    this.filtro.type = 'lowpass';
    this.filtro.frequency.value = 1900;
    this.filtro.Q.value = 0.6;
    this.eco = c.createDelay(1);
    this.eco.delayTime.value = 0.33;
    const fb = c.createGain();
    fb.gain.value = 0.28;
    const ecoVol = c.createGain();
    ecoVol.gain.value = 0.25;
    this.bus = c.createGain();
    this.bus.connect(this.filtro);
    this.bus.connect(this.eco);
    this.eco.connect(fb).connect(this.eco);
    this.eco.connect(ecoVol).connect(this.filtro);
    this.filtro.connect(this.master).connect(c.destination);
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.ruidoBuf = buf;
    const siseo = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const sd = siseo.getChannelData(0);
    let previo = 0;
    for (let i = 0; i < sd.length; i++) {
      previo = previo * 0.97 + (Math.random() * 2 - 1) * 0.03;
      sd[i] = previo;
    }
    const fundido = 2000;
    for (let i = 0; i < fundido; i++) {
      const k = i / fundido;
      sd[i] *= k;
      sd[sd.length - 1 - i] *= k;
    }
    const vinilo = c.createBufferSource();
    vinilo.buffer = siseo;
    vinilo.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    const vv = c.createGain();
    vv.gain.value = 0.12;
    vinilo.connect(lp).connect(vv).connect(this.master);
    vinilo.start();
    this.siguiente = c.currentTime + 0.1;
    return true;
  }

  nota(freq, t, dur, { tipo = 'sine', vol = 0.05, ataque = 0.01, detune = 0 } = {}) {
    const c = this.c;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  golpe(t, tipo) {
    const c = this.c;
    if (tipo === 'bombo') {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(this.estilo === 'noche' ? 0.22 : 0.32, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(this.filtro);
      o.start(t);
      o.stop(t + 0.35);
      return;
    }
    const src = c.createBufferSource();
    src.buffer = this.ruidoBuf;
    const f = c.createBiquadFilter();
    f.type = tipo === 'caja' ? 'bandpass' : 'highpass';
    f.frequency.value = tipo === 'caja' ? 1800 : 7000;
    const g = c.createGain();
    const vol = tipo === 'caja' ? 0.13 : 0.03;
    const dur = tipo === 'caja' ? 0.16 : 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.filtro);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  programar(t) {
    const e = ESTILOS[this.estilo];
    const corchea = 60 / e.bpm / 2;
    const paso = this.paso % 8;
    const compas = Math.floor(this.paso / 8) % e.acordes.length;
    const acorde = e.acordes[compas];
    const swing = paso % 2 ? corchea * 0.12 : 0;
    const tt = t + swing;
    if (paso === 0) {
      acorde.forEach((n, i) => {
        this.nota(hz(n), tt + i * 0.015, corchea * 8.4, { tipo: 'triangle', vol: 0.026, ataque: 0.25, detune: (i % 2 ? 6 : -6) });
        this.nota(hz(n), tt + i * 0.015, corchea * 8.4, { tipo: 'sine', vol: 0.02, ataque: 0.3 });
      });
    }
    if (paso === 0 || paso === 5) this.nota(hz(acorde[0] - 12), tt, corchea * 2.6, { tipo: 'sine', vol: 0.09, ataque: 0.02 });
    if (paso === 3 && Math.random() < 0.5) this.nota(hz(acorde[2] - 12), tt, corchea * 1.4, { tipo: 'sine', vol: 0.06, ataque: 0.02 });
    if (Math.random() < e.melodia) {
      const n = e.escala[Math.floor(Math.random() * e.escala.length)];
      this.nota(hz(n), tt, corchea * (1.5 + Math.random() * 2), { tipo: 'sine', vol: 0.035, ataque: 0.008 });
      this.nota(hz(n) * 2, tt, corchea * 0.8, { tipo: 'sine', vol: 0.006, ataque: 0.005 });
    }
    if (paso === 0 || (paso === 3 && Math.random() < 0.4) || paso === 4) this.golpe(tt, 'bombo');
    if (paso === 2 || paso === 6) this.golpe(tt, 'caja');
    if (e.hat && paso % 2 === 1 && Math.random() < e.hat + 0.4) this.golpe(tt, 'hat');
    this.paso++;
    return corchea;
  }

  actualizar(hora, silenciar) {
    if (!this.activo || !this.sonido.activo) {
      if (this.master && this.master.gain.value > 0.001) this.master.gain.setTargetAtTime(0, this.c.currentTime, 0.3);
      return;
    }
    if (!this.c && !this.montar()) return;
    const c = this.c;
    if (c.state === 'suspended') return;
    this.estilo = hora >= 7 && hora < 13 ? 'manana' : hora >= 13 && hora < 20 ? 'tarde' : 'noche';
    const objetivo = silenciar || document.hidden ? 0 : 0.5 * this.volumen;
    this.master.gain.setTargetAtTime(objetivo, c.currentTime, 0.6);
    this.filtro.frequency.setTargetAtTime(ESTILOS[this.estilo].corte, c.currentTime, 2);
    if (this.siguiente < c.currentTime - 0.5) this.siguiente = c.currentTime + 0.05;
    while (this.siguiente < c.currentTime + 0.25) this.siguiente += this.programar(this.siguiente);
  }

  nombreEstilo() {
    return { manana: 'Mañana tranquila ☀️', tarde: 'Tarde de sofá 🌤️', noche: 'Noche suave 🌙' }[this.estilo];
  }
}
