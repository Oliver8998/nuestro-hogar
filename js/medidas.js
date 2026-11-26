let W = 6;
let D = 6;

export function ponerMedidas(ancho, fondo) {
  W = ancho;
  D = fondo;
}

export function medidas() {
  return [W, D];
}

const eje = (v, mitad) => (Math.abs(v) <= 1 ? v : Math.sign(v) * Math.max(0.6, mitad - (3 - Math.abs(v))));

export function enSala(x, z) {
  return [eje(x, W / 2), eje(z, D / 2)];
}
