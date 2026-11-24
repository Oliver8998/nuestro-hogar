import * as THREE from 'three';
import { crearPersonaje } from './personajes.js';
import { liberar, modeloSuelto } from './modelos.js';

export const TIPOS = {
  polvo: { nombre: 'Polvo', producto: 'atrapapolvo', descripcion: 'Bolas de polvo rodando por el suelo. ¡Achís!', cada: 180, max: 6, peso: 6, robot: true },
  telarana: { nombre: 'Telaraña', producto: 'plumero', descripcion: 'Una araña se ha puesto muy cómoda en la esquina.', cada: 480, max: 4, peso: 8 },
  bichos: { nombre: 'Hormigas', producto: 'insecticida', descripcion: 'Una fila de hormigas buscando migas.', cada: 600, max: 2, peso: 12 },
  barro: { nombre: 'Mancha pegajosa', producto: 'limpiador', descripcion: 'Algo se ha derramado y el suelo se pega.', cada: 420, max: 3, peso: 10, robot: true },
  caca: { nombre: 'Caca', producto: 'bolsitas', descripcion: 'Alguien no ha llegado a tiempo…', peso: 15 }
};

const AL_ARENERO = ['gato', 'conejo', 'hamster'];
const AL_JARDIN = ['perro', 'pato', 'pinguino', 'zorro'];

const HUECOS_TELARANA = [
  { pared: 0, pos: [-2.6, 2.3, -2.9], rot: 0 },
  { pared: 0, pos: [2.6, 2.3, -2.9], rot: 0 },
  { pared: 2, pos: [-2.9, 2.3, -2.6], rot: Math.PI / 2 },
  { pared: 2, pos: [-2.9, 2.3, 2.6], rot: Math.PI / 2 },
  { pared: 1, pos: [-2.6, 2.3, 2.9], rot: Math.PI },
  { pared: 3, pos: [2.9, 2.3, -2.6], rot: -Math.PI / 2 }
];

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
}

function zona(geo) {
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
}

function esfera(sx, sy, sz, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), material);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function modelo(tipo) {
  const g = new THREE.Group();
  const nuevo = modeloSuelto(`sucio-${tipo === 'bichos' ? 'hormiga' : tipo}`);
  if (nuevo && tipo !== 'bichos' && tipo !== 'telarana') {
    g.add(nuevo);
    const alto = { polvo: 0.2, barro: 0.12, caca: 0.3 }[tipo] ?? 0.2;
    const r = { polvo: 0.28, barro: 0.32, caca: 0.25 }[tipo] ?? 0.3;
    g.add(zona(new THREE.CylinderGeometry(r, r, alto, 10)));
  } else if (tipo === 'polvo') {
    const m = mat(0xb9b1a6, { transparent: true, opacity: 0.85 });
    g.add(esfera(0.16, 0.08, 0.14, m, 0, 0.04, 0));
    g.add(esfera(0.11, 0.06, 0.1, m, 0.11, 0.03, 0.06));
    g.add(esfera(0.09, 0.05, 0.09, m, -0.1, 0.025, 0.07));
    g.add(esfera(0.06, 0.04, 0.06, m, 0.02, 0.02, -0.12));
    g.add(zona(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10)));
  } else if (tipo === 'barro') {
    const m = mat(0x7a5a3a, { transparent: true, opacity: 0.7, depthWrite: false });
    for (const [r, x, z] of [[0.24, 0, 0], [0.14, 0.18, 0.08], [0.1, -0.16, 0.12], [0.06, 0.05, -0.22]]) {
      const c = new THREE.Mesh(new THREE.CircleGeometry(r, 18), m);
      c.rotation.x = -Math.PI / 2;
      c.position.set(x, 0.004, z);
      g.add(c);
    }
    g.add(zona(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 10)));
  } else if (tipo === 'caca') {
    const m = mat(0x7a4a2a, { roughness: 0.4 });
    g.add(esfera(0.17, 0.08, 0.17, m, 0, 0.04, 0));
    g.add(esfera(0.12, 0.07, 0.12, m, 0, 0.1, 0));
    g.add(esfera(0.07, 0.07, 0.07, m, 0.005, 0.15, 0));
    g.add(zona(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 10)));
  } else if (tipo === 'bichos') {
    const m = mat(0x1e1a18);
    const hormigas = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const h = new THREE.Group();
      const hormiga = modeloSuelto('sucio-hormiga');
      if (hormiga) {
        hormiga.scale.setScalar(1.2);
        h.add(hormiga);
      } else {
        h.add(esfera(0.03, 0.025, 0.06, m, 0, 0.015, 0));
        h.add(esfera(0.025, 0.022, 0.025, m, 0, 0.015, 0.04));
      }
      h.userData.fase = i / 7;
      hormigas.add(h);
    }
    g.add(hormigas);
    g.userData.hormigas = hormigas;
    g.add(zona(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10)));
  } else if (tipo === 'telarana') {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let k = 0; k < 6; k++) {
      const radio = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 4), m);
      radio.rotation.z = k * Math.PI / 6;
      g.add(radio);
    }
    for (const r of [0.08, 0.15, 0.22]) {
      const anillo = new THREE.Mesh(new THREE.TorusGeometry(r, 0.004, 4, 6), m);
      anillo.rotation.z = Math.PI / 6;
      g.add(anillo);
    }
    const arana = modeloSuelto('sucio-arana') ?? esfera(0.05, 0.05, 0.04, mat(0x2b2320), 0, 0, 0);
    arana.position.set(0.06, -0.1, 0.02);
    arana.rotation.set(Math.PI / 2, 0, 0.3);
    if (arana.isGroup) arana.scale.setScalar(1.3);
    g.add(arana);
    g.add(zona(new THREE.CircleGeometry(0.32, 10)));
  }
  return g;
}

export function construirJardin() {
  const g = new THREE.Group();
  const tierra = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.36, 3.2), mat(0x8a6a4a));
  tierra.position.set(4.95, -0.3, 1.0);
  tierra.receiveShadow = true;
  g.add(tierra);
  const cesped = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 3.1), mat(0x7cc46a));
  cesped.position.set(4.95, -0.1, 1.0);
  cesped.receiveShadow = true;
  g.add(cesped);
  const blanco = mat(0xffffff);
  for (let i = 0; i <= 10; i++) {
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.06), blanco);
    poste.position.set(6.0, 0.08, -0.5 + i * 0.3);
    poste.castShadow = true;
    g.add(poste);
  }
  const travesano = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 3.05), blanco);
  travesano.position.set(6.0, 0.15, 1.0);
  g.add(travesano);
  for (const [x, z, c] of [[4.3, -0.2, 0xf28aa0], [4.6, 0.1, 0xf7e07a], [5.6, 2.2, 0xb39ddb], [5.2, 2.4, 0xf28aa0], [4.2, 2.1, 0xf7e07a]]) {
    const flor = esfera(0.1, 0.1, 0.1, mat(c), x, -0.02, z);
    g.add(flor);
  }
  const arbol = new THREE.Group();
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.7, 10), mat(0x6b4f36));
  tronco.position.y = 0.25;
  arbol.add(tronco);
  arbol.add(esfera(0.75, 0.65, 0.75, mat(0x5a9e4b), 0, 0.85, 0));
  arbol.position.set(5.5, -0.07, -0.1);
  arbol.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.add(arbol);
  return g;
}

export class Suciedad {
  constructor(escena, { mascotas, gestor, eventos }) {
    this.escena = escena;
    this.mascotas = mascotas;
    this.gestor = gestor;
    this.eventos = eventos;
    this.lista = [];
    this.tiempos = { polvo: 0, telarana: 0, bichos: 0, barro: 0 };
    this.jardin = false;
    this.limpiadoraHasta = 0;
    this.tVisita = 20;
    this.visita = null;
    this.robot = null;
    this.resaltados = [];
    this.t = 0;
    this.contador = 0;
  }

  bloqueadas() {
    return this.mascotas.bloqueadas();
  }

  posicionLibre() {
    const bloq = this.bloqueadas();
    const nx = this.mascotas.muebles.lx * 2;
    const nz = this.mascotas.muebles.lz * 2;
    for (let k = 0; k < 40; k++) {
      const i = Math.floor(Math.random() * nx);
      const j = Math.floor(Math.random() * nz);
      if (bloq.has(i * nz + j)) continue;
      const x = (i - nx / 2 + 0.5) * 0.5 + (Math.random() - 0.5) * 0.2;
      const z = (j - nz / 2 + 0.5) * 0.5 + (Math.random() - 0.5) * 0.2;
      if (this.lista.some(d => d.tipo !== 'telarana' && Math.hypot(d.x - x, d.z - z) < 0.5)) continue;
      return { x, z };
    }
    return null;
  }

  cuenta(tipo) {
    return this.lista.filter(d => d.tipo === tipo).length;
  }

  anadir(tipo, datos = null, animado = true) {
    let d;
    if (tipo === 'telarana') {
      const libres = HUECOS_TELARANA.map((h, i) => i).filter(i => !this.lista.some(x => x.tipo === 'telarana' && x.hueco === i));
      const hueco = datos && datos.hueco !== undefined ? datos.hueco : libres[Math.floor(Math.random() * libres.length)];
      if (hueco === undefined) return null;
      const h = HUECOS_TELARANA[hueco];
      const hx = this.mascotas.muebles.lx * 0.5;
      const hz = this.mascotas.muebles.lz * 0.5;
      const px = Math.sign(h.pos[0]) * (hx - (3 - Math.abs(h.pos[0])));
      const pz = Math.sign(h.pos[2]) * (hz - (3 - Math.abs(h.pos[2])));
      d = { tipo, hueco, pared: h.pared, x: px, y: h.pos[1], z: pz, rot: h.rot };
    } else {
      const p = datos && datos.x !== undefined ? datos : this.posicionLibre();
      if (!p) return null;
      d = { tipo, x: p.x, y: 0, z: p.z, rot: Math.random() * Math.PI * 2 };
    }
    d.id = datos && datos.id ? datos.id : `s${Date.now()}${this.contador++}`;
    const g = modelo(tipo);
    g.position.set(d.x, d.y, d.z);
    g.rotation.y = d.rot;
    g.traverse(o => { if (o.isMesh) o.userData.suciedad = d; });
    g.userData.suciedad = d;
    if (animado) g.scale.setScalar(0.01);
    this.escena.add(g);
    d.grupo = g;
    this.lista.push(d);
    return d;
  }

  quitar(d) {
    this.lista = this.lista.filter(x => x !== d);
    d.limpia = true;
  }

  serializar() {
    return {
      lista: this.lista.map(d => ({ id: d.id, tipo: d.tipo, x: +d.x.toFixed(2), z: +d.z.toFixed(2), hueco: d.hueco })),
      tiempos: this.tiempos
    };
  }

  cargar(datos, segundosFuera, trampa) {
    if (datos) {
      for (const d of datos.lista || []) this.anadir(d.tipo, d, false);
      Object.assign(this.tiempos, datos.tiempos || {});
    }
    const s = this.genera === false ? 0 : Math.min(segundosFuera, 6 * 3600);
    for (const [tipo, info] of Object.entries(TIPOS)) {
      if (!info.cada) continue;
      if (tipo === 'bichos' && trampa) continue;
      this.tiempos[tipo] = (this.tiempos[tipo] || 0) + s;
      while (this.tiempos[tipo] >= info.cada) {
        this.tiempos[tipo] -= info.cada;
        if (this.cuenta(tipo) < info.max) this.anadir(tipo, null, false);
      }
    }
    if (s > 600) {
      for (const m of this.mascotas.lista) {
        const n = Math.min(2, Math.floor(s / 1800));
        for (let k = 0; k < n; k++) this.hacerCaca(m, true);
      }
    }
  }

  limpieza() {
    const sucio = this.lista.reduce((n, d) => n + TIPOS[d.tipo].peso, 0);
    return Math.max(0, 100 - sucio);
  }

  objetos() {
    return this.lista.map(d => d.grupo);
  }

  identificar(objeto) {
    let o = objeto;
    while (o && !o.userData.suciedad && !o.userData.def) o = o.parent;
    if (!o || o.userData.def) return null;
    return o.userData.suciedad;
  }

  visible(obj) {
    let o = obj;
    while (o) {
      if (!o.visible) return false;
      o = o.parent;
    }
    return true;
  }

  tocar(raycaster, ocluyentes) {
    if (!this.lista.length) return null;
    const hits = raycaster.intersectObjects([...this.objetos(), ...ocluyentes], true);
    for (const h of hits) {
      if (!this.visible(h.object)) continue;
      return this.identificar(h.object);
    }
    return null;
  }

  buscar(raycaster, material, ocluyentes) {
    const d = this.tocar(raycaster, ocluyentes);
    if (d) return d;
    if (material.limpia && material.limpia !== 'telarana') {
      const p = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
        const cerca = this.lista.filter(x => x.tipo === material.limpia).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
        if (cerca && Math.hypot(cerca.x - p.x, cerca.z - p.z) < 0.45) return cerca;
      }
    }
    return null;
  }

  puedeLimpiar(material, d) {
    if (material.limpia === d.tipo) return { ok: true };
    return { ok: false, motivo: `Para ${TIPOS[d.tipo].nombre.toLowerCase()} hace falta otra cosa` };
  }

  limpiar(d, quien = 'yo') {
    if (d.limpia) return;
    this.quitar(d);
    d.grupo.userData.saliendo = 0;
    this.eventos.alLimpiado(d, quien);
  }

  resaltar(d, ok) {
    for (const m of this.resaltados) {
      if (m.material.emissive) {
        m.material.emissive.setHex(0x000000);
        m.material.emissiveIntensity = 0;
      }
      if (m.userData.colorOriginal !== undefined) m.material.color.setHex(m.userData.colorOriginal);
    }
    this.resaltados = [];
    if (!d) return;
    d.grupo.traverse(m => {
      if (!m.isMesh || m.material.colorWrite === false || this.resaltados.includes(m)) return;
      if (m.material.emissive) {
        m.material.emissive.setHex(ok ? 0x3cd870 : 0xff4040);
        m.material.emissiveIntensity = 0.5;
      } else {
        if (m.userData.colorOriginal === undefined) m.userData.colorOriginal = m.material.color.getHex();
        m.material.color.setHex(ok ? 0x7af0a0 : 0xff8080);
      }
      this.resaltados.push(m);
    });
  }

  visibilidadParedes(visibles) {
    for (const d of this.lista) if (d.tipo === 'telarana') d.grupo.visible = visibles[d.pared];
  }

  hacerCaca(m, silencio = false) {
    if (this.cuenta('caca') >= 6) return;
    const arenero = this.mascotas.buscarMueble(def => def.arenero);
    if (AL_ARENERO.includes(m.especie) && arenero) {
      if (!silencio) {
        this.mascotas.ir(m, this.mascotas.celdaDeMueble(arenero), () => {
          m.estado = 'quieto';
          m.tEstado = 2;
          this.eventos.particula('✨', m.grupo.position);
        });
      }
      return;
    }
    if (AL_JARDIN.includes(m.especie) && this.jardin) {
      if (!silencio) this.eventos.particula('🌳', m.grupo.position);
      return;
    }
    const pos = silencio ? this.posicionLibre() : { x: m.grupo.position.x - Math.sin(m.angulo) * 0.25, z: m.grupo.position.z - Math.cos(m.angulo) * 0.25 };
    if (!pos) return;
    const mx = this.mascotas.muebles.lx * 0.5 - 0.2;
    const mz = this.mascotas.muebles.lz * 0.5 - 0.2;
    pos.x = THREE.MathUtils.clamp(pos.x, -mx, mx);
    pos.z = THREE.MathUtils.clamp(pos.z, -mz, mz);
    this.anadir('caca', pos, !silencio);
    if (!silencio) this.eventos.alNuevaSuciedad('caca', m);
  }

  sincronizar(lista) {
    const ids = new Set(lista.map(d => d.id));
    for (const d of [...this.lista]) {
      if (!ids.has(d.id)) this.limpiar(d, 'remoto');
    }
    for (const d of lista) {
      if (!this.lista.some(x => x.id === d.id)) this.anadir(d.tipo, d, true);
    }
  }

  actualizar(dt, trampa) {
    this.t += dt;
    for (const [tipo, info] of Object.entries(TIPOS)) {
      if (!info.cada || this.genera === false) continue;
      if (tipo === 'bichos' && trampa) continue;
      this.tiempos[tipo] = (this.tiempos[tipo] || 0) + dt;
      if (this.tiempos[tipo] >= info.cada) {
        this.tiempos[tipo] = 0;
        if (this.cuenta(tipo) < info.max && this.anadir(tipo)) this.eventos.alNuevaSuciedad(tipo);
      }
    }
    if (trampa) for (const d of this.lista.filter(x => x.tipo === 'bichos')) this.limpiar(d, 'trampa');

    for (const m of this.genera === false ? [] : this.mascotas.lista) {
      if (m.tCaca === undefined) m.tCaca = 300 + Math.random() * 300;
      if (m.estado === 'dormir') continue;
      m.tCaca -= dt;
      if (m.tCaca <= 0) {
        m.tCaca = 360 + Math.random() * 360;
        this.hacerCaca(m);
      }
    }

    for (const obj of [...this.escena.children]) {
      const u = obj.userData;
      if (!u.suciedad) continue;
      if (u.saliendo !== undefined) {
        u.saliendo += dt;
        const k = u.saliendo / 0.4;
        obj.scale.setScalar(Math.max(0.01, 1 - k));
        obj.position.y = (u.suciedad.y || 0) + k * 0.15;
        if (k >= 1) {
          this.escena.remove(obj);
          liberar(obj);
        }
      } else if (obj.scale.x < 1) {
        obj.scale.setScalar(Math.min(1, obj.scale.x + dt * 3));
      }
      if (u.hormigas) {
        u.hormigas.children.forEach(h => {
          const a = (h.userData.fase + this.t * 0.12) * Math.PI * 2;
          h.position.set(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.14);
          h.rotation.y = -a;
        });
      }
    }

    this.actualizarRobot(dt);
    this.actualizarLimpiadora(dt);
  }

  actualizarRobot(dt) {
    const base = this.gestor.muebles.find(m => m.userData.def.robot && m.userData.base < 0.01);
    if (!base) {
      if (this.robot) {
        this.escena.remove(this.robot.malla);
        liberar(this.robot.malla);
        this.robot = null;
      }
      return;
    }
    if (!this.robot || this.robot.base !== base) {
      if (this.robot) {
        this.escena.remove(this.robot.malla);
        liberar(this.robot.malla);
      }
      const malla = new THREE.Group();
      const nuevoRobot = modeloSuelto('robot-suelo');
      if (nuevoRobot) malla.add(nuevoRobot);
      const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 24), mat(0xf7f4ef, { roughness: 0.4 }));
      cuerpo.position.y = 0.04;
      cuerpo.castShadow = true;
      if (!nuevoRobot) malla.add(cuerpo);
      const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), mat(0x3b2f26));
      tapa.position.y = 0.085;
      if (!nuevoRobot) malla.add(tapa);
      const luz = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0x6cc08a }));
      luz.position.set(0.1, 0.085, 0);
      if (!nuevoRobot) malla.add(luz);
      malla.visible = false;
      this.escena.add(malla);
      this.robot = { base, malla, estado: 'casa', t: 8, objetivo: null };
    }
    const r = this.robot;
    const casa = base.position.clone().add(new THREE.Vector3(0, 0, 0.06).applyAxisAngle(new THREE.Vector3(0, 1, 0), base.rotation.y));
    const enCasa = r.estado === 'casa';
    base.userData.mallas.slice(3).forEach(m => { m.visible = enCasa; });
    r.malla.visible = !enCasa;

    const mover = (destino, alLlegar) => {
      const p = r.malla.position;
      const dx = destino.x - p.x;
      const dz = destino.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.03) {
        alLlegar();
        return;
      }
      const paso = Math.min(dist, 0.55 * dt);
      p.x += dx / dist * paso;
      p.z += dz / dist * paso;
      r.malla.rotation.y = Math.atan2(dx, dz);
    };

    if (r.estado === 'casa') {
      r.t -= dt;
      if (r.t <= 0) {
        r.t = 10;
        const objetivos = this.lista.filter(d => TIPOS[d.tipo].robot);
        if (objetivos.length) {
          r.malla.position.set(casa.x, 0, casa.z);
          objetivos.sort((a, b) => Math.hypot(a.x - casa.x, a.z - casa.z) - Math.hypot(b.x - casa.x, b.z - casa.z));
          r.objetivo = objetivos[0];
          r.estado = 'ir';
        }
      }
    } else if (r.estado === 'ir') {
      if (r.objetivo.limpia) {
        r.estado = 'volver';
        return;
      }
      mover(r.objetivo, () => {
        r.estado = 'limpiar';
        r.t = 1.6;
      });
    } else if (r.estado === 'limpiar') {
      r.t -= dt;
      r.malla.rotation.y += dt * 8;
      if (r.t <= 0) {
        if (!r.objetivo.limpia) {
          this.eventos.particula('✨', r.objetivo.grupo.position);
          this.limpiar(r.objetivo, 'robot');
        }
        const siguiente = this.lista.filter(d => TIPOS[d.tipo].robot)[0];
        if (siguiente) {
          r.objetivo = siguiente;
          r.estado = 'ir';
        } else r.estado = 'volver';
      }
    } else if (r.estado === 'volver') {
      mover(casa, () => {
        r.estado = 'casa';
        r.t = 10;
      });
    }
  }

  actualizarLimpiadora(dt) {
    if (this.visita) {
      const v = this.visita;
      v.t += dt;
      if (v.fase === 'entrar') {
        v.malla.scale.setScalar(Math.min(1, v.t / 0.4) * 0.9);
        if (v.t > 0.6) {
          v.fase = 'limpiar';
          v.t = 0;
        }
      } else if (v.fase === 'limpiar') {
        v.malla.rotation.y += dt * 4;
        if (v.t > 0.35) {
          v.t = 0;
          const d = this.lista[0];
          if (d) {
            this.eventos.particula('🫧', d.grupo.position);
            this.limpiar(d, 'limpiadora');
          } else {
            v.fase = 'salir';
            this.eventos.alVisitaLimpiadora();
          }
        }
      } else {
        v.malla.scale.setScalar(Math.max(0.01, (1 - v.t / 0.4) * 0.9));
        if (v.t > 0.4) {
          this.escena.remove(v.malla);
          liberar(v.malla);
          this.visita = null;
        }
      }
      return;
    }
    if (Date.now() > this.limpiadoraHasta) return;
    this.tVisita -= dt;
    if (this.tVisita > 0 || !this.lista.length) return;
    this.tVisita = 75;
    const malla = crearPersonaje('robi');
    malla.position.set(1.0, 0, 2.3);
    malla.scale.setScalar(0.01);
    malla.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.escena.add(malla);
    this.visita = { malla, fase: 'entrar', t: 0 };
    this.eventos.alLlegaLimpiadora();
  }
}
