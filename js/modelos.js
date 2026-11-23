import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const MODELOS = new Map();
const VERSION_MODELOS = 6;

export async function cargarModelos(ruta = `./assets/modelos.glb?v=${VERSION_MODELOS}`) {
  try {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    const gltf = await loader.loadAsync(ruta);
    draco.dispose();
    gltf.scene.updateMatrixWorld(true);
    for (const raiz of gltf.scene.children) {
      if (!raiz.name.startsWith('item_')) continue;
      const id = raiz.name.slice(5);
      const piezas = new Map();
      const extras = [];
      raiz.traverse(o => {
        if (!o.isMesh) return;
        const nombre = (o.userData.name || o.name).replace(/\./g, '');
        o.geometry.userData.compartida = true;
        const p = nombre.match(/__p(\d+)$/);
        if (p) {
          piezas.set(Number(p[1]), o);
          return;
        }
        const de = nombre.match(/_o(\d+)$/);
        extras.push({ malla: o, de: de ? Number(de[1]) : null });
      });
      MODELOS.set(id, { piezas, extras });
    }
  } catch (e) {
    console.warn('No se pudieron cargar los modelos', e);
  }
}

export function tieneModelo(id) {
  return MODELOS.has(id);
}

export function modeloSuelto(id) {
  const m = MODELOS.get(id);
  if (!m) return null;
  const grupo = new THREE.Group();
  for (const o of [...m.piezas.values(), ...m.extras.map(e => e.malla)]) {
    const malla = new THREE.Mesh(o.geometry, o.material.clone());
    malla.position.copy(o.position);
    malla.quaternion.copy(o.quaternion);
    malla.scale.copy(o.scale);
    malla.castShadow = true;
    malla.receiveShadow = true;
    grupo.add(malla);
  }
  return grupo;
}

function materialPieza(pieza) {
  const [, , , , , , color] = pieza;
  let op = pieza[8] || {};
  if (pieza[7] && typeof pieza[7] === 'object') op = pieza[7];
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: op.rugosidad ?? 0.75,
    metalness: op.metal ?? 0
  });
  if (op.transparente) {
    mat.transparent = true;
    mat.opacity = op.transparente;
  }
  if (op.brillo) {
    mat.emissive.setHex(color);
    mat.emissiveIntensity = 0.4;
  }
  return { mat, op };
}

function construirConModelo(m, piezas, sombras) {
  const grupo = new THREE.Group();
  const mallas = [];
  const todas = [];
  piezas.forEach((pieza, i) => {
    const { mat, op } = materialPieza(pieza);
    const fuente = m.piezas.get(i);
    let malla;
    if (fuente) {
      malla = new THREE.Mesh(fuente.geometry, mat);
      malla.position.copy(fuente.position);
      malla.quaternion.copy(fuente.quaternion);
      malla.scale.copy(fuente.scale);
    } else {
      malla = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.001, 0.001), mat);
      malla.visible = false;
    }
    malla.castShadow = sombras && !op.transparente;
    malla.receiveShadow = true;
    malla.userData.base = { color: mat.emissive.clone(), intensidad: mat.emissiveIntensity };
    grupo.add(malla);
    mallas.push(malla);
    todas.push(malla);
  });
  for (const { malla: fuente, de } of m.extras) {
    const mat = fuente.material.clone();
    const malla = new THREE.Mesh(fuente.geometry, mat);
    malla.position.copy(fuente.position);
    malla.quaternion.copy(fuente.quaternion);
    malla.scale.copy(fuente.scale);
    malla.castShadow = sombras && !mat.transparent;
    malla.receiveShadow = true;
    malla.userData.base = { color: mat.emissive.clone(), intensidad: mat.emissiveIntensity };
    if (de !== null && mallas[de]) {
      grupo.add(malla);
      grupo.updateMatrixWorld(true);
      mallas[de].attach(malla);
    } else {
      grupo.add(malla);
    }
    todas.push(malla);
  }
  return { grupo, mallas, todas };
}

export function construirPiezas(piezas, { sombras = true, id = null } = {}) {
  if (id && MODELOS.has(id)) return construirConModelo(MODELOS.get(id), piezas, sombras);

  const grupo = new THREE.Group();
  const mallas = [];
  for (const pieza of piezas) {
    const [w, h, d, x, y, z] = pieza;
    let forma = pieza[7];
    if (forma && typeof forma === 'object') forma = undefined;

    let geo;
    if (forma === 'cil') geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 20);
    else if (forma === 'cono') geo = new THREE.ConeGeometry(w / 2, h, 20);
    else if (forma === 'esfera') geo = new THREE.SphereGeometry(0.5, 20, 16);
    else geo = new THREE.BoxGeometry(w, h, d);

    const { mat, op } = materialPieza(pieza);
    const malla = new THREE.Mesh(geo, mat);
    if (forma === 'esfera') malla.scale.set(w, h, d);
    malla.position.set(x, y, z);
    malla.rotation.set(op.rx || 0, op.ry || 0, op.rz || 0);
    malla.castShadow = sombras && !op.transparente;
    malla.receiveShadow = true;
    malla.userData.base = { color: mat.emissive.clone(), intensidad: mat.emissiveIntensity };
    grupo.add(malla);
    mallas.push(malla);
  }
  return { grupo, mallas, todas: mallas };
}

export function liberar(objeto) {
  objeto.traverse(o => {
    if (o.isMesh) {
      if (!o.geometry.userData.compartida) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(m => m.dispose());
    }
  });
}
