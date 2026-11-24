import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { crearExclamacion } from './telefono.js';

const PI = Math.PI;
const CARRIL_Z = 4.6;
const PARADA_X = 1.75;
const Y_ACERA = -0.12;
const HUECOS = [[1.0, 3.6], [0.45, 3.65], [1.55, 3.65]];
const ALTURA_FLOTAR = 0.55;

const PIEZAS_FURGONETA = [
  [1.5, 1.0, 0.95, -0.25, 0.68, 0, 0xfffaf4],
  [0.62, 0.78, 0.93, 0.8, 0.57, 0, 0xf4b3be],
  [0.04, 0.36, 0.8, 1.1, 0.78, 0, 0xa9d4e8, { rz: -0.35 }],
  [0.34, 0.3, 0.945, 0.78, 0.76, 0, 0xa9d4e8],
  [1.53, 0.12, 0.97, -0.255, 0.52, 0, 0xe58f9e],
  [0.2, 0.2, 0.02, -0.25, 0.85, 0.48, 0xe58f9e, 'cil', { rx: PI / 2 }],
  [0.2, 0.2, 0.02, -0.25, 0.85, -0.48, 0xe58f9e, 'cil', { rx: PI / 2 }],
  [0.1, 0.14, 0.92, 1.13, 0.26, 0, 0x9a8470],
  [0.1, 0.14, 0.92, -1.02, 0.26, 0, 0x9a8470],
  [0.06, 0.08, 0.06, 1.12, 0.45, 0.36, 0xfff1a8, 'esfera', { brillo: true }],
  [0.06, 0.08, 0.06, 1.12, 0.45, -0.36, 0xfff1a8, 'esfera', { brillo: true }],
  [0.38, 0.14, 0.38, 0.62, 0.19, 0.44, 0x3b2f26, 'cil', { rx: PI / 2 }],
  [0.38, 0.14, 0.38, 0.62, 0.19, -0.44, 0x3b2f26, 'cil', { rx: PI / 2 }],
  [0.38, 0.14, 0.38, -0.6, 0.19, 0.44, 0x3b2f26, 'cil', { rx: PI / 2 }],
  [0.38, 0.14, 0.38, -0.6, 0.19, -0.44, 0x3b2f26, 'cil', { rx: PI / 2 }],
  [0.16, 0.15, 0.16, 0.62, 0.19, 0.45, 0xe8e0d6, 'cil', { rx: PI / 2 }],
  [0.16, 0.15, 0.16, 0.62, 0.19, -0.45, 0xe8e0d6, 'cil', { rx: PI / 2 }],
  [0.16, 0.15, 0.16, -0.6, 0.19, 0.45, 0xe8e0d6, 'cil', { rx: PI / 2 }],
  [0.16, 0.15, 0.16, -0.6, 0.19, -0.45, 0xe8e0d6, 'cil', { rx: PI / 2 }]
];

export const PIEZAS_PAQUETE = [
  [0.42, 0.32, 0.42, 0, 0.16, 0, 0xc99a63],
  [0.43, 0.33, 0.09, 0, 0.16, 0, 0xe58f9e],
  [0.09, 0.33, 0.43, 0, 0.16, 0, 0xe58f9e],
  [0.1, 0.08, 0.05, -0.05, 0.35, 0, 0xe58f9e, 'esfera', { rz: 0.5 }],
  [0.1, 0.08, 0.05, 0.05, 0.35, 0, 0xe58f9e, 'esfera', { rz: -0.5 }],
  [0.16, 0.1, 0.005, 0.1, 0.18, 0.212, 0xf0eae1]
];

function suavizar(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export class Entregas {
  constructor(escena, eventos) {
    this.raiz = new THREE.Group();
    escena.add(this.raiz);
    this.escena = this.raiz;
    this.eventos = eventos;
    this.pedidos = [];
    this.anim = null;
    this.t = 0;
  }
  desplazarZ(dz) {
    this.raiz.position.z = dz;
  }


  pedir(items, segundos) {
    const p = { id: `p${Date.now()}${Math.floor(Math.random() * 1000)}`, items, llega: Date.now() + segundos * 1000, estado: 'camino' };
    this.pedidos.push(p);
    return p;
  }

  cargar(lista) {
    for (const d of lista || []) {
      const p = { id: d.id, items: d.items, llega: d.llega, estado: d.estado === 'puerta' || d.estado === 'reparto' ? 'puerta' : 'camino' };
      this.pedidos.push(p);
      if (p.estado === 'puerta') this.crearPaquete(p, false);
    }
  }

  serializar() {
    return this.pedidos.map(p => ({ id: p.id, items: p.items, llega: p.llega, estado: p.estado }));
  }

  enCamino() {
    return this.pedidos.filter(p => p.estado === 'camino' || p.estado === 'reparto').sort((a, b) => a.llega - b.llega);
  }

  enPuerta() {
    return this.pedidos.filter(p => p.estado === 'puerta');
  }

  cantidadPedida(id) {
    let n = 0;
    for (const p of this.pedidos) for (const it of p.items) if (it.id === id) n += it.cantidad;
    return n;
  }

  segundosProximo() {
    const c = this.enCamino();
    if (!c.length) return null;
    return Math.max(0, Math.ceil((c[0].llega - Date.now()) / 1000));
  }

  posicionHueco(p) {
    const k = this.enPuerta().filter(x => x !== p && x.paquete).length;
    const [x, z] = HUECOS[k % HUECOS.length];
    return new THREE.Vector3(x, ALTURA_FLOTAR + Math.floor(k / HUECOS.length) * 0.45, z);
  }

  crearPaquete(p, animado) {
    const { grupo } = construirPiezas(PIEZAS_PAQUETE);
    grupo.userData.pedido = p;
    grupo.rotation.y = (Math.random() - 0.5) * 0.6;
    const pos = this.posicionHueco(p);
    grupo.position.copy(pos);
    grupo.userData.reposo = pos.clone();
    grupo.userData.fase = Math.random() * 6;
    const excl = crearExclamacion(0.36);
    excl.position.y = 0.6;
    grupo.add(excl);
    grupo.userData.excl = excl;
    this.escena.add(grupo);
    p.paquete = grupo;
    if (animado) grupo.scale.setScalar(0.01);
    return grupo;
  }

  intersectar(raycaster) {
    const paquetes = this.enPuerta().map(p => p.paquete).filter(Boolean);
    if (!paquetes.length) return null;
    const hits = raycaster.intersectObjects(paquetes, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.pedido) o = o.parent;
    return o ? o.userData.pedido : null;
  }

  abrir(p) {
    p.estado = 'abierto';
    this.pedidos = this.pedidos.filter(x => x !== p);
    const paquete = p.paquete;
    if (paquete) {
      paquete.userData.abriendo = 0;
      paquete.userData.pedido = null;
      if (paquete.userData.excl) paquete.userData.excl.visible = false;
    }
    this.recolocar();
    return p.items;
  }

  recolocar() {
    this.enPuerta().forEach((p, k) => {
      if (!p.paquete) return;
      const [x, z] = HUECOS[k % HUECOS.length];
      p.paquete.userData.reposo = new THREE.Vector3(x, ALTURA_FLOTAR + Math.floor(k / HUECOS.length) * 0.45, z);
    });
  }

  empezarReparto(p) {
    p.estado = 'reparto';
    const { grupo } = construirPiezas(PIEZAS_FURGONETA);
    grupo.rotation.y = PI;
    grupo.position.set(10, Y_ACERA, CARRIL_Z);
    this.escena.add(grupo);
    this.anim = { p, van: grupo, fase: 'llegar', t: 0 };
    this.eventos.alClaxon();
  }

  actualizar(dt) {
    this.t += dt;
    if (!this.anim) {
      const ahora = Date.now();
      const listo = this.pedidos.find(p => p.estado === 'camino' && p.llega <= ahora);
      if (listo) this.empezarReparto(listo);
    } else {
      this.animarFurgoneta(dt);
    }

    for (const obj of [...this.escena.children]) {
      const d = obj.userData;
      if (d.abriendo !== undefined) {
        d.abriendo += dt;
        const k = d.abriendo / 0.45;
        obj.scale.setScalar(k < 0.4 ? 1 + k * 0.6 : Math.max(0.01, 1.24 * (1 - (k - 0.4) / 0.6)));
        obj.rotation.y += dt * 10;
        if (k >= 1) {
          this.escena.remove(obj);
          liberar(obj);
        }
      }
    }

    for (const p of this.enPuerta()) {
      const g = p.paquete;
      if (!g || g.userData.volando) continue;
      const r = g.userData.reposo;
      g.position.x += (r.x - g.position.x) * Math.min(1, dt * 6);
      g.position.z += (r.z - g.position.z) * Math.min(1, dt * 6);
      g.position.y = r.y + Math.sin(this.t * 2 + g.userData.fase) * 0.07;
      g.rotation.y += dt * 1.3;
      if (g.scale.x < 1) g.scale.setScalar(Math.min(1, g.scale.x + dt * 4));
    }
  }

  animarFurgoneta(dt) {
    const a = this.anim;
    a.t += dt;
    const van = a.van;
    const ruedas = (v) => {
      van.children.forEach((m, i) => { if (i >= 11) m.rotation.y += v * dt * 6; });
    };
    if (a.fase === 'llegar') {
      const k = Math.min(1, a.t / 2.2);
      const e = 1 - Math.pow(1 - k, 3);
      van.position.x = 10 + (PARADA_X - 10) * e;
      van.position.y = Y_ACERA + Math.abs(Math.sin(a.t * 18)) * 0.015 * (1 - k);
      ruedas(1 - k);
      if (k >= 1) {
        a.fase = 'dejar';
        a.t = 0;
        const paquete = this.crearPaquete(a.p, false);
        paquete.userData.volando = true;
        a.desde = new THREE.Vector3(PARADA_X + 1.0, 0.5, CARRIL_Z - 0.2);
        a.hasta = paquete.userData.reposo.clone();
        paquete.position.copy(a.desde);
        a.paquete = paquete;
      }
    } else if (a.fase === 'dejar') {
      const k = Math.min(1, a.t / 0.9);
      const pos = a.desde.clone().lerp(a.hasta, suavizar(k));
      pos.y += Math.sin(k * PI) * 0.9;
      a.paquete.position.copy(pos);
      a.paquete.rotation.x = k * PI * 2;
      if (k >= 1) {
        a.paquete.rotation.x = 0;
        a.paquete.userData.volando = false;
        a.p.estado = 'puerta';
        this.eventos.alLlegar(a.p);
        a.fase = 'esperar';
        a.t = 0;
      }
    } else if (a.fase === 'esperar') {
      if (a.t > 0.5) {
        a.fase = 'irse';
        a.t = 0;
      }
    } else {
      const k = Math.min(1, a.t / 2.2);
      const e = k * k * k;
      van.position.x = PARADA_X + (-11 - PARADA_X) * e;
      ruedas(k);
      if (k >= 1) {
        this.escena.remove(van);
        liberar(van);
        this.anim = null;
      }
    }
  }
}
