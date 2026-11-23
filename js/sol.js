const ZONAS = {
  'Europe/Madrid': [40.4, -3.7], 'Atlantic/Canary': [28.1, -15.4], 'Africa/Ceuta': [35.9, -5.3], 'Europe/Lisbon': [38.7, -9.1],
  'Europe/London': [51.5, -0.1], 'Europe/Paris': [48.9, 2.35], 'Europe/Berlin': [52.5, 13.4], 'Europe/Rome': [41.9, 12.5],
  'Europe/Amsterdam': [52.4, 4.9], 'Europe/Brussels': [50.8, 4.35], 'Europe/Zurich': [47.4, 8.5], 'Europe/Dublin': [53.3, -6.3],
  'America/Mexico_City': [19.4, -99.1], 'America/Bogota': [4.7, -74.1], 'America/Argentina/Buenos_Aires': [-34.6, -58.4],
  'America/Santiago': [-33.4, -70.6], 'America/Lima': [-12, -77], 'America/Caracas': [10.5, -66.9], 'America/Guayaquil': [-2.2, -79.9],
  'America/Montevideo': [-34.9, -56.2], 'America/New_York': [40.7, -74], 'America/Chicago': [41.9, -87.6], 'America/Los_Angeles': [34, -118.2]
};

function zona() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
}

export function ubicacion(fecha = new Date()) {
  const z = zona();
  if (z && ZONAS[z]) return ZONAS[z];
  return [40, -fecha.getTimezoneOffset() / 4];
}

const cache = new Map();

export function solDelDia(fecha = new Date()) {
  const clave = fecha.toDateString();
  if (cache.has(clave)) return cache.get(clave);
  const [lat, lon] = ubicacion(fecha);
  const r = Math.PI / 180;
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const n = Math.floor((fecha - inicio) / 86400000);
  const g = 2 * Math.PI / 365 * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  let c = Math.cos(90.833 * r) / (Math.cos(lat * r) * Math.cos(decl)) - Math.tan(lat * r) * Math.tan(decl);
  c = Math.max(-1, Math.min(1, c));
  const ha = Math.acos(c) / r;
  const mediodia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12);
  const desfase = -mediodia.getTimezoneOffset();
  const local = m => ((m + desfase) / 60 + 48) % 24;
  let amanecer = local(720 - 4 * (lon + ha) - eq);
  let atardecer = local(720 - 4 * (lon - ha) - eq);
  if (!(atardecer > amanecer + 2)) {
    amanecer = 7;
    atardecer = 19;
  }
  const res = { amanecer, atardecer };
  cache.set(clave, res);
  return res;
}

export function horaReal(fecha = new Date()) {
  return fecha.getHours() + fecha.getMinutes() / 60 + fecha.getSeconds() / 3600;
}

export function horaSolar(fecha = new Date()) {
  const { amanecer: A, atardecer: S } = solDelDia(fecha);
  const h = horaReal(fecha);
  const anclas = [[0, 0], [A - 1, 5.5], [A, 7], [S, 19.3], [Math.min(23.5, S + 1.25), 21.2], [24, 24]];
  for (let i = 0; i < anclas.length - 1; i++) {
    const [r0, c0] = anclas[i];
    const [r1, c1] = anclas[i + 1];
    if (h >= r0 && h <= r1) return c0 + (h - r0) / (r1 - r0) * (c1 - c0);
  }
  return h;
}

export function periodoSolar(fecha = new Date()) {
  const { amanecer: A, atardecer: S } = solDelDia(fecha);
  const h = horaReal(fecha);
  if (h < A - 0.5 || h > S + 0.75) return 'noche';
  if (h < A + 0.8 || h > S - 1) return 'tarde';
  return 'dia';
}
