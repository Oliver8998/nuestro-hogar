import * as THREE from 'three';

function visibleArriba(o) {
  while (o) {
    if (!o.visible) return false;
    o = o.parent;
  }
  return true;
}

export class Controles {
  constructor(canvas, camaraIso, gestor, sala, eventos) {
    this.canvas = canvas;
    this.cam = camaraIso;
    this.gestor = gestor;
    this.sala = sala;
    this.eventos = eventos;
    this.punteros = new Map();
    this.modo = 'nada';
    this.modoJuego = 'decorar';
    this.raycaster = new THREE.Raycaster();
    this.suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.seleccionado = null;
    this.reparando = null;
    this.ultimo = { x: 0, y: 0 };
    this.offset = new THREE.Vector2();
    this.gesto = null;
    this.tMovimiento = 0;
    this.ultimoToque = { t: 0, x: 0, y: 0 };

    canvas.addEventListener('pointerdown', e => this.abajo(e));
    canvas.addEventListener('pointermove', e => this.mover(e));
    canvas.addEventListener('pointerup', e => this.arriba(e));
    canvas.addEventListener('pointercancel', e => this.arriba(e));
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.cam.zoom(e.deltaY < 0 ? 1.1 : 0.9);
    }, { passive: false });
  }

  cambiarModo(modo) {
    this.modoJuego = modo;
    this.seleccionar(null);
    this.terminarReparacion();
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

  buscarReparacion(x, y) {
    const objetos = [...this.sala.objetivos(), ...this.gestor.muebles];
    const hits = this.rayo(x, y).intersectObjects(objetos, true);
    for (const h of hits) {
      if (!visibleArriba(h.object)) continue;
      let o = h.object;
      while (o && !o.userData.reparacion && !o.userData.def) o = o.parent;
      if (!o || o.userData.def) return null;
      return { rep: o.userData.reparacion, objeto: o };
    }
    return null;
  }

  empezarReparacion(hit, x, y) {
    const rep = hit.rep;
    if (rep.tipo === 'aplastar') {
      if (this.sala.aplastar(hit.objeto.userData.cucaracha)) this.eventos.alReparar(rep);
      this.modo = 'aplastar';
      return;
    }
    if (!this.eventos.puedeReparar(rep)) {
      this.modo = 'nada';
      return;
    }
    this.reparando = rep;
    this.modo = 'reparar';
    if (rep.tipo === 'toques') this.avanzar(1);
    else this.eventos.alProgresoReparar(rep, x, y);
  }

  avanzar(cantidad) {
    const rep = this.reparando;
    if (!rep) return;
    if (this.sala.avanzar(rep, cantidad)) {
      this.reparando = null;
      this.modo = 'nada';
      this.eventos.alFinReparar();
      this.eventos.alReparar(rep);
    } else {
      this.eventos.alProgresoReparar(rep, this.ultimo.x, this.ultimo.y);
    }
  }

  terminarReparacion() {
    if (this.reparando) {
      this.reparando = null;
      this.eventos.alFinReparar();
    }
    if (this.modo === 'reparar' || this.modo === 'aplastar') this.modo = 'nada';
  }

  medirGesto() {
    const [a, b] = [...this.punteros.values()];
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      ang: Math.atan2(b.y - a.y, b.x - a.x),
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2
    };
  }

  empezarRotar() {
    this.modo = 'rotar';
    this.cam.agarrar();
  }

  abajo(e) {
    this.canvas.setPointerCapture(e.pointerId);
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, xIni: e.clientX, yIni: e.clientY });

    if (this.punteros.size === 1) {
      this.ultimo = { x: e.clientX, y: e.clientY };
      if (this.modoJuego === 'reparar') {
        const hit = this.buscarReparacion(e.clientX, e.clientY);
        if (hit) this.empezarReparacion(hit, e.clientX, e.clientY);
        else this.empezarRotar();
        return;
      }
      const mueble = this.gestor.intersectar(this.rayo(e.clientX, e.clientY));
      if (mueble) {
        this.seleccionar(mueble);
        const p = this.puntoSuelo(e.clientX, e.clientY);
        this.offset.set(mueble.position.x - (p ? p.x : 0), mueble.position.z - (p ? p.z : 0));
        this.modo = 'arrastrar';
      } else {
        this.empezarRotar();
      }
    } else if (this.punteros.size === 2) {
      if (this.modo === 'arrastrar') this.gestor.cancelar(this.seleccionado);
      this.terminarReparacion();
      this.cam.agarrar();
      this.modo = 'gesto';
      this.gesto = this.medirGesto();
    }
  }

  mover(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.punteros.size === 1) this.ultimo = { x: e.clientX, y: e.clientY };

    if (this.modo === 'arrastrar') {
      const s = this.puntoSuelo(e.clientX, e.clientY);
      if (s) this.gestor.arrastrar(this.seleccionado, s.x + this.offset.x, s.z + this.offset.y);
    } else if (this.modo === 'reparar' && this.reparando) {
      if (this.reparando.tipo === 'frotar') {
        const hit = this.buscarReparacion(e.clientX, e.clientY);
        if (hit && hit.rep === this.reparando) this.avanzar(Math.hypot(dx, dy));
        else this.eventos.alProgresoReparar(this.reparando, e.clientX, e.clientY);
      } else {
        this.eventos.alProgresoReparar(this.reparando, e.clientX, e.clientY);
      }
    } else if (this.modo === 'aplastar') {
      const hit = this.buscarReparacion(e.clientX, e.clientY);
      if (hit && hit.rep.tipo === 'aplastar' && this.sala.aplastar(hit.objeto.userData.cucaracha)) this.eventos.alReparar(hit.rep);
    } else if (this.modo === 'rotar') {
      if (dx !== 0) {
        this.cam.rotar(-dx * 0.008);
        this.tMovimiento = performance.now();
      }
    } else if (this.modo === 'gesto' && this.punteros.size === 2) {
      const g = this.medirGesto();
      if (this.gesto.dist > 0) this.cam.zoom(g.dist / this.gesto.dist);
      let da = g.ang - this.gesto.ang;
      if (da > Math.PI) da -= Math.PI * 2;
      else if (da < -Math.PI) da += Math.PI * 2;
      this.cam.rotar(da);
      this.cam.desplazar(g.cx - this.gesto.cx, g.cy - this.gesto.cy, this.canvas.getBoundingClientRect().width);
      this.gesto = g;
    }
  }

  arriba(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    this.punteros.delete(e.pointerId);

    if (this.modo === 'arrastrar') {
      if (this.gestor.soltar(this.seleccionado)) this.eventos.alCambiar();
      this.modo = 'nada';
    } else if (this.modo === 'reparar' || this.modo === 'aplastar') {
      this.terminarReparacion();
    } else if (this.modo === 'rotar') {
      const ahora = performance.now();
      const esToque = Math.hypot(e.clientX - p.xIni, e.clientY - p.yIni) < 8;
      this.cam.soltar(!esToque && ahora - this.tMovimiento < 80);
      if (esToque) {
        if (this.modoJuego === 'decorar') this.seleccionar(null);
        const u = this.ultimoToque;
        if (ahora - u.t < 320 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 30) {
          this.cam.reiniciar();
          this.ultimoToque = { t: 0, x: 0, y: 0 };
        } else {
          this.ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
        }
      }
      this.modo = 'nada';
    } else if (this.modo === 'gesto' && this.punteros.size === 0) {
      this.cam.soltar(false);
      this.modo = 'nada';
    }
  }

  actualizar(dt) {
    if (this.modo === 'reparar' && this.reparando && this.reparando.tipo === 'mantener') {
      const hit = this.buscarReparacion(this.ultimo.x, this.ultimo.y);
      if (hit && hit.rep === this.reparando) this.avanzar(dt);
    }
  }
}
