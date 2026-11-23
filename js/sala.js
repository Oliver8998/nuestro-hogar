import * as THREE from 'three';
import { modeloSuelto } from './modelos.js';

const TAM = 6;
const ALTO = 2.6;
const GROSOR = 0.15;
const PARED_SUCIA = new THREE.Color(0xb3a78d);
const RESALTE_OK = new THREE.Color(0x3cd870);
const RESALTE_MAL = new THREE.Color(0xff4040);

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
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(radio, 20),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: opacidad, roughness: 1, depthWrite: false })
  );
  m.userData.opacidad = opacidad;
  return m;
}

function zona(geo) {
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
}

function visibleArriba(o) {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

export function crearSala(escena) {
  const mitad = TAM / 2;
  const sala = new THREE.Group();
  escena.add(sala);
  const desperfectos = [];
  const animaciones = [];
  const suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function nuevoDesperfecto(def, objetos, alProgreso, alCompletar) {
    const d = { ...def, objetos, hecho: false, alProgreso, alCompletar };
    for (const obj of objetos) obj.traverse(o => { if (o.isMesh) o.userData.desperfecto = d; });
    desperfectos.push(d);
    return d;
  }

  function animar(duracion, alProgreso, alFin) {
    animaciones.push({ t: 0, duracion, alProgreso, alFin });
  }

  const base = caja(TAM + GROSOR * 2 + 0.2, 0.4, TAM + GROSOR * 2 + 0.2, 0xb9a48c);
  base.position.y = -0.3;
  sala.add(base);

  const tonos = [0x8a6a4a, 0x7d5f42, 0x93724f, 0x75583c];
  const tablas = [];
  for (let i = 0; i < 12; i++) {
    const tabla = caja(0.48, 0.1, TAM, tonos[i % tonos.length]);
    tabla.castShadow = false;
    tabla.position.set(-mitad + 0.25 + i * 0.5, -0.05, 0);
    sala.add(tabla);
    tablas.push(tabla);
  }

  const paredes = [];
  const defs = [
    { x: 0, z: -mitad - GROSOR / 2, rot: 0, n: new THREE.Vector3(0, 0, -1) },
    { x: 0, z: mitad + GROSOR / 2, rot: Math.PI, n: new THREE.Vector3(0, 0, 1) },
    { x: -mitad - GROSOR / 2, z: 0, rot: Math.PI / 2, n: new THREE.Vector3(-1, 0, 0) },
    { x: mitad + GROSOR / 2, z: 0, rot: -Math.PI / 2, n: new THREE.Vector3(1, 0, 0) }
  ];

  const PUERTA_X = -1.0;
  const PUERTA_ANCHO = 1.0;
  const PUERTA_ALTO = 2.1;

  defs.forEach((d, i) => {
    const grupo = new THREE.Group();
    grupo.position.set(d.x, 0, d.z);
    grupo.rotation.y = d.rot;
    const material = new THREE.MeshStandardMaterial({ color: PARED_SUCIA.getHex(), roughness: 0.9 });
    const piezas = [];
    const bajo = new THREE.Group();
    bajo.position.copy(grupo.position);
    bajo.rotation.y = d.rot;
    const largo = TAM + GROSOR * 2;

    const tramo = (x0, x1, y0, y1, destino, lista) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, GROSOR), material);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      m.userData.pared = i;
      destino.add(m);
      if (lista) lista.push(m);
      return m;
    };

    if (i === 1) {
      const a = PUERTA_X - PUERTA_ANCHO / 2;
      const b = PUERTA_X + PUERTA_ANCHO / 2;
      tramo(-largo / 2, a, -0.1, ALTO, grupo, piezas);
      tramo(b, largo / 2, -0.1, ALTO, grupo, piezas);
      tramo(a, b, PUERTA_ALTO, ALTO, grupo, piezas);
      tramo(-largo / 2, a, -0.1, 0.14, bajo);
      tramo(b, largo / 2, -0.1, 0.14, bajo);

      const marco = new THREE.MeshStandardMaterial({ color: 0xf7f1e8, roughness: 0.7 });
      for (const [w, h, x, y] of [[0.08, PUERTA_ALTO, a + 0.04, PUERTA_ALTO / 2 - 0.05], [0.08, PUERTA_ALTO, b - 0.04, PUERTA_ALTO / 2 - 0.05], [PUERTA_ANCHO, 0.08, PUERTA_X, PUERTA_ALTO - 0.04]]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, GROSOR + 0.04), marco);
        m.position.set(x, y, 0);
        grupo.add(m);
      }
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(PUERTA_ANCHO - 0.16, PUERTA_ALTO - 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x9c6b45, roughness: 0.7 }));
      hoja.position.set(PUERTA_X, (PUERTA_ALTO - 0.1) / 2 - 0.05, 0);
      hoja.castShadow = true;
      grupo.add(hoja);
      for (const [w, h, y] of [[0.6, 0.7, 1.45], [0.6, 0.7, 0.55]]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), new THREE.MeshStandardMaterial({ color: 0xb07a4f, roughness: 0.7 }));
        panel.position.set(PUERTA_X, y, 0);
        grupo.add(panel);
      }
      for (const z of [-0.05, 0.05]) {
        const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe0c060, metalness: 0.6, roughness: 0.3 }));
        pomo.position.set(PUERTA_X + 0.3, 1.0, z);
        grupo.add(pomo);
      }
    } else {
      tramo(-largo / 2, largo / 2, -0.1, ALTO, grupo, piezas);
      tramo(-largo / 2, largo / 2, -0.1, 0.14, bajo);
    }

    grupo.userData = { normal: d.n, muro: piezas[0], piezas, bajo, pintura: null, requisito: null, desperfectos: [] };
    sala.add(grupo);
    sala.add(bajo);
    paredes.push(grupo);
  });


  const cara = GROSOR / 2 + 0.006;

  const cucarachas = [];
  const cucas = nuevoDesperfecto(
    { id: 'cucarachas', descripcion: 'Hay cucarachas correteando por el suelo. ¡Qué asco!', mensaje: '¡Adiós, cucarachas!', nombre: 'Cucarachas', material: 'insecticida' },
    [],
    p => cucarachas.forEach(c => {
      c.grupo.scale.setScalar(Math.max(0.001, 1 - p));
      c.grupo.rotation.z = p * Math.PI;
    }),
    () => {
      cucarachas.forEach(c => sala.remove(c.grupo));
      cucarachas.length = 0;
    }
  );

  const matCuca = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.5 });
  for (let i = 0; i < 6; i++) {
    const grupo = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), matCuca);
    cuerpo.scale.set(0.09, 0.05, 0.15);
    cuerpo.position.y = 0.025;
    cuerpo.castShadow = true;
    const toque = zona(new THREE.BoxGeometry(0.45, 0.25, 0.45));
    toque.position.y = 0.12;
    const modelo = modeloSuelto('sucio-cucaracha');
    grupo.add(modelo ?? cuerpo, toque);
    grupo.position.set((Math.random() * 2 - 1) * 2.6, 0, (Math.random() * 2 - 1) * 2.6);
    [cuerpo, toque].forEach(m => { m.userData.desperfecto = cucas; });
    if (modelo) modelo.traverse(m => { m.userData.desperfecto = cucas; });
    sala.add(grupo);
    cucarachas.push({ grupo, angulo: Math.random() * Math.PI * 2, velocidad: 0.5, pausa: 0 });
  }
  cucas.objetos = cucarachas.map(c => c.grupo);

  const manchaSuelo = mancha(0.45, 0x3d2c1d, 0.45);
  manchaSuelo.rotation.x = -Math.PI / 2;
  manchaSuelo.position.set(-1, 0.003, 1.4);
  sala.add(manchaSuelo);
  nuevoDesperfecto(
    { id: 'mancha', descripcion: 'Una mancha reseca en el suelo que no sale ni frotando.', mensaje: '¡Suelo limpio!', nombre: 'Mancha del suelo', material: 'limpiador' },
    [manchaSuelo],
    p => { manchaSuelo.material.opacity = manchaSuelo.userData.opacidad * (1 - p); },
    () => sala.remove(manchaSuelo)
  );

  const tablaRota = caja(0.48, 0.1, 1.2, 0x6a4e34);
  tablaRota.position.set(1.25, 0.03, 1.6);
  tablaRota.rotation.x = -0.12;
  sala.add(tablaRota);
  nuevoDesperfecto(
    { id: 'tabla', descripcion: 'Una tabla del suelo se ha levantado. ¡Cuidado, que alguien tropieza!', mensaje: '¡Tabla clavada!', nombre: 'Tabla levantada', material: 'clavos' },
    [tablaRota],
    p => {
      tablaRota.rotation.x = -0.12 * (1 - p);
      tablaRota.position.y = 0.03 - 0.08 * p + Math.sin(p * Math.PI * 5) * 0.02;
    },
    () => sala.remove(tablaRota)
  );

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

  const matCristal = new THREE.MeshStandardMaterial({ color: 0xa9d4e8, emissive: 0x8fc3dd, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.12), matCristal);
  cristal.position.set(-0.3, 0, 0.001);
  ventana.add(cristal);

  const grietasVentana = [];
  [[-0.35, 0.2, 0.5, 0.6], [-0.22, 0.05, 0.35, -0.9], [-0.4, -0.15, 0.3, 0.3]].forEach(([x, y, largo, ang]) => {
    const grieta = caja(largo, 0.012, 0.005, 0x2f3b40);
    grieta.castShadow = false;
    grieta.position.set(x, y, 0.004);
    grieta.rotation.z = ang;
    ventana.add(grieta);
    grietasVentana.push(grieta);
  });

  const carton = caja(0.55, 1.1, 0.02, 0xb8875a);
  carton.position.set(0.3, 0, 0.01);
  carton.rotation.z = 0.04;
  ventana.add(carton);
  [0.7, -0.7].forEach(ang => {
    const cinta = caja(0.7, 0.06, 0.005, 0xe0c878);
    cinta.castShadow = false;
    cinta.position.set(0, 0, 0.015);
    cinta.rotation.z = ang;
    carton.add(cinta);
  });

  paredes[0].add(ventana);
  paredes[0].userData.desperfectos.push(nuevoDesperfecto(
    { id: 'ventana', descripcion: 'El cristal está roto y alguien lo tapó con un cartón.', mensaje: '¡Cristal nuevo!', nombre: 'Ventana rota', material: 'cristal', pared: 0 },
    [ventana],
    p => {
      carton.position.z = 0.01 + p * 0.25;
      carton.position.y = -p * 0.6;
      carton.rotation.z = 0.04 + p * 0.6;
    },
    () => {
      ventana.remove(carton);
      grietasVentana.forEach(g => ventana.remove(g));
      const nuevo = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.12), matCristal);
      nuevo.position.set(0.3, 0, 0.001);
      ventana.add(nuevo);
    }
  ));

  const grietas = [];
  [[-1.6, 1.9, 0.6, -0.7], [-1.3, 1.55, 0.4, 0.5], [-1.45, 1.2, 0.5, -0.4]].forEach(([x, y, largo, ang]) => {
    const grieta = caja(largo, 0.02, 0.005, 0x6a604e);
    grieta.castShadow = false;
    grieta.material.transparent = true;
    grieta.position.set(x, y, cara);
    grieta.rotation.z = ang;
    paredes[0].add(grieta);
    grietas.push(grieta);
  });
  const zonaGrietas = zona(new THREE.PlaneGeometry(1.1, 1.3));
  zonaGrietas.position.set(-1.45, 1.55, cara + 0.003);
  paredes[0].add(zonaGrietas);
  const desGrietas = nuevoDesperfecto(
    { id: 'grietas', descripcion: 'La pared está llena de grietas. Hay que taparlas antes de pintarla.', mensaje: '¡Grietas tapadas!', nombre: 'Grietas', material: 'masilla', pared: 0 },
    [zonaGrietas, ...grietas],
    p => grietas.forEach(g => { g.material.opacity = 1 - p; }),
    () => [zonaGrietas, ...grietas].forEach(o => paredes[0].remove(o))
  );
  paredes[0].userData.desperfectos.push(desGrietas);
  paredes[0].userData.requisito = desGrietas;

  const humedades = [];
  [[1.6, 0.4, 0.5, 0.45], [2.1, 0.25, 0.35, 0.35], [1.2, 0.75, 0.3, 0.3], [-2.2, 2.2, 0.4, 0.3]].forEach(([x, y, r, o]) => {
    const m = mancha(r, 0x6e6b4c, o);
    m.position.set(x, y, cara);
    paredes[2].add(m);
    humedades.push(m);
  });
  const desHumedad = nuevoDesperfecto(
    { id: 'humedad', descripcion: 'Manchas de humedad en la pared. Hay que tratarlas antes de pintar.', mensaje: '¡Adiós, humedad!', nombre: 'Humedad', material: 'antihumedad', pared: 2 },
    humedades,
    p => humedades.forEach(m => { m.material.opacity = m.userData.opacidad * (1 - p); }),
    () => humedades.forEach(m => paredes[2].remove(m))
  );
  paredes[2].userData.desperfectos.push(desHumedad);
  paredes[2].userData.requisito = desHumedad;

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7560, 1.5);
  escena.add(hemi);

  const sol = new THREE.DirectionalLight(0xfff0dd, 1.7);
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
  sol.shadow.normalBias = 0.02;
  escena.add(sol);

  let exterior = null;
  let valla = null;
  function modoExterior(tipo) {
    exterior = tipo;
    if (valla) {
      sala.remove(valla);
      valla = null;
    }
    if (!tipo) return;
    valla = new THREE.Group();
    const terraza = tipo === 'terraza';
    const madera = new THREE.MeshStandardMaterial({ color: terraza ? 0x6a6f75 : 0xf2efe9, roughness: terraza ? 0.4 : 0.8, metalness: terraza ? 0.5 : 0 });
    const cristal = new THREE.MeshStandardMaterial({ color: 0xcfe8f2, transparent: true, opacity: 0.35, roughness: 0.1 });
    const lado = TAM / 2;
    for (const [x, z, ry] of [[0, -lado, 0], [-lado, 0, Math.PI / 2], [lado, 0, Math.PI / 2], [0, lado, 0]]) {
      const tramo = new THREE.Group();
      tramo.position.set(x, 0, z);
      tramo.rotation.y = ry;
      if (terraza) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(TAM, 0.55, 0.02), cristal);
        panel.position.y = 0.4;
        const barandilla = new THREE.Mesh(new THREE.BoxGeometry(TAM, 0.04, 0.06), madera);
        barandilla.position.y = 0.7;
        tramo.add(panel, barandilla);
        for (let k = 0; k <= 6; k++) {
          const poste = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.04), madera);
          poste.position.set(-lado + k * TAM / 6, 0.35, 0);
          tramo.add(poste);
        }
      } else {
        for (let k = 0; k < 24; k++) {
          const tabla = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.03), madera);
          tabla.position.set(-lado + 0.125 + k * 0.25, 0.25, 0);
          const punta = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.08, 4), madera);
          punta.position.set(-lado + 0.125 + k * 0.25, 0.54, 0);
          punta.rotation.y = Math.PI / 4;
          tramo.add(tabla, punta);
        }
        for (const y of [0.15, 0.38]) {
          const travesano = new THREE.Mesh(new THREE.BoxGeometry(TAM, 0.05, 0.03), madera);
          travesano.position.set(0, y, -0.025);
          tramo.add(travesano);
        }
      }
      tramo.traverse(o => { if (o.isMesh) o.castShadow = true; });
      valla.add(tramo);
    }
    sala.add(valla);
    for (const p of paredes) {
      p.visible = false;
      p.userData.bajo.visible = false;
    }
  }

  function actualizarParedes(direccion) {
    if (exterior) {
      if (valla) {
        valla.children.forEach((t, i) => {
          const normales = [[0, 0, 1], [1, 0, 0], [-1, 0, 0], [0, 0, -1]][i];
          t.visible = normales[0] * direccion.x + normales[2] * direccion.z < 0.3;
        });
      }
      return;
    }
    for (const p of paredes) {
      p.visible = p.userData.normal.dot(direccion) < -0.15;
      p.userData.bajo.visible = !p.visible;
    }
  }

  function objetivos() {
    const lista = [];
    for (const d of desperfectos) if (!d.hecho) lista.push(...d.objetos);
    for (const p of paredes) lista.push(...p.userData.piezas);
    return lista;
  }

  function identificar(objeto, material) {
    let o = objeto;
    while (o && !o.userData.desperfecto && o.userData.pared === undefined && !o.userData.def) o = o.parent;
    if (!o || o.userData.def) return null;
    if (o.userData.desperfecto) return { tipo: 'desperfecto', d: o.userData.desperfecto };
    const i = o.userData.pared;
    const encaja = paredes[i].userData.desperfectos.find(d => !d.hecho && d.material === material.id);
    if (encaja) return { tipo: 'desperfecto', d: encaja };
    return { tipo: 'pared', i };
  }

  function buscar(raycaster, material, ocluyentes) {
    const hits = raycaster.intersectObjects([...objetivos(), ...ocluyentes], true);
    for (const h of hits) {
      if (!visibleArriba(h.object)) continue;
      const obj = identificar(h.object, material);
      if (material.id !== 'insecticida') return obj;
      if (obj && obj.tipo === 'desperfecto' && obj.d === cucas) return obj;
      break;
    }
    if (material.id === 'insecticida' && !cucas.hecho) {
      const p = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(suelo, p) && Math.abs(p.x) < mitad && Math.abs(p.z) < mitad) {
        return { tipo: 'desperfecto', d: cucas };
      }
    }
    return null;
  }

  function tocar(raycaster, ocluyentes) {
    const hits = raycaster.intersectObjects([...objetivos(), ...ocluyentes], true);
    for (const h of hits) {
      if (!visibleArriba(h.object)) continue;
      let o = h.object;
      while (o && !o.userData.desperfecto && o.userData.pared === undefined && !o.userData.def) o = o.parent;
      if (!o || o.userData.def) return null;
      if (o.userData.desperfecto) return { tipo: 'desperfecto', d: o.userData.desperfecto };
      const i = o.userData.pared;
      const req = paredes[i].userData.requisito;
      if (req && !req.hecho && conDesperfectos) return { tipo: 'desperfecto', d: req };
      return { tipo: 'pared', i, pintura: paredes[i].userData.pintura };
    }
    return null;
  }

  function puedeAplicar(material, obj) {
    if (obj.tipo === 'desperfecto') {
      if (obj.d.hecho) return { ok: false, motivo: 'Eso ya está arreglado' };
      if (obj.d.material !== material.id) return { ok: false, motivo: `Eso no sirve para: ${obj.d.nombre.toLowerCase()}` };
      return { ok: true };
    }
    const pared = paredes[obj.i].userData;
    if (!material.pinta) return { ok: false, motivo: 'Eso no sirve para la pared' };
    const req = pared.requisito;
    if (req && !req.hecho && conDesperfectos) {
      return { ok: false, motivo: req.id === 'grietas' ? 'Primero tapa las grietas con masilla' : 'Primero quita la humedad' };
    }
    if (pared.pintura === material.pinta) return { ok: false, motivo: 'Ya está de ese color' };
    return { ok: true };
  }

  function aplicar(material, obj) {
    if (obj.tipo === 'desperfecto') {
      const d = obj.d;
      d.hecho = true;
      animar(0.9, d.alProgreso, d.alCompletar);
      return;
    }
    const pared = paredes[obj.i].userData;
    const desde = pared.muro.material.color.clone();
    const hasta = new THREE.Color(material.pinta);
    pared.pintura = material.pinta;
    animar(0.9, p => pared.muro.material.color.lerpColors(desde, hasta, p), () => {});
  }

  let resaltados = [];
  function resaltar(obj, valido) {
    for (const mat of resaltados) {
      mat.emissive.copy(mat.userData.emisivaBase.color);
      mat.emissiveIntensity = mat.userData.emisivaBase.intensidad;
    }
    resaltados = [];
    if (!obj) return;
    const raices = obj.tipo === 'desperfecto' ? obj.d.objetos : [paredes[obj.i].userData.muro];
    for (const r of raices) {
      r.traverse(m => {
        if (!m.isMesh) return;
        const mat = m.material;
        if (!mat.emissive || mat.colorWrite === false || resaltados.includes(mat)) return;
        if (!mat.userData.emisivaBase) mat.userData.emisivaBase = { color: mat.emissive.clone(), intensidad: mat.emissiveIntensity };
        mat.emissive.copy(valido ? RESALTE_OK : RESALTE_MAL);
        mat.emissiveIntensity = 0.35;
        resaltados.push(mat);
      });
    }
  }

  function estado() {
    return {
      arreglos: desperfectos.filter(d => d.hecho).map(d => d.id),
      paredes: paredes.map(p => p.userData.pintura)
    };
  }

  function restaurar(datos) {
    for (const d of desperfectos) {
      if (!datos.arreglos.includes(d.id) || d.hecho) continue;
      d.hecho = true;
      d.alProgreso(1);
      d.alCompletar();
    }
    datos.paredes.forEach((hex, i) => {
      if (hex === null || hex === undefined) return;
      paredes[i].userData.pintura = hex;
      paredes[i].userData.muro.material.color.setHex(hex);
    });
  }

  function progreso() {
    const hechos = desperfectos.filter(d => d.hecho).length + paredes.filter(p => p.userData.pintura !== null).length;
    return { hechos, total: desperfectos.length + paredes.length };
  }

  function actualizar(dt) {
    for (let i = animaciones.length - 1; i >= 0; i--) {
      const a = animaciones[i];
      a.t += dt;
      const p = Math.min(1, a.t / a.duracion);
      a.alProgreso(p);
      if (p >= 1) {
        animaciones.splice(i, 1);
        a.alFin();
      }
    }

    if (cucas.hecho || !conDesperfectos) return;
    for (const c of cucarachas) {
      if (c.pausa > 0) {
        c.pausa -= dt;
        continue;
      }
      if (Math.random() < 0.01) c.pausa = 0.5 + Math.random();
      c.angulo += (Math.random() - 0.5) * 4 * dt;
      const p = c.grupo.position;
      p.x += Math.sin(c.angulo) * c.velocidad * dt;
      p.z += Math.cos(c.angulo) * c.velocidad * dt;
      if (Math.abs(p.x) > 2.8 || Math.abs(p.z) > 2.8) {
        p.x = THREE.MathUtils.clamp(p.x, -2.8, 2.8);
        p.z = THREE.MathUtils.clamp(p.z, -2.8, 2.8);
        c.angulo += Math.PI;
      }
      c.grupo.rotation.y = c.angulo;
    }
  }

  function pintarSuelo(colores) {
    tablas.forEach((t, i) => t.material.color.setHex((colores || tonos)[i % (colores || tonos).length]));
  }

  let conDesperfectos = true;
  function mostrarDesperfectos(si) {
    conDesperfectos = si;
    for (const d of desperfectos) {
      if (d.hecho) continue;
      for (const o of d.objetos) o.visible = si;
    }
    for (const c of cucarachas) c.grupo.visible = si && !cucas.hecho;
  }

  function completarTodo() {
    for (const d of desperfectos) {
      if (d.hecho) continue;
      d.hecho = true;
      d.alProgreso(1);
      d.alCompletar();
    }
    conDesperfectos = false;
  }

  function pintarParedes(lista, defecto) {
    paredes.forEach((p, i) => {
      const hex = lista ? lista[i] : null;
      p.userData.pintura = hex ?? null;
      p.userData.muro.material.color.setHex(hex ?? defecto ?? PARED_SUCIA.getHex());
    });
  }

  return { paredes, cara, modoExterior, esExterior: () => exterior, pintarSuelo, mostrarDesperfectos, completarTodo, pintarParedes, conDesperfectos: () => conDesperfectos, ventana, matCristal, hemi, sol, visibles: () => paredes.map(p => p.visible), actualizarParedes, actualizar, buscar, tocar, puedeAplicar, aplicar, resaltar, estado, restaurar, progreso };
}
