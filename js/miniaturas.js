import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { tonosDe } from './muebles.js';
import { infoItem } from './catalogo.js';
import { crearModeloMascota } from './mascotas.js';
import { crearPersonaje } from './personajes.js';

const DIR_ISO = new THREE.Vector3(1, 0.85, 1).normalize();
const DIR_FRENTE = new THREE.Vector3(0.25, 0.22, 1).normalize();

export class Miniaturas {
  constructor(tam = 160) {
    this.tam = tam;
    this.cache = new Map();
    this.renderer = null;
  }

  iniciar() {
    if (this.renderer) return;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.escena = new THREE.Scene();
    this.escena.add(new THREE.HemisphereLight(0xfff6ec, 0x9a8470, 2.0));
    const luz = new THREE.DirectionalLight(0xfff3e6, 1.8);
    luz.position.set(3, 6, 4);
    this.escena.add(luz);
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  }

  renderizar(clave, crear, { frente = false, tam = this.tam, margen = 1.08 } = {}) {
    if (this.cache.has(clave)) return this.cache.get(clave);
    this.iniciar();
    this.renderer.setSize(tam, tam, false);
    const obj = crear();
    this.escena.add(obj);
    obj.updateMatrixWorld(true);

    const caja = new THREE.Box3().setFromObject(obj);
    const centro = caja.getCenter(new THREE.Vector3());
    const dir = frente ? DIR_FRENTE : DIR_ISO;
    this.camara.position.copy(centro).addScaledVector(dir, 10);
    this.camara.lookAt(centro);
    this.camara.updateMatrixWorld(true);

    const inversa = this.camara.matrixWorldInverse;
    let r = 0.01;
    for (const x of [caja.min.x, caja.max.x]) {
      for (const y of [caja.min.y, caja.max.y]) {
        for (const z of [caja.min.z, caja.max.z]) {
          const v = new THREE.Vector3(x, y, z).applyMatrix4(inversa);
          r = Math.max(r, Math.abs(v.x), Math.abs(v.y));
        }
      }
    }
    r *= margen;
    Object.assign(this.camara, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: 30 });
    this.camara.updateProjectionMatrix();

    this.renderer.render(this.escena, this.camara);
    const url = this.renderer.domElement.toDataURL('image/png');
    this.escena.remove(obj);
    liberar(obj);
    this.cache.set(clave, url);
    return url;
  }

  piezas(clave, piezas) {
    return this.renderizar(clave, () => construirPiezas(piezas, { sombras: false }).grupo);
  }

  item(id, color = null) {
    const info = infoItem(id);
    if (!info) return '';
    if (info.mascota) return this.mascota(info.mascota);
    const clave = `item:${id}:${color ?? ''}`;
    return this.renderizar(clave, () => {
      const { grupo, mallas } = construirPiezas(info.piezas, { sombras: false, id: info.id });
      if (info.colores && color !== null && color !== undefined) {
        const tonos = tonosDe(info, color);
        info.colores.grupos.forEach((g, gi) => g.forEach(i => mallas[i].material.color.setHex(tonos[gi])));
      }
      return grupo;
    });
  }

  mascota(especie) {
    return this.renderizar(`mascota:${especie}`, () => {
      const partes = crearModeloMascota(especie);
      partes.raiz.rotation.y = 0.5;
      return partes.raiz;
    }, { frente: true });
  }

  personaje(id) {
    return this.renderizar(`personaje:${id}`, () => crearPersonaje(id), { frente: true, tam: 240, margen: 1.04 });
  }
}
