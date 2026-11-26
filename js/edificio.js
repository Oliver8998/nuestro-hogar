import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PisosVecinos } from './pisosVecinos.js';
import { Calle } from './calle.js';

const MAX_VECINOS = 96;

const PISO = 3;
const ABAJO = 3;
const ARRIBA = 3;
const BASE_Y = -0.5;
const CALLE_Y = BASE_Y - ABAJO * PISO;
const ALTO_SALA = 2.6;
const GROSOR = 0.15;
const TEXEL = 12;
const ANCHO_CALLE = 7;
const ACERA = 2.6;

function semilla(n) {
  let s = n % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function lienzo(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function textura(c) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const ESTILOS = [
  { pared: '#e9d9c3', banda: '#cbb89e', marco: '#f7f2ea', persiana: '#d9a066', balcon: 0.45 },
  { pared: '#d98f6f', banda: '#b97559', marco: '#f3ece2', persiana: '#7a9c86', balcon: 0.3 },
  { pared: '#cfd6dc', banda: '#aab4bd', marco: '#ffffff', persiana: '#5f7f9e', balcon: 0.2 },
  { pared: '#f1e6a8', banda: '#d4c27e', marco: '#fbf7ea', persiana: '#b86a5a', balcon: 0.5 },
  { pared: '#b9a28f', banda: '#9b8572', marco: '#efe7dc', persiana: '#6d5a4b', balcon: 0.35 },
  { pared: '#e7c6c8', banda: '#c9a3a6', marco: '#fff8f4', persiana: '#8d6f9a', balcon: 0.4 }
];

const CORTINAS = ['#f6e9d6', '#f4c7c3', '#cfe3ef', '#e6dcf1', '#fff3c4', '#d8ecd3'];
const LUCES = ['#ffd27a', '#ffc96a', '#ffe0a0', '#ffbf75', '#fff0c8'];

function fachada(estilo, n) {
  const r = semilla(n * 7919 + 13);
  const C = 128;
  const color = lienzo(C * 4, C * 4);
  const luz = lienzo(C * 4, C * 4);
  const g = color.getContext('2d');
  const l = luz.getContext('2d');
  const encendidas = [[], [], [], []];
  g.fillStyle = estilo.pared;
  g.fillRect(0, 0, C * 4, C * 4);
  l.fillStyle = '#000';
  l.fillRect(0, 0, C * 4, C * 4);
  for (let fy = 0; fy < 4; fy++) {
    const y0 = fy * C;
    g.fillStyle = estilo.banda;
    g.fillRect(0, y0 + C - 9, C * 4, 9);
    g.fillStyle = 'rgba(0,0,0,.08)';
    g.fillRect(0, y0 + C - 2, C * 4, 2);
    for (let fx = 0; fx < 4; fx++) {
      const x0 = fx * C;
      const ww = 50;
      const wh = 66;
      const wx = x0 + (C - ww) / 2;
      const wy = y0 + 26;
      g.fillStyle = estilo.marco;
      g.fillRect(wx - 5, wy - 5, ww + 10, wh + 10);
      const cristal = g.createLinearGradient(0, wy, 0, wy + wh);
      cristal.addColorStop(0, '#6f8ea3');
      cristal.addColorStop(1, '#4b6577');
      g.fillStyle = cristal;
      g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(255,255,255,.18)';
      g.beginPath();
      g.moveTo(wx + 6, wy + wh);
      g.lineTo(wx + 22, wy);
      g.lineTo(wx + 30, wy);
      g.lineTo(wx + 14, wy + wh);
      g.fill();
      const encendida = r() < 0.9;
      encendidas[fy][fx] = encendida;
      const tono = LUCES[Math.floor(r() * LUCES.length)];
      if (encendida) {
        l.fillStyle = tono;
        l.fillRect(wx, wy, ww, wh);
      }
      const cortina = r();
      if (cortina < 0.55) {
        const cc = CORTINAS[Math.floor(r() * CORTINAS.length)];
        g.fillStyle = cc;
        const cw = 10 + r() * 10;
        g.fillRect(wx, wy, cw, wh);
        g.fillRect(wx + ww - cw, wy, cw, wh);
        if (encendida) {
          l.fillStyle = 'rgba(0,0,0,.35)';
          l.fillRect(wx, wy, cw, wh);
          l.fillRect(wx + ww - cw, wy, cw, wh);
        }
      }
      const persiana = r() < 0.5 ? r() * 0.7 : 0;
      if (persiana > 0.05) {
        g.fillStyle = estilo.persiana;
        g.fillRect(wx, wy, ww, wh * persiana);
        g.fillStyle = 'rgba(0,0,0,.12)';
        for (let k = 4; k < wh * persiana; k += 5) g.fillRect(wx, wy + k, ww, 1);
        l.fillStyle = '#000';
        l.fillRect(wx, wy, ww, wh * persiana);
      }
      g.fillStyle = estilo.marco;
      g.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      g.fillRect(wx - 7, wy + wh + 4, ww + 14, 6);
      if (r() < estilo.balcon) {
        const bx = x0 + 10;
        const bw = C - 20;
        const by = wy + wh + 2;
        g.fillStyle = 'rgba(0,0,0,.15)';
        g.fillRect(bx, by + 22, bw, 4);
        g.fillStyle = '#3d3a3a';
        g.fillRect(bx, by, bw, 3);
        g.fillRect(bx, by + 20, bw, 3);
        for (let k = 0; k <= bw; k += 7) g.fillRect(bx + k, by, 2, 22);
        if (r() < 0.5) {
          const px = bx + 6 + r() * (bw - 20);
          g.fillStyle = '#b5653e';
          g.fillRect(px, by + 10, 10, 10);
          g.fillStyle = r() < 0.5 ? '#5f9a52' : '#e07a8a';
          g.beginPath();
          g.arc(px + 5, by + 8, 8, 0, Math.PI * 2);
          g.fill();
        }
      } else if (r() < 0.35) {
        g.fillStyle = 'rgba(80,80,80,.85)';
        g.fillRect(wx + ww + 9, wy + wh - 22, 16, 14);
        g.fillStyle = 'rgba(0,0,0,.25)';
        for (let k = 2; k < 14; k += 3) g.fillRect(wx + ww + 9, wy + wh - 22 + k, 16, 1);
      }
    }
  }
  return { mapa: textura(color), luz: textura(luz), encendidas };
}

function bajos(n) {
  const r = semilla(n * 104729 + 7);
  const C = 128;
  const color = lienzo(C * 4, C);
  const luz = lienzo(C * 4, C);
  const g = color.getContext('2d');
  const l = luz.getContext('2d');
  g.fillStyle = '#8f8a83';
  g.fillRect(0, 0, C * 4, C);
  l.fillStyle = '#000';
  l.fillRect(0, 0, C * 4, C);
  const TOLDOS = [['#d65d5d', '#f6efe6'], ['#4f8a6b', '#f6efe6'], ['#4a6fa5', '#f6efe6'], ['#e0a03c', '#fff6e0'], ['#8d5a97', '#f6efe6']];
  for (let k = 0; k < 4; k++) {
    const x0 = k * C;
    const tienda = r() < 0.8;
    g.fillStyle = '#d8d2c8';
    g.fillRect(x0 + 4, 8, C - 8, C - 8);
    if (tienda) {
      g.fillStyle = '#3c4a52';
      g.fillRect(x0 + 12, 46, C - 24, C - 50);
      g.fillStyle = 'rgba(255,255,255,.15)';
      g.fillRect(x0 + 16, 50, 18, C - 58);
      l.fillStyle = LUCES[k % LUCES.length];
      l.fillRect(x0 + 12, 46, C - 24, C - 50);
      g.fillStyle = '#e9e2d6';
      g.fillRect(x0 + C / 2 - 2, 46, 4, C - 50);
      const [a, b] = TOLDOS[Math.floor(r() * TOLDOS.length)];
      for (let s = 0; s < 8; s++) {
        g.fillStyle = s % 2 ? b : a;
        g.fillRect(x0 + 8 + s * ((C - 16) / 8), 22, (C - 16) / 8, 20);
      }
      g.fillStyle = a;
      for (let s = 0; s < 8; s++) {
        g.beginPath();
        g.arc(x0 + 8 + (s + 0.5) * ((C - 16) / 8), 42, (C - 16) / 16, 0, Math.PI);
        g.fill();
      }
    } else {
      g.fillStyle = '#6d6a66';
      g.fillRect(x0 + 12, 30, C - 24, C - 34);
      g.fillStyle = 'rgba(0,0,0,.2)';
      for (let s = 34; s < C - 4; s += 6) g.fillRect(x0 + 12, s, C - 24, 2);
      g.fillStyle = 'rgba(255,255,255,.55)';
      g.font = 'bold 14px sans-serif';
      g.fillText(['❤', '★', 'OK', 'XO'][Math.floor(r() * 4)], x0 + C / 2 - 8, 70);
    }
  }
  return { mapa: textura(color), luz: textura(luz) };
}

function asfalto(lineas = true) {
  const c = lienzo(128, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#4f5257';
  g.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 400; k++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';
    g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  if (!lineas) return textura(c);
  g.fillStyle = '#e9e3d0';
  g.fillRect(0, 62, 64, 4);
  g.fillStyle = 'rgba(233,227,208,.9)';
  g.fillRect(0, 4, 128, 3);
  g.fillRect(0, 121, 128, 3);
  return textura(c);
}

function acera() {
  const c = lienzo(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#c4bdb2';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(0,0,0,.08)';
  for (let k = 0; k <= 64; k += 16) {
    g.fillRect(k, 0, 1, 64);
    g.fillRect(0, k, 64, 1);
  }
  return textura(c);
}

function uvMundo(geo, techoV = false) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k);
    const y = pos.getY(k);
    const z = pos.getZ(k);
    const nx = nor.getX(k);
    const ny = nor.getY(k);
    const nz = nor.getZ(k);
    if (Math.abs(ny) > 0.5) uv.setXY(k, x / TEXEL, z / TEXEL);
    else if (Math.abs(nx) > 0.5) uv.setXY(k, (nx > 0 ? -z : z) / TEXEL, (y - CALLE_Y) / TEXEL);
    else uv.setXY(k, (nz > 0 ? x : -x) / TEXEL, (techoV ? y - CALLE_Y : y - CALLE_Y) / TEXEL);
  }
  uv.needsUpdate = true;
}

function caja(x0, x1, y0, y1, z0, z1) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  uvMundo(g);
  return g;
}

function trozo(geo, desde, hasta) {
  const g = new THREE.BufferGeometry();
  for (const nombre of ['position', 'normal', 'uv']) {
    const a = geo.attributes[nombre];
    g.setAttribute(nombre, new THREE.BufferAttribute(a.array.slice(desde * a.itemSize, hasta * a.itemSize), a.itemSize));
  }
  return g;
}

function partirCaja(geo) {
  const n = geo.index ? geo.toNonIndexed() : geo;
  const lados = mergeGeometries([trozo(n, 0, 12), trozo(n, 24, 36)]);
  const tapas = trozo(n, 12, 24);
  if (n !== geo) n.dispose();
  geo.dispose();
  return { lados, tapas };
}

function conIndice(geo, i) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  const a = new Float32Array(g.attributes.position.count).fill(i);
  g.setAttribute('aV', new THREE.BufferAttribute(a, 1));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aV'].includes(k)) g.deleteAttribute(k);
  return g;
}

export class Edificio {
  constructor(escena) {
    this.escena = escena;
    this.raiz = new THREE.Group();
    this.raiz.name = 'edificio';
    escena.add(this.raiz);
    this.estilos = ESTILOS.map((e, i) => {
      const f = fachada(e, i + 1);
      (this.encendidas || (this.encendidas = []))[i] = f.encendidas;
      return new THREE.MeshStandardMaterial({ map: f.mapa, emissiveMap: f.luz, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.92 });
    });
    const b = bajos(3);
    this.matBajos = new THREE.MeshStandardMaterial({ map: b.mapa, emissiveMap: b.luz, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
    this.matTecho = new THREE.MeshStandardMaterial({ color: 0x8e8a84, roughness: 1 });
    this.matCornisa = new THREE.MeshStandardMaterial({ color: 0xe8e1d6, roughness: 0.9 });
    this.matAsfalto = new THREE.MeshStandardMaterial({ map: asfalto(), roughness: 1 });
    this.matAcera = new THREE.MeshStandardMaterial({ map: acera(), roughness: 1 });
    this.matFarola = new THREE.MeshStandardMaterial({ color: 0x3b3f44, roughness: 0.6, metalness: 0.4 });
    this.matBombilla = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd27a, emissiveIntensity: 0.1 });
    this.matTronco = new THREE.MeshStandardMaterial({ color: 0x7a5a3e, roughness: 1 });
    this.matHoja = new THREE.MeshStandardMaterial({ color: 0x6aa35a, roughness: 1 });
    this.matFaro = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0b0, emissiveIntensity: 0.2 });
    this.matPiloto = new THREE.MeshStandardMaterial({ color: 0xd04040, emissive: 0xff3030, emissiveIntensity: 0.2 });
    this.uEsc = { value: new Float32Array(MAX_VECINOS).fill(1) };
    const hundible = m => {
      const c = m.clone();
      c.onBeforeCompile = sh => {
        sh.uniforms.uEsc = this.uEsc;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\nattribute float aV;\nuniform float uEsc[${MAX_VECINOS}];`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed.y = ${CALLE_Y.toFixed(2)} + (transformed.y - (${CALLE_Y.toFixed(2)})) * uEsc[int(aV + 0.5)];`);
      };
      c.customProgramCacheKey = () => 'ciudad-hundible';
      return c;
    };
    this.cEstilos = this.estilos.map(hundible);
    this.cBajos = hundible(this.matBajos);
    this.cTecho = hundible(this.matTecho);
    this.cCornisa = hundible(this.matCornisa);
    this.cFarola = hundible(this.matFarola);
    this.cToldos = [0xd65d5d, 0x4f8a6b, 0x4a6fa5, 0xe0a03c, 0x8d5a97].map(c => hundible(new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })));
    this.cPanel = hundible(new THREE.MeshStandardMaterial({ color: 0x24375a, roughness: 0.25, metalness: 0.5 }));
    this.cAire = hundible(new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.6, metalness: 0.3 }));
    this.vecinos = [];
    this.coches = [];
    this.peatones = [];
    this.medidas = null;
    this.pisosV = new PisosVecinos(this.raiz);
    let maq = '1';
    try {
      maq = localStorage.getItem('hogar-maqueta') ?? '1';
    } catch (e) {}
    this.maqueta = maq !== '0';
    this.tipo = null;
    this.noche = 0;
    this.t = 0;
  }

  construir(ancho, fondo, extraX = 0) {
    const clave = `${ancho}x${fondo}+${extraX}`;
    if (this.medidas === clave) return;
    this.medidas = clave;
    this.extraX = extraX;
    this.limpiar();
    const W = ancho + GROSOR * 2 + 0.2;
    const D = fondo + GROSOR * 2 + 0.2;
    this.W = W;
    this.D = D;
    const R = this.raiz;
    const fach = this.estilos[0];

    this.bloque = new THREE.Group();
    const bajo = new THREE.Mesh(caja(-W / 2, W / 2, CALLE_Y, CALLE_Y + PISO, -D / 2, D / 2), [this.matBajos, this.matBajos, this.matTecho, this.matTecho, this.matBajos, this.matBajos]);
    const voladizo = new THREE.Mesh(caja(-W / 2 - 0.12, W / 2 + 0.12, CALLE_Y + PISO - 0.18, CALLE_Y + PISO, -D / 2 - 0.12, D / 2 + 0.12), this.matCornisa);
    this.bloque.add(bajo, voladizo);
    R.add(this.bloque);
    const niveles = [];
    for (let k = 1; k < ABAJO; k++) niveles.push(BASE_Y - k * PISO + 0.5);
    this.pisosV.construir(ancho, fondo, niveles);

    this.calles(W, D);
    this.ciudad(W, D);
    const lienzoHalo = document.createElement('canvas');
    lienzoHalo.width = lienzoHalo.height = 128;
    const gh = lienzoHalo.getContext('2d');
    const grad = gh.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,200,120,1)');
    grad.addColorStop(0.45, 'rgba(255,170,90,0.45)');
    grad.addColorStop(1, 'rgba(255,150,70,0)');
    gh.fillStyle = grad;
    gh.fillRect(0, 0, 128, 128);
    const texHalo = new THREE.CanvasTexture(lienzoHalo);
    texHalo.colorSpace = THREE.SRGBColorSpace;
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texHalo, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.halo.scale.setScalar(Math.hypot(W, D) * 2.4);
    this.halo.position.set(0, 0.6, 0);
    this.halo.renderOrder = 50;
    R.add(this.halo);
    this.marcarCapa();
    this.aplicarTipo();
  }

  limpiar() {
    const borrar = [];
    this.pisosV.limpiar();
    this.raiz.remove(this.pisosV.raiz);
    this.raiz.traverse(o => {
      if (o.geometry && !o.geometry.userData.compartida) borrar.push(o.geometry);
    });
    borrar.forEach(g => g.dispose());
    this.peatones = [];
    this.raiz.clear();
    if (this.sil) this.sil.activos = [];
    this.raiz.add(this.pisosV.raiz);
    this.vecinos = [];
    this.coches = [];
    this.calle = null;
  }

  calles(W, D) {
    const R = this.raiz;
    const zC = -(D / 2 + ACERA + ANCHO_CALLE / 2);
    const xC = -(W / 2 + ACERA + ANCHO_CALLE / 2);
    this.zCalle = zC;
    this.xCalle = xC;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), this.matAcera);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = CALLE_Y;
    const uv = suelo.geometry.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 60, uv.getY(k) * 60);
    R.add(suelo);
    const tex = this.matAsfalto.map;
    tex.repeat.set(1, 1);
    const calle = (largo, horizontal, c) => {
      const geo = new THREE.PlaneGeometry(largo, ANCHO_CALLE);
      const u = geo.attributes.uv;
      for (let k = 0; k < u.count; k++) u.setXY(k, u.getX(k) * largo / ANCHO_CALLE, u.getY(k));
      const m = new THREE.Mesh(geo, this.matAsfalto);
      m.rotation.x = -Math.PI / 2;
      if (!horizontal) m.rotation.z = Math.PI / 2;
      m.position.set(horizontal ? 0 : c, CALLE_Y + 0.02, horizontal ? c : 0);
      R.add(m);
    };
    calle(240, true, zC);
    calle(240, false, xC);
    calle(240, true, zC - 44);
    calle(240, false, xC + 46);
    const matCruce = this.matCruce || (this.matCruce = new THREE.MeshStandardMaterial({ map: asfalto(false), roughness: 1 }));
    const cruces = [];
    for (const cx of [xC, xC + 46]) for (const cz of [zC, zC - 44]) {
      const g = new THREE.PlaneGeometry(ANCHO_CALLE, ANCHO_CALLE);
      g.rotateX(-Math.PI / 2);
      g.translate(cx, CALLE_Y + 0.026, cz);
      cruces.push(g);
    }
    R.add(new THREE.Mesh(mergeGeometries(cruces), matCruce));
    const rayas = [];
    const LP = ANCHO_CALLE / 2 + 2.2;
    this.lineaPeatones = LP;
    for (let k = 0; k < 8; k++) {
      const off = -ANCHO_CALLE / 2 + 0.45 + k * 0.85;
      for (const sg of [-1, 1]) {
        const a = new THREE.BoxGeometry(0.45, 0.01, 2.2);
        a.translate(xC + off, CALLE_Y + 0.03, zC + sg * LP);
        const b2 = new THREE.BoxGeometry(2.2, 0.01, 0.45);
        b2.translate(xC + sg * LP, CALLE_Y + 0.03, zC + off);
        rayas.push(a.toNonIndexed(), b2.toNonIndexed());
      }
    }
    for (const sg of [-1, 1]) {
      const a = new THREE.BoxGeometry(ANCHO_CALLE / 2, 0.01, 0.2);
      a.translate(xC + sg * ANCHO_CALLE / 4, CALLE_Y + 0.03, zC + sg * (LP + 1.6));
      const b2 = new THREE.BoxGeometry(0.2, 0.01, ANCHO_CALLE / 2);
      b2.translate(xC + sg * (LP + 1.6), CALLE_Y + 0.03, zC - sg * ANCHO_CALLE / 4);
      rayas.push(a.toNonIndexed(), b2.toNonIndexed());
    }
    R.add(new THREE.Mesh(mergeGeometries(rayas), new THREE.MeshStandardMaterial({ color: 0xefe9da, roughness: 1 })));
    const bordes = [];
    for (const [h, c] of [[true, zC], [false, xC], [true, zC - 44], [false, xC + 46]]) {
      for (const sg of [-1, 1]) {
        const b = new THREE.BoxGeometry(h ? 240 : 0.18, 0.14, h ? 0.18 : 240);
        b.translate(h ? 0 : c + sg * ANCHO_CALLE / 2, CALLE_Y + 0.07, h ? c + sg * ANCHO_CALLE / 2 : 0);
        bordes.push(b.toNonIndexed());
      }
    }
    R.add(new THREE.Mesh(mergeGeometries(bordes), new THREE.MeshStandardMaterial({ color: 0xa9a39a, roughness: 1 })));

    const farolas = [];
    const arboles = [];
    for (let k = -60; k <= 60; k += 9) {
      for (const s of [-1, 1]) {
        farolas.push([k + 2, zC + s * (ANCHO_CALLE / 2 + 0.5), s > 0 ? Math.PI : 0, true]);
        farolas.push([xC + s * (ANCHO_CALLE / 2 + 0.5), k + 6, s > 0 ? -Math.PI / 2 : Math.PI / 2, false]);
        arboles.push([k + 6.5, zC + s * (ANCHO_CALLE / 2 + 1.3)]);
        arboles.push([xC + s * (ANCHO_CALLE / 2 + 1.3), k + 1.5]);
      }
    }
    const enCalle = (x, z) => [zC, zC - 44].some(c => Math.abs(z - c) < ANCHO_CALLE / 2 + 0.3) || [xC, xC + 46].some(c => Math.abs(x - c) < ANCHO_CALLE / 2 + 0.3);
    const libre = (x, z) => !(Math.abs(x) < W / 2 + 3 && Math.abs(z) < D / 2 + 3) && !enCalle(x, z)
      && !(Math.abs(x - xC) < LP + 1.4 && Math.abs(z - zC) < LP + 1.4) && !(Math.abs(z - (zC - ANCHO_CALLE / 2 - 1.4)) < 1.5 && x > 3 && x < 9.5);
    const fs = farolas.filter(([x, z]) => libre(x, z));
    const poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6), this.matFarola, fs.length);
    const brazo = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.9), this.matFarola, fs.length);
    const foco = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 8), this.matBombilla, fs.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const uno = new THREE.Vector3(1, 1, 1);
    fs.forEach(([x, z, rot, horiz], i) => {
      m4.compose(v.set(x, CALLE_Y + 2.1, z), q.identity(), uno);
      poste.setMatrixAt(i, m4);
      const dx = horiz ? 0 : (rot > 0 ? 0.45 : -0.45);
      const dz = horiz ? (rot === 0 ? 0.45 : -0.45) : 0;
      e.set(0, horiz ? 0 : Math.PI / 2, 0);
      m4.compose(v.set(x + dx, CALLE_Y + 4.15, z + dz), q.setFromEuler(e), uno);
      brazo.setMatrixAt(i, m4);
      m4.compose(v.set(x + dx * 2, CALLE_Y + 4.0, z + dz * 2), q.identity(), uno);
      foco.setMatrixAt(i, m4);
    });
    R.add(poste, brazo, foco);
    const as = arboles.filter(([x, z]) => libre(x, z));
    const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 2.4, 6), this.matTronco, as.length);
    const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 0), this.matHoja, as.length);
    const r = semilla(77);
    as.forEach(([x, z], i) => {
      m4.compose(v.set(x, CALLE_Y + 1.2, z), q.identity(), uno);
      tronco.setMatrixAt(i, m4);
      const s = 0.8 + r() * 0.5;
      e.set(r(), r(), 0);
      m4.compose(v.set(x, CALLE_Y + 3.05 + s * 0.35, z), q.setFromEuler(e), new THREE.Vector3(s * 0.85, s * 1.05, s * 0.85));
      copa.setMatrixAt(i, m4);
    });
    R.add(tronco, copa);

    this.calle = new Calle(R, { calleY: CALLE_Y, anchoCalle: ANCHO_CALLE, acera: ACERA, matFaro: this.matFaro, matPiloto: this.matPiloto, azar: r });
    this.calle.construir(W, D, zC, xC);
    this.calle.ponerNoche(this.noche || 0);
  }

  ciudad(W, D) {
    const r = semilla(2024);
    const R = this.raiz;
    const zC = this.zCalle;
    const xC = this.xCalle;
    const ocupado = [];
    const choca = (x0, x1, z0, z1) => {
      if (x1 > -W / 2 - 3.2 && x0 < W / 2 + 3.2 + (this.extraX || 0) && z1 > -D / 2 - 3.2 && z0 < D / 2 + 3.2) return true;
      for (const c of [zC, zC - 44]) if (z1 > c - ANCHO_CALLE / 2 - ACERA && z0 < c + ANCHO_CALLE / 2 + ACERA) return true;
      for (const c of [xC, xC + 46]) if (x1 > c - ANCHO_CALLE / 2 - ACERA && x0 < c + ANCHO_CALLE / 2 + ACERA) return true;
      return ocupado.some(o => x1 > o[0] && x0 < o[1] && z1 > o[2] && z0 < o[3]);
    };
    const cubos = new Map();
    const echar = (mat, geo, idx) => {
      if (!cubos.has(mat)) cubos.set(mat, []);
      cubos.get(mat).push(conIndice(geo, idx));
    };
    const poner = (x0, x1, z0, z1, pisos) => {
      if (this.vecinos.length >= MAX_VECINOS) return false;
      if (choca(x0, x1, z0, z1)) return false;
      ocupado.push([x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3]);
      const idx = this.vecinos.length;
      const alto = pisos * PISO;
      const estilo = Math.floor(r() * this.cEstilos.length);
      const fach = this.cEstilos[estilo];
      const cuerpo = partirCaja(caja(x0, x1, CALLE_Y + PISO, CALLE_Y + alto, z0, z1));
      echar(fach, cuerpo.lados, idx);
      echar(this.cTecho, cuerpo.tapas, idx);
      const bajo = partirCaja(caja(x0, x1, CALLE_Y, CALLE_Y + PISO, z0, z1));
      echar(this.cBajos, bajo.lados, idx);
      bajo.tapas.dispose();
      echar(this.cCornisa, caja(x0 - 0.1, x1 + 0.1, CALLE_Y + alto, CALLE_Y + alto + 0.3, z0 - 0.1, z1 + 0.1), idx);
      if (r() < 0.6) {
        const tx = x0 + 1 + r() * (x1 - x0 - 2);
        const tz = z0 + 1 + r() * (z1 - z0 - 2);
        const deposito = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 10);
        deposito.translate(tx, CALLE_Y + alto + 0.9, tz);
        echar(this.cCornisa, deposito, idx);
      }
      for (const [cara, a0, a1] of [['x0', z0, z1], ['x1', z0, z1], ['z0', x0, x1], ['z1', x0, x1]]) {
        const largo = a1 - a0;
        const n = Math.max(1, Math.floor(largo / 3));
        for (let t = 0; t < n; t++) {
          if (r() < 0.35) continue;
          const c = a0 + (t + 0.5) * largo / n;
          const w = Math.min(2.4, largo / n - 0.4);
          const geo = new THREE.BoxGeometry(cara[0] === 'x' ? 0.8 : w, 0.06, cara[0] === 'x' ? w : 0.8);
          geo.rotateX(cara === 'z1' ? 0.3 : cara === 'z0' ? -0.3 : 0);
          geo.rotateZ(cara === 'x1' ? -0.3 : cara === 'x0' ? 0.3 : 0);
          const px = cara === 'x0' ? x0 - 0.38 : cara === 'x1' ? x1 + 0.38 : c;
          const pz = cara === 'z0' ? z0 - 0.38 : cara === 'z1' ? z1 + 0.38 : c;
          geo.translate(px, CALLE_Y + 2.5, pz);
          echar(this.cToldos[Math.floor(r() * this.cToldos.length)], geo, idx);
        }
      }
      if (r() < 0.5) {
        const cx2 = x0 + 1.3 + r() * Math.max(0.1, x1 - x0 - 2.6);
        const cz2 = z0 + 1.3 + r() * Math.max(0.1, z1 - z0 - 2.6);
        echar(this.cCornisa, caja(cx2 - 1, cx2 + 1, CALLE_Y + alto + 0.3, CALLE_Y + alto + 2.6, cz2 - 0.8, cz2 + 0.8), idx);
        echar(this.cTecho, caja(cx2 - 1.1, cx2 + 1.1, CALLE_Y + alto + 2.6, CALLE_Y + alto + 2.75, cz2 - 0.9, cz2 + 0.9), idx);
      }
      if (r() < 0.4) {
        const ax2 = x0 + 0.6 + r() * (x1 - x0 - 1.2);
        const az2 = z0 + 0.6 + r() * (z1 - z0 - 1.2);
        const ant = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5);
        ant.translate(ax2, CALLE_Y + alto + 1.4, az2);
        echar(this.cFarola, ant, idx);
        const varilla = new THREE.BoxGeometry(0.8, 0.03, 0.03);
        varilla.translate(ax2, CALLE_Y + alto + 2.1, az2);
        echar(this.cFarola, varilla, idx);
      }
      if (r() < 0.35) {
        for (let pnl = 0; pnl < 3; pnl++) {
          const geo = new THREE.BoxGeometry(1.6, 0.05, 0.9);
          geo.rotateX(-0.45);
          geo.translate(x0 + 1.2 + pnl * 0.1, CALLE_Y + alto + 0.75, z0 + 1 + pnl * 1.1);
          if (z0 + 1 + pnl * 1.1 < z1 - 0.5 && x0 + 2 < x1) echar(this.cPanel, geo, idx);
          else geo.dispose();
        }
      }
      if (r() < 0.5) {
        const ax = x0 + 0.8 + r() * (x1 - x0 - 1.6);
        const az = z0 + 0.8 + r() * (z1 - z0 - 1.6);
        echar(this.cAire, caja(ax - 0.4, ax + 0.4, CALLE_Y + alto + 0.3, CALLE_Y + alto + 0.8, az - 0.3, az + 0.3), idx);
      }
      this.vecinos.push({ idx, estilo, x0, x1, z0, z1, pisos, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, top: CALLE_Y + alto + 0.3, escala: 1, obj: 1 });
      return true;
    };
    this.alTerminarCiudad = () => {
      for (const [mat, lista] of cubos) {
        const geo = mergeGeometries(lista);
        lista.forEach(g => g.dispose());
        const m = new THREE.Mesh(geo, mat);
        m.frustumCulled = false;
        R.add(m);
      }
    };
    const altos = [4, 5, 6, 7, 8, 9, 10];
    const pisosAl = (cerca) => (cerca ? altos[Math.floor(r() * altos.length)] : 3 + Math.floor(r() * 9));
    for (let gx = -54; gx <= 54; gx += 8.5) {
      for (let gz = -54; gz <= 54; gz += 8.5) {
        if (Math.hypot(gx, gz) > 60) continue;
        const ax = 3 + r() * 1.6;
        const az = 3 + r() * 1.6;
        const x = gx + (r() - 0.5) * 2;
        const z = gz + (r() - 0.5) * 2;
        poner(x - ax, x + ax, z - az, z + az, pisosAl(Math.hypot(gx, gz) < 20));
      }
    }
    this.alTerminarCiudad();
    this.uEsc.value.fill(1);
  }

  marcarCapa() {
    this.raiz.traverse(o => o.layers.set(2));
  }

  renderizar(renderer, escena, camara, luces) {
    if (!this.bloque || !this.raiz.visible) {
      renderer.render(escena, camara);
      return;
    }
    const mascara = camara.layers.mask;
    const cerca = camara.near;
    const lejos = camara.far;
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clear();
    luces.forEach(l => l.layers.enable(2));
    camara.layers.set(2);
    camara.near = -40;
    camara.far = 170;
    camara.updateProjectionMatrix();
    const sombras = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    if (this.maqueta) {
      renderer.getDrawingBufferSize(this.tamBuf || (this.tamBuf = new THREE.Vector2()));
      const w = Math.max(2, Math.floor(this.tamBuf.x * 0.5));
      const h = Math.max(2, Math.floor(this.tamBuf.y * 0.5));
      if (!this.rt || this.rt.width !== w || this.rt.height !== h) {
        if (this.rt) this.rt.dispose();
        this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true });
        this.rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
      }
      const colorPrevio = renderer.getClearColor(this.colorPrevio || (this.colorPrevio = new THREE.Color()));
      const alfaPrevio = renderer.getClearAlpha();
      renderer.setRenderTarget(this.rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(escena, camara);
      renderer.setRenderTarget(null);
      renderer.setClearColor(colorPrevio, alfaPrevio);
      const q = this.cuadro();
      q.material.uniforms.tex.value = this.rt.texture;
      q.material.uniforms.texel.value.set(1 / w, 1 / h);
      if (this.escena.fog) q.material.uniforms.bruma.value.copy(this.escena.fog.color);
      const v = this.v3f || (this.v3f = new THREE.Vector3());
      let x0 = 1;
      let y0 = 1;
      let x1 = 0;
      let y1 = 0;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [-0.5, ALTO_SALA]) {
        v.set(sx * this.W / 2 + this.raiz.position.x, yy, sz * this.D / 2).project(camara);
        const u = v.x * 0.5 + 0.5;
        const w2 = v.y * 0.5 + 0.5;
        x0 = Math.min(x0, u);
        x1 = Math.max(x1, u);
        y0 = Math.min(y0, w2);
        y1 = Math.max(y1, w2);
      }
      q.material.uniforms.foco.value.set(x0, y0, x1, y1);
      renderer.render(q.escena, q.camara);
    } else renderer.render(escena, camara);
    renderer.shadowMap.autoUpdate = sombras;
    renderer.clearDepth();
    camara.layers.mask = mascara;
    camara.near = cerca;
    camara.far = lejos;
    camara.updateProjectionMatrix();
    renderer.render(escena, camara);
    if (this.calle && this.calle.pajaros.some(b => b.visible)) {
      luces.forEach(l => l.layers.enable(4));
      renderer.clearDepth();
      camara.layers.set(4);
      camara.near = -100;
      camara.far = 300;
      camara.updateProjectionMatrix();
      const sombras2 = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      renderer.render(escena, camara);
      renderer.shadowMap.autoUpdate = sombras2;
      camara.layers.mask = mascara;
      camara.near = cerca;
      camara.far = lejos;
      camara.updateProjectionMatrix();
    }
    renderer.autoClear = auto;
  }

  cuadro() {
    if (this.q) return this.q;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tex: { value: null },
        texel: { value: new THREE.Vector2(1, 1) },
        bruma: { value: new THREE.Color(0xdfe8f0) },
        foco: { value: new THREE.Vector4(0.3, 0.3, 0.7, 0.7) }
      },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tex;
        uniform vec2 texel;
        uniform vec3 bruma;
        uniform vec4 foco;
        varying vec2 vUv;
        const vec2 DISCO[12] = vec2[12](
          vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
          vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
          vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
        );
        void main() {
          vec2 fuera = max(vec2(0.0), max(foco.xy - vUv, vUv - foco.zw));
          float lejos = smoothstep(0.0, 0.3, length(fuera * vec2(1.0, 1.4)));
          float radio = 0.25 + 1.25 * lejos;
          vec4 c = texture2D(tex, vUv);
          vec3 suma = c.rgb * c.a;
          float alfa = c.a;
          for (int i = 0; i < 12; i++) {
            vec4 m = texture2D(tex, vUv + DISCO[i] * texel * radio);
            suma += m.rgb * m.a;
            alfa += m.a;
          }
          suma /= 13.0;
          alfa /= 13.0;
          vec3 col = alfa > 0.001 ? suma / alfa : vec3(0.0);
          float l = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, vec3(l), 0.1 + 0.15 * lejos);
          col = mix(col, bruma, 0.04 + 0.1 * lejos);
          gl_FragColor = vec4(col, alfa);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          gl_FragColor.rgb *= gl_FragColor.a;
        }`,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: true
    });
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    malla.frustumCulled = false;
    const escena = new THREE.Scene();
    escena.add(malla);
    this.q = { escena, camara: new THREE.Camera(), material };
    return this.q;
  }

  siluetas(dt, cam) {
    if (!this.sil) {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = '#000';
      const persona = (x, brazo) => {
        g.beginPath();
        g.arc(x + 32, 30, 15, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(x + 6, 128);
        g.quadraticCurveTo(x + 4, 58, x + 32, 52);
        g.quadraticCurveTo(x + 60, 58, x + 58, 128);
        g.fill();
        if (brazo) {
          g.save();
          g.translate(x + 52, 66);
          g.rotate(-0.9);
          g.fillRect(0, -6, 40, 12);
          g.restore();
        }
      };
      persona(0, false);
      persona(64, true);
      g.beginPath();
      g.ellipse(160, 108, 26, 16, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.arc(178, 86, 12, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(170, 78); g.lineTo(172, 64); g.lineTo(178, 75); g.fill();
      g.beginPath();
      g.moveTo(184, 75); g.lineTo(188, 63); g.lineTo(190, 78); g.fill();
      g.fillRect(132, 96, 6, 26);
      persona(192, false);
      const tex = new THREE.CanvasTexture(c);
      this.sil = { tex, activos: [], t: 0 };
    }
    const S = this.sil;
    S.t -= dt;
    const noche = this.noche || 0;
    if (S.t <= 0 && noche > 0.35 && S.activos.length < 7 && cam) {
      S.t = 0.5 + Math.random() * 1.2;
      const d = cam.direccionHorizontal();
      const candidatos = this.vecinos.filter(b => b.escala > 0.98 && b.pisos > 2);
      const b = candidatos[Math.floor(Math.random() * candidatos.length)];
      if (b) {
        const caras = [[0, 1, b.z1], [0, -1, b.z0], [1, 0, b.x1], [-1, 0, b.x0]].filter(([nx, nz]) => nx * d.x + nz * d.z > 0.25);
        const cara = caras[Math.floor(Math.random() * caras.length)];
        if (cara) this.nuevaSilueta(b, cara);
      }
    }
    for (const a of [...S.activos]) {
      a.t += dt;
      const u = a.t / a.dur;
      const fade = Math.min(1, a.t / 0.5, (a.dur - a.t) / 0.5);
      a.m.material.opacity = Math.max(0, fade) * a.opac;
      if (a.mueve) a.m.position.addScaledVector(a.dir, a.vel * dt);
      if (a.salta) a.m.position.y = a.y0 + Math.abs(Math.sin(a.t * 6)) * 0.12;
      if (u >= 1) {
        a.m.removeFromParent();
        a.m.material.dispose();
        S.activos = S.activos.filter(x => x !== a);
      }
    }
  }

  nuevaSilueta(b, [nx, nz, plano]) {
    const S = this.sil;
    const a0 = nz ? b.x0 : b.z0;
    const a1 = nz ? b.x1 : b.z1;
    const signo = nz > 0 ? 1 : nz < 0 ? -1 : nx > 0 ? -1 : 1;
    const opciones = [];
    for (let k = -30; k <= 30; k++) {
      const local = 3 * k + 1.5;
      const mundo = local * signo;
      if (mundo < a0 + 0.8 || mundo > a1 - 0.8) continue;
      opciones.push([local, mundo]);
    }
    if (!opciones.length) return;
    const [local, mundo] = opciones[Math.floor(Math.random() * opciones.length)];
    const n = 1 + Math.floor(Math.random() * (b.pisos - 1));
    const fx = (((Math.floor(local / 3)) % 4) + 4) % 4;
    const fy = 3 - (n % 4);
    const tabla = this.encendidas && this.encendidas[b.estilo];
    if (!tabla || !tabla[fy] || !tabla[fy][fx]) return;
    const tipo = Math.floor(Math.random() * 4);
    const geo = this.geoSil || (this.geoSil = new THREE.PlaneGeometry(0.78, 1.0));
    const mat = new THREE.MeshBasicMaterial({ map: S.tex, transparent: true, opacity: 0, depthWrite: false, color: 0x1a120c });
    const m = new THREE.Mesh(geo.clone(), mat);
    const uv = m.geometry.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (tipo + uv.getX(k)) / 4);
    const yBase = CALLE_Y + n * PISO + 0.84;
    const alto = tipo === 2 ? 0.6 : 1.3;
    m.scale.set(tipo === 2 ? 0.85 : 1, alto, 1);
    const y0 = yBase + alto / 2 - 0.02;
    const off = 0.03;
    if (nz) m.position.set(mundo, y0, plano + nz * off);
    else m.position.set(plano + nx * off, y0, mundo);
    m.rotation.y = Math.atan2(nx, nz);
    m.layers.set(2);
    this.raiz.add(m);
    const lateral = nz ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const mueve = tipo !== 2 && Math.random() < 0.55;
    const dir = lateral.multiplyScalar(Math.random() < 0.5 ? 1 : -1);
    if (mueve) m.position.addScaledVector(dir, -0.2);
    const dur = mueve ? 2.2 + Math.random() * 1.5 : 3 + Math.random() * 4;
    S.activos.push({ m, t: 0, dur, opac: 0.55 + Math.random() * 0.25, mueve, dir, vel: mueve ? 0.4 / dur : 0, salta: tipo === 1 && Math.random() < 0.4, y0 });
  }

  ponerTipo(tipo) {
    this.tipo = tipo || null;
    this.aplicarTipo();
  }

  aplicarTipo() {
    if (!this.bloque) return;
    const jardin = this.tipo === 'jardin' || this.tipo === 'casa';
    this.raiz.position.y = jardin ? ABAJO * PISO : 0;
    this.bloque.visible = !jardin;
    this.pisosV.raiz.visible = !jardin;
  }

  ponerNoche(k, colorNiebla) {
    this.noche = k;
    const brillo = k * 1.25;
    for (const m of [...this.estilos, ...(this.cEstilos || [])]) m.emissiveIntensity = brillo;
    this.matBajos.emissiveIntensity = k * 0.8;
    if (this.cBajos) this.cBajos.emissiveIntensity = k * 0.8;
    this.matBombilla.emissiveIntensity = 0.1 + k * 1.6;
    this.matFaro.emissiveIntensity = 0.2 + k * 1.5;
    this.matPiloto.emissiveIntensity = 0.2 + k * 1.2;
    this.pisosV.ponerNoche(k);
    if (this.halo) this.halo.material.opacity = this.maqueta ? Math.min(0.14, k * 0.14) : 0;
    if (this.calle) this.calle.ponerNoche(k);
    if (colorNiebla) {
      if (!this.escena.fog) this.escena.fog = new THREE.Fog(colorNiebla, 32, 110);
      else this.escena.fog.color.copy(colorNiebla);
    }
  }

  actualizar(dt, cam, paredesVisibles) {
    if (!this.bloque) return;
    this.t += dt;
    if (this.pisosV.raiz.visible) this.pisosV.actualizar(dt, cam ? cam.direccionHorizontal() : null, null);
    this.siluetas(dt, cam);
    if (this.calle) {
      this.calle.calma = cam && cam.zoomActual > (cam.zoomFit || 1.2) * 0.95 ? 0.75 : 1;
      this.calle.actualizar(dt);
    }
    if (!cam) return;
    const ang = cam.angulo;
    const alt = cam.altura;
    const dirX = Math.sin(ang);
    const dirZ = Math.cos(ang);
    const derX = Math.cos(ang);
    const derZ = -Math.sin(ang);
    const sa = Math.sin(alt);
    const ca = Math.cos(alt);
    const ox = cam.objetivo.x - this.raiz.position.x;
    const oz = cam.objetivo.z;
    const salaAncho = this.W / 2 * Math.abs(derX) + this.D / 2 * Math.abs(derZ);
    const salaHacia = this.W / 2 * Math.abs(dirX) + this.D / 2 * Math.abs(dirZ);
    const sube = this.raiz.position.y;
    const salaC = -(ox * dirX + oz * dirZ);
    const salaArriba = (ALTO_SALA + 0.4) * ca - (salaC - salaHacia) * sa;
    const salaBajo = (this.tipo === 'jardin' || this.tipo === 'casa' ? BASE_Y - 1.2 : CALLE_Y + PISO - 0.6) * ca - (salaHacia + salaC) * sa;
    const k = Math.min(1, dt * 7);
    for (const b of this.vecinos) {
      const rx = b.cx - ox;
      const rz = b.cz - oz;
      const hacia = rx * dirX + rz * dirZ;
      const ext = b.hx * Math.abs(dirX) + b.hz * Math.abs(dirZ);
      const lado = rx * derX + rz * derZ;
      const anchoB = b.hx * Math.abs(derX) + b.hz * Math.abs(derZ);
      const pantallaArriba = (b.top + sube) * ca - (hacia + ext) * sa;
      const tapa = hacia + ext > salaC - 0.5 && Math.abs(lado - (-ox * derX - oz * derZ)) < anchoB + salaAncho + 0.4 && pantallaArriba > salaBajo;
      let obj = tapa ? 0.02 : 1;
      if (!tapa && this.maqueta && hacia < salaC && Math.hypot(rx + ox, rz + oz) < 24 && Math.abs(lado - (-ox * derX - oz * derZ)) < anchoB + salaAncho + 2.5) {
        const limite = salaArriba + 1.2;
        const topePermitido = (limite + (hacia - ext) * sa) / ca - sube;
        const alto = b.top - CALLE_Y;
        obj = THREE.MathUtils.clamp((topePermitido - CALLE_Y) / alto, 0.3, 1);
      }
      b.obj = obj;
      if (Math.abs(b.escala - b.obj) > 0.001) {
        b.escala += (b.obj - b.escala) * k;
        this.uEsc.value[b.idx] = b.escala;
      }
    }
  }
}
