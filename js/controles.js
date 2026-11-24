import * as THREE from 'three';

export class Controles {
  constructor(canvas, camaraIso, gestor, sala, mascotas, entregas, eventos) {
    this.canvas = canvas;
    this.cam = camaraIso;
    this.gestor = gestor;
    this.sala = sala;
    this.mascotas = mascotas;
    this.entregas = entregas;
    this.paqueteTocado = null;
    this.suciedad = null;
    this.eventos = eventos;
    this.punteros = new Map();
    this.modo = 'nada';
    this.raycaster = new THREE.Raycaster();
    this.suelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.seleccionado = null;
    this.mascotaTocada = null;
    this.colocando = null;
    this.offset = new THREE.Vector2();
    this.gesto = null;
    this.tMovimiento = 0;
    this.ultimoToque = { t: 0, x: 0, y: 0 };
    this.avisado = false;

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

  puntoColocacion(x, y, excluir) {
    const hit = this.gestor.intersectar(this.rayo(x, y), excluir);
    if (hit && hit.mueble.userData.def.soporte && hit.normal) {
      const n = hit.normal.clone().transformDirection(hit.objeto.matrixWorld);
      if (n.y > 0.5) return hit.punto;
    }
    return this.puntoSuelo(x, y);
  }

  seleccionar(mueble) {
    if (this.seleccionado && this.seleccionado !== mueble) this.gestor.resaltar(this.seleccionado, null);
    this.seleccionado = mueble;
    if (mueble) this.gestor.resaltar(mueble, 'sel');
    this.eventos.alSeleccionar(mueble);
  }

  empezarColocacion(item, info) {
    this.seleccionar(null);
    this.eventos.alSeleccionarMascota(null);
    this.colocando = { item, info, preview: null };
    if (info.tipo === 'mueble') {
      this.colocando.preview = this.gestor.crearPreview(item.id, item.color);
      this.gestor.mostrarRejilla(true);
    }
    this.modo = 'colocar';
  }

  moverColocacion(x, y, sobreBarra) {
    const c = this.colocando;
    if (!c) return null;
    if (c.preview) {
      const s = sobreBarra ? null : this.puntoColocacion(x, y, c.preview);
      if (!s) {
        c.preview.visible = false;
        c.preview.userData.tmp = null;
        return null;
      }
      this.gestor.arrastrar(c.preview, s.x, s.z);
      c.preview.visible = true;
      return c.preview.userData.tmp.valido ? 'ok' : 'mal';
    }
    if (c.info.limpia && this.suciedad) {
      const d = sobreBarra ? null : this.suciedad.buscar(this.rayo(x, y), c.info, this.gestor.muebles);
      if (d) {
        this.sala.resaltar(null);
        const r = this.suciedad.puedeLimpiar(c.info, d);
        this.suciedad.resaltar(d, r.ok);
        return r.ok ? 'ok' : 'mal';
      }
      this.suciedad.resaltar(null);
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
    this.gestor.mostrarRejilla(false);
    if (!c) return { ok: false };

    if (c.preview) {
      const tmp = c.preview.userData.tmp;
      if (!cancelar && c.preview.visible && tmp && tmp.valido) {
        this.gestor.confirmar(c.preview);
        this.seleccionar(c.preview);
        return { ok: true, encima: tmp.base > 0.01 };
      }
      const motivo = !cancelar && c.preview.visible ? 'Ahí no cabe' : null;
      this.gestor.quitar(c.preview);
      return { ok: false, motivo };
    }

    this.sala.resaltar(null);
    if (this.suciedad) this.suciedad.resaltar(null);
    if (cancelar) return { ok: false };
    if (c.info.limpia && this.suciedad) {
      const d = this.suciedad.buscar(this.rayo(x, y), c.info, this.gestor.muebles);
      if (d) {
        const r = this.suciedad.puedeLimpiar(c.info, d);
        if (!r.ok) return { ok: false, motivo: r.motivo };
        return { ok: false, minijuego: d };
      }
    }
    const obj = this.sala.buscar(this.rayo(x, y), c.info, this.gestor.muebles);
    if (!obj) return { ok: false, motivo: c.info.pista };
    const r = this.sala.puedeAplicar(c.info, obj);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    this.sala.aplicar(c.info, obj);
    return { ok: true, objetivo: obj };
  }

  esperar(fn) {
    this.cancelarEspera();
    this.tEspera = setTimeout(() => {
      this.tEspera = null;
      fn();
    }, 380);
  }

  cancelarEspera() {
    if (this.tEspera) clearTimeout(this.tEspera);
    this.tEspera = null;
  }

  vibrar() {
    try {
      if (navigator.vibrate) navigator.vibrate(18);
    } catch (e) {}
  }

  agarrarMueble(mueble, x, y) {
    if (this.eventos.alAgarrar) this.eventos.alAgarrar(mueble);
    this.seleccionar(mueble);
    this.eventos.alSeleccionarMascota(null);
    this.avisado = false;
    if (this.gestor.tieneEncima(mueble)) {
      this.modo = 'bloqueado';
      return;
    }
    const p = this.puntoColocacion(x, y, mueble) || mueble.position;
    this.offset.set(mueble.position.x - p.x, mueble.position.z - p.z);
    this.modo = 'arrastrar';
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
    this.eventos.alPrimerToque();
    this.canvas.setPointerCapture(e.pointerId);
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, xIni: e.clientX, yIni: e.clientY });
    if (this.soloMirar && this.punteros.size === 1) {
      this.modo = 'rotar';
      this.cam.agarrar();
      return;
    }

    if (this.punteros.size === 1) {
      const rayo = this.rayo(e.clientX, e.clientY);
      const paquete = this.entregas.intersectar(rayo);
      if (paquete) {
        this.paqueteTocado = paquete;
        this.modo = 'paquete';
        return;
      }
      const mascota = this.mascotas.intersectar(rayo);
      const hit = this.gestor.intersectar(rayo);
      const distMascota = mascota ? mascota.grupo.position.distanceTo(this.cam.camara.position) : Infinity;
      const distMueble = hit ? hit.punto.distanceTo(this.cam.camara.position) : Infinity;
      const distCuadro = this.eventos.distCuadro ? this.eventos.distCuadro(rayo) : Infinity;
      if (this.capturaToque || distCuadro < Math.min(distMueble, distMascota)) {
        this.modo = 'rotar';
        this.cam.agarrar();
        if (!this.capturaToque && this.eventos.mantenerPared) {
          const x0 = e.clientX;
          const y0 = e.clientY;
          const id = e.pointerId;
          this.esperar(() => {
            const p = this.punteros.get(id);
            if (this.modo !== 'rotar' || !p || Math.hypot(p.x - x0, p.y - y0) > 10) return;
            if (this.eventos.mantenerPared(this.rayo(x0, y0))) {
              this.vibrar();
              this.cam.soltar(false);
              this.modo = 'hecho';
            }
          });
        }
        return;
      }

      if (mascota && distMascota <= distMueble + 0.3) {
        this.mascotaTocada = mascota;
        this.modo = 'mascota';
        this.esperar(() => {
          if (this.modo !== 'mascota') return;
          this.vibrar();
          this.seleccionar(null);
          this.eventos.alSeleccionarMascota(this.mascotaTocada);
          this.mascotaTocada = null;
          this.modo = 'hecho';
        });
        return;
      }
      if (hit) {
        const mueble = hit.mueble;
        this.tocarAlSoltar = null;
        if (mueble === this.seleccionado) {
          this.tocarAlSoltar = mueble;
          this.agarrarMueble(mueble, e.clientX, e.clientY);
          return;
        }
        this.muebleTocado = mueble;
        this.modo = 'espera';
        const x = e.clientX;
        const y = e.clientY;
        this.esperar(() => {
          if (this.modo !== 'espera') return;
          this.vibrar();
          mueble.userData.rebote = 0.5;
          this.agarrarMueble(mueble, x, y);
        });
        return;
      }
      this.modo = 'rotar';
      this.cam.agarrar();
    } else if (this.punteros.size === 2) {
      this.cancelarEspera();
      if (this.modo === 'arrastrar') {
        this.gestor.cancelar(this.seleccionado);
        this.gestor.mostrarRejilla(false);
      }
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
    const lejos = Math.hypot(e.clientX - p.xIni, e.clientY - p.yIni) > 8;

    if (this.modo === 'arrastrar') {
      if (!lejos && !this.gestor.rejilla.visible) return;
      this.gestor.mostrarRejilla(true);
      const s = this.puntoColocacion(e.clientX, e.clientY, this.seleccionado);
      if (s) this.gestor.arrastrar(this.seleccionado, s.x + this.offset.x, s.z + this.offset.y);
    } else if (this.modo === 'bloqueado') {
      if (lejos && !this.avisado) {
        this.avisado = true;
        this.eventos.alAviso('Quita primero lo que tiene encima', true);
      }
    } else if (this.modo === 'mascota' || this.modo === 'paquete' || this.modo === 'espera') {
      if (lejos) {
        this.cancelarEspera();
        this.muebleTocado = null;
        this.modo = 'rotar';
        this.cam.agarrar();
      }
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
    const esToque = Math.hypot(e.clientX - p.xIni, e.clientY - p.yIni) < 8;

    this.cancelarEspera();
    if (this.modo === 'espera') {
      const m = this.muebleTocado;
      this.muebleTocado = null;
      this.modo = 'nada';
      if (esToque && m) {
        this.seleccionar(null);
        this.eventos.alSeleccionarMascota(null);
        this.eventos.alInteractuar(m);
      }
    } else if (this.modo === 'hecho') {
      this.modo = 'nada';
    } else if (this.modo === 'arrastrar') {
      this.gestor.mostrarRejilla(false);
      const movido = this.gestor.soltar(this.seleccionado);
      if (movido) this.eventos.alCambiar(this.seleccionado);
      else if (esToque && this.tocarAlSoltar === this.seleccionado) this.eventos.alInteractuar(this.seleccionado);
      this.tocarAlSoltar = null;
      this.modo = 'nada';
    } else if (this.modo === 'bloqueado') {
      if (esToque && this.tocarAlSoltar === this.seleccionado) this.eventos.alInteractuar(this.seleccionado);
      this.tocarAlSoltar = null;
      this.modo = 'nada';
    } else if (this.modo === 'paquete') {
      this.eventos.alAbrirPaquete(this.paqueteTocado);
      this.paqueteTocado = null;
      this.modo = 'nada';
    } else if (this.modo === 'mascota') {
      if (this.mascotaTocada) this.eventos.alInteractuarMascota(this.mascotaTocada);
      this.mascotaTocada = null;
      this.modo = 'nada';
    } else if (this.modo === 'rotar') {
      const ahora = performance.now();
      this.cam.soltar(!esToque && ahora - this.tMovimiento < 80);
      if (esToque) {
        this.seleccionar(null);
        this.eventos.alSeleccionarMascota(null);
        const u = this.ultimoToque;
        if (ahora - u.t < 320 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 30) {
          this.cam.reiniciar();
          this.ultimoToque = { t: 0, x: 0, y: 0 };
        } else {
          this.ultimoToque = { t: ahora, x: e.clientX, y: e.clientY };
          if (this.capturaToque) {
            this.capturaToque(this.rayo(e.clientX, e.clientY));
            this.modo = 'nada';
            return;
          }
          if (this.eventos.tocarCuadro && this.eventos.tocarCuadro(this.rayo(e.clientX, e.clientY))) {
            this.modo = 'nada';
            return;
          }
          const sucio = this.suciedad && this.suciedad.tocar(this.rayo(e.clientX, e.clientY), this.gestor.muebles);
          if (sucio) this.eventos.alTocarSuciedad(sucio);
          else {
            const obj = this.sala.tocar(this.rayo(e.clientX, e.clientY), this.gestor.muebles);
            if (obj) this.eventos.alTocarDesperfecto(obj);
          }
        }
      }
      this.modo = 'nada';
    } else if (this.modo === 'gesto' && this.punteros.size === 0) {
      this.cam.soltar(false);
      this.modo = 'nada';
    }
  }
}
