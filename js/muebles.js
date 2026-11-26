import * as THREE from 'three';
import { CATALOGO } from './catalogo.js';
import { construirPiezas, liberar } from './modelos.js';

export const CELDA = 0.5;
const LIMITE = 6;
const ALTURA_MAXIMA = 2.45;

function crearMueble(def) {
  const { grupo, mallas, todas } = construirPiezas(def.piezas, { sombras: !def.suelo, id: def.id });
  const esc = def.escala || 1;
  if (esc !== 1) for (const h of grupo.children) {
    h.position.multiplyScalar(esc);
    h.scale.multiplyScalar(esc);
  }

  const marcador = new THREE.Mesh(
    new THREE.PlaneGeometry(def.ancho * CELDA - 0.04, def.fondo * CELDA - 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.55, depthWrite: false })
  );
  marcador.rotation.x = -Math.PI / 2;
  marcador.position.y = 0.015;
  marcador.visible = false;
  marcador.layers.set(1);
  grupo.add(marcador);

  let luz = null;
  if (def.encendible && def.encendible.luz) {
    luz = new THREE.PointLight(def.encendible.colorLuz ?? 0xffd9a0, 0, 4, 2);
    luz.position.y = def.encendible.luz * esc;
    grupo.add(luz);
  }

  const alto = def.soporte !== undefined ? def.soporte * esc : new THREE.Box3().setFromObject(grupo).max.y;
  grupo.userData = {
    def, mallas, todas, marcador, luz, alto,
    uid: Math.random().toString(36).slice(2, 10),
    x0: 0, z0: 0, rot: 0, base: 0, tmp: null,
    color: 0,
    encendido: def.encendible ? def.encendible.inicial : false,
    resalte: null,
    rebote: 0
  };
  return grupo;
}

export function tonosDe(def, color) {
  if (typeof color === 'string') {
    const base = def.colores.paleta[0].slice();
    base[0] = parseInt(color.slice(1), 16);
    return base;
  }
  return def.colores.paleta[(color ?? 0) % def.colores.paleta.length];
}

export class GestorMuebles {
  constructor(escena) {
    this.escena = escena;
    this.muebles = [];
    this.lx = LIMITE;
    this.lz = LIMITE;
    this.ex = 0;
    this.ez = 0;
    this.rejilla = null;
    this.crearRejilla();
  }

  crearRejilla() {
    const visible = this.rejilla ? this.rejilla.visible : false;
    if (this.rejilla) {
      this.escena.remove(this.rejilla);
      this.rejilla.geometry.dispose();
      this.rejilla.material.dispose();
    }
    const ax = this.lx * CELDA;
    const bx = (this.lx + this.ex) * CELDA;
    const az = this.lz * CELDA;
    const v = [];
    const pz = this.ez * CELDA;
    for (let i = -this.lx; i <= this.lx + this.ex; i++) {
      const lim = i > this.lx ? pz : az;
      v.push(i * CELDA, 0, -lim, i * CELDA, 0, lim);
    }
    for (let j = -this.lz; j <= this.lz; j++) v.push(-ax, 0, j * CELDA, this.ex && Math.abs(j) <= this.ez ? bx : ax, 0, j * CELDA);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    const rejilla = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
    rejilla.position.y = 0.012;
    rejilla.visible = visible;
    rejilla.layers.set(1);
    this.escena.add(rejilla);
    this.rejilla = rejilla;
  }

  ajustarTam(ancho, fondo, extra = 0, fondoExtra = 0) {
    const lx = Math.round(ancho / CELDA / 2);
    const lz = Math.round(fondo / CELDA / 2);
    const ex = Math.round(extra / CELDA);
    const ez = Math.round(fondoExtra / CELDA / 2);
    if (lx === this.lx && lz === this.lz && ex === this.ex && ez === this.ez) return;
    this.lx = lx;
    this.lz = lz;
    this.ex = ex;
    this.ez = ez;
    this.crearRejilla();
  }

  def(id) {
    return CATALOGO.find(d => d.id === id);
  }

  medidas(def, rot) {
    return rot % 2 === 0 ? [def.ancho, def.fondo] : [def.fondo, def.ancho];
  }

  solapan(a, b) {
    const [aw, ad] = this.medidas(a.def, a.rot);
    const [bw, bd] = this.medidas(b.def, b.rot);
    return a.x0 < b.x0 + bw && a.x0 + aw > b.x0 && a.z0 < b.z0 + bd && a.z0 + ad > b.z0;
  }

  tieneEncima(mueble) {
    const d = mueble.userData;
    if (d.def.suelo) return false;
    return this.muebles.some(o => o !== mueble && !o.userData.def.suelo && o.userData.base > d.base + 0.01 && this.solapan(d, o.userData));
  }

  apoyo(mueble, x0, z0, rot) {
    const datos = mueble.userData;
    const def = datos.def;
    const [w, d] = this.medidas(def, rot);
    if (x0 < -this.lx || z0 < -this.lz || x0 + w > this.lx + this.ex || z0 + d > this.lz) return { valido: false, base: 0 };
    if (this.ex && x0 < this.lx && x0 + w > this.lx) return { valido: false, base: 0 };
    if (this.ex && x0 + w > this.lx && (z0 < -this.ez || z0 + d > this.ez)) return { valido: false, base: 0 };
    if (def.suelo) return { valido: true, base: 0 };

    let altura = null;
    let valido = true;
    let maximo = 0;
    for (let i = x0; i < x0 + w; i++) {
      for (let j = z0; j < z0 + d; j++) {
        let tope = 0;
        let superficie = 0;
        for (const o of this.muebles) {
          if (o === mueble) continue;
          const od = o.userData;
          if (od.def.suelo) continue;
          const [ow, of] = this.medidas(od.def, od.rot);
          if (i < od.x0 || i >= od.x0 + ow || j < od.z0 || j >= od.z0 + of) continue;
          const arriba = od.base + od.alto;
          if (arriba > tope) {
            tope = arriba;
            superficie = od.def.soporte ? od.base + (od.alto ?? od.def.soporte) : Infinity;
          }
        }
        maximo = Math.max(maximo, tope);
        if (superficie === Infinity) valido = false;
        else if (altura === null) altura = superficie;
        else if (Math.abs(superficie - altura) > 0.01) valido = false;
      }
    }
    if (!valido) return { valido: false, base: maximo };
    if (altura + datos.alto > ALTURA_MAXIMA) return { valido: false, base: altura };
    return { valido: true, base: altura };
  }

  colocar(mueble, x0, z0, rot, base) {
    const datos = mueble.userData;
    const [w, d] = this.medidas(datos.def, rot);
    datos.x0 = x0;
    datos.z0 = z0;
    datos.rot = rot;
    datos.base = base;
    mueble.position.set((x0 + w / 2) * CELDA, base, (z0 + d / 2) * CELDA);
    mueble.rotation.y = rot * Math.PI / 2;
  }

  anadir(id, x0, z0, rot = 0, extra = {}) {
    const def = this.def(id);
    if (!def) return null;
    const mueble = crearMueble(def);
    if (def.colores && extra.color !== undefined && extra.color !== null) mueble.userData.color = extra.color % def.colores.paleta.length;
    if (def.encendible && extra.encendido !== undefined) mueble.userData.encendido = extra.encendido;
    if (extra.datos) mueble.userData.datos = extra.datos;
    if (extra.uid) mueble.userData.uid = extra.uid;
    const base = extra.base ?? this.apoyo(mueble, x0, z0, rot).base;
    this.escena.add(mueble);
    this.muebles.push(mueble);
    this.colocar(mueble, x0, z0, rot, base);
    this.aplicarApariencia(mueble);
    return mueble;
  }

  crearPreview(id, color) {
    const def = this.def(id);
    if (!def) return null;
    const mueble = crearMueble(def);
    if (def.colores && color !== null && color !== undefined) mueble.userData.color = color % def.colores.paleta.length;
    mueble.visible = false;
    this.escena.add(mueble);
    this.aplicarApariencia(mueble);
    return mueble;
  }

  confirmar(mueble) {
    const datos = mueble.userData;
    this.muebles.push(mueble);
    this.colocar(mueble, datos.tmp.x0, datos.tmp.z0, datos.rot, datos.tmp.base);
    datos.tmp = null;
    datos.rebote = 1;
    this.resaltar(mueble, 'sel');
  }

  quitar(mueble) {
    this.escena.remove(mueble);
    this.muebles = this.muebles.filter(m => m !== mueble);
    liberar(mueble);
  }

  aplicarApariencia(mueble) {
    const { def, mallas, luz, color, encendido } = mueble.userData;
    if (def.colores) {
      const tonos = tonosDe(def, color);
      const k = 1 - 0.3 * ((mueble.userData.datos && mueble.userData.datos.desgaste) || 0);
      def.colores.grupos.forEach((grupo, gi) => grupo.forEach(i => mallas[i].material.color.setHex(tonos[gi]).multiplyScalar(k)));
    }
    if (def.encendible) {
      for (const i of def.encendible.piezas) {
        const base = mallas[i].userData.base;
        if (encendido) {
          base.color.setHex(def.encendible.brillo ?? mallas[i].material.color.getHex());
          base.intensidad = 0.5;
        } else {
          base.color.setHex(0x000000);
          base.intensidad = 0;
        }
      }
      if (luz) luz.intensity = encendido ? (def.encendible.intensidad ?? 3) : 0;
    }
    this.resaltar(mueble, mueble.userData.resalte);
  }

  siguienteColor(mueble) {
    const datos = mueble.userData;
    if (!datos.def.colores) return;
    datos.color = typeof datos.color === 'string' ? 0 : (datos.color + 1) % datos.def.colores.paleta.length;
    this.aplicarApariencia(mueble);
  }

  alternarEncendido(mueble) {
    const datos = mueble.userData;
    if (!datos.def.encendible) return;
    datos.encendido = !datos.encendido;
    this.aplicarApariencia(mueble);
  }

  buscarHueco(id) {
    const def = this.def(id);
    const prueba = { userData: { def, alto: 0 } };
    const candidatos = [];
    for (let rot = 0; rot < 2; rot++) {
      const [w, d] = this.medidas(def, rot);
      for (let x = -this.lx; x + w <= this.lx; x++) {
        for (let z = -this.lz; z + d <= this.lz; z++) {
          candidatos.push({ x, z, rot, dist: Math.hypot(x + w / 2, z + d / 2) + rot * 0.01 });
        }
      }
    }
    candidatos.sort((a, b) => a.dist - b.dist);
    for (const c of candidatos) {
      const a = this.apoyo(prueba, c.x, c.z, c.rot);
      if (a.valido && a.base === 0) return c;
    }
    return null;
  }

  intersectar(raycaster, excluir = null) {
    const lista = excluir ? this.muebles.filter(m => m !== excluir) : this.muebles;
    const hits = raycaster.intersectObjects(lista, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.def) o = o.parent;
    return o ? { mueble: o, punto: hits[0].point, normal: hits[0].face ? hits[0].face.normal : null, objeto: hits[0].object } : null;
  }

  arrastrar(mueble, x, z) {
    const datos = mueble.userData;
    const [w, d] = this.medidas(datos.def, datos.rot);
    const x0 = THREE.MathUtils.clamp(Math.round(x / CELDA - w / 2), -this.lx, this.lx + this.ex - w);
    const z0 = THREE.MathUtils.clamp(Math.round(z / CELDA - d / 2), -this.lz, this.lz - d);
    const a = this.apoyo(mueble, x0, z0, datos.rot);
    const destino = new THREE.Vector3((x0 + w / 2) * CELDA, a.base + 0.08, (z0 + d / 2) * CELDA);
    if (!mueble.visible || !datos.tmp) mueble.position.copy(destino);
    else mueble.position.lerp(destino, 0.45);
    datos.tmp = { x0, z0, valido: a.valido, base: a.base };
    this.resaltar(mueble, a.valido ? 'sel' : 'mal');
  }

  soltar(mueble) {
    const datos = mueble.userData;
    const movido = !!(datos.tmp && datos.tmp.valido);
    if (movido) this.colocar(mueble, datos.tmp.x0, datos.tmp.z0, datos.rot, datos.tmp.base);
    else this.colocar(mueble, datos.x0, datos.z0, datos.rot, datos.base);
    datos.tmp = null;
    if (movido) datos.rebote = 1;
    this.resaltar(mueble, 'sel');
    return movido;
  }

  cancelar(mueble) {
    mueble.userData.tmp = null;
    this.soltar(mueble);
  }

  rotar(mueble) {
    const datos = mueble.userData;
    if (this.tieneEncima(mueble)) return 'encima';
    const nuevaRot = (datos.rot + 1) % 4;
    const [w, d] = this.medidas(datos.def, datos.rot);
    const [nw, nd] = this.medidas(datos.def, nuevaRot);
    const x0 = THREE.MathUtils.clamp(Math.round(datos.x0 + w / 2 - nw / 2), -this.lx, this.lx + this.ex - nw);
    const z0 = THREE.MathUtils.clamp(Math.round(datos.z0 + d / 2 - nd / 2), -this.lz, this.lz - nd);
    const a = this.apoyo(mueble, x0, z0, nuevaRot);
    if (!a.valido) return 'sitio';
    this.colocar(mueble, x0, z0, nuevaRot, a.base);
    datos.rebote = 0.6;
    return 'ok';
  }

  resaltar(mueble, modo) {
    const { marcador, todas } = mueble.userData;
    mueble.userData.resalte = modo;
    marcador.visible = modo === 'sel' || modo === 'mal';
    marcador.material.color.setHex(modo === 'mal' ? 0xff5050 : 0xffd27a);
    for (const o of todas) {
      if (modo === 'mal') {
        o.material.emissive.setHex(0xff3030);
        o.material.emissiveIntensity = 0.5;
      } else {
        o.material.emissive.copy(o.userData.base.color);
        o.material.emissiveIntensity = o.userData.base.intensidad;
      }
    }
  }

  mostrarRejilla(visible) {
    this.rejilla.visible = visible;
  }

  actualizar(dt) {
    for (const m of this.muebles) {
      const d = m.userData;
      const e = d.escalaVis || 1;
      if (d.rebote > 0) {
        d.rebote = Math.max(0, d.rebote - dt * 3.5);
        const s = Math.sin(d.rebote * Math.PI) * 0.12 * d.rebote;
        m.scale.set(e * (1 + s * 0.5), e * (1 - s), e * (1 + s * 0.5));
      } else if (m.scale.y !== e) {
        m.scale.setScalar(e);
      }
      const tirado = d.datos && d.datos.tirado;
      const objetivo = tirado ? 1.4 : 0;
      if ((tirado || !d.balanceo) && Math.abs(m.rotation.z - objetivo) > 0.001) {
        m.rotation.z += (objetivo - m.rotation.z) * Math.min(1, dt * 8);
        m.position.y = d.base + Math.sin(m.rotation.z) * 0.1;
      }
    }
  }

  serializar() {
    return this.muebles.map(m => {
      const d = m.userData;
      return { uid: d.uid, id: d.def.id, x0: d.x0, z0: d.z0, rot: d.rot, base: +d.base.toFixed(3), color: d.color, encendido: d.encendido, ...(d.datos ? { datos: d.datos } : {}) };
    });
  }
}
