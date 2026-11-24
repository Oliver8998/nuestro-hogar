import { CATALOGO, MATERIALES } from './catalogo.js';

export const COSTE_TIRADA = 240;

export const SEGMENTOS = [
  { tipo: 'monedas', cantidad: 20, peso: 20, color: '#f7e2a0' },
  { tipo: 'item', rareza: 'raro', peso: 15, color: '#cfe0f7' },
  { tipo: 'ticket', cantidad: 1, peso: 12, color: '#f8d3da' },
  { tipo: 'item', rareza: 'comun', peso: 20, color: '#e6ebef' },
  { tipo: 'monedas', cantidad: 60, peso: 8, color: '#f2d06b' },
  { tipo: 'item', rareza: 'epico', peso: 7, color: '#e3d0f5' },
  { tipo: 'monedas', cantidad: 10, peso: 15, color: '#faefcf' },
  { tipo: 'item', rareza: 'legendario', peso: 3, color: '#ffe0a3' }
];

const COMUNES = ['pintura-crema', 'pintura-rosa', 'pintura-azul', 'pintura-verde', 'pintura-amarilla', 'pintura-lila', 'pienso', 'chuches', 'pelota', 'cactus', 'jarron', 'libros'];

export function poolDe(rareza) {
  if (rareza === 'comun') return COMUNES;
  return [...CATALOGO, ...MATERIALES].filter(d => d.rareza === rareza).map(d => d.id);
}

export const PIEZAS_PREMIO = {
  monedas: [
    [0.3, 0.06, 0.3, 0, 0.03, 0, 0xf2c84b, 'cil', { metal: 0.5, rugosidad: 0.35 }],
    [0.3, 0.06, 0.3, 0.02, 0.09, 0.01, 0xf7d65e, 'cil', { metal: 0.5, rugosidad: 0.35 }],
    [0.3, 0.06, 0.3, -0.01, 0.15, -0.01, 0xf2c84b, 'cil', { metal: 0.5, rugosidad: 0.35 }],
    [0.3, 0.06, 0.3, 0.12, 0.15, 0.2, 0xf7d65e, 'cil', { metal: 0.5, rugosidad: 0.35, rx: 1.2 }]
  ],
  ticket: [
    [0.5, 0.04, 0.28, 0, 0.02, 0, 0xf28aa0],
    [0.04, 0.045, 0.28, 0.12, 0.022, 0, 0xf0eae1],
    [0.12, 0.05, 0.12, -0.08, 0.025, 0, 0xffe08a, 'cil']
  ],
  regalo: color => [
    [0.4, 0.34, 0.4, 0, 0.17, 0, color],
    [0.44, 0.08, 0.44, 0, 0.36, 0, color],
    [0.08, 0.42, 0.42, 0, 0.21, 0, 0xf0eae1],
    [0.42, 0.42, 0.08, 0, 0.21, 0, 0xf0eae1],
    [0.12, 0.1, 0.06, -0.06, 0.44, 0, 0xf0eae1, 'esfera', { rz: 0.5 }],
    [0.12, 0.1, 0.06, 0.06, 0.44, 0, 0xf0eae1, 'esfera', { rz: -0.5 }]
  ]
};

export const COLOR_REGALO = { comun: 0x9aa5b1, raro: 0x4f8fe0, epico: 0xa35ee0, legendario: 0xf0a020 };

export function elegirSegmento() {
  const total = SEGMENTOS.reduce((s, x) => s + x.peso, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTOS.length; i++) {
    r -= SEGMENTOS[i].peso;
    if (r <= 0) return i;
  }
  return 0;
}

export function resolverPremio(indice) {
  const s = SEGMENTOS[indice];
  if (s.tipo !== 'item') return { ...s };
  const pool = poolDe(s.rareza);
  return { tipo: 'item', rareza: s.rareza, id: pool[Math.floor(Math.random() * pool.length)] };
}
