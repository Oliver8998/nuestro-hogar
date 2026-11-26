import { separar } from './choques.js';
import * as THREE from 'three';
import { GestorMuebles } from './muebles.js';
import { GestorMascotas } from './mascotas.js';
import { SUELOS, PAPELES } from './casa2.js';
import { periodoSolar } from './sol.js';
import { crearPersonaje, animarPersonaje, actualizarPersonajes } from './personajes.js';
import { modeloSuelto } from './modelos.js';

export const SALAS = [
  {
    icono: '🧹', nombre: 'Estudio con Robi', ancho: 5, fondo: 5, suelo: 'roble', papel: 'hojas', cortina: 0xa8cfa0,
    ventanas: [['f', 1.2, 1.2], ['i', 1.5, 1]],
    muebles: [
      ['cama', -5, -5, 0, 2], ['mesita', -2, -5, 0, 1], ['lampara-mesa', -2, -5, 0],
      ['escritorio', 1, -5, 0, 0], ['libros', 1, -5, 0], ['ordenador', 2, -5, 0], ['silla', 1, -4, 2, 0], ['lampara', 4, -5, 0, 1],
      ['estanteria', -5, 0, 1, 0], ['libros', -5, 0, 0], ['cactus', -5, 1, 0],
      ['alfombra', -2, 0, 0, 2], ['puff', 0, 2, 0, 1], ['cama-mascota', 2, 2, 0, 0], ['planta', 4, 4, 0]
    ],
    mascotas: [['gato', 1.6, 1.4]],
    robi: [[-0.4, -0.1], [1.2, 0.5], [-1.4, 1.8], [0.2, 2.1]]
  },
  {
    icono: '🛋️', nombre: 'Salón alargado', ancho: 8, fondo: 5, suelo: 'nogal', papel: 'rayas', cortina: 0xf2b8c4,
    ventanas: [['f', -2.4, 1.2], ['f', 2.4, 1.2]],
    muebles: [
      ['lampara', -8, -5, 0, 0], ['planta', -5, -5, 0], ['estanteria', -3, -5, 0, 0], ['libros', -3, -5, 0], ['globo', -2, -5, 0],
      ['tele', -1, -5, 0, 0], ['comoda', 1, -5, 0, 1], ['radio', 1, -5, 0], ['jarron', 2, -5, 0], ['planta', 5, -5, 0, 2], ['robot', 7, -5, 0],
      ['alfombra', -2, -3, 0, 0], ['mesita', -1, -2, 0, 1], ['cactus', -1, -2, 0], ['sofa', -2, 0, 2, 0], ['lampara', -4, 0, 0, 0],
      ['mesa', 4, 0, 0, 1], ['silla', 3, 0, 1, 1], ['silla', 6, 1, 3, 1], ['silla', 4, 2, 2, 1], ['silla', 5, -1, 0, 1], ['lampara-mesa', 4, 0, 0], ['rosas', 5, 1, 0],
      ['cama-mascota', -7, 1, 0, 1], ['pelota', -5, 3, 0]
    ],
    mascotas: [['perro', -3.2, 1.6], ['gato', 0.6, 2.1]],
    aspiradora: { base: [7, -5], ruta: [[2.4, -1.8], [-1.6, -1.5], [-3.3, -0.2], [-2.6, 2.1], [0.4, 2.2], [3.0, 2.2], [3.6, -1.6]] }
  },
  {
    icono: '🛏️', nombre: 'Dormitorio romántico', ancho: 6, fondo: 6, suelo: 'blanca', papel: 'corazones', cortina: 0xf3eee4, luz: 0xffb0c8,
    ventanas: [['f', 1.9, 1.2], ['i', 0.6, 1.2]],
    muebles: [
      ['planta', -6, -6, 0, 1], ['mesita', -3, -6, 0, 1], ['lampara-mesa', -3, -6, 0], ['cama', -2, -6, 0, 0], ['mesita', 1, -6, 0, 1], ['rosas', 1, -6, 0],
      ['comoda', 3, -6, 0, 0], ['peluche', 3, -6, 0], ['lampara-corazon', 4, -6, 0],
      ['alfombra', -3, -2, 0, 0], ['puff-corazon', 2, -1, 0, 1], ['espejo', -6, 3, 1], ['cojin-corazon', -4, 3, 0],
      ['cama-mascota', 2, 3, 0, 1], ['lampara', 5, 5, 0, 1]
    ],
    mascotas: [['conejo', -0.4, 1.4], ['gato', 0.8, 2.2]]
  },
  {
    icono: '🍳', nombre: 'Cocina con robot', ancho: 7, fondo: 6, suelo: 'ajedrez', papel: 'vichy', cortina: 0xd9a63a,
    ventanas: [['f', 0.9, 1.2], ['i', 0.6, 1.2]],
    muebles: [
      ['nevera', -7, -6, 0, 1], ['cocina', -5, -6, 0, 0], ['lavadora', -3, -6, 0, 2], ['huerto', 1, -6, 0], ['estanteria', 3, -6, 0, 1], ['jarron', 3, -6, 0], ['libros', 4, -6, 0], ['robot', 5, -6, 0],
      ['mesa', -1, 0, 0, 1], ['silla', -2, 0, 1, 1], ['silla', 1, 1, 3, 1], ['silla', -1, 2, 2, 1], ['silla', 0, -1, 0, 1], ['lampara-mesa', -1, 0, 0], ['radio', 0, 1, 0],
      ['planta', -7, 3, 0, 2], ['comedero', 4, 3, 0], ['lampara', 6, -1, 0, 4], ['cactus', 6, 5, 0]
    ],
    mascotas: [['perro', -2.2, 2.0], ['pato', 1.8, -0.2]],
    aspiradora: { base: [5, -6], ruta: [[2.0, -1.6], [-1.6, -1.8], [-2.6, 1.5], [-0.2, 2.4], [2.0, 1.4], [2.7, -1.8]] }
  },
  {
    icono: '🎮', nombre: 'Rincón gamer', ancho: 6, fondo: 5, suelo: 'ceniza', papel: 'estrellas', led: 0xa070ff,
    ventanas: [['f', -1.4, 1.2]],
    muebles: [
      ['estanteria', -6, -4, 1, 2], ['peluche', -6, -4, 0], ['escritorio', -3, -5, 0, 2], ['ordenador', -3, -5, 0], ['lampara-lava', -2, -5, 0], ['silla', -3, -4, 2, 2],
      ['arcade', 2, -5, 0], ['lampara', 4, -5, 0, 3], ['cactus', 5, -5, 0],
      ['tele', -6, 0, 1, 0], ['alfombra', -5, -1, 0, 1], ['puff-corazon', -3, 0, 0], ['puff', -3, 2, 0, 3],
      ['pelota', 1, 2, 0], ['rascador', 4, 2, 0], ['planta', 5, 4, 0]
    ],
    mascotas: [['gato', 0.6, 0.2], ['panda', -0.6, 1.6]]
  },
  {
    icono: '🌳', nombre: 'Jardín', ancho: 8, fondo: 6, exterior: true,
    muebles: [
      ['farola', -8, -6, 0], ['tumbona', -3, -6, 0, 0], ['sombrilla', -2, -6, 0, 0], ['tumbona', -1, -6, 0, 1], ['piscina-hinchable', 0, -6, 0, 0],
      ['barbacoa', 5, -6, 0], ['farola', 7, -6, 0], ['mesa-picnic', -6, -1, 0], ['farola', -8, 2, 0],
      ['cerezo', -2, 2, 0], ['fuente', 4, 0, 0], ['huerto', 2, 3, 0], ['maceta-grande', 6, 4, 0], ['maceta-grande', -8, 5, 0]
    ],
    mascotas: [['perro', 1.4, 1.6], ['pato', -1.5, 0.3], ['koala', 2.6, 2.1], ['zorro', 0.4, -0.4]]
  },
  {
    icono: '🏰', nombre: 'Salón de la mansión', ancho: 8, fondo: 8, suelo: 'marmol', papel: 'flores', cortina: 0x8a2b3a,
    ventanas: [['f', -2.6, 1.2], ['f', 2.6, 1.2], ['i', 1.4, 1.2]],
    muebles: [
      ['planta', -8, -8, 0, 3], ['lampara', -3, -8, 0, 2], ['chimenea', -1, -8, 0, 0], ['lampara', 2, -8, 0, 2], ['comoda', 5, -8, 0, 2], ['globo', 5, -8, 0], ['rosas', 6, -8, 0], ['planta', 7, -8, 0, 3],
      ['alfombra', -2, -5, 0, 3], ['mesita', -1, -4, 0, 1], ['jarron', -1, -4, 0], ['sofa', -2, -2, 2, 3], ['sillon-huevo', 3, -5, 0, 0],
      ['piano', -8, -4, 1], ['acuario', -8, 4, 1],
      ['mesa', 3, 1, 0, 1], ['silla', 2, 1, 1, 1], ['silla', 5, 2, 3, 1], ['silla', 3, 3, 2, 1], ['silla', 4, 0, 0, 1], ['lampara-mesa', 3, 1, 0], ['jarron', 4, 2, 0],
      ['cama-mascota', -4, 4, 0, 2], ['lampara', 7, 4, 0, 2], ['planta', 7, 7, 0, 3]
    ],
    mascotas: [['zorro', -0.6, 0.6], ['pinguino', 2.2, -0.4], ['loro', -2.6, -1.2]],
    robi: [[0, 0.6], [-2.6, 2.4], [1.8, 3.3], [3.1, -1.6]]
  },
  {
    icono: '🎄', nombre: 'Navidad en casa', ancho: 6, fondo: 6, suelo: 'nogal', papel: 'ladrillo', cortina: 0x8a2b3a, luz: 0xffc27a,
    ventanas: [['f', 1.8, 1.2], ['i', -0.6, 1.2]],
    muebles: [
      ['arbol-navidad', -6, -6, 0], ['regalos', -4, -6, 0], ['regalos', -6, -4, 0], ['chimenea', -1, -6, 0, 1], ['comoda', 3, -6, 0, 3], ['lampara-corazon', 3, -6, 0], ['rosas', 4, -6, 0],
      ['alfombra', -2, -4, 0, 0], ['mesita', -1, -3, 0, 1], ['regalos', -1, -3, 0], ['sofa', -2, -1, 2, 3], ['lampara', -4, -1, 0, 1],
      ['estanteria', -6, 1, 1, 0], ['libros', -6, 1, 0], ['cama-mascota', 2, 2, 0, 0], ['puff', -3, 3, 0, 0], ['planta', 5, 5, 0]
    ],
    mascotas: [['perro', 0.2, 1.0], ['gato', -1.6, 1.8], ['conejo', 1.4, 0.4]]
  }
];

const PUNTOS_LUZ = 8;
const ALTO_PARED = 2.6;

function texturaPatron(item, rx, ry) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  item.dibujar(c.getContext('2d'), 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function periodo() {
  const forz = new URLSearchParams(location.search).get('hora');
  if (forz === null) return periodoSolar();
  const h = Number(forz);
  if (h >= 21 || h < 6) return 'noche';
  if (h >= 18 || h < 8) return 'tarde';
  return 'dia';
}

const LUZ = {
  dia: { hemi: [0xfff4e6, 1.5], sol: [0xfff0dd, 1.7], cristal: [0xa9d4e8, 0x8fc3dd], interior: 0, led: 0.6 },
  tarde: { hemi: [0xffd9c0, 1.05], sol: [0xffa766, 1.5], cristal: [0xf4a28c, 0xd9785a], interior: 1.2, led: 1.4 },
  noche: { hemi: [0xa8b0e0, 1.0], sol: [0xaab4ff, 0.5], cristal: [0x2c2d63, 0x1a1b40], interior: 3.6, led: 2.6 }
};

const suave = t => t * t * (3 - 2 * t);

function fachadaTorre(per, semilla) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 1024;
  const g = c.getContext('2d');
  const l = document.createElement('canvas');
  l.width = 256;
  l.height = 1024;
  const gl = l.getContext('2d');
  gl.fillStyle = '#000';
  gl.fillRect(0, 0, 256, 1024);
  let a = semilla;
  const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#c9a98f';
  g.fillRect(0, 0, 256, 1024);
  const cols = 4;
  const pisos = 10;
  const fw = 256 / cols;
  const fh = 1024 / pisos;
  const enc = { dia: 0.08, tarde: 0.45, noche: 0.8 }[per] || 0.3;
  for (let f = 0; f < pisos; f++) {
    g.fillStyle = '#b79780';
    g.fillRect(0, f * fh, 256, 6);
    for (let k = 0; k < cols; k++) {
      const x = k * fw + fw * 0.22;
      const y = f * fh + fh * 0.22;
      const w = fw * 0.56;
      const h = fh * 0.56;
      g.fillStyle = '#f3ece2';
      g.fillRect(x - 4, y - 4, w + 8, h + 8);
      const luz = r() < enc;
      g.fillStyle = luz ? '#ffd58f' : per === 'dia' ? '#8fb3cc' : '#3b3f5e';
      g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.fillRect(x + w / 2 - 1, y, 2, h);
      if (luz) {
        gl.fillStyle = '#ffd58f';
        gl.fillRect(x, y, w, h);
      }
      if (r() < 0.35) {
        g.fillStyle = '#2f2f36';
        for (let b = 0; b < 6; b++) g.fillRect(x - 4 + b * (w + 8) / 5, y + h - 10, 2, 16);
        g.fillRect(x - 6, y + h + 4, w + 12, 3);
      }
    }
  }
  const mapa = new THREE.CanvasTexture(c);
  mapa.colorSpace = THREE.SRGBColorSpace;
  const luz = new THREE.CanvasTexture(l);
  luz.colorSpace = THREE.SRGBColorSpace;
  return { mapa, luz };
}

function crearTorre(per) {
  const grupo = new THREE.Group();
  const ALTO = 30;
  const intensidad = { dia: 0, tarde: 0.7, noche: 1.1 }[per] ?? 0.5;
  const caras = [1, 2].map(k => {
    const f = fachadaTorre(per, 7919 * k + 11);
    return new THREE.MeshStandardMaterial({ map: f.mapa, emissiveMap: f.luz, emissive: 0xffffff, emissiveIntensity: intensidad, roughness: 0.95 });
  });
  const techo = new THREE.MeshStandardMaterial({ color: 0x9c8c80, roughness: 1 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(1, ALTO, 1), [caras[0], caras[1], techo, techo, caras[1], caras[0]]);
  cuerpo.position.y = -0.45 - ALTO / 2;
  cuerpo.receiveShadow = true;
  grupo.add(cuerpo);
  const cornisa = new THREE.Mesh(new THREE.BoxGeometry(1, 0.18, 1), new THREE.MeshStandardMaterial({ color: 0xe9dfd2, roughness: 0.9 }));
  cornisa.position.y = -0.5;
  grupo.add(cornisa);
  let w = 6;
  let d = 6;
  const ajustar = (nw, nd, k) => {
    w += (nw - w) * k;
    d += (nd - d) * k;
    cuerpo.scale.set(w, 1, d);
    cornisa.scale.set(w + 0.16, 1, d + 0.16);
  };
  ajustar(6.5, 6.5, 1);
  return { grupo, ajustar };
}

export class Escaparate {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    contenedor.appendChild(this.renderer.domElement);
    this.escena = new THREE.Scene();
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7560, 1.5);
    this.escena.add(this.hemi);
    this.sol = new THREE.DirectionalLight(0xfff0dd, 1.7);
    this.sol.position.set(6, 10, 4);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sol.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    this.sol.shadow.bias = -0.0005;
    this.sol.shadow.normalBias = 0.02;
    this.escena.add(this.sol);
    this.luzSala = new THREE.PointLight(0xffffff, 0, 12, 1.4);
    this.luzSala.position.set(0, 2.4, 0);
    this.escena.add(this.luzSala);
    this.puntos = Array.from({ length: PUNTOS_LUZ }, () => {
      const l = new THREE.PointLight(0xffd9a0, 0, 4, 2);
      this.escena.add(l);
      return l;
    });
    this.geoPolvo = new THREE.SphereGeometry(0.07, 8, 6);
    this.geoPolvo.userData.compartida = true;
    this.matPolvo = new THREE.MeshStandardMaterial({ color: 0x9a8f86, roughness: 1 });
    this.matPolvo.userData.fijo = true;
    this.geoBurbuja = new THREE.SphereGeometry(0.05, 8, 6);
    this.geoBurbuja.userData.compartida = true;
    this.matBurbuja = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xbfe9ff, emissiveIntensity: 0.8, roughness: 0.2 });
    this.matBurbuja.userData.fijo = true;
    this.torre = crearTorre(periodo());
    this.escena.add(this.torre.grupo);
    this.indice = Math.floor(Math.random() * SALAS.length);
    this.t = 0;
    this.tSala = 0;
    this.fase = 'entra';
    this.k = 0;
    this.zoom = 1;
    this.reloj = new THREE.Clock();
    this.alCambiar = null;
    this.basura = [];
    this.prox = null;
    this.periodo = periodo();
    this.actual = this.construirYa(SALAS[this.indice]);
    this.activar(this.actual);
    this.zoom = this.actual.zoom;
    this.medir();
    this.alRedimensionar = () => this.medir();
    window.addEventListener('resize', this.alRedimensionar);
    this.renderer.setAnimationLoop(() => this.paso());
  }

  medir() {
    const w = this.contenedor.clientWidth || 300;
    const h = this.contenedor.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.aspecto = w / h;
    this.encuadre();
  }

  encuadre() {
    const alto = 8.2 * this.zoom;
    const ancho = alto * this.aspecto;
    const a = Math.max(ancho, 10.4 * this.zoom);
    const b = a / this.aspecto;
    Object.assign(this.camara, { left: -a / 2, right: a / 2, top: b / 2, bottom: -b / 2 });
    this.camara.updateProjectionMatrix();
  }

  *pasosConstruir(s) {
    const per = this.periodo;
    const L = LUZ[per];
    const encender = per !== 'dia';
    const W = s.ancho;
    const D = s.fondo;
    const g = new THREE.Group();
    const sala = { s, grupo: g, texturas: [], luces: [], zoom: THREE.MathUtils.clamp((W + D) / 12, 0.85, 1.38) };
    const caja = (w, h, d, color, x, y, z, op = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: op.rug ?? 0.9, ...(op.map ? { map: op.map } : {}) }));
      m.position.set(x, y, z);
      m.castShadow = !op.sinSombra;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };
    caja(W + 0.5, 0.4, D + 0.5, s.exterior ? 0x8a6a4a : 0xb9a48c, 0, -0.25, 0, { sinSombra: true });
    const suelo = s.suelo && SUELOS.find(x => x.id === s.suelo);
    const matSuelo = { sinSombra: true };
    if (suelo) {
      matSuelo.map = texturaPatron(suelo, W, D);
      sala.texturas.push(matSuelo.map);
    }
    caja(W, 0.1, D, s.exterior ? 0x8fc46a : suelo && suelo.tonos ? suelo.tonos[0] : 0xffffff, 0, -0.05, 0, matSuelo);
    yield;
    if (s.exterior) {
      const madera = 0xfffaf2;
      for (let k = 0; k <= W * 2; k++) caja(0.08, 0.7, 0.08, madera, -W / 2 + k * 0.5, 0.35, -D / 2, {});
      for (let k = 0; k <= D * 2; k++) caja(0.08, 0.7, 0.08, madera, -W / 2, 0.35, -D / 2 + k * 0.5, {});
      for (const y of [0.5, 0.25]) {
        caja(W, 0.06, 0.04, madera, 0, y, -D / 2, {});
        caja(0.04, 0.06, D, madera, -W / 2, y, 0, {});
      }
    } else {
      const papel = s.papel && PAPELES.find(x => x.id === s.papel);
      const pared = (largo, x, z, ry) => {
        const mapa = papel ? texturaPatron(papel, largo, ALTO_PARED) : null;
        if (mapa) sala.texturas.push(mapa);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(largo, ALTO_PARED), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: mapa }));
        m.position.set(x, ALTO_PARED / 2, z);
        m.rotation.y = ry;
        m.receiveShadow = true;
        g.add(m);
      };
      pared(W, 0, -D / 2, 0);
      pared(D, -W / 2, 0, Math.PI / 2);
      caja(W + 0.15, ALTO_PARED, 0.15, 0xe9dfd2, 0, ALTO_PARED / 2, -D / 2 - 0.08, { sinSombra: true });
      caja(0.15, ALTO_PARED, D + 0.15, 0xe9dfd2, -W / 2 - 0.08, ALTO_PARED / 2, 0, { sinSombra: true });
      caja(W, 0.12, 0.04, 0xf7f1e8, 0, 0.06, -D / 2 + 0.02, {});
      caja(0.04, 0.12, D, 0xf7f1e8, -W / 2 + 0.02, 0.06, 0, {});
      yield;
      for (const [pared, pos, ancho] of s.ventanas || []) {
        const v = new THREE.Group();
        if (pared === 'f') v.position.set(pos, 1.55, -D / 2 + 0.03);
        else {
          v.position.set(-W / 2 + 0.03, 1.55, pos);
          v.rotation.y = Math.PI / 2;
        }
        g.add(v);
        const marco = 0xfffaf2;
        const mw = ancho;
        for (const [w, h, x, y] of [[mw, 0.08, 0, 0.62], [mw + 0.1, 0.1, 0, -0.64], [0.08, 1.3, -mw / 2, 0], [0.08, 1.3, mw / 2, 0], [0.05, 1.2, 0, 0], [mw, 0.04, 0, 0.1]]) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), new THREE.MeshStandardMaterial({ color: marco, roughness: 0.6 }));
          p.position.set(x, y, 0.02);
          v.add(p);
        }
        const cristal = new THREE.Mesh(new THREE.PlaneGeometry(mw - 0.05, 1.2), new THREE.MeshStandardMaterial({ color: L.cristal[0], emissive: L.cristal[1], emissiveIntensity: 0.5 }));
        cristal.position.z = 0.005;
        v.add(cristal);
        if (s.cortina) {
          for (const lado of [-1, 1]) {
            const geo = new THREE.PlaneGeometry(0.4, 1.55, 14, 1);
            const p = geo.attributes.position;
            for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin((p.getX(k) + 0.2) * Math.PI * 7) * 0.025);
            geo.computeVertexNormals();
            const tela = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: s.cortina, roughness: 0.9, side: THREE.DoubleSide }));
            tela.position.set(lado * (mw / 2 + 0.16), -0.02, 0.08);
            tela.castShadow = true;
            v.add(tela);
          }
        }
      }
      if (s.led) {
        for (const [w, d, x, z] of [[W, 0.03, 0, -D / 2 + 0.05], [0.03, D, -W / 2 + 0.05, 0]]) {
          const tira = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, d), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: s.led, emissiveIntensity: L.led }));
          tira.position.set(x, 2.56, z);
          g.add(tira);
        }
      }
    }
    yield;
    const gestor = new GestorMuebles(g);
    gestor.ajustarTam(W, D);
    if (gestor.rejilla) gestor.rejilla.visible = false;
    sala.gestor = gestor;
    let k = 0;
    for (const [id, x0, z0, rot, color, encendido] of s.muebles) {
      const m = gestor.anadir(id, x0, z0, rot, { color: color ?? 0, encendido: encendido ?? encender });
      if (m) {
        m.userData.aparece = 0.12 + k * 0.055;
        m.scale.setScalar(0.001);
        const l = m.userData.luz;
        if (l) {
          m.remove(l);
          m.userData.luz = null;
          if (l.intensity > 0) sala.luces.push({ m, y: l.position.y, color: l.color.getHex(), intensidad: l.intensity });
        }
        k++;
      }
      if (k % 3 === 0) yield;
    }
    const mas = new GestorMascotas(g, gestor, { particula: () => {} });
    mas.trastadas = false;
    mas.ensucian = false;
    sala.mas = mas;
    const personalidades = ['juguetona', 'carinosa', 'traviesa', 'juguetona'];
    sala.mascotas = [];
    for (const [i, [esp, x, z]] of s.mascotas.entries()) {
      const m = mas.crear({ id: `esc${i}`, especie: esp, nombre: '', x, z, hambre: 90, felicidad: 95, energia: 90, nacida: Date.now() - 10 * 86400000, personalidad: personalidades[i % 4] });
      m.angulo = Math.atan2(4 - x, 4 - z) + (Math.random() - 0.5) * 0.8;
      m.objetivoAngulo = m.angulo;
      m.tEstado = 0.4 + i * 0.5 + Math.random() * 0.5;
      m.grupo.userData.aparece = 0.45 + i * 0.15;
      sala.mascotas.push(m);
      yield;
    }
    if (s.robi) {
      const r = crearPersonaje('robi');
      const p0 = s.robi[0];
      r.position.set(p0[0], 0, p0[1]);
      r.scale.setScalar(0.001);
      r.userData.aparece = 0.7;
      animarPersonaje(r, 'interact-right');
      g.add(r);
      sala.robi = { g: r, ruta: s.robi, i: 0, estado: 'limpia', t: 1.5 + Math.random(), burbujas: [] };
      yield;
    }
    if (s.aspiradora) {
      const disco = new THREE.Group();
      const modelo = modeloSuelto('robot-suelo');
      if (modelo) disco.add(modelo);
      else {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 24), new THREE.MeshStandardMaterial({ color: 0xf7f4ef, roughness: 0.4 }));
        c.position.y = 0.04;
        c.castShadow = true;
        disco.add(c);
      }
      const base = gestor.muebles.find(m => m.userData.def.robot);
      const [bx, bz] = s.aspiradora.base;
      const casa = new THREE.Vector3(bx * 0.5 + 0.25, 0, bz * 0.5 + 0.25 + 0.06);
      disco.position.copy(casa);
      disco.visible = false;
      g.add(disco);
      const polvos = [];
      const ruta = s.aspiradora.ruta;
      for (let i = 0; i < ruta.length - 1; i++) {
        const [ax, az] = ruta[i];
        const [cx, cz] = ruta[i + 1];
        for (let n = 0; n < 2; n++) {
          const f = 0.3 + n * 0.4;
          const p = new THREE.Mesh(this.geoPolvo, this.matPolvo);
          p.position.set(ax + (cx - ax) * f + (Math.random() - 0.5) * 0.15, 0.05, az + (cz - az) * f + (Math.random() - 0.5) * 0.15);
          p.scale.setScalar(0.8 + Math.random() * 0.5);
          p.userData.s0 = p.scale.x;
          p.castShadow = true;
          g.add(p);
          polvos.push(p);
        }
      }
      sala.aspiradora = { disco, base, casa, ruta, polvos, i: 0, estado: 'casa', t: 1.6 };
    }
    sala.luzSala = { color: s.luz || s.led || 0xffd9a0, intensidad: s.exterior ? 0 : s.luz || s.led ? Math.max(L.led, L.interior) : L.interior };
    return sala;
  }

  construirYa(s) {
    const gen = this.pasosConstruir(s);
    let r = gen.next();
    while (!r.done) r = gen.next();
    return r.value;
  }

  prepararSiguiente() {
    const indice = (this.indice + 1) % SALAS.length;
    this.prox = { indice, gen: this.pasosConstruir(SALAS[indice]), sala: null, listo: false };
  }

  avanzarPreparacion(presupuesto) {
    const p = this.prox;
    if (!p || p.sala) return;
    const ini = performance.now();
    while (performance.now() - ini < presupuesto) {
      const r = p.gen.next();
      if (r.done) {
        p.sala = r.value;
        for (const t of p.sala.texturas) this.renderer.initTexture(t);
        const ocultos = [];
        p.sala.grupo.traverse(o => { if (!o.visible) { ocultos.push(o); o.visible = true; } });
        const terminar = () => {
          for (const o of ocultos) o.visible = false;
          p.listo = true;
        };
        try {
          this.renderer.compileAsync(p.sala.grupo, this.camara, this.escena).then(terminar, terminar);
        } catch (e) {
          terminar();
        }
        return;
      }
    }
  }

  activar(sala) {
    this.escena.add(sala.grupo);
    const L = LUZ[this.periodo];
    this.hemi.color.setHex(L.hemi[0]);
    this.hemi.intensity = L.hemi[1];
    this.sol.color.setHex(L.sol[0]);
    this.sol.intensity = L.sol[1];
    this.sol.position.set(this.periodo === 'tarde' ? 9 : 6, this.periodo === 'tarde' ? 4 : 10, 4);
    this.luzSala.color.setHex(sala.luzSala.color);
    this.objetivoSala = sala.luzSala.intensidad;
    this.puntos.forEach((l, i) => {
      const d = sala.luces[i];
      l.userData.objetivo = 0;
      if (!d) return;
      l.position.set(d.m.position.x, d.m.position.y + d.y, d.m.position.z);
      l.color.setHex(d.color);
      l.userData.objetivo = d.intensidad;
    });
    this.tSala = 0;
    this.fase = 'entra';
    if (this.alCambiar) this.alCambiar(sala.s, this.indice, SALAS.length);
  }

  tirar(sala) {
    this.escena.remove(sala.grupo);
    const objetos = [];
    sala.grupo.traverse(o => objetos.push(o));
    for (const t of sala.texturas) objetos.push({ textura: t });
    this.basura.push(objetos);
  }

  vaciarBasura() {
    const lote = this.basura[0];
    if (!lote) return;
    const ini = performance.now();
    while (lote.length && performance.now() - ini < 2) {
      const o = lote.pop();
      if (o.textura) { o.textura.dispose(); continue; }
      if (o.geometry && !o.geometry.userData.compartida) {
        o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) if (m && !m.userData.fijo) m.dispose();
      }
    }
    if (!lote.length) this.basura.shift();
  }

  siguiente() {
    if (!this.prox) this.prepararSiguiente();
    while (!this.prox.sala) this.avanzarPreparacion(1000);
    const vieja = this.actual;
    this.indice = this.prox.indice;
    this.actual = this.prox.sala;
    this.prox = null;
    this.tirar(vieja);
    this.activar(this.actual);
  }

  animarRobi(r, dt) {
    const g = r.g;
    if (r.estado === 'anda') {
      const [x, z] = r.ruta[r.i];
      const dx = x - g.position.x;
      const dz = z - g.position.z;
      const dist = Math.hypot(dx, dz);
      const giro = Math.atan2(dx, dz);
      let dif = giro - g.rotation.y;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      g.rotation.y += dif * Math.min(1, dt * 6);
      if (dist < 0.05) {
        r.estado = 'limpia';
        r.t = 2.2 + Math.random();
        animarPersonaje(g, 'interact-right');
      } else if (Math.abs(dif) < 0.6) {
        const paso = Math.min(dist, 0.75 * dt);
        g.position.x += dx / dist * paso;
        g.position.z += dz / dist * paso;
      }
    } else {
      r.t -= dt;
      if (Math.random() < dt * 6) {
        const b = new THREE.Mesh(this.geoBurbuja, this.matBurbuja);
        const fr = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
        b.position.set(g.position.x + fr.x * 0.35 + (Math.random() - 0.5) * 0.3, 0.1, g.position.z + fr.z * 0.35 + (Math.random() - 0.5) * 0.3);
        b.userData.vida = 0;
        this.actual.grupo.add(b);
        r.burbujas.push(b);
      }
      if (r.t <= 0) {
        r.i = (r.i + 1) % r.ruta.length;
        r.estado = 'anda';
        animarPersonaje(g, 'walk');
      }
    }
    for (const b of [...r.burbujas]) {
      b.userData.vida += dt;
      const v = b.userData.vida;
      b.position.y += dt * 0.5;
      b.scale.setScalar(Math.max(0.001, Math.sin(Math.min(1, v / 1.2) * Math.PI) * 1.2));
      if (v >= 1.2) {
        b.parent && b.parent.remove(b);
        r.burbujas.splice(r.burbujas.indexOf(b), 1);
      }
    }
  }

  animarAspiradora(a, dt) {
    const d = a.disco;
    const enCasa = a.estado === 'casa';
    if (a.base) a.base.userData.mallas.slice(3).forEach(m => { m.visible = enCasa; });
    d.visible = !enCasa;
    const mover = (x, z, alLlegar) => {
      const dx = x - d.position.x;
      const dz = z - d.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.03) { alLlegar(); return; }
      const paso = Math.min(dist, 0.6 * dt);
      d.position.x += dx / dist * paso;
      d.position.z += dz / dist * paso;
      const giro = Math.atan2(dx, dz);
      let dif = giro - d.rotation.y;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      d.rotation.y += dif * Math.min(1, dt * 8);
    };
    if (a.estado === 'casa') {
      a.t -= dt;
      if (a.t <= 0) { a.estado = 'ruta'; a.i = 0; d.position.copy(a.casa); }
    } else if (a.estado === 'ruta') {
      const [x, z] = a.ruta[a.i];
      mover(x, z, () => {
        a.i++;
        if (a.i >= a.ruta.length) a.estado = 'vuelve';
      });
    } else {
      mover(a.casa.x, a.casa.z, () => {
        a.estado = 'casa';
        a.t = 3;
        for (const p of a.polvos) p.userData.volver = 2 + Math.random() * 3;
      });
    }
    for (const p of a.polvos) {
      if (!d.visible) {
        if (p.userData.volver !== undefined && p.scale.x < p.userData.s0) {
          p.userData.volver -= dt;
          if (p.userData.volver <= 0) p.scale.setScalar(Math.min(p.userData.s0, p.scale.x + dt * 1.5));
        }
        continue;
      }
      const cerca = Math.hypot(p.position.x - d.position.x, p.position.z - d.position.z) < 0.26;
      if (cerca && p.scale.x > 0.01) p.scale.setScalar(Math.max(0.001, p.scale.x - dt * 6));
    }
  }

  paso() {
    const dt = Math.min(0.05, this.reloj.getDelta());
    this.t += dt;
    this.tSala += dt;
    const DUR = 7.5;
    const sala = this.actual;
    if (this.fase === 'entra') {
      this.k = Math.min(1, this.tSala / 0.7);
      if (this.k >= 1) this.fase = 'quieta';
    } else if (this.fase === 'quieta') {
      if (this.tSala > 1.2 && !this.prox) this.prepararSiguiente();
      if (this.tSala > DUR && this.prox && this.prox.listo) {
        this.fase = 'sale';
        this.tSale = 0;
      }
    } else if (this.fase === 'sale') {
      this.tSale += dt;
      this.k = Math.max(0, 1 - this.tSale / 0.45);
      if (this.k <= 0) {
        this.siguiente();
        this.k = 0;
      }
    }
    if (this.prox && !this.prox.sala) this.avanzarPreparacion(this.fase === 'quieta' ? 5 : 2);
    else if (this.basura.length) this.vaciarBasura();
    const actual = this.actual;
    let escala;
    if (this.fase === 'entra') {
      const c1 = 1.70158;
      const q = this.k - 1;
      escala = 1 + (c1 + 1) * q * q * q + c1 * q * q;
    } else if (this.fase === 'sale') escala = suave(this.k);
    else escala = 1;
    actual.grupo.scale.setScalar(Math.max(0.001, escala));
    actual.grupo.position.y = this.fase === 'sale' ? -(1 - this.k) * 1.2 : 0;
    actual.grupo.rotation.y = this.fase === 'sale' ? -suave(1 - this.k) * 0.5 : this.fase === 'entra' ? (1 - suave(this.k)) * 0.5 : 0;
    const luzK = this.fase === 'sale' ? this.k : Math.min(1, this.tSala / 0.8);
    this.luzSala.intensity = this.objetivoSala * luzK;
    for (const l of this.puntos) l.intensity = (l.userData.objetivo || 0) * Math.max(0, Math.min(1, (this.tSala - 0.6) / 0.6)) * (this.fase === 'sale' ? this.k : 1);
    if (actual === sala) {
      for (const m of actual.gestor.muebles) {
        const ap = m.userData.aparece;
        if (ap === undefined) continue;
        const u = (this.tSala - ap) / 0.38;
        if (u <= 0) m.scale.setScalar(0.001);
        else if (u >= 1) { m.scale.setScalar(1); m.userData.aparece = undefined; }
        else {
          const b = 1 + Math.sin(u * Math.PI) * 0.18 * (1 - u);
          const e = suave(Math.min(1, u * 1.4));
          m.scale.set(e * (1 + (b - 1) * 0.5), e * b, e * (1 + (b - 1) * 0.5));
        }
      }
      for (const m of actual.mascotas) {
        const ap = m.grupo.userData.aparece;
        m.grupo.visible = this.tSala > ap;
      }
      if (actual.robi) {
        const r = actual.robi;
        const u = (this.tSala - r.g.userData.aparece) / 0.4;
        r.g.scale.setScalar(Math.max(0.001, Math.min(1, suave(Math.max(0, Math.min(1, u))))));
        if (u > 1) this.animarRobi(r, dt);
      }
      if (actual.aspiradora && this.tSala > 0.9) this.animarAspiradora(actual.aspiradora, dt);
    }
    actual.mas.actualizar(dt);
    if (this.tSala > 1.2) {
      const cuerpos = actual.mas.cuerposChoque();
      if (actual.robi) cuerpos.push({ p: actual.robi.g.position, r: 0.26, fijo: true, y: 0 });
      if (actual.aspiradora && actual.aspiradora.disco.visible !== false) cuerpos.push({ p: actual.aspiradora.disco.position, r: 0.2, fijo: true, y: 0 });
      if (cuerpos.length > 1) {
        if (!actual.libreChoque) actual.libreChoque = actual.mas.libreChoque();
        separar(cuerpos, dt, actual.libreChoque);
      }
    }
    actualizarPersonajes(dt);
    this.zoom += (actual.zoom - this.zoom) * Math.min(1, dt * 3);
    this.torre.ajustar(actual.s.ancho + 0.5, actual.s.fondo + 0.5, Math.min(1, dt * 4));
    this.encuadre();
    const ang = Math.PI / 4 + Math.sin(this.t * 0.25) * 0.35;
    const d = 14;
    this.camara.position.set(Math.sin(ang) * d, 9.2, Math.cos(ang) * d);
    this.camara.lookAt(0, 0.55, 0);
    this.renderer.render(this.escena, this.camara);
  }

  destruir() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.alRedimensionar);
    if (this.actual) this.tirar(this.actual);
    if (this.prox && this.prox.sala) this.tirar(this.prox.sala);
    while (this.basura.length) this.vaciarBasura();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
