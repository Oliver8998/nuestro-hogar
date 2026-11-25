import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { crearPersonaje, animarPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';

const COLORES = [0xe05656, 0x5a8fd6, 0xf2d06b, 0xf4f1ea, 0x6cc08a, 0x3b3f44, 0xf29b5a, 0x9b6fb5, 0xd9dde0, 0x2f4f7a];
const GENTE = ['lola', 'mateo', 'sol', 'ramon', 'amigos', 'mama'];

function mascotaSuelta(especie, clip) {
  const p = crearModeloMascota(especie);
  if (!p) return null;
  const obj = p.raiz || p;
  if (p.acciones && p.acciones[clip]) {
    Object.values(p.acciones).forEach(a => a.stop());
    p.acciones[clip].play();
  }
  obj.userData.mixer = p.mixer || null;
  return obj;
}

function envolver(o) {
  if (!o) return null;
  const g = new THREE.Group();
  g.add(o);
  g.scale.setScalar(0.85);
  return g;
}

function vehiculoEspecial(tipo) {
  const g = new THREE.Group();
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf7f7f4, roughness: 0.4, metalness: 0.2 });
  const policia = tipo === 'policia';
  const largo = policia ? 2.1 : 2.6;
  const alto = policia ? 0.5 : 1.0;
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(largo, alto, 0.98), blanco);
  cuerpo.position.y = 0.17 + alto / 2;
  g.add(cuerpo);
  const cristal = new THREE.MeshStandardMaterial({ color: 0x9fc3d6, roughness: 0.2 });
  if (policia) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 0.88), cristal);
    cab.position.set(-0.1, 0.86, 0);
    const techo = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.9), blanco);
    techo.position.set(-0.1, 1.08, 0);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(largo + 0.01, 0.14, 0.99), new THREE.MeshStandardMaterial({ color: 0x1f4fa5 }));
    franja.position.y = 0.5;
    g.add(cab, techo, franja);
  } else {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.8), cristal);
    cab.position.set(largo / 2, 0.95, 0);
    const rojo = new THREE.MeshStandardMaterial({ color: 0xd63b3b });
    const franja = new THREE.Mesh(new THREE.BoxGeometry(largo + 0.01, 0.16, 0.99), rojo);
    franja.position.y = 0.62;
    const cruz1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 1.0), rojo);
    cruz1.position.set(-0.4, 0.95, 0);
    const cruz2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 1.0), rojo);
    cruz2.position.set(-0.4, 0.95, 0);
    g.add(cab, franja, cruz1, cruz2);
  }
  const topeY = policia ? 1.15 : 1.22;
  const luces = [0x3a7bff, 0xff3030].map((c, i) => {
    const m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), m);
    l.position.set(policia ? -0.1 : largo / 2 - 0.3, topeY, i ? -0.2 : 0.2);
    g.add(l);
    return m;
  });
  const rueda = new THREE.MeshStandardMaterial({ color: 0x26282b });
  for (const [rx, rz] of [[largo / 2 - 0.4, 0.46], [largo / 2 - 0.4, -0.46], [-largo / 2 + 0.4, 0.46], [-largo / 2 + 0.4, -0.46]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10), rueda);
    w.rotation.x = Math.PI / 2;
    w.position.set(rx, 0.2, rz);
    g.add(w);
  }
  g.userData.luces = luces;
  return g;
}

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

function textoTextura(texto, fondo, color, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = fondo;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = color;
  g.font = `bold ${Math.round(h * 0.55)}px Georgia, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(texto, w / 2, h / 2 + 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function tubo(y0, z0, y1, z1, x, Y, grosor = 0.035) {
  const largo = Math.hypot(y1 - y0, z1 - z0);
  const g = new THREE.BoxGeometry(grosor, largo, grosor);
  g.rotateX(Math.atan2(z1 - z0, y1 - y0));
  g.translate(x, Y + (y0 + y1) / 2, (z0 + z1) / 2);
  return g.toNonIndexed();
}

function bici(x, Y, z, ruedas) {
  const R0 = 0.27;
  for (const dz of [-0.42, 0.42]) {
    const g = new THREE.TorusGeometry(R0, 0.025, 6, 18);
    g.rotateY(Math.PI / 2);
    g.translate(x, Y + R0 + 0.01, z + dz);
    ruedas.push(g.toNonIndexed());
    const eje = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 6);
    eje.rotateZ(Math.PI / 2);
    eje.translate(x, Y + R0 + 0.01, z + dz);
    ruedas.push(eje.toNonIndexed());
  }
  const h = R0 + 0.01;
  return [
    tubo(h, z - 0.42, 0.66, z - 0.12, x, Y),
    tubo(h, z - 0.42, h + 0.02, z - 0.02, x, Y),
    tubo(h + 0.02, z - 0.02, 0.66, z - 0.12, x, Y),
    tubo(h + 0.02, z - 0.02, 0.72, z + 0.3, x, Y),
    tubo(0.66, z - 0.12, 0.72, z + 0.3, x, Y),
    tubo(h, z + 0.42, 0.78, z + 0.3, x, Y),
    pieza(0.09, 0.04, 0.2, x, Y + 0.7, z - 0.14),
    pieza(0.46, 0.03, 0.03, x, Y + 0.8, z + 0.3)
  ];
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
    this.W = W;
    this.D = D;
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
      const tipo = k === 2 ? 'bus' : k === 6 || k === 9 ? 'furgo' : k === 1 ? 'taxi' : 'coche';
      lista.push({ horiz, sentido, carril, s: -60 + k * 10 + r() * 5, v: tipo === 'bus' ? 4 : 4.5 + r() * 3.5, tipo, aparcado: false });
    }
    const huecos = [];
    for (let s = -40; s <= 40; s += 7.5) {
      if (r() < 0.6) huecos.push({ horiz: true, carril: zC - (AC / 2 - 0.65), s: s + r() * 2 });
      if (r() < 0.6) huecos.push({ horiz: false, carril: xC + (AC / 2 - 0.65), s: s + r() * 2 });
    }
    const LP = AC / 2 + 2.2;
    this.LP = LP;
    const prohibido = h => {
      if (Math.abs(h.s - (h.horiz ? xC : zC)) < LP + 3) return true;
      if (h.horiz && h.carril < zC && h.s > 2 && h.s < 10.5) return true;
      if (h.horiz && h.carril > zC && h.s > W / 2 + 4.5 && h.s < W / 2 + 11) return true;
      if (!h.horiz && h.carril > xC && h.s > D / 2 + 3 && h.s < D / 2 + 7) return true;
      if (!h.horiz && Math.abs(h.s - (zC - 44)) < AC) return true;
      if (h.horiz && Math.abs(h.s - (xC + 46)) < AC) return true;
      return false;
    };
    for (const h of huecos) {
      if (prohibido(h)) continue;
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
    const parada = zC - AC / 2 - 0.95;
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
      rutas.push({ horiz: true, c: zC, lado, min: -45, max: xC + 46 - LP - 2 });
      rutas.push({ horiz: false, c: xC, lado, min: zC - 44 + LP + 2, max: 45 });
    }
    for (let k = 0; k < 14; k++) {
      const ruta = rutas[k % rutas.length];
      const corre = k === 5 || k === 12;
      const p = crearPersonaje(GENTE[(k * 5) % GENTE.length]);
      p.scale.setScalar(1.25);
      const sentido = r() < 0.5 ? 1 : -1;
      const offBase = 2.2 + 0.3 * ruta.lado * (ruta.horiz ? 1 : -1) * sentido;
      const tramo = (ruta.max - ruta.min) / 4;
      const d = { ...ruta, offBase, off: offBase, offObj: offBase, sentido, s: ruta.min + tramo * (Math.floor(k / rutas.length) + 0.3 + r() * 0.4), v: corre ? 2.2 : 0.8 + r() * 0.35, corre, esperando: false, pausa: 0, tPausa: 5 + r() * 20 };
      d.carril = ruta.c + ruta.lado * (AC / 2 + d.off);
      p.userData.peaton = d;
      p.rotation.y = d.horiz ? (sentido > 0 ? Math.PI / 2 : -Math.PI / 2) : (sentido > 0 ? 0 : Math.PI);
      animarPersonaje(p, corre ? 'sprint' : 'walk');
      R.add(p);
      this.peatones.push(p);
      if (k % 4 === 1) {
        try {
          const perro = mascotaSuelta(k % 8 === 1 ? 'perro' : ['gato', 'perro', 'conejo'][k % 3], 'walk');
          if (!perro) throw new Error('sin modelo');
          const gp = new THREE.Group();
          gp.add(perro);
          gp.scale.setScalar(0.85);
          R.add(gp);
          d.perro = gp;
        } catch (e) {}
      }
    }
    const sentados = [[-W / 2 + 1.2, aceraNuestraZ + 0.2, Math.PI, 'mama'], [6.3, parada - 0.2, 0, 'ramon']];
    const tx = W / 2 + 1.6;
    const mesas = [];
    const sillasL = [];
    const sombrillas = [];
    for (const [mz, quien1, quien2] of [[-D / 2 + 1.2, 'lola', 'mateo'], [D / 2 - 1.4, 'sol', null], [0, 'amigos', 'mama']]) {
      mesas.push(cil(0.35, 0.05, tx, Y + 0.75, mz, 14), cil(0.04, 0.75, tx, Y + 0.37, mz, 6));
      sombrillas.push([tx, mz]);
      for (const [lado, q] of [[-1, quien1], [1, quien2]]) {
        const cz = mz + lado * 0.6;
        sillasL.push(pieza(0.4, 0.05, 0.4, tx, Y + 0.45, cz), pieza(0.4, 0.4, 0.05, tx, Y + 0.65, cz + lado * 0.2));
        for (const [ox, oz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) sillasL.push(pieza(0.03, 0.45, 0.03, tx + ox, Y + 0.22, cz + oz));
        if (q) sentados.push([tx, cz - lado * 0.05, lado > 0 ? Math.PI : 0, q]);
      }
    }
    for (const [x, z, ry, quien] of sentados) {
      const p = crearPersonaje(quien);
      p.scale.setScalar(1.25);
      p.position.set(x, Y + 0.4, z);
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
    R.add(new THREE.Mesh(unir(sillasL), mat(0x3b3f44, { roughness: 0.6, metalness: 0.3 })));
    const mMesa = new THREE.Mesh(unir(mesas), mat(0xf2efe9));
    R.add(mMesa);
    const lona = [];
    const palo = [];
    for (const [x, z] of sombrillas) {
      const c = new THREE.ConeGeometry(0.95, 0.4, 8, 1, true);
      c.translate(x, Y + 2.25, z);
      lona.push(c.toNonIndexed());
      palo.push(cil(0.03, 2.1, x, Y + 1.05, z, 6));
    }
    R.add(new THREE.Mesh(unir(lona), mat(0xd65d5d, { side: THREE.DoubleSide })));
    R.add(new THREE.Mesh(unir(palo), mat(0xf2efe9)));
    const toldo = [];
    for (let b = 0; b < 8; b++) {
      const z0 = -D / 2 + 0.3 + b * (D - 0.6) / 8;
      const g = new THREE.BoxGeometry(0.9, 0.05, (D - 0.6) / 8);
      g.rotateZ(-0.25);
      g.translate(W / 2 + 0.42, Y + 2.55, z0 + (D - 0.6) / 16);
      toldo.push([g.toNonIndexed(), b % 2]);
    }
    R.add(new THREE.Mesh(unir(toldo.filter(t => !t[1]).map(t => t[0])), mat(0x4f8a6b)));
    R.add(new THREE.Mesh(unir(toldo.filter(t => t[1]).map(t => t[0])), mat(0xf6efe6)));
    const texCafe = textoTextura('Café Pilar', '#3b2f26', '#ffe9b0', 512, 96);
    const cartelBar = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshStandardMaterial({ map: texCafe, emissiveMap: texCafe, emissive: 0xffffff, emissiveIntensity: 0.1 }));
    cartelBar.position.set(W / 2 + 0.17, Y + 3.0, 0);
    cartelBar.rotation.y = Math.PI / 2;
    R.add(cartelBar);
    this.cartelBar = cartelBar.material;
    const puerta = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.3, 0.1), mat(0x6b4a33));
    puerta.position.set(1.0, Y + 1.15, D / 2 + 0.02);
    R.add(puerta);
    for (const dx of [-0.32, 0.32]) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 1.3), mat(0x9fc3d6, { roughness: 0.2 }));
      v.position.set(1.0 + dx, Y + 1.35, D / 2 + 0.075);
      R.add(v);
    }
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({ map: textoTextura('12', '#2f4f7a', '#ffffff', 128, 96) }));
    num.position.set(1.0, Y + 2.55, D / 2 + 0.075);
    R.add(num);
    const escalon = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.5), mat(0xb9b2a6));
    escalon.position.set(1.0, Y + 0.06, D / 2 + 0.25);
    R.add(escalon);
    const texPan = textoTextura('Panadería', '#f6efe6', '#8a5a2b', 512, 96);
    const cartelPan = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.42), new THREE.MeshStandardMaterial({ map: texPan, emissiveMap: texPan, emissive: 0xffffff, emissiveIntensity: 0.1 }));
    cartelPan.position.set(-W / 2 + 1.6, Y + 3.0, D / 2 + 0.17);
    R.add(cartelPan);
    this.carteles = [cartelBar.material, cartelPan.material];
    const extra = [];
    const amarillo = [];
    const rojo = [];
    const bolardo = (x, z) => extra.push(cil(0.08, 0.7, x, Y + 0.35, z, 8));
    for (let k = 0; k < 4; k++) bolardo(-W / 2 + 0.6 + k * 1.2, D / 2 + 2.95);
    rojo.push(cil(0.12, 0.55, -W / 2 - 1.1, Y + 0.28, aceraNuestraZ - 0.2), cil(0.07, 0.1, -W / 2 - 1.1, Y + 0.6, aceraNuestraZ - 0.2));
    amarillo.push(pieza(0.45, 0.85, 0.35, aceraNuestraX - 0.4, Y + 0.43, D / 2 + 3.2), pieza(0.5, 0.1, 0.4, aceraNuestraX - 0.4, Y + 0.9, D / 2 + 3.2));
    const kioskoX = 0.6;
    const kioskoZ = D / 2 + 2.2;
    const cuerpoK = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.4), mat(0x3f7a5a));
    cuerpoK.position.set(kioskoX - 1.6, Y + 1.0, kioskoZ);
    R.add(cuerpoK);
    const kiosko = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.7), mat(0x4f8a6b));
    kiosko.position.set(kioskoX - 1.6, Y + 2.06, kioskoZ);
    R.add(kiosko);
    const revistas = [];
    for (let k = 0; k < 5; k++) revistas.push(pieza(0.02, 0.28, 0.22, kioskoX - 0.78, Y + 0.9 + (k % 2) * 0.32, kioskoZ - 0.5 + k * 0.25));
    R.add(new THREE.Mesh(unir(revistas), mat(0xe07a8a, { emissive: 0xe07a8a, emissiveIntensity: 0.1 })));
    const bicis = [];
    const ruedasB = [];
    const soporte = [];
    for (let k = 0; k < 3; k++) {
      const bx = W / 2 + 1.2 + k * 0.75;
      const bz = D / 2 + 2.0;
      bicis.push(...bici(bx, Y, bz, ruedasB));
      soporte.push(pieza(0.04, 0.55, 0.04, bx + 0.12, Y + 0.27, bz - 0.25), pieza(0.04, 0.55, 0.04, bx + 0.12, Y + 0.27, bz + 0.25), pieza(0.04, 0.04, 0.54, bx + 0.12, Y + 0.55, bz));
    }
    R.add(new THREE.Mesh(unir(ruedasB), mat(0x26282b, { roughness: 0.8 })));
    R.add(new THREE.Mesh(unir(soporte), mat(0x9aa0a6, { metalness: 0.6, roughness: 0.4 })));
    const tapas = [];
    for (const [x, z] of [[xC + 1.7, zC + 15], [xC - 10, zC - 1.7], [xC + 15, zC + 1.7], [xC - 1.7, zC - 14]]) {
      const g = new THREE.CylinderGeometry(0.35, 0.35, 0.02, 14);
      g.translate(x, Y + 0.035, z);
      tapas.push(g.toNonIndexed());
    }
    const jardinera = [];
    const flores = [];
    for (const [x, z] of [[-W / 2 - 1.6, -D / 2 - 1.6], [-W / 2 - 1.75, D / 2 + 1.4]]) {
      jardinera.push(pieza(1.2, 0.45, 0.5, x, Y + 0.22, z));
      for (let f = 0; f < 4; f++) {
        const g = new THREE.IcosahedronGeometry(0.17, 0);
        g.translate(x - 0.45 + f * 0.3, Y + 0.55, z);
        flores.push(g.toNonIndexed());
      }
    }
    R.add(new THREE.Mesh(unir(extra), mat(0x3b3f44, { roughness: 0.6, metalness: 0.3 })));
    R.add(new THREE.Mesh(unir(amarillo), mat(0xf2c230)));
    R.add(new THREE.Mesh(unir(rojo), mat(0xd04040)));
    R.add(new THREE.Mesh(unir(bicis), mat(0x2f6fb5, { metalness: 0.4, roughness: 0.4 })));
    R.add(new THREE.Mesh(unir(tapas), mat(0x55585c, { metalness: 0.5, roughness: 0.6 })));
    R.add(new THREE.Mesh(unir(jardinera), mat(0xb9b2a6)));
    R.add(new THREE.Mesh(unir(flores), mat(0xe07a8a)));

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
    const moviles = this.vehiculos.filter(d => !d.aparcado);
    this.vehiculos.forEach((d, i) => {
      if (!d.aparcado) {
        let vel = d.v;
        const L = d.escala.x;
        const cruce = d.horiz ? this.xC : this.zC;
        const rojo = d.horiz ? this.fase !== 0 : this.fase !== 2;
        const hasta = (cruce - d.s) * d.sentido - L;
        if (rojo && hasta > (this.LP || 5.6) + 1.3 && hasta < (this.LP || 5.6) + 3.8) vel = 0;
        if (d.tipo === 'bus') {
          d.parada = d.parada || 0;
          const objetivo = 6.6;
          if (d.parada <= 0 && Math.abs(d.s - objetivo) < 0.25 && !d.hecho) d.parada = 4.5;
          if (d.parada > 0) {
            d.parada -= dt;
            vel = 0;
            if (d.parada <= 0) d.hecho = true;
          }
          if (Math.abs(d.s - objetivo) > 8) d.hecho = false;
        }
        for (const o of moviles) {
          if (o === d || o.horiz !== d.horiz || o.sentido !== d.sentido || Math.abs(o.carril - d.carril) > 0.5) continue;
          const delante = (o.s - d.s) * d.sentido;
          if (delante <= 0) continue;
          const hueco = delante - L - o.escala.x;
          if (hueco < 0.8) vel = 0;
          else if (hueco < 3) vel = Math.min(vel, (o.vel ?? o.v) * 0.9);
        }
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

  especial() {
    const tipos = ['policia', 'policia', 'ambulancia', 'persecucion', 'persecucion', 'perroGato', 'globo'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const horiz = Math.random() < 0.5;
    const sentido = Math.random() < 0.5 ? 1 : -1;
    const R = this.R;
    const e = { tipo, t: 0, objs: [] };
    if (tipo === 'policia' || tipo === 'ambulancia') {
      const g = vehiculoEspecial(tipo);
      R.add(g);
      e.objs.push(g);
      e.coche = { g, horiz, sentido, s: -75 * sentido, carril: (horiz ? this.zC : this.xC) + sentido * 1.7 * (horiz ? 1 : -1), v: tipo === 'policia' ? 17 : 13 };
      g.rotation.y = horiz ? (sentido > 0 ? 0 : Math.PI) : (sentido > 0 ? -Math.PI / 2 : Math.PI / 2);
    } else if (tipo === 'persecucion' || tipo === 'perroGato') {
      const lado = Math.random() < 0.5 ? 1 : -1;
      const a = tipo === 'persecucion' ? crearPersonaje(['amigos', 'mateo'][Math.floor(Math.random() * 2)]) : envolver(mascotaSuelta('gato', 'run'));
      const b = tipo === 'persecucion' ? crearPersonaje(['mama', 'lola', 'ramon'][Math.floor(Math.random() * 3)]) : envolver(mascotaSuelta('perro', 'run'));
      if (!a || !b) return;
      if (tipo === 'persecucion') {
        a.scale.setScalar(1.25);
        b.scale.setScalar(1.25);
        animarPersonaje(a, 'sprint');
        animarPersonaje(b, 'sprint');
      }
      R.add(a, b);
      e.objs.push(a, b);
      const c = horiz ? this.zC : this.xC;
      const datos = (s0, v) => ({ horiz, c, lado, offBase: 2.2, off: 2.2, offObj: 2.2, sentido, s: s0, v, corre: true, temporal: true, min: -1e9, max: 1e9, pausa: 0, tPausa: 1e9, esperando: false });
      a.userData.peaton = datos(-50 * sentido, tipo === 'persecucion' ? 3.5 : 3.2);
      b.userData.peaton = datos(-50 * sentido - 2.4 * sentido, tipo === 'persecucion' ? 3.35 : 3.05);
      this.peatones.push(a, b);
      e.corredores = [a, b];
    } else if (tipo === 'globo') {
      const g = new THREE.Group();
      const bola = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), mat([0xe05656, 0xf2d06b, 0x5a8fd6][Math.floor(Math.random() * 3)], { roughness: 0.3 }));
      bola.scale.y = 1.2;
      const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.8, 4), mat(0xffffff));
      hilo.position.y = -0.62;
      g.add(bola, hilo);
      g.position.set(this.W / 2 + 1.6, this.Y + 1.6, this.D / 2 - 1.4);
      R.add(g);
      e.objs.push(g);
      e.globo = g;
    }
    this.especialActual = e;
  }

  actualizarEspecial(dt) {
    const e = this.especialActual;
    if (!e) {
      this.tEspecial = (this.tEspecial ?? 15) - dt;
      if (this.tEspecial <= 0) {
        this.tEspecial = 30 + Math.random() * 45;
        this.especial();
      }
      return;
    }
    e.t += dt;
    for (const o of e.objs) if (!o.layers.isEnabled(2)) o.traverse(x => x.layers.set(2));
    let fin = false;
    if (e.coche) {
      const c = e.coche;
      c.s += c.v * dt * c.sentido;
      if (c.horiz) c.g.position.set(c.s, this.Y, c.carril);
      else c.g.position.set(c.carril, this.Y, c.s);
      const azul = Math.floor(e.t * 6) % 2 === 0;
      c.g.userData.luces[0].emissiveIntensity = azul ? 2.2 : 0.1;
      c.g.userData.luces[1].emissiveIntensity = azul ? 0.1 : 2.2;
      fin = Math.abs(c.s) > 76;
    } else if (e.corredores) {
      for (const o of e.corredores) {
        const mx = o.children[0] && o.children[0].userData.mixer;
        if (mx) mx.update(dt);
      }
      fin = Math.abs(e.corredores[1].userData.peaton.s) > 52;
      if (fin) this.peatones = this.peatones.filter(p => !e.corredores.includes(p));
    } else if (e.globo) {
      e.globo.position.y += dt * 1.1;
      e.globo.position.x += Math.sin(e.t * 0.8) * dt * 0.4 + dt * 0.3;
      e.globo.rotation.z = Math.sin(e.t * 1.3) * 0.15;
      fin = e.t > 22;
    }
    if (fin) {
      for (const o of e.objs) o.removeFromParent();
      this.especialActual = null;
    }
  }

  ponerNoche(k) {
    this.noche = k;
    for (const m of this.carteles || []) m.emissiveIntensity = 0.1 + k * 0.9;
  }

  actualizar(dt) {
    if (!this.vehiculos.length) return;
    this.t += dt;
    this.actualizarEspecial(dt);
    const ciclo = this.t % 16;
    this.fase = ciclo < 7 ? 0 : ciclo < 8 ? 1 : ciclo < 15 ? 2 : 1;
    const ambar = this.fase === 1;
    const verdeX = this.fase === 0;
    this.luces[0].emissiveIntensity = !ambar ? 1.4 : 0.1;
    this.luces[1].emissiveIntensity = ambar ? 1.6 : 0.1;
    this.luces[2].emissiveIntensity = verdeX || this.fase === 2 ? 1.4 : 0.1;
    this.colocarVehiculos(dt);
    const andantes = this.peatones.filter(p => p.userData.peaton);
    for (const p of this.peatones) if (!p.layers.isEnabled(2)) p.traverse(o => o.layers.set(2));
    for (const p of andantes) {
      const d = p.userData.peaton;
      const cruce = d.horiz ? this.xC : this.zC;
      const falta = (cruce - d.s) * d.sentido;
      const puede = d.horiz ? this.fase === 0 : this.fase === 2;
      const espera = !d.temporal && !puede && falta > this.AC / 2 + 0.1 && falta < this.AC / 2 + 0.9;
      const enCruce = Math.abs(cruce - d.s) < this.AC / 2 + 1.2;
      if (!d.corre && d.pausa <= 0 && !enCruce) {
        d.tPausa -= dt;
        if (d.tPausa <= 0) {
          d.tPausa = 12 + Math.random() * 25;
          if (Math.random() < 0.5) d.pausa = 2 + Math.random() * 3;
        }
      }
      if (d.pausa > 0) d.pausa -= dt;
      const parado = espera || d.pausa > 0;
      let vel = parado ? 0 : d.v;
      let quiere = d.offBase;
      for (const q of andantes) {
        if (q === p) continue;
        const o = q.userData.peaton;
        if (o.horiz !== d.horiz || o.lado !== d.lado || o.c !== d.c) continue;
        const ds = (o.s - d.s) * d.sentido;
        const dl = o.off - d.off;
        if (Math.abs(dl) > 0.75 || ds < -0.6 || ds > 2.2) continue;
        if (o.sentido === d.sentido) {
          if (ds > 0 && Math.abs(dl) < 0.5) {
            const masLento = (o.pausa > 0 || o.esperando) ? 0 : o.v;
            if (vel > masLento + 0.05 && !espera) {
              const hacia = d.offBase > 2.2 ? -1 : 1;
              const libre = andantes.every(z => {
                const zd = z.userData.peaton;
                if (z === p || z === q || zd.horiz !== d.horiz || zd.lado !== d.lado) return true;
                return Math.abs(zd.off - (o.off + hacia * 0.55)) > 0.4 || Math.abs(zd.s - d.s) > 2.5;
              });
              if (libre) quiere = THREE.MathUtils.clamp(o.off + hacia * 0.55, 1.5, 2.6);
              else vel = Math.min(vel, ds < 0.8 ? masLento : vel);
            }
            if (ds < 0.55 && Math.abs(dl) < 0.38) vel = Math.min(vel, (o.pausa > 0 || o.esperando) ? 0 : o.v * 0.9);
          }
        } else if (ds > 0 && ds < 1.6 && Math.abs(dl) < 0.45) {
          quiere = THREE.MathUtils.clamp(d.off + (d.offBase > o.offBase ? 0.3 : -0.3), 1.5, 2.6);
        }
      }
      d.offObj = quiere;
      const dOff = d.offObj - d.off;
      d.off += Math.sign(dOff) * Math.min(Math.abs(dOff), dt * (d.corre ? 1.6 : 0.9));
      const anim = parado ? (d.pausa > 0 && !espera && d.pausaAnim ? d.pausaAnim : 'idle') : d.corre ? 'sprint' : 'walk';
      if (d.anim !== anim) {
        if (parado && d.pausa > 0 && !espera && !d.pausaAnim) d.pausaAnim = Math.random() < 0.4 ? 'interact-right' : 'idle';
        if (!parado) d.pausaAnim = null;
        d.anim = parado ? (d.pausaAnim || 'idle') : anim;
        animarPersonaje(p, d.anim);
      }
      d.esperando = espera;
      d.s += vel * dt * d.sentido;
      if (d.s > d.max) d.s = d.min;
      if (d.s < d.min) d.s = d.max;
      d.carril = d.c + d.lado * (this.AC / 2 + d.off);
      if (d.horiz) p.position.set(d.s, this.Y, d.carril);
      else p.position.set(d.carril, this.Y, d.s);
      const giroLat = vel > 0.05 ? Math.atan2(dOff * d.lado * (d.horiz ? 1 : 1), 2.5) : 0;
      const base = d.horiz ? (d.sentido > 0 ? Math.PI / 2 : -Math.PI / 2) : (d.sentido > 0 ? 0 : Math.PI);
      p.rotation.y = base + (d.horiz ? -giroLat * d.sentido : giroLat * d.sentido) * 0.6;
      if (d.perro) {
        if (!d.perro.layers.isEnabled(2)) d.perro.traverse(o => o.layers.set(2));
        const atras = -0.7 * d.sentido;
        const ladoP = 0.32 * (d.offBase > 2.2 ? -1 : 1) * d.lado;
        const mx = d.perro.children[0] && d.perro.children[0].userData.mixer;
        if (mx && !parado) mx.update(dt);
        if (d.horiz) d.perro.position.set(d.s + atras, this.Y, d.carril + ladoP);
        else d.perro.position.set(d.carril + ladoP, this.Y, d.s + atras);
        d.perro.rotation.y = base;
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
