import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crearPersonaje, animarPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';

const COLORES = [0xe05656, 0x5a8fd6, 0xf2d06b, 0xf4f1ea, 0x6cc08a, 0x3b3f44, 0xf29b5a, 0x9b6fb5, 0xd9dde0, 0x2f4f7a];
const GENTE = ['lola', 'mateo', 'sol', 'ramon', 'amigos', 'mama'];

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
}

function pieza(w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g.toNonIndexed();
}

function cil(r, h, x, y, z, seg = 10) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  g.translate(x, y, z);
  return g.toNonIndexed();
}

function unir(lista) {
  return mergeGeometries(lista.map(g => {
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    return g;
  }));
}

export class Calle {
  constructor(raiz, { calleY, anchoCalle, acera, matFaro, matPiloto, azar }) {
    this.R = raiz;
    this.Y = calleY;
    this.AC = anchoCalle;
    this.acera = acera;
    this.matFaro = matFaro;
    this.matPiloto = matPiloto;
    this.r = azar;
    this.vehiculos = [];
    this.peatones = [];
    this.pajaros = [];
    this.t = 0;
  }

  construir(W, D, zC, xC) {
    const R = this.R;
    const Y = this.Y;
    const AC = this.AC;
    const r = this.r;
    this.zC = zC;
    this.xC = xC;

    const ruedas = [];
    for (const [rx, rz] of [[0.62, 0.45], [0.62, -0.45], [-0.62, 0.45], [-0.62, -0.45]]) {
      const w = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10);
      w.rotateX(Math.PI / 2);
      w.translate(rx, 0.2, rz);
      ruedas.push(w.toNonIndexed());
    }
    const lista = [];
    for (let k = 0; k < 12; k++) {
      const horiz = k % 2 === 0;
      const sentido = k % 4 < 2 ? 1 : -1;
      const calle = horiz ? zC : xC;
      const carril = calle + sentido * 1.7 * (horiz ? 1 : -1);
      const tipo = k === 3 ? 'bus' : k === 6 || k === 9 ? 'furgo' : k === 1 ? 'taxi' : 'coche';
      lista.push({ horiz, sentido, carril, s: -60 + k * 10 + r() * 5, v: tipo === 'bus' ? 4 : 4.5 + r() * 3.5, tipo, aparcado: false });
    }
    const huecos = [];
    for (let s = -40; s <= 40; s += 7.5) {
      if (r() < 0.6) huecos.push({ horiz: true, carril: zC - (AC / 2 - 0.65), s: s + r() * 2 });
      if (r() < 0.6) huecos.push({ horiz: false, carril: xC + (AC / 2 - 0.65), s: s + r() * 2 });
    }
    for (const h of huecos) {
      if (Math.abs(h.s - (h.horiz ? xC : zC)) < 6) continue;
      lista.push({ ...h, sentido: r() < 0.5 ? 1 : -1, v: 0, tipo: r() < 0.2 ? 'furgo' : 'coche', aparcado: true });
    }
    const N = lista.length;
    const crear = (geo, m) => {
      const im = new THREE.InstancedMesh(geo, m, N);
      im.frustumCulled = false;
      R.add(im);
      return im;
    };
    this.mCuerpo = crear(unir([pieza(2.0, 0.5, 0.95, 0, 0.42, 0), pieza(0.95, 0.06, 0.87, -0.1, 1.08, 0)]), mat(0xffffff, { roughness: 0.45, metalness: 0.2 }));
    this.mCristal = crear(pieza(1.05, 0.42, 0.85, -0.1, 0.86, 0), mat(0x9fc3d6, { roughness: 0.2 }));
    this.mRuedas = crear(unir(ruedas), mat(0x26282b, { roughness: 0.9 }));
    this.mFaros = crear(unir([pieza(0.04, 0.1, 0.18, 1.0, 0.5, 0.3), pieza(0.04, 0.1, 0.18, 1.0, 0.5, -0.3)]), this.matFaro);
    this.mPilotos = crear(unir([pieza(0.04, 0.1, 0.18, -1.0, 0.5, 0.3), pieza(0.04, 0.1, 0.18, -1.0, 0.5, -0.3)]), this.matPiloto);
    this.mTaxi = crear(pieza(0.3, 0.12, 0.2, -0.1, 1.17, 0), mat(0xffe27a, { emissive: 0xffd040, emissiveIntensity: 0.3 }));
    const col = new THREE.Color();
    lista.forEach((d, i) => {
      let c = COLORES[Math.floor(r() * COLORES.length)];
      if (d.tipo === 'bus') c = 0xd9493f;
      if (d.tipo === 'taxi') c = 0xf7f4ef;
      if (d.tipo === 'furgo') c = r() < 0.5 ? 0xf4f1ea : 0x5a8fd6;
      this.mCuerpo.setColorAt(i, col.setHex(c));
      d.escala = d.tipo === 'bus' ? new THREE.Vector3(2.7, 1.6, 1.25) : d.tipo === 'furgo' ? new THREE.Vector3(1.2, 1.35, 1.05) : new THREE.Vector3(1, 1, 1);
      d.giro = d.horiz ? (d.sentido > 0 ? 0 : Math.PI) : (d.sentido > 0 ? -Math.PI / 2 : Math.PI / 2);
    });
    this.mCuerpo.instanceColor.needsUpdate = true;
    this.vehiculos = lista;
    this.colocarVehiculos(0);

    const urb = [];
    const madera = [];
    const verdes = [];
    const amarillos = [];
    const azules = [];
    const banco = (x, z, ry) => {
      const s = Math.sin(ry);
      const c = Math.cos(ry);
      const P = (px, pz) => [x + px * c + pz * s, z - px * s + pz * c];
      for (const [px, pz, w, h, d, y, lista2] of [
        [0, 0, 1.6, 0.06, 0.45, 0.45, madera], [0, -0.2, 1.6, 0.4, 0.06, 0.7, madera],
        [-0.7, 0, 0.06, 0.45, 0.45, 0.22, urb], [0.7, 0, 0.06, 0.45, 0.45, 0.22, urb]
      ]) {
        const [qx, qz] = P(px, pz);
        const g = new THREE.BoxGeometry(w, h, d);
        g.rotateY(ry);
        g.translate(qx, Y + y, qz);
        lista2.push(g.toNonIndexed());
      }
    };
    const papelera = (x, z) => {
      urb.push(cil(0.16, 0.6, x, Y + 0.3, z));
      urb.push(cil(0.05, 0.4, x, Y + 0.2, z, 6));
    };
    const contenedor = (x, z, lista2, horiz) => {
      lista2.push(pieza(horiz ? 1.2 : 0.8, 1.0, horiz ? 0.8 : 1.2, x, Y + 0.55, z));
      lista2.push(pieza(horiz ? 1.25 : 0.85, 0.08, horiz ? 0.85 : 1.25, x, Y + 1.09, z));
    };
    const aceraNuestraZ = zC + AC / 2 + 1.0;
    const aceraNuestraX = xC + AC / 2 + 1.0;
    banco(-W / 2 + 1.2, aceraNuestraZ + 0.1, Math.PI);
    banco(W / 2 + 1.8, aceraNuestraZ + 0.1, Math.PI);
    banco(aceraNuestraX + 0.1, D / 2 + 1.5, -Math.PI / 2);
    papelera(-W / 2 - 0.4, aceraNuestraZ - 0.3);
    papelera(aceraNuestraX - 0.3, -D / 2 - 0.4);
    papelera(W / 2 + 4, aceraNuestraZ - 0.3);
    contenedor(W / 2 + 6.5, zC + AC / 2 - 0.7, verdes, true);
    contenedor(W / 2 + 7.9, zC + AC / 2 - 0.7, amarillos, true);
    contenedor(W / 2 + 9.3, zC + AC / 2 - 0.7, azules, true);
    contenedor(xC + AC / 2 - 0.7, D / 2 + 5, verdes, false);
    const parada = zC - AC / 2 - 1.4;
    const vidrio = [];
    vidrio.push(pieza(3.2, 1.9, 0.05, 6, Y + 1.15, parada - 0.55));
    vidrio.push(pieza(0.05, 1.9, 1.1, 4.4, Y + 1.15, parada));
    urb.push(pieza(3.5, 0.1, 1.4, 6, Y + 2.15, parada));
    for (const px of [4.4, 7.6]) urb.push(pieza(0.08, 2.1, 0.08, px, Y + 1.05, parada - 0.55));
    madera.push(pieza(2.2, 0.06, 0.35, 6, Y + 0.45, parada - 0.32));
    const cartel = mat(0x4a8fd6, { emissive: 0x4a8fd6, emissiveIntensity: 0.25 });
    const semaforos = [];
    const sem = (x, z) => {
      urb.push(cil(0.06, 3.2, x, Y + 1.6, z, 8));
      urb.push(pieza(0.3, 0.8, 0.3, x, Y + 3.1, z));
      semaforos.push([x, z]);
    };
    sem(xC + AC / 2 + 0.4, zC + AC / 2 + 0.4);
    sem(xC - AC / 2 - 0.4, zC - AC / 2 - 0.4);
    sem(xC + AC / 2 + 0.4, zC - AC / 2 - 0.4);
    sem(xC - AC / 2 - 0.4, zC + AC / 2 + 0.4);
    const anadir = (lista2, m) => {
      if (!lista2.length) return null;
      const mesh = new THREE.Mesh(unir(lista2), m);
      R.add(mesh);
      return mesh;
    };
    anadir(urb, mat(0x3b3f44, { roughness: 0.6, metalness: 0.3 }));
    anadir(madera, mat(0x9c6b45));
    anadir(verdes, mat(0x4f8a52));
    anadir(amarillos, mat(0xe8c13a));
    anadir(azules, mat(0x3f6fb5));
    anadir(vidrio, new THREE.MeshStandardMaterial({ color: 0xcfe8f2, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }));
    const cart = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), cartel);
    cart.position.set(7.8, Y + 2.5, parada + 0.6);
    R.add(cart);
    this.luces = ['rojo', 'ambar', 'verde'].map((n, i) => {
      const c = [0xff3b30, 0xffb020, 0x34c759][i];
      const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.1 });
      const geo = [];
      for (const [x, z] of semaforos) for (const [dx, dz] of [[0.16, 0], [-0.16, 0], [0, 0.16], [0, -0.16]]) {
        const g = new THREE.SphereGeometry(0.07, 8, 6);
        g.translate(x + dx, Y + 3.35 - i * 0.24, z + dz);
        geo.push(g.toNonIndexed());
      }
      R.add(new THREE.Mesh(unir(geo), m));
      return m;
    });

    const rutas = [];
    for (const lado of [1, -1]) {
      rutas.push({ horiz: true, carril: zC + lado * (AC / 2 + 1.1) });
      rutas.push({ horiz: false, carril: xC + lado * (AC / 2 + 1.1) });
    }
    for (let k = 0; k < 10; k++) {
      const ruta = rutas[k % rutas.length];
      const p = crearPersonaje(GENTE[k % GENTE.length]);
      p.scale.setScalar(1.25);
      const sentido = r() < 0.5 ? 1 : -1;
      const d = { ...ruta, carril: ruta.carril + (r() - 0.5) * 0.6, sentido, s: -45 + k * 9 + r() * 4, v: 0.8 + r() * 0.5, pausa: 0 };
      p.userData.peaton = d;
      p.rotation.y = d.horiz ? (sentido > 0 ? Math.PI / 2 : -Math.PI / 2) : (sentido > 0 ? 0 : Math.PI);
      animarPersonaje(p, 'walk');
      R.add(p);
      this.peatones.push(p);
      if (k % 3 === 0) {
        try {
          const perro = crearModeloMascota(['perro', 'perro', 'gato'][k % 3 === 0 && k % 2 ? 2 : 0]);
          const gp = new THREE.Group();
          gp.add(perro);
          gp.scale.setScalar(0.85);
          R.add(gp);
          d.perro = gp;
        } catch (e) {}
      }
    }
    for (const [x, z, ry, quien] of [[-W / 2 + 1.2, aceraNuestraZ + 0.2, Math.PI, 'mama'], [6.3, parada - 0.2, 0, 'ramon']]) {
      const p = crearPersonaje(quien);
      p.scale.setScalar(1.25);
      p.position.set(x, Y + 0.04, z);
      p.rotation.y = ry;
      animarPersonaje(p, 'sit');
      R.add(p);
      this.peatones.push(p);
    }
    const quieto = crearPersonaje('sol');
    quieto.scale.setScalar(1.25);
    quieto.position.set(5, Y, parada + 0.1);
    quieto.rotation.y = -Math.PI / 2 + 0.3;
    animarPersonaje(quieto, 'idle');
    R.add(quieto);
    this.peatones.push(quieto);

    const negro = mat(0x2b2b33);
    for (let k = 0; k < 7; k++) {
      const b = new THREE.Group();
      const alas = [];
      for (const l of [-1, 1]) {
        const a = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.14), negro);
        a.geometry.translate(l * 0.25, 0, 0);
        b.add(a);
        alas.push(a);
      }
      b.userData = { alas, fase: k * 0.7, fila: k };
      R.add(b);
      this.pajaros.push(b);
    }
  }

  colocarVehiculos(dt) {
    const m4 = this.m4 || (this.m4 = new THREE.Matrix4());
    const q = this.q || (this.q = new THREE.Quaternion());
    const v = this.v3 || (this.v3 = new THREE.Vector3());
    const eje = this.eje || (this.eje = new THREE.Vector3(0, 1, 0));
    const fuera = this.fuera || (this.fuera = new THREE.Matrix4().makeScale(0, 0, 0));
    this.vehiculos.forEach((d, i) => {
      if (!d.aparcado) {
        let vel = d.v;
        const cruce = d.horiz ? this.xC : this.zC;
        const rojo = d.horiz ? this.fase !== 0 : this.fase !== 2;
        const hasta = (cruce - d.s) * d.sentido;
        if (rojo && hasta > 4 && hasta < 6.5) vel = 0;
        d.vel = (d.vel ?? vel) + (vel - (d.vel ?? vel)) * Math.min(1, dt * 3);
        d.s += d.vel * dt * d.sentido;
        if (d.s > 70) d.s = -70;
        if (d.s < -70) d.s = 70;
      }
      if (d.horiz) v.set(d.s, this.Y, d.carril);
      else v.set(d.carril, this.Y, d.s);
      m4.compose(v, q.setFromAxisAngle(eje, d.giro), d.escala);
      for (const m of [this.mCuerpo, this.mCristal, this.mRuedas, this.mFaros, this.mPilotos]) m.setMatrixAt(i, m4);
      this.mTaxi.setMatrixAt(i, d.tipo === 'taxi' ? m4 : fuera);
    });
    for (const m of [this.mCuerpo, this.mCristal, this.mRuedas, this.mFaros, this.mPilotos, this.mTaxi]) m.instanceMatrix.needsUpdate = true;
  }

  ponerNoche(k) {
    this.noche = k;
  }

  actualizar(dt) {
    if (!this.vehiculos.length) return;
    this.t += dt;
    const ciclo = this.t % 16;
    this.fase = ciclo < 7 ? 0 : ciclo < 8 ? 1 : ciclo < 15 ? 2 : 1;
    const ambar = this.fase === 1;
    const verdeX = this.fase === 0;
    this.luces[0].emissiveIntensity = !ambar ? 1.4 : 0.1;
    this.luces[1].emissiveIntensity = ambar ? 1.6 : 0.1;
    this.luces[2].emissiveIntensity = verdeX || this.fase === 2 ? 1.4 : 0.1;
    this.colocarVehiculos(dt);
    for (const p of this.peatones) {
      if (!p.layers.isEnabled(2)) p.traverse(o => o.layers.set(2));
      const d = p.userData.peaton;
      if (!d) continue;
      d.s += d.v * dt * d.sentido;
      if (d.s > 55) d.s = -55;
      if (d.s < -55) d.s = 55;
      if (d.horiz) p.position.set(d.s, this.Y, d.carril);
      else p.position.set(d.carril, this.Y, d.s);
      if (d.perro) {
        if (!d.perro.layers.isEnabled(2)) d.perro.traverse(o => o.layers.set(2));
        const atras = -0.7 * d.sentido;
        const lado = 0.35;
        if (d.horiz) d.perro.position.set(d.s + atras, this.Y + Math.abs(Math.sin(this.t * 10)) * 0.03, d.carril + lado);
        else d.perro.position.set(d.carril + lado, this.Y + Math.abs(Math.sin(this.t * 10)) * 0.03, d.s + atras);
        d.perro.rotation.y = p.rotation.y;
      }
    }
    const ang0 = this.t * 0.08;
    for (const b of this.pajaros) {
      if (!b.layers.isEnabled(2)) b.traverse(o => o.layers.set(2));
      const d = b.userData;
      const fila = d.fila;
      const ang = ang0 - (fila % 2 ? 1 : -1) * Math.ceil(fila / 2) * 0.02 - Math.ceil(fila / 2) * 0.015;
      const rad = 26 + Math.ceil(fila / 2) * 0.9 * (fila % 2 ? 1 : -1);
      b.position.set(Math.cos(ang) * rad, 9 + Math.sin(this.t * 0.5) * 1.5 - Math.ceil(fila / 2) * 0.3, Math.sin(ang) * rad - 10);
      b.rotation.y = -ang;
      d.alas.forEach((a, i) => { a.rotation.z = Math.sin(this.t * 9 + d.fase) * 0.6 * (i ? -1 : 1); });
    }
  }
}
