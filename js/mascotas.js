import * as THREE from 'three';
import { liberar } from './modelos.js';

export const ESPECIES = {
  hamster: { nombre: 'Hámster', precio: 120, texto: 'Pequeñito y siempre comiendo', color: 0xe8b878, secundario: 0xfff3e0, orejas: 'redondas', cola: null, tam: 0.6, velocidad: 0.45 },
  conejo: { nombre: 'Conejo', precio: 180, texto: 'Tranquilo y suave como una nube', color: 0xf2ede6, secundario: 0xf6c9d0, orejas: 'largas', cola: 'bola', tam: 0.85, velocidad: 0.6, salta: true },
  pato: { nombre: 'Pato', precio: 220, texto: 'Un poco ruidoso, muy divertido', ave: true, color: 0xf7d84a, secundario: 0xf7d84a, pico: 0xf08c2a, tam: 0.9, velocidad: 0.5 },
  gato: { nombre: 'Gato', precio: 250, texto: 'Independiente y mimoso a ratos', color: 0xf0a860, secundario: 0xfff3e0, orejas: 'punta', cola: 'larga', tam: 1, velocidad: 0.7, gato: true },
  perro: { nombre: 'Perro', precio: 350, texto: 'Leal, juguetón y siempre contento', color: 0xc9925a, secundario: 0xf5e6d0, orejas: 'caidas', cola: 'corta', tam: 1.15, velocidad: 0.85, perro: true },
  pinguino: { nombre: 'Pingüino', exclusivo: 'epico', texto: 'Elegante, aunque se resbala', ave: true, pinguino: true, color: 0x2b2b33, secundario: 0xffffff, pico: 0xf0a020, tam: 0.95, velocidad: 0.4 },
  cobaya: { nombre: 'Cobaya', precio: 160, texto: 'Hace ruiditos cuando está contenta', color: 0xe0a86a, secundario: 0xf8f2ea, orejas: 'redondas', cola: null, tam: 0.75, velocidad: 0.4 },
  tortuga: { nombre: 'Tortuga', precio: 200, texto: 'Lenta pero segura, vive muchísimo', color: 0x9cc46a, secundario: 0xd9e8b0, orejas: 'ninguna', cola: null, tam: 0.8, velocidad: 0.18, tortuga: true, caparazon: 0x7a5a3a },
  loro: { nombre: 'Loro', precio: 380, texto: 'Repite todo lo que oye por casa', ave: true, loro: true, color: 0x4caf50, secundario: 0xf2d06b, pico: 0x3d3d3d, tam: 0.85, velocidad: 0.5 },
  dragon: { nombre: 'Dragoncito', exclusivo: 'legendario', texto: 'Escupe fueguitos cuando se emociona', color: 0x8e6fd8, secundario: 0xf2c6e0, orejas: 'ninguna', cola: 'larga', tam: 1, velocidad: 0.65, dragon: true },
  zorro: { nombre: 'Zorrito', exclusivo: 'legendario', texto: 'Curioso y con una cola enorme', color: 0xe87a3a, secundario: 0xfff6ee, orejas: 'punta-grande', cola: 'esponjosa', tam: 1, velocidad: 0.8 }
};

const CELDA = 0.5;
const N = 12;

export const PERSONALIDADES = {
  dormilona: { nombre: 'Dormilona', icono: '😴', texto: 'Se cansa enseguida y adora sus siestas' },
  traviesa: { nombre: 'Traviesa', icono: '😼', texto: 'Le encanta tirar cosas al suelo' },
  glotona: { nombre: 'Glotona', icono: '🍖', texto: 'Siempre tiene hambre' },
  carinosa: { nombre: 'Cariñosa', icono: '🥰', texto: 'Casi nunca está triste' },
  juguetona: { nombre: 'Juguetona', icono: '🎾', texto: 'Quiere jugar a todas horas' }
};

export const ACCESORIOS = {
  lazo: 'Lazo',
  gorro: 'Gorrito',
  collar: 'Collar',
  gafas: 'Gafas de sol',
  corona: 'Corona'
};

function crearAccesorio(id) {
  const g = new THREE.Group();
  if (id === 'lazo') {
    const m = mat(0xe05070);
    for (const s of [-1, 1]) {
      const ala = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 10), m);
      ala.rotation.z = s * Math.PI / 2;
      ala.position.x = s * 0.035;
      g.add(ala);
    }
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), m));
    g.position.set(0.05, 0.085, 0.02);
    g.rotation.z = -0.3;
  } else if (id === 'gorro') {
    const cono = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.13, 16), mat(0xd23c3c));
    cono.position.y = 0.06;
    const borde = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 8, 18), mat(0xf7f4ef));
    borde.rotation.x = Math.PI / 2;
    const pompon = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat(0xf7f4ef));
    pompon.position.y = 0.13;
    g.add(cono, borde, pompon);
    g.position.set(0, 0.08, -0.01);
    g.rotation.z = 0.25;
  } else if (id === 'collar') {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 8, 20), mat(0x4f81bd));
    t.rotation.x = Math.PI / 2;
    const placa = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 12), mat(0xf2c84b, { metalness: 0.6, roughness: 0.3 }));
    placa.rotation.x = Math.PI / 2;
    placa.position.set(0, -0.015, 0.09);
    g.add(t, placa);
    g.position.set(0, -0.08, 0);
  } else if (id === 'gafas') {
    const m = mat(0x1e1e1e, { roughness: 0.3 });
    for (const s of [-1, 1]) {
      const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 14), m);
      lente.rotation.x = Math.PI / 2;
      lente.position.set(s * 0.05, 0, 0);
      g.add(lente);
    }
    const puente = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), m);
    g.add(puente);
    g.position.set(0, 0.025, 0.1);
  } else if (id === 'corona') {
    const m = mat(0xf2c84b, { metalness: 0.6, roughness: 0.3 });
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.035, 14, 1, true), m);
    aro.material.side = THREE.DoubleSide;
    g.add(aro);
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2;
      const pico = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 6), m);
      pico.position.set(Math.cos(a) * 0.055, 0.035, Math.sin(a) * 0.055);
      g.add(pico);
    }
    const gema = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat(0xe05070));
    gema.position.set(0, 0, 0.06);
    g.add(gema);
    g.position.set(0, 0.095, 0);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
}

function esfera(sx, sy, sz, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), mat(color));
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export function crearModeloMascota(especieId) {
  const e = ESPECIES[especieId];
  const raiz = new THREE.Group();
  const cuerpoGrupo = new THREE.Group();
  raiz.add(cuerpoGrupo);
  const partes = { raiz, cuerpoGrupo, patas: [], ojos: [], alas: [], cola: null, cabeza: null };
  const oscuro = new THREE.Color(e.color).multiplyScalar(0.75).getHex();

  if (e.ave) {
    if (e.pinguino) {
      cuerpoGrupo.add(esfera(0.24, 0.36, 0.24, e.color, 0, 0.24, 0));
      cuerpoGrupo.add(esfera(0.18, 0.3, 0.1, e.secundario, 0, 0.22, 0.08));
    } else {
      cuerpoGrupo.add(esfera(0.24, 0.22, 0.3, e.color, 0, 0.18, 0));
      const colaPato = esfera(0.1, 0.08, 0.1, e.color, 0, 0.24, -0.15);
      cuerpoGrupo.add(colaPato);
    }
    const cabeza = new THREE.Group();
    cabeza.position.set(0, e.pinguino ? 0.44 : 0.36, e.pinguino ? 0.02 : 0.1);
    cabeza.add(esfera(0.17, 0.17, 0.17, e.color, 0, 0, 0));
    if (e.pinguino) cabeza.add(esfera(0.12, 0.1, 0.06, e.secundario, 0, -0.01, 0.06));
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 12), mat(e.pico));
    pico.rotation.x = Math.PI / 2;
    pico.position.set(0, -0.01, 0.11);
    if (!e.pinguino) pico.scale.set(1.4, 1, 0.6);
    cabeza.add(pico);
    for (const s of [-1, 1]) {
      const ojo = esfera(0.03, 0.035, 0.02, 0x222222, s * 0.045, 0.025, 0.075);
      cabeza.add(ojo);
      partes.ojos.push(ojo);
      const ala = esfera(0.05, e.pinguino ? 0.22 : 0.14, e.pinguino ? 0.12 : 0.2, e.color, s * 0.125, e.pinguino ? 0.24 : 0.2, 0);
      ala.material = mat(e.pinguino ? e.color : oscuro);
      cuerpoGrupo.add(ala);
      partes.alas.push(ala);
      const pivote = new THREE.Group();
      pivote.position.set(s * 0.06, 0.05, 0.02);
      const pata = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.08), mat(e.pico));
      pata.position.set(0, -0.03, 0.02);
      pivote.add(pata);
      raiz.add(pivote);
      partes.patas.push(pivote);
    }
    cuerpoGrupo.add(cabeza);
    partes.cabeza = cabeza;
  } else {
    cuerpoGrupo.add(esfera(0.24, 0.2, 0.34, e.color, 0, 0.17, 0));
    cuerpoGrupo.add(esfera(0.16, 0.13, 0.2, e.secundario, 0, 0.13, 0.07));
    const cabeza = new THREE.Group();
    cabeza.position.set(0, 0.3, 0.17);
    cabeza.add(esfera(0.22, 0.2, 0.2, e.color, 0, 0, 0));
    cabeza.add(esfera(0.11, 0.08, 0.08, e.secundario, 0, -0.035, 0.08));
    cabeza.add(esfera(0.035, 0.03, 0.03, 0x3b2f26, 0, -0.01, 0.12));
    for (const s of [-1, 1]) {
      const ojo = esfera(0.035, 0.04, 0.02, 0x222222, s * 0.055, 0.025, 0.09);
      cabeza.add(ojo);
      partes.ojos.push(ojo);
      const mejilla = esfera(0.04, 0.025, 0.01, 0xf4a3b0, s * 0.075, -0.025, 0.085);
      mejilla.material.transparent = true;
      mejilla.material.opacity = 0.7;
      cabeza.add(mejilla);
      let oreja;
      if (e.orejas === 'punta' || e.orejas === 'punta-grande') {
        const g = e.orejas === 'punta-grande';
        oreja = new THREE.Mesh(new THREE.ConeGeometry(g ? 0.05 : 0.04, g ? 0.13 : 0.09, 4), mat(e.color));
        oreja.position.set(s * 0.065, 0.1, -0.01);
        oreja.rotation.z = -s * 0.25;
      } else if (e.orejas === 'caidas') {
        oreja = esfera(0.06, 0.13, 0.04, oscuro, s * 0.105, 0.0, -0.01);
        oreja.rotation.z = s * 0.35;
      } else if (e.orejas === 'largas') {
        oreja = esfera(0.05, 0.22, 0.035, e.color, s * 0.045, 0.17, -0.02);
        oreja.rotation.z = -s * 0.12;
        const dentro = esfera(0.025, 0.16, 0.01, e.secundario, 0, 0, 0.012);
        dentro.scale.set(0.5, 0.75, 0.3);
        oreja.add(dentro);
      } else if (e.orejas === 'ninguna') {
        continue;
      } else {
        oreja = esfera(0.06, 0.06, 0.03, oscuro, s * 0.075, 0.085, 0);
      }
      cabeza.add(oreja);
    }
    cuerpoGrupo.add(cabeza);
    partes.cabeza = cabeza;

    for (const [x, z] of [[-0.075, 0.1], [0.075, 0.1], [-0.075, -0.1], [0.075, -0.1]]) {
      const pivote = new THREE.Group();
      pivote.position.set(x, 0.09, z);
      const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.09, 10), mat(e.color));
      pata.position.y = -0.045;
      pata.castShadow = true;
      pivote.add(pata);
      raiz.add(pivote);
      partes.patas.push(pivote);
    }

    if (e.cola) {
      const pivote = new THREE.Group();
      pivote.position.set(0, 0.2, -0.16);
      let cola;
      if (e.cola === 'larga') {
        cola = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.22, 8), mat(e.color));
        cola.position.set(0, 0.1, -0.04);
        cola.rotation.x = -0.5;
      } else if (e.cola === 'corta') {
        cola = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.1, 8), mat(e.color));
        cola.position.set(0, 0.05, -0.02);
        cola.rotation.x = -0.6;
      } else if (e.cola === 'bola') {
        cola = esfera(0.08, 0.08, 0.08, 0xffffff, 0, 0, -0.01);
      } else {
        cola = esfera(0.11, 0.11, 0.28, e.color, 0, 0.04, -0.12);
        cola.rotation.x = 0.4;
        const punta = esfera(0.4, 0.4, 0.3, e.secundario, 0, 0, -0.42);
        cola.add(punta);
      }
      pivote.add(cola);
      cuerpoGrupo.add(pivote);
      partes.cola = pivote;
    }
  }

  if (e.tortuga) {
    const casco = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(e.caparazon));
    casco.scale.set(1, 0.75, 1.15);
    casco.position.y = 0.17;
    casco.castShadow = true;
    cuerpoGrupo.add(casco);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      const placa = esfera(0.07, 0.03, 0.07, 0x9c7a4a, Math.cos(a) * 0.1, 0.27, Math.sin(a) * 0.12);
      cuerpoGrupo.add(placa);
    }
    cuerpoGrupo.add(esfera(0.08, 0.04, 0.08, 0x9c7a4a, 0, 0.31, 0));
  }
  if (e.dragon) {
    for (const s of [-1, 1]) {
      const ala = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 3), mat(e.secundario));
      ala.scale.set(1, 1, 0.2);
      ala.position.set(s * 0.15, 0.33, -0.04);
      ala.rotation.set(0, 0, -s * 1.0);
      cuerpoGrupo.add(ala);
      partes.alas.push(ala);
      const cuerno = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.08, 8), mat(0xf2e6c8));
      cuerno.position.set(s * 0.05, 0.1, -0.03);
      cuerno.rotation.set(-0.4, 0, -s * 0.2);
      partes.cabeza.add(cuerno);
    }
    for (let k = 0; k < 3; k++) cuerpoGrupo.add(esfera(0.04, 0.05, 0.04, e.secundario, 0, 0.27 - k * 0.01, 0.05 - k * 0.09));
  }
  if (e.loro) {
    for (let k = 0; k < 3; k++) {
      const pluma = esfera(0.03, 0.09, 0.03, [0xe05050, 0xf2d06b, 0x5a9fd6][k], (k - 1) * 0.025, 0.1, -0.02);
      pluma.rotation.x = -0.4;
      partes.cabeza.add(pluma);
    }
    const cola = esfera(0.08, 0.04, 0.24, 0x5a9fd6, 0, 0.2, -0.22);
    cola.rotation.x = 0.4;
    cuerpoGrupo.add(cola);
    cuerpoGrupo.add(esfera(0.12, 0.1, 0.06, 0xe05050, 0, 0.25, 0.12));
  }
  raiz.scale.setScalar(e.tam * 1.5);
  return partes;
}

function celdaDe(x, z) {
  return [
    THREE.MathUtils.clamp(Math.floor(x / CELDA + N / 2), 0, N - 1),
    THREE.MathUtils.clamp(Math.floor(z / CELDA + N / 2), 0, N - 1)
  ];
}

function centroCelda(i, j) {
  return new THREE.Vector3((i - N / 2 + 0.5) * CELDA, 0, (j - N / 2 + 0.5) * CELDA);
}

function camino(bloqueadas, desde, hasta) {
  const clave = (i, j) => i * N + j;
  const inicio = clave(desde[0], desde[1]);
  const fin = clave(hasta[0], hasta[1]);
  if (inicio === fin) return [];
  const previo = new Map([[inicio, -1]]);
  const cola = [inicio];
  while (cola.length) {
    const actual = cola.shift();
    if (actual === fin) break;
    const i = Math.floor(actual / N);
    const j = actual % N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const k = clave(ni, nj);
      if (previo.has(k)) continue;
      if (bloqueadas.has(k) && k !== fin) continue;
      previo.set(k, actual);
      cola.push(k);
    }
  }
  if (!previo.has(fin)) return null;
  const ruta = [];
  for (let k = fin; k !== inicio; k = previo.get(k)) ruta.unshift(centroCelda(Math.floor(k / N), k % N));
  return ruta;
}

class Mascota {
  constructor(datos) {
    this.id = datos.id;
    this.especie = datos.especie;
    this.nombre = datos.nombre;
    this.hambre = datos.hambre ?? 80;
    this.felicidad = datos.felicidad ?? 80;
    this.energia = datos.energia ?? 90;
    const claves = Object.keys(PERSONALIDADES);
    this.personalidad = datos.personalidad || claves[Math.floor(Math.random() * claves.length)];
    this.nacida = datos.nacida ?? Date.now() - 5 * 86400000;
    this.accesorio = datos.accesorio || null;
    this.e = ESPECIES[this.especie];
    this.partes = crearModeloMascota(this.especie);
    this.grupo = this.partes.raiz;
    this.grupo.userData.mascota = this;
    this.grupo.position.set(datos.x ?? 0, 0, datos.z ?? 0);
    this.angulo = Math.random() * Math.PI * 2;
    this.estado = 'quieto';
    this.tEstado = 1 + Math.random() * 2;
    this.ruta = [];
    this.alLlegar = null;
    this.t = Math.random() * 10;
    this.tParticula = 0;
    this.objetivoMirar = null;
  }

  serializar() {
    const p = this.grupo.position;
    return {
      id: this.id, especie: this.especie, nombre: this.nombre,
      hambre: Math.round(this.hambre), felicidad: Math.round(this.felicidad), energia: Math.round(this.energia),
      x: +p.x.toFixed(2), z: +p.z.toFixed(2),
      personalidad: this.personalidad, nacida: this.nacida, accesorio: this.accesorio
    };
  }

  edadDias() {
    return (Date.now() - this.nacida) / 86400000;
  }

  crecimiento() {
    return 0.7 + 0.3 * Math.min(1, this.edadDias() / 4);
  }

  ponerAccesorio(id) {
    if (this.mallaAccesorio) {
      this.mallaAccesorio.parent.remove(this.mallaAccesorio);
      liberar(this.mallaAccesorio);
      this.mallaAccesorio = null;
    }
    this.accesorio = id || null;
    if (!id) return;
    const g = crearAccesorio(id);
    const destino = this.partes.cabeza || this.partes.cuerpoGrupo;
    if (!this.partes.cabeza) g.position.y += 0.35;
    destino.add(g);
    this.mallaAccesorio = g;
  }
}

export class GestorMascotas {
  constructor(escena, gestorMuebles, eventos) {
    this.escena = escena;
    this.muebles = gestorMuebles;
    this.eventos = eventos;
    this.lista = [];
    this.pelotas = [];
  }

  bloqueadas() {
    const set = new Set();
    for (const m of this.muebles.muebles) {
      const d = m.userData;
      if (d.def.suelo || d.def.paraMascota || d.base > 0.01) continue;
      const [w, f] = this.muebles.medidas(d.def, d.rot);
      for (let i = d.x0; i < d.x0 + w; i++) {
        for (let j = d.z0; j < d.z0 + f; j++) set.add((i + N / 2) * N + (j + N / 2));
      }
    }
    return set;
  }

  buscarMueble(filtro) {
    const candidatos = this.muebles.muebles.filter(m => m.userData.base < 0.01 && filtro(m.userData.def));
    return candidatos.length ? candidatos[Math.floor(Math.random() * candidatos.length)] : null;
  }

  celdaLibreAlAzar(bloqueadas) {
    for (let k = 0; k < 40; k++) {
      const i = Math.floor(Math.random() * N);
      const j = Math.floor(Math.random() * N);
      if (!bloqueadas.has(i * N + j)) return [i, j];
    }
    return null;
  }

  adoptar(especie, nombre) {
    const bloqueadas = this.bloqueadas();
    const celda = this.celdaLibreAlAzar(bloqueadas) || [6, 6];
    const p = centroCelda(celda[0], celda[1]);
    const m = new Mascota({ id: `m${Date.now()}`, especie, nombre, x: p.x, z: p.z, hambre: 70, felicidad: 90, energia: 90, nacida: Date.now() });
    this.anadir(m);
    m.estado = 'feliz';
    m.tEstado = 1.6;
    this.eventos.particula('💖', m, 3);
    return m;
  }

  anadir(m) {
    this.escena.add(m.grupo);
    this.lista.push(m);
    m.tTrastada = 300 + Math.random() * 600;
  }

  trastada(m) {
    const objetivos = this.muebles.muebles.filter(x => ['planta', 'cactus', 'jarron', 'lampara-mesa', 'libros', 'radio', 'peluche', 'globo', 'rosas', 'lampara-lava'].includes(x.userData.def.id) && !(x.userData.datos && x.userData.datos.tirado));
    if (!objetivos.length) return false;
    const obj = objetivos[Math.floor(Math.random() * objetivos.length)];
    const celda = obj.userData.base > 0.01 ? this.celdaJunto(obj) : this.celdaJunto(obj);
    if (!celda) return false;
    return this.ir(m, celda, () => {
      if (!this.muebles.muebles.includes(obj)) return;
      if (!obj.userData.datos) obj.userData.datos = {};
      obj.userData.datos.tirado = true;
      m.estado = 'feliz';
      m.tEstado = 1.5;
      m.objetivoAngulo = Math.atan2(obj.position.x - m.grupo.position.x, obj.position.z - m.grupo.position.z);
      this.eventos.particula('😼', m, 2);
      if (this.eventos.trastada) this.eventos.trastada(m, obj);
    }, 'correr');
  }

  cargar(lista, segundosFuera = 0) {
    for (const d of lista || []) {
      if (!ESPECIES[d.especie]) continue;
      const m = new Mascota(d);
      const horas = Math.min(segundosFuera / 3600, 48);
      m.hambre = Math.max(15, m.hambre - horas * 4);
      m.felicidad = Math.max(15, m.felicidad - horas * 3);
      m.energia = Math.min(100, m.energia + horas * 20);
      this.anadir(m);
    }
  }

  serializar() {
    return this.lista.map(m => m.serializar());
  }

  sincronizarAccesorios() {
    for (const m of this.lista) {
      const actual = m.mallaAccesorio ? m.accesorioPuesto : null;
      if (actual !== m.accesorio) {
        m.ponerAccesorio(m.accesorio);
        m.accesorioPuesto = m.accesorio;
      }
    }
  }

  sincronizar(lista) {
    const ids = new Set(lista.map(d => d.id));
    for (const m of [...this.lista]) if (!ids.has(m.id)) this.quitar(m);
    for (const d of lista) {
      const m = this.lista.find(x => x.id === d.id);
      if (!m) {
        this.cargar([d]);
        continue;
      }
      for (const k of Object.keys(d)) {
        if (k === 'x' || k === 'z' || k === 'id' || k === 'especie') continue;
        m[k] = d[k];
      }
    }
  }

  intersectar(raycaster) {
    const hits = raycaster.intersectObjects(this.lista.map(m => m.grupo), true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.mascota) o = o.parent;
    return o ? o.userData.mascota : null;
  }

  ir(m, destino, alLlegar, estadoAndar = 'andar') {
    const bloqueadas = this.bloqueadas();
    const ruta = camino(bloqueadas, celdaDe(m.grupo.position.x, m.grupo.position.z), destino);
    if (!ruta) return false;
    m.ruta = ruta;
    m.alLlegar = alLlegar;
    m.estado = estadoAndar;
    if (!ruta.length) {
      m.estado = 'quieto';
      if (alLlegar) alLlegar();
    }
    return true;
  }

  celdaDeMueble(mueble) {
    const d = mueble.userData;
    const [w, f] = this.muebles.medidas(d.def, d.rot);
    return [d.x0 + N / 2 + Math.floor(w / 2), d.z0 + N / 2 + Math.floor(f / 2)];
  }

  celdaJunto(mueble) {
    const d = mueble.userData;
    const [w, f] = this.muebles.medidas(d.def, d.rot);
    const bloqueadas = this.bloqueadas();
    const opciones = [];
    for (let i = d.x0 - 1; i <= d.x0 + w; i++) {
      for (let j = d.z0 - 1; j <= d.z0 + f; j++) {
        const dentro = i >= d.x0 && i < d.x0 + w && j >= d.z0 && j < d.z0 + f;
        const ci = i + N / 2;
        const cj = j + N / 2;
        if (dentro || ci < 0 || cj < 0 || ci >= N || cj >= N || bloqueadas.has(ci * N + cj)) continue;
        opciones.push([ci, cj]);
      }
    }
    return opciones.length ? opciones[Math.floor(Math.random() * opciones.length)] : null;
  }

  decidir(m) {
    if (m.energia < 25) {
      const cama = this.buscarMueble(d => d.camaMascota || (d.id === 'caseta' && m.e.perro));
      if (cama && this.ir(m, this.celdaDeMueble(cama), () => this.dormir(m, cama))) return;
      this.dormir(m, null);
      return;
    }
    const r = Math.random() * (m.personalidad === 'juguetona' ? 0.5 : 1);
    if (r < 0.15) {
      const pelota = this.buscarMueble(d => d.juguete);
      if (pelota && this.ir(m, this.celdaDeMueble(pelota), () => this.jugarCon(m, pelota), 'correr')) return;
    } else if (r < 0.27 && m.e.gato) {
      const rascador = this.buscarMueble(d => d.id === 'rascador');
      const celda = rascador && this.celdaJunto(rascador);
      if (celda && this.ir(m, celda, () => {
        m.estado = 'rascar';
        m.tEstado = 3;
        m.objetivoMirar = rascador.position.clone();
      })) return;
    } else if (r < 0.35 && m.e.perro) {
      const caseta = this.buscarMueble(d => d.id === 'caseta');
      if (caseta && this.ir(m, this.celdaDeMueble(caseta), () => {
        m.estado = 'quieto';
        m.tEstado = 5;
      })) return;
    } else if (r < 0.45 && m.hambre < 50) {
      const comedero = this.buscarMueble(d => d.comedero);
      if (comedero && this.ir(m, this.celdaDeMueble(comedero), () => {
        m.estado = 'comer';
        m.tEstado = 2.5;
        m.hambre = Math.min(100, m.hambre + 10);
      })) return;
    }
    if (Math.random() < 0.65) {
      const celda = this.celdaLibreAlAzar(this.bloqueadas());
      if (celda && this.ir(m, celda, null)) return;
    }
    m.estado = 'quieto';
    m.tEstado = 1.5 + Math.random() * 3;
  }

  dormir(m, cama) {
    m.estado = 'dormir';
    m.tEstado = 8;
    m.alturaCama = cama && cama.userData.def.camaMascota ? 0.14 : 0;
  }

  jugarCon(m, pelota) {
    m.estado = 'jugar';
    m.tEstado = 2;
    m.felicidad = Math.min(100, m.felicidad + 5);
    m.energia = Math.max(0, m.energia - 4);
    this.eventos.particula('🎾', m);
    pelota.userData.empuje = { dir: m.angulo, v: 1.2 };
  }

  acariciar(m) {
    m.ruta = [];
    m.estado = 'feliz';
    m.tEstado = 1.5;
    m.felicidad = Math.min(100, m.felicidad + 10);
    this.eventos.particula('💕', m, 3);
  }

  alimentar(m) {
    const comedero = this.buscarMueble(d => d.comedero);
    const comer = () => {
      m.estado = 'comer';
      m.tEstado = 2.5;
      this.eventos.particula('😋', m);
    };
    m.hambre = Math.min(100, m.hambre + 40);
    m.felicidad = Math.min(100, m.felicidad + 5);
    if (!comedero || !this.ir(m, this.celdaDeMueble(comedero), comer, 'correr')) comer();
  }

  premio(m) {
    m.ruta = [];
    m.hambre = Math.min(100, m.hambre + 10);
    m.felicidad = Math.min(100, m.felicidad + 20);
    m.estado = 'feliz';
    m.tEstado = 1.8;
    this.eventos.particula('⭐', m, 2);
  }

  jugar(m) {
    m.felicidad = Math.min(100, m.felicidad + 15);
    m.energia = Math.max(0, m.energia - 10);
    const pelota = this.buscarMueble(d => d.juguete);
    if (pelota && this.ir(m, this.celdaDeMueble(pelota), () => this.jugarCon(m, pelota), 'correr')) return;
    m.ruta = [];
    m.estado = 'vueltas';
    m.tEstado = 2.2;
    this.eventos.particula('✨', m);
  }

  alSofa(mueble) {
    const d = mueble.userData;
    const [w, f] = this.muebles.medidas(d.def, d.rot);
    const alto = d.def.id === 'sofa' ? 0.5 : d.def.id === 'sillon-huevo' ? 0.9 : 0.38;
    let n = 0;
    this.lista.forEach((m, i) => {
      if (m.estado === 'dormir' || n >= 3) return;
      const celda = this.celdaJunto(mueble);
      if (!celda) return;
      const k = n++;
      this.ir(m, celda, () => {
        const off = w > 1 ? (k - 1) * 0.35 : 0;
        const eje = d.rot % 2 === 0 ? 'x' : 'z';
        m.grupo.position.x = mueble.position.x + (eje === 'x' ? off : 0);
        m.grupo.position.z = mueble.position.z + (eje === 'z' ? off : 0);
        m.estado = 'sofa';
        m.sofa = mueble;
        m.tEstado = 12;
        m.alturaSofa = d.base + alto;
        m.objetivoAngulo = mueble.rotation.y;
        this.eventos.particula('💗', m);
      }, 'correr');
    });
    return n;
  }

  quitar(m) {
    this.escena.remove(m.grupo);
    liberar(m.grupo);
    this.lista = this.lista.filter(x => x !== m);
  }

  actualizar(dt) {
    for (const mueble of this.muebles.muebles) {
      const emp = mueble.userData.empuje;
      if (!emp) continue;
      emp.v *= Math.pow(0.1, dt);
      if (emp.v < 0.05) {
        mueble.userData.empuje = null;
        continue;
      }
      const pelota = mueble.children[0];
      pelota.rotation.x += emp.v * dt * 8;
    }

    for (const m of this.lista) {
      m.t += dt;
      const pers = m.personalidad;
      m.hambre = Math.max(0, m.hambre - dt * (pers === 'glotona' ? 5.6 : 4) / 3600);
      m.felicidad = Math.max(0, m.felicidad - dt * (pers === 'carinosa' ? 1.5 : 3) / 3600);
      if (m.estado === 'dormir') m.energia = Math.min(100, m.energia + dt * 4);
      else m.energia = Math.max(0, m.energia - dt / (pers === 'dormilona' ? 16 : 25));
      const traviesa = pers === 'traviesa' || m.felicidad < 35;
      if (traviesa && m.estado !== 'dormir' && m.estado !== 'sofa' && this.trastadas !== false) {
        m.tTrastada -= dt * (pers === 'traviesa' ? 1 : 0.6);
        if (m.tTrastada <= 0) {
          m.tTrastada = 600 + Math.random() * 900;
          this.trastada(m);
        }
      }
      if (m.accesorioPuesto !== m.accesorio) {
        m.ponerAccesorio(m.accesorio);
        m.accesorioPuesto = m.accesorio;
      }
      m.grupo.scale.setScalar(m.e.tam * 1.5 * m.crecimiento());
      this.animar(m, dt);
    }
  }

  animar(m, dt) {
    const p = m.partes;
    const pos = m.grupo.position;
    let andando = false;
    let alturaSalto = 0;
    p.cuerpoGrupo.rotation.set(0, 0, 0);
    p.cuerpoGrupo.scale.set(1, 1, 1);
    for (const o of p.ojos) {
      if (o.userData.sy === undefined) o.userData.sy = o.scale.y;
      o.scale.y = o.userData.sy;
    }

    if (m.estado === 'andar' || m.estado === 'correr') {
      const objetivo = m.ruta[0];
      if (!objetivo) {
        m.estado = 'quieto';
        m.tEstado = 1 + Math.random() * 2;
        const cb = m.alLlegar;
        m.alLlegar = null;
        if (cb) cb();
      } else {
        const dx = objetivo.x - pos.x;
        const dz = objetivo.z - pos.z;
        const dist = Math.hypot(dx, dz);
        const v = m.e.velocidad * (m.estado === 'correr' ? 1.7 : 1);
        if (dist < 0.03) m.ruta.shift();
        else {
          const paso = Math.min(dist, v * dt);
          pos.x += dx / dist * paso;
          pos.z += dz / dist * paso;
          m.objetivoAngulo = Math.atan2(dx, dz);
        }
        andando = true;
      }
    } else {
      m.tEstado -= dt;
      if (m.estado === 'dormir') {
        p.cuerpoGrupo.scale.set(1.05, 0.78, 1.05);
        for (const o of p.ojos) o.scale.y = o.userData.sy * 0.15;
        m.tParticula -= dt;
        if (m.tParticula <= 0) {
          m.tParticula = 1.6;
          this.eventos.particula('💤', m);
        }
        if (m.energia >= 95) {
          m.estado = 'quieto';
          m.tEstado = 0.5;
          m.alturaCama = 0;
        }
      } else if (m.estado === 'feliz') {
        alturaSalto = Math.abs(Math.sin(m.t * 9)) * 0.08;
        if (p.cola) p.cola.rotation.y = Math.sin(m.t * 22) * 0.8;
      } else if (m.estado === 'jugar') {
        alturaSalto = Math.abs(Math.sin(m.t * 7)) * 0.1;
        m.angulo += dt * 3;
        m.objetivoAngulo = m.angulo;
      } else if (m.estado === 'vueltas') {
        m.angulo += dt * 9;
        m.objetivoAngulo = m.angulo;
        alturaSalto = Math.abs(Math.sin(m.t * 10)) * 0.05;
      } else if (m.estado === 'sofa') {
        p.cuerpoGrupo.scale.set(1.04, 0.85, 1.04);
        if (p.cola) p.cola.rotation.y = Math.sin(m.t * 3) * 0.4;
        if (m.tEstado <= 0) {
          m.alturaSofa = 0;
          const c = m.sofa && this.muebles.muebles.includes(m.sofa) ? this.celdaJunto(m.sofa) : this.celdaLibreAlAzar(this.bloqueadas());
          if (c) pos.copy(centroCelda(c[0], c[1]));
          m.estado = 'quieto';
          m.tEstado = 0.5;
        }
      } else if (m.estado === 'comer') {
        if (p.cabeza) p.cabeza.rotation.x = 0.4 + Math.sin(m.t * 12) * 0.15;
      } else if (m.estado === 'rascar') {
        if (m.objetivoMirar) m.objetivoAngulo = Math.atan2(m.objetivoMirar.x - pos.x, m.objetivoMirar.z - pos.z);
        p.cuerpoGrupo.rotation.x = -0.35;
        p.patas[0].rotation.x = Math.sin(m.t * 16) * 0.8;
        p.patas[1].rotation.x = -Math.sin(m.t * 16) * 0.8;
      }
      if (m.estado !== 'comer' && p.cabeza) p.cabeza.rotation.x *= 0.85;
      if (m.tEstado <= 0 && m.estado !== 'dormir') this.decidir(m);
    }

    if (m.objetivoAngulo !== undefined) {
      let da = m.objetivoAngulo - m.angulo;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      m.angulo += da * Math.min(1, dt * 10);
    }
    m.grupo.rotation.y = m.angulo;

    if (andando) {
      const f = m.estado === 'correr' ? 20 : 13;
      p.patas.forEach((pata, i) => {
        pata.rotation.x = Math.sin(m.t * f + (i % 2 === 0 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.6;
      });
      alturaSalto = m.e.salta ? Math.abs(Math.sin(m.t * 8)) * 0.07 : Math.abs(Math.sin(m.t * f)) * 0.015;
      if (m.e.ave) p.cuerpoGrupo.rotation.z = Math.sin(m.t * f) * 0.12;
      if (p.cola) p.cola.rotation.y = Math.sin(m.t * 10) * 0.3;
    } else if (m.estado !== 'rascar') {
      p.patas.forEach(pata => { pata.rotation.x *= 0.8; });
      p.cuerpoGrupo.scale.y *= 1 + Math.sin(m.t * 2.5) * 0.015;
      if (p.cola && m.estado !== 'feliz') p.cola.rotation.y = Math.sin(m.t * 2) * 0.25;
    }
    for (const ala of p.alas) ala.rotation.z = m.estado === 'feliz' ? Math.sin(m.t * 25) * 0.5 : 0;
    if (Math.sin(m.t * 0.9) > 0.995 && m.estado !== 'dormir') for (const o of p.ojos) o.scale.y = o.userData.sy * 0.2;
    pos.y = alturaSalto + (m.estado === 'dormir' ? (m.alturaCama || 0) : m.estado === 'sofa' ? (m.alturaSofa || 0) : 0);
  }
}
