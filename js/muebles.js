import * as THREE from 'three';

export const CELDA = 0.5;
const LIMITE = 6;

export const CATALOGO = [
  { id: 'colchon', nombre: 'Colchón viejo', icono: '🛏️', precio: 0, enTienda: false, ancho: 2, fondo: 4, piezas: [
    [1, 0.18, 2, 0, 0.09, 0, 0xcfc6b0],
    [0.7, 0.08, 0.35, 0, 0.22, -0.7, 0xeeeeee]
  ]},
  { id: 'caja', nombre: 'Caja', icono: '📦', precio: 5, ancho: 1, fondo: 1, piezas: [
    [0.45, 0.4, 0.45, 0, 0.2, 0, 0xb8875a],
    [0.46, 0.03, 0.1, 0, 0.405, 0, 0xd9c27a]
  ]},
  { id: 'silla', nombre: 'Silla', icono: '🪑', precio: 25, ancho: 1, fondo: 1, piezas: [
    [0.42, 0.05, 0.42, 0, 0.45, 0, 0xa8794f],
    [0.42, 0.45, 0.05, 0, 0.7, -0.19, 0xa8794f],
    [0.04, 0.45, 0.04, -0.18, 0.225, -0.18, 0x7a5535],
    [0.04, 0.45, 0.04, 0.18, 0.225, -0.18, 0x7a5535],
    [0.04, 0.45, 0.04, -0.18, 0.225, 0.18, 0x7a5535],
    [0.04, 0.45, 0.04, 0.18, 0.225, 0.18, 0x7a5535]
  ]},
  { id: 'mesa', nombre: 'Mesa', icono: '🍽️', precio: 40, ancho: 2, fondo: 2, piezas: [
    [0.95, 0.05, 0.95, 0, 0.73, 0, 0xa8794f],
    [0.06, 0.7, 0.06, -0.42, 0.35, -0.42, 0x7a5535],
    [0.06, 0.7, 0.06, 0.42, 0.35, -0.42, 0x7a5535],
    [0.06, 0.7, 0.06, -0.42, 0.35, 0.42, 0x7a5535],
    [0.06, 0.7, 0.06, 0.42, 0.35, 0.42, 0x7a5535]
  ]},
  { id: 'planta', nombre: 'Planta', icono: '🪴', precio: 15, ancho: 1, fondo: 1, piezas: [
    [0.3, 0.3, 0.3, 0, 0.15, 0, 0xc96f4a, 'cil'],
    [0.45, 0.5, 0.45, 0, 0.55, 0, 0x5a9e4b, 'esfera'],
    [0.3, 0.3, 0.3, 0.08, 0.8, 0.05, 0x6db35a, 'esfera']
  ]},
  { id: 'lampara', nombre: 'Lámpara', icono: '💡', precio: 30, ancho: 1, fondo: 1, piezas: [
    [0.25, 0.04, 0.25, 0, 0.02, 0, 0x444444, 'cil'],
    [0.03, 1.3, 0.03, 0, 0.67, 0, 0x444444, 'cil'],
    [0.35, 0.3, 0.35, 0, 1.4, 0, 0xfff1c9, 'cil', true]
  ]},
  { id: 'alfombra', nombre: 'Alfombra', icono: '🟪', precio: 35, suelo: true, ancho: 4, fondo: 3, piezas: [
    [1.9, 0.02, 1.4, 0, 0.01, 0, 0xd9a5b3],
    [1.6, 0.025, 1.1, 0, 0.012, 0, 0xe8c2cc]
  ]},
  { id: 'estanteria', nombre: 'Estantería', icono: '📚', precio: 50, ancho: 2, fondo: 1, piezas: [
    [0.04, 1.6, 0.35, -0.48, 0.8, 0, 0x9c6b45],
    [0.04, 1.6, 0.35, 0.48, 0.8, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 0.05, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 0.55, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 1.05, 0, 0x9c6b45],
    [0.92, 0.03, 0.35, 0, 1.58, 0, 0x9c6b45],
    [0.1, 0.25, 0.25, -0.3, 0.2, 0, 0xc0504d],
    [0.08, 0.22, 0.25, -0.18, 0.19, 0, 0x4f81bd],
    [0.3, 0.2, 0.25, 0.2, 0.68, 0, 0x9bbb59]
  ]},
  { id: 'tele', nombre: 'Tele', icono: '📺', precio: 90, ancho: 2, fondo: 1, piezas: [
    [0.95, 0.45, 0.4, 0, 0.225, 0, 0x6d4c3d],
    [0.2, 0.05, 0.15, 0, 0.475, -0.05, 0x333333],
    [0.85, 0.5, 0.05, 0, 0.75, -0.05, 0x222222]
  ]},
  { id: 'sofa', nombre: 'Sofá', icono: '🛋️', precio: 110, ancho: 4, fondo: 2, piezas: [
    [1.9, 0.4, 0.85, 0, 0.2, 0.05, 0x6b8fb3],
    [1.9, 0.55, 0.2, 0, 0.55, -0.38, 0x5d7fa1],
    [0.18, 0.6, 0.85, -0.86, 0.3, 0.05, 0x5d7fa1],
    [0.18, 0.6, 0.85, 0.86, 0.3, 0.05, 0x5d7fa1],
    [0.8, 0.1, 0.6, -0.42, 0.45, 0.08, 0x7fa3c6],
    [0.8, 0.1, 0.6, 0.42, 0.45, 0.08, 0x7fa3c6]
  ]},
  { id: 'nevera', nombre: 'Nevera', icono: '🧊', precio: 100, ancho: 2, fondo: 2, piezas: [
    [0.85, 1.8, 0.75, 0, 0.9, 0, 0xf2f2f2],
    [0.86, 0.02, 0.76, 0, 1.2, 0, 0xdddddd],
    [0.04, 0.4, 0.04, 0.33, 1.45, 0.39, 0x999999]
  ]},
  { id: 'cama', nombre: 'Cama', icono: '🛏️', precio: 150, ancho: 3, fondo: 4, piezas: [
    [1.4, 0.3, 1.95, 0, 0.15, 0, 0x8b5a3c],
    [1.3, 0.2, 1.8, 0, 0.4, 0.05, 0xf3efe6],
    [1.4, 0.9, 0.08, 0, 0.45, -0.95, 0x8b5a3c],
    [0.5, 0.1, 0.3, -0.3, 0.55, -0.7, 0xffffff],
    [0.5, 0.1, 0.3, 0.3, 0.55, -0.7, 0xffffff],
    [1.32, 0.04, 1.1, 0, 0.51, 0.4, 0xe58f9e]
  ]}
];

function crearMueble(def) {
  const grupo = new THREE.Group();
  for (const [w, h, d, x, y, z, color, forma, brilla] of def.piezas) {
    let geo;
    if (forma === 'cil') geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 16);
    else if (forma === 'esfera') geo = new THREE.SphereGeometry(0.5, 16, 12);
    else geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    if (brilla) {
      mat.emissive.set(color);
      mat.emissiveIntensity = 0.6;
    }
    const malla = new THREE.Mesh(geo, mat);
    if (forma === 'esfera') malla.scale.set(w, h, d);
    malla.position.set(x, y, z);
    malla.castShadow = !def.suelo;
    malla.receiveShadow = true;
    malla.userData.base = { color: mat.emissive.clone(), intensidad: mat.emissiveIntensity };
    grupo.add(malla);
  }
  grupo.userData = { def, x0: 0, z0: 0, rot: 0, tmp: null };
  return grupo;
}

export class GestorMuebles {
  constructor(escena) {
    this.escena = escena;
    this.muebles = [];
  }

  def(id) {
    return CATALOGO.find(d => d.id === id);
  }

  medidas(def, rot) {
    return rot % 2 === 0 ? [def.ancho, def.fondo] : [def.fondo, def.ancho];
  }

  libre(mueble, x0, z0, rot) {
    const def = mueble.userData.def;
    const [w, d] = this.medidas(def, rot);
    if (x0 < -LIMITE || z0 < -LIMITE || x0 + w > LIMITE || z0 + d > LIMITE) return false;
    if (def.suelo) return true;
    for (const otro of this.muebles) {
      if (otro === mueble || otro.userData.def.suelo) continue;
      const o = otro.userData;
      const [ow, od] = this.medidas(o.def, o.rot);
      if (x0 < o.x0 + ow && x0 + w > o.x0 && z0 < o.z0 + od && z0 + d > o.z0) return false;
    }
    return true;
  }

  colocar(mueble, x0, z0, rot) {
    const datos = mueble.userData;
    const [w, d] = this.medidas(datos.def, rot);
    datos.x0 = x0;
    datos.z0 = z0;
    datos.rot = rot;
    mueble.position.set((x0 + w / 2) * CELDA, 0, (z0 + d / 2) * CELDA);
    mueble.rotation.y = rot * Math.PI / 2;
  }

  anadir(id, x0, z0, rot = 0) {
    const def = this.def(id);
    if (!def) return null;
    const mueble = crearMueble(def);
    this.escena.add(mueble);
    this.muebles.push(mueble);
    this.colocar(mueble, x0, z0, rot);
    return mueble;
  }

  quitar(mueble) {
    this.escena.remove(mueble);
    this.muebles = this.muebles.filter(m => m !== mueble);
    mueble.traverse(o => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
  }

  buscarHueco(id) {
    const def = this.def(id);
    const prueba = { userData: { def } };
    const candidatos = [];
    for (let rot = 0; rot < 2; rot++) {
      const [w, d] = this.medidas(def, rot);
      for (let x = -LIMITE; x + w <= LIMITE; x++) {
        for (let z = -LIMITE; z + d <= LIMITE; z++) {
          candidatos.push({ x, z, rot, dist: Math.hypot(x + w / 2, z + d / 2) + rot * 0.01 });
        }
      }
    }
    candidatos.sort((a, b) => a.dist - b.dist);
    return candidatos.find(c => this.libre(prueba, c.x, c.z, c.rot)) || null;
  }

  intersectar(raycaster) {
    const hits = raycaster.intersectObjects(this.muebles, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.def) o = o.parent;
    return o;
  }

  arrastrar(mueble, x, z) {
    const datos = mueble.userData;
    const [w, d] = this.medidas(datos.def, datos.rot);
    const x0 = THREE.MathUtils.clamp(Math.round(x / CELDA - w / 2), -LIMITE, LIMITE - w);
    const z0 = THREE.MathUtils.clamp(Math.round(z / CELDA - d / 2), -LIMITE, LIMITE - d);
    const valido = this.libre(mueble, x0, z0, datos.rot);
    mueble.position.set((x0 + w / 2) * CELDA, 0.08, (z0 + d / 2) * CELDA);
    datos.tmp = { x0, z0, valido };
    this.resaltar(mueble, valido ? 'sel' : 'mal');
  }

  soltar(mueble) {
    const datos = mueble.userData;
    const movido = !!(datos.tmp && datos.tmp.valido);
    if (movido) this.colocar(mueble, datos.tmp.x0, datos.tmp.z0, datos.rot);
    else this.colocar(mueble, datos.x0, datos.z0, datos.rot);
    datos.tmp = null;
    this.resaltar(mueble, 'sel');
    return movido;
  }

  cancelar(mueble) {
    mueble.userData.tmp = null;
    this.soltar(mueble);
  }

  rotar(mueble) {
    const datos = mueble.userData;
    const nuevaRot = (datos.rot + 1) % 4;
    const [w, d] = this.medidas(datos.def, datos.rot);
    const [nw, nd] = this.medidas(datos.def, nuevaRot);
    const x0 = THREE.MathUtils.clamp(Math.round(datos.x0 + w / 2 - nw / 2), -LIMITE, LIMITE - nw);
    const z0 = THREE.MathUtils.clamp(Math.round(datos.z0 + d / 2 - nd / 2), -LIMITE, LIMITE - nd);
    if (!this.libre(mueble, x0, z0, nuevaRot)) return false;
    this.colocar(mueble, x0, z0, nuevaRot);
    return true;
  }

  resaltar(mueble, modo) {
    mueble.traverse(o => {
      if (!o.isMesh) return;
      if (modo === 'sel') {
        o.material.emissive.set(0xffd27a);
        o.material.emissiveIntensity = 0.25;
      } else if (modo === 'mal') {
        o.material.emissive.set(0xff3030);
        o.material.emissiveIntensity = 0.5;
      } else {
        o.material.emissive.copy(o.userData.base.color);
        o.material.emissiveIntensity = o.userData.base.intensidad;
      }
    });
  }

  serializar() {
    return this.muebles.map(m => ({ id: m.userData.def.id, x0: m.userData.x0, z0: m.userData.z0, rot: m.userData.rot }));
  }
}
