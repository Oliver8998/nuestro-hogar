import * as THREE from 'three';

const TAM = 6;
const ALTO = 2.6;
const GROSOR = 0.15;

function caja(w, h, d, color) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function mancha(radio, color, opacidad) {
  return new THREE.Mesh(
    new THREE.CircleGeometry(radio, 20),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: opacidad, roughness: 1, depthWrite: false })
  );
}

export function crearSala(escena) {
  const mitad = TAM / 2;
  const sala = new THREE.Group();
  escena.add(sala);

  const base = caja(TAM + GROSOR * 2 + 0.2, 0.4, TAM + GROSOR * 2 + 0.2, 0xb9a48c);
  base.position.y = -0.3;
  sala.add(base);

  const tonos = [0x8a6a4a, 0x7d5f42, 0x93724f, 0x75583c];
  for (let i = 0; i < 12; i++) {
    const tabla = caja(0.48, 0.1, TAM, tonos[i % tonos.length]);
    tabla.castShadow = false;
    tabla.position.set(-mitad + 0.25 + i * 0.5, -0.05, 0);
    sala.add(tabla);
  }

  const tablaRota = caja(0.48, 0.1, 1.2, 0x6a4e34);
  tablaRota.position.set(1.25, 0.03, 1.6);
  tablaRota.rotation.x = -0.12;
  sala.add(tablaRota);

  const manchaSuelo = mancha(0.45, 0x3d2c1d, 0.45);
  manchaSuelo.rotation.x = -Math.PI / 2;
  manchaSuelo.position.set(-1, 0.003, 1.4);
  sala.add(manchaSuelo);

  const paredes = [];
  const defs = [
    { x: 0, z: -mitad - GROSOR / 2, rot: 0, n: new THREE.Vector3(0, 0, -1) },
    { x: 0, z: mitad + GROSOR / 2, rot: Math.PI, n: new THREE.Vector3(0, 0, 1) },
    { x: -mitad - GROSOR / 2, z: 0, rot: Math.PI / 2, n: new THREE.Vector3(-1, 0, 0) },
    { x: mitad + GROSOR / 2, z: 0, rot: -Math.PI / 2, n: new THREE.Vector3(1, 0, 0) }
  ];

  for (const d of defs) {
    const grupo = new THREE.Group();
    grupo.position.set(d.x, 0, d.z);
    grupo.rotation.y = d.rot;
    const muro = caja(TAM + GROSOR * 2, ALTO + 0.1, GROSOR, 0xcfc3a8);
    muro.position.y = (ALTO + 0.1) / 2 - 0.1;
    grupo.add(muro);
    grupo.userData.normal = d.n;
    sala.add(grupo);
    paredes.push(grupo);
  }

  const cara = GROSOR / 2 + 0.006;

  const ventana = new THREE.Group();
  ventana.position.set(1, 1.5, cara);
  const colorMarco = 0x6b4f36;
  [
    [1.2, 0.08, 0.06, 0, 0.6],
    [1.2, 0.08, 0.06, 0, -0.6],
    [0.08, 1.28, 0.06, -0.6, 0],
    [0.08, 1.28, 0.06, 0.6, 0],
    [0.06, 1.2, 0.06, 0, 0]
  ].forEach(([w, h, d, x, y]) => {
    const p = caja(w, h, d, colorMarco);
    p.position.set(x, y, 0);
    ventana.add(p);
  });

  const cristal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 1.12),
    new THREE.MeshStandardMaterial({ color: 0xa9d4e8, emissive: 0x8fc3dd, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 })
  );
  cristal.position.set(-0.3, 0, 0.001);
  ventana.add(cristal);

  [[-0.35, 0.2, 0.5, 0.6], [-0.22, 0.05, 0.35, -0.9], [-0.4, -0.15, 0.3, 0.3]].forEach(([x, y, largo, ang]) => {
    const grieta = caja(largo, 0.012, 0.005, 0x2f3b40);
    grieta.castShadow = false;
    grieta.position.set(x, y, 0.004);
    grieta.rotation.z = ang;
    ventana.add(grieta);
  });

  const carton = caja(0.55, 1.1, 0.02, 0xb8875a);
  carton.position.set(0.3, 0, 0.01);
  carton.rotation.z = 0.04;
  ventana.add(carton);

  [0.7, -0.7].forEach(ang => {
    const cinta = caja(0.7, 0.06, 0.005, 0xe0c878);
    cinta.castShadow = false;
    cinta.position.set(0.3, 0, 0.025);
    cinta.rotation.z = ang;
    ventana.add(cinta);
  });

  paredes[0].add(ventana);

  [[-1.6, 1.9, 0.6, -0.7], [-1.3, 1.55, 0.4, 0.5], [-1.45, 1.2, 0.5, -0.4]].forEach(([x, y, largo, ang]) => {
    const grieta = caja(largo, 0.02, 0.005, 0x7a6f5c);
    grieta.castShadow = false;
    grieta.position.set(x, y, cara);
    grieta.rotation.z = ang;
    paredes[0].add(grieta);
  });

  [[1.6, 0.4, 0.5, 0.45], [2.1, 0.25, 0.35, 0.35], [1.2, 0.75, 0.3, 0.3], [-2.2, 2.2, 0.4, 0.3]].forEach(([x, y, r, o]) => {
    const m = mancha(r, 0x6e6b4c, o);
    m.position.set(x, y, cara);
    paredes[2].add(m);
  });

  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.6, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  cable.position.set(0, ALTO - 0.3, 0);
  sala.add(cable);

  const bombilla = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffd27a, emissiveIntensity: 1 })
  );
  bombilla.position.set(0, ALTO - 0.65, 0);
  sala.add(bombilla);

  const luz = new THREE.PointLight(0xffd08a, 8, 0, 2);
  luz.position.copy(bombilla.position);
  sala.add(luz);

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7560, 1.4);
  escena.add(hemi);

  const sol = new THREE.DirectionalLight(0xfff0dd, 1.6);
  sol.position.set(6, 10, 4);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.left = -5;
  sol.shadow.camera.right = 5;
  sol.shadow.camera.top = 5;
  sol.shadow.camera.bottom = -5;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 25;
  sol.shadow.bias = -0.0005;
  escena.add(sol);

  function actualizarParedes(direccion) {
    for (const p of paredes) p.visible = p.userData.normal.dot(direccion) < 0.25;
  }

  function animar() {
    if (Math.random() < 0.01) luz.intensity = 1.5;
    else luz.intensity += (8 - luz.intensity) * 0.2;
    bombilla.material.emissiveIntensity = luz.intensity / 8;
  }

  return { actualizarParedes, animar };
}
