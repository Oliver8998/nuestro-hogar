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
    return l.filter(o => o.hab === k);
  }

  tamDe(o) {
    if (o.tam && TAM_VENTANA[o.tam]) return o.tam;
    if (o.principal && this.ctx.ventanaGrande && this.ctx.ventanaGrande()) return 'l';
    return 'm';
  }

  medidas(o) {
    if (o.tipo === 'telefono') return [0.5, 0.7];
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
    obj.position.set(o.x, o.y, sala.cara + (o.tipo === 'ventana' ? 0 : 0));
  }

  pintar() {
    const { sala, telefono } = this.ctx;
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
  }

  actualizar(dt) {
    this.t += dt;
    if (this.t < 0.5) return;
    this.t = 0;
    if (this.colocando || this.ctx.visitando()) return;
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
        if (c.pared !== pared) continue;
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
    } else {
      this.reaccionVentana(h.obj);
    }
    return true;
  }

  mantener(rayo) {
    if (this.colocando || this.ctx.visitando() || this.ctx.sala.esExterior()) return false;
    const h = this.intersectar(rayo);
    if (!h || !h.id) return false;
    const o = this.lista().find(x => x.id === h.id);
    if (!o) return false;
    this.opciones(o);
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

  opciones(o) {
    const { ui } = this.ctx;
    const ventana = o.tipo === 'ventana';
    ui.dialogo({
      titulo: ventana ? '🪟 Ventana' : '☎️ Teléfono',
      texto: ventana ? 'Podéis moverla a otra pared, cambiarle el tamaño o poner más ventanas.' : 'Colgadlo en la pared que más os guste.',
      botones: [
        { texto: ventana ? '↔️ Mover o cambiar tamaño' : '↔️ Mover', tipo: 'primario', accion: () => setTimeout(() => this.colocar(o), 250) },
        ...(ventana ? [{ texto: `➕ Poner otra ventana · 🪙 ${PRECIO_VENTANA}`, tipo: 'secundario', accion: () => setTimeout(() => this.comprarVentana(), 250) }] : []),
        ...(ventana && !o.principal ? [{
          texto: '📤 Quitar esta ventana', tipo: 'secundario', accion: () => {
            this.estado.paredObjs = this.lista().filter(x => x !== o);
            this.ctx.sonido.pop();
            this.pintar();
            this.ctx.guardar();
          }
        }] : []),
        { texto: 'Cerrar', tipo: 'secundario' }
      ],
      columna: true
    });
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
    this.estado.monedas -= PRECIO_VENTANA;
    sonido.comprar();
    this.ctx.refrescarHud();
    const o = { id: `v${Date.now()}`, tipo: 'ventana', hab: this.ctx.claveHab(), pared: 0, x: 0, y: 1.5, tam: 'm' };
    this.colocar(o, true);
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
    const lim = 3 - w / 2 - 0.04;
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
