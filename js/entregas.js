import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { crearExclamacion } from './telefono.js';
import { infoItem } from './catalogo.js';

const PI = Math.PI;
const ALTURA_VENTANA = 1.45;
const SEPARACION_PARED = 0.75;
const CUELGA = 0.62;

export function crearDron() {
  const g = new THREE.Group();
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf7f4ef, roughness: 0.35 });
  const gris = new THREE.MeshStandardMaterial({ color: 0x4a4f57, roughness: 0.5, metalness: 0.3 });
  const rosa = new THREE.MeshStandardMaterial({ color: 0xe58f9e, roughness: 0.4 });
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), blanco);
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, PI * 2, 0, PI / 2), rosa);
  cupula.position.y = 0.06;
  const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1f2a33, roughness: 0.1, metalness: 0.4 }));
  ojo.position.set(0, -0.02, 0.21);
  g.add(cuerpo, cupula, ojo);
  const helices = [];
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.42), gris);
    brazo.position.set(x * 0.15, 0.02, z * 0.15);
    brazo.rotation.y = Math.atan2(x, z);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 10), gris);
    motor.position.set(x * 0.3, 0.05, z * 0.3);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 24), blanco);
    aro.rotation.x = PI / 2;
    aro.position.set(x * 0.3, 0.09, z * 0.3);
    const helice = new THREE.Group();
    helice.position.set(x * 0.3, 0.1, z * 0.3);
    const pala = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.045), new THREE.MeshStandardMaterial({ color: 0x2c3036, transparent: true, opacity: 0.75 }));
    helice.add(pala);
    const disco = new THREE.Mesh(new THREE.CircleGeometry(0.15, 18), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }));
    disco.rotation.x = -PI / 2;
    helice.add(disco);
    g.add(brazo, motor, aro, helice);
    helices.push(helice);
  }
  for (const [x, color] of [[0.12, 0x6cff9a], [-0.12, 0xff6060]]) {
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 }));
    led.position.set(x, -0.02, 0.2);
    g.add(led);
  }
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, CUELGA - 0.3, 6), gris);
  cable.position.y = -0.06 - (CUELGA - 0.3) / 2;
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12), gris);
  gancho.position.y = -CUELGA + 0.27;
  g.add(cable, gancho);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData.helices = helices;
  g.userData.cable = cable;
  g.userData.gancho = gancho;
  return g;
}

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
    this.drones = [];
    this.t = 0;
    this.puntoEspera = null;
    this.capa = 0;
  }

  desplazarZ() {}

  pedir(items, segundos) {
    const p = { id: `p${Date.now()}${Math.floor(Math.random() * 1000)}`, items, llega: Date.now() + segundos * 1000, estado: 'camino' };
    this.pedidos.push(p);
    return p;
  }

  cargar(lista) {
    for (const d of lista || []) {
      const p = { id: d.id, items: d.items, llega: d.llega, estado: d.estado === 'puerta' || d.estado === 'reparto' ? 'puerta' : 'camino' };
      this.pedidos.push(p);
      if (p.estado === 'puerta') this.crearDronCon(p, false);
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

  espera(k) {
    if (this.puntoEspera) return this.puntoEspera(k);
    return new THREE.Vector3((k - 0.5) * 0.9, ALTURA_VENTANA, 3 + SEPARACION_PARED);
  }

  crearDronCon(p, volando) {
    const dron = crearDron();
    const tam = Math.max(1, ...(p.items || []).map(it => { const i = infoItem(it.id); return i && i.ancho ? i.ancho * (i.fondo || 1) : 1; }));
    const grande = tam >= 6 ? 1.6 : tam >= 3 ? 1.25 : 1;
    dron.scale.setScalar(1.1 * (grande > 1 ? 1.15 : 1));
    const { grupo } = construirPiezas(PIEZAS_PAQUETE);
    grupo.scale.setScalar(0.62 * grande);
    grupo.position.y = -CUELGA;
    grupo.userData.pedido = p;
    const excl = crearExclamacion(0.32);
    excl.position.y = 0.55;
    grupo.add(excl);
    grupo.userData.excl = excl;
    dron.add(grupo);
    p.paquete = grupo;
    const k = this.drones.length;
    const destino = this.espera(k);
    const d = { p, dron, fase: volando ? 'llegar' : 'esperar', t: 0, fasePulso: Math.random() * 6, vel: new THREE.Vector3() };
    if (volando) {
      const fuera = destino.clone().sub(new THREE.Vector3(0, destino.y, 0)).setY(0);
      if (fuera.lengthSq() < 0.01) fuera.set(0, 0, 1);
      fuera.normalize();
      d.desde = destino.clone().addScaledVector(fuera, 14).add(new THREE.Vector3(fuera.z * 6, 7, -fuera.x * 6));
      dron.position.copy(d.desde);
    } else dron.position.copy(destino);
    this.raiz.add(dron);
    dron.traverse(o => o.layers.set(this.capa));
    this.drones.push(d);
    return d;
  }

  ponerCapa(capa) {
    if (capa === this.capa) return;
    this.capa = capa;
    for (const d of this.drones) d.dron.traverse(o => o.layers.set(capa));
  }

  intersectar(raycaster) {
    const paquetes = this.drones.filter(d => d.fase === 'esperar' && d.p.paquete).map(d => d.p.paquete);
    if (!paquetes.length) return null;
    const mascara = raycaster.layers.mask;
    raycaster.layers.enable(this.capa);
    const hits = raycaster.intersectObjects(paquetes, true);
    raycaster.layers.mask = mascara;
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
      this.raiz.attach(paquete);
      paquete.traverse(o => o.layers.set(0));
      paquete.userData.base = paquete.scale.x;
      paquete.userData.abriendo = 0;
      paquete.userData.pedido = null;
      if (paquete.userData.excl) paquete.userData.excl.visible = false;
    }
    const d = this.drones.find(x => x.p === p);
    if (d) {
      d.fase = 'irse';
      d.t = 0;
      d.desde = d.dron.position.clone();
    }
    return p.items;
  }

  empezarReparto(p) {
    p.estado = 'reparto';
    this.crearDronCon(p, true);
    this.eventos.alClaxon();
  }

  actualizar(dt) {
    this.t += dt;
    const ahora = Date.now();
    if (!this.drones.some(d => d.fase === 'llegar')) {
      const listo = this.pedidos.find(p => p.estado === 'camino' && p.llega <= ahora);
      if (listo) this.empezarReparto(listo);
    }

    for (const obj of [...this.escena.children]) {
      const ud = obj.userData;
      if (ud.abriendo !== undefined) {
        ud.abriendo += dt;
        const k = ud.abriendo / 0.45;
        obj.scale.setScalar((ud.base || 1) * (k < 0.4 ? 1 + k * 0.6 : Math.max(0.01, 1.24 * (1 - (k - 0.4) / 0.6))));
        obj.rotation.y += dt * 10;
        if (k >= 1) {
          this.escena.remove(obj);
          liberar(obj);
        }
      }
    }

    let k = 0;
    for (const d of [...this.drones]) {
      const dron = d.dron;
      d.t += dt;
      dron.userData.helices.forEach((h, i) => { h.rotation.y += dt * (i % 2 ? -38 : 38); });
      const antes = dron.position.clone();
      if (d.fase === 'llegar') {
        const destino = this.espera(k);
        const u = Math.min(1, d.t / 3.2);
        const e = 1 - Math.pow(1 - u, 3);
        dron.position.lerpVectors(d.desde, destino, e);
        dron.position.y += Math.sin(u * PI) * 0.8;
        if (u >= 1) {
          d.fase = 'esperar';
          d.t = 0;
          d.p.estado = 'puerta';
          this.eventos.alLlegar(d.p);
        }
        k++;
      } else if (d.fase === 'esperar') {
        const destino = this.espera(k);
        destino.y += Math.sin(this.t * 2.2 + d.fasePulso) * 0.06;
        dron.position.lerp(destino, Math.min(1, dt * 2.5));
        if (d.p.paquete) {
          d.p.paquete.rotation.z = Math.sin(this.t * 1.7 + d.fasePulso) * 0.08;
          d.p.paquete.rotation.y += dt * 0.6;
        }
        k++;
      } else {
        const u = Math.min(1, d.t / 2.4);
        dron.userData.cable.visible = false;
        dron.userData.gancho.visible = false;
        const fuera = d.desde.clone().setY(0);
        if (fuera.lengthSq() < 0.01) fuera.set(0, 0, 1);
        fuera.normalize();
        dron.position.copy(d.desde).addScaledVector(fuera, u * u * 12);
        dron.position.y += u * u * 9;
        if (u >= 1) {
          this.raiz.remove(dron);
          liberar(dron);
          this.drones = this.drones.filter(x => x !== d);
        }
      }
      d.vel.subVectors(dron.position, antes).divideScalar(Math.max(dt, 1e-3));
      dron.rotation.z += (THREE.MathUtils.clamp(-d.vel.x * 0.12, -0.4, 0.4) - dron.rotation.z) * Math.min(1, dt * 5);
      dron.rotation.x += (THREE.MathUtils.clamp(d.vel.z * 0.12, -0.4, 0.4) - dron.rotation.x) * Math.min(1, dt * 5);
    }
  }
}
