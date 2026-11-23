import * as THREE from 'three';

function m(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
}

function esfera(sx, sy, sz, color, x, y, z) {
  const malla = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 18), m(color));
  malla.scale.set(sx, sy, sz);
  malla.position.set(x, y, z);
  return malla;
}

export const PERSONAJES = {
  lola: { piel: 0xf6d2b8, pelo: 0x7a4a2e, ropa: 0xf4b3be, delantal: 0x6cc08a, peinado: 'mono' },
  mateo: { piel: 0xe0b08f, pelo: 0x2f2a28, ropa: 0x9bb8d9, delantal: 0xffffff, peinado: 'corto', gafas: true },
  sol: { piel: 0xf3c9a6, pelo: 0xe0a83a, ropa: 0xb39ddb, delantal: 0xf2d06b, peinado: 'coletas' },
  mama: { piel: 0xf2cdb4, pelo: 0xb8b0a8, ropa: 0x8e6bbf, delantal: 0xe8dccb, peinado: 'mono', gafas: true },
  amigos: { piel: 0xd9a27e, pelo: 0x3b2f26, ropa: 0x6cc08a, delantal: 0xf2d06b, peinado: 'corto' }
};

export function crearPersonaje(id) {
  const p = PERSONAJES[id];
  const g = new THREE.Group();

  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.5, 24), m(p.ropa));
  cuerpo.position.y = 0.25;
  g.add(cuerpo);
  const delantal = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.305, 0.36, 24, 1, true, -0.9, 1.8), m(p.delantal, { side: THREE.DoubleSide }));
  delantal.position.y = 0.2;
  g.add(delantal);

  for (const s of [-1, 1]) {
    const brazo = esfera(0.12, 0.28, 0.12, p.ropa, s * 0.25, 0.32, 0.02);
    brazo.rotation.z = s * 0.35;
    g.add(brazo);
    g.add(esfera(0.09, 0.09, 0.09, p.piel, s * 0.3, 0.19, 0.05));
  }

  const cabeza = new THREE.Group();
  cabeza.position.y = 0.78;
  g.add(cabeza);
  cabeza.add(esfera(0.56, 0.52, 0.52, p.piel, 0, 0, 0));
  cabeza.add(esfera(0.6, 0.38, 0.56, p.pelo, 0, 0.12, -0.03));
  const flequillo = esfera(0.5, 0.16, 0.2, p.pelo, 0, 0.17, 0.18);
  flequillo.rotation.x = -0.2;
  cabeza.add(flequillo);

  if (p.peinado === 'mono') cabeza.add(esfera(0.22, 0.22, 0.22, p.pelo, 0, 0.32, -0.08));
  if (p.peinado === 'coletas') {
    for (const s of [-1, 1]) cabeza.add(esfera(0.16, 0.26, 0.16, p.pelo, s * 0.3, -0.02, -0.06));
  }
  if (p.peinado !== 'corto') cabeza.add(esfera(0.58, 0.3, 0.4, p.pelo, 0, -0.04, -0.14));

  for (const s of [-1, 1]) {
    cabeza.add(esfera(0.07, 0.09, 0.04, 0x2b2320, s * 0.11, -0.02, 0.24));
    cabeza.add(esfera(0.025, 0.025, 0.01, 0xffffff, s * 0.11 + 0.015, 0.005, 0.26));
    const mejilla = esfera(0.09, 0.05, 0.02, 0xf29aa8, s * 0.17, -0.09, 0.22);
    mejilla.material.transparent = true;
    mejilla.material.opacity = 0.75;
    cabeza.add(mejilla);
    if (p.gafas) {
      const aro = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 8, 24), m(0x3b2f26));
      aro.position.set(s * 0.11, -0.02, 0.26);
      cabeza.add(aro);
    }
  }
  if (p.gafas) {
    const puente = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.012), m(0x3b2f26));
    puente.position.set(0, -0.01, 0.27);
    cabeza.add(puente);
  }

  const sonrisa = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 20, Math.PI), m(0x8a3b3b));
  sonrisa.rotation.z = Math.PI;
  sonrisa.position.set(0, -0.11, 0.25);
  cabeza.add(sonrisa);

  g.userData.cabeza = cabeza;
  return g;
}
