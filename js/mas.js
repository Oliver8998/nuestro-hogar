import { editarFoto } from './fotoeditor.js';
import { Cuadros } from './cuadros.js';
import { pintarCuadro } from './pintar.js';
import { idioma, ponerIdioma, traducirTexto } from './i18n.js';
import * as THREE from 'three';
import { NOMBRE_TEMPORADA } from './ambiente.js';

const CLAVE_FOTOS = 'hogar-fotos';
const CLAVE_DIARIO = 'hogar-diario';
const CLAVE_POSTALES = 'hogar-postales';

function leerLS(clave, def) {
  try {
    return localStorage.getItem(clave) || def;
  } catch (e) {
    return def;
  }
}

export function tamTexto() {
  return leerLS('hogar-texto', 'normal');
}

function modoAvisos() {
  return leerLS('hogar-avisos-modo', 'todos');
}

export function aplicarTamTexto(v = tamTexto()) {
  document.body.classList.toggle('texto-grande', v === 'grande');
  document.body.classList.toggle('texto-muy', v === 'muy');
}
const CLAVE_POSTAL_DIA = 'hogar-postal-dia';


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
    this.cargador = new THREE.TextureLoader();
    this.cuadros = new Cuadros(this);
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
    const { ui, sonido } = this.ctx;
    const extras = this.ctx.extrasMenu ? this.ctx.extrasMenu() : [];
    const tiles = [
      ...extras,
      { id: 'fotos', icono: '📸', texto: 'Fotos', sub: 'Foto de la casa, cuadros y el diario' },
      { id: 'ajustes', icono: '⚙️', texto: 'Ajustes', sub: 'Nombres, fechas, sonido y copia' }
    ];
    const tile = t => `<button class="mas-tile${t.bloqueo ? ' bloqueado' : ''}" data-id="${t.id}"><span>${t.bloqueo ? '🔒' : t.icono}</span><b>${t.texto}</b><small>${t.bloqueo || t.sub}</small>${!t.bloqueo && t.insignia ? `<i class="insignia">${t.insignia}</i>` : ''}</button>`;
    const GRUPOS = [
      ['💑 Vosotros', ['juntos', 'mascotas', 'fotos']],
      ['🏠 La casa', ['casas', 'reformas', 'cocina', 'taller', 'inmobiliaria']],
      ['🏘️ El barrio', ['amigos', 'reto']],
      ['⭐ Progreso', ['nivel', 'objetivos']]
    ];
    const usados = new Set(GRUPOS.flatMap(g => g[1]));
    const secciones = GRUPOS.map(([titulo, ids]) => {
      const lista = ids.map(id => tiles.find(t => t.id === id)).filter(Boolean);
      return lista.length ? `<h4 class="mas-grupo">${titulo}</h4><div class="mas-rejilla">${lista.map(tile).join('')}</div>` : '';
    }).join('');
    const resto = tiles.filter(t => !usados.has(t.id));
    const cuerpo = ui.abrirGen('Más cosas', `${secciones}${resto.length ? `<h4 class="mas-grupo">⚙️ Otros</h4><div class="mas-rejilla">${resto.map(tile).join('')}</div>` : ''}`);
    cuerpo.querySelectorAll('.mas-tile').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id;
      const extra = extras.find(t => t.id === id);
      if (extra && extra.bloqueo) {
        sonido.error();
        return ui.aviso(`🔒 ${extra.bloqueo}`, true);
      }
      sonido.tocar();
      if (extra) extra.accion();
      else if (id === 'fotos') this.abrirFotos();
      else if (id === 'ajustes') this.abrirAjustes();
    }));
  }

  postales() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_POSTALES) || '[]');
    } catch (e) {
      return [];
    }
  }

  textoPostal() {
    const lista = (this.ctx.mascotas ? this.ctx.mascotas() : []).filter(m => m.nombre);
    const hora = new Date().getHours();
    const momento = hora < 12 ? 'esta mañana' : hora < 20 ? 'esta tarde' : 'esta noche';
    if (lista.length) {
      const m = lista[Math.floor(Math.random() * lista.length)];
      if (m.estado === 'dormir') return `${m.nombre} echándose la siesta`;
      const frases = [`${m.nombre} posando para la foto`, `${m.nombre} vigilando la casa ${momento}`, `${m.nombre} pidiendo mimos`, `${m.nombre} con cara de travesura`, `Un día cualquiera con ${m.nombre}`];
      return frases[Math.floor(Math.random() * frases.length)];
    }
    return [`La casa ${momento}`, 'Nuestro rincón', 'Así está quedando', 'Un día más en casa'][Math.floor(Math.random() * 4)];
  }

  postalDelDia(silenciosa = false) {
    const p = this.postalHoy();
    if (!p) return false;
    if (silenciosa) {
      this.ctx.ui.aviso('📸 Foto del día guardada en las postales');
      return true;
    }
    this.ctx.sonido.premio();
    this.ctx.ui.dialogo({
      titulo: '📸 La foto del día',
      html: `<img class="postal-grande" src="${p.data}" alt="">`,
      botones: [
        { texto: '🖼️ Al álbum', tipo: 'secundario', accion: p.alAlbum },
        { texto: '¡Qué bonita!', tipo: 'primario' }
      ]
    });
    return true;
  }

  postalHoy() {
    const hoy = new Date().toDateString();
    try {
      if (localStorage.getItem(CLAVE_POSTAL_DIA) === hoy) return null;
      localStorage.setItem(CLAVE_POSTAL_DIA, hoy);
    } catch (e) {
      return null;
    }
    const foto = this.capturar(420, 0.92);
    const c = document.createElement('canvas');
    c.width = 360;
    c.height = 420;
    const g = c.getContext('2d');
    g.fillStyle = '#fffdf8';
    g.fillRect(0, 0, 360, 420);
    g.drawImage(foto, 18, 18, 324, 324);
    const texto = idioma() === 'en' ? traducirTexto(this.textoPostal()) : this.textoPostal();
    g.fillStyle = '#4b3426';
    g.font = '700 21px "Nunito", system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(texto, 180, 378, 330);
    g.fillStyle = '#b08a6e';
    g.font = '700 14px "Nunito", system-ui, sans-serif';
    g.fillText(new Date().toLocaleDateString(idioma() === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long' }), 180, 402);
    const data = c.toDataURL('image/jpeg', 0.78);
    const lista = this.postales();
    lista.unshift({ data, texto, fecha: Date.now() });
    while (lista.length) {
      try {
        localStorage.setItem(CLAVE_POSTALES, JSON.stringify(lista.slice(0, 45)));
        break;
      } catch (e) {
        lista.pop();
        if (lista.length < 2) break;
      }
    }
    return { data, alAlbum: () => this.guardarEnAlbum(c) };
  }

  abrirPostales() {
    const lista = this.postales();
    const cuerpo = this.ctx.ui.abrirGen('Fotos del día', `<p class="gen-intro">Cada día que entráis, Pilar hace una foto de la casa. Aquí se guardan.</p>
      <div class="postales">${lista.length ? lista.map((p, k) => `<button class="postal" data-k="${k}" style="--r:${(k % 5) - 2}deg"><img src="${p.data}" alt=""></button>`).join('') : '<p class="vacio">Mañana tendréis la primera.</p>'}</div>`, () => this.abrirFotos());
    cuerpo.querySelectorAll('.postal').forEach(b => b.addEventListener('click', () => {
      const p = lista[Number(b.dataset.k)];
      this.ctx.ui.dialogo({ html: `<img class="postal-grande" src="${p.data}" alt="">`, botones: [{ texto: 'Cerrar', tipo: 'secundario' }] });
    }));
  }

  abrirFotos() {
    const { ui, sonido } = this.ctx;
    const tiles = [
      { id: 'foto', icono: '📸', texto: 'Modo foto', sub: 'Encuadrad, elegid la luz, que posen las mascotas y ¡clic!' },
      { id: 'album', icono: '🖼️', texto: 'Fotos y cuadros', sub: 'Colgad fotos de la galería o pintad un cuadro' },
      { id: 'diario', icono: '📔', texto: 'Diario del hogar', sub: 'El antes y el después de vuestra casa' },
      { id: 'postales', icono: '🎞️', texto: 'Fotos del día', sub: `${this.postales().length} fotos guardadas` }
    ];
    const cuerpo = ui.abrirGen('Fotos', `<div class="mas-rejilla">${tiles.map(t => `<button class="mas-tile" data-id="${t.id}"><span>${t.icono}</span><b>${t.texto}</b><small>${t.sub}</small></button>`).join('')}</div>`, () => this.abrir());
    cuerpo.querySelectorAll('.mas-tile').forEach(b => b.addEventListener('click', () => {
      sonido.tocar();
      const id = b.dataset.id;
      if (id === 'foto') this.modoFoto();
      else if (id === 'album') this.abrirAlbum();
      else if (id === 'postales') this.abrirPostales();
      else this.abrirDiario();
    }));
  }


  abrirAjustes() {
    const { ui, sonido } = this.ctx;
    const p = this.pareja();
    const cuerpo = ui.abrirGen('Ajustes', `
      <div class="ajustes">
        <button id="aj-pareja" class="secundario">💑 Casa compartida: código y misiones de pareja</button>
        <label>Vuestros nombres</label>
        <div class="fila2"><input id="aj-n1" maxlength="14" placeholder="Tú" value="${escapar(p.nombres[0])}"><input id="aj-n2" maxlength="14" placeholder="Tu pareja" value="${escapar(p.nombres[1])}"></div>
        <label>Nombre de la casa</label>
        <input id="aj-casa" maxlength="22" value="${escapar(p.casa)}">
        <label>Aniversario 💍</label>
        <input id="aj-aniv" type="date" value="${escapar(p.aniversario)}">
        <label>Cumpleaños 🎂</label>
        <div class="fila2"><input id="aj-c1" type="date" value="${escapar(p.cumples[0])}"><input id="aj-c2" type="date" value="${escapar(p.cumples[1])}"></div>
        <small class="nota">Pilar os avisará en los días especiales (y habrá regalo 🎁).</small>
        <label>Vuestra canción 🎶 (enlace de Spotify o YouTube)</label>
        <input id="aj-cancion" type="url" placeholder="https://open.spotify.com/track/…" value="${escapar(p.cancion || '')}">
        <small class="nota">Sonará al tocar la radio → 💕 Nuestra canción.</small>
        <button id="aj-avisos" class="secundario">${window.avisos && window.avisos.activos() ? '🔔 Avisos al móvil: sí' : '🔕 Avisos al móvil: no'}</button>
        <small class="nota">Te llega un aviso cuando tu pareja te deja una nota, un regalo o te manda un 💗.</small>
        <button id="aj-sonido" class="secundario">${sonido.activo ? '🔊 Sonido activado' : '🔇 Sonido desactivado'}</button>
        <label>🎧 Música de fondo</label>
        <input id="aj-musica" class="aj-rango" type="range" min="0" max="100" step="5" value="${this.ctx.lofi && this.ctx.lofi.activo ? Math.round(this.ctx.lofi.volumen * 100) : 0}">
        <small class="nota">Música lofi tranquila que cambia con la hora del día. Del todo a la izquierda, apagada.</small>
        <label>🔔 Efectos de sonido</label>
        <input id="aj-efectos" class="aj-rango" type="range" min="0" max="100" step="5" value="${Math.round((sonido.volumen ?? 1) * 100)}">
        <label>🔤 Tamaño del texto</label>
        <div class="aj-opciones" id="aj-texto">${[['normal', 'Normal'], ['grande', 'Grande'], ['muy', 'Muy grande']].map(([v, t]) => `<button data-v="${v}" class="${tamTexto() === v ? 'activo' : ''}">${t}</button>`).join('')}</div>
        <label>🔍 Efecto maqueta</label>
        <div class="aj-opciones" id="aj-maqueta">${[['1', 'Sí'], ['0', 'No']].map(([v, t]) => `<button data-v="${v}" class="${leerLS('hogar-maqueta', '1') === v ? 'activo' : ''}">${t}</button>`).join('')}</div>
        <small class="nota">Desenfoca un poco la ciudad para que vuestro piso destaque. Si el móvil va justo, quitadlo.</small>
        <label>💬 Avisos en pantalla</label>
        <div class="aj-opciones" id="aj-modo-avisos">${[['todos', 'Todos'], ['pocos', 'Solo importantes']].map(([v, t]) => `<button data-v="${v}" class="${modoAvisos() === v ? 'activo' : ''}">${t}</button>`).join('')}</div>
        <small class="nota">Con «Solo importantes» no salen los avisos de ambiente (lo que hace tu pareja, pegatinas, recuerdos, la lluvia…).</small>
        <button id="aj-idioma" class="secundario" data-no-traducir>${idioma() === 'en' ? '🌐 Language: English' : '🌐 Idioma: Español'}</button>
        <label>Copia de seguridad 💾</label>
        <div class="fila2"><button id="aj-copia" class="secundario">💾 Descargar</button><button id="aj-restaurar" class="secundario">📂 Restaurar</button></div>
        <small class="nota">Guarda toda la casa, las fotos y el diario en un archivo por si acaso.</small>
        <input id="aj-archivo" type="file" accept=".json,application/json" hidden>
        <button id="aj-guardar" class="primario">Guardar</button>
        <button id="aj-menu" class="secundario">🏠 Menú principal</button>
      </div>`, () => this.abrir());
    cuerpo.querySelector('#aj-pareja').addEventListener('click', () => this.ctx.abrirPareja && this.ctx.abrirPareja());
    cuerpo.querySelector('#aj-sonido').addEventListener('click', e => {
      const on = sonido.alternar();
      e.currentTarget.textContent = on ? '🔊 Sonido activado' : '🔇 Sonido desactivado';
    });
    cuerpo.querySelector('#aj-idioma').addEventListener('click', () => ponerIdioma(idioma() === 'en' ? 'es' : 'en'));
    cuerpo.querySelector('#aj-musica').addEventListener('input', e => {
      const lofi = this.ctx.lofi;
      if (!lofi) return;
      const v = Number(e.target.value) / 100;
      if (v > 0) lofi.ponerVolumen(v);
      if ((v > 0) !== lofi.activo) lofi.alternar();
      if (v > 0 && !sonido.activo) {
        sonido.alternar();
        cuerpo.querySelector('#aj-sonido').textContent = '🔊 Sonido activado';
      }
    });
    cuerpo.querySelector('#aj-efectos').addEventListener('input', e => sonido.ponerVolumen && sonido.ponerVolumen(Number(e.target.value) / 100));
    cuerpo.querySelector('#aj-efectos').addEventListener('change', () => sonido.pop());
    const opciones = (sel, clave, alCambiar) => cuerpo.querySelectorAll(`${sel} button`).forEach(b => b.addEventListener('click', () => {
      try {
        localStorage.setItem(clave, b.dataset.v);
      } catch (e) {}
      cuerpo.querySelectorAll(`${sel} button`).forEach(x => x.classList.toggle('activo', x === b));
      sonido.pop();
      if (alCambiar) alCambiar(b.dataset.v);
    }));
    opciones('#aj-texto', 'hogar-texto', aplicarTamTexto);
    opciones('#aj-modo-avisos', 'hogar-avisos-modo');
    opciones('#aj-maqueta', 'hogar-maqueta', v => this.ctx.maqueta && this.ctx.maqueta(v !== '0'));
    cuerpo.querySelector('#aj-avisos').addEventListener('click', e => this.alternarAvisos(e.currentTarget));
    cuerpo.querySelector('#aj-copia').addEventListener('click', () => this.descargarCopia());
    cuerpo.querySelector('#aj-restaurar').addEventListener('click', () => cuerpo.querySelector('#aj-archivo').click());
    cuerpo.querySelector('#aj-archivo').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0];
      if (f) this.restaurarCopia(f);
      e.target.value = '';
    });
    cuerpo.querySelector('#aj-menu').addEventListener('click', () => this.ctx.abrirInicio && this.ctx.abrirInicio());
    cuerpo.querySelector('#aj-guardar').addEventListener('click', () => {
      const v = id => cuerpo.querySelector(id).value.trim();
      p.nombres = [v('#aj-n1'), v('#aj-n2')];
      p.casa = v('#aj-casa') || 'Nuestro Hogar';
      p.aniversario = v('#aj-aniv');
      p.cumples = [v('#aj-c1'), v('#aj-c2')];
      p.cancion = v('#aj-cancion');
      this.montarCartel();
      this.ctx.guardar();
      sonido.arreglo();
      ui.aviso('✅ Guardado');
      this.ctx.alCambiarAjustes && this.ctx.alCambiarAjustes();
      this.abrir();
    });
  }

  async alternarAvisos(boton) {
    const { ui, sonido } = this.ctx;
    const av = window.avisos;
    if (!av) return;
    if (av.activos()) {
      await av.desactivar();
      boton.textContent = '🔕 Avisos al móvil: no';
      return ui.aviso('🔕 Avisos desactivados');
    }
    const p = this.ctx.datosPareja ? this.ctx.datosPareja() : { activo: false };
    if (!p.activo) return ui.aviso('Primero tenéis que compartir la casa', true);
    if (av.esIOS() && !av.instalada()) {
      return ui.dialogo({
        titulo: '📲 Primero, instala el juego',
        texto: 'En iPhone los avisos solo funcionan si el juego está en la pantalla de inicio: en Safari toca Compartir (el cuadrado con la flecha) → «Añadir a pantalla de inicio». Después ábrelo desde ese icono y activa los avisos aquí.',
        botones: [{ texto: 'Entendido', tipo: 'primario' }]
      });
    }
    if (!av.soportado()) return ui.aviso('Este navegador no permite avisos', true);
    boton.disabled = true;
    try {
      await av.activar(p.codigo, p.yo);
      boton.textContent = '🔔 Avisos al móvil: sí';
      sonido.premio();
      ui.aviso('🔔 ¡Avisos activados!');
    } catch (e) {
      sonido.error();
      ui.aviso(e.message === 'denegado' ? 'Has dicho que no a los avisos. Puedes activarlos en los ajustes del móvil' : 'No se pudieron activar los avisos. Prueba otra vez', true);
    } finally {
      boton.disabled = false;
    }
  }

  descargarCopia() {
    const leer = k => {
      try {
        return JSON.parse(localStorage.getItem(k) || 'null');
      } catch (e) {
        return null;
      }
    };
    const copia = { juego: 'our-place', version: 1, fecha: new Date().toISOString(), casa: this.ctx.instantanea(), fotos: leer(CLAVE_FOTOS), diario: leer(CLAVE_DIARIO) };
    const blob = new Blob([JSON.stringify(copia)], { type: 'application/json' });
    const a = document.createElement('a');
    const nombre = (this.pareja().casa || 'casa').normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase();
    a.href = URL.createObjectURL(blob);
    a.download = `our-place-${nombre}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    this.estado.ultimaCopia = Date.now();
    this.ctx.guardar();
    this.ctx.sonido.arreglo();
    this.ctx.ui.aviso('💾 Copia descargada');
  }

  restaurarCopia(archivo) {
    const { ui, sonido } = this.ctx;
    const lector = new FileReader();
    lector.onload = () => {
      let copia = null;
      try {
        copia = JSON.parse(lector.result);
      } catch (e) {}
      if (!copia || copia.juego !== 'our-place' || !copia.casa || !copia.casa.estado) {
        sonido.error();
        return ui.aviso('Ese archivo no es una copia de la casa', true);
      }
      ui.dialogo({
        titulo: '¿Restaurar la copia?',
        texto: `La casa volverá a como estaba el ${new Date(copia.fecha).toLocaleDateString()}. Lo que hayáis hecho después se perderá (también en el móvil de tu pareja).`,
        botones: [
          { texto: 'Cancelar', tipo: 'secundario' },
          {
            texto: 'Restaurar', tipo: 'rosa', accion: () => {
              try {
                if (copia.fotos) localStorage.setItem(CLAVE_FOTOS, JSON.stringify(copia.fotos));
                if (copia.diario) localStorage.setItem(CLAVE_DIARIO, JSON.stringify(copia.diario));
              } catch (e) {}
              this.ctx.aplicarRemoto(copia.casa, false, true);
              this.ctx.guardar();
              sonido.premio();
              ui.aviso('📂 Casa restaurada');
            }
          }
        ]
      });
    };
    lector.readAsText(archivo);
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

  fusionarFotos(remotas) {
    if (!remotas) return;
    let cambio = false;
    for (const f of remotas.nuevas) {
      if (!this.fotos.some(x => x.id === f.id)) {
        this.fotos.push(f);
        cambio = true;
      }
    }
    const antes = this.fotos.length;
    this.fotos = this.fotos.filter(f => remotas.todas.includes(f.id) || Date.now() - f.fecha < 60000);
    if (cambio || antes !== this.fotos.length) {
      this.fotos.sort((a, b) => b.fecha - a.fecha);
      this.guardarFotos();
      this.pintarPared();
    }
  }

  pintarPared() {
    this.cuadros.pintar();
  }

  abrirAlbum() {
    const { ui, sonido } = this.ctx;
    const colgadas = new Set(this.cuadros.lista().map(c => c.foto));
    const cuerpo = ui.abrirGen('Fotos y cuadros', `
      <p class="gen-intro">Elegid fotos de la galería del móvil o pintad un cuadro, y colgadlo donde queráis en cualquier pared.</p>
      <div class="album-botones">
        <label class="boton-subir primario">📷 Fotos de la galería<input id="subir-foto" type="file" accept="image/*" multiple hidden></label>
        <button class="rosa" id="pintar-nuevo">🎨 Pintar un cuadro</button>
      </div>
      <div class="album">${this.fotos.length ? this.fotos.map(f => `
        <button class="album-foto" data-id="${f.id}"><img src="${f.data}" alt="">${f.pintura ? '<em>🎨</em>' : ''}${colgadas.has(f.id) ? '<i>🖼️ Colgada</i>' : ''}</button>`).join('') : '<p class="vacio">Todavía no hay fotos ni cuadros.</p>'}</div>`, () => this.abrirFotos());
    cuerpo.querySelector('#pintar-nuevo').addEventListener('click', () => this.pintarNuevo());
    cuerpo.querySelector('#subir-foto').addEventListener('change', async e => {
      const archivos = [...e.target.files];
      if (!archivos.length) return;
      ui.aviso(archivos.length > 1 ? `📷 Preparando ${archivos.length} fotos…` : '📷 Preparando la foto…');
      const nuevas = [];
      for (const [k, archivo] of archivos.entries()) {
        try {
          const data = await reducirImagen(archivo, 640, 0.8);
          const f = { id: `f${Date.now()}${k}`, data, fecha: Date.now() };
          this.fotos.unshift(f);
          if (!this.guardarFotos()) {
            this.fotos.shift();
            break;
          }
          nuevas.push(f);
          this.ctx.alFotoNueva && this.ctx.alFotoNueva(f);
        } catch (err) {
          ui.aviso('No se pudo leer alguna foto', true);
        }
      }
      if (!nuevas.length) return;
      sonido.arreglo();
      if (nuevas.length === 1) {
        this.cuadros.colocar(nuevas[0].id);
        return;
      }
      ui.aviso(`📷 ${nuevas.length} fotos añadidas. Tocad una para colgarla`);
      this.abrirAlbum();
    });
    cuerpo.querySelectorAll('.album-foto').forEach(b => b.addEventListener('click', () => {
      const f = this.fotos.find(x => x.id === b.dataset.id);
      if (f) this.opcionesFoto(f);
    }));
  }

  async pintarNuevo() {
    const { ui, sonido } = this.ctx;
    ui.cerrarHojas();
    const res = await pintarCuadro({ sonido });
    if (!res) return;
    const f = { id: `p${Date.now()}`, data: res.data, fecha: Date.now(), pintura: true };
    this.fotos.unshift(f);
    if (!this.guardarFotos()) {
      this.fotos.shift();
      return;
    }
    this.ctx.alFotoNueva && this.ctx.alFotoNueva(f);
    this.ctx.registrar && this.ctx.registrar('pintar');
    sonido.premio();
    this.cuadros.colocar(f.id);
  }

  async retocar(f) {
    const { ui, sonido } = this.ctx;
    ui.cerrarHojas();
    const img = new Image();
    img.src = f.data;
    await img.decode().catch(() => {});
    const formato = img.width > img.height * 1.1 ? 'horizontal' : img.height > img.width * 1.1 ? 'vertical' : 'cuadrado';
    const res = await pintarCuadro({ sonido, base: f.data, formato });
    if (!res) return;
    const nueva = { id: `p${Date.now()}`, data: res.data, fecha: Date.now(), pintura: true };
    this.fotos = this.fotos.map(x => (x === f ? nueva : x));
    for (const c of this.cuadros.lista()) if (c.foto === f.id) c.foto = nueva.id;
    if (!this.guardarFotos()) return;
    this.ctx.alFotoBorrada && this.ctx.alFotoBorrada(f.id);
    this.ctx.alFotoNueva && this.ctx.alFotoNueva(nueva);
    sonido.arreglo();
    this.pintarPared();
    this.ctx.guardar();
    ui.aviso('🎨 ¡Cuadro retocado!');
  }

  opcionesFoto(f) {
    const { ui } = this.ctx;
    ui.dialogo({
      html: `<img class="foto-grande" src="${f.data}" alt="">`,
      botones: [
        { texto: '🖼️ Colgar en la pared', tipo: 'primario', accion: () => setTimeout(() => this.cuadros.colocar(f.id), 250) },
        ...(f.pintura ? [{ texto: '🖌️ Retocar', tipo: 'secundario', accion: () => setTimeout(() => this.retocar(f), 250) }] : []),
        {
          texto: '🗑️ Borrar', tipo: 'rosa', accion: () => {
            this.estado.cuadros = this.cuadros.lista().filter(c => c.foto !== f.id);
            this.fotos = this.fotos.filter(x => x !== f);
            this.guardarFotos();
            this.ctx.alFotoBorrada && this.ctx.alFotoBorrada(f.id);
            this.trasCambioPared();
          }
        },
        { texto: 'Cerrar', tipo: 'secundario' }
      ],
      columna: true
    });
  }

  trasCambioPared() {
    this.pintarPared();
    this.ctx.guardar();
    if (this.ctx.ui.hojaAbierta === 'hoja-gen') this.abrirAlbum();
  }

  capturar(ancho = 900, recorte = 1) {
    const { renderer, escena, camara } = this.ctx;
    if (this.ctx.pintar) this.ctx.pintar();
    else renderer.render(escena, camara);
    const fuente = renderer.domElement;
    const w = fuente.width;
    const h = fuente.height;
    const lado = Math.min(w, h * 0.62) * recorte;
    const sx = (w - lado) / 2;
    const sy = h * 0.5 - lado * 0.52;
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = ancho;
    const g = c.getContext('2d');
    g.fillStyle = document.body.classList.contains('noche') ? '#2b2b45' : '#f6ead9';
    g.fillRect(0, 0, ancho, ancho);
    g.drawImage(fuente, sx, sy, lado, lado, 0, 0, ancho, ancho);
    return c;
  }

  modoFoto() {
    const { ui, sonido, ambiente } = this.ctx;
    ui.cerrarHojas();
    if (document.getElementById('modo-foto')) return;
    const LUCES = [
      { id: null, icono: '🕒', texto: 'Ahora' },
      { id: 9, icono: '🌤️', texto: 'Mañana' },
      { id: 19.4, icono: '🌅', texto: 'Atardecer' },
      { id: 22.5, icono: '🌙', texto: 'Noche' }
    ];
    const horaAntes = ambiente ? ambiente.horaFija : null;
    let luz = 0;
    let rejilla = true;
    const capa = document.createElement('div');
    capa.id = 'modo-foto';
    capa.innerHTML = `
      <div class="mf-arriba">
        <button class="mf-btn mf-cerrar" aria-label="Salir">✕</button>
        <span class="mf-titulo">📸 Modo foto</span>
        <button class="mf-btn mf-rejilla" aria-label="Rejilla">#</button>
      </div>
      <div class="mf-marco"><i></i><i></i><i></i><i></i></div>
      <small class="mf-ayuda">Mueve la cámara con el dedo y pellizca para acercar</small>
      <div class="mf-abajo">
        <button class="mf-opcion mf-luz"><span>🕒</span><small>Ahora</small></button>
        <button class="mf-disparo" aria-label="Hacer la foto"></button>
        <button class="mf-opcion mf-posar"><span>🐾</span><small>¡Posad!</small></button>
      </div>
      <div class="mf-flash"></div>`;
    document.body.appendChild(capa);
    document.body.classList.add('modo-foto');
    setTimeout(() => capa.querySelector('.mf-ayuda') && capa.querySelector('.mf-ayuda').classList.add('fuera'), 3500);
    const ponerLuz = () => {
      const l = LUCES[luz];
      capa.querySelector('.mf-luz span').textContent = l.icono;
      capa.querySelector('.mf-luz small').textContent = l.texto;
      if (!ambiente) return;
      ambiente.horaFija = l.id === null ? horaAntes : l.id;
      ambiente.calcular();
      ambiente.dibujar && ambiente.dibujar();
    };
    const salir = () => {
      capa.remove();
      document.body.classList.remove('modo-foto');
      if (ambiente && luz !== 0) {
        ambiente.horaFija = horaAntes;
        ambiente.calcular();
      }
    };
    capa.querySelector('.mf-cerrar').addEventListener('click', () => { sonido.tocar(); salir(); });
    capa.querySelector('.mf-rejilla').addEventListener('click', () => {
      rejilla = !rejilla;
      capa.querySelector('.mf-marco').classList.toggle('sin-rejilla', !rejilla);
      sonido.tocar();
    });
    capa.querySelector('.mf-luz').addEventListener('click', () => {
      luz = (luz + 1) % LUCES.length;
      sonido.pop();
      ponerLuz();
    });
    capa.querySelector('.mf-posar').addEventListener('click', () => {
      const n = this.ctx.posar ? this.ctx.posar() : 0;
      if (n) sonido.mascota ? sonido.mascota() : sonido.pop();
      else ui.aviso('🐾 No hay mascotas despiertas para posar', true);
    });
    capa.querySelector('.mf-disparo').addEventListener('click', () => {
      const marco = capa.querySelector('.mf-marco').getBoundingClientRect();
      const foto = this.capturarZona(marco, 900);
      const flash = capa.querySelector('.mf-flash');
      flash.classList.remove('activo');
      void flash.offsetWidth;
      flash.classList.add('activo');
      sonido.ruido(0.08, { volumen: 0.12, freq: 2500, q: 0.6 });
      setTimeout(() => sonido.ruido(0.06, { volumen: 0.08, freq: 1800, q: 0.6 }), 90);
      setTimeout(() => {
        salir();
        this.editarYCompartir(foto);
      }, 380);
    });
  }

  capturarZona(rect, ancho = 900) {
    const { renderer, escena, camara } = this.ctx;
    const ocultos = [];
    escena.traverse(o => {
      if (o.isSprite && o.visible) {
        o.visible = false;
        ocultos.push(o);
      }
    });
    if (this.ctx.pintar) this.ctx.pintar();
    else renderer.render(escena, camara);
    const fuente = renderer.domElement;
    const caja = fuente.getBoundingClientRect();
    const kx = fuente.width / caja.width;
    const ky = fuente.height / caja.height;
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = ancho;
    const g = c.getContext('2d');
    g.fillStyle = document.body.classList.contains('noche') ? '#2b2b45' : '#f6ead9';
    g.fillRect(0, 0, ancho, ancho);
    g.drawImage(fuente, (rect.left - caja.left) * kx, (rect.top - caja.top) * ky, rect.width * kx, rect.height * ky, 0, 0, ancho, ancho);
    ocultos.forEach(o => { o.visible = true; });
    return c;
  }

  hacerFoto() {
    const { ui } = this.ctx;
    ui.cerrarHojas();
    setTimeout(() => {
      this.ctx.sonido.premio();
      this.editarYCompartir(this.capturar(900));
    }, 380);
  }

  async editarYCompartir(foto) {
    const { ui, sonido, ambiente } = this.ctx;
    {
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const nombres = this.nombresTexto();
      const res = await editarFoto(foto, {
        titulo: this.pareja().casa || 'Nuestro Hogar',
        subtitulo: `${nombres ? nombres + ' · ' : ''}${fecha} ${ambiente ? ambiente.icono() : ''}`,
        sonido
      });
      if (!res) return;
      const url = res.url;
      if (res.pegatinas >= 3 || res.filtro !== 'normal') this.ctx.registrar && this.ctx.registrar('foto-editada');
      ui.dialogo({
        html: `<img class="foto-grande" src="${url}" alt="">`,
        botones: [
          { texto: '📤 Compartir', tipo: 'primario', mantener: true, accion: () => this.compartir(url) },
          { texto: '🖼️ Guardar en el álbum', tipo: 'secundario', accion: () => this.guardarEnAlbum(res.lienzo) },
          { texto: '📔 Guardar en el diario', tipo: 'secundario', accion: () => { this.anadirDiario('Foto de la casa', true, res.lienzo); ui.aviso('📔 Guardada en el diario'); } },
          { texto: 'Cerrar', tipo: 'secundario' }
        ],
        columna: true
      });
      this.ctx.alFoto && this.ctx.alFoto();
    }
  }

  guardarEnAlbum(lienzo) {
    const max = 640;
    const k = Math.min(1, max / Math.max(lienzo.width, lienzo.height));
    const c = document.createElement('canvas');
    c.width = Math.round(lienzo.width * k);
    c.height = Math.round(lienzo.height * k);
    c.getContext('2d').drawImage(lienzo, 0, 0, c.width, c.height);
    this.fotos.unshift({ id: `f${Date.now()}`, data: c.toDataURL('image/jpeg', 0.8), fecha: Date.now() });
    if (!this.guardarFotos()) {
      this.fotos.shift();
      return;
    }
    this.ctx.alFotoNueva && this.ctx.alFotoNueva(this.fotos[0]);
    this.ctx.sonido.arreglo();
    this.ctx.ui.aviso('🖼️ Guardada en el álbum. Podéis colgarla en la pared');
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

  anadirDiario(titulo, forzar = false, lienzo = null) {
    const ultimo = this.diario[this.diario.length - 1];
    if (!forzar && ultimo && Date.now() - ultimo.fecha < 2 * 86400000) return;
    let fuente = this.capturar(420);
    if (lienzo) {
      fuente = document.createElement('canvas');
      fuente.width = 420;
      fuente.height = Math.round(420 * lienzo.height / lienzo.width);
      fuente.getContext('2d').drawImage(lienzo, 0, 0, fuente.width, fuente.height);
    }
    const data = fuente.toDataURL('image/jpeg', 0.72);
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
        <div class="diario-entrada"><img src="${d.data}" alt=""><div><b>${escapar(d.titulo)}</b><small>${fecha(d.fecha)}</small></div></div>`).join('')}</div>`, () => this.abrirFotos());
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
    (p.cumples || []).forEach((c, i) => {
      if (c && c.slice(5) === md) {
        const n = (p.nombres || [])[i] || (i === 0 ? 'tu cumple' : 'el cumple de tu pareja');
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
