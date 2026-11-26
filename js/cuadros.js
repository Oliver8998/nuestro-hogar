import * as THREE from 'three';

const HUECOS_VIEJOS = [
  { pared: 3, x: -1.7, y: 1.55 }, { pared: 3, x: -0.55, y: 1.7 }, { pared: 3, x: 0.55, y: 1.45 }, { pared: 3, x: 1.65, y: 1.65 },
  { pared: 2, x: -0.7, y: 1.55 }, { pared: 2, x: 0.35, y: 1.75 }, { pared: 0, x: -2.45, y: 1.6 }, { pared: 0, x: 2.4, y: 1.55 }
];

export const TAMANOS = { s: { nombre: 'Pequeño', l: 0.45 }, m: { nombre: 'Mediano', l: 0.7 }, l: { nombre: 'Grande', l: 1.0 }, xl: { nombre: 'Enorme', l: 1.4 } };
export const MARCOS = {
  madera: { nombre: 'Madera', color: 0x8a5a3c, borde: 0.05 },
  blanco: { nombre: 'Blanco', color: 0xf2efe9, borde: 0.05 },
  negro: { nombre: 'Negro', color: 0x2b2b2b, borde: 0.04 },
  dorado: { nombre: 'Dorado', color: 0xd4a84a, borde: 0.08, metal: 0.6 },
  polaroid: { nombre: 'Polaroid', color: 0xfdfbf6, borde: 0.04, polaroid: true },
  lienzo: { nombre: 'Lienzo', color: 0xf2efe9, borde: 0, lienzo: true }
};

const PARED_NOMBRE = { 0: 'la ventana', 1: 'enfrente', 2: 'la izquierda', 3: 'la derecha' };

export class Cuadros {
  constructor(mas) {
    this.mas = mas;
    this.grupos = [];
    this.texturas = new Map();
    this.colocando = null;
    const barra = document.createElement('div');
    barra.id = 'colocar-cuadro';
    barra.className = 'oculto';
    document.body.appendChild(barra);
    this.barra = barra;
  }

  get ctx() {
    return this.mas.ctx;
  }

  get estado() {
    return this.mas.estado;
  }

  lista() {
    if (!this.estado.cuadros) this.estado.cuadros = [];
    return this.estado.cuadros;
  }

  migrar() {
    const viejas = this.estado.paredFotos;
    if (!viejas || !viejas.some(Boolean)) return;
    const lista = this.lista();
    const hab = `${this.ctx.claveHab().split('-')[0]}-0`;
    viejas.forEach((id, i) => {
      if (!id || !HUECOS_VIEJOS[i] || lista.some(c => c.id === `c-${id}`)) return;
      const h = HUECOS_VIEJOS[i];
      lista.push({ id: `c-${id}`, foto: id, hab, pared: h.pared, x: h.x, y: h.y, tam: 'm', marco: ['madera', 'blanco', 'negro', 'madera'][i % 4] });
    });
    this.estado.paredFotos = [];
  }

  enEstaHab() {
    const k = this.ctx.claveHab();
    return this.lista().filter(c => c.hab === k);
  }

  medidas(c) {
    const L = TAMANOS[c.tam] ? TAMANOS[c.tam].l : 0.7;
    const k = c.k || 1;
    return k >= 1 ? [L, L / k] : [L * k, L];
  }

  textura(fotoId, alCargar) {
    if (this.texturas.has(fotoId)) {
      const t = this.texturas.get(fotoId);
      if (t.image) alCargar(t);
      else t.userData.esperando.push(alCargar);
      return;
    }
    const foto = this.mas.fotos.find(f => f.id === fotoId);
    if (!foto) return;
    const t = new THREE.Texture();
    t.userData.esperando = [alCargar];
    this.texturas.set(fotoId, t);
    const img = new Image();
    img.onload = () => {
      t.image = img;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      for (const f of t.userData.esperando) f(t);
      t.userData.esperando = [];
    };
    img.src = foto.data;
  }

  crear(c) {
    const { sala } = this.ctx;
    const marco = MARCOS[c.marco] || MARCOS.madera;
    const [w, h] = this.medidas(c);
    const g = new THREE.Group();
    const caja = (bw, bh, bd, color, op = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), new THREE.MeshStandardMaterial({ color, roughness: op.rug ?? 0.6, metalness: op.metal ?? 0 }));
      m.castShadow = true;
      g.add(m);
      return m;
    };
    let foto;
    if (marco.lienzo) {
      caja(w, h, 0.04, marco.color, { rug: 0.9 });
      foto = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ roughness: 0.85, color: 0xd9d2c8 }));
      foto.position.z = 0.0205;
    } else {
      const b = marco.borde;
      const extraAbajo = marco.polaroid ? Math.min(w, h) * 0.22 : 0;
      const f = caja(w + b * 2, h + b * 2 + extraAbajo, 0.035, marco.color, { metal: marco.metal, rug: marco.metal ? 0.35 : 0.6 });
      f.position.y = -extraAbajo / 2;
      if (marco.metal) {
        const interior = caja(w + b * 0.7, h + b * 0.7, 0.04, 0xb8893a, { metal: 0.6, rug: 0.4 });
        interior.position.z = 0.002;
      }
      const ventana = marco.polaroid ? 1 : 0.88;
      if (!marco.polaroid) {
        const passe = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xfaf6ef, roughness: 0.9 }));
        passe.position.z = 0.0235;
        g.add(passe);
      }
      foto = new THREE.Mesh(new THREE.PlaneGeometry(w * ventana, h * ventana), new THREE.MeshStandardMaterial({ roughness: 0.55, color: 0xd9d2c8 }));
      foto.position.z = 0.024;
    }
    g.add(foto);
    this.textura(c.foto, tex => {
      foto.material.map = tex;
      foto.material.color.set(0xffffff);
      foto.material.needsUpdate = true;
      const img = tex.image;
      if (img && !c.k) {
        c.k = img.width / img.height;
        this.pintar();
      }
    });
    g.position.set(c.x, c.y, sala.cara + 0.02);
    g.userData.cuadro = c.id;
    g.traverse(o => { o.userData.cuadro = c.id; });
    const pared = sala.paredes[c.pared];
    if (pared) pared.add(g);
    return g;
  }

  quitarGrupos() {
    for (const g of this.grupos) {
      if (g.parent) g.parent.remove(g);
      g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    this.grupos = [];
  }

  pintar() {
    this.migrar();
    this.quitarGrupos();
    if (this.ctx.sala.esExterior && this.ctx.sala.esExterior()) return;
    const lista = [...this.enEstaHab()];
    if (this.colocando && this.colocando.c.hab === this.ctx.claveHab() && this.colocando.puesto) {
      const i = lista.findIndex(c => c.id === this.colocando.c.id);
      if (i >= 0) lista[i] = this.colocando.c;
      else lista.push(this.colocando.c);
    }
    for (const c of lista) {
      if (!(this.colocando && this.colocando.c.id === c.id) && this.ctx.sala.enHueco && this.ctx.sala.enHueco(c.pared, c.x || 0)) continue;
      const g = this.crear(c);
      if (this.colocando && this.colocando.c.id === c.id) g.userData.colocando = true;
      this.grupos.push(g);
    }
  }

  ocultar() {
    this.quitarGrupos();
  }

  intersectar(rayo) {
    const mallas = [];
    for (const g of this.grupos) {
      if (!g.parent || !g.parent.visible) continue;
      g.traverse(o => { if (o.isMesh) mallas.push(o); });
    }
    const hit = rayo.intersectObjects(mallas, false)[0];
    return hit ? { id: hit.object.userData.cuadro, distancia: hit.distance } : null;
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
    const c = this.lista().find(x => x.id === h.id);
    if (c) this.opciones(c);
    return !!c;
  }

  opciones(c) {
    const { ui, sonido } = this.ctx;
    const foto = this.mas.fotos.find(f => f.id === c.foto);
    ui.dialogo({
      html: foto ? `<img class="foto-grande" src="${foto.data}" alt="">` : '',
      titulo: foto && foto.pintura ? '🎨 Vuestro cuadro' : '🖼️ Cuadro',
      texto: 'Mantenlo pulsado para moverlo o cambiarle el marco',
      botones: [
        ...(foto && foto.pintura ? [{ texto: '🖌️ Retocar el cuadro', tipo: 'secundario', accion: () => setTimeout(() => this.mas.retocar(foto), 250) }] : []),
        { texto: 'Cerrar', tipo: 'primario' }
      ],
      columna: true
    });
  }

  opcionesMenu(c, tras) {
    const { ui, sonido } = this.ctx;
    const po = this.ctx.paredObjs;
    const foto = this.mas.fotos.find(f => f.id === c.foto);
    const cabe = prueba => {
      this.ajustar(prueba);
      const [w, h] = this.medidas(prueba);
      return !po || !po.choca({ x: prueba.x, y: prueba.y, w: w + 0.1, h: h + 0.1 }, prueba.pared, c.id, true);
    };
    const op = [{
      icono: '📏', texto: (TAMANOS[c.tam] || TAMANOS.m).nombre, accion: () => {
        const orden = Object.keys(TAMANOS);
        const i0 = Math.max(0, orden.indexOf(c.tam));
        for (let k = 1; k < orden.length; k++) {
          const prueba = { ...c, tam: orden[(i0 + k) % orden.length] };
          if (!cabe(prueba)) continue;
          Object.assign(c, { tam: prueba.tam, x: +prueba.x.toFixed(3), y: +prueba.y.toFixed(3) });
          sonido.tic();
          this.pintar();
          this.ctx.guardar();
          tras();
          return;
        }
        sonido.error();
        ui.aviso('No hay hueco para cambiarle el tamaño. Movedlo primero', true);
      }
    }, {
      icono: '🖼️', texto: (MARCOS[c.marco] || MARCOS.madera).nombre, accion: () => {
        const orden = Object.keys(MARCOS);
        c.marco = orden[(Math.max(0, orden.indexOf(c.marco)) + 1) % orden.length];
        sonido.tic();
        this.pintar();
        this.ctx.guardar();
        tras();
      }
    }];
    if (foto && foto.pintura) op.push({ icono: '🖌️', texto: 'Retocar', accion: () => this.mas.retocar(foto) });
    op.push({
      icono: '📤', texto: 'Descolgar', accion: () => {
        if (po) po.deseleccionar();
        this.estado.cuadros = this.lista().filter(x => x !== c);
        sonido.pop();
        this.pintar();
        this.ctx.guardar();
        tras();
      }
    });
    return op;
  }

  colocar(fotoId, existente = null) {
    const { ui, sala } = this.ctx;
    if (sala.esExterior()) {
      ui.aviso('Aquí fuera no hay paredes. Entrad en una habitación', true);
      return;
    }
    ui.cerrarHojas();
    const anterior = this.lista().find(x => existente && x.id === existente.id);
    const c = existente ? { ...existente } : { id: `c${Date.now()}`, foto: fotoId, hab: this.ctx.claveHab(), pared: 3, x: 0, y: 1.55, tam: 'm', marco: (this.mas.fotos.find(f => f.id === fotoId) || {}).pintura ? 'lienzo' : 'madera' };
    if (existente) c.hab = this.ctx.claveHab();
    this.colocando = { c, puesto: !!existente, anterior };
    if (existente) this.estado.cuadros = this.lista().filter(x => x.id !== existente.id);
    const controles = this.ctx.controles();
    if (controles) controles.capturaToque = rayo => this.ponerEn(rayo);
    this.textura(fotoId, tex => {
      if (tex.image && !c.k) {
        c.k = tex.image.width / tex.image.height;
        this.pintar();
      }
    });
    this.pintarBarra();
    this.barra.classList.remove('oculto');
    document.body.classList.add('colgando');
    this.pintar();
  }

  pintarBarra() {
    const { c, puesto } = this.colocando;
    this.barra.innerHTML = `
      <b>${puesto ? '👆 Toca otra pared para moverlo' : '👆 Toca una pared para colgarlo'}</b>
      <div class="cc-fila">${Object.entries(TAMANOS).map(([k, t]) => `<button data-tam="${k}" class="${c.tam === k ? 'activo' : ''}">${t.nombre}</button>`).join('')}</div>
      <div class="cc-fila">${Object.entries(MARCOS).map(([k, m]) => `<button data-marco="${k}" class="${c.marco === k ? 'activo' : ''}"><i style="background:#${m.color.toString(16).padStart(6, '0')}"></i>${m.nombre}</button>`).join('')}</div>
      <div class="cc-botones"><button class="cc-cancelar">Cancelar</button><button class="cc-listo primario">✅ Listo</button></div>`;
    this.barra.querySelectorAll('[data-tam]').forEach(b => b.addEventListener('click', () => {
      c.tam = b.dataset.tam;
      this.ajustar(c);
      this.pintarBarra();
      this.pintar();
      this.ctx.sonido.tic();
    }));
    this.barra.querySelectorAll('[data-marco]').forEach(b => b.addEventListener('click', () => {
      c.marco = b.dataset.marco;
      this.pintarBarra();
      this.pintar();
      this.ctx.sonido.tic();
    }));
    this.barra.querySelector('.cc-cancelar').addEventListener('click', () => this.terminar(false));
    this.barra.querySelector('.cc-listo').addEventListener('click', () => this.terminar(true));
  }

  ajustar(c) {
    const [w, h] = this.medidas(c);
    const lim = this.ctx.sala.largoPared(c.pared) / 2 - w / 2 - (MARCOS[c.marco] ? MARCOS[c.marco].borde : 0.05) - 0.05;
    c.x = Math.max(-lim, Math.min(lim, c.x));
    c.y = Math.max(h / 2 + 0.35, Math.min(2.5 - h / 2, c.y));
  }

  choca(c) {
    const [w, h] = this.medidas(c);
    const b = (MARCOS[c.marco] ? MARCOS[c.marco].borde : 0.05) * 2;
    const po = this.ctx.paredObjs;
    if (po) return po.choca({ x: c.x, y: c.y, w: w + b, h: h + b }, c.pared, null, false);
    if (c.pared === 1) return Math.abs(c.x + 1) < 0.56 + w / 2 && c.y - h / 2 < 2.15;
    return false;
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
    const c = this.colocando.c;
    const prueba = { ...c, pared: i, x: local.x, y: local.y };
    this.ajustar(prueba);
    if (this.choca(prueba)) {
      sonido.error();
      ui.aviso('Ahí choca con otra cosa de la pared', true);
      return;
    }
    Object.assign(c, { pared: i, x: +prueba.x.toFixed(3), y: +prueba.y.toFixed(3) });
    this.colocando.puesto = true;
    sonido.colocar();
    this.pintar();
  }

  terminar(guardar) {
    const col = this.colocando;
    if (!col) return;
    if (guardar && !col.puesto) {
      this.ctx.sonido.error();
      this.ctx.ui.aviso('Primero tocad una pared para colgarlo', true);
      return;
    }
    this.colocando = null;
    const controles = this.ctx.controles();
    if (controles) controles.capturaToque = null;
    this.barra.classList.add('oculto');
    document.body.classList.remove('colgando');
    if (guardar && col.puesto) {
      this.lista().push(col.c);
      this.ctx.sonido.arreglo();
      this.ctx.ui.aviso(`🖼️ ¡Colgado en la pared de ${PARED_NOMBRE[col.c.pared]}!`);
      this.ctx.registrar && this.ctx.registrar('colgar-cuadro');
      this.ctx.alColgarFoto && this.ctx.alColgarFoto();
    } else if (col.anterior) {
      this.lista().push(col.anterior);
    }
    this.pintar();
    this.ctx.guardar();
  }
}
