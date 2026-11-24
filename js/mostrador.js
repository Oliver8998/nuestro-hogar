import { CATALOGO } from './catalogo.js';
import { ESPECIES } from './mascotas.js';

const DIA = 86400000;
const DIAS_CAMBIO = 2;

function generador(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(lista, r) {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

function diaLocal(t = Date.now()) {
  return Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / DIA);
}

export function periodoMostrador(t = Date.now()) {
  return Math.floor(diaLocal(t) / DIAS_CAMBIO);
}

export function msHastaCambio(t = Date.now()) {
  const sig = (periodoMostrador(t) + 1) * DIAS_CAMBIO;
  const inicioLocal = sig * DIA;
  const offset = new Date(t).getTimezoneOffset() * 60000;
  return Math.max(0, inicioLocal + offset - t);
}

export function textoCambio(t = Date.now()) {
  const ms = msHastaCambio(t);
  const h = Math.ceil(ms / 3600000);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  return `${Math.max(1, h)} h`;
}

export function mostradorActual({ puede = d => !d.nivel, imprescindibles = [] } = {}) {
  const periodo = periodoMostrador();
  const r = generador(periodo * 7919 + 13);
  const disponibles = CATALOGO.filter(d => d.enTienda !== false && !d.temporada && puede(d));
  const de = cat => barajar(disponibles.filter(d => d.categoria === cat), r);
  const muebles = de('muebles');
  const deco = de('deco');
  const utiles = barajar([...de('mascotas'), ...de('limpieza')], r);
  const exterior = de('exterior');
  const elegidos = [];
  const coger = (lista, n) => {
    for (const d of lista) {
      if (n <= 0) break;
      if (elegidos.includes(d)) continue;
      elegidos.push(d);
      n--;
    }
  };
  coger(muebles, 3);
  coger(deco, 2);
  coger(utiles, 1);
  if (exterior.length) coger(exterior, 1);
  else coger(barajar([...muebles, ...deco], r), 1);
  for (const id of imprescindibles) {
    const d = disponibles.find(x => x.id === id);
    if (!d || elegidos.includes(d)) continue;
    const k = elegidos.findIndex(x => x.categoria === d.categoria);
    elegidos[k >= 0 ? k : elegidos.length - 1] = d;
  }
  const oferta = Math.floor(r() * elegidos.length);
  const items = elegidos.map((d, i) => ({ id: d.id, precio: i === oferta ? Math.round(d.precio * 0.7) : d.precio, oferta: i === oferta }));
  const especies = Object.keys(ESPECIES).filter(id => !ESPECIES[id].exclusivo);
  const mascota = especies[Math.floor(generador(periodo * 104729 + 7)() * especies.length)];
  return { periodo, items, mascota, cambia: textoCambio() };
}
