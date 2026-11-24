import { caro } from './balance.js';
import * as THREE from 'three';
import { liberar } from './modelos.js';
import { crearModeloMascota as crearModelo } from './modeloMascota.js';

export const ESPECIES = {
  hamster: { nombre: 'Hámster', precio: 120, texto: 'Pequeñito y siempre comiendo', color: 0xe8b878, secundario: 0xfff3e0, orejas: 'redondas', cola: null, tam: 0.6, velocidad: 0.45, redondo: true, mofletes: true, bigotes: true, patasCortas: true },
  conejo: { nombre: 'Conejo', precio: 180, texto: 'Tranquilo y suave como una nube', color: 0xf2ede6, secundario: 0xf6c9d0, orejas: 'largas', cola: 'bola', tam: 0.85, velocidad: 0.6, salta: true, dientes: true, bigotes: true, pies: 0.12 },
  pato: { nombre: 'Pato', precio: 220, texto: 'Un poco ruidoso, muy divertido', ave: true, color: 0xf7d84a, secundario: 0xf7d84a, pico: 0xf08c2a, tam: 0.9, velocidad: 0.5 },
  gato: { nombre: 'Gato', precio: 250, texto: 'Independiente y mimoso a ratos', color: 0xf0a860, secundario: 0xfff3e0, orejas: 'punta', cola: 'larga', tam: 1, velocidad: 0.7, gato: true, rayas: true, calcetines: 0xfff3e0 },
  perro: { nombre: 'Perro', precio: 350, texto: 'Leal, juguetón y siempre contento', color: 0xc9925a, secundario: 0xf5e6d0, orejas: 'caidas', cola: 'corta', tam: 1.15, velocidad: 0.85, perro: true, hocico: 'largo', parche: true },
  pinguino: { nombre: 'Pingüino', exclusivo: 'epico', texto: 'Elegante, aunque se resbala', ave: true, pinguino: true, color: 0x2b2b33, secundario: 0xffffff, pico: 0xf0a020, tam: 0.95, velocidad: 0.4 },
  cobaya: { nombre: 'Cobaya', precio: 160, texto: 'Hace ruiditos cuando está contenta', color: 0xe0a86a, secundario: 0xf8f2ea, orejas: 'redondas', cola: null, tam: 0.75, velocidad: 0.4, redondo: true, largo: 1.2, manchas: 0x6b4a33, patasCortas: true },
  tortuga: { nombre: 'Tortuga', precio: 200, texto: 'Lenta pero segura, vive muchísimo', color: 0x9cc46a, secundario: 0xd9e8b0, orejas: 'ninguna', cola: null, tam: 0.8, velocidad: 0.18, tortuga: true, caparazon: 0x7a5a3a },
  loro: { nombre: 'Loro', precio: 380, texto: 'Repite todo lo que oye por casa', ave: true, loro: true, color: 0x4caf50, secundario: 0xf2d06b, pico: 0x3d3d3d, tam: 0.85, velocidad: 0.5 },
  dragon: { nombre: 'Dragoncito', exclusivo: 'legendario', texto: 'Escupe fueguitos cuando se emociona', color: 0x8e6fd8, secundario: 0xf2c6e0, orejas: 'ninguna', cola: 'larga', tam: 1, velocidad: 0.65, dragon: true, cabezaGrande: 1.05 },
  zorro: { nombre: 'Zorrito', exclusivo: 'legendario', texto: 'Curioso y con una cola enorme', color: 0xe87a3a, secundario: 0xfff6ee, orejas: 'punta-grande', cola: 'esponjosa', tam: 1, velocidad: 0.8, hocico: 'zorro', calcetines: 0x3b2a22, bigotes: true }
};

for (const e of Object.values(ESPECIES)) if (typeof e.precio === 'number') e.precio = caro(e.precio);

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

export function crearModeloMascota(especieId) {
  return crearModelo(especieId, ESPECIES);
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
    this.trucos = datos.trucos || {};
    this.ultimaCria = datos.ultimaCria || 0;
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
      trucos: this.trucos, ultimaCria: this.ultimaCria
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

  accion(m, estado, dur, extra = {}) {
    m.ruta = [];
    m.alLlegar = null;
    m.estado = estado;
    m.tEstado = dur;
    m.dur = dur;
    Object.assign(m, extra);
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
    const opciones = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [ci + a, cj + b]).filter(([i, j]) => i >= 0 && j >= 0 && i < N && j < N && !bloq.has(i * N + j));
    if (!opciones.length) return false;
    const destino = opciones[Math.floor(Math.random() * opciones.length)];
    this.accion(o, 'mirar', 3, { objetivoMirar: m.grupo.position.clone(), mirarA: 0 });
    return this.ir(m, destino, () => {
      this.accion(m, 'saludo', 2.2, { objetivoMirar: o.grupo.position.clone() });
      if (o.estado === 'mirar' || o.estado === 'quieto') this.accion(o, 'saludo', 2.2, { objetivoMirar: m.grupo.position.clone() });
      this.eventos.particula(Math.random() < 0.6 ? '💕' : '✨', m);
    }, 'correr');
  }

  decidir(m) {
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
        return comedero && this.ir(m, this.celdaDeMueble(comedero), () => {
          this.accion(m, 'comer', 2.5);
          m.hambre = Math.min(100, m.hambre + 10);
        });
      }],
      [0.3, () => this.paseo(m)],
      [0.13, () => this.curiosear(m)],
      [this.lista.length > 1 ? (pers === 'carinosa' ? 0.14 : 0.08) : 0, () => this.saludar(m)],
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

    if (m.estado === 'andar' || m.estado === 'correr') {
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
      if (est === 'dormir') {
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
      if (m.tEstado <= 0 && m.estado !== 'dormir') this.decidir(m);
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
    pos.y = alturaSalto + (m.estado === 'dormir' ? (m.alturaCama || 0) : m.estado === 'sofa' ? (m.alturaSofa || 0) : 0);
  }
}
