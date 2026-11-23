import * as THREE from 'three';

const TAM = 6;
const ALTO = 2.6;
const GROSOR = 0.15;
const PARED_SUCIA = new THREE.Color(0xb3a78d);
const PARED_LIMPIA = new THREE.Color(0xf3eadb);

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

export function crearSala(escena) {
  const mitad = TAM / 2;
  const sala = new THREE.Group();
  escena.add(sala);
  const reparaciones = [];

  function nuevaReparacion(def, objetos, alProgreso, alCompletar) {
    const rep = { ...def, objetos, progreso: 0, acumulado: 0, hecha: false, alProgreso, alCompletar };
    for (const obj of objetos) obj.traverse(o => { if (o.isMesh) o.userData.reparacion = rep; });
    reparaciones.push(rep);
    return rep;
  }

  function avanzar(rep, cantidad) {
    if (rep.hecha) return false;
    rep.acumulado += cantidad;
    rep.progreso = Math.min(1, rep.acumulado / rep.cantidad);
    rep.alProgreso(rep.progreso);
    if (rep.acumulado >= rep.cantidad - 1e-6) {
      rep.progreso = 1;
      rep.hecha = true;
      rep.alCompletar();
      return true;
    }
    return false;
  }

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

  const cucarachas = [];
  const repCucas = nuevaReparacion(
    { id: 'cucarachas', nombre: 'Echar a las cucarachas', icono: '🪳', coste: 0, tipo: 'aplastar', cantidad: 6, pista: 'Tócalas para aplastarlas' },
    [],
    () => {},
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
    grupo.add(cuerpo, toque);
    grupo.position.set((Math.random() * 2 - 1) * 2.6, 0, (Math.random() * 2 - 1) * 2.6);
    const c = { grupo, angulo: Math.random() * Math.PI * 2, velocidad: 0.5, pausa: 0, muerta: false, tiempoMuerta: 0 };
    [cuerpo, toque].forEach(m => {
      m.userData.reparacion = repCucas;
      m.userData.cucaracha = c;
    });
    sala.add(grupo);
    cucarachas.push(c);
  }

  function aplastar(c) {
    if (!c || c.muerta) return false;
    c.muerta = true;
    c.grupo.scale.set(1.4, 0.2, 1.4);
    return avanzar(repCucas, 1);
  }

  const manchaSuelo = mancha(0.45, 0x3d2c1d, 0.45);
  manchaSuelo.rotation.x = -Math.PI / 2;
  manchaSuelo.position.set(-1, 0.003, 1.4);
  sala.add(manchaSuelo);
  nuevaReparacion(
    { id: 'mancha', nombre: 'Fregar la mancha', icono: '🧽', coste: 0, tipo: 'frotar', cantidad: 700, pista: 'Frota para limpiar' },
    [manchaSuelo],
    p => { manchaSuelo.material.opacity = manchaSuelo.userData.opacidad * (1 - p); },
    () => sala.remove(manchaSuelo)
  );

  const tablaRota = caja(0.48, 0.1, 1.2, 0x6a4e34);
  tablaRota.position.set(1.25, 0.03, 1.6);
  tablaRota.rotation.x = -0.12;
  sala.add(tablaRota);
  nuevaReparacion(
    { id: 'tabla', nombre: 'Clavar la tabla', icono: '🔨', coste: 15, tipo: 'toques', cantidad: 5, pista: 'Toca para dar martillazos' },
    [tablaRota],
    p => {
      tablaRota.rotation.x = -0.12 * (1 - p);
      tablaRota.position.y = 0.03 - 0.08 * p;
    },
    () => sala.remove(tablaRota)
  );

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
    const muro = caja(TAM + GROSOR * 2, ALTO + 0.1, GROSOR, PARED_SUCIA.getHex());
    muro.position.y = (ALTO + 0.1) / 2 - 0.1;
    grupo.add(muro);
    grupo.userData.normal = d.n;
    grupo.userData.muro = muro;
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

  const cintas = [];
  [0.7, -0.7].forEach(ang => {
    const cinta = caja(0.7, 0.06, 0.005, 0xe0c878);
    cinta.castShadow = false;
    cinta.rotation.z = ang;
    carton.add(cinta);
    cinta.position.set(0, 0, 0.015);
    cintas.push(cinta);
  });

  paredes[0].add(ventana);
  nuevaReparacion(
    { id: 'ventana', nombre: 'Cambiar el cristal', icono: '🪟', coste: 40, tipo: 'mantener', cantidad: 1.5, pista: 'Mantén pulsado' },
    [ventana],
    p => {
      carton.position.z = 0.01 + p * 0.15;
      carton.rotation.z = 0.04 + p * 0.3;
    },
    () => {
      ventana.remove(carton);
      grietasVentana.forEach(g => ventana.remove(g));
      const nuevo = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.12), matCristal);
      nuevo.position.set(0.3, 0, 0.001);
      ventana.add(nuevo);
    }
  );

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
  nuevaReparacion(
    { id: 'grietas', nombre: 'Tapar las grietas', icono: '🪣', coste: 10, tipo: 'frotar', cantidad: 500, pista: 'Desliza para echar masilla' },
    [zonaGrietas, ...grietas],
    p => grietas.forEach(g => { g.material.opacity = 1 - p; }),
    () => [zonaGrietas, ...grietas].forEach(o => paredes[0].remove(o))
  );

  const humedades = [];
  [[1.6, 0.4, 0.5, 0.45], [2.1, 0.25, 0.35, 0.35], [1.2, 0.75, 0.3, 0.3], [-2.2, 2.2, 0.4, 0.3]].forEach(([x, y, r, o]) => {
    const m = mancha(r, 0x6e6b4c, o);
    m.position.set(x, y, cara);
    paredes[2].add(m);
    humedades.push(m);
  });
  nuevaReparacion(
    { id: 'humedad', nombre: 'Quitar la humedad', icono: '💧', coste: 10, tipo: 'frotar', cantidad: 900, pista: 'Frota para quitarla' },
    humedades,
    p => humedades.forEach(m => { m.material.opacity = m.userData.opacidad * (1 - p); }),
    () => humedades.forEach(m => paredes[2].remove(m))
  );

  paredes.forEach((pared, i) => {
    const muro = pared.userData.muro;
    nuevaReparacion(
      { id: `pintura-${i}`, nombre: `Pintar pared ${i + 1}`, icono: '🖌️', coste: 25, tipo: 'frotar', cantidad: 1600, pista: 'Desliza para pintar' },
      [muro],
      p => muro.material.color.lerpColors(PARED_SUCIA, PARED_LIMPIA, p),
      () => muro.material.color.copy(PARED_LIMPIA)
    );
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

  let bombillaArreglada = false;
  const zonaBombilla = zona(new THREE.SphereGeometry(0.35, 8, 6));
  zonaBombilla.position.copy(bombilla.position);
  sala.add(zonaBombilla);
  nuevaReparacion(
    { id: 'bombilla', nombre: 'Cambiar la bombilla', icono: '💡', coste: 5, tipo: 'mantener', cantidad: 1.2, pista: 'Mantén pulsado para enroscarla' },
    [zonaBombilla],
    p => bombilla.scale.setScalar(1 + p * 0.5),
    () => {
      bombillaArreglada = true;
      bombilla.scale.setScalar(1);
      luz.intensity = 10;
      bombilla.material.emissiveIntensity = 1.2;
      sala.remove(zonaBombilla);
    }
  );

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

  function objetivos() {
    const lista = [];
    for (const r of reparaciones) {
      if (r.hecha) continue;
      if (r.tipo === 'aplastar') cucarachas.forEach(c => { if (!c.muerta) lista.push(c.grupo); });
      else lista.push(...r.objetos);
    }
    return lista;
  }

  function completarGuardadas(ids) {
    for (const r of reparaciones) {
      if (!ids.includes(r.id)) continue;
      r.progreso = 1;
      r.alProgreso(1);
      r.hecha = true;
      r.alCompletar();
    }
  }

  function animar(dt) {
    if (!bombillaArreglada) {
      if (Math.random() < 0.01) luz.intensity = 1.5;
      else luz.intensity += (8 - luz.intensity) * 0.2;
      bombilla.material.emissiveIntensity = luz.intensity / 8;
    }

    for (const c of cucarachas) {
      if (c.muerta) {
        c.tiempoMuerta += dt;
        if (c.tiempoMuerta > 0.6) c.grupo.visible = false;
        continue;
      }
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

  return { actualizarParedes, animar, reparaciones, objetivos, avanzar, aplastar, completarGuardadas };
}
