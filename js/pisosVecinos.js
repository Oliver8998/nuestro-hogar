import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { construirPiezas, liberar } from './modelos.js';
import { infoItem } from './catalogo.js';
import { crearPersonaje, animarPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';
import { crearDron } from './entregas.js';

const ALTO = 2.5;
const GROSOR = 0.15;
const ESCALA_PERSONA = 1.25;
const GENTE = ['lola', 'mateo', 'sol', 'mama', 'ramon', 'amigos'];
const CORTINAS_PISO = [0xf4c7c3, 0xcfe3ef, 0xfff3c4, 0xe6dcf1, 0xd8ecd3, 0xf6e9d6];
const FACHADAS = [0xe9d9c3, 0xe3c7a8, 0xd9b8a3, 0xe7dccb];
const PERSIANAS = [0xd9a066, 0x7a9c86, 0xb86a5a, 0x8f8a83, 0xe2d2b8];
const TOLDOS_PISO = [[0xd65d5d, 0xf6efe6], [0x4f8a6b, 0xf6efe6], [0x4a6fa5, 0xf6efe6], [0xe0a03c, 0xfff6e0]];
const TIPOS_VENTANA = [
  { w: 1.3, s: 0.75, t: 2.2 },
  { w: 1.3, s: 0.75, t: 2.2 },
  { w: 0.95, s: 0.12, t: 2.25, francesa: true },
  { w: 2.0, s: 0.9, t: 2.1 },
  { w: 0.7, s: 1.35, t: 2.05, peq: true },
  { w: 1.25, s: 0.04, t: 2.25, balcon: true },
  { w: 1.25, s: 0.04, t: 2.25, balcon: true }
];

function semilla(n) {
  let s = Math.abs(Math.floor(n)) % 2147483647 || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DECORADOS = [
  { pared: 0xc9dbe6, suelo: 0x8a6748, muebles: [['sofa', 'fondo', 0], ['tele', 'frente', 0], ['alfombra', 'centro', 0], ['planta', 'esquina', 0], ['lampara', 'esquina', 1], ['estanteria', 'izquierda', 0.2]] },
  { pared: 0xf1d9c6, suelo: 0x7e5f45, muebles: [['cama', 'fondo', -0.15], ['comoda', 'izquierda', -0.2], ['escritorio', 'derecha', 0.25], ['silla', 'derechaDentro', 0.25], ['planta', 'esquina', 2], ['alfombra', 'centroLado', 0]] },
  { pared: 0xe3e8cf, suelo: 0x9c8d78, muebles: [['mesa', 'centro', 0], ['silla', 'mesaA', 0], ['silla', 'mesaB', 0], ['estanteria', 'fondo', 0.25], ['sofa', 'izquierda', 0], ['planta', 'esquina', 3]] },
  { pared: 0xf3e3ee, suelo: 0x87674c, muebles: [['sofa', 'izquierda', 0], ['tele', 'derecha', 0], ['alfombra', 'centro', 0], ['comoda', 'fondo', 0.25], ['lampara', 'esquina', 0], ['planta', 'esquina', 2]] }
];

function mascotaSuelta(especie, clip) {
  const p = crearModeloMascota(especie);
  if (!p) return null;
  const obj = p.raiz || p;
  if (p.acciones && p.acciones[clip]) {
    Object.values(p.acciones).forEach(a => a.stop());
    p.acciones[clip].play();
  }
  obj.userData.mixer = p.mixer || null;
  return obj;
}

function fusionar(grupo) {
  grupo.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(grupo.matrixWorld).invert();
  const cubos = new Map();
  const quitar = [];
  grupo.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || o.userData.suelta || Array.isArray(o.material)) return;
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.normal) return;
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const m = o.material;
    if (m.transparent) return;
    const clave = `${Object.keys(geo.attributes).sort().join(',')}|${m.vertexColors}|${m.type}|${m.map ? m.map.uuid : ""}|${m.color ? m.color.getHex() : 0}|${m.emissive ? m.emissive.getHex() : 0}|${m.roughness}|${m.metalness}`;
    if (!cubos.has(clave)) cubos.set(clave, { m, lista: [] });
    cubos.get(clave).lista.push(geo);
    quitar.push(o);
  });
  for (const o of quitar) {
    o.removeFromParent();
    if (!o.geometry.userData.compartida) o.geometry.dispose();
  }
  for (const { m, lista } of cubos.values()) {
    const geo = mergeGeometries(lista);
    lista.forEach(g => g.dispose());
    if (geo) grupo.add(new THREE.Mesh(geo, m));
  }
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
}

function aCapa(o) {
  o.traverse(x => x.layers.set(0));
}

export class PisosVecinos {
  constructor(raiz) {
    this.raiz = new THREE.Group();
    raiz.add(this.raiz);
    this.pisos = [];
    this.evento = null;
    this.tEvento = 4;
    this.noche = 0;
    this.camDir = new THREE.Vector3(1, 0, 1).normalize();
    this.crearDron = crearDron;
  }

  construir(ancho, fondo, niveles, alturaPiso) {
    this.limpiar();
    this.ancho = ancho;
    this.fondo = fondo;
    const W = ancho + GROSOR * 2 + 0.2;
    const D = fondo + GROSOR * 2 + 0.2;
    const cornisa = mat(0xe8e1d6);
    niveles.forEach((y, k) => {
      const dec = DECORADOS[(k + Math.floor(ancho * 7 + fondo * 3)) % DECORADOS.length];
      const g = new THREE.Group();
      g.position.y = y;
      const matPared = mat(dec.pared, { emissive: 0xffc98a, emissiveIntensity: 0 });
      const matSuelo = mat(dec.suelo, { emissive: 0xffc98a, emissiveIntensity: 0 });
      const suelo = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, D), [cornisa, cornisa, matSuelo, cornisa, cornisa, cornisa]);
      suelo.position.y = -0.25;
      g.add(suelo);
      const azar = semilla(k * 977 + Math.round(ancho * 13 + fondo * 31));
      const cubos = new Map();
      const matCache = new Map();
      const m2 = (color, extra) => {
        const clave = color + (extra ? JSON.stringify(extra) : '');
        if (!matCache.has(clave)) matCache.set(clave, mat(color, extra));
        return matCache.get(clave);
      };
      const matFachada = m2(FACHADAS[(k + Math.round(ancho)) % FACHADAS.length]);
      const matMarco = m2(0xf7f2ea);
      const matCristal = new THREE.MeshStandardMaterial({ color: 0xbfdbe8, transparent: true, opacity: 0.26, roughness: 0.05, metalness: 0.1, depthWrite: false });
      const matHierro = m2(0x3d3a3a, { roughness: 0.6 });
      const ventanas = [];
      const caras = [
        { n: new THREE.Vector3(0, 0, -1), largo: ancho + GROSOR * 2, c: -(fondo / 2 + GROSOR / 2) },
        { n: new THREE.Vector3(0, 0, 1), largo: ancho + GROSOR * 2, c: fondo / 2 + GROSOR / 2 },
        { n: new THREE.Vector3(-1, 0, 0), largo: fondo, c: -(ancho / 2 + GROSOR / 2) },
        { n: new THREE.Vector3(1, 0, 0), largo: fondo, c: ancho / 2 + GROSOR / 2 }
      ];
      const specs = caras.map(cara => {
        const L = cara.largo;
        const n = L >= 6.5 ? 3 : L >= 4.2 ? 2 : 1;
        const hueco = L / n;
        const lista = [];
        for (let j2 = 0; j2 < n; j2++) {
          const t = TIPOS_VENTANA[Math.floor(azar() * TIPOS_VENTANA.length)];
          const w = Math.min(t.w, hueco - 0.6);
          lista.push({ ...t, w, cx: -L / 2 + hueco * (j2 + 0.5) + (azar() - 0.5) * Math.max(0, hueco - w - 0.8) * 0.6 });
        }
        return lista;
      });
      caras.forEach((cara, i) => {
        const horiz = i < 2;
        const L = cara.largo;
        const caja = (a0, a1, y0, y1, material, grosor = GROSOR, salida = 0) => {
          if (a1 - a0 < 0.005 || y1 - y0 < 0.005) return null;
          const geo = horiz ? new THREE.BoxGeometry(a1 - a0, y1 - y0, grosor) : new THREE.BoxGeometry(grosor, y1 - y0, a1 - a0);
          const a = (a0 + a1) / 2;
          const sx = cara.n.x * salida;
          const sz = cara.n.z * salida;
          const pos = horiz ? new THREE.Vector3(a + sx, (y0 + y1) / 2, cara.c + sz) : new THREE.Vector3(cara.c + sx, (y0 + y1) / 2, a + sz);
          geo.translate(pos.x, pos.y, pos.z);
          const ng = geo.toNonIndexed();
          geo.dispose();
          if (!cubos.has(material)) cubos.set(material, []);
          cubos.get(material).push(ng);
          return pos;
        };
        const suelta = (a0, a1, y0, y1, material, grosor, salida) => {
          const geo = horiz ? new THREE.BoxGeometry(a1 - a0, y1 - y0, grosor) : new THREE.BoxGeometry(grosor, y1 - y0, a1 - a0);
          const m = new THREE.Mesh(geo, material);
          const a = (a0 + a1) / 2;
          if (horiz) m.position.set(a + cara.n.x * salida, (y0 + y1) / 2, cara.c + cara.n.z * salida);
          else m.position.set(cara.c + cara.n.x * salida, (y0 + y1) / 2, a + cara.n.z * salida);
          g.add(m);
          return m;
        };
        let cursor = -L / 2;
        specs[i].forEach((v, j2) => {
          const { cx, w: VW, s: SILL, t: TOPE } = v;
          caja(cursor, cx - VW / 2, 0, ALTO, matFachada);
          caja(cx - VW / 2, cx + VW / 2, 0, SILL, matFachada);
          caja(cx - VW / 2, cx + VW / 2, TOPE, ALTO, matFachada);
          cursor = cx + VW / 2;
          caja(cx - VW / 2 - 0.06, cx - VW / 2, SILL, TOPE, matMarco, GROSOR + 0.04);
          caja(cx + VW / 2, cx + VW / 2 + 0.06, SILL, TOPE, matMarco, GROSOR + 0.04);
          caja(cx - VW / 2 - 0.06, cx + VW / 2 + 0.06, TOPE, TOPE + 0.06, matMarco, GROSOR + 0.04);
          if (!v.balcon) caja(cx - VW / 2 - 0.1, cx + VW / 2 + 0.1, SILL - 0.06, SILL, matMarco, GROSOR + 0.14, 0.04);
          if (VW > 0.8) caja(cx - 0.02, cx + 0.02, SILL, TOPE, matMarco, 0.04, 0.02);
          if (v.peq) caja(cx - VW / 2, cx + VW / 2, (SILL + TOPE) / 2 - 0.02, (SILL + TOPE) / 2 + 0.02, matMarco, 0.04, 0.02);
          caja(cx - VW / 2, cx + VW / 2, SILL, TOPE, matCristal, 0.01, 0.03);
          caja(cx - VW / 2 - 0.08, cx + VW / 2 + 0.08, TOPE + 0.06, TOPE + 0.14, m2(0xe8e1d6), GROSOR + 0.12, 0.04);
          const extras = { cara, i, horiz };
          if (v.balcon) {
            const bw = VW / 2 + 0.25;
            caja(cx - bw, cx + bw, -0.04, 0.06, m2(0xcfc6b8), 0.6, GROSOR / 2 + 0.3);
            caja(cx - bw, cx + bw, 0.9, 0.94, matHierro, 0.04, GROSOR / 2 + 0.58);
            for (const lado of [-1, 1]) caja(cx + lado * bw - 0.02, cx + lado * bw + 0.02, 0.06, 0.94, matHierro, 0.6, GROSOR / 2 + 0.3);
            for (let b = 0; b <= 10; b++) {
              const bx = cx - bw + b * (bw * 2) / 10;
              caja(bx - 0.012, bx + 0.012, 0.06, 0.9, matHierro, 0.024, GROSOR / 2 + 0.58);
            }
            const tz = azar();
            if (tz < 0.45) {
              const [ca, cb] = TOLDOS_PISO[Math.floor(azar() * TOLDOS_PISO.length)];
              for (let b = 0; b < 6; b++) {
                const x0 = cx - bw + b * (bw * 2) / 6;
                caja(x0, x0 + (bw * 2) / 6, TOPE + 0.1, TOPE + 0.16, m2(b % 2 ? cb : ca), 0.7, GROSOR / 2 + 0.38);
              }
            }
            if (azar() < 0.5) {
              caja(cx - bw * 0.7, cx - bw * 0.7 + 0.28, 0.06, 0.34, m2(0xb5653e), 0.28, GROSOR / 2 + 0.38);
              const ps = caja(cx - bw * 0.7, cx - bw * 0.7 + 0.28, 0.34, 0.7, m2(0x6aa35a), 0.3, GROSOR / 2 + 0.38);
              void ps;
            }
            if (azar() < 0.4) {
              caja(cx + bw * 0.3, cx + bw * 0.3 + 0.36, 0.06, 0.5, m2(0xf2efe9), 0.36, GROSOR / 2 + 0.36);
              caja(cx + bw * 0.3, cx + bw * 0.3 + 0.36, 0.5, 0.86, m2(0xf2efe9), 0.05, GROSOR / 2 + 0.2);
            }
            const ropa = new THREE.Group();
            const colores = [0xe05656, 0x5a8fd6, 0xf2d06b, 0xffffff, 0x6cc08a, 0xf4b3be];
            const cuerda = suelta(cx - bw + 0.05, cx + bw - 0.05, 1.62, 1.635, matHierro, 0.015, GROSOR / 2 + 0.52);
            cuerda.removeFromParent();
            ropa.add(cuerda);
            for (let b = 0; b < 4; b++) {
              const x0 = cx - bw + 0.25 + b * (bw * 2 - 0.5) / 4;
              const prenda = suelta(x0, x0 + 0.22 + (b % 2) * 0.08, 1.25 + (b % 2) * 0.1, 1.62, m2(colores[(b + k + i) % colores.length], { side: THREE.DoubleSide }), 0.01, GROSOR / 2 + 0.52);
              prenda.removeFromParent();
              ropa.add(prenda);
            }
            ropa.visible = azar() < 0.4;
            g.add(ropa);
            extras.ropa = ropa;
          } else if (v.francesa) {
            caja(cx - VW / 2, cx + VW / 2, 0.95, 0.99, matHierro, 0.04, GROSOR / 2 + 0.06);
            for (let b = 0; b <= 6; b++) {
              const bx = cx - VW / 2 + b * VW / 6;
              caja(bx - 0.01, bx + 0.01, SILL, 0.95, matHierro, 0.02, GROSOR / 2 + 0.06);
            }
          } else if (!v.peq) {
            const r2 = azar();
            if (r2 < 0.45) {
              const pos = caja(cx - VW / 2 + 0.1, cx + VW / 2 - 0.1, SILL, SILL + 0.16, m2(0xb5653e), 0.16, GROSOR / 2 + 0.12);
              const flores = [0xe07a8a, 0x6aa35a, 0xf2d06b, 0xb39ddb, 0xff9f6b];
              for (let f = 0; f < 3; f++) {
                const a = cx - VW / 2 + 0.2 + f * (VW - 0.4) / 2;
                caja(a - 0.12, a + 0.12, SILL + 0.16, SILL + 0.34, m2(flores[Math.floor(azar() * flores.length)]), 0.18, GROSOR / 2 + 0.12);
              }
              void pos;
            } else if (r2 < 0.7) {
              caja(cx - 0.32, cx + 0.32, SILL - 0.55, SILL - 0.1, m2(0xd9dde0, { metalness: 0.3, roughness: 0.5 }), 0.3, GROSOR / 2 + 0.16);
              caja(cx - 0.22, cx + 0.22, SILL - 0.48, SILL - 0.17, m2(0x8c9298), 0.02, GROSOR / 2 + 0.32);
            }
          }
          const cortina = CORTINAS_PISO[Math.floor(azar() * CORTINAS_PISO.length)];
          if (!v.peq) {
            for (const lado of [-1, 1]) {
              const ancho2 = Math.min(VW * 0.3, 0.14 + azar() * 0.2);
              const a0 = lado < 0 ? cx - VW / 2 : cx + VW / 2 - ancho2;
              caja(a0, a0 + ancho2, SILL + 0.02, TOPE - 0.02, m2(cortina, { side: THREE.DoubleSide }), 0.02, -GROSOR / 2 - 0.06);
            }
          }
          const persiana = suelta(cx - VW / 2, cx + VW / 2, 0, 1, m2(PERSIANAS[(k + i + j2) % PERSIANAS.length]), 0.03, -GROSOR / 2 + 0.02);
          persiana.geometry.translate(0, -0.5, 0);
          persiana.position.y = TOPE;
          persiana.userData.alto = TOPE - SILL;
          persiana.userData.bajada = azar() < 0.35 ? 0.3 + azar() * 0.6 : 0.04;
          persiana.scale.y = persiana.userData.bajada * persiana.userData.alto;
          const dentro = new THREE.Vector3();
          if (horiz) dentro.set(cx, 0, cara.c - cara.n.z * (GROSOR / 2 + 0.3));
          else dentro.set(cara.c - cara.n.x * (GROSOR / 2 + 0.3), 0, cx);
          const alfeizar = dentro.clone().addScaledVector(cara.n, 0.18);
          alfeizar.y = SILL + 0.02;
          const fueraAlf = dentro.clone().addScaledVector(cara.n, 0.47);
          fueraAlf.y = SILL + 0.02;
          ventanas.push({ n: cara.n, dentro, alfeizar, fueraAlf, balcon: !!v.balcon, peq: !!v.peq, francesa: !!v.francesa, sill: SILL, ancho: VW, ropa: extras.ropa || null, persiana, fuera: v.balcon ? dentro.clone().addScaledVector(cara.n, 0.7) : null });
        });
        caja(cursor, L / 2, 0, ALTO, matFachada);
        caja(-L / 2 - 0.05, L / 2 + 0.05, -0.12, 0.02, cornisa, GROSOR + 0.1, 0.03);
      });
      const bajante = new THREE.CylinderGeometry(0.05, 0.05, ALTO + 0.5, 8);
      for (const [sx, sz] of [[1, -1], [-1, 1]]) {
        const b = bajante.clone();
        b.translate(sx * (ancho / 2 + GROSOR + 0.07), ALTO / 2 - 0.25, sz * (fondo / 2 + GROSOR + 0.07));
        if (!cubos.has(matHierro)) cubos.set(matHierro, []);
        cubos.get(matHierro).push(b.toNonIndexed());
      }
      for (const [mat2, lista] of cubos) {
        const geo = mergeGeometries(lista.map(x => {
          for (const k2 of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(k2)) x.deleteAttribute(k2);
          return x;
        }));
        lista.forEach(x => x.dispose());
        g.add(new THREE.Mesh(geo, mat2));
      }
      const forro = [
        [0, -(fondo / 2) + 0.002, ancho, 0],
        [0, fondo / 2 - 0.002, ancho, Math.PI],
        [-(ancho / 2) + 0.002, 0, fondo, Math.PI / 2],
        [ancho / 2 - 0.002, 0, fondo, -Math.PI / 2]
      ];
      forro.forEach(([x, z, largo, ry], i) => {
        const shape = new THREE.Shape();
        shape.moveTo(-largo / 2, 0);
        shape.lineTo(largo / 2, 0);
        shape.lineTo(largo / 2, ALTO);
        shape.lineTo(-largo / 2, ALTO);
        shape.lineTo(-largo / 2, 0);
        for (const v of specs[i]) {
          const sx = i === 0 || i === 3 ? v.cx : -v.cx;
          const a = Math.max(-largo / 2 + 0.01, sx - v.w / 2);
          const b = Math.min(largo / 2 - 0.01, sx + v.w / 2);
          const h = new THREE.Path();
          h.moveTo(a, v.s);
          h.lineTo(b, v.s);
          h.lineTo(b, v.t);
          h.lineTo(a, v.t);
          h.lineTo(a, v.s);
          shape.holes.push(h);
        }
        const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), matPared);
        m.position.set(x, 0, z);
        m.rotation.y = ry;
        g.add(m);
      });
      const muebles = new THREE.Group();
      g.add(muebles);
      const sitio = {};
      for (const [id, donde, extra] of dec.muebles) {
        const def = infoItem(id);
        if (!def || !def.piezas) continue;
        const { grupo } = construirPiezas(def.piezas, { sombras: false, id });
        const w = def.ancho * 0.5;
        const d = def.fondo * 0.5;
        const mx = ancho / 2;
        const mz = fondo / 2;
        let x = 0;
        let z = 0;
        let ry = 0;
        if (donde === 'fondo') { x = extra * ancho; z = -mz + d / 2 + 0.05; ry = 0; }
        else if (donde === 'frente') { x = extra * ancho; z = mz - d / 2 - 0.05; ry = Math.PI; }
        else if (donde === 'izquierda') { x = -mx + d / 2 + 0.05; z = extra * fondo; ry = Math.PI / 2; }
        else if (donde === 'derecha') { x = mx - d / 2 - 0.05; z = extra * fondo; ry = -Math.PI / 2; }
        else if (donde === 'derechaDentro') { x = mx - d / 2 - 0.75; z = extra * fondo; ry = Math.PI / 2; }
        else if (donde === 'centro') { x = 0; z = 0.1; }
        else if (donde === 'centroLado') { x = 0.2; z = 0.6; }
        else if (donde === 'mesaA') { x = -0.75; z = 0; ry = Math.PI / 2; }
        else if (donde === 'mesaB') { x = 0.75; z = 0; ry = -Math.PI / 2; }
        else if (donde === 'esquina') {
          const e = [[-1, -1], [1, -1], [-1, 1], [1, 1]][extra % 4];
          x = e[0] * (mx - 0.35);
          z = e[1] * (mz - 0.35);
        }
        grupo.position.set(x, 0, z);
        grupo.rotation.y = ry;
        muebles.add(grupo);
        if (id === 'sofa' && !sitio.sofa) sitio.sofa = { x: x + Math.sin(ry) * 0.15, z: z + Math.cos(ry) * 0.15, ry };
        if (id === 'tele') {
          sitio.tele = grupo;
          const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.42), new THREE.MeshBasicMaterial({ color: 0x1a1d22 }));
          pantalla.position.set(0, 0.72, 0.09);
          grupo.add(pantalla);
          sitio.pantalla = pantalla;
          pantalla.userData.suelta = true;
        }
        if (id === 'planta' && !sitio.planta) sitio.planta = { x, z };
      }
      fusionar(muebles);
      aCapa(g);
      this.raiz.add(g);
      this.pisos.push({ g, ventanas, matPared, matSuelo, sitio, y, encendido: Math.random() < 0.93, gente: [] });
    });
  }

  limpiar() {
    this.terminarEvento();
    for (const p of this.pisos) {
      this.raiz.remove(p.g);
      liberar(p.g);
    }
    this.pisos = [];
  }

  ponerNoche(k) {
    this.noche = k;
    for (const p of this.pisos) {
      const luz = 0.07 * (1 - k) + (p.encendido ? k * 0.28 : k * 0.03);
      p.matPared.emissiveIntensity = luz;
      p.matSuelo.emissiveIntensity = luz * 0.6;
    }
  }

  ladoAbierto() {
    const d = this.camDir;
    const caras = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let mejor = caras[1];
    let v = -Infinity;
    for (const c of caras) {
      const x = c[0] * d.x + c[1] * d.z;
      if (x > v) {
        v = x;
        mejor = c;
      }
    }
    return mejor;
  }

  puntoAlAzar(margen = 0.6) {
    for (let k = 0; k < 12; k++) {
      const p = new THREE.Vector3((Math.random() - 0.5) * (this.ancho - margen * 2), 0, (Math.random() - 0.5) * (this.fondo - margen * 2));
      if (p.x * this.camDir.x + p.z * this.camDir.z > 0.4) return p;
    }
    return new THREE.Vector3(this.camDir.x * 1.2, 0, this.camDir.z * 1.2);
  }

  persona(piso, quien) {
    const p = crearPersonaje(quien || GENTE[Math.floor(Math.random() * GENTE.length)]);
    p.scale.setScalar(0.01);
    p.userData.escala = ESCALA_PERSONA;
    aCapa(p);
    piso.g.add(p);
    piso.gente.push(p);
    return p;
  }

  mascota(piso) {
    let m = null;
    try {
      m = mascotaSuelta(Math.random() < 0.6 ? 'gato' : 'perro', 'idle');
    } catch (e) {
      m = null;
    }
    if (!m) return null;
    const g = new THREE.Group();
    g.add(m);
    g.scale.setScalar(0.01);
    g.userData.escala = 0.9;
    aCapa(g);
    piso.g.add(g);
    piso.gente.push(g);
    return g;
  }

  pajaro(piso) {
    const g = new THREE.Group();
    const gris = mat(0x8c8f99);
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), gris);
    cuerpo.scale.set(1, 0.85, 1.35);
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(0x6d7180));
    cabeza.position.set(0, 0.08, 0.1);
    const pico = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.05, 6), mat(0xe0a03c));
    pico.rotation.x = Math.PI / 2;
    pico.position.set(0, 0.075, 0.17);
    const alas = [];
    for (const l of [-1, 1]) {
      const ala = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.1), gris);
      ala.geometry.translate(l * 0.08, 0, 0);
      ala.position.set(l * 0.05, 0.03, 0);
      g.add(ala);
      alas.push(ala);
    }
    g.add(cuerpo, cabeza, pico);
    g.userData.alas = alas;
    g.userData.cabeza = cabeza;
    g.userData.escala = 1.2;
    g.scale.setScalar(1.2);
    aCapa(g);
    piso.g.add(g);
    piso.gente.push(g);
    return g;
  }

  vuelo(obj, desde, hasta, dur, alFin) {
    return { accion: (dt, t) => {
      const u = Math.min(1, t / dur);
      const e = 1 - Math.pow(1 - u, 2);
      obj.position.lerpVectors(desde, hasta, e);
      obj.position.y += Math.sin(u * Math.PI) * 0.6;
      obj.rotation.y = Math.atan2(hasta.x - desde.x, hasta.z - desde.z);
      if (obj.userData.alas) obj.userData.alas.forEach((a, i) => { a.rotation.z = Math.sin(t * 30) * 0.8 * (i ? 1 : -1); });
      if (obj.userData.helices) obj.userData.helices.forEach(h => { h.rotation.y += dt * 40; });
      if (u >= 1 && alFin) alFin();
      return u >= 1;
    } };
  }

  empezarEvento() {
    if (!this.pisos.length) return;
    const piso = this.pisos[Math.floor(Math.random() * this.pisos.length)];
    const visibles = piso.ventanas.filter(v => v.n.x * this.camDir.x + v.n.z * this.camDir.z > 0.15);
    if (!visibles.length) {
      this.tEvento = 3;
      return;
    }
    const noche = this.noche > 0.5;
    const elegir = l => l[Math.floor(Math.random() * l.length)];
    const grandes = visibles.filter(v => !v.peq);
    const balcones = visibles.filter(v => v.balcon);
    const normales = visibles.filter(v => !v.peq && !v.balcon);
    const v = elegir(grandes.length ? grandes : visibles);
    const opciones = [
      grandes.length ? ['asomarse', 4] : null,
      ['pasar', 2],
      normales.length ? ['gato', 2] : null,
      grandes.length ? ['charla', 2] : null,
      grandes.length ? ['regar', 1.2] : null,
      balcones.length ? ['balcon', 3] : null,
      balcones.length ? ['tender', 2] : null,
      normales.length && !noche ? ['sacudir', 1.6] : null,
      ['persiana', 1.6],
      ['paloma', 1.8],
      grandes.length ? ['dron', 1.2] : null,
      grandes.length && !noche ? ['ejercicio', 1] : null,
      grandes.length ? ['telefono', 1.3] : null,
      noche ? ['tele', 2] : null,
      noche ? ['fiesta', 1.2] : null,
      noche ? ['luz', 1.5] : null
    ].filter(Boolean);
    let r = Math.random() * opciones.reduce((a, o) => a + o[1], 0);
    let tipo = opciones[0][0];
    for (const [t, peso] of opciones) {
      r -= peso;
      if (r <= 0) {
        tipo = t;
        break;
      }
    }
    const vent = tipo === 'balcon' || tipo === 'tender' ? elegir(balcones) : tipo === 'gato' || tipo === 'sacudir' ? elegir(normales) : v;
    const fuera = Math.atan2(vent.n.x, vent.n.z);
    const lateral = new THREE.Vector3(-vent.n.z, 0, vent.n.x);
    const atras = vent.dentro.clone().addScaledVector(vent.n, -0.9);
    const actores = [];
    const lejos = (p, d = 9, alto = 5) => p.clone().addScaledVector(vent.n, d).addScaledVector(lateral, (Math.random() - 0.5) * 8).add(new THREE.Vector3(0, alto, 0));
    if (tipo === 'asomarse') {
      actores.push({ obj: this.persona(piso), pasos: [
        { aparecer: atras }, { ir: vent.dentro }, { mirar: fuera, anim: 'idle', dur: 1.2 }, { anim: 'emote-yes', dur: 2.2 },
        { anim: 'idle', dur: 3 + Math.random() * 3 }, { anim: 'emote-yes', dur: 1.6 }, { ir: atras }, { desaparecer: true }
      ] });
    } else if (tipo === 'balcon') {
      actores.push({ obj: this.persona(piso), pasos: [
        { aparecer: atras }, { ir: vent.dentro }, { ir: vent.fuera, vel: 0.6 }, { mirar: fuera, anim: 'idle', dur: 2 },
        { anim: 'emote-yes', dur: 2.2 }, { anim: 'idle', dur: 4 + Math.random() * 4 }, { ir: vent.dentro, vel: 0.6 }, { ir: atras }, { desaparecer: true }
      ] });
    } else if (tipo === 'tender') {
      const ropa = vent.ropa;
      const quitar = ropa && ropa.visible;
      actores.push({ obj: this.persona(piso), pasos: [
        { aparecer: atras }, { ir: vent.dentro }, { ir: vent.fuera, vel: 0.6 }, { mirar: fuera, anim: 'interact-right', dur: 1 },
        { accion: (dt, t) => {
          if (!ropa) return true;
          const prendas = ropa.children.slice(1);
          ropa.visible = true;
          const n = Math.min(prendas.length, Math.floor(t / 0.8));
          prendas.forEach((pr, i2) => { pr.visible = quitar ? i2 >= n : i2 < n; });
          if (t > prendas.length * 0.8 + 0.3) {
            if (quitar) ropa.visible = false;
            prendas.forEach(pr => { pr.visible = true; });
            return true;
          }
          return false;
        }, anim: 'interact-right' },
        { anim: 'idle', dur: 1.5 }, { ir: vent.dentro, vel: 0.6 }, { ir: atras }, { desaparecer: true }
      ] });
    } else if (tipo === 'pasar') {
      const otra = elegir(visibles);
      const a = vent.dentro.clone().addScaledVector(lateral, -0.9);
      const b = otra.dentro.clone().addScaledVector(new THREE.Vector3(-otra.n.z, 0, otra.n.x), 0.9);
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: a }, { ir: vent.dentro }, { ir: b }, { desaparecer: true }] });
    } else if (tipo === 'gato') {
      const m = this.mascota(piso);
      if (m) actores.push({ obj: m, mascota: true, pasos: [{ aparecer: vent.alfeizar }, { mirar: fuera, quieto: 7 + Math.random() * 6 }, { mirar: fuera + 1.2, quieto: 2 }, { mirar: fuera, quieto: 3 }, { desaparecer: true }] });
    } else if (tipo === 'charla') {
      const pa = vent.dentro.clone().addScaledVector(lateral, -0.32).addScaledVector(vent.n, -0.15);
      const pb = vent.dentro.clone().addScaledVector(lateral, 0.32).addScaledVector(vent.n, -0.15);
      const mira = Math.atan2(lateral.x, lateral.z);
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: pa }, { mirar: mira, anim: 'idle', dur: 1.5 }, { anim: 'emote-yes', dur: 2 }, { anim: 'idle', dur: 4 }, { anim: 'interact-right', dur: 1.5 }, { anim: 'idle', dur: 2 }, { ir: atras }, { desaparecer: true }] });
      actores.push({ obj: this.persona(piso), pasos: [{ espera: 1 }, { aparecer: atras }, { ir: pb }, { mirar: mira + Math.PI, anim: 'idle', dur: 2.5 }, { anim: 'emote-no', dur: 1.6 }, { anim: 'idle', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'regar') {
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: vent.dentro }, { mirar: fuera, anim: 'interact-right', dur: 3.5 }, { anim: 'idle', dur: 1 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'sacudir') {
      const alfombra = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.5), mat([0xe07a8a, 0x5a8fd6, 0xe0a03c][Math.floor(Math.random() * 3)], { side: THREE.DoubleSide }));
      const piv = new THREE.Group();
      alfombra.position.set(0, 0, 0.25);
      piv.add(alfombra);
      piv.userData.escala = 1;
      aCapa(piv);
      piso.g.add(piv);
      piso.gente.push(piv);
      const punto = vent.fueraAlf.clone();
      punto.y = vent.sill + 0.35;
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: vent.dentro }, { mirar: fuera, anim: 'holding-both', dur: 6.5 }, { anim: 'idle', dur: 0.8 }, { ir: atras }, { desaparecer: true }] });
      actores.push({ obj: piv, pasos: [{ espera: 1.8 }, { aparecer: punto }, { accion: (dt, t) => {
        piv.rotation.y = fuera;
        piv.rotation.x = 0.5 + Math.sin(t * 14) * 0.55;
        return t > 4;
      } }, { desaparecer: true }] });
    } else if (tipo === 'persiana') {
      const per = vent.persiana;
      const desde = per.userData.bajada;
      const hasta = desde > 0.2 ? 0.04 : 0.55 + Math.random() * 0.4;
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: vent.dentro.clone().addScaledVector(vent.n, -0.15) }, { mirar: fuera, anim: 'interact-right', dur: 0.4 }, { accion: (dt, t) => {
        const u = Math.min(1, t / 2.2);
        per.userData.bajada = desde + (hasta - desde) * u;
        per.scale.y = Math.max(0.01, per.userData.bajada * per.userData.alto);
        return u >= 1;
      }, anim: 'interact-right' }, { anim: 'idle', dur: 0.8 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'paloma') {
      const p = this.pajaro(piso);
      const punto = vent.balcon ? vent.fuera.clone().addScaledVector(vent.n, 0.32).setY(0.95) : vent.fueraAlf.clone();
      if (!vent.balcon && vent.peq) punto.y = vent.sill + 0.02;
      const salida = lejos(punto);
      actores.push({ obj: p, pasos: [{ aparecer: salida }, this.vuelo(p, salida, punto, 2.2), { accion: (dt, t) => {
        p.userData.alas.forEach(a => { a.rotation.z *= 0.8; });
        p.rotation.y = fuera + Math.sin(t * 0.7) * 1.2;
        p.userData.cabeza.position.y = 0.08 + (Math.sin(t * 6) > 0.7 ? -0.04 : 0);
        return t > 6 + Math.random() * 0.02;
      } }, this.vuelo(p, punto, lejos(punto), 2), { desaparecer: true }] });
    } else if (tipo === 'dron') {
      const dron = this.crearDron ? this.crearDron() : null;
      if (dron) {
        dron.userData.escala = 1.3;
        dron.scale.setScalar(1.3);
        const caja = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.3), mat(0xc99a63));
        caja.position.y = -0.72;
        const cinta = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.23, 0.07), mat(0xe58f9e));
        caja.add(cinta);
        dron.add(caja);
        aCapa(dron);
        piso.g.add(dron);
        piso.gente.push(dron);
        const punto = vent.balcon ? vent.fuera.clone().addScaledVector(vent.n, 0.5).setY(1.6) : vent.dentro.clone().addScaledVector(vent.n, 1.15).setY(vent.sill + 1.0);
        const salida = lejos(punto, 10, 6);
        actores.push({ obj: dron, pasos: [{ aparecer: salida }, this.vuelo(dron, salida, punto, 3), { accion: (dt, t) => {
          dron.userData.helices.forEach(h => { h.rotation.y += dt * 40; });
          dron.position.y = punto.y + Math.sin(t * 2.4) * 0.05;
          if (t > 3.6) {
            caja.visible = false;
            dron.userData.cable.visible = false;
            dron.userData.gancho.visible = false;
          }
          return t > 5;
        } }, this.vuelo(dron, punto, lejos(punto, 10, 7), 2.6), { desaparecer: true }] });
        actores.push({ obj: this.persona(piso), pasos: [{ espera: 2.4 }, { aparecer: atras }, { ir: vent.balcon ? vent.fuera : vent.dentro }, { mirar: fuera, anim: 'interact-right', dur: 1.6 }, { anim: 'holding-both', dur: 1.5 }, { anim: 'emote-yes', dur: 1.4 }, { ir: atras }, { desaparecer: true }] });
      }
    } else if (tipo === 'ejercicio') {
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: vent.dentro.clone().addScaledVector(vent.n, -0.25) }, { mirar: fuera, anim: 'jump', dur: 6 }, { anim: 'crouch', dur: 2.5 }, { anim: 'jump', dur: 4 }, { anim: 'idle', dur: 1 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'telefono') {
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: vent.dentro.clone().addScaledVector(lateral, 0.3) }, { mirar: fuera, anim: 'holding-right', dur: 5 }, { ir: vent.dentro.clone().addScaledVector(lateral, -0.4), vel: 0.4 }, { mirar: fuera, anim: 'holding-right', dur: 4 }, { anim: 'emote-yes', dur: 1.5 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'tele') {
      piso.tele = true;
      actores.push({ obj: new THREE.Group(), pasos: [{ espera: 14 + Math.random() * 8 }] });
      piso.g.add(actores[0].obj);
    } else if (tipo === 'fiesta') {
      piso.fiesta = 0;
      for (let k = 0; k < 3; k++) {
        const sitio = vent.dentro.clone().addScaledVector(lateral, (k - 1) * 0.5).addScaledVector(vent.n, -0.3 - (k % 2) * 0.4);
        actores.push({ obj: this.persona(piso), pasos: [{ espera: k * 0.6 }, { aparecer: atras }, { ir: sitio }, { mirar: fuera, anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: atras }, { desaparecer: true }] });
      }
    } else if (tipo === 'luz') {
      piso.encendido = !piso.encendido;
      this.ponerNoche(this.noche);
      this.tEvento = 4 + Math.random() * 6;
      return;
    }
    for (const a of actores) {
      a.i = 0;
      a.t = 0;
      a.obj.visible = false;
    }
    this.evento = { piso, actores, tipo, t: 0 };
  }

  terminarEvento() {
    const e = this.evento;
    if (!e) return;
    for (const a of e.actores) {
      e.piso.g.remove(a.obj);
      e.piso.gente = e.piso.gente.filter(x => x !== a.obj);
    }
    if (e.piso.sitio.pantalla) e.piso.sitio.pantalla.material.color.setHex(0x1a1d22);
    if (e.tipo === 'fiesta' || e.tipo === 'tele') {
      e.piso.fiesta = null;
      e.piso.tele = false;
      e.piso.matPared.emissive.setHex(0xffc98a);
      this.ponerNoche(this.noche);
    }
    this.evento = null;
  }

  actualizar(dt, camDir, paredesVisibles) {
    if (camDir) this.camDir.copy(camDir);
    if (!this.pisos.length) return;
    const e = this.evento;
    if (!e) {
      this.tEvento -= dt;
      if (this.tEvento <= 0) {
        this.tEvento = 7 + Math.random() * 12;
        this.empezarEvento();
      }
      return;
    }
    e.t += dt;
    if (e.tipo === 'tele') {
      if (Math.random() < dt * 5) {
        e.piso.matPared.emissive.setHSL(0.55 + Math.random() * 0.15, 0.6, 0.6);
        e.piso.matPared.emissiveIntensity = 0.12 + Math.random() * 0.2;
      }
    }
    if (e.tipo === 'fiesta') {
      const c = new THREE.Color().setHSL((e.t * 0.35) % 1, 0.8, 0.5);
      e.piso.matPared.emissive.copy(c);
      e.piso.matPared.emissiveIntensity = 0.35 + Math.sin(e.t * 9) * 0.15;
    }
    let vivos = 0;
    for (const a of e.actores) {
      const paso = a.pasos[a.i];
      if (!paso) continue;
      vivos++;
      const o = a.obj;
      a.t += dt;
      if (a.mascota && o.children[0] && o.children[0].userData.mixer) o.children[0].userData.mixer.update(dt);
      if (a.tele && e.piso.sitio.pantalla && a.i >= 2) {
        if (Math.random() < dt * 4) e.piso.sitio.pantalla.material.color.setHSL(Math.random(), 0.5, 0.45 + Math.random() * 0.2);
      }
      const siguiente = () => {
        a.i++;
        a.t = 0;
      };
      const escala = o.userData.escala;
      if (paso.espera !== undefined) {
        if (a.t >= paso.espera) siguiente();
      } else if (paso.accion) {
        if (paso.anim && a.t === dt && !a.mascota && o.userData.kenney) animarPersonaje(o, paso.anim);
        if (paso.accion(dt, a.t, a)) siguiente();
      } else if (paso.aparecer) {
        if (a.t === dt) {
          o.position.copy(paso.aparecer);
          o.visible = true;
        }
        o.scale.setScalar(Math.max(0.01, Math.min(1, a.t / 0.35)) * escala);
        if (a.t >= 0.35) siguiente();
      } else if (paso.desaparecer) {
        o.scale.setScalar(Math.max(0.01, 1 - a.t / 0.35) * escala);
        if (a.t >= 0.35) {
          o.visible = false;
          siguiente();
        }
      } else if (paso.ir) {
        const dx = paso.ir.x - o.position.x;
        const dz = paso.ir.z - o.position.z;
        const dist = Math.hypot(dx, dz);
        if (!a.mascota) animarPersonaje(o, 'walk');
        else o.position.y = Math.abs(Math.sin(a.t * 12)) * 0.03;
        if (dist < 0.04) {
          o.position.y = 0;
          siguiente();
        } else {
          const v = Math.min(dist, (paso.vel || 0.85) * dt);
          o.position.x += dx / dist * v;
          o.position.z += dz / dist * v;
          const objetivo = Math.atan2(dx, dz);
          let dif = objetivo - o.rotation.y;
          dif = Math.atan2(Math.sin(dif), Math.cos(dif));
          o.rotation.y += dif * Math.min(1, dt * 8);
        }
      } else {
        if (a.t === dt) {
          if (paso.mover) o.position.copy(paso.mover);
          if (paso.anim && !a.mascota) animarPersonaje(o, paso.anim);
        }
        let giro = paso.mirar;
        if (paso.mirarA) giro = Math.atan2(paso.mirarA.x - o.position.x, paso.mirarA.z - o.position.z);
        if (giro !== undefined) {
          let dif = giro - o.rotation.y;
          dif = Math.atan2(Math.sin(dif), Math.cos(dif));
          o.rotation.y += dif * Math.min(1, dt * 6);
        }
        const dur = paso.dur ?? paso.quieto ?? 1;
        if (a.t >= dur) siguiente();
      }
    }
    if (!vivos) this.terminarEvento();
  }
}
