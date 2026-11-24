import * as THREE from 'three';

export const TAM_VENTANA = {
  s: { nombre: 'Pequeña', k: 0.65 },
  m: { nombre: 'Normal', k: 1 },
  l: { nombre: 'Grande', k: 1.3 },
  xl: { nombre: 'Ventanal', k: 1.6 }
};
export const PRECIO_VENTANA = 600;
const ALTO = 2.6;
const NOMBRE_PARED = { 0: 'del fondo', 1: 'de la puerta', 2: 'de la izquierda', 3: 'de la derecha' };

function crearVentana(colorMarco, cieloTex) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorMarco, roughness: 0.7 });
  [
    [1.2, 0.08, 0.06, 0, 0.6],
    [1.2, 0.08, 0.06, 0, -0.6],
    [0.08, 1.28, 0.06, -0.6, 0],
    [0.08, 1.28, 0.06, 0.6, 0],
    [0.06, 1.2, 0.06, 0, 0]
  ].forEach(([w, h, d, x, y]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    p.position.set(x, y, 0);
    p.castShadow = true;
    g.add(p);
  });
  const repisa = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.05, 0.14), mat);
  repisa.position.set(0, -0.66, 0.05);
  g.add(repisa);
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.12), new THREE.MeshStandardMaterial({ color: 0xa9d4e8, emissive: 0x8fc3dd, emissiveIntensity: 0.4, transparent: true, opacity: 0.32 }));
  cristal.position.z = 0.001;
  g.add(cristal);
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.2), new THREE.MeshBasicMaterial({ map: cieloTex || null, color: cieloTex ? 0xffffff : 0xbfe3f5, toneMapped: false }));
  cielo.position.z = -0.002;
  g.add(cielo);
  g.userData.mat = mat;
  return g;
}

export class ObjetosPared {
  constructor(ctx) {
    this.ctx = ctx;
    this.extras = [];
    this.firma = '';
    this.colocando = null;
    this.t = 0;
    this.activo = true;
    const barra = document.createElement('div');
    barra.id = 'colocar-pared';
    barra.className = 'oculto';
    document.body.appendChild(barra);
    this.barra = barra;
  }

  get estado() {
    return this.ctx.estado();
  }

  lista() {
    if (!Array.isArray(this.estado.paredObjs)) this.estado.paredObjs = [];
    return this.estado.paredObjs;
  }

  deHab(k = this.ctx.claveHab()) {
    const l = this.lista();
    if (!l.some(o => o.hab === k && o.principal)) l.push({ id: `v0-${k}`, tipo: 'ventana', principal: true, hab: k, pared: 0, x: 1, y: 1.5 });
    if (!l.some(o => o.hab === k && o.tipo === 'telefono')) l.push({ id: `t-${k}`, tipo: 'telefono', hab: k, pared: 0, x: -2.45, y: 1.3 });
    if (!l.some(o => o.hab === k && o.tipo === 'cartel')) l.push({ id: `c-${k}`, tipo: 'cartel', hab: k, pared: 0, x: -0.35, y: 2.1 });
    return l.filter(o => o.hab === k);
  }

  tamDe(o) {
    if (o.tam && TAM_VENTANA[o.tam]) return o.tam;
    if (o.principal && this.ctx.ventanaGrande && this.ctx.ventanaGrande()) return 'l';
    return 'm';
  }

  medidas(o) {
    if (o.tipo === 'telefono') return [0.5, 0.7];
    if (o.tipo === 'cartel') return [0.95, 0.8];
    const k = TAM_VENTANA[this.tamDe(o)].k;
    return [1.32 * k, 1.36 * k];
  }

  ventanaArreglada() {
    const { sala } = this.ctx;
    return !sala.conDesperfectos() || sala.estado().arreglos.includes('ventana');
  }

  quitarExtras() {
    for (const g of this.extras) {
      if (g.parent) g.parent.remove(g);
      g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material !== g.userData.mat && !o.material.map) o.material.dispose();
      });
      if (g.userData.mat) g.userData.mat.dispose();
    }
    this.extras = [];
  }

  colocarEn(obj, o) {
    const { sala } = this.ctx;
    const pared = sala.paredes[o.pared];
    if (!pared) return;
    if (obj.parent !== pared) pared.add(obj);
    obj.position.set(o.x, o.y, sala.cara + (o.tipo === 'cartel' ? 0.03 : 0));
  }

  pintar() {
    const { sala, telefono } = this.ctx;
    if (this.sel && (this.ctx.visitando() || sala.esExterior() || this.sel.ref.hab !== this.ctx.claveHab())) {
      this.deseleccionar();
      this.ctx.refrescarMenu && this.ctx.refrescarMenu();
    }
    this.quitarExtras();
    if (this.ctx.visitando()) {
      sala.paredes[0].add(sala.ventana);
      sala.ventana.position.set(1, 1.5, sala.cara);
      this.firma = '';
      return;
    }
    const k = this.ctx.claveHab();
    const lista = this.deHab(k).map(o => (this.colocando && this.colocando.o.id === o.id ? this.colocando.o : o));
    if (this.colocando && this.colocando.nueva && this.colocando.o.hab === k && this.colocando.puesto) lista.push(this.colocando.o);
    this.firma = JSON.stringify(this.deHab(k));
    if (sala.esExterior()) return;
    const colorMarco = sala.ventana.children[0] ? sala.ventana.children[0].material.color.getHex() : 0x6b4f36;
    const cieloTex = this.ctx.ambiente && this.ctx.ambiente.textura;
    for (const o of lista) {
      if (o.tipo === 'telefono') {
        telefono.fijar(o.pared, o.x, o.y);
        continue;
      }
      if (o.tipo === 'cartel') {
        const c = this.ctx.cartel && this.ctx.cartel();
        if (c) this.colocarEn(c.grupo, o);
        continue;
      }
      const s = TAM_VENTANA[this.tamDe(o)].k;
      if (o.principal) {
        this.colocarEn(sala.ventana, o);
        sala.ventana.scale.set(s, s, 1);
        sala.ventana.userData.paredObj = o.id;
        continue;
      }
      const g = crearVentana(colorMarco, cieloTex);
      g.userData.paredObj = o.id;
      g.scale.set(s, s, 1);
      this.colocarEn(g, o);
      this.extras.push(g);
    }
    if (this.sel) this.resaltar(this.modoResalte || 'sel');
  }

  actualizar(dt) {
    this.t += dt;
    if (this.t < 0.5) return;
    this.t = 0;
    if (this.colocando || this.ctx.visitando() || this.arrastrando) return;
    if (this.sel) {
      const existe = this.sel.tipo === 'cuadro' ? this.ctx.cuadros().lista().includes(this.sel.ref) : this.lista().includes(this.sel.ref);
      if (!existe) {
        this.deseleccionar();
        this.ctx.refrescarMenu && this.ctx.refrescarMenu();
      } else if (this.objeto3D(this.sel) !== this.grupoResaltado) this.resaltar(this.modoResalte || 'sel');
    }
    if (JSON.stringify(this.deHab()) !== this.firma) this.pintar();
  }

  rectangulos(pared, excluir, conCuadros = true) {
    const k = this.ctx.claveHab();
    const r = [];
    if (pared === 1) r.push({ x: -1, y: 1.05, w: 1.15, h: 2.15 });
    for (const o of this.deHab(k)) {
      if (o.pared !== pared || o.id === excluir) continue;
      const usado = this.colocando && this.colocando.o.id === o.id ? this.colocando.o : o;
      const [w, h] = this.medidas(usado);
      r.push({ x: usado.x, y: usado.y, w, h });
    }
    if (conCuadros) {
      const cuadros = this.ctx.cuadros();
      for (const c of cuadros.enEstaHab()) {
        if (c.pared !== pared || c.id === excluir) continue;
        const [w, h] = cuadros.medidas(c);
        r.push({ x: c.x, y: c.y, w: w + 0.12, h: h + 0.12 });
      }
    }
    return r;
  }

  choca(rect, pared, excluir, conCuadros = true) {
    return this.rectangulos(pared, excluir, conCuadros).some(o => Math.abs(rect.x - o.x) < (rect.w + o.w) / 2 + 0.03 && Math.abs(rect.y - o.y) < (rect.h + o.h) / 2 + 0.03);
  }

  candidatos() {
    const { sala, telefono } = this.ctx;
    const l = [];
    if (!this.activo || this.ctx.visitando() || sala.esExterior()) {
      if (telefono.visible()) l.push({ obj: telefono.zona, id: null, tipo: 'telefono' });
      return l;
    }
    const k = this.ctx.claveHab();
    for (const o of this.deHab(k)) {
      if (o.tipo === 'telefono') {
        if (telefono.visible()) l.push({ obj: telefono.zona, id: o.id, tipo: 'telefono' });
      } else if (o.tipo === 'cartel') {
        const c = this.ctx.cartel && this.ctx.cartel();
        if (c && c.grupo.visible && c.grupo.parent && c.grupo.parent.visible) l.push({ obj: c.grupo, id: o.id, tipo: 'cartel' });
      } else if (o.principal) {
        if (this.ventanaArreglada() && sala.ventana.parent && sala.ventana.parent.visible) l.push({ obj: sala.ventana, id: o.id, tipo: 'ventana' });
      } else {
        const g = this.extras.find(x => x.userData.paredObj === o.id);
        if (g && g.parent && g.parent.visible) l.push({ obj: g, id: o.id, tipo: 'ventana' });
      }
    }
    return l;
  }

  intersectar(rayo) {
    let mejor = null;
    for (const c of this.candidatos()) {
      const h = rayo.intersectObject(c.obj, true)[0];
      if (h && (!mejor || h.distance < mejor.distancia)) mejor = { ...c, distancia: h.distance };
    }
    return mejor;
  }

  distancia(rayo) {
    if (this.colocando) return 0;
    const h = this.intersectar(rayo);
    return h ? h.distancia : Infinity;
  }

  tocar(rayo) {
    if (this.colocando) {
      this.ponerEn(rayo);
      return true;
    }
    const h = this.intersectar(rayo);
    if (!h) return false;
    if (h.tipo === 'telefono') {
      this.ctx.telefono.descolgado = 1.4;
      this.ctx.abrirTelefono();
    } else if (h.tipo === 'cartel') {
      const g = h.obj;
      let t = 0;
      this.ctx.sonido.tic && this.ctx.sonido.tic();
      const paso = () => {
        t += 1 / 60;
        g.rotation.z = Math.sin(t * 14) * 0.12 * Math.max(0, 1 - t / 1.2);
        if (t < 1.2) requestAnimationFrame(paso);
        else g.rotation.z = 0;
      };
      requestAnimationFrame(paso);
    } else {
      this.reaccionVentana(h.obj);
    }
    return true;
  }

  reaccionVentana(g) {
    const { sonido, ui, ambiente } = this.ctx;
    const noche = ambiente.esNoche();
    const p = new THREE.Vector3();
    g.getWorldPosition(p);
    const s = this.ctx.pantalla(p);
    if (noche) {
      [1760, 2349, 2637].forEach((f, i) => sonido.tono(f, i * 0.12, 0.3, { tipo: 'sine', volumen: 0.04 }));
      ui.particula(['🌙', '⭐', '✨'][Math.floor(Math.random() * 3)], s.x, s.y, 3);
    } else {
      [0, 0.16, 0.3].forEach(t => sonido.tono(2200 + Math.random() * 600, t, 0.08, { hasta: 3000, volumen: 0.05 }));
      sonido.ruido(0.6, { freq: 1000, q: 0.4, volumen: 0.05 });
      ui.particula(['🍃', '🐦', '☀️', '🦋'][Math.floor(Math.random() * 4)], s.x, s.y, 3);
    }
    const frases = noche ? ['Qué noche tan bonita', 'Mira cuántas estrellas'] : ['Entra un aire fresquito', '¡Qué buen día hace!', 'Pío, pío'];
    ui.bocadillo(frases[Math.floor(Math.random() * frases.length)], s.x, s.y - 30);
    const k0 = g.scale.x;
    let t = 0;
    const paso = () => {
      t += 1 / 60;
      const k = k0 * (1 + Math.sin(Math.min(1, t / 0.45) * Math.PI) * 0.05);
      g.scale.set(k, k, 1);
      if (t < 0.45) requestAnimationFrame(paso);
      else g.scale.set(k0, k0, 1);
    };
    requestAnimationFrame(paso);
  }

  comprarVentana() {
    const { ui, sonido } = this.ctx;
    if (this.ctx.sala.esExterior()) {
      ui.aviso('Aquí fuera no hay paredes. Entrad en una habitación', true);
      return;
    }
    if (this.estado.monedas < PRECIO_VENTANA) {
      sonido.error();
      ui.aviso(`Os faltan ${PRECIO_VENTANA - this.estado.monedas} monedas`, true);
      return;
    }
    const base = { id: `v${Date.now()}`, tipo: 'ventana', hab: this.ctx.claveHab(), pared: 0, x: 0, y: 1.5, tam: 'm' };
    const o = this.huecoLibre(base) || this.huecoLibre({ ...base, tam: 's' });
    if (!o) {
      sonido.error();
      ui.aviso('No queda hueco en las paredes que se ven. Girad la cámara o quitad algo', true);
      return;
    }
    ui.cerrarHojas();
    this.estado.monedas -= PRECIO_VENTANA;
    sonido.comprar();
    this.ctx.refrescarHud();
    this.lista().push(o);
    this.pintar();
    this.ctx.guardar();
    this.ctx.registrar && this.ctx.registrar('reformar');
    this.seleccionar({ tipo: 'obj', ref: o });
    ui.aviso('🪟 ¡Ventana nueva! Mantenla pulsada y arrástrala donde queráis');
  }

  huecoLibre(o) {
    const { sala } = this.ctx;
    const paredes = [0, 2, 3, 1].filter(i => sala.paredes[i] && sala.paredes[i].visible);
    for (const i of paredes) {
      for (const y of [1.5, 1.35, 1.65]) {
        for (let x = 0; x <= 2.5; x += 0.25) {
          for (const sx of x ? [x, -x] : [0]) {
            const p = { ...o, pared: i, x: sx, y };
            this.ajustar(p);
            const [w, h] = this.medidas(p);
            if (!this.choca({ x: p.x, y: p.y, w, h }, i, o.id)) return { ...p, x: +p.x.toFixed(3), y: +p.y.toFixed(3) };
          }
        }
      }
    }
    return null;
  }

  // ---- Selección y arrastre directo (igual que los muebles) ----

  puedeMover() {
    const cs = this.ctx.cuadros();
    return this.activo && !this.colocando && !this.ctx.visitando() && !this.ctx.sala.esExterior() && !(cs && cs.colocando);
  }

  buscar(rayo) {
    const a = this.intersectar(rayo);
    const cs = this.ctx.cuadros();
    const b = cs ? cs.intersectar(rayo) : null;
    if (b && (!a || b.distancia < a.distancia)) {
      const c = cs.lista().find(x => x.id === b.id);
      return c ? { tipo: 'cuadro', ref: c } : null;
    }
    if (a && a.id) {
      const o = this.lista().find(x => x.id === a.id);
      return o ? { tipo: 'obj', ref: o } : null;
    }
    return null;
  }

  objeto3D(sel) {
    if (!sel) return null;
    if (sel.tipo === 'cuadro') {
      const cs = this.ctx.cuadros();
      return cs ? cs.grupos.find(g => g.userData.cuadro === sel.ref.id) || null : null;
    }
    const o = sel.ref;
    if (o.tipo === 'telefono') return this.ctx.telefono.grupo;
    if (o.tipo === 'cartel') return this.ctx.cartel && this.ctx.cartel() ? this.ctx.cartel().grupo : null;
    if (o.principal) return this.ctx.sala.ventana;
    return this.extras.find(g => g.userData.paredObj === o.id) || null;
  }

  resaltar(modo) {
    for (const mat of this.matsResalte || []) {
      if (!mat.userData.emPrev) continue;
      mat.emissive.setHex(mat.userData.emPrev[0]);
      mat.emissiveIntensity = mat.userData.emPrev[1];
      delete mat.userData.emPrev;
    }
    this.matsResalte = [];
    this.grupoResaltado = null;
    this.modoResalte = modo;
    if (!this.sel || !modo) return;
    const g = this.objeto3D(this.sel);
    if (!g) return;
    this.grupoResaltado = g;
    g.traverse(m => {
      if (!m.isMesh) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        if (!mat.emissive || mat.userData.emPrev) continue;
        mat.userData.emPrev = [mat.emissive.getHex(), mat.emissiveIntensity];
        mat.emissive.setHex(modo === 'mal' ? 0xff3030 : 0xffc860);
        mat.emissiveIntensity = modo === 'mal' ? 0.5 : 0.35;
        this.matsResalte.push(mat);
      }
    });
  }

  seleccionar(h) {
    if (this.ctx.limpiarSeleccion) this.ctx.limpiarSeleccion();
    this.resaltar(null);
    this.sel = h ? { tipo: h.tipo, ref: h.ref } : null;
    this.arrastrando = false;
    if (this.sel) {
      this.resaltar('sel');
      if (this.ctx.sonido.tocar) this.ctx.sonido.tocar();
    }
    if (this.ctx.refrescarMenu) this.ctx.refrescarMenu();
  }

  deseleccionar() {
    if (!this.sel) return;
    if (this.arrastrando) this.cancelarArrastre();
    this.resaltar(null);
    this.sel = null;
    this.arrastrando = false;
  }

  esSeleccionado(rayo) {
    if (!this.sel || !this.puedeMover()) return false;
    const h = this.buscar(rayo);
    return !!h && h.ref === this.sel.ref;
  }

  puntoPared(rayo) {
    const { sala } = this.ctx;
    const muros = [];
    sala.paredes.forEach(p => { if (p.visible) muros.push(...p.userData.piezas); });
    const hit = rayo.intersectObjects(muros, false)[0];
    if (!hit) return null;
    const i = hit.object.userData.pared;
    const local = sala.paredes[i].worldToLocal(hit.point.clone());
    return { pared: i, x: local.x, y: local.y };
  }

  agarrar(rayo) {
    if (!this.puedeMover()) return false;
    const h = this.buscar(rayo);
    if (!h) return false;
    if (!this.sel || this.sel.ref !== h.ref) this.seleccionar(h);
    const r = this.sel.ref;
    const p = this.puntoPared(rayo);
    this.sel.orig = { pared: r.pared, x: r.x, y: r.y };
    this.sel.off = p && p.pared === r.pared ? { x: r.x - p.x, y: r.y - p.y } : { x: 0, y: 0 };
    this.sel.movido = false;
    this.arrastrando = true;
    return true;
  }

  arrastrar(rayo) {
    const s = this.sel;
    if (!s || !this.arrastrando) return;
    const p = this.puntoPared(rayo);
    if (!p) return;
    const r = s.ref;
    const off = p.pared === s.orig.pared ? s.off : { x: 0, y: 0 };
    const prueba = { ...r, pared: p.pared, x: p.x + off.x, y: p.y + off.y };
    let ok;
    if (s.tipo === 'cuadro') {
      const cs = this.ctx.cuadros();
      cs.ajustar(prueba);
      const [w, h] = cs.medidas(prueba);
      ok = !this.choca({ x: prueba.x, y: prueba.y, w: w + 0.1, h: h + 0.1 }, prueba.pared, r.id, true);
    } else {
      this.ajustar(prueba);
      const [w, h] = this.medidas(prueba);
      ok = !this.choca({ x: prueba.x, y: prueba.y, w, h }, prueba.pared, r.id);
    }
    if (ok && (r.pared !== prueba.pared || Math.abs(r.x - prueba.x) > 0.001 || Math.abs(r.y - prueba.y) > 0.001)) {
      Object.assign(r, { pared: prueba.pared, x: +prueba.x.toFixed(3), y: +prueba.y.toFixed(3) });
      s.movido = true;
      this.mover3D();
    }
    const modo = ok ? 'sel' : 'mal';
    if (modo !== this.modoResalte) this.resaltar(modo);
  }

  mover3D() {
    const s = this.sel;
    if (!s) return;
    const r = s.ref;
    const { sala } = this.ctx;
    if (s.tipo === 'obj' && r.tipo === 'telefono') {
      this.ctx.telefono.fijar(r.pared, r.x, r.y);
      return;
    }
    const g = this.objeto3D(s);
    if (!g) return;
    if (s.tipo === 'cuadro') {
      const pw = sala.paredes[r.pared];
      if (g.parent !== pw) pw.add(g);
      g.position.set(r.x, r.y, sala.cara + 0.02);
    } else this.colocarEn(g, r);
  }

  soltar() {
    const s = this.sel;
    if (!s || !this.arrastrando) return;
    this.arrastrando = false;
    if (this.modoResalte !== 'sel') this.resaltar('sel');
    if (!s.movido) return;
    s.movido = false;
    this.ctx.sonido.colocar();
    if (s.tipo === 'obj' && this.ctx.registrar) this.ctx.registrar('reformar');
    this.ctx.guardar();
  }

  cancelarArrastre() {
    const s = this.sel;
    if (!s || !this.arrastrando) return;
    Object.assign(s.ref, s.orig);
    s.movido = false;
    this.arrastrando = false;
    this.mover3D();
    this.resaltar('sel');
  }

  puntoMenu(v) {
    const g = this.objeto3D(this.sel);
    if (!g) return false;
    g.getWorldPosition(v);
    const r = this.sel.ref;
    const alto = this.sel.tipo === 'cuadro' ? this.ctx.cuadros().medidas(r)[1] : this.medidas(r)[1];
    v.y += alto / 2 + 0.12;
    return true;
  }

  opcionesMenu() {
    const s = this.sel;
    if (!s) return [];
    const r = s.ref;
    if (s.tipo === 'cuadro') return this.ctx.cuadros().opcionesMenu(r, () => this.tras());
    const { ui, sonido } = this.ctx;
    if (r.tipo === 'cartel') {
      return [{ icono: '✏️', texto: 'Cambiar texto', accion: () => { this.deseleccionar(); this.ctx.refrescarMenu && this.ctx.refrescarMenu(); this.ctx.abrirAjustes && this.ctx.abrirAjustes(); } }];
    }
    if (r.tipo === 'telefono') {
      return [{ icono: '☎️', texto: 'Mensajes', accion: () => { this.ctx.telefono.descolgado = 1.4; this.ctx.abrirTelefono(); } }];
    }
    const op = [{
      icono: '📏', texto: TAM_VENTANA[this.tamDe(r)].nombre, accion: () => {
        const orden = Object.keys(TAM_VENTANA);
        const i0 = orden.indexOf(this.tamDe(r));
        for (let k = 1; k < orden.length; k++) {
          const prueba = { ...r, tam: orden[(i0 + k) % orden.length] };
          this.ajustar(prueba);
          const [w, h] = this.medidas(prueba);
          if (this.choca({ x: prueba.x, y: prueba.y, w, h }, prueba.pared, r.id)) continue;
          Object.assign(r, { tam: prueba.tam, x: +prueba.x.toFixed(3), y: +prueba.y.toFixed(3) });
          sonido.tic();
          this.pintar();
          this.ctx.guardar();
          this.tras();
          return;
        }
        sonido.error();
        ui.aviso('No hay hueco para cambiarle el tamaño. Movedla primero', true);
      }
    }, {
      icono: '➕', texto: `Otra 🪙${PRECIO_VENTANA}`, desactivado: this.estado.monedas < PRECIO_VENTANA, accion: () => this.comprarVentana()
    }];
    if (!r.principal) {
      op.push({
        icono: '📤', texto: 'Quitar', accion: () => {
          this.deseleccionar();
          this.estado.paredObjs = this.lista().filter(x => x !== r);
          sonido.pop();
          this.pintar();
          this.ctx.guardar();
          this.tras();
        }
      });
    }
    return op;
  }

  tras() {
    if (this.sel) this.resaltar('sel');
    if (this.ctx.refrescarMenu) this.ctx.refrescarMenu();
  }

  colocar(o, nueva = false) {
    const { ui } = this.ctx;
    ui.cerrarHojas();
    this.colocando = { o: { ...o }, original: o, nueva, puesto: !nueva };
    const controles = this.ctx.controles();
    if (controles) controles.capturaToque = rayo => this.ponerEn(rayo);
    this.pintarBarra();
    this.barra.classList.remove('oculto');
    document.body.classList.add('colgando');
    this.pintar();
  }

  pintarBarra() {
    const { o, puesto } = this.colocando;
    const ventana = o.tipo === 'ventana';
    const tam = this.tamDe(o);
    this.barra.innerHTML = `
      <b>${puesto ? (ventana ? '👆 Toca otra pared para moverla' : '👆 Toca otra pared para moverlo') : '👆 Toca una pared para ponerla'}</b>
      ${ventana ? `<div class="cc-fila">${Object.entries(TAM_VENTANA).map(([k, t]) => `<button data-tam="${k}" class="${tam === k ? 'activo' : ''}">${t.nombre}</button>`).join('')}</div>` : ''}
      <div class="cc-botones"><button class="cc-cancelar">Cancelar</button><button class="cc-listo primario">✅ Listo</button></div>`;
    this.barra.querySelectorAll('[data-tam]').forEach(b => b.addEventListener('click', () => {
      const prueba = { ...o, tam: b.dataset.tam };
      this.ajustar(prueba);
      const [w, h] = this.medidas(prueba);
      if (this.colocando.puesto && this.choca({ x: prueba.x, y: prueba.y, w, h }, prueba.pared, o.id)) {
        this.ctx.sonido.error();
        this.ctx.ui.aviso('No cabe ahí. Movedla primero a un sitio con más hueco', true);
        return;
      }
      Object.assign(o, prueba);
      this.pintarBarra();
      this.pintar();
      this.ctx.sonido.tic();
    }));
    this.barra.querySelector('.cc-cancelar').addEventListener('click', () => this.terminar(false));
    this.barra.querySelector('.cc-listo').addEventListener('click', () => this.terminar(true));
  }

  ajustar(o) {
    const [w, h] = this.medidas(o);
    const lim = this.ctx.sala.largoPared(o.pared) / 2 - w / 2 - 0.04;
    o.x = Math.max(-lim, Math.min(lim, o.x));
    o.y = Math.max(h / 2 + 0.3, Math.min(ALTO - h / 2 - 0.04, o.y));
  }

  ponerEn(rayo) {
    const { sala, ui, sonido } = this.ctx;
    const muros = [];
    sala.paredes.forEach(p => { if (p.visible) muros.push(...p.userData.piezas); });
    const hit = rayo.intersectObjects(muros, false)[0];
    if (!hit) {
      ui.aviso('Toca una de las paredes que se ven', true);
      return;
    }
    const i = hit.object.userData.pared;
    const local = sala.paredes[i].worldToLocal(hit.point.clone());
    const o = this.colocando.o;
    const prueba = { ...o, pared: i, x: local.x, y: local.y };
    this.ajustar(prueba);
    const [w, h] = this.medidas(prueba);
    if (this.choca({ x: prueba.x, y: prueba.y, w, h }, i, o.id)) {
      sonido.error();
      ui.aviso('Ahí choca con otra cosa de la pared', true);
      return;
    }
    Object.assign(o, { pared: i, x: +prueba.x.toFixed(3), y: +prueba.y.toFixed(3) });
    this.colocando.puesto = true;
    sonido.colocar();
    this.pintarBarra();
    this.pintar();
  }

  terminar(guardar) {
    const col = this.colocando;
    if (!col) return;
    if (guardar && !col.puesto) {
      this.ctx.sonido.error();
      this.ctx.ui.aviso('Primero tocad una pared para ponerla', true);
      return;
    }
    this.colocando = null;
    const controles = this.ctx.controles();
    if (controles) controles.capturaToque = null;
    this.barra.classList.add('oculto');
    document.body.classList.remove('colgando');
    if (guardar) {
      if (col.nueva) this.lista().push(col.o);
      else Object.assign(col.original, col.o);
      this.ctx.sonido.arreglo();
      this.ctx.ui.aviso(`${col.o.tipo === 'ventana' ? '🪟' : '☎️'} ¡Puesto en la pared ${NOMBRE_PARED[col.o.pared]}!`);
      this.ctx.registrar && this.ctx.registrar('reformar');
    } else if (col.nueva) {
      this.estado.monedas += PRECIO_VENTANA;
      this.ctx.refrescarHud();
    }
    this.pintar();
    this.ctx.guardar();
  }
}
