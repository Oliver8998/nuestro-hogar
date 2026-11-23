import * as THREE from 'three';
import { construirPiezas, liberar } from './modelos.js';
import { crearPersonaje } from './personajes.js';

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
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  return m;
}

export class EscenaTienda {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.activa = false;
    this.objeto = null;
    this.t = 0;
    this.tReaccion = 0;
    this.reaccion = null;
    this.entrada = 1;
  }

  iniciar() {
    if (this.renderer) return;
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0xf7e4d4);
    this.escena = escena;
    this.camara = new THREE.PerspectiveCamera(45, 1, 0.1, 80);

    const pared = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), new THREE.MeshStandardMaterial({ color: 0xf6dccb, roughness: 1 }));
    pared.position.set(0, 3.5, -1.3);
    pared.receiveShadow = true;
    escena.add(pared);
    for (let i = -6; i <= 6; i++) {
      const raya = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 7), new THREE.MeshStandardMaterial({ color: 0xf9e7da, roughness: 1 }));
      raya.position.set(i, 3.5, -1.29);
      escena.add(raya);
    }
    escena.add(caja(14, 0.5, 0.06, 0xe8c4ae, 0, 0.25, -1.26));

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: 0xe2c4a6, roughness: 1 }));
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    escena.add(suelo);

    const colores = [0xe58f9e, 0x7fa3c6, 0x6cc08a, 0xf2d06b, 0xb39ddb, 0xf2a03c];
    for (const [y, desde] of [[2.05, -2.6], [2.75, -2.4]]) {
      escena.add(caja(4.4, 0.06, 0.32, 0xc99b6e, desde + 2.2, y, -1.12));
      for (let k = 0; k < 9; k++) {
        const h = 0.18 + (k % 3) * 0.06;
        const forma = k % 2 === 0
          ? caja(0.22, h, 0.2, colores[(k + y * 10) % colores.length], desde + 0.3 + k * 0.48, y + 0.03 + h / 2, -1.1)
          : new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h, 14), new THREE.MeshStandardMaterial({ color: colores[(k + 2) % colores.length] }));
        if (k % 2 === 1) forma.position.set(desde + 0.3 + k * 0.48, y + 0.03 + h / 2, -1.1);
        escena.add(forma);
      }
    }
    const letrero = cartel('Tienda de Pilar');
    letrero.position.set(0.9, 3.32, -0.95);
    escena.add(letrero);

    const lola = crearPersonaje('lola');
    lola.scale.setScalar(1.75);
    lola.position.set(0.75, 0.42, -0.45);
    lola.rotation.y = -0.25;
    lola.traverse(o => { if (o.isMesh) o.castShadow = true; });
    escena.add(lola);
    this.lola = lola;

    const mostrador = new THREE.Group();
    mostrador.add(caja(3.2, 1.0, 0.85, 0xf4b3be, 0, 0.5, 0.35));
    mostrador.add(caja(3.35, 0.08, 1.0, 0xb98a5e, 0, 1.04, 0.35));
    mostrador.add(caja(3.22, 0.1, 0.02, 0xffffff, 0, 0.74, 0.78));
    mostrador.add(caja(3.22, 0.1, 0.02, 0xffffff, 0, 0.3, 0.78));
    mostrador.add(caja(0.42, 0.26, 0.32, 0x7fa3c6, 1.4, 1.21, 0.2));
    mostrador.add(caja(0.34, 0.06, 0.24, 0x3b2f26, 1.4, 1.37, 0.17));
    const tarro = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xe8f4f8, transparent: true, opacity: 0.6 }));
    tarro.position.set(-1.2, 1.19, 0.5);
    mostrador.add(tarro);
    escena.add(mostrador);

    const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.76, 0.07, 40), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    plato.position.set(-0.2, 1.115, 0.5);
    plato.receiveShadow = true;
    escena.add(plato);
    const soporte = new THREE.Group();
    soporte.position.set(-0.2, 1.15, 0.5);
    escena.add(soporte);
    this.soporte = soporte;

    escena.add(new THREE.HemisphereLight(0xffffff, 0xd9b9a0, 1.7));
    const sol = new THREE.DirectionalLight(0xfff3e6, 2.2);
    sol.position.set(2.5, 6, 5);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 20 });
    sol.shadow.bias = -0.0005;
    escena.add(sol);
    const foco = new THREE.SpotLight(0xffffff, 18, 6, 0.45, 0.6);
    foco.position.set(-0.4, 4.2, 3.2);
    foco.target = soporte;
    escena.add(foco);

    this.reloj = new THREE.Clock();
  }

  redimensionar() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    const aspecto = w / h;
    this.camara.aspect = aspecto;
    const vertical = aspecto < 1;
    const ancho = vertical ? 3.4 : 5.2;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2));
    const distancia = Math.max(ancho / 2 / (tan * aspecto), 1.6 / tan);
    const alto = 2 * distancia * tan;
    const x = vertical ? 0.3 - 0.15 * ancho : 0.3 - 0.1 * ancho;
    const y = 1.6 - (vertical ? 0.1 : 0.02) * alto;
    this.camara.position.set(x, y + 1.4, distancia);
    this.camara.lookAt(x, y, 0);
    this.camara.updateProjectionMatrix();
  }

  mostrar(info, color, encendido) {
    this.iniciar();
    if (this.objeto) {
      this.soporte.remove(this.objeto);
      liberar(this.objeto);
    }
    const { grupo, mallas } = construirPiezas(info.piezas);
    this.mallas = mallas;
    this.info = info;
    const envoltorio = new THREE.Group();
    envoltorio.add(grupo);
    this.objeto = envoltorio;
    this.ponerColor(color);
    this.ponerEncendido(encendido);

    const caja = new THREE.Box3().setFromObject(grupo);
    const tam = caja.getSize(new THREE.Vector3());
    const centro = caja.getCenter(new THREE.Vector3());
    const s = Math.min(1.3 / Math.max(tam.x, tam.z, 0.01), 1.35 / Math.max(tam.y, 0.01), 3);
    grupo.scale.setScalar(s);
    grupo.position.set(-centro.x * s, -caja.min.y * s, -centro.z * s);
    this.soporte.add(envoltorio);
    this.entrada = 0;
    envoltorio.scale.setScalar(0.01);
  }

  ponerColor(color) {
    const info = this.info;
    if (!info || !info.colores || color === null || color === undefined) return;
    const tonos = info.colores.paleta[color % info.colores.paleta.length];
    info.colores.grupos.forEach((g, gi) => g.forEach(i => this.mallas[i].material.color.setHex(tonos[gi])));
    if (this.encendido) this.ponerEncendido(true);
  }

  ponerEncendido(encendido) {
    this.encendido = encendido;
    const info = this.info;
    if (!info || !info.encendible) return;
    for (const i of info.encendible.piezas) {
      const mat = this.mallas[i].material;
      if (encendido) {
        mat.emissive.setHex(info.encendible.brillo ?? mat.color.getHex());
        mat.emissiveIntensity = 0.9;
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
    this.soporte.rotation.y += dt * 0.9;
    if (this.objeto && this.entrada < 1) {
      this.entrada = Math.min(1, this.entrada + dt * 3.2);
      const e = this.entrada;
      const rebote = 1 + Math.sin(e * Math.PI) * 0.18;
      this.objeto.scale.setScalar(Math.max(0.01, e * rebote));
    }

    const cabeza = this.lola.userData.cabeza;
    this.lola.position.y = 0.42 + Math.sin(this.t * 2.2) * 0.012;
    cabeza.rotation.z = Math.sin(this.t * 1.3) * 0.06;
    cabeza.rotation.y = Math.sin(this.t * 0.7) * 0.12 - 0.15;
    if (this.reaccion) {
      this.tReaccion += dt;
      const k = this.tReaccion;
      if (this.reaccion === 'feliz') {
        this.lola.position.y = 0.42 + Math.abs(Math.sin(k * 12)) * 0.12;
        this.soporte.rotation.y += dt * 8 * Math.max(0, 1 - k);
      } else {
        cabeza.rotation.y = Math.sin(k * 22) * 0.3 * Math.max(0, 1 - k);
      }
      if (k > 0.8) this.reaccion = null;
    }
    this.renderer.render(this.escena, this.camara);
  }
}
