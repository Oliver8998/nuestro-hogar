let ctx = null;
let activo = true;

try {
  activo = localStorage.getItem('hogar-sonido') !== 'no';
} catch (e) {}

function contexto() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function nota(freq, inicio, duracion, { tipo = 'sine', volumen = 0.15, hasta = null } = {}) {
  const c = contexto();
  if (!c || !activo) return;
  const t = c.currentTime + inicio;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + duracion);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volumen, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duracion + 0.02);
}

export const sonido = {
  get activo() {
    return activo;
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
