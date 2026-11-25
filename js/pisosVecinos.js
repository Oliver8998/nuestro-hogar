import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { infoItem } from './catalogo.js';
import { crearPersonaje, animarPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';

const ALTO = 2.5;
const GROSOR = 0.15;
const ESCALA_PERSONA = 1.25;
const GENTE = ['lola', 'mateo', 'sol', 'mama', 'ramon', 'amigos'];
const CORTINAS_PISO = [0xf4c7c3, 0xcfe3ef, 0xfff3c4, 0xe6dcf1, 0xd8ecd3, 0xf6e9d6];

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
      const matFachada = mat(0xe9d9c3);
      const matMarco = mat(0xf7f2ea);
      const matCristal = new THREE.MeshStandardMaterial({ color: 0xbfdbe8, transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1, depthWrite: false });
      const matHierro = mat(0x3d3a3a, { roughness: 0.6 });
      const SILL_V = 0.7;
      const TOPE = 2.2;
      const VW = 1.3;
      const ventanas = [];
      const caras = [
        { n: new THREE.Vector3(0, 0, -1), largo: ancho + GROSOR * 2, c: -(fondo / 2 + GROSOR / 2) },
        { n: new THREE.Vector3(0, 0, 1), largo: ancho + GROSOR * 2, c: fondo / 2 + GROSOR / 2 },
        { n: new THREE.Vector3(-1, 0, 0), largo: fondo, c: -(ancho / 2 + GROSOR / 2) },
        { n: new THREE.Vector3(1, 0, 0), largo: fondo, c: ancho / 2 + GROSOR / 2 }
      ];
      caras.forEach((cara, i) => {
        const horiz = i < 2;
        const L = cara.largo;
        const centros = L >= 5 ? [-L * 0.24, L * 0.24] : [0];
        const ponerCaja = (a0, a1, y0, y1, material, grosor = GROSOR, salida = 0) => {
          if (a1 - a0 < 0.005 || y1 - y0 < 0.005) return null;
          const geo = horiz ? new THREE.BoxGeometry(a1 - a0, y1 - y0, grosor) : new THREE.BoxGeometry(grosor, y1 - y0, a1 - a0);
          const m = new THREE.Mesh(geo, material);
          const a = (a0 + a1) / 2;
          const sx = cara.n.x * salida;
          const sz = cara.n.z * salida;
          if (horiz) m.position.set(a + sx, (y0 + y1) / 2, cara.c + sz);
          else m.position.set(cara.c + sx, (y0 + y1) / 2, a + sz);
          g.add(m);
          return m;
        };
        let cursor = -L / 2;
        for (const cx of centros) {
          const balcon = (k + i + centros.indexOf(cx)) % 3 === 0;
          const SILL = balcon ? 0.04 : SILL_V;
          ponerCaja(cursor, cx - VW / 2, 0, ALTO, matFachada);
          ponerCaja(cx - VW / 2, cx + VW / 2, 0, SILL, matFachada);
          ponerCaja(cx - VW / 2, cx + VW / 2, TOPE, ALTO, matFachada);
          cursor = cx + VW / 2;
          ponerCaja(cx - VW / 2 - 0.06, cx - VW / 2, SILL, TOPE, matMarco, GROSOR + 0.04);
          ponerCaja(cx + VW / 2, cx + VW / 2 + 0.06, SILL, TOPE, matMarco, GROSOR + 0.04);
          ponerCaja(cx - VW / 2 - 0.06, cx + VW / 2 + 0.06, TOPE, TOPE + 0.06, matMarco, GROSOR + 0.04);
          ponerCaja(cx - VW / 2 - 0.1, cx + VW / 2 + 0.1, SILL - 0.06, SILL, matMarco, GROSOR + 0.14, 0.04);
          ponerCaja(cx - 0.02, cx + 0.02, SILL, TOPE, matMarco, 0.04, 0.02);
          ponerCaja(cx - VW / 2, cx + VW / 2, SILL, TOPE, matCristal, 0.01, 0.03);
          if (balcon) {
            ponerCaja(cx - VW / 2 - 0.2, cx + VW / 2 + 0.2, 0.02, 0.06, matHierro, 0.5, GROSOR / 2 + 0.25);
            ponerCaja(cx - VW / 2 - 0.2, cx + VW / 2 + 0.2, 0.62, 0.66, matHierro, 0.04, GROSOR / 2 + 0.48);
            for (let b = 0; b <= 8; b++) {
              const bx = cx - VW / 2 - 0.2 + b * (VW + 0.4) / 8;
              ponerCaja(bx - 0.012, bx + 0.012, 0.06, 0.62, matHierro, 0.024, GROSOR / 2 + 0.48);
            }
          } else if ((k + i) % 2 === 0) {
            const maceta = ponerCaja(cx - 0.35, cx + 0.35, SILL, SILL + 0.16, mat(0xb5653e), 0.16, GROSOR / 2 + 0.1);
            if (maceta) {
              const flor = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), mat([0xe07a8a, 0x6aa35a, 0xf2d06b][(k + i) % 3]));
              flor.scale.set(2.4, 1, 1);
              flor.position.copy(maceta.position).add(new THREE.Vector3(0, 0.14, 0));
              if (!horiz) flor.rotation.y = Math.PI / 2;
              g.add(flor);
            }
          }
          const cortina = CORTINAS_PISO[(k * 3 + i + centros.indexOf(cx)) % CORTINAS_PISO.length];
          for (const lado of [-1, 1]) {
            const ancho2 = 0.16 + ((k + i) % 3) * 0.06;
            const a0 = lado < 0 ? cx - VW / 2 : cx + VW / 2 - ancho2;
            ponerCaja(a0, a0 + ancho2, SILL + 0.02, TOPE - 0.02, mat(cortina, { side: THREE.DoubleSide }), 0.02, -GROSOR / 2 - 0.06);
          }
          const dentro = new THREE.Vector3();
          if (horiz) dentro.set(cx, 0, cara.c - cara.n.z * (GROSOR / 2 + 0.45));
          else dentro.set(cara.c - cara.n.x * (GROSOR / 2 + 0.45), 0, cx);
          const alfeizar = dentro.clone().addScaledVector(cara.n, 0.33);
          alfeizar.y = balcon ? 0.02 : SILL + 0.02;
          ventanas.push({ n: cara.n, dentro, alfeizar, balcon, fuera: balcon ? dentro.clone().addScaledVector(cara.n, 0.85) : null });
        }
        ponerCaja(cursor, L / 2, 0, ALTO, matFachada);
        ponerCaja(-L / 2 - 0.05, L / 2 + 0.05, -0.12, 0.02, cornisa, GROSOR + 0.1, 0.03);
      });
      const forro = [
        [0, -(fondo / 2) + 0.002, ancho, 0],
        [0, fondo / 2 - 0.002, ancho, Math.PI],
        [-(ancho / 2) + 0.002, 0, fondo, Math.PI / 2],
        [ancho / 2 - 0.002, 0, fondo, -Math.PI / 2]
      ];
      forro.forEach(([x, z, largo, ry], i) => {
        const cara = caras[i];
        const centros = cara.largo >= 5 ? [-cara.largo * 0.24, cara.largo * 0.24] : [0];
        const shape = new THREE.Shape();
        shape.moveTo(-largo / 2, 0);
        shape.lineTo(largo / 2, 0);
        shape.lineTo(largo / 2, ALTO);
        shape.lineTo(-largo / 2, ALTO);
        shape.lineTo(-largo / 2, 0);
        for (const cx of centros) {
          const SILL = (k + i + centros.indexOf(cx)) % 3 === 0 ? 0.04 : SILL_V;
          const sx = i === 0 || i === 3 ? cx : -cx;
          const h = new THREE.Path();
          h.moveTo(sx - VW / 2, SILL);
          h.lineTo(sx + VW / 2, SILL);
          h.lineTo(sx + VW / 2, TOPE);
          h.lineTo(sx - VW / 2, TOPE);
          h.lineTo(sx - VW / 2, SILL);
          shape.holes.push(h);
        }
        const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), matPared);
        m.position.set(x, 0, z);
        m.rotation.y = ry;
        g.add(m);
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
      this.pisos.push({ g, ventanas, matPared, matSuelo, sitio, y, encendido: Math.random() < 0.75, gente: [] });
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
    const visibles = piso.ventanas.filter(v => v.n.x * this.camDir.x + v.n.z * this.camDir.z > 0.15);
    if (!visibles.length) {
      this.tEvento = 3;
      return;
    }
    const noche = this.noche > 0.5;
    const elegir = l => l[Math.floor(Math.random() * l.length)];
    const v = elegir(visibles);
    const fuera = Math.atan2(v.n.x, v.n.z);
    const lateral = new THREE.Vector3(-v.n.z, 0, v.n.x);
    const atras = v.dentro.clone().addScaledVector(v.n, -0.9);
    const entrada = new THREE.Vector3(-this.ancho / 2 + 0.6, 0, -this.fondo / 2 + 0.6);
    const opciones = [
      ['asomarse', 4],
      ['pasar', 2.5],
      ['gato', 2],
      ['charla', 2],
      ['regar', 1.5],
      v.balcon ? ['balcon', 3] : null,
      noche ? ['tele', 2] : null,
      noche ? ['fiesta', 1.2] : null,
      noche ? ['luz', 1.5] : null
    ].filter(Boolean);
    let r = Math.random() * opciones.reduce((a, o) => a + o[1], 0);
    let tipo = opciones[0][0];
    for (const [t, peso] of opciones) {
      r -= peso;
      if (r <= 0) {
        tipo = t;
        break;
      }
    }
    const actores = [];
    if (tipo === 'asomarse') {
      actores.push({ obj: this.persona(piso), pasos: [
        { aparecer: atras }, { ir: v.dentro }, { mirar: fuera, anim: 'idle', dur: 1.2 }, { anim: 'emote-yes', dur: 2.2 },
        { anim: 'idle', dur: 3 + Math.random() * 3 }, { anim: 'emote-yes', dur: 1.6 }, { ir: atras }, { desaparecer: true }
      ] });
    } else if (tipo === 'balcon') {
      actores.push({ obj: this.persona(piso), pasos: [
        { aparecer: atras }, { ir: v.dentro }, { ir: v.fuera, vel: 0.6 }, { mirar: fuera, anim: 'idle', dur: 2 },
        { anim: 'emote-yes', dur: 2.2 }, { anim: 'idle', dur: 4 + Math.random() * 4 }, { ir: v.dentro, vel: 0.6 }, { ir: atras }, { desaparecer: true }
      ] });
    } else if (tipo === 'pasar') {
      const otra = elegir(visibles);
      const a = v.dentro.clone().addScaledVector(lateral, -0.9);
      const b = otra.dentro.clone().addScaledVector(new THREE.Vector3(-otra.n.z, 0, otra.n.x), 0.9);
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: a }, { ir: v.dentro }, { ir: b }, { desaparecer: true }] });
    } else if (tipo === 'gato') {
      const m = this.mascota(piso);
      if (m) actores.push({ obj: m, mascota: true, pasos: [{ aparecer: v.alfeizar }, { mirar: fuera, quieto: 7 + Math.random() * 6 }, { mirar: fuera + 1.2, quieto: 2 }, { desaparecer: true }] });
    } else if (tipo === 'charla') {
      const pa = v.dentro.clone().addScaledVector(lateral, -0.32).addScaledVector(v.n, -0.15);
      const pb = v.dentro.clone().addScaledVector(lateral, 0.32).addScaledVector(v.n, -0.15);
      const mira = Math.atan2(lateral.x, lateral.z);
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: pa }, { mirar: mira, anim: 'idle', dur: 1.5 }, { anim: 'emote-yes', dur: 2 }, { anim: 'idle', dur: 4 }, { anim: 'interact-right', dur: 1.5 }, { anim: 'idle', dur: 2 }, { ir: atras }, { desaparecer: true }] });
      actores.push({ obj: this.persona(piso), pasos: [{ espera: 1 }, { aparecer: atras }, { ir: pb }, { mirar: mira + Math.PI, anim: 'idle', dur: 2.5 }, { anim: 'emote-no', dur: 1.6 }, { anim: 'idle', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'regar') {
      actores.push({ obj: this.persona(piso), pasos: [{ aparecer: atras }, { ir: v.dentro }, { mirar: fuera, anim: 'interact-right', dur: 3.5 }, { anim: 'idle', dur: 1 }, { ir: atras }, { desaparecer: true }] });
    } else if (tipo === 'tele') {
      piso.tele = true;
      actores.push({ obj: new THREE.Group(), pasos: [{ espera: 14 + Math.random() * 8 }] });
      piso.g.add(actores[0].obj);
    } else if (tipo === 'fiesta') {
      piso.fiesta = 0;
      for (let k = 0; k < 3; k++) {
        const sitio = v.dentro.clone().addScaledVector(lateral, (k - 1) * 0.5).addScaledVector(v.n, -0.3 - (k % 2) * 0.4);
        actores.push({ obj: this.persona(piso), pasos: [{ espera: k * 0.6 }, { aparecer: atras }, { ir: sitio }, { mirar: fuera, anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { anim: 'jump', dur: 3 }, { anim: 'emote-yes', dur: 2 }, { ir: atras }, { desaparecer: true }] });
      }
    } else if (tipo === 'luz') {
      piso.encendido = !piso.encendido;
      this.ponerNoche(this.noche);
      this.tEvento = 4 + Math.random() * 6;
      return;
    }
    void entrada;
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
    if (e.tipo === 'fiesta' || e.tipo === 'tele') {
      e.piso.fiesta = null;
      e.piso.tele = false;
      e.piso.matPared.emissive.setHex(0xffc98a);
      this.ponerNoche(this.noche);
    }
    this.evento = null;
  }

  actualizar(dt, camDir, paredesVisibles) {
    if (camDir) this.camDir.copy(camDir);
    if (!this.pisos.length) return;
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
    if (e.tipo === 'tele') {
      if (Math.random() < dt * 5) {
        e.piso.matPared.emissive.setHSL(0.55 + Math.random() * 0.15, 0.6, 0.6);
        e.piso.matPared.emissiveIntensity = 0.12 + Math.random() * 0.2;
      }
    }
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
