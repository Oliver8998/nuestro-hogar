let ctx = null;
let activo = true;

try {
  activo = localStorage.getItem('hogar-sonido') !== 'no';
} catch (e) {}

let volEfectos = 1;
try {
  const v = parseFloat(localStorage.getItem('hogar-vol-efectos'));
  if (!isNaN(v)) volEfectos = Math.max(0, Math.min(1, v));
} catch (e) {}
let busEfectos = null;

function contexto() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    busEfectos = ctx.createGain();
    busEfectos.gain.value = volEfectos;
    busEfectos.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function nota(freq, inicio, duracion, { tipo = 'sine', volumen = 0.15, hasta = null } = {}) {
  const c = contexto();
  if (!c || !activo || volEfectos <= 0.001) return;
  const t = c.currentTime + inicio;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volumen, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(g).connect(busEfectos);
  osc.start(t);
  osc.stop(t + duracion + 0.02);
}

let bufRuido = null;
function ruido(duracion, { volumen = 0.08, freq = 1800, q = 1, inicio = 0 } = {}) {
  const c = contexto();
  if (!c || !activo) return;
  if (!bufRuido) {
    bufRuido = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = bufRuido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + inicio;
  const src = c.createBufferSource();
  src.buffer = bufRuido;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(volumen, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  src.connect(f).connect(g).connect(busEfectos);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duracion + 0.02);
}

export function audio() {
  return contexto();
}

export const sonido = {
  ruido(duracion, op) {
    ruido(duracion, op);
  },
  chasquido() {
    ruido(0.04 + Math.random() * 0.05, { volumen: 0.05 + Math.random() * 0.06, freq: 1500 + Math.random() * 2500, q: 0.8 });
  },
  agua() {
    for (let k = 0; k < 4; k++) ruido(0.25, { volumen: 0.04, freq: 600 + k * 300, q: 2, inicio: k * 0.08 });
  },
  get activo() {
    return activo;
  },
  get volumen() {
    return volEfectos;
  },
  ponerVolumen(v) {
    volEfectos = Math.max(0, Math.min(1, v));
    try {
      localStorage.setItem('hogar-vol-efectos', String(volEfectos));
    } catch (e) {}
    if (busEfectos) busEfectos.gain.setTargetAtTime(volEfectos, ctx.currentTime, 0.05);
  },
  alternar() {
    activo = !activo;
    try {
      localStorage.setItem('hogar-sonido', activo ? 'si' : 'no');
    } catch (e) {}
    if (activo) this.pop();
    return activo;
  },
  desbloquear() {
    contexto();
  },
  tono(freq, inicio = 0, duracion = 0.3, op = {}) {
    nota(freq, inicio, duracion, op);
  },
  ahora() {
    const c = contexto();
    return c ? c.currentTime : 0;
  },
  pop() {
    nota(520, 0, 0.09, { tipo: 'triangle', hasta: 780, volumen: 0.12 });
  },
  tocar() {
    nota(660, 0, 0.06, { tipo: 'sine', volumen: 0.08 });
  },
  comprar() {
    nota(660, 0, 0.1, { tipo: 'triangle' });
    nota(990, 0.08, 0.16, { tipo: 'triangle' });
  },
  colocar() {
    nota(220, 0, 0.12, { tipo: 'sine', hasta: 140, volumen: 0.2 });
  },
  error() {
    nota(200, 0, 0.18, { tipo: 'square', hasta: 150, volumen: 0.05 });
  },
  arreglo() {
    [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.07, 0.18, { tipo: 'triangle', volumen: 0.1 }));
  },
  tic() {
    nota(1200, 0, 0.03, { tipo: 'square', volumen: 0.03 });
  },
  premio() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => nota(f, i * 0.09, 0.25, { tipo: 'triangle', volumen: 0.11 }));
  },
  claxon() {
    nota(392, 0, 0.14, { tipo: 'square', volumen: 0.05 });
    nota(392, 0.2, 0.22, { tipo: 'square', volumen: 0.05 });
  },
  mascota() {
    nota(880, 0, 0.08, { tipo: 'sine', hasta: 1200, volumen: 0.1 });
    nota(1100, 0.1, 0.1, { tipo: 'sine', hasta: 1400, volumen: 0.08 });
  }
};
