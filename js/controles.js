import * as THREE from 'three';

export class Controles {
  constructor(canvas, camaraIso, gestor, sala, eventos) {
    this.canvas = canvas;
    this.cam = camaraIso;
    this.gestor = gestor;
    this.sala = sala;
    this.eventos = eventos;
    this.punteros = new Map();
    this.modo = 'nada';
    this.raycaster = new THREE.Raycaster();
    this.suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.seleccionado = null;
    this.colocando = null;
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

  empezarColocacion(item, info) {
    this.seleccionar(null);
    this.colocando = { item, info, preview: null };
    if (info.tipo === 'mueble') this.colocando.preview = this.gestor.crearPreview(item.id, item.color);
    this.modo = 'colocar';
  }

  moverColocacion(x, y, sobreBarra) {
    const c = this.colocando;
    if (!c) return null;
    if (c.preview) {
      const s = sobreBarra ? null : this.puntoSuelo(x, y);
      if (!s) {
        c.preview.visible = false;
        return null;
      }
      c.preview.visible = true;
      this.gestor.arrastrar(c.preview, s.x, s.z);
      return c.preview.userData.tmp.valido ? 'ok' : 'mal';
    }
    const obj = sobreBarra ? null : this.sala.buscar(this.rayo(x, y), c.info, this.gestor.muebles);
    if (!obj) {
      this.sala.resaltar(null);
      return null;
    }
    const r = this.sala.puedeAplicar(c.info, obj);
    this.sala.resaltar(obj, r.ok);
    return r.ok ? 'ok' : 'mal';
  }

  soltarColocacion(x, y, cancelar) {
    const c = this.colocando;
    this.colocando = null;
    this.modo = 'nada';
    if (!c) return { ok: false };

    if (c.preview) {
      const tmp = c.preview.userData.tmp;
      if (!cancelar && c.preview.visible && tmp && tmp.valido) {
        this.gestor.confirmar(c.preview);
        this.seleccionar(c.preview);
        return { ok: true };
      }
      const motivo = !cancelar && c.preview.visible ? 'Ahí no cabe' : null;
      this.gestor.quitar(c.preview);
      return { ok: false, motivo };
    }

    this.sala.resaltar(null);
    if (cancelar) return { ok: false };
    const obj = this.sala.buscar(this.rayo(x, y), c.info, this.gestor.muebles);
    if (!obj) return { ok: false, motivo: c.info.pista };
    const r = this.sala.puedeAplicar(c.info, obj);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    this.sala.aplicar(c.info, obj);
    return { ok: true, objetivo: obj };
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

  abajo(e) {
    if (this.modo === 'colocar') return;
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
        this.cam.agarrar();
      }
    } else if (this.punteros.size === 2) {
      if (this.modo === 'arrastrar') this.gestor.cancelar(this.seleccionado);
      this.cam.agarrar();
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
    } else if (this.modo === 'rotar') {
      const ahora = performance.now();
      const esToque = Math.hypot(e.clientX - p.xIni, e.clientY - p.yIni) < 8;
      this.cam.soltar(!esToque && ahora - this.tMovimiento < 80);
      if (esToque) {
        this.seleccionar(null);
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
}
