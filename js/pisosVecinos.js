import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { infoItem } from './catalogo.js';
import { crearPersonaje, animarPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';

const ALTO = 2.5;
const GROSOR = 0.15;
const ESCALA_PERSONA = 1.25;
const GENTE = ['lola', 'mateo', 'sol', 'mama', 'ramon', 'amigos'];

const DECORADOS = [
  { pared: 0xc9dbe6, suelo: 0x8a6748, muebles: [['sofa', 'fondo', 0], ['tele', 'frente', 0], ['alfombra', 'centro', 0], ['planta', 'esquina', 0], ['lampara', 'esquina', 1], ['estanteria', 'izquierda', 0.2]] },
  { pared: 0xf1d9c6, suelo: 0x7e5f45, muebles: [['cama', 'fondo', -0.15], ['comoda', 'izquierda', -0.2], ['escritorio', 'derecha', 0.25], ['silla', 'derechaDentro', 0.25], ['planta', 'esquina', 2], ['alfombra', 'centroLado', 0]] },
  { pared: 0xe3e8cf, suelo: 0x9c8d78, muebles: [['mesa', 'centro', 0], ['silla', 'mesaA', 0], ['silla', 'mesaB', 0], ['estanteria', 'fondo', 0.25], ['sofa', 'izquierda', 0], ['planta', 'esquina', 3]] },
  { pared: 0xf3e3ee, suelo: 0x87674c, muebles: [['sofa', 'izquierda', 0], ['tele', 'derecha', 0], ['alfombra', 'centro', 0], ['comoda', 'fondo', 0.25], ['lampara', 'esquina', 0], ['planta', 'esquina', 2]] }
];

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
}

function aCapa(o) {
  o.traverse(x => x.layers.set(2));
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
      const paredes = [
        { n: new THREE.Vector3(0, 0, -1), pos: [0, -(fondo / 2 + GROSOR / 2)], dim: [ancho + GROSOR * 2, GROSOR] },
        { n: new THREE.Vector3(0, 0, 1), pos: [0, fondo / 2 + GROSOR / 2], dim: [ancho + GROSOR * 2, GROSOR] },
        { n: new THREE.Vector3(-1, 0, 0), pos: [-(ancho / 2 + GROSOR / 2), 0], dim: [GROSOR, fondo] },
        { n: new THREE.Vector3(1, 0, 0), pos: [ancho / 2 + GROSOR / 2, 0], dim: [GROSOR, fondo] }
      ].map((p, i) => {
        const pg = new THREE.Group();
        const m = new THREE.Mesh(new THREE.BoxGeometry(p.dim[0], ALTO, p.dim[1]), matPared);
        m.position.set(p.pos[0], ALTO / 2, p.pos[1]);
        pg.add(m);
        const largo = i < 2 ? ancho : fondo;
        const vent = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.3, largo * 0.3), 1.1), new THREE.MeshStandardMaterial({ color: 0xa9d4e8, emissive: 0x8fc3dd, emissiveIntensity: 0.35, roughness: 0.2 }));
        const marco = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.3, largo * 0.3) + 0.12, 1.22), mat(0xf7f1e8));
        const off = (k % 2 ? -1 : 1) * largo * 0.18;
        const dentro = GROSOR / 2 + 0.01;
        for (const [obj, extra] of [[marco, 0], [vent, 0.004]]) {
          if (i < 2) obj.position.set(p.pos[0] + off, 1.45, p.pos[1] - p.n.z * (dentro + extra));
          else obj.position.set(p.pos[0] - p.n.x * (dentro + extra), 1.45, p.pos[1] + off);
          obj.rotation.y = Math.atan2(-p.n.x, -p.n.z);
          pg.add(obj);
        }
        g.add(pg);
        pg.userData.n = p.n;
        return pg;
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
        }
        if (id === 'planta' && !sitio.planta) sitio.planta = { x, z };
      }
      aCapa(g);
      this.raiz.add(g);
      this.pisos.push({ g, paredes, matPared, matSuelo, sitio, y, encendido: Math.random() < 0.75, gente: [] });
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
      const luz = p.encendido ? k * 0.28 : k * 0.03;
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
      m = crearModeloMascota(Math.random() < 0.6 ? 'gato' : 'perro');
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

  empezarEvento() {
    if (!this.pisos.length) return;
    const piso = this.pisos[Math.floor(Math.random() * this.pisos.length)];
    const noche = this.noche > 0.5;
    const [ax, az] = this.ladoAbierto();
    const borde = new THREE.Vector3(ax * (this.ancho / 2 - 0.35), 0, az * (this.fondo / 2 - 0.35));
    const lateral = new THREE.Vector3(-az, 0, ax);
    const asomado = borde.clone().addScaledVector(lateral, (Math.random() - 0.5) * Math.min(this.ancho, this.fondo) * 0.5);
    const mirarFuera = Math.atan2(ax, az);
    const entrada = new THREE.Vector3(-this.ancho / 2 + 0.6, 0, -this.fondo / 2 + 0.6);
    const opciones = [
      ['asomarse', 4],
      ['pasear', 2],
      ['mascota', 2],
      ['charla', 2],
      piso.sitio.sofa ? ['sofa', 2] : null,
      piso.sitio.planta ? ['regar', 1.5] : null,
      noche ? ['fiesta', 1.2] : null,
      noche ? ['luz', 1.5] : null
    ].filter(Boolean);
    let total = opciones.reduce((s, o) => s + o[1], 0);
    let r = Math.random() * total;
    let tipo = opciones[0][0];
    for (const [t, peso] of opciones) {
      r -= peso;
      if (r <= 0) {
        tipo = t;
        break;
      }
    }
    const pasos = [];
    const actores = [];
    if (tipo === 'asomarse') {
      const p = this.persona(piso);
      actores.push({ obj: p, pasos: [
        { aparecer: entrada },
        { ir: asomado },
        { mirar: mirarFuera, anim: 'idle', dur: 1.2 },
        { anim: 'emote-yes', dur: 2.2 },
        { anim: 'idle', dur: 3 + Math.random() * 3 },
        { anim: 'emote-yes', dur: 1.6 },
        { ir: entrada },
        { desaparecer: true }
      ] });
    } else if (tipo === 'pasear') {
      const p = this.persona(piso);
      actores.push({ obj: p, pasos: [{ aparecer: entrada }, { ir: this.puntoAlAzar() }, { anim: 'idle', dur: 2 }, { ir: this.puntoAlAzar() }, { anim: 'pick-up', dur: 1.4 }, { ir: entrada }, { desaparecer: true }] });
    } else if (tipo === 'mascota') {
      const m = this.mascota(piso);
      if (m) actores.push({ obj: m, mascota: true, pasos: [{ aparecer: this.puntoAlAzar() }, { ir: this.puntoAlAzar(), vel: 0.6 }, { quieto: 2.5 }, { ir: asomado, vel: 0.6 }, { mirar: mirarFuera, quieto: 4 }, { ir: this.puntoAlAzar(), vel: 0.6 }, { desaparecer: true }] });
    } else if (tipo === 'charla') {
      const a = this.persona(piso);
      const b = this.persona(piso);
      const centro = this.puntoAlAzar(1.2);
      const pa = centro.clone().add(new THREE.Vector3(-0.45, 0, 0));
      const pb = centro.clone().add(new THREE.Vector3(0.45, 0, 0));
      actores.push({ obj: a, pasos: [{ aparecer: entrada }, { ir: pa }, { mirar: Math.PI / 2, anim: 'idle', dur: 1 }, { anim: 'emote-yes', dur: 2 }, { anim: 'idle', dur: 4 }, { anim: 'interact-right', dur: 1.5 }, { anim: 'idle', dur: 2 }, { ir: entrada }, { desaparecer: true }] });
      actores.push({ obj: b, pasos: [{ espera: 1.2 }, { aparecer: entrada }, { ir: pb }, { mirar: -Math.PI / 2, anim: 'idle', dur: 2.5 }, { anim: 'emote-no', dur: 1.6 }, { anim: 'idle', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: entrada }, { desaparecer: true }] });
    } else if (tipo === 'sofa') {
      const p = this.persona(piso);
      const s = piso.sitio.sofa;
      const delante = new THREE.Vector3(s.x + Math.sin(s.ry) * 0.5, 0, s.z + Math.cos(s.ry) * 0.5);
      actores.push({ obj: p, tele: true, pasos: [{ aparecer: entrada }, { ir: delante }, { mover: new THREE.Vector3(s.x, 0.02, s.z), mirar: s.ry, anim: 'sit', dur: 10 + Math.random() * 6 }, { mover: delante, anim: 'idle', dur: 0.5 }, { ir: entrada }, { desaparecer: true }] });
    } else if (tipo === 'regar') {
      const p = this.persona(piso);
      const pl = piso.sitio.planta;
      const junto = new THREE.Vector3(pl.x * 0.75, 0, pl.z * 0.75);
      actores.push({ obj: p, pasos: [{ aparecer: entrada }, { ir: junto }, { mirarA: new THREE.Vector3(pl.x, 0, pl.z), anim: 'interact-right', dur: 3.5 }, { anim: 'idle', dur: 1 }, { ir: entrada }, { desaparecer: true }] });
    } else if (tipo === 'fiesta') {
      piso.fiesta = 0;
      for (let k = 0; k < 3; k++) {
        const p = this.persona(piso);
        const sitio = this.puntoAlAzar(1);
        actores.push({ obj: p, pasos: [{ espera: k * 0.6 }, { aparecer: entrada }, { ir: sitio }, { mirar: mirarFuera, anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: entrada }, { desaparecer: true }] });
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
    if (e.tipo === 'fiesta') {
      e.piso.fiesta = null;
      e.piso.matPared.emissive.setHex(0xffc98a);
      this.ponerNoche(this.noche);
    }
    this.evento = null;
  }

  actualizar(dt, camDir, paredesVisibles) {
    if (camDir) this.camDir.copy(camDir);
    if (!this.pisos.length) return;
    for (const p of this.pisos) {
      p.paredes.forEach((w, i) => {
        w.visible = paredesVisibles ? paredesVisibles[i] : w.userData.n.dot(this.camDir) < -0.15;
      });
    }
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
