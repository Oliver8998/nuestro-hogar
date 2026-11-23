import * as THREE from 'three';

export class Controles {
  constructor(canvas, camaraIso, gestor, eventos) {
    this.canvas = canvas;
    this.cam = camaraIso;
    this.gestor = gestor;
    this.eventos = eventos;
    this.punteros = new Map();
    this.modo = 'nada';
    this.raycaster = new THREE.Raycaster();
    this.suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.seleccionado = null;
    this.offset = new THREE.Vector2();
    this.gesto = null;

    canvas.addEventListener('pointerdown', e => this.abajo(e));
    canvas.addEventListener('pointermove', e => this.mover(e));
    canvas.addEventListener('pointerup', e => this.arriba(e));
    canvas.addEventListener('pointercancel', e => this.arriba(e));
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.cam.zoom(e.deltaY < 0 ? 1.1 : 0.9);
    }, { passive: false });
  }

  rayo(x, y) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.cam.camara);
    return this.raycaster;
  }

  puntoSuelo(x, y) {
    const p = new THREE.Vector3();
    return this.rayo(x, y).ray.intersectPlane(this.suelo, p) ? p : null;
  }

  seleccionar(mueble) {
    if (this.seleccionado && this.seleccionado !== mueble) this.gestor.resaltar(this.seleccionado, null);
    this.seleccionado = mueble;
    if (mueble) this.gestor.resaltar(mueble, 'sel');
    this.eventos.alSeleccionar(mueble);
  }

  medirGesto() {
    const [a, b] = [...this.punteros.values()];
    return { dist: Math.hypot(b.x - a.x, b.y - a.y), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  abajo(e) {
    this.canvas.setPointerCapture(e.pointerId);
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, xIni: e.clientX, yIni: e.clientY });

    if (this.punteros.size === 1) {
      const mueble = this.gestor.intersectar(this.rayo(e.clientX, e.clientY));
      if (mueble) {
        this.seleccionar(mueble);
        const p = this.puntoSuelo(e.clientX, e.clientY);
        this.offset.set(mueble.position.x - (p ? p.x : 0), mueble.position.z - (p ? p.z : 0));
        this.modo = 'arrastrar';
      } else {
        this.modo = 'rotar';
      }
    } else if (this.punteros.size === 2) {
      if (this.modo === 'arrastrar') this.gestor.cancelar(this.seleccionado);
      this.modo = 'gesto';
      this.gesto = this.medirGesto();
    }
  }

  mover(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    p.x = e.clientX;
    p.y = e.clientY;

    if (this.modo === 'arrastrar') {
      const s = this.puntoSuelo(e.clientX, e.clientY);
      if (s) this.gestor.arrastrar(this.seleccionado, s.x + this.offset.x, s.z + this.offset.y);
    } else if (this.modo === 'rotar') {
      this.cam.rotar(-dx * 0.008);
      this.eventos.alMoverCamara();
    } else if (this.modo === 'gesto' && this.punteros.size === 2) {
      const g = this.medirGesto();
      if (this.gesto.dist > 0) this.cam.zoom(g.dist / this.gesto.dist);
      let da = g.ang - this.gesto.ang;
      if (da > Math.PI) da -= Math.PI * 2;
      else if (da < -Math.PI) da += Math.PI * 2;
      this.cam.rotar(da);
      this.gesto = g;
      this.eventos.alMoverCamara();
    }
  }

  arriba(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    this.punteros.delete(e.pointerId);

    if (this.modo === 'arrastrar') {
      if (this.gestor.soltar(this.seleccionado)) this.eventos.alCambiar();
      this.modo = 'nada';
    } else if (this.modo === 'rotar') {
      if (Math.hypot(e.clientX - p.xIni, e.clientY - p.yIni) < 8) this.seleccionar(null);
      this.modo = 'nada';
    } else if (this.modo === 'gesto' && this.punteros.size === 0) {
      this.modo = 'nada';
    }
  }
}
