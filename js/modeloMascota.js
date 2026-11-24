import * as THREE from 'three';

const GEO = {};
function geo(clave, crear) {
  if (!GEO[clave]) {
    GEO[clave] = crear();
    GEO[clave].userData.compartida = true;
  }
  return GEO[clave];
}

const ESFERA = () => geo('esfera', () => new THREE.SphereGeometry(0.5, 22, 16));
const CONO = () => geo('cono', () => new THREE.ConeGeometry(0.5, 1, 14));
const CONO4 = () => geo('cono4', () => new THREE.ConeGeometry(0.5, 1, 4));
const CIL = () => geo('cil', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12));
const CAPSULA = () => geo('capsula', () => new THREE.CapsuleGeometry(0.5, 1, 6, 12));

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
}

function malla(g, material, padre, [sx, sy, sz], [x, y, z], rot = null) {
  const m = new THREE.Mesh(g, material);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.castShadow = true;
  padre.add(m);
  return m;
}

const esf = (padre, material, s, p, r) => malla(ESFERA(), material, padre, s, p, r);
const cono = (padre, material, s, p, r) => malla(CONO(), material, padre, s, p, r);
const cil = (padre, material, s, p, r) => malla(CIL(), material, padre, s, p, r);
const capsula = (padre, material, s, p, r) => malla(CAPSULA(), material, padre, s, p, r);

function pivote(padre, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  padre.add(g);
  return g;
}

function ojo(padre, x, y, z, r = 1, opciones = {}) {
  const g = pivote(padre, x, y, z);
  g.rotation.y = Math.sign(x) * 0.25;
  if (opciones.blanco) esf(g, mat(0xffffff, { roughness: 0.4 }), [0.06 * r, 0.065 * r, 0.03 * r], [0, 0, -0.004]);
  esf(g, mat(opciones.iris || 0x2a1f1a, { roughness: 0.25 }), [0.046 * r, 0.054 * r, 0.026 * r], [0, 0, 0]);
  const brillo = mat(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.35 });
  esf(g, brillo, [0.017 * r, 0.017 * r, 0.01 * r], [0.011 * r, 0.014 * r, 0.011 * r]);
  esf(g, brillo, [0.008 * r, 0.008 * r, 0.006 * r], [-0.01 * r, -0.012 * r, 0.011 * r]);
  return g;
}

function bigotes(padre, x, y, z, color = 0xf7efe6) {
  const m = mat(color, { roughness: 0.5 });
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      cil(padre, m, [0.004, 0.09, 0.004], [x + s * 0.06, y + (k - 1) * 0.012, z], [0, 0, s * (Math.PI / 2 + (k - 1) * 0.18)]);
    }
  }
}

function boca(padre, y, z, gato = false) {
  const m = mat(0x3b2a22);
  const g = pivote(padre, 0, y, z);
  const arco = geo('arco', () => new THREE.TorusGeometry(0.014, 0.0035, 6, 12, Math.PI));
  if (gato) {
    for (const s of [-1, 1]) {
      const a = new THREE.Mesh(arco, m);
      a.position.x = s * 0.014;
      a.rotation.z = Math.PI;
      g.add(a);
    }
  } else {
    const a = new THREE.Mesh(arco, m);
    a.rotation.z = Math.PI;
    a.scale.set(1.3, 1, 1);
    g.add(a);
  }
  return g;
}

function orejas(cabeza, e, partes, oscuro, rosa) {
  const tipo = e.orejas;
  if (!tipo || tipo === 'ninguna') return;
  for (const s of [-1, 1]) {
    let p;
    if (tipo === 'punta' || tipo === 'punta-grande') {
      const g = tipo === 'punta-grande';
      p = pivote(cabeza, s * (g ? 0.07 : 0.072), 0.075, -0.01);
      p.rotation.z = -s * (g ? 0.32 : 0.28);
      const cuerpo = new THREE.Mesh(CONO4(), mat(e.color));
      cuerpo.scale.set(g ? 0.1 : 0.085, g ? 0.15 : 0.1, g ? 0.05 : 0.045);
      cuerpo.position.y = g ? 0.07 : 0.045;
      cuerpo.rotation.y = Math.PI / 4;
      cuerpo.castShadow = true;
      p.add(cuerpo);
      const dentro = new THREE.Mesh(CONO4(), mat(rosa));
      dentro.scale.set(g ? 0.06 : 0.05, g ? 0.1 : 0.065, 0.02);
      dentro.position.set(0, g ? 0.06 : 0.04, 0.016);
      dentro.rotation.y = Math.PI / 4;
      p.add(dentro);
      if (g) {
        const punta = new THREE.Mesh(CONO4(), mat(0x3b2a22));
        punta.scale.set(0.045, 0.05, 0.03);
        punta.position.y = 0.135;
        punta.rotation.y = Math.PI / 4;
        p.add(punta);
      }
    } else if (tipo === 'caidas') {
      p = pivote(cabeza, s * 0.095, 0.06, -0.01);
      p.rotation.z = s * 0.25;
      esf(p, mat(oscuro), [0.07, 0.15, 0.045], [s * 0.02, -0.06, 0]);
    } else if (tipo === 'largas') {
      p = pivote(cabeza, s * 0.045, 0.08, -0.02);
      p.rotation.z = -s * 0.14;
      p.rotation.x = -0.12;
      capsula(p, mat(e.color), [0.055, 0.1, 0.035], [0, 0.1, 0]);
      capsula(p, mat(rosa), [0.03, 0.08, 0.01], [0, 0.1, 0.014]);
    } else {
      p = pivote(cabeza, s * 0.08, 0.075, -0.005);
      p.rotation.z = -s * 0.3;
      esf(p, mat(e.color), [0.065, 0.065, 0.03], [0, 0.02, 0]);
      esf(p, mat(rosa), [0.04, 0.04, 0.01], [0, 0.02, 0.012]);
    }
    partes.orejas.push(p);
  }
}

function colaDe(cuerpo, e, partes, oscuro) {
  if (!e.cola) return;
  const p = pivote(cuerpo, 0, 0.2, -0.155);
  partes.cola = p;
  if (e.cola === 'larga') {
    const m = mat(e.color);
    p.rotation.x = -0.55;
    capsula(p, m, [0.04, 0.09, 0.04], [0, 0, -0.06], [Math.PI / 2, 0, 0]);
    const p2 = pivote(p, 0, 0, -0.12);
    p2.rotation.x = -0.6;
    capsula(p2, m, [0.036, 0.08, 0.036], [0, 0, -0.05], [Math.PI / 2, 0, 0]);
    if (e.gato) esf(p2, mat(oscuro), [0.042, 0.042, 0.05], [0, 0, -0.1]);
    if (e.dragon) {
      const punta = new THREE.Mesh(CONO4(), mat(e.secundario));
      punta.scale.set(0.09, 0.08, 0.02);
      punta.position.set(0, 0, -0.13);
      punta.rotation.x = -Math.PI / 2;
      p2.add(punta);
    }
    partes.colaPunta = p2;
  } else if (e.cola === 'corta') {
    p.rotation.x = -0.9;
    capsula(p, mat(e.color), [0.045, 0.05, 0.045], [0, 0, -0.04], [Math.PI / 2, 0, 0]);
  } else if (e.cola === 'bola') {
    p.position.set(0, 0.17, -0.17);
    esf(p, mat(0xffffff), [0.09, 0.085, 0.08], [0, 0, -0.01]);
  } else {
    p.rotation.x = -0.25;
    esf(p, mat(e.color), [0.13, 0.13, 0.3], [0, 0.05, -0.12], [0.35, 0, 0]);
    const p2 = pivote(p, 0, 0.1, -0.24);
    partes.colaPunta = p2;
    esf(p2, mat(e.color), [0.12, 0.12, 0.16], [0, 0, 0]);
    esf(p2, mat(e.secundario), [0.1, 0.1, 0.12], [0, 0.02, -0.07]);
  }
}

function cuadrupedo(raiz, cuerpo, e, partes) {
  const oscuro = new THREE.Color(e.color).multiplyScalar(0.72).getHex();
  const rosa = 0xf4a7b5;
  const redondo = e.redondo;
  const largo = e.largo || 1;
  const cuerpoM = mat(e.color);
  if (redondo) {
    esf(cuerpo, cuerpoM, [0.3, 0.26, 0.32 * largo], [0, 0.17, 0]);
    esf(cuerpo, mat(e.secundario), [0.22, 0.17, 0.22], [0, 0.13, 0.07]);
  } else {
    esf(cuerpo, cuerpoM, [0.25, 0.21, 0.36 * largo], [0, 0.18, -0.01]);
    esf(cuerpo, mat(e.secundario), [0.17, 0.14, 0.24 * largo], [0, 0.14, 0.05]);
    esf(cuerpo, cuerpoM, [0.21, 0.2, 0.2], [0, 0.2, 0.1]);
  }
  if (e.rayas) {
    const r = mat(oscuro);
    for (let k = 0; k < 3; k++) esf(cuerpo, r, [0.2, 0.03, 0.04], [0, 0.275 - k * 0.003, 0.02 - k * 0.08], [0.15, 0, 0]);
  }
  if (e.manchas) {
    const r = mat(e.manchas);
    esf(cuerpo, r, [0.13, 0.11, 0.15], [0.07, 0.25, -0.07]);
    esf(cuerpo, r, [0.09, 0.08, 0.09], [-0.09, 0.22, 0.05]);
  }
  if (e.dragon) {
    const pl = mat(e.secundario);
    for (let k = 0; k < 4; k++) cono(cuerpo, pl, [0.04, 0.06, 0.04], [0, 0.29 - Math.abs(k - 1) * 0.01, 0.08 - k * 0.07], [-0.3, 0, 0]);
    for (let k = 0; k < 3; k++) esf(cuerpo, pl, [0.15, 0.025, 0.05], [0, 0.085, 0.1 - k * 0.07]);
  }

  const cabeza = pivote(cuerpo, 0, redondo ? 0.27 : 0.32, redondo ? 0.15 : 0.17);
  partes.cabeza = cabeza;
  const tamCab = e.cabezaGrande || 1;
  const cab = esf(cabeza, mat(e.color), [0.25 * tamCab, 0.225 * tamCab, 0.22 * tamCab], [0, 0, 0]);
  void cab;
  const zc = 0.1 * tamCab;
  if (e.hocico === 'largo') {
    esf(cabeza, mat(e.secundario), [0.11, 0.085, 0.13], [0, -0.04, zc]);
    esf(cabeza, mat(0x2a1f1a, { roughness: 0.3 }), [0.04, 0.03, 0.028], [0, -0.012, zc + 0.065]);
  } else if (e.hocico === 'zorro') {
    const h = new THREE.Mesh(CONO(), mat(e.secundario));
    h.scale.set(0.1, 0.12, 0.08);
    h.position.set(0, -0.035, zc + 0.03);
    h.rotation.x = Math.PI / 2;
    h.castShadow = true;
    cabeza.add(h);
    esf(cabeza, mat(0x2a1f1a, { roughness: 0.3 }), [0.032, 0.026, 0.026], [0, -0.035, zc + 0.09]);
  } else {
    esf(cabeza, mat(e.secundario), [0.12, 0.08, 0.08], [0, -0.04, zc - 0.01]);
    esf(cabeza, mat(e.nariz || 0xd9727f, { roughness: 0.4 }), [0.03, 0.022, 0.02], [0, -0.012, zc + 0.03]);
  }
  partes.boca = boca(cabeza, -0.058, zc + (e.hocico === 'largo' ? 0.045 : e.hocico === 'zorro' ? 0.045 : 0.026), e.gato || e.bigotes);
  if (e.perro) {
    const lengua = esf(cabeza, mat(0xe57b8a), [0.035, 0.012, 0.05], [0, -0.075, zc + 0.04]);
    lengua.visible = false;
    partes.lengua = lengua;
    if (e.parche) esf(cabeza, mat(oscuro), [0.07, 0.07, 0.03], [0.058, 0.025, zc - 0.012]);
  }
  if (e.mofletes) {
    for (const s of [-1, 1]) esf(cabeza, mat(e.secundario), [0.1, 0.09, 0.09], [s * 0.085, -0.035, 0.03]);
  }
  if (e.dientes) {
    const b = mat(0xffffff, { roughness: 0.4 });
    for (const s of [-1, 1]) malla(geo('caja', () => new THREE.BoxGeometry(1, 1, 1)), b, cabeza, [0.012, 0.018, 0.006], [s * 0.007, -0.072, zc + 0.03]);
  }
  if (e.rayas) {
    const r = mat(oscuro);
    for (let k = 0; k < 3; k++) esf(cabeza, r, [0.014, 0.05, 0.02], [(k - 1) * 0.025, 0.085, 0.07], [0.5, 0, 0]);
  }
  if (e.dragon) {
    const cu = mat(0xf2e6c8, { roughness: 0.5 });
    for (const s of [-1, 1]) cono(cabeza, cu, [0.035, 0.09, 0.035], [s * 0.055, 0.105, -0.04], [-0.5, 0, -s * 0.25]);
  }
  for (const s of [-1, 1]) {
    partes.ojos.push(ojo(cabeza, s * 0.058, 0.02, zc - 0.004, tamCab, { iris: e.iris }));
    const mej = esf(cabeza, mat(0xf4a3b0, { transparent: true, opacity: 0.65 }), [0.045, 0.026, 0.01], [s * 0.085, -0.03, zc - 0.018]);
    mej.castShadow = false;
  }
  if (e.bigotes || e.gato) bigotes(cabeza, 0, -0.03, zc + 0.02);
  orejas(cabeza, e, partes, oscuro, rosa);

  const patasM = mat(e.calcetines || e.color);
  const pataAlto = e.patasCortas ? 0.07 : 0.1;
  const ancho = redondo ? 0.09 : 0.078;
  const delante = redondo ? 0.09 : 0.11 * largo;
  for (const [x, z] of [[-ancho, delante], [ancho, delante], [-ancho, -delante], [ancho, -delante]]) {
    const pv = pivote(raiz, x, pataAlto, z);
    if (!redondo) cil(pv, mat(e.color), [0.052, pataAlto, 0.052], [0, -pataAlto / 2, 0]);
    esf(pv, patasM, [0.075, 0.05, e.pies || 0.085], [0, -pataAlto + 0.02, 0.012]);
    partes.patas.push(pv);
  }
  colaDe(cuerpo, e, partes, oscuro);

  if (e.dragon) {
    const forma = new THREE.Shape();
    forma.moveTo(0, 0);
    forma.quadraticCurveTo(0.08, 0.16, 0.22, 0.2);
    forma.lineTo(0.17, 0.12);
    forma.lineTo(0.2, 0.06);
    forma.lineTo(0.13, 0.03);
    forma.quadraticCurveTo(0.08, -0.02, 0, 0);
    const geoAla = new THREE.ShapeGeometry(forma);
    for (const s of [-1, 1]) {
      const pv = pivote(cuerpo, s * 0.08, 0.27, -0.02);
      const ala = new THREE.Mesh(geoAla, mat(e.secundario, { side: THREE.DoubleSide }));
      ala.scale.set(s, 1, 1);
      ala.rotation.y = s * 0.4;
      ala.castShadow = true;
      pv.add(ala);
      pv.rotation.z = -s * 0.2;
      partes.alas.push(pv);
    }
  }
}

function tortuga(raiz, cuerpo, e, partes) {
  const piel = mat(e.color);
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(e.caparazon, { roughness: 0.6 }));
  casco.scale.set(1, 0.8, 1.15);
  casco.position.y = 0.12;
  casco.castShadow = true;
  cuerpo.add(casco);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28), mat(0xc9a066));
  borde.rotation.x = Math.PI / 2;
  borde.scale.set(1, 1.15, 1);
  borde.position.y = 0.12;
  cuerpo.add(borde);
  const placa = mat(0xa07a48, { roughness: 0.5 });
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2;
    esf(cuerpo, placa, [0.085, 0.03, 0.085], [Math.cos(a) * 0.11, 0.24, Math.sin(a) * 0.13], [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]);
  }
  esf(cuerpo, placa, [0.1, 0.04, 0.1], [0, 0.28, 0]);
  esf(cuerpo, mat(e.secundario), [0.36, 0.06, 0.42], [0, 0.105, 0]);
  const cabeza = pivote(cuerpo, 0, 0.17, 0.22);
  partes.cabeza = cabeza;
  capsula(cabeza, piel, [0.08, 0.06, 0.08], [0, -0.02, -0.05], [Math.PI / 2 - 0.4, 0, 0]);
  esf(cabeza, piel, [0.15, 0.13, 0.16], [0, 0.02, 0.02]);
  for (const s of [-1, 1]) {
    partes.ojos.push(ojo(cabeza, s * 0.045, 0.04, 0.075, 0.85));
    const mej = esf(cabeza, mat(0xf4a3b0, { transparent: true, opacity: 0.6 }), [0.03, 0.018, 0.01], [s * 0.055, 0.005, 0.07]);
    mej.castShadow = false;
  }
  partes.boca = boca(cabeza, -0.005, 0.095);
  for (const [x, z] of [[-0.14, 0.13], [0.14, 0.13], [-0.14, -0.13], [0.14, -0.13]]) {
    const pv = pivote(raiz, x, 0.08, z);
    esf(pv, piel, [0.08, 0.09, 0.08], [Math.sign(x) * 0.01, -0.035, 0]);
    partes.patas.push(pv);
  }
  const cola = pivote(cuerpo, 0, 0.1, -0.22);
  cono(cola, piel, [0.04, 0.06, 0.04], [0, 0, -0.02], [-Math.PI / 2, 0, 0]);
  partes.cola = cola;
}

function ave(raiz, cuerpo, e, partes) {
  const oscuro = new THREE.Color(e.color).multiplyScalar(0.78).getHex();
  const plumas = mat(e.color);
  let cabeza;
  if (e.pinguino) {
    esf(cuerpo, plumas, [0.27, 0.42, 0.26], [0, 0.25, 0]);
    esf(cuerpo, mat(e.secundario), [0.2, 0.33, 0.12], [0, 0.22, 0.075]);
    cabeza = pivote(cuerpo, 0, 0.47, 0.02);
    esf(cabeza, plumas, [0.22, 0.2, 0.2], [0, 0, 0]);
    esf(cabeza, mat(e.secundario), [0.14, 0.08, 0.05], [0, -0.04, 0.07]);
  } else if (e.loro) {
    esf(cuerpo, plumas, [0.22, 0.3, 0.24], [0, 0.22, 0], [0.25, 0, 0]);
    esf(cuerpo, mat(0xe05050), [0.15, 0.16, 0.08], [0, 0.29, 0.08]);
    const colaM = mat(0x5a9fd6);
    for (const s of [-1, 0, 1]) capsula(cuerpo, s ? colaM : mat(0xe05050), [0.035, 0.14, 0.02], [s * 0.03, 0.14, -0.18], [0.9, 0, s * 0.15]);
    cabeza = pivote(cuerpo, 0, 0.42, 0.05);
    esf(cabeza, plumas, [0.19, 0.19, 0.19], [0, 0, 0]);
    esf(cabeza, mat(0xffffff), [0.1, 0.08, 0.06], [0, 0.01, 0.06]);
    const cresta = [0xe05050, 0xf2d06b, 0x5a9fd6];
    for (let k = 0; k < 3; k++) capsula(cabeza, mat(cresta[k]), [0.025, 0.05, 0.02], [(k - 1) * 0.022, 0.1, -0.02], [-0.5, 0, (k - 1) * 0.25]);
  } else {
    esf(cuerpo, plumas, [0.28, 0.24, 0.34], [0, 0.18, 0]);
    esf(cuerpo, mat(0xfff7d6), [0.2, 0.15, 0.2], [0, 0.13, 0.06]);
    cono(cuerpo, plumas, [0.1, 0.1, 0.06], [0, 0.26, -0.17], [-1.1, 0, 0]);
    cabeza = pivote(cuerpo, 0, 0.36, 0.11);
    esf(cabeza, plumas, [0.19, 0.19, 0.19], [0, 0, 0]);
  }
  partes.cabeza = cabeza;
  const pico = mat(e.pico, { roughness: 0.5 });
  if (e.loro) {
    cono(cabeza, mat(0x3d3d3d, { roughness: 0.5 }), [0.06, 0.08, 0.06], [0, -0.025, 0.1], [Math.PI / 2 + 0.6, 0, 0]);
  } else if (e.pinguino) {
    cono(cabeza, pico, [0.045, 0.08, 0.035], [0, -0.01, 0.11], [Math.PI / 2, 0, 0]);
  } else {
    esf(cabeza, pico, [0.11, 0.035, 0.1], [0, -0.025, 0.1]);
    esf(cabeza, pico, [0.1, 0.025, 0.085], [0, -0.045, 0.09]);
  }
  for (const s of [-1, 1]) {
    partes.ojos.push(ojo(cabeza, s * 0.05, 0.03, e.pinguino ? 0.082 : 0.075, 0.8, { blanco: e.pinguino }));
    const mej = esf(cabeza, mat(0xf4a3b0, { transparent: true, opacity: 0.6 }), [0.035, 0.02, 0.01], [s * 0.065, -0.01, 0.07]);
    mej.castShadow = false;
    const pv = pivote(cuerpo, s * (e.pinguino ? 0.13 : 0.12), e.pinguino ? 0.32 : 0.23, 0);
    pv.rotation.z = -s * 0.1;
    esf(pv, mat(e.pinguino ? e.color : e.loro ? 0x3f9a44 : oscuro), [0.05, e.pinguino ? 0.24 : 0.14, e.pinguino ? 0.1 : 0.22], [s * 0.01, -0.06, -0.01]);
    if (e.loro) esf(pv, mat(0xf2d06b), [0.04, 0.06, 0.1], [s * 0.012, -0.11, -0.04]);
    partes.alas.push(pv);
    const pata = pivote(raiz, s * 0.065, 0.05, 0.02);
    const colorPata = e.loro ? 0x9a8a80 : e.pico;
    cil(pata, mat(colorPata), [0.025, 0.06, 0.025], [0, 0, 0]);
    esf(pata, mat(colorPata), [0.075, 0.025, 0.1], [0, -0.04, 0.03]);
    partes.patas.push(pata);
  }
}

const KENNEY = new Map();

export async function cargarMascotasKenney(especies) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  const ids = [...new Set(Object.values(especies).map(e => e.kenney).filter(Boolean))];
  await Promise.all(ids.map(id => loader.loadAsync(`./assets/kenney/mascotas/${id}.glb?v=1`).then(g => KENNEY.set(id, g)).catch(() => {})));
}

export function ponerClip(p, nombre, fundido = 0.25) {
  if (!p.mixer || p.clip === nombre) return;
  const nueva = p.acciones[nombre] || p.acciones.idle;
  if (!nueva) return;
  const vieja = p.clip ? p.acciones[p.clip] : null;
  nueva.reset();
  nueva.setEffectiveWeight(1);
  nueva.play();
  if (vieja && vieja !== nueva) vieja.crossFadeTo(nueva, fundido, false);
  p.clip = nombre;
}

function modeloKenney(e) {
  const g = KENNEY.get(e.kenney);
  if (!g) return null;
  const raiz = new THREE.Group();
  const cuerpo = new THREE.Group();
  raiz.add(cuerpo);
  const escena = g.scene.clone(true);
  escena.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
      o.geometry.userData.compartida = true;
    }
  });
  escena.scale.setScalar(0.27);
  cuerpo.add(escena);
  const mixer = new THREE.AnimationMixer(escena);
  const acciones = {};
  for (const clip of g.animations) acciones[clip.name] = mixer.clipAction(clip);
  const nodos = {};
  for (const n of ['wing-left', 'wing-right', 'tail', 'leg-back-left', 'leg-back-right', 'leg-front-left', 'leg-front-right', 'body']) {
    const o = escena.getObjectByName(n);
    if (o) nodos[n] = { obj: o, q0: o.quaternion.clone() };
  }
  const partes = { raiz, cuerpoGrupo: cuerpo, patas: [], ojos: [], alas: [], orejas: [], cola: null, colaPunta: null, cabeza: null, boca: null, lengua: null, mixer, acciones, clip: null, kenney: true, nodos };
  ponerClip(partes, 'idle', 0);
  mixer.update(0.01);
  raiz.scale.setScalar(e.tam * 1.5);
  return partes;
}

export function crearModeloMascota(especie, ESPECIES) {
  const e = ESPECIES[especie];
  if (e.kenney) {
    const k = modeloKenney(e);
    if (k) return k;
  }
  const raiz = new THREE.Group();
  const cuerpo = new THREE.Group();
  raiz.add(cuerpo);
  const partes = { raiz, cuerpoGrupo: cuerpo, patas: [], ojos: [], alas: [], orejas: [], cola: null, colaPunta: null, cabeza: null, boca: null, lengua: null };
  if (e.tortuga) tortuga(raiz, cuerpo, e, partes);
  else if (e.ave) ave(raiz, cuerpo, e, partes);
  else cuadrupedo(raiz, cuerpo, e, partes);
  raiz.traverse(o => {
    if (o.isMesh) o.receiveShadow = false;
  });
  raiz.scale.setScalar(e.tam * 1.5);
  return partes;
}
