import * as THREE from 'three';

export function construirPiezas(piezas, { sombras = true } = {}) {
  const grupo = new THREE.Group();
  const mallas = [];
  for (const pieza of piezas) {
    const [w, h, d, x, y, z, color] = pieza;
    let forma = pieza[7];
    let op = pieza[8] || {};
    if (forma && typeof forma === 'object') {
      op = forma;
      forma = undefined;
    }

    let geo;
    if (forma === 'cil') geo = new THREE.CylinderGeometry(w / 2, w / 2, h, 20);
    else if (forma === 'cono') geo = new THREE.ConeGeometry(w / 2, h, 20);
    else if (forma === 'esfera') geo = new THREE.SphereGeometry(0.5, 20, 16);
    else geo = new THREE.BoxGeometry(w, h, d);

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
  return { grupo, mallas };
}

export function liberar(objeto) {
  objeto.traverse(o => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
}
