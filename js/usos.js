import * as THREE from 'three';

const FASE_HUERTO = ['Vacío', 'Brotes', 'Creciendo', '¡Listo para cosechar!'];
const ESPERA_HUERTO = 75 * 60000;
const TRABAJOS = [
  { min: 30, pago: 30, texto: 'Media hora' },
  { min: 120, pago: 95, texto: '2 horas' },
  { min: 480, pago: 260, texto: 'Jornada (8 h)' }
];

const ESCALA = [261.6, 293.7, 329.6, 349.2, 392, 440, 493.9, 523.3, 587.3, 659.3, 698.5, 784, 880, 987.8];
const NEGRAS = { 0: 277.2, 1: 311.1, 3: 370, 4: 415.3, 5: 466.2, 7: 554.4, 8: 622.3, 10: 740, 11: 830.6, 12: 932.3 };
const CANCIONES = [
  [[0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0], 'Estrellita'],
  [[2, 1, 0, 1, 2, 2, 2, -1, 1, 1, 1, -1, 2, 4, 4], 'Cumpleaños feliz']
];

function ahora() {
  return Date.now();
}

export class Usos {
  constructor(ctx) {
    this.ctx = ctx;
    this.musica = null;
    this.teles = new Map();
    this.t = 0;
  }

  get estado() {
    return this.ctx.estado;
  }

  textoTiempo(ms) {
    const min = Math.max(1, Math.ceil(ms / 60000));
    return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
  }

  huerto(m) {
    if (!m.userData.datos) m.userData.datos = { fase: 0, listoEn: null };
    const d = m.userData.datos;
    if (d.listoEn && ahora() >= d.listoEn && d.fase < 3) {
      d.fase++;
      d.listoEn = null;
    }
    return d;
  }

  aplicarHuerto(m) {
    const d = this.huerto(m);
    const mallas = m.userData.mallas;
    if (!mallas[4]) return;
    mallas[2].visible = d.fase >= 1;
    mallas[3].visible = d.fase >= 2;
    mallas[3].scale.y = d.fase >= 3 ? 1 : 0.55;
    mallas[4].visible = d.fase >= 3;
    for (const o of m.userData.todas || []) if (o.parent === mallas[4] || o.parent === mallas[3] || o.parent === mallas[2]) o.visible = o.parent.visible;
  }

  ordenador(m) {
    const t = this.estado.trabajo;
    const trabajando = t && ahora() < t.fin;
    if (m.userData.encendido !== !!t) {
      m.userData.encendido = !!t;
      this.ctx.gestor.aplicarApariencia(m);
    }
    return { t, trabajando };
  }

  opciones(m) {
    const def = m.userData.def;
    const { ui, sonido, guardar } = this.ctx;
    const ops = [];
    if (m.userData.datos && m.userData.datos.tirado) {
      ops.push({ icono: '🙌', texto: 'Levantar', accion: () => { m.userData.datos.tirado = false; m.userData.rebote = 0.8; sonido.arreglo(); guardar(); this.ctx.refrescarMenu(); } });
    }
    if (def.huerto) {
      const d = this.huerto(m);
      if (d.fase === 0) ops.push({ icono: '🌱', texto: 'Plantar', accion: () => { d.fase = 1; d.listoEn = null; sonido.pop(); ui.aviso('🌱 ¡Plantado! Ahora regadlo'); this.aplicarHuerto(m); guardar(); this.ctx.refrescarMenu(); } });
      else if (d.fase < 3 && !d.listoEn) ops.push({ icono: '💧', texto: 'Regar', accion: () => { d.listoEn = ahora() + ESPERA_HUERTO; sonido.arreglo(); this.ctx.particulaEn(m, '💧', 4); ui.aviso(`💧 Regado. Crecerá en ${this.textoTiempo(ESPERA_HUERTO)}`); guardar(); this.ctx.refrescarMenu(); } });
      else if (d.fase < 3) ops.push({ icono: '⏳', texto: this.textoTiempo(d.listoEn - ahora()), accion: () => ui.aviso(`🌿 ${FASE_HUERTO[d.fase]}. Crecerá en ${this.textoTiempo(d.listoEn - ahora())}`) });
      else ops.push({ icono: '🍅', texto: 'Cosechar', accion: () => { d.fase = 0; d.listoEn = null; this.ctx.ganar(70, m, '🍅'); this.ctx.registrar('cosechar'); this.aplicarHuerto(m); guardar(); this.ctx.refrescarMenu(); } });
    }
    if (def.ordenador) {
      const { t, trabajando } = this.ordenador(m);
      if (!t) ops.push({ icono: '💻', texto: 'Trabajar', accion: () => this.elegirTrabajo(m) });
      else if (trabajando) ops.push({ icono: '⏳', texto: this.textoTiempo(t.fin - ahora()), accion: () => ui.aviso(`💻 Trabajando… cobraréis 🪙 ${t.pago} en ${this.textoTiempo(t.fin - ahora())}`) });
      else ops.push({ icono: '💰', texto: `Cobrar ${t.pago}`, accion: () => { this.estado.trabajo = null; this.ctx.ganar(t.pago, m, '💼'); this.ctx.registrar('trabajar'); this.ordenador(m); guardar(); this.ctx.refrescarMenu(); } });
    }
    if (def.id === 'nevera' && this.ctx.pareja) {
      const n = (this.estado.notas || []).length;
      ops.push({ icono: '📝', texto: n ? `Notas (${n})` : 'Nota', accion: () => (n ? this.ctx.pareja.verNotas() : this.ctx.pareja.escribirNota()) });
    }
    if (def.id === 'tele') {
      ops.push({ icono: '📺', texto: m.userData.encendido ? 'Apagar' : 'Dibujos', accion: () => { this.ctx.gestor.alternarEncendido(m); this.ctx.mascotasMirar && m.userData.encendido && this.ctx.mascotasMirar(m); sonido.pop(); guardar(); this.ctx.refrescarMenu(); } });
    }
    if (def.id === 'arbol-recuerdos' && this.ctx.pareja) {
      ops.push({ icono: '📜', texto: 'Recuerdos', accion: () => this.ctx.pareja.verRecuerdos() });
    }
    if (def.id === 'radio' && this.estado.pareja && this.estado.pareja.cancion) {
      ops.push({ icono: '💕', texto: 'Nuestra canción', accion: () => { window.open(this.estado.pareja.cancion, '_blank'); this.ctx.registrar('cancion'); } });
    }
    if (def.id === 'radio') {
      ops.push({ icono: this.musica ? '🔇' : '🎵', texto: this.musica ? 'Parar' : 'Música', accion: () => { this.alternarMusica(m); this.ctx.refrescarMenu(); } });
    }
    if (def.id === 'piano') ops.push({ icono: '🎹', texto: 'Tocar', accion: () => this.abrirPiano() });
    if (def.id === 'sofa' || def.id === 'sillon-huevo' || def.id === 'puff' || def.id === 'puff-corazon') {
      ops.push({ icono: '🛋️', texto: 'Relax', accion: () => { const n = this.ctx.mascotas.alSofa(m); sonido.mascota(); ui.aviso(n ? '🛋️ ¡Las mascotas se suben a hacer compañía!' : '🛋️ Un ratito de relax… (con mascotas sería mejor)'); this.ctx.registrar('relax'); } });
    }
    return ops;
  }

  elegirTrabajo(m) {
    const { ui, sonido, guardar } = this.ctx;
    ui.dialogo({
      imagen: this.ctx.miniaturas.item('ordenador'),
      titulo: 'Teletrabajo',
      texto: 'Elegid cuánto tiempo trabajáis. Podéis cerrar el juego: al volver, a cobrar.',
      botones: [...TRABAJOS.map(t => ({
        texto: `${t.texto} · 🪙 ${t.pago}`, tipo: 'primario', accion: () => {
          this.estado.trabajo = { fin: ahora() + t.min * 60000, pago: t.pago };
          this.ordenador(m);
          sonido.comprar();
          ui.aviso(`💻 ¡A trabajar! Cobraréis en ${t.texto.toLowerCase()}`);
          guardar();
          this.ctx.refrescarMenu();
        }
      })), { texto: 'Ahora no', tipo: 'secundario' }],
      columna: true
    });
  }

  alternarMusica(m) {
    const { sonido } = this.ctx;
    if (this.musica) {
      clearInterval(this.musica.id);
      this.musica = null;
      return;
    }
    const acordes = [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]];
    let paso = 0;
    const tocar = () => {
      const a = acordes[Math.floor(paso / 8) % acordes.length];
      if (paso % 8 === 0) a.forEach((n, i) => sonido.tono(ESCALA[n] / 2, i * 0.02, 1.6, { tipo: 'sine', volumen: 0.035 }));
      if (paso % 2 === 0) sonido.tono(ESCALA[a[Math.floor(Math.random() * 3)] + (Math.random() < 0.5 ? 7 : 0)] || 523, 0, 0.35, { tipo: 'triangle', volumen: 0.045 });
      if (paso % 4 === 2) sonido.tono(90, 0, 0.12, { tipo: 'sine', hasta: 50, volumen: 0.08 });
      if (paso % 4 === 0 && this.musica && this.musica.m) this.ctx.particulaEn(this.musica.m, Math.random() < 0.5 ? '🎵' : '🎶', 1);
      paso++;
    };
    this.musica = { id: setInterval(tocar, 260), m };
    tocar();
  }

  abrirPiano() {
    const { sonido, ui } = this.ctx;
    ui.cerrarMenu && ui.cerrarMenu();
    const capa = document.createElement('div');
    capa.id = 'piano';
    const blancas = ESCALA.slice(0, 11);
    capa.innerHTML = `
      <div class="piano-caja">
        <div class="piano-cabecera"><b>🎹 Piano</b><div>${CANCIONES.map((c, i) => `<button class="cancion" data-i="${i}">▶ ${c[1]}</button>`).join('')}</div><button class="cerrar">✕</button></div>
        <div class="teclado">${blancas.map((f, i) => `<button class="blanca" data-f="${f}" data-i="${i}">${NEGRAS[i] ? `<span class="negra" data-f="${NEGRAS[i]}"></span>` : ''}</button>`).join('')}</div>
        <small>Toca las teclas o pulsa una canción para que te enseñe</small>
      </div>`;
    document.body.appendChild(capa);
    requestAnimationFrame(() => capa.classList.add('abierto'));
    const sonar = (f, el) => {
      sonido.tono(f, 0, 0.9, { tipo: 'triangle', volumen: 0.13 });
      sonido.tono(f * 2, 0, 0.5, { tipo: 'sine', volumen: 0.03 });
      el.classList.add('pulsada');
      setTimeout(() => el.classList.remove('pulsada'), 160);
    };
    capa.querySelectorAll('.negra').forEach(n => n.addEventListener('pointerdown', e => { e.stopPropagation(); sonar(Number(n.dataset.f), n); }));
    capa.querySelectorAll('.blanca').forEach(b => b.addEventListener('pointerdown', () => sonar(Number(b.dataset.f), b)));
    capa.querySelectorAll('.cancion').forEach(b => b.addEventListener('click', () => {
      const [notas] = CANCIONES[Number(b.dataset.i)];
      const teclas = capa.querySelectorAll('.blanca');
      notas.forEach((n, k) => setTimeout(() => {
        if (n < 0) return;
        teclas[n].classList.add('guia');
        setTimeout(() => teclas[n].classList.remove('guia'), 380);
        sonar(ESCALA[n], teclas[n]);
      }, k * 420));
    }));
    capa.querySelector('.cerrar').addEventListener('click', () => {
      capa.classList.remove('abierto');
      setTimeout(() => capa.remove(), 250);
    });
    this.ctx.registrar('piano');
  }

  pantallaTele(m) {
    let t = this.teles.get(m);
    if (!t) {
      const lienzo = document.createElement('canvas');
      lienzo.width = 128;
      lienzo.height = 80;
      const tex = new THREE.CanvasTexture(lienzo);
      tex.colorSpace = THREE.SRGBColorSpace;
      t = { lienzo, ctx: lienzo.getContext('2d'), tex };
      this.teles.set(m, t);
    }
    return t;
  }

  dibujarTele(m) {
    const malla = m.userData.mallas[2];
    if (!m.userData.encendido) {
      if (malla.material.map) {
        malla.material.map = null;
        malla.material.color.setHex(m.userData.def.piezas[2][6]);
        malla.material.needsUpdate = true;
      }
      return;
    }
    const t = this.pantallaTele(m);
    const c = t.ctx;
    const k = this.t;
    const escena = Math.floor(k / 6) % 3;
    const cielo = ['#8fd3f4', '#ffd6a5', '#c3b5f0'][escena];
    c.fillStyle = cielo;
    c.fillRect(0, 0, 128, 80);
    c.fillStyle = '#7cc46a';
    c.fillRect(0, 58, 128, 22);
    c.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      const x = ((k * 10 + i * 50) % 170) - 30;
      c.beginPath(); c.arc(x, 16 + i * 6, 7, 0, 7); c.arc(x + 9, 14 + i * 6, 9, 0, 7); c.arc(x + 18, 16 + i * 6, 7, 0, 7); c.fill();
    }
    const x = 64 + Math.sin(k * 1.3) * 34;
    const y = 50 - Math.abs(Math.sin(k * 4)) * 14;
    c.fillStyle = ['#f28aa0', '#f2d06b', '#6cc08a'][escena];
    c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(x + 3, y - 3, 3.5, 0, 7); c.arc(x - 4, y - 3, 3.5, 0, 7); c.fill();
    c.fillStyle = '#222';
    c.beginPath(); c.arc(x + 3.5, y - 3, 1.6, 0, 7); c.arc(x - 3.5, y - 3, 1.6, 0, 7); c.fill();
    c.strokeStyle = '#222';
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(x, y + 2, 4, 0.2, Math.PI - 0.2); c.stroke();
    t.tex.needsUpdate = true;
    if (malla.material.map !== t.tex) {
      malla.material.map = t.tex;
      malla.material.color.set(0xffffff);
      malla.material.needsUpdate = true;
    }
    malla.material.emissive.set(0x444444);
    malla.material.emissiveIntensity = 0.6;
  }

  propsPlanes() {
    const activos = this.ctx.pareja ? new Set(this.ctx.pareja.planesActivos().map(p => p.tipo)) : new Set();
    if (!this.props) this.props = {};
    const mat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...extra });
    const crear = tipo => {
      const g = new THREE.Group();
      const muebles = this.ctx.gestor.muebles;
      const buscar = ids => muebles.find(m => ids.includes(m.userData.def.id));
      if (tipo === 'viaje') {
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.22), mat(0xe05050));
        cuerpo.position.y = 0.3;
        const asa = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), mat(0x333333));
        asa.position.y = 0.58;
        const ruedas = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.18), mat(0x333333));
        ruedas.position.y = 0.02;
        const pegatina = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 12), mat(0xf2d06b));
        pegatina.rotation.x = Math.PI / 2;
        pegatina.position.set(0.08, 0.35, 0.115);
        g.add(cuerpo, asa, ruedas, pegatina);
        g.position.set(1.6, 0, 2.6);
        g.rotation.y = 0.3;
      } else if (tipo === 'cena' || tipo === 'cine') {
        const base = buscar(tipo === 'cena' ? ['mesa', 'escritorio', 'mesita'] : ['mesa', 'mesita', 'sofa', 'tele']);
        const y = base ? base.userData.base + base.userData.alto : 0;
        if (tipo === 'cena') {
          for (const dx of [-0.1, 0.1]) {
            const vela = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), mat(0xf7f3e8));
            vela.position.set(dx, y + 0.09, 0);
            const llama = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mat(0xffc040, { emissive: 0xffa020, emissiveIntensity: 2 }));
            llama.scale.y = 1.6;
            llama.position.set(dx, y + 0.21, 0);
            g.add(vela, llama);
          }
          const luz = new THREE.PointLight(0xffa040, 0.8, 2.5);
          luz.position.set(0, y + 0.3, 0);
          g.add(luz);
        } else {
          const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.12, 14), mat(0xe05050));
          bol.position.y = y + 0.06;
          g.add(bol);
          for (let k = 0; k < 10; k++) {
            const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0xfff3d0));
            const a = k * 2.4;
            p.position.set(Math.cos(a) * 0.06, y + 0.13 + (k % 3) * 0.02, Math.sin(a) * 0.06);
            g.add(p);
          }
        }
        if (base) g.position.set(base.position.x, 0, base.position.z);
      } else if (tipo === 'fiesta' || tipo === 'otro') {
        const colores = [0xe05070, 0x5a9fd6, 0xf2d06b, 0x6cc08a];
        for (let k = 0; k < (tipo === 'fiesta' ? 4 : 2); k++) {
          const globo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat(colores[k], { roughness: 0.35 }));
          globo.scale.y = 1.2;
          globo.position.set(k * 0.18 - 0.25, 1.5 + (k % 2) * 0.2, (k % 2) * 0.1);
          const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.4, 4), mat(0xffffff));
          hilo.position.set(k * 0.18 - 0.25, 0.75 + (k % 2) * 0.1, (k % 2) * 0.1);
          g.add(globo, hilo);
        }
        g.position.set(-2.4, 0, -2.4);
      }
      g.traverse(o => { if (o.isMesh) o.castShadow = true; });
      return g;
    };
    for (const tipo of ['viaje', 'cena', 'cine', 'fiesta', 'otro']) {
      const debe = activos.has(tipo);
      if (debe && !this.props[tipo]) {
        this.props[tipo] = crear(tipo);
        this.ctx.escena.add(this.props[tipo]);
      } else if (!debe && this.props[tipo]) {
        this.ctx.escena.remove(this.props[tipo]);
        this.props[tipo] = null;
      }
    }
  }

  hojasRecuerdo(m) {
    const n = Math.min(60, (this.estado.recuerdos || []).length);
    if (m.userData.nHojas === n) return;
    if (m.userData.hojas) {
      m.remove(m.userData.hojas);
      m.userData.hojas.traverse(o => o.isMesh && o.material.dispose());
    }
    const g = new THREE.Group();
    const geo = this.geoHoja || (this.geoHoja = new THREE.SphereGeometry(0.05, 8, 6));
    const colores = [0xf4a3b0, 0xf2d06b, 0x8fd08a, 0xe58f9e, 0xb39ddb];
    for (let i = 0; i < n; i++) {
      const a = i * 2.399;
      const y = 1.0 + ((i * 0.37) % 1) * 0.5;
      const r = 0.3 * Math.sin(Math.PI * (y - 0.95) / 0.6) + 0.05;
      const hoja = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colores[i % colores.length], roughness: 0.6 }));
      hoja.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      hoja.scale.set(1, 0.6, 1.3);
      hoja.castShadow = true;
      g.add(hoja);
    }
    m.add(g);
    m.userData.hojas = g;
    m.userData.nHojas = n;
  }

  actualizar(dt) {
    this.t += dt;
    this.tDibujo = (this.tDibujo || 0) + dt;
    const dibujar = this.tDibujo > 1 / 12;
    if (dibujar) this.tDibujo = 0;
    this.tLento = (this.tLento || 0) + dt;
    const lento = this.tLento > 2;
    if (lento) this.tLento = 0;
    for (const m of this.ctx.gestor.muebles) {
      const def = m.userData.def;
      if (def.id === 'tele' && dibujar) this.dibujarTele(m);
      if (lento && def.huerto) this.aplicarHuerto(m);
      if (lento && def.ordenador) this.ordenador(m);
      if (lento && def.id === 'arbol-recuerdos') this.hojasRecuerdo(m);
    }
    if (this.musica && !this.ctx.gestor.muebles.includes(this.musica.m)) this.alternarMusica();
    if (lento) this.propsPlanes();
  }
}
