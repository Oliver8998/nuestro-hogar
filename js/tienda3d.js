import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { crearPersonaje } from './personajes.js';
import { crearModeloMascota } from './mascotas.js';
import { idioma } from './i18n.js';

function caja(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cartel(texto) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fffaf4';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 40);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#e58f9e';
  ctx.stroke();
  ctx.fillStyle = '#3b2f26';
  ctx.font = '900 58px Nunito, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 256, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
}

const TOP = 1.08;
const RISER = 0.3;
const HUECOS = [
  [-1.38, TOP + RISER, 0.12], [-0.46, TOP + RISER, 0.12], [0.46, TOP + RISER, 0.12], [1.38, TOP + RISER, 0.12],
  [-1.38, TOP, 0.62], [-0.46, TOP, 0.62], [0.46, TOP, 0.62], [1.38, TOP, 0.62]
];
const COLORES_PLATO = [0xf7c9d2, 0xcfe3f2, 0xd5efd9, 0xfbe7b5];

function encajar(grupo, ancho, alto) {
  const b = new THREE.Box3().setFromObject(grupo);
  const tam = b.getSize(new THREE.Vector3());
  const centro = b.getCenter(new THREE.Vector3());
  const s = Math.min(ancho / Math.max(tam.x, tam.z, 0.01), alto / Math.max(tam.y, 0.01), 2.2);
  grupo.scale.setScalar(s);
  grupo.position.set(-centro.x * s, -b.min.y * s, -centro.z * s);
}

export class EscenaTienda {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.activa = false;
    this.t = 0;
    this.tReaccion = 0;
    this.reaccion = null;
    this.huecos = [];
    this.firma = '';
    this.seleccion = -1;
    this.suelto = null;
    this.alTocarHueco = null;
    this.raycaster = new THREE.Raycaster();
  }

  iniciar() {
    if (this.renderer) return;
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.9;
    this.renderer = r;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0xf7e4d4);
    this.escena = escena;
    this.camara = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

    const pared = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ color: 0xf6dccb, roughness: 1 }));
    pared.position.set(0, 4, -1.3);
    pared.receiveShadow = true;
    escena.add(pared);
    for (let i = -8; i <= 8; i++) {
      const raya = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 8), new THREE.MeshStandardMaterial({ color: 0xf9e7da, roughness: 1 }));
      raya.position.set(i, 4, -1.29);
      escena.add(raya);
    }
    escena.add(caja(16, 0.5, 0.06, 0xe8c4ae, 0, 0.25, -1.26));
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshStandardMaterial({ color: 0xe2c4a6, roughness: 1 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);

    const colores = [0xe58f9e, 0x7fa3c6, 0x6cc08a, 0xf2d06b, 0xb39ddb, 0xf2a03c];
    for (const [y, x0] of [[2.35, -2.3], [3.05, -2.3]]) {
      escena.add(caja(4.6, 0.06, 0.32, 0xc99b6e, x0 + 2.3, y, -1.12));
      for (let k = 0; k < 10; k++) {
        const h = 0.18 + (k % 3) * 0.06;
        const color = colores[(k + Math.round(y * 10)) % colores.length];
        const forma = k % 2 === 0
          ? caja(0.22, h, 0.2, color, x0 + 0.25 + k * 0.46, y + 0.03 + h / 2, -1.1)
          : new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 14), new THREE.MeshStandardMaterial({ color }));
        if (k % 2 === 1) forma.position.set(x0 + 0.25 + k * 0.46, y + 0.03 + h / 2, -1.1);
        escena.add(forma);
      }
    }
    const letrero = cartel('Tienda de Pilar');
    letrero.position.set(1.15, 3.5, -0.95);
    letrero.scale.setScalar(0.8);
    escena.add(letrero);

    const lola = crearPersonaje('lola');
    lola.scale.setScalar(lola.userData.kenney ? 1.35 : 1.9);
    this.lolaY = lola.userData.kenney ? 1.18 : 0.98;
    lola.position.set(0, this.lolaY, -0.75);
    lola.traverse(o => { if (o.isMesh) o.castShadow = true; });
    escena.add(lola);
    this.lola = lola;

    const mostrador = new THREE.Group();
    mostrador.add(caja(3.9, 1.0, 1.15, 0xf4b3be, 0, 0.5, 0.35));
    mostrador.add(caja(4.05, 0.08, 1.3, 0xb98a5e, 0, 1.04, 0.35));
    mostrador.add(caja(3.92, 0.1, 0.02, 0xffffff, 0, 0.74, 0.93));
    mostrador.add(caja(3.92, 0.1, 0.02, 0xffffff, 0, 0.3, 0.93));
    mostrador.add(caja(3.9, RISER, 0.5, 0xe9d3bd, 0, TOP + RISER / 2, 0.12));
    mostrador.add(caja(3.96, 0.04, 0.56, 0xb98a5e, 0, TOP + RISER + 0.02, 0.12));
    escena.add(mostrador);

    this.productos = new THREE.Group();
    escena.add(this.productos);

    const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.07, 40), new THREE.MeshStandardMaterial({ color: 0xeee7dd, roughness: 0.6 }));
    plato.position.set(0, TOP + 0.04, 0.55);
    plato.receiveShadow = true;
    this.plato = plato;
    escena.add(plato);
    const soporte = new THREE.Group();
    soporte.position.set(0, TOP + 0.08, 0.55);
    escena.add(soporte);
    this.soporte = soporte;

    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.9 }));
    aro.rotation.x = -Math.PI / 2;
    aro.visible = false;
    escena.add(aro);
    this.aro = aro;

    escena.add(new THREE.HemisphereLight(0xfff6ec, 0xd9b9a0, 1.5));
    const sol = new THREE.DirectionalLight(0xfff3e6, 1.7);
    sol.position.set(2.5, 7, 6);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 24 });
    sol.shadow.bias = -0.0005;
    sol.shadow.normalBias = 0.02;
    escena.add(sol);
    const foco = new THREE.SpotLight(0xfff6ec, 0, 7, 0.35, 0.6);
    foco.position.set(0, 4.5, 3.2);
    escena.add(foco);
    escena.add(foco.target);
    this.foco = foco;

    this.canvas.addEventListener('pointerdown', e => { this.toque = { x: e.clientX, y: e.clientY }; });
    this.canvas.addEventListener('pointerup', e => {
      if (!this.toque || Math.hypot(e.clientX - this.toque.x, e.clientY - this.toque.y) > 10) return;
      const i = this.huecoEn(e.clientX, e.clientY);
      if (i >= 0 && this.alTocarHueco) this.alTocarHueco(i);
    });

    this.reloj = new THREE.Clock();
  }

  huecoEn(x, y) {
    if (!this.productos.visible) return -1;
    const r = this.canvas.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camara);
    const hits = this.raycaster.intersectObjects(this.huecos.map(h => h.zona), false);
    return hits.length ? hits[0].object.userData.hueco : -1;
  }

  redimensionar() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspecto = w / h;
    this.camara.aspect = aspecto;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2));
    const ancho = 4.25;
    const distancia = Math.max(ancho / 2 / (tan * aspecto), 3.4 / tan);
    const centroY = 1.7;
    const fraccion = aspecto < 1 ? 0.27 : 0.34;
    const bajada = (0.5 - fraccion) * 2 * tan * distancia;
    this.camara.position.set(0, centroY + distancia * 0.32, distancia);
    this.camara.lookAt(0, centroY - bajada, 0);
    this.camara.updateProjectionMatrix();
  }

  ponerMostrador(entradas) {
    this.iniciar();
    const firma = entradas.map(e => e.mascota ? `m:${e.mascota}:${e.vendida ? 1 : 0}` : e.info.id).join('|');
    if (firma === this.firma) return;
    this.firma = firma;
    for (const h of this.huecos) {
      this.productos.remove(h.grupo);
      liberar(h.grupo);
    }
    this.huecos = [];
    entradas.slice(0, HUECOS.length).forEach((e, i) => {
      const [x, y, z] = HUECOS[i];
      const grupo = new THREE.Group();
      grupo.position.set(x, y, z);
      const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.05, 28), new THREE.MeshStandardMaterial({ color: COLORES_PLATO[i % 4], roughness: 0.6 }));
      plato.position.y = 0.025;
      plato.receiveShadow = true;
      grupo.add(plato);
      const cuerpo = new THREE.Group();
      cuerpo.position.y = 0.05;
      grupo.add(cuerpo);
      const reg = { grupo, cuerpo, info: e.info, mallas: null, partes: null, fase: i * 0.7 };
      if (e.mascota) {
        const cojin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xe58f9e, roughness: 0.9 }));
        cojin.position.y = 0.04;
        cuerpo.add(cojin);
        if (!e.vendida) {
          const partes = crearModeloMascota(e.mascota);
          const envoltorio = new THREE.Group();
          envoltorio.add(partes.raiz);
          envoltorio.position.y = 0.08;
          partes.raiz.scale.multiplyScalar(0.8);
          envoltorio.traverse(o => { if (o.isMesh) o.castShadow = true; });
          cuerpo.add(envoltorio);
          reg.partes = partes;
          reg.mascotaGrupo = envoltorio;
        } else {
          const nota = cartel(idioma() === 'en' ? 'Adopted!' : '¡Adoptado!');
          nota.scale.setScalar(0.32);
          nota.position.set(0, 0.25, 0.05);
          cuerpo.add(nota);
        }
      } else {
        const { grupo: g, mallas } = construirPiezas(e.info.piezas, { id: e.info.id });
        const env = new THREE.Group();
        env.add(g);
        encajar(g, 0.56, 0.6);
        env.traverse(o => { if (o.isMesh) o.castShadow = true; });
        cuerpo.add(env);
        reg.mallas = mallas;
        reg.env = env;
        if (e.oferta) {
          const etq = cartel('-30%');
          etq.scale.setScalar(0.22);
          etq.position.set(0.24, 0.62, 0.2);
          grupo.add(etq);
        }
      }
      const zona = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.85, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
      zona.position.y = 0.4;
      zona.userData.hueco = i;
      grupo.add(zona);
      reg.zona = zona;
      this.productos.add(grupo);
      this.huecos.push(reg);
    });
  }

  modoMostrador(si) {
    this.iniciar();
    this.productos.visible = si;
    this.plato.visible = !si;
    this.soporte.visible = !si;
    if (si && this.suelto) {
      this.soporte.remove(this.suelto.env);
      liberar(this.suelto.env);
      this.suelto = null;
    }
    if (!si) this.aro.visible = false;
  }

  seleccionarHueco(i, color, encendido) {
    this.seleccion = i;
    const h = this.huecos[i];
    if (!h) return;
    this.actual = h;
    h.entrada = 0;
    this.ponerColor(color);
    this.ponerEncendido(encendido);
  }

  mostrar(info, color, encendido) {
    this.iniciar();
    this.modoMostrador(false);
    if (this.suelto) {
      this.soporte.remove(this.suelto.env);
      liberar(this.suelto.env);
    }
    const { grupo, mallas } = construirPiezas(info.piezas, { id: info.id });
    const env = new THREE.Group();
    env.add(grupo);
    encajar(grupo, 0.8, 0.85);
    env.traverse(o => { if (o.isMesh) o.castShadow = true; });
    this.soporte.add(env);
    this.suelto = { env, mallas, info, entrada: 0 };
    this.actual = this.suelto;
    env.scale.setScalar(0.01);
    this.ponerColor(color);
    this.ponerEncendido(encendido);
  }

  ponerColor(color) {
    const a = this.actual;
    if (!a || !a.mallas || !a.info || !a.info.colores || color === null || color === undefined) return;
    const tonos = a.info.colores.paleta[color % a.info.colores.paleta.length];
    a.info.colores.grupos.forEach((g, gi) => g.forEach(i => a.mallas[i] && a.mallas[i].material.color.setHex(tonos[gi])));
    if (a.encendido) this.ponerEncendido(true);
  }

  ponerEncendido(encendido) {
    const a = this.actual;
    if (!a || !a.mallas || !a.info || !a.info.encendible) return;
    a.encendido = encendido;
    for (const i of a.info.encendible.piezas) {
      const mat = a.mallas[i] && a.mallas[i].material;
      if (!mat) continue;
      if (encendido) {
        mat.emissive.setHex(a.info.encendible.brillo ?? mat.color.getHex());
        mat.emissiveIntensity = 0.55;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  }

  reaccionar(tipo) {
    this.reaccion = tipo;
    this.tReaccion = 0;
  }

  abrir() {
    this.iniciar();
    this.activa = true;
    this.redimensionar();
    this.reloj.getDelta();
    const bucle = () => {
      if (!this.activa) return;
      this.paso(Math.min(this.reloj.getDelta(), 0.1));
      requestAnimationFrame(bucle);
    };
    requestAnimationFrame(bucle);
  }

  cerrar() {
    this.activa = false;
  }

  paso(dt) {
    this.t += dt;
    const t = this.t;
    if (this.productos.visible) {
      this.huecos.forEach((h, i) => {
        const sel = i === this.seleccion;
        const c = h.cuerpo;
        const objetivo = sel ? 0.14 : 0;
        c.position.y += (0.05 + objetivo - c.position.y) * Math.min(1, dt * 8);
        if (h.partes) {
          const p = h.partes;
          const salto = Math.max(0, Math.sin(t * 3 + h.fase)) * (sel ? 0.05 : 0.015);
          h.mascotaGrupo.position.y = 0.08 + salto;
          h.mascotaGrupo.rotation.y = Math.sin(t * 0.8 + h.fase) * 0.5 + (sel ? t * 1.2 : 0);
          if (p.mixer) p.mixer.update(dt);
          if (p.cabeza) p.cabeza.rotation.z = Math.sin(t * 1.7 + h.fase) * 0.15;
          if (p.cola) p.cola.rotation.y = Math.sin(t * 9) * 0.4;
          p.alas.forEach((a, k) => { a.rotation.z = (k ? -1 : 1) * Math.abs(Math.sin(t * 7)) * 0.4; });
        } else if (h.env) {
          if (sel) h.env.rotation.y += dt * 0.9;
          else h.env.rotation.y += (Math.sin(t * 0.5 + h.fase) * 0.3 - h.env.rotation.y) * Math.min(1, dt * 2);
        }
        if (sel && h.entrada !== undefined && h.entrada < 1) {
          h.entrada = Math.min(1, h.entrada + dt * 3.5);
          const s = 1 + Math.sin(h.entrada * Math.PI) * 0.22;
          c.scale.setScalar(s);
        } else if (!sel && c.scale.x !== 1) {
          c.scale.setScalar(1);
        }
      });
      const h = this.huecos[this.seleccion];
      if (h) {
        this.aro.visible = true;
        this.aro.position.set(h.grupo.position.x, h.grupo.position.y + 0.06, h.grupo.position.z);
        this.aro.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
        this.foco.intensity = 7;
        this.foco.target.position.copy(h.grupo.position);
      }
    } else {
      this.foco.intensity = 8;
      this.foco.target.position.copy(this.soporte.position);
      this.soporte.rotation.y += dt * 0.4;
      const s = this.suelto;
      if (s && s.entrada < 1) {
        s.entrada = Math.min(1, s.entrada + dt * 3.2);
        const e = s.entrada;
        s.env.scale.setScalar(Math.max(0.01, e * (1 + Math.sin(e * Math.PI) * 0.18)));
      }
    }

    const cabeza = this.lola.userData.cabeza;
    this.lola.position.y = this.lolaY + Math.sin(t * 2.2) * 0.012;
    if (cabeza) {
      cabeza.rotation.z = Math.sin(t * 1.3) * 0.06;
      cabeza.rotation.y = Math.sin(t * 0.7) * 0.12;
    }
    if (this.reaccion) {
      this.tReaccion += dt;
      const k = this.tReaccion;
      if (this.reaccion === 'feliz') {
        this.lola.position.y = this.lolaY + Math.abs(Math.sin(k * 12)) * 0.12;
      } else if (cabeza) {
        cabeza.rotation.y = Math.sin(k * 22) * 0.3 * Math.max(0, 1 - k);
      }
      if (k > 0.8) this.reaccion = null;
    }
    this.renderer.render(this.escena, this.camara);
  }
}
