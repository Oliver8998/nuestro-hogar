import * as THREE from 'three';
import { NOMBRE_TEMPORADA } from './ambiente.js';

const CLAVE_FOTOS = 'hogar-fotos';
const CLAVE_DIARIO = 'hogar-diario';

const HUECOS_FOTO = [
  { pared: 3, x: -1.7, y: 1.55, w: 0.62, h: 0.78 },
  { pared: 3, x: -0.55, y: 1.7, w: 0.78, h: 0.58 },
  { pared: 3, x: 0.55, y: 1.45, w: 0.5, h: 0.62 },
  { pared: 3, x: 1.65, y: 1.65, w: 0.7, h: 0.86 },
  { pared: 2, x: -0.7, y: 1.55, w: 0.7, h: 0.54 },
  { pared: 2, x: 0.35, y: 1.75, w: 0.5, h: 0.62 },
  { pared: 0, x: -2.45, y: 1.6, w: 0.52, h: 0.66 },
  { pared: 0, x: 2.4, y: 1.55, w: 0.6, h: 0.48 }
];

function leer(clave, defecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch (e) {
    return defecto;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function reducirImagen(fuente, max = 640, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = reject;
    img.src = typeof fuente === 'string' ? fuente : URL.createObjectURL(fuente);
  });
}

export class Mas {
  constructor(ctx) {
    this.ctx = ctx;
    this.fotos = leer(CLAVE_FOTOS, []);
    this.diario = leer(CLAVE_DIARIO, []);
    this.marcos = [];
    this.cargador = new THREE.TextureLoader();
    this.montarCartel();
    this.pintarPared();
  }

  get estado() {
    return this.ctx.estado;
  }

  pareja() {
    if (!this.estado.pareja) this.estado.pareja = { nombres: ['', ''], aniversario: '', cumples: ['', ''], casa: 'Nuestro Hogar' };
    return this.estado.pareja;
  }

  nombresTexto() {
    const [a, b] = this.pareja().nombres;
    if (a && b) return `${a} & ${b}`;
    return a || b || '';
  }

  abrir() {
    const { ui } = this.ctx;
    const extras = this.ctx.extrasMenu ? this.ctx.extrasMenu() : [];
    const tiles = [
      ...extras,
      { id: 'foto', icono: '📸', texto: 'Foto de la casa', sub: 'Hazle una foto bonita y compártela' },
      { id: 'album', icono: '🖼️', texto: 'Vuestras fotos', sub: 'Subid fotos y colgadlas en la pared' },
      { id: 'diario', icono: '📔', texto: 'Diario del hogar', sub: 'El antes y el después de vuestra casa' },
      { id: 'ajustes', icono: '⚙️', texto: 'Ajustes', sub: 'Nombres, fechas especiales y sonido' }
    ];
    const cuerpo = ui.abrirGen('Más cosas', `<div class="mas-rejilla">${tiles.map(t => `
      <button class="mas-tile" data-id="${t.id}"><span>${t.icono}</span><b>${t.texto}</b><small>${t.sub}</small>${t.insignia ? `<i class="insignia">${t.insignia}</i>` : ''}</button>`).join('')}</div>`);
    cuerpo.querySelectorAll('.mas-tile').forEach(b => b.addEventListener('click', () => {
      this.ctx.sonido.tocar();
      const id = b.dataset.id;
      const extra = extras.find(t => t.id === id);
      if (extra) extra.accion();
      else if (id === 'foto') this.hacerFoto();
      else if (id === 'album') this.abrirAlbum();
      else if (id === 'diario') this.abrirDiario();
      else if (id === 'ajustes') this.abrirAjustes();
    }));
  }

  abrirAjustes() {
    const { ui, sonido } = this.ctx;
    const p = this.pareja();
    const cuerpo = ui.abrirGen('Ajustes', `
      <div class="ajustes">
        <label>Vuestros nombres</label>
        <div class="fila2"><input id="aj-n1" maxlength="14" placeholder="Tú" value="${escapar(p.nombres[0])}"><input id="aj-n2" maxlength="14" placeholder="Tu pareja" value="${escapar(p.nombres[1])}"></div>
        <label>Nombre de la casa</label>
        <input id="aj-casa" maxlength="22" value="${escapar(p.casa)}">
        <label>Aniversario 💍</label>
        <input id="aj-aniv" type="date" value="${escapar(p.aniversario)}">
        <label>Cumpleaños 🎂</label>
        <div class="fila2"><input id="aj-c1" type="date" value="${escapar(p.cumples[0])}"><input id="aj-c2" type="date" value="${escapar(p.cumples[1])}"></div>
        <small class="nota">Pilar os avisará en los días especiales (y habrá regalo 🎁).</small>
        <button id="aj-sonido" class="secundario">${sonido.activo ? '🔊 Sonido activado' : '🔇 Sonido desactivado'}</button>
        <button id="aj-guardar" class="primario">Guardar</button>
      </div>`, () => this.abrir());
    cuerpo.querySelector('#aj-sonido').addEventListener('click', e => {
      const on = sonido.alternar();
      e.currentTarget.textContent = on ? '🔊 Sonido activado' : '🔇 Sonido desactivado';
    });
    cuerpo.querySelector('#aj-guardar').addEventListener('click', () => {
      const v = id => cuerpo.querySelector(id).value.trim();
      p.nombres = [v('#aj-n1'), v('#aj-n2')];
      p.casa = v('#aj-casa') || 'Nuestro Hogar';
      p.aniversario = v('#aj-aniv');
      p.cumples = [v('#aj-c1'), v('#aj-c2')];
      this.montarCartel();
      this.ctx.guardar();
      sonido.arreglo();
      ui.aviso('✅ Guardado');
      this.ctx.alCambiarAjustes && this.ctx.alCambiarAjustes();
      this.abrir();
    });
  }

  montarCartel() {
    const { sala } = this.ctx;
    const p = this.pareja();
    const lienzo = document.createElement('canvas');
    lienzo.width = 512;
    lienzo.height = 176;
    const c = lienzo.getContext('2d');
    c.fillStyle = '#8a5a3c';
    c.beginPath();
    c.roundRect(4, 4, 504, 168, 26);
    c.fill();
    c.fillStyle = '#b07a4f';
    c.beginPath();
    c.roundRect(16, 16, 480, 144, 18);
    c.fill();
    c.strokeStyle = 'rgba(90, 55, 30, .25)';
    c.lineWidth = 3;
    for (let y = 40; y < 160; y += 28) {
      c.beginPath(); c.moveTo(24, y); c.bezierCurveTo(180, y + 6, 330, y - 6, 488, y); c.stroke();
    }
    c.fillStyle = '#fff6e8';
    c.textAlign = 'center';
    c.font = '900 54px Nunito, system-ui, sans-serif';
    c.fillText(p.casa || 'Nuestro Hogar', 256, 86, 460);
    const nombres = this.nombresTexto();
    c.font = '800 34px Nunito, system-ui, sans-serif';
    c.fillStyle = '#ffe0b8';
    c.fillText(nombres ? `♥ ${nombres} ♥` : '♥ ♥ ♥', 256, 134, 440);
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (!this.cartel) {
      const g = new THREE.Group();
      const placa = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.04), new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: 0.8 }));
      placa.castShadow = true;
      g.add(placa);
      const cara = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
      cara.position.z = 0.021;
      g.add(cara);
      for (const x of [-0.3, 0.3]) {
        const cuerda = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0xd9c29a }));
        cuerda.position.set(x * 0.55, 0.26, 0.0);
        cuerda.rotation.z = x > 0 ? 0.55 : -0.55;
        g.add(cuerda);
      }
      const clavo = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.5 }));
      clavo.position.set(0, 0.36, 0);
      g.add(clavo);
      g.position.set(-0.35, 2.1, sala.cara + 0.03);
      sala.paredes[0].add(g);
      this.cartel = { grupo: g, cara };
    } else {
      this.cartel.cara.material.map.dispose();
      this.cartel.cara.material.map = tex;
      this.cartel.cara.material.needsUpdate = true;
    }
  }

  guardarFotos() {
    if (!escribir(CLAVE_FOTOS, this.fotos)) {
      this.ctx.ui.aviso('No caben más fotos, borra alguna', true);
      return false;
    }
    return true;
  }

  pintarPared() {
    const { sala } = this.ctx;
    const pared = this.estado.paredFotos || [];
    HUECOS_FOTO.forEach((h, i) => {
      const id = pared[i];
      const foto = id ? this.fotos.find(f => f.id === id) : null;
      let m = this.marcos[i];
      if (!foto) {
        if (m) {
          m.grupo.visible = false;
          m.fotoId = null;
        }
        return;
      }
      if (!m) {
        const g = new THREE.Group();
        const borde = 0.05;
        const marco = new THREE.Mesh(new THREE.BoxGeometry(h.w + borde * 2, h.h + borde * 2, 0.04), new THREE.MeshStandardMaterial({ color: [0x8a5a3c, 0xf2efe9, 0x3d3d3d, 0xd9b98c][i % 4], roughness: 0.6 }));
        marco.castShadow = true;
        g.add(marco);
        const passe = new THREE.Mesh(new THREE.PlaneGeometry(h.w, h.h), new THREE.MeshStandardMaterial({ color: 0xfaf6ef, roughness: 0.9 }));
        passe.position.z = 0.021;
        g.add(passe);
        const img = new THREE.Mesh(new THREE.PlaneGeometry(h.w * 0.86, h.h * 0.86), new THREE.MeshStandardMaterial({ roughness: 0.6 }));
        img.position.z = 0.022;
        g.add(img);
        g.position.set(h.x, h.y, sala.cara + 0.025);
        g.rotation.z = (i % 2 ? 1 : -1) * 0.02;
        sala.paredes[h.pared].add(g);
        m = this.marcos[i] = { grupo: g, img, fotoId: null };
      }
      m.grupo.visible = true;
      if (m.fotoId !== foto.id) {
        m.fotoId = foto.id;
        this.cargador.load(foto.data, tex => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const kImg = tex.image.width / tex.image.height;
          const kHueco = h.w / h.h;
          tex.repeat.set(kImg > kHueco ? kHueco / kImg : 1, kImg > kHueco ? 1 : kImg / kHueco);
          tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
          if (m.img.material.map) m.img.material.map.dispose();
          m.img.material.map = tex;
          m.img.material.color.set(0xffffff);
          m.img.material.needsUpdate = true;
        });
      }
    });
  }

  abrirAlbum() {
    const { ui, sonido } = this.ctx;
    const pared = this.estado.paredFotos || [];
    const cuerpo = ui.abrirGen('Vuestras fotos', `
      <p class="gen-intro">Subid fotos vuestras y colgadlas en las paredes de casa. Se guardan solo en este móvil.</p>
      <label class="boton-subir primario">📷 Subir foto<input id="subir-foto" type="file" accept="image/*" hidden></label>
      <div class="album">${this.fotos.length ? this.fotos.map(f => `
        <button class="album-foto" data-id="${f.id}"><img src="${f.data}" alt="">${pared.includes(f.id) ? '<i>🖼️ En la pared</i>' : ''}</button>`).join('') : '<p class="vacio">Todavía no hay fotos.</p>'}</div>`, () => this.abrir());
    cuerpo.querySelector('#subir-foto').addEventListener('change', async e => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      try {
        const data = await reducirImagen(archivo, 640, 0.8);
        this.fotos.unshift({ id: `f${Date.now()}`, data, fecha: Date.now() });
        if (!this.guardarFotos()) {
          this.fotos.shift();
          return;
        }
        sonido.arreglo();
        this.abrirAlbum();
        this.elegirHueco(this.fotos[0]);
      } catch (err) {
        ui.aviso('No se pudo leer la foto', true);
      }
    });
    cuerpo.querySelectorAll('.album-foto').forEach(b => b.addEventListener('click', () => {
      const f = this.fotos.find(x => x.id === b.dataset.id);
      if (f) this.opcionesFoto(f);
    }));
  }

  opcionesFoto(f) {
    const { ui } = this.ctx;
    const pared = this.estado.paredFotos || [];
    const colgada = pared.includes(f.id);
    ui.dialogo({
      html: `<img class="foto-grande" src="${f.data}" alt="">`,
      botones: [
        colgada
          ? { texto: '📤 Quitar de la pared', tipo: 'secundario', accion: () => { pared[pared.indexOf(f.id)] = null; this.trasCambioPared(); } }
          : { texto: '🖼️ Colgar en la pared', tipo: 'primario', accion: () => setTimeout(() => this.elegirHueco(f), 250) },
        {
          texto: '🗑️ Borrar', tipo: 'rosa', accion: () => {
            const i = pared.indexOf(f.id);
            if (i >= 0) pared[i] = null;
            this.fotos = this.fotos.filter(x => x !== f);
            this.guardarFotos();
            this.trasCambioPared();
          }
        },
        { texto: 'Cerrar', tipo: 'secundario' }
      ],
      columna: true
    });
  }

  elegirHueco(f) {
    const { ui } = this.ctx;
    if (!this.estado.paredFotos) this.estado.paredFotos = [];
    const pared = this.estado.paredFotos;
    const nombres = { 0: 'Pared de la ventana', 2: 'Pared izquierda', 3: 'Pared derecha' };
    ui.dialogo({
      titulo: '¿Dónde la colgamos?',
      html: `<div class="huecos">${HUECOS_FOTO.map((h, i) => `<button class="hueco" data-i="${i}">${pared[i] ? '🖼️' : '⬜'} ${nombres[h.pared]} · ${i + 1}</button>`).join('')}</div>`,
      botones: [{ texto: 'Cancelar', tipo: 'secundario' }]
    });
    document.querySelectorAll('#dialogo .hueco').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      const antes = pared.indexOf(f.id);
      if (antes >= 0) pared[antes] = null;
      pared[i] = f.id;
      document.querySelector('#dialogo .dialogo-botones button').click();
      this.trasCambioPared();
      this.ctx.sonido.colocar();
      ui.aviso('🖼️ ¡Foto colgada!');
      this.ctx.alColgarFoto && this.ctx.alColgarFoto();
    }));
  }

  trasCambioPared() {
    this.pintarPared();
    this.ctx.guardar();
    if (this.ctx.ui.hojaAbierta === 'hoja-gen') this.abrirAlbum();
  }

  capturar(ancho = 900, recorte = 1) {
    const { renderer, escena, camara } = this.ctx;
    renderer.render(escena, camara);
    const fuente = renderer.domElement;
    const w = fuente.width;
    const h = fuente.height;
    const lado = Math.min(w, h * 0.62) * recorte;
    const sx = (w - lado) / 2;
    const sy = h * 0.5 - lado * 0.52;
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = ancho;
    c.getContext('2d').drawImage(fuente, sx, sy, lado, lado, 0, 0, ancho, ancho);
    return c;
  }

  hacerFoto() {
    const { ui, sonido, ambiente } = this.ctx;
    ui.cerrarHojas();
    setTimeout(() => {
      const foto = this.capturar(900);
      const marco = document.createElement('canvas');
      marco.width = 1000;
      marco.height = 1180;
      const c = marco.getContext('2d');
      c.fillStyle = '#fffaf2';
      c.fillRect(0, 0, 1000, 1180);
      const fondo = getComputedStyle(document.body).backgroundImage;
      c.fillStyle = document.body.classList.contains('noche') ? '#2b2b45' : '#f6ead9';
      c.fillRect(50, 50, 900, 900);
      c.drawImage(foto, 50, 50);
      c.fillStyle = '#3b2f26';
      c.textAlign = 'center';
      c.font = '900 56px Nunito, system-ui, sans-serif';
      c.fillText(this.pareja().casa || 'Nuestro Hogar', 500, 1040, 880);
      c.font = '700 32px Nunito, system-ui, sans-serif';
      c.fillStyle = '#8a7360';
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const nombres = this.nombresTexto();
      c.fillText(`${nombres ? nombres + ' · ' : ''}${fecha} ${ambiente ? ambiente.icono() : ''}`, 500, 1100, 880);
      void fondo;
      const url = marco.toDataURL('image/jpeg', 0.9);
      sonido.premio();
      ui.dialogo({
        html: `<img class="foto-grande" src="${url}" alt="">`,
        botones: [
          { texto: '📤 Compartir', tipo: 'primario', mantener: true, accion: () => this.compartir(url) },
          { texto: '📔 Guardar en el diario', tipo: 'secundario', accion: () => { this.anadirDiario('Foto de la casa', true); ui.aviso('📔 Guardada en el diario'); } },
          { texto: 'Cerrar', tipo: 'secundario' }
        ],
        columna: true
      });
      this.ctx.alFoto && this.ctx.alFoto();
    }, 380);
  }

  async compartir(url) {
    try {
      const blob = await (await fetch(url)).blob();
      const archivo = new File([blob], 'nuestro-hogar.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        await navigator.share({ files: [archivo], title: this.pareja().casa || 'Nuestro Hogar' });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nuestro-hogar.jpg';
    a.click();
  }

  anadirDiario(titulo, forzar = false) {
    const ultimo = this.diario[this.diario.length - 1];
    if (!forzar && ultimo && Date.now() - ultimo.fecha < 2 * 86400000) return;
    const data = this.capturar(420).toDataURL('image/jpeg', 0.72);
    this.diario.push({ fecha: Date.now(), titulo, data });
    while (this.diario.length > 24) this.diario.splice(1, 1);
    while (!escribir(CLAVE_DIARIO, this.diario) && this.diario.length > 2) this.diario.splice(1, 1);
  }

  revisarDiario() {
    if (!this.diario.length) this.anadirDiario('El primer día', true);
    else this.anadirDiario(`${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`);
  }

  abrirDiario() {
    const { ui } = this.ctx;
    const primero = this.diario[0];
    const ultimo = this.diario[this.diario.length - 1];
    const fecha = f => new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const cuerpo = ui.abrirGen('Diario del hogar', `
      ${primero && ultimo && primero !== ultimo ? `
      <div class="antes-despues">
        <div><img src="${primero.data}" alt=""><b>Antes</b><small>${fecha(primero.fecha)}</small></div>
        <div><img src="${ultimo.data}" alt=""><b>Ahora</b><small>${fecha(ultimo.fecha)}</small></div>
      </div>` : '<p class="gen-intro">Cada pocos días guardo una foto de cómo va la casa. ¡Volved en unos días para ver el antes y el después!</p>'}
      <button id="diario-ahora" class="secundario">📸 Guardar cómo está ahora</button>
      <div class="diario-lista">${this.diario.slice().reverse().map(d => `
        <div class="diario-entrada"><img src="${d.data}" alt=""><div><b>${escapar(d.titulo)}</b><small>${fecha(d.fecha)}</small></div></div>`).join('')}</div>`, () => this.abrir());
    cuerpo.querySelector('#diario-ahora').addEventListener('click', () => {
      ui.cerrarHojas();
      setTimeout(() => {
        this.anadirDiario('Así está ahora', true);
        this.ctx.sonido.arreglo();
        this.abrirDiario();
      }, 380);
    });
  }

  fechasEspeciales() {
    const p = this.pareja();
    const hoy = new Date();
    const md = `${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const lista = [];
    if (p.aniversario && p.aniversario.slice(5) === md) {
      const anios = hoy.getFullYear() - Number(p.aniversario.slice(0, 4));
      lista.push({ clave: `aniv-${hoy.getFullYear()}`, titulo: '¡Feliz aniversario! 💍', texto: anios > 0 ? `Hoy hace ${anios} año${anios > 1 ? 's' : ''} que estáis juntos. ¡Qué bonito! Os he dejado un regalo.` : '¡Hoy es vuestro día! Os he dejado un regalo.' });
    }
    p.cumples.forEach((c, i) => {
      if (c && c.slice(5) === md) {
        const n = p.nombres[i] || (i === 0 ? 'tu cumple' : 'el cumple de tu pareja');
        lista.push({ clave: `cumple${i}-${hoy.getFullYear()}`, titulo: '¡Feliz cumpleaños! 🎂', texto: `Hoy es el cumple de ${n}. ¡Muchas felicidades! Aquí tenéis un regalito.` });
      }
    });
    const t = this.ctx.ambiente ? this.ctx.temporada() : null;
    if (t && t !== 'aniversario') lista.push({ clave: `temp-${t}-${hoy.getFullYear()}`, titulo: NOMBRE_TEMPORADA[t], texto: 'Ha llegado una temporada especial: en la tienda hay cosas que solo están estos días. ¡Os regalo un ticket!', temporada: true });
    return lista;
  }

  proximaFecha() {
    const p = this.pareja();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechas = [];
    if (p.aniversario) fechas.push({ texto: 'vuestro aniversario', md: p.aniversario.slice(5) });
    p.cumples.forEach((c, i) => c && fechas.push({ texto: `el cumple de ${p.nombres[i] || (i ? 'tu pareja' : 'ti')}`, md: c.slice(5) }));
    let mejor = null;
    for (const f of fechas) {
      const [m, d] = f.md.split('-').map(Number);
      let fecha = new Date(hoy.getFullYear(), m - 1, d);
      if (fecha < hoy) fecha = new Date(hoy.getFullYear() + 1, m - 1, d);
      const dias = Math.round((fecha - hoy) / 86400000);
      if (!mejor || dias < mejor.dias) mejor = { ...f, dias };
    }
    return mejor;
  }
}
