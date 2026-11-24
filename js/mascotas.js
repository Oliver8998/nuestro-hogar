import { caro } from './balance.js';
import * as THREE from 'three';
import { liberar } from './modelos.js';
import { crearModeloMascota as crearModelo, ponerClip } from './modeloMascota.js';

export const ESPECIES = {
  conejo: { nombre: 'Conejo', kenney: 'animal-bunny', precio: 180, texto: 'Tranquilo y suave como una nube', color: 0xf2ede6, secundario: 0xf6c9d0, orejas: 'largas', cola: 'bola', tam: 0.85, velocidad: 0.6, salta: true, dientes: true, bigotes: true, pies: 0.12, salto: 0.45 },
  pato: { nombre: 'Pollito', kenney: 'animal-chick', precio: 160, texto: 'Pequeñito, amarillo y muy curioso', ave: true, color: 0xf7d84a, secundario: 0xf7d84a, pico: 0xf08c2a, tam: 0.8, velocidad: 0.5, salto: 0.5, aletea: true },
  cerdito: { nombre: 'Cerdito', kenney: 'animal-pig', precio: 200, texto: 'Glotón, rosita y muy cariñoso', color: 0xf4a6b8, secundario: 0xf8c8d4, orejas: 'redondas', cola: 'corta', tam: 0.95, velocidad: 0.5, salto: 0.4 },
  gato: { nombre: 'Gato', kenney: 'animal-cat', precio: 250, texto: 'Independiente y mimoso a ratos', color: 0xf0a860, secundario: 0xfff3e0, orejas: 'punta', cola: 'larga', tam: 1, velocidad: 0.7, gato: true, rayas: true, calcetines: 0xfff3e0, salto: 0.85 },
  koala: { nombre: 'Koala', kenney: 'animal-koala', precio: 300, texto: 'Dormilón y abrazable', color: 0x9a9aa6, secundario: 0xe0e0e6, orejas: 'redondas', cola: null, tam: 0.95, velocidad: 0.4, salto: 0.6 },
  perro: { nombre: 'Perro', kenney: 'animal-dog', precio: 350, texto: 'Leal, juguetón y siempre contento', color: 0xc9925a, secundario: 0xf5e6d0, orejas: 'caidas', cola: 'corta', tam: 1.15, velocidad: 0.85, perro: true, hocico: 'largo', parche: true, salto: 0.55, levantaPata: true },
  loro: { nombre: 'Loro', kenney: 'animal-parrot', precio: 380, texto: 'Repite todo lo que oye por casa', ave: true, loro: true, color: 0x4caf50, secundario: 0xf2d06b, pico: 0x3d3d3d, tam: 0.85, velocidad: 0.5, salto: 1.9, vuela: true },
  pinguino: { nombre: 'Pingüino', kenney: 'animal-penguin', exclusivo: 'epico', texto: 'Elegante, aunque se resbala', ave: true, pinguino: true, color: 0x2b2b33, secundario: 0xffffff, pico: 0xf0a020, tam: 0.95, velocidad: 0.4, salto: 0 },
  zorro: { nombre: 'Zorrito', kenney: 'animal-fox', exclusivo: 'legendario', texto: 'Curioso y con una cola enorme', color: 0xe87a3a, secundario: 0xfff6ee, orejas: 'punta-grande', cola: 'esponjosa', tam: 1, velocidad: 0.8, hocico: 'zorro', calcetines: 0x3b2a22, bigotes: true, salto: 0.62, levantaPata: true },
  panda: { nombre: 'Panda', kenney: 'animal-panda', exclusivo: 'legendario', texto: 'Tranquilo, redondito y adorable', color: 0xf4f4f4, secundario: 0x2b2b33, orejas: 'redondas', cola: null, tam: 1.05, velocidad: 0.45, salto: 0.5 }
};

export const ESPECIE_ANTIGUA = { hamster: 'conejo', cobaya: 'cerdito', tortuga: 'koala', dragon: 'panda' };

for (const e of Object.values(ESPECIES)) if (typeof e.precio === 'number') e.precio = caro(e.precio);

const CELDA = 0.5;
const SUBIBLE = { sofa: 0.5, cama: 0.55, puff: 0.375, 'puff-corazon': 0.42, mesita: 0.5, caja: 0.42, comoda: 0.8, escritorio: 0.75, mesa: 0.755, tumbona: 0.3, 'sillon-huevo': 0.62, lavadora: 0.85, rascador: 0.9, estanteria: 1.6, nevera: 1.8, piano: 1.08, 'mesa-picnic': 0.75 };
const CON_RESPALDO = new Set(['sofa', 'cama', 'sillon-huevo']);
const QUIETO_ENCIMA = ['sentado', 'tumbado', 'mirar', 'acicalarse', 'bostezo', 'mirar'];
const Q = new THREE.Quaternion();
const EJES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const giroNodo = (n, eje, a) => { if (n && a) n.obj.quaternion.multiply(Q.setFromAxisAngle(EJES[eje], a)); };
const curva = x => x * x * (3 - 2 * x);
let NX = 12;
let NZ = 12;

export function usarRejilla(muebles) {
  NX = muebles.lx * 2;
  NZ = muebles.lz * 2;
}

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

export function crearModeloMascota(especieId) {
  return crearModelo(especieId, ESPECIES);
}

function celdaDe(x, z) {
  return [
    THREE.MathUtils.clamp(Math.floor(x / CELDA + NX / 2), 0, NX - 1),
    THREE.MathUtils.clamp(Math.floor(z / CELDA + NZ / 2), 0, NZ - 1)
  ];
}

function centroCelda(i, j) {
  return new THREE.Vector3((i - NX / 2 + 0.5) * CELDA, 0, (j - NZ / 2 + 0.5) * CELDA);
}

function camino(bloqueadas, desde, hasta) {
  const clave = (i, j) => i * NZ + j;
  const inicio = clave(desde[0], desde[1]);
  const fin = clave(hasta[0], hasta[1]);
  if (inicio === fin) return [];
  const previo = new Map([[inicio, -1]]);
  const cola = [inicio];
  while (cola.length) {
    const actual = cola.shift();
    if (actual === fin) break;
    const i = Math.floor(actual / NZ);
    const j = actual % NZ;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ) continue;
      const k = clave(ni, nj);
      if (previo.has(k)) continue;
      if (bloqueadas.has(k) && k !== fin) continue;
      previo.set(k, actual);
      cola.push(k);
    }
  }
  if (!previo.has(fin)) return null;
  const ruta = [];
  for (let k = fin; k !== inicio; k = previo.get(k)) ruta.unshift(centroCelda(Math.floor(k / NZ), k % NZ));
  return ruta;
}

const GEO_MANCHA = new THREE.SphereGeometry(1, 10, 6);
GEO_MANCHA.userData.compartida = true;
const MAT_MANCHA = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1 });

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
    this.trucos = datos.trucos || {};
    this.ultimaCria = datos.ultimaCria || 0;
    this.sucia = datos.sucia || 0;
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
      personalidad: this.personalidad, nacida: this.nacida, accesorio: this.accesorio,
      trucos: this.trucos, ultimaCria: this.ultimaCria, sucia: +this.sucia.toFixed(2)
    };
  }

  pintarManchas() {
    const n = Math.round(Math.min(1, this.sucia) * 8);
    if (this.manchasVistas === n) return;
    this.manchasVistas = n;
    const c = this.partes.cuerpoGrupo;
    if (!this.manchas) {
      this.manchas = new THREE.Group();
      c.add(this.manchas);
      const escala = this.grupo.scale.clone();
      this.grupo.scale.setScalar(1);
      this.grupo.updateMatrixWorld(true);
      const caja = new THREE.Box3();
      c.traverse(o => { if (o.isMesh && !o.userData.mancha) caja.expandByObject(o); });
      const centro = caja.getCenter(new THREE.Vector3());
      const tam = caja.getSize(new THREE.Vector3());
      c.worldToLocal(centro);
      const s = new THREE.Vector3();
      c.getWorldScale(s);
      tam.divide(s);
      this.cajaCuerpo = { centro, tam };
      this.grupo.scale.copy(escala);
      this.semillaManchas = Array.from({ length: 8 }, () => [Math.random() * Math.PI * 2, 0.25 + Math.random() * 1.0, 0.7 + Math.random() * 0.6]);
    }
    while (this.manchas.children.length) this.manchas.remove(this.manchas.children[0]);
    const { centro, tam } = this.cajaCuerpo;
    for (let i = 0; i < n; i++) {
      const [a, b, k] = this.semillaManchas[i];
      const m = new THREE.Mesh(GEO_MANCHA, MAT_MANCHA);
      m.userData.mancha = true;
      const r = Math.min(tam.x, tam.z) * 0.13 * k;
      m.scale.set(r, r * 0.45, r);
      m.position.set(centro.x + Math.cos(a) * Math.sin(b) * tam.x * 0.47, centro.y + Math.cos(b) * tam.y * 0.47, centro.z + Math.sin(a) * Math.sin(b) * tam.z * 0.47);
      m.lookAt(centro.clone().multiplyScalar(2).sub(m.position));
      this.manchas.add(m);
    }
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
    usarRejilla(this.muebles);
    const set = new Set();
    for (const m of this.muebles.muebles) {
      const d = m.userData;
      if (d.def.suelo || d.def.paraMascota || d.base > 0.01) continue;
      const [w, f] = this.muebles.medidas(d.def, d.rot);
      for (let i = d.x0; i < d.x0 + w; i++) {
        for (let j = d.z0; j < d.z0 + f; j++) set.add((i + NX / 2) * NZ + (j + NZ / 2));
      }
    }
    return set;
  }

  buscarMueble(filtro) {
    const candidatos = this.muebles.muebles.filter(m => m.userData.base < 0.01 && filtro(m.userData.def));
    return candidatos.length ? candidatos[Math.floor(Math.random() * candidatos.length)] : null;
  }

  posCelda(c) {
    usarRejilla(this.muebles);
    return centroCelda(c[0], c[1]);
  }

  claveCelda(c) {
    usarRejilla(this.muebles);
    return c[0] * NZ + c[1];
  }

  celdaLibreAlAzar(bloqueadas) {
    usarRejilla(this.muebles);
    for (let k = 0; k < 40; k++) {
      const i = Math.floor(Math.random() * NX);
      const j = Math.floor(Math.random() * NZ);
      if (!bloqueadas.has(i * NZ + j)) return [i, j];
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

  crear(datos) {
    const m = new Mascota(datos);
    this.anadir(m);
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
      if (ESPECIE_ANTIGUA[d.especie]) d.especie = ESPECIE_ANTIGUA[d.especie];
      if (!ESPECIES[d.especie]) continue;
      const m = new Mascota(d);
      const horas = Math.min(segundosFuera / 3600, 48);
      m.hambre = Math.max(15, m.hambre - horas * 4);
      m.felicidad = Math.max(15, m.felicidad - horas * 3);
      m.energia = Math.min(100, m.energia + horas * 20);
      this.anadir(m);
      usarRejilla(this.muebles);
      this.soltar(m);
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
    if (m.estado === 'saltar' && m.salto) {
      m.salto.despues = () => this.ir(m, destino, alLlegar, estadoAndar);
      return true;
    }
    if (m.encima) {
      if (this.bajar(m, () => this.ir(m, destino, alLlegar, estadoAndar))) return true;
      this.soltar(m);
    }
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
    return [d.x0 + NX / 2 + Math.floor(w / 2), d.z0 + NZ / 2 + Math.floor(f / 2)];
  }

  celdaJunto(mueble) {
    const d = mueble.userData;
    const [w, f] = this.muebles.medidas(d.def, d.rot);
    const bloqueadas = this.bloqueadas();
    const opciones = [];
    for (let i = d.x0 - 1; i <= d.x0 + w; i++) {
      for (let j = d.z0 - 1; j <= d.z0 + f; j++) {
        const dentro = i >= d.x0 && i < d.x0 + w && j >= d.z0 && j < d.z0 + f;
        const ci = i + NX / 2;
        const cj = j + NZ / 2;
        if (dentro || ci < 0 || cj < 0 || ci >= NX || cj >= NZ || bloqueadas.has(ci * NZ + cj)) continue;
        opciones.push([ci, cj]);
      }
    }
    return opciones.length ? opciones[Math.floor(Math.random() * opciones.length)] : null;
  }

  accion(m, estado, dur, extra = {}) {
    if (m.estado === 'saltar' && m.salto) {
      m.salto.despues = () => this.accion(m, estado, dur, extra);
      return true;
    }
    m.alAcabar = null;
    m.ruta = [];
    m.alLlegar = null;
    m.estado = estado;
    m.tEstado = dur;
    m.dur = dur;
    Object.assign(m, extra);
    return true;
  }


  ocupadaEncima(mueble, i, j, m) {
    const tapan = this.muebles.muebles.some(o => {
      const d = o.userData;
      if (o === mueble || d.base < 0.01 || d.def.suelo) return false;
      const [w, f] = this.muebles.medidas(d.def, d.rot);
      return i >= d.x0 && i < d.x0 + w && j >= d.z0 && j < d.z0 + f;
    });
    if (tapan) return true;
    return this.lista.some(o => o !== m && o.encima && o.encima.mueble === mueble && o.encima.i === i && o.encima.j === j);
  }

  superficie(m, mueble) {
    const d = mueble.userData;
    const alto = SUBIBLE[d.def.id];
    if (alto === undefined || d.base > 0.01 || d.datos && d.datos.tirado) return null;
    const [w, f] = this.muebles.medidas(d.def, d.rot);
    const celdas = [];
    for (let i = d.x0; i < d.x0 + w; i++) {
      for (let j = d.z0; j < d.z0 + f; j++) {
        if (CON_RESPALDO.has(d.def.id) && (w > 1 || f > 1)) {
          const atras = d.rot === 0 ? j === d.z0 : d.rot === 1 ? i === d.x0 : d.rot === 2 ? j === d.z0 + f - 1 : i === d.x0 + w - 1;
          if (atras) continue;
        }
        if (!this.ocupadaEncima(mueble, i, j, m)) celdas.push([i, j]);
      }
    }
    if (!celdas.length) return null;
    const [i, j] = celdas[Math.floor(Math.random() * celdas.length)];
    const p = new THREE.Vector3((i + 0.5) * CELDA, alto, (j + 0.5) * CELDA);
    return { p, i, j, alto };
  }

  candidatosSubir(m, min = 0) {
    const max = m.e.salto || 0;
    return this.muebles.muebles.filter(x => {
      const a = SUBIBLE[x.userData.def.id];
      return a !== undefined && a <= max && a >= min && x.userData.base < 0.01 && !(m.encima && m.encima.mueble === x);
    });
  }

  saltarA(m, destino, alFin, op = {}) {
    const de = m.grupo.position.clone();
    de.y = m.alturaBase || 0;
    const dist = Math.hypot(destino.x - de.x, destino.z - de.z);
    const volar = !!op.volar;
    const dur = op.dur ?? (volar ? 0.9 + dist / 1.4 : 0.55 + Math.abs(destino.y - de.y) * 0.25);
    const arco = op.arco ?? (volar ? 0.35 + Math.min(0.5, dist * 0.08) : 0.22 + Math.max(0, destino.y - de.y) * 0.35);
    m.ruta = [];
    m.alLlegar = null;
    m.estado = 'saltar';
    m.salto = { de, a: destino.clone(), t: 0, dur, arco, volar, alFin, despues: null };
    m.objetivoAngulo = Math.atan2(destino.x - de.x, destino.z - de.z);
    return true;
  }

  soltar(m) {
    m.encima = null;
    const [i, j] = celdaDe(m.grupo.position.x, m.grupo.position.z);
    if (this.bloqueadas().has(i * NZ + j)) {
      const c = this.celdaLibreAlAzar(this.bloqueadas());
      if (c) m.grupo.position.copy(centroCelda(c[0], c[1]));
    }
  }

  subirA(m, mueble, alSubir) {
    const celda = this.celdaJunto(mueble);
    if (!celda) return false;
    return this.ir(m, celda, () => {
      if (!this.muebles.muebles.includes(mueble)) return;
      const sup = this.superficie(m, mueble);
      if (!sup) return;
      this.accion(m, 'agacharse', 0.35, {
        alAcabar: () => this.saltarA(m, sup.p, () => {
          m.encima = { mueble, i: sup.i, j: sup.j, alto: sup.alto, x0: mueble.userData.x0, z0: mueble.userData.z0, hasta: m.t + 8 + Math.random() * 14 };
          if (alSubir) alSubir();
          else this.accion(m, Math.random() < 0.5 ? 'sentado' : 'mirar', 2 + Math.random() * 2, { mirarA: (Math.random() - 0.5) * 2 });
        })
      });
    }, Math.random() < 0.3 ? 'correr' : 'andar');
  }

  subirAlgo(m) {
    const opciones = this.candidatosSubir(m);
    if (!opciones.length) return false;
    const mueble = opciones[Math.floor(Math.random() * opciones.length)];
    if (!this.superficie(m, mueble)) return false;
    return this.subirA(m, mueble);
  }

  volarAlgo(m) {
    const altos = this.candidatosSubir(m, 0.5).filter(x => this.superficie(m, x));
    if (altos.length && Math.random() < 0.75) {
      const mueble = altos[Math.floor(Math.random() * altos.length)];
      const sup = this.superficie(m, mueble);
      this.eventos.particula('🪶', m);
      return this.accion(m, 'aletear', 0.5, {
        alAcabar: () => this.saltarA(m, sup.p, () => {
          m.encima = { mueble, i: sup.i, j: sup.j, alto: sup.alto, x0: mueble.userData.x0, z0: mueble.userData.z0, hasta: m.t + 10 + Math.random() * 20 };
          this.accion(m, 'mirar', 2.5, { mirarA: (Math.random() - 0.5) * 2 });
        }, { volar: true })
      });
    }
    const c = this.celdaLibreAlAzar(this.bloqueadas());
    if (!c) return false;
    const destino = centroCelda(c[0], c[1]);
    if (m.grupo.position.distanceTo(destino) < 1.2) return false;
    return this.accion(m, 'aletear', 0.4, {
      alAcabar: () => this.saltarA(m, destino, () => {
        this.soltar(m);
        this.accion(m, 'aletear', 0.8);
      }, { volar: true, arco: 0.9 })
    });
  }

  bajar(m, alFin) {
    const e = m.encima;
    if (!e) return false;
    const vuela = m.e.vuela;
    let destino = null;
    if (this.muebles.muebles.includes(e.mueble)) {
      const c = this.celdaJunto(e.mueble);
      if (c) destino = centroCelda(c[0], c[1]);
    }
    if (!destino) {
      const c = this.celdaLibreAlAzar(this.bloqueadas());
      if (!c) return false;
      destino = centroCelda(c[0], c[1]);
    }
    destino.y = 0;
    m.encima = null;
    return this.saltarA(m, destino, () => {
      if (alFin) alFin();
      else this.accion(m, 'quieto', 0.6);
    }, { volar: vuela, dur: vuela ? undefined : 0.45 + (m.alturaBase || 0) * 0.3, arco: vuela ? 0.3 : 0.15 });
  }

  necesidad(m, tipo, alFin, junto = null) {
    if (['dormir', 'sofa', 'saltar', 'truco', 'caca', 'pis'].includes(m.estado)) return false;
    const hacer = () => {
      this.accion(m, tipo, tipo === 'caca' ? 2.6 : 2.4, { alAcabar: () => { if (alFin) alFin(); }, objetivoMirar: junto ? junto.position.clone() : null });
      this.eventos.particula(tipo === 'caca' ? '😣' : '💦', m);
    };
    if (junto) {
      const c = this.celdaJunto(junto);
      if (c && this.ir(m, c, hacer)) return true;
    }
    if (m.encima) return this.bajar(m, hacer);
    hacer();
    return true;
  }

  paseo(m) {
    m.paseo = 2 + Math.floor(Math.random() * 3);
    return this.siguePaseo(m);
  }

  siguePaseo(m) {
    if (!m.paseo) return false;
    m.paseo--;
    const celda = this.celdaLibreAlAzar(this.bloqueadas());
    if (!celda) {
      m.paseo = 0;
      return false;
    }
    return this.ir(m, celda, () => {
      if (Math.random() < 0.55) this.accion(m, 'olfatear', 1 + Math.random() * 1.2);
      else this.accion(m, 'mirar', 0.8 + Math.random() * 1.2, { mirarA: (Math.random() - 0.5) * 2 });
    });
  }

  curiosear(m) {
    const objetivos = this.muebles.muebles.filter(x => x.userData.base < 0.01 && !x.userData.def.suelo);
    if (!objetivos.length) return false;
    const obj = objetivos[Math.floor(Math.random() * objetivos.length)];
    const celda = this.celdaJunto(obj);
    if (!celda) return false;
    return this.ir(m, celda, () => {
      this.accion(m, 'olfatear', 1.8 + Math.random(), { objetivoMirar: obj.position.clone() });
      if (Math.random() < 0.4) this.eventos.particula(Math.random() < 0.5 ? '❔' : '👃', m);
    });
  }

  saludar(m) {
    const otros = this.lista.filter(x => x !== m && x.estado !== 'dormir' && x.estado !== 'sofa' && x.estado !== 'truco');
    if (!otros.length) return false;
    const o = otros[Math.floor(Math.random() * otros.length)];
    const [ci, cj] = celdaDe(o.grupo.position.x, o.grupo.position.z);
    const bloq = this.bloqueadas();
    const opciones = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [ci + a, cj + b]).filter(([i, j]) => i >= 0 && j >= 0 && i < NX && j < NZ && !bloq.has(i * NZ + j));
    if (!opciones.length) return false;
    const destino = opciones[Math.floor(Math.random() * opciones.length)];
    this.accion(o, 'mirar', 3, { objetivoMirar: m.grupo.position.clone(), mirarA: 0 });
    return this.ir(m, destino, () => {
      this.accion(m, 'saludo', 2.2, { objetivoMirar: o.grupo.position.clone() });
      if (o.estado === 'mirar' || o.estado === 'quieto') this.accion(o, 'saludo', 2.2, { objetivoMirar: m.grupo.position.clone() });
      this.eventos.particula(Math.random() < 0.6 ? '💕' : '✨', m);
    }, 'correr');
  }

  otrasLibres(m) {
    return this.lista.filter(x => x !== m && !x.encima && !['dormir', 'sofa', 'truco', 'saltar', 'caca', 'pis', 'comer', 'banar'].includes(x.estado));
  }

  junto(o, lejos = false) {
    const [ci, cj] = celdaDe(o.grupo.position.x, o.grupo.position.z);
    const bloq = this.bloqueadas();
    const ops = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [ci + a, cj + b]).filter(([i, j]) => i >= 0 && j >= 0 && i < NX && j < NZ && !bloq.has(i * NZ + j));
    return ops.length ? ops[Math.floor(Math.random() * ops.length)] : null;
  }

  perseguir(m) {
    const otras = this.otrasLibres(m).filter(x => !x.e.tortuga);
    if (!otras.length) return false;
    const o = otras[Math.floor(Math.random() * otras.length)];
    const bloq = this.bloqueadas();
    let lejos = null;
    for (let k = 0; k < 8; k++) {
      const c = this.celdaLibreAlAzar(bloq);
      if (c && centroCelda(c[0], c[1]).distanceTo(o.grupo.position) > 1.6) { lejos = c; break; }
    }
    if (!lejos) return false;
    this.eventos.particula('❗', o);
    this.accion(o, 'agacharse', 0.3, {
      alAcabar: () => {
        if (!this.ir(o, lejos, () => {
          this.accion(o, 'feliz', 1.4);
          this.eventos.particula('😆', o);
        }, 'correr')) this.accion(o, 'feliz', 1);
      }
    });
    this.accion(m, 'agacharse', 0.6, {
      alAcabar: () => {
        const destino = this.junto({ grupo: { position: centroCelda(lejos[0], lejos[1]) } });
        if (!destino || !this.ir(m, destino, () => {
          this.accion(m, 'saludo', 1.8, { objetivoMirar: o.grupo.position.clone() });
          this.eventos.particula(Math.random() < 0.5 ? '💕' : '😝', m);
        }, 'correr')) this.accion(m, 'cola', 1.5);
        this.eventos.particula('💨', m);
      }
    });
    return true;
  }

  jugarJuntas(m) {
    const otras = this.otrasLibres(m);
    if (!otras.length) return false;
    const o = otras[Math.floor(Math.random() * otras.length)];
    const destino = this.junto(o);
    if (!destino) return false;
    this.accion(o, 'mirar', 3, { objetivoMirar: m.grupo.position.clone(), mirarA: 0 });
    return this.ir(m, destino, () => {
      const juego = (x, y, n) => {
        if (n <= 0) {
          this.accion(x, 'feliz', 1.2);
          return;
        }
        const est = x.e.ave ? 'aletear' : x.e.salta || x.e.mofletes ? 'saltito' : Math.random() < 0.5 ? 'saltito' : 'cola';
        this.accion(x, est, 0.9, { objetivoMirar: y.grupo.position.clone(), alAcabar: () => juego(x, y, n - 1) });
      };
      juego(m, o, 3);
      if (!['dormir', 'sofa', 'saltar', 'truco'].includes(o.estado)) juego(o, m, 3);
      this.eventos.particula(['🎾', '✨', '💕', '😄'][Math.floor(Math.random() * 4)], m);
    }, 'correr');
  }

  acurrucarse(m) {
    const dormidas = this.lista.filter(x => x !== m && x.estado === 'dormir' && !x.encima && !x.alturaCama);
    if (!dormidas.length) return false;
    const o = dormidas[Math.floor(Math.random() * dormidas.length)];
    const destino = this.junto(o);
    if (!destino) return false;
    return this.ir(m, destino, () => {
      this.dormir(m, null);
      m.objetivoAngulo = Math.atan2(o.grupo.position.x - m.grupo.position.x, o.grupo.position.z - m.grupo.position.z) + Math.PI / 2;
      this.eventos.particula('💞', m);
    });
  }

  celos(m, comedero) {
    const comiendo = this.lista.find(x => x !== m && x.estado === 'comer' && x.grupo.position.distanceTo(comedero.position) < 0.9);
    if (!comiendo) return false;
    const destino = this.junto(comiendo);
    if (!destino) return false;
    return this.ir(m, destino, () => {
      this.accion(m, 'enfado', 1.6, { objetivoMirar: comiendo.grupo.position.clone() });
      this.eventos.particula('💢', m);
      if (comiendo.estado === 'comer') {
        this.eventos.particula('😤', comiendo);
        setTimeout(() => {
          if (!this.lista.includes(m) || m.estado !== 'enfado') return;
          if (Math.random() < 0.5) {
            this.accion(comiendo, 'enfado', 1.2, { objetivoMirar: m.grupo.position.clone() });
            this.eventos.particula('💢', comiendo);
          }
        }, 500);
      }
    }, 'correr');
  }

  decidir(m) {
    if (m.encima) {
      const e = m.encima;
      const d = e.mueble.userData;
      if (!this.muebles.muebles.includes(e.mueble) || d.x0 !== e.x0 || d.z0 !== e.z0) {
        this.soltar(m);
      } else {
        const cama = ['sofa', 'cama', 'sillon-huevo', 'puff', 'puff-corazon'].includes(d.def.id);
        if (m.energia < 25 && cama) { this.dormir(m, null); return; }
        if (m.t > e.hasta || m.energia < 25 || Math.random() < 0.12) {
          if (m.e.vuela && Math.random() < 0.5 && this.volarAlgo(m)) return;
          if (this.bajar(m)) return;
          this.soltar(m);
        } else {
          const est = QUIETO_ENCIMA[Math.floor(Math.random() * QUIETO_ENCIMA.length)];
          if (est === 'acicalarse' && !(m.e.gato || m.e.ave || m.e.orejas === 'largas' || m.e.hocico === 'zorro')) this.accion(m, 'tumbado', 4 + Math.random() * 4);
          else if (m.e.vuela && Math.random() < 0.25) this.accion(m, 'aletear', 1.2);
          else this.accion(m, est, 2.5 + Math.random() * 3.5, { mirarA: (Math.random() - 0.5) * 2.2, objetivoMirar: null });
          return;
        }
      }
    }
    if (m.paseo && this.siguePaseo(m)) return;
    if (m.energia < 25) {
      const cama = this.buscarMueble(d => d.camaMascota || (d.id === 'caseta' && m.e.perro));
      if (cama && this.ir(m, this.celdaDeMueble(cama), () => this.dormir(m, cama))) return;
      this.dormir(m, null);
      return;
    }
    const e = m.e;
    const pers = m.personalidad;
    const cuadrupedo = !e.ave && !e.tortuga;
    const opciones = [
      [pers === 'juguetona' ? 0.22 : 0.1, () => {
        const pelota = this.buscarMueble(d => d.juguete);
        return pelota && this.ir(m, this.celdaDeMueble(pelota), () => this.jugarCon(m, pelota), 'correr');
      }],
      [e.gato ? 0.1 : 0, () => {
        const rascador = this.buscarMueble(d => d.id === 'rascador');
        const celda = rascador && this.celdaJunto(rascador);
        return celda && this.ir(m, celda, () => this.accion(m, 'rascar', 3, { objetivoMirar: rascador.position.clone() }));
      }],
      [e.perro ? 0.06 : 0, () => {
        const caseta = this.buscarMueble(d => d.id === 'caseta');
        return caseta && this.ir(m, this.celdaDeMueble(caseta), () => this.accion(m, 'tumbado', 6));
      }],
      [m.hambre < 50 ? (pers === 'glotona' ? 0.3 : 0.18) : 0, () => {
        const comedero = this.buscarMueble(d => d.comedero);
        if (comedero && Math.random() < 0.7 && this.celos(m, comedero)) return true;
        return comedero && this.ir(m, this.celdaDeMueble(comedero), () => {
          this.accion(m, 'comer', 2.5);
          m.hambre = Math.min(100, m.hambre + 10);
        });
      }],
      [0.3, () => this.paseo(m)],
      [0.13, () => this.curiosear(m)],
      [this.lista.length > 1 ? (pers === 'carinosa' ? 0.14 : 0.08) : 0, () => this.saludar(m)],
      [this.lista.length > 1 && m.energia > 40 ? (pers === 'juguetona' || pers === 'traviesa' ? 0.13 : 0.06) : 0, () => this.perseguir(m)],
      [this.lista.length > 1 && m.energia > 30 ? (pers === 'juguetona' ? 0.12 : 0.06) : 0, () => this.jugarJuntas(m)],
      [this.lista.length > 1 && m.energia < 45 ? (pers === 'carinosa' || pers === 'dormilona' ? 0.35 : 0.2) : 0, () => this.acurrucarse(m)],
      [cuadrupedo ? 0.1 : 0.04, () => this.accion(m, 'sentado', 3 + Math.random() * 3)],
      [pers === 'dormilona' ? 0.14 : 0.07, () => this.accion(m, 'tumbado', 4 + Math.random() * 5)],
      [cuadrupedo ? 0.05 : 0, () => this.accion(m, 'estirarse', 1.8)],
      [m.energia < 55 ? 0.08 : 0.03, () => this.accion(m, 'bostezo', 1.6)],
      [e.gato || e.orejas === 'largas' || e.mofletes || e.redondo || e.hocico === 'zorro' ? 0.08 : 0, () => this.accion(m, 'acicalarse', 2.6 + Math.random())],
      [e.perro || e.gato || e.hocico === 'zorro' || e.dragon ? (pers === 'juguetona' ? 0.08 : 0.04) : 0, () => this.accion(m, 'cola', 2.4)],
      [e.ave || e.dragon ? 0.08 : 0, () => {
        if (e.dragon && Math.random() < 0.4) this.eventos.particula('🔥', m);
        return this.accion(m, 'aletear', 1.6);
      }],
      [e.salta || e.mofletes ? 0.07 : 0, () => this.accion(m, 'saltito', 1.1)],
      [e.vuela ? 0.16 : 0, () => this.volarAlgo(m)],
      [!e.vuela && (e.salto || 0) > 0.3 ? (e.gato ? 0.16 : pers === 'traviesa' || pers === 'juguetona' ? 0.09 : 0.06) : 0, () => this.subirAlgo(m)],
      [0.1, () => this.accion(m, 'mirar', 1.5 + Math.random() * 2.5, { mirarA: (Math.random() - 0.5) * 2.2, objetivoMirar: null })]
    ];
    let total = opciones.reduce((a, o) => a + o[0], 0);
    for (let intento = 0; intento < 3; intento++) {
      let r = Math.random() * total;
      for (const [peso, fn] of opciones) {
        if (!peso) continue;
        r -= peso;
        if (r <= 0) {
          if (fn()) return;
          break;
        }
      }
    }
    if (this.paseo(m)) return;
    this.accion(m, 'quieto', 1.5 + Math.random() * 2);
  }

  dormir(m, cama) {
    m.estado = 'dormir';
    m.tEstado = 8;
    m.alAcabar = null;
    m.alturaCama = cama && cama.userData.def.camaMascota ? 0.14 : 0;
  }

  truco(m, id) {
    m.ruta = [];
    m.alLlegar = null;
    m.estado = 'truco';
    m.truco = id;
    m.tEstado = 2;
    this.eventos.particula('✨', m, 2);
  }

  sacudirse(m) {
    this.accion(m, 'sacudirse', 1.4);
    this.eventos.particula('💦', m, 3);
    setTimeout(() => this.lista.includes(m) && this.eventos.particula('✨', m, 3), 900);
  }

  jugarCon(m, pelota) {
    m.sucia = Math.min(1, (m.sucia || 0) + 0.03);
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
    usarRejilla(this.muebles);
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
      m.felicidad = Math.max(0, m.felicidad - dt * (pers === 'carinosa' ? 1.5 : 3) / 3600 * (m.sucia > 0.6 ? 1.6 : 1));
      if (this.ensucian !== false) m.sucia = Math.min(1, m.sucia + dt * (m.e.ave ? 0.2 : 0.33) / 86400);
      m.pintarManchas();
      if (m.sucia > 0.7 && m.estado !== 'dormir') {
        m.tMosca = (m.tMosca ?? 4) - dt;
        if (m.tMosca <= 0) {
          m.tMosca = 7 + Math.random() * 8;
          this.eventos.particula(Math.random() < 0.6 ? '🪰' : '💨', m);
        }
      }
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
    const c = p.cuerpoGrupo;
    c.rotation.set(0, 0, 0);
    c.position.set(0, 0, 0);
    c.scale.set(1, 1, 1);
    for (const o of p.ojos) {
      if (o.userData.sy === undefined) o.userData.sy = o.scale.y;
      o.scale.y = o.userData.sy;
    }
    const cab = p.cabeza;
    const objCab = { x: 0, y: 0, z: 0 };
    let ojosCerrados = false;
    let bocaAbierta = 0;
    let lengua = false;
    let colaVel = 2;
    let colaAmp = 0.25 + (m.felicidad / 100) * 0.25;
    let alas = 0;
    const patasObj = [0, 0, 0, 0];
    const k = m.dur ? 1 - Math.max(0, m.tEstado) / m.dur : 0;
    const sn = Math.sin(Math.min(1, k) * Math.PI);
    let pataPis = 0;
    let colaArriba = 0;
    let vuelo = false;

    if (m.estado !== 'saltar' && !m.encima && (m.alturaBase || 0) > 0.001) m.alturaBase = Math.max(0, m.alturaBase - dt * 3);
    if (m.estado === 'saltar' && m.salto) {
      const S = m.salto;
      S.t += dt;
      const u = Math.min(1, S.t / S.dur);
      const ue = S.volar ? curva(u) : u;
      pos.x = S.de.x + (S.a.x - S.de.x) * ue;
      pos.z = S.de.z + (S.a.z - S.de.z) * ue;
      m.alturaBase = S.de.y + (S.a.y - S.de.y) * (S.volar ? curva(u) : u) + Math.sin(u * Math.PI) * S.arco;
      const sube = Math.cos(u * Math.PI);
      if (S.volar) {
        vuelo = true;
        alas = 1.8;
        c.rotation.x = 0.25 - sube * 0.15;
        objCab.x = -0.15;
        colaAmp = 0.1;
      } else {
        c.rotation.x = -sube * 0.45;
        c.scale.set(1 - Math.sin(u * Math.PI) * 0.05, 1 + Math.sin(u * Math.PI) * 0.12, 1);
        for (let i = 0; i < 4; i++) patasObj[i] = (i < 2 ? -0.9 : 0.9) * Math.sin(u * Math.PI);
        if (m.e.aletea || m.e.ave) alas = 1.5;
        colaAmp = 0.1;
      }
      if (u >= 1) {
        m.alturaBase = S.a.y;
        m.salto = null;
        m.estado = 'quieto';
        m.tEstado = 0.4;
        if (!S.volar && S.a.y < 0.01) m.aterriza = 0.25;
        if (S.alFin) S.alFin();
        if (S.despues) S.despues();
      }
    } else if (m.estado === 'andar' || m.estado === 'correr') {
      const objetivo = m.ruta[0];
      if (!objetivo) {
        m.estado = 'quieto';
        m.tEstado = 0.6 + Math.random() * 1.2;
        m.vel = 0;
        const cb = m.alLlegar;
        m.alLlegar = null;
        if (cb) cb();
      } else {
        const dx = objetivo.x - pos.x;
        const dz = objetivo.z - pos.z;
        const dist = Math.hypot(dx, dz);
        const vMax = m.e.velocidad * (m.estado === 'correr' ? 1.7 : 1) * (m.paseo !== undefined && m.paseo > 0 && m.estado === 'andar' ? 0.8 : 1);
        m.vel = Math.min(vMax, (m.vel || 0) + dt * vMax * 3);
        if (dist < 0.03) m.ruta.shift();
        else {
          const paso = Math.min(dist, m.vel * dt);
          pos.x += dx / dist * paso;
          pos.z += dz / dist * paso;
          m.objetivoAngulo = Math.atan2(dx, dz);
        }
        andando = true;
      }
    } else {
      m.tEstado -= dt;
      const est = m.estado;
      if (est === 'agacharse') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 6);
        c.scale.set(1.06, 1 - 0.16 * e2, 1.06);
        c.position.y = -0.02 * e2;
        c.rotation.x = 0.12 * e2;
        objCab.x = -0.25 * e2;
        colaAmp = 0.6;
        colaVel = 14;
      } else if (est === 'caca' || est === 'pis') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 4, m.tEstado * 4);
        const pata = est === 'pis' && m.e.levantaPata;
        if (pata && m.objetivoMirar) m.objetivoAngulo = Math.atan2(-(m.objetivoMirar.z - pos.z), m.objetivoMirar.x - pos.x);
        if (pata) {
          c.rotation.z = 0.2 * e2;
          pataPis = e2;
          patasObj[3] = -1.2 * e2;
        } else {
          c.rotation.x = -(est === 'caca' ? 0.34 : 0.22) * e2;
          c.position.y = -0.035 * e2;
          c.position.x = Math.sin(m.t * 45) * (est === 'caca' ? 0.007 : 0.004) * e2;
          patasObj[2] = patasObj[3] = 0.7 * e2;
        }
        colaArriba = e2;
        colaAmp = 0.05;
        objCab.x = -0.15 * e2;
        objCab.y = Math.sin(m.t * 1.5) * 0.4;
        ojosCerrados = est === 'caca' && e2 > 0.6 && Math.sin(m.t * 3) > -0.3;
      } else if (est === 'enfado') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 5, m.tEstado * 5);
        c.position.x = Math.sin(m.t * 38) * 0.012 * e2;
        c.scale.set(1.04, 1 - 0.08 * e2, 1.04);
        c.rotation.x = 0.1 * e2;
        objCab.x = 0.2 * e2;
        colaAmp = 0.5;
        colaVel = 22;
        if (p.orejas) p.orejas.forEach(o => { o.rotation.x = -0.6 * e2; });
      } else if (est === 'sacudirse') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 4, m.tEstado * 3);
        c.rotation.z = Math.sin(m.t * 42) * 0.32 * e2;
        c.rotation.y = Math.sin(m.t * 42 + 1) * 0.15 * e2;
        objCab.y = Math.sin(m.t * 42) * 0.6 * e2;
        colaAmp = 0.8;
        colaVel = 30;
        ojosCerrados = e2 > 0.5;
      } else if (est === 'dormir') {
        c.scale.set(1.06, 0.8, 1.04);
        c.rotation.z = m.e.ave ? 0 : 0.18;
        objCab.x = 0.35;
        objCab.z = 0.25;
        ojosCerrados = true;
        colaAmp = 0.05;
        colaVel = 0.8;
        for (let i = 0; i < 4; i++) patasObj[i] = i < 2 ? -0.9 : 0.9;
        m.tParticula -= dt;
        if (m.tParticula <= 0) {
          m.tParticula = 1.6;
          this.eventos.particula('💤', m);
        }
        if (m.energia >= 95) {
          m.estado = 'quieto';
          m.tEstado = 0.5;
          m.alturaCama = 0;
          this.accion(m, 'estirarse', 1.8);
        }
      } else if (est === 'feliz' || est === 'saludo') {
        alturaSalto = Math.abs(Math.sin(m.t * 9)) * (est === 'saludo' ? 0.05 : 0.08);
        colaVel = 22;
        colaAmp = 0.8;
        lengua = true;
        alas = 0.6;
        objCab.z = Math.sin(m.t * 4) * 0.25;
        if (est === 'saludo' && m.objetivoMirar) m.objetivoAngulo = Math.atan2(m.objetivoMirar.x - pos.x, m.objetivoMirar.z - pos.z);
      } else if (est === 'jugar') {
        alturaSalto = Math.abs(Math.sin(m.t * 7)) * 0.1;
        m.angulo += dt * 3;
        m.objetivoAngulo = m.angulo;
        colaVel = 18;
        colaAmp = 0.7;
        lengua = true;
      } else if (est === 'vueltas' || est === 'cola') {
        m.angulo += dt * (est === 'cola' ? 11 : 9);
        m.objetivoAngulo = m.angulo;
        alturaSalto = Math.abs(Math.sin(m.t * 10)) * 0.05;
        c.rotation.z = -0.12;
        objCab.y = -0.6;
        colaVel = 20;
        colaAmp = 0.9;
        lengua = est === 'cola';
      } else if (est === 'sofa') {
        c.scale.set(1.04, 0.85, 1.04);
        colaVel = 3;
        colaAmp = 0.4;
        objCab.x = 0.15;
        for (let i = 0; i < 4; i++) patasObj[i] = i < 2 ? -0.8 : 0.8;
        if (m.tEstado <= 0) {
          m.alturaSofa = 0;
          const cel = m.sofa && this.muebles.muebles.includes(m.sofa) ? this.celdaJunto(m.sofa) : this.celdaLibreAlAzar(this.bloqueadas());
          if (cel) pos.copy(centroCelda(cel[0], cel[1]));
          m.estado = 'quieto';
          m.tEstado = 0.5;
        }
      } else if (est === 'truco') {
        const kt = 1 - Math.max(0, m.tEstado) / 2;
        const st = Math.sin(kt * Math.PI);
        if (m.truco === 'sentarse') {
          c.rotation.x = -0.5 * st;
          patasObj[2] = patasObj[3] = 1.2 * st;
        } else if (m.truco === 'pata') {
          c.rotation.x = -0.3 * st;
          patasObj[0] = -1.5 * st;
        } else if (m.truco === 'rodar') {
          c.rotation.z = kt * Math.PI * 2;
          alturaSalto = st * 0.06;
        } else if (m.truco === 'saltar') {
          alturaSalto = st * 0.5;
          c.rotation.x = Math.sin(kt * Math.PI * 2) * 0.3;
        } else if (m.truco === 'muerto') {
          c.rotation.z = Math.min(1, kt * 5, (1 - kt) * 6) * 1.45;
          ojosCerrados = true;
        } else {
          m.angulo += dt * 10;
          m.objetivoAngulo = m.angulo;
          alturaSalto = st * 0.12;
        }
        colaVel = 16;
        colaAmp = 0.7;
      } else if (est === 'comer') {
        objCab.x = 0.45 + Math.sin(m.t * 12) * 0.15;
        colaVel = 10;
        colaAmp = 0.5;
      } else if (est === 'rascar') {
        if (m.objetivoMirar) m.objetivoAngulo = Math.atan2(m.objetivoMirar.x - pos.x, m.objetivoMirar.z - pos.z);
        c.rotation.x = -0.35;
        patasObj[0] = Math.sin(m.t * 16) * 0.8 - 0.6;
        patasObj[1] = -Math.sin(m.t * 16) * 0.8 - 0.6;
      } else if (est === 'olfatear') {
        if (m.objetivoMirar) m.objetivoAngulo = Math.atan2(m.objetivoMirar.x - pos.x, m.objetivoMirar.z - pos.z);
        objCab.x = 0.4 + Math.sin(m.t * 18) * 0.05;
        objCab.y = Math.sin(m.t * 1.8) * 0.35;
        c.rotation.x = 0.08;
        colaVel = 6;
      } else if (est === 'mirar') {
        if (m.objetivoMirar) m.objetivoAngulo = Math.atan2(m.objetivoMirar.x - pos.x, m.objetivoMirar.z - pos.z);
        objCab.y = (m.mirarA || 0) * (0.6 + 0.4 * Math.sin(m.t * 0.7));
        objCab.z = Math.sin(m.t * 1.3) * 0.12;
      } else if (est === 'sentado') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 3, m.tEstado * 3);
        c.rotation.x = -0.38 * e2;
        c.position.z = -0.03 * e2;
        patasObj[2] = patasObj[3] = 1.1 * e2;
        objCab.x = -0.2 * e2;
        objCab.y = Math.sin(m.t * 0.8) * 0.55;
        colaVel = 1.5;
      } else if (est === 'tumbado') {
        const e2 = Math.min(1, (m.dur - m.tEstado) * 2, m.tEstado * 2);
        c.scale.y = 1 - 0.2 * e2;
        c.position.y = -0.03 * e2;
        for (let i = 0; i < 4; i++) patasObj[i] = (i < 2 ? -1.2 : 1.2) * e2;
        objCab.x = 0.12 * e2;
        objCab.y = Math.sin(m.t * 0.5) * 0.3;
        ojosCerrados = Math.sin(m.t * 0.6) > 0.7;
        colaVel = 1.2;
      } else if (est === 'estirarse') {
        c.rotation.x = 0.35 * sn;
        c.position.y = -0.03 * sn;
        patasObj[0] = patasObj[1] = -0.9 * sn;
        patasObj[2] = patasObj[3] = 0.25 * sn;
        objCab.x = -0.3 * sn;
        ojosCerrados = sn > 0.6;
        colaAmp = 0.05;
      } else if (est === 'bostezo') {
        objCab.x = -0.45 * sn;
        bocaAbierta = sn;
        ojosCerrados = sn > 0.45;
        if (m.tEstado > m.dur - dt * 2 && Math.random() < 0.5) this.eventos.particula('🥱', m);
      } else if (est === 'acicalarse') {
        const lado = m.ladoAcicalar || (m.ladoAcicalar = Math.random() < 0.5 ? -1 : 1);
        objCab.y = lado * 0.9;
        objCab.x = 0.5 + Math.sin(m.t * 14) * 0.12;
        c.rotation.x = -0.2;
        patasObj[2] = patasObj[3] = 0.9;
        patasObj[lado < 0 ? 0 : 1] = -0.7;
        ojosCerrados = true;
        if (m.tEstado <= 0) m.ladoAcicalar = 0;
      } else if (est === 'aletear') {
        alas = 1.4;
        alturaSalto = sn * (m.e.loro || m.e.dragon ? 0.28 : 0.1);
        objCab.x = -0.2;
      } else if (est === 'saltito') {
        alturaSalto = Math.max(0, Math.sin(k * Math.PI * 2)) * 0.22;
        c.rotation.y = Math.sin(k * Math.PI * 2) * 0.6;
        c.rotation.z = Math.sin(k * Math.PI * 4) * 0.2;
      } else {
        if (m.tMirar === undefined || (m.tMirar -= dt) <= 0) {
          m.tMirar = 1.2 + Math.random() * 2;
          m.mirarIdle = (Math.random() - 0.5) * 1.2;
        }
        objCab.y = m.mirarIdle || 0;
      }
      if (m.tEstado <= 0 && m.estado !== 'dormir') {
        const fin = m.alAcabar;
        m.alAcabar = null;
        if (fin) fin();
        if (m.tEstado <= 0 && m.estado !== 'saltar' && m.estado !== 'andar' && m.estado !== 'correr') this.decidir(m);
      }
    }

    if (m.objetivoAngulo !== undefined) {
      let da = m.objetivoAngulo - m.angulo;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      m.angulo += da * Math.min(1, dt * 8);
    }
    m.grupo.rotation.y = m.angulo;

    if (andando) {
      const correr = m.estado === 'correr';
      const f = (correr ? 20 : 13) * Math.max(0.4, (m.vel || 0) / Math.max(0.01, m.e.velocidad));
      m.fasePaso = (m.fasePaso || 0) + dt * f;
      const fp = m.fasePaso;
      p.patas.forEach((pata, i) => {
        pata.rotation.x = Math.sin(fp + (i % 2 === 0 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * (correr ? 0.8 : 0.55);
      });
      alturaSalto = m.e.salta ? Math.abs(Math.sin(fp * 0.6)) * 0.08 : Math.abs(Math.sin(fp)) * (correr ? 0.03 : 0.015);
      if (m.e.ave) c.rotation.z = Math.sin(fp) * (m.e.pinguino ? 0.2 : 0.12);
      else c.rotation.z = Math.sin(fp) * 0.03;
      if (m.e.pinguino && correr) {
        c.rotation.x = 1.25;
        c.position.y = -0.12;
        alturaSalto = 0;
      }
      objCab.x = Math.sin(fp * 2) * 0.05;
      colaVel = correr ? 16 : 9;
      colaAmp = correr ? 0.55 : 0.35;
      lengua = correr;
    } else {
      p.patas.forEach((pata, i) => {
        pata.rotation.x += (patasObj[i] - pata.rotation.x) * Math.min(1, dt * 8);
      });
      c.scale.y *= 1 + Math.sin(m.t * 2.5) * 0.015;
      if (m.aterriza > 0) {
        m.aterriza -= dt;
        const a = Math.sin(Math.max(0, m.aterriza) / 0.25 * Math.PI);
        c.scale.set(c.scale.x * (1 + a * 0.08), c.scale.y * (1 - a * 0.14), c.scale.z * (1 + a * 0.08));
      }
    }

    if (cab) {
      if (!m.e.tortuga || m.estado !== 'dormir') {
        cab.rotation.x += (objCab.x - cab.rotation.x) * Math.min(1, dt * 6);
        cab.rotation.y += (objCab.y - cab.rotation.y) * Math.min(1, dt * 4);
        cab.rotation.z += (objCab.z - cab.rotation.z) * Math.min(1, dt * 4);
      }
      if (m.e.tortuga) {
        const dentro = m.estado === 'dormir' ? 1 : 0;
        cab.position.z += ((dentro ? 0.13 : 0.22) - cab.position.z) * Math.min(1, dt * 3);
      }
    }
    if (p.cola) {
      p.cola.rotation.y = Math.sin(m.t * colaVel) * colaAmp;
      if (p.colaPunta) p.colaPunta.rotation.y = Math.sin(m.t * colaVel - 0.8) * colaAmp * 0.8;
    }
    if (p.orejas.length) {
      if (m.tOreja === undefined || (m.tOreja -= dt) <= 0) {
        m.tOreja = 1.5 + Math.random() * 4;
        m.orejaMueve = 0.25;
        m.orejaLado = Math.random() < 0.5 ? 0 : 1;
      }
      if (m.orejaMueve > 0) m.orejaMueve -= dt;
      p.orejas.forEach((o, i) => {
        if (o.userData.rx === undefined) o.userData.rx = o.rotation.x;
        const tic = m.orejaMueve > 0 && i === m.orejaLado ? Math.sin(m.orejaMueve * 40) * 0.35 : 0;
        const rebote = andando ? Math.sin((m.fasePaso || 0) * 2) * 0.12 : 0;
        o.rotation.x = o.userData.rx + tic + rebote + (m.estado === 'dormir' ? 0.3 : 0);
      });
    }
    if (p.mixer) {
      const est = m.estado;
      let clip = 'idle';
      if (andando) clip = est === 'correr' ? 'run' : 'walk';
      else if (est === 'comer' || est === 'olfatear' || est === 'rascar') clip = 'eat';
      else if (est === 'saludo') clip = 'gesture-positive';
      else if (est === 'feliz' || est === 'jugar' || est === 'vueltas' || est === 'cola' || est === 'truco' || est === 'saltito' || est === 'aletear') clip = 'dance';
      else if (est === 'dormir' || est === 'sofa' || est === 'tumbado') clip = 'static';
      if (est === 'saltar' || est === 'caca' || est === 'pis' || est === 'agacharse') clip = vuelo ? 'idle' : 'static';
      if (est === 'enfado') clip = 'gesture-negative';
      if (est === 'sacudirse') clip = 'idle';
      ponerClip(p, clip);
      const n = p.nodos || {};
      for (const k in n) n[k].obj.quaternion.copy(n[k].q0);
      p.mixer.update(dt);
      if (alas) {
        const a = (0.35 + Math.sin(m.t * (vuelo ? 26 : 20)) * 0.55) * Math.min(1.2, alas);
        giroNodo(n['wing-left'], 'z', a);
        giroNodo(n['wing-right'], 'z', -a);
      }
      if (n.tail) {
        giroNodo(n.tail, 'y', Math.sin(m.t * colaVel) * colaAmp * 0.9);
        giroNodo(n.tail, 'x', -0.7 * colaArriba);
      }
      if (pataPis) giroNodo(n['leg-back-left'], 'z', 1.1 * pataPis);
    }
    if (p.boca) {
      const sy = 1 + bocaAbierta * 3;
      p.boca.scale.set(1 + bocaAbierta, sy, 1);
    }
    if (p.lengua) p.lengua.visible = lengua && m.estado !== 'dormir';
    p.alas.forEach((ala, i) => {
      const s = i === 0 ? -1 : 1;
      const base = m.e.dragon ? -s * 0.2 : -s * 0.1;
      ala.rotation.z = base + (alas ? s * Math.sin(m.t * 22) * 0.5 * alas : 0) + (andando && m.e.pinguino ? s * Math.sin((m.fasePaso || 0)) * 0.3 : 0);
    });
    if (ojosCerrados || (Math.sin(m.t * 0.9 + m.id.length) > 0.996)) for (const o of p.ojos) o.scale.y = o.userData.sy * 0.12;
    pos.y = alturaSalto + Math.max(m.alturaBase || 0, m.estado === 'dormir' ? (m.alturaCama || 0) : 0, m.estado === 'sofa' ? (m.alturaSofa || 0) : 0);
  }
}
