import { Escaparate, NUM_SALAS } from './escaparate.js';

const CLAVE_CUENTA = 'hogar-cuenta';

function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}


function periodo() {
  const forz = new URLSearchParams(location.search).get('hora');
  const h = forz !== null ? Number(forz) : new Date().getHours();
  if (h >= 21 || h < 6) return 'noche';
  if (h >= 18 || h < 8) return 'tarde';
  return 'dia';
}

const CIELOS = {
  dia: ['#9fd3f0', '#cfe9f6', '#fbefe0'],
  tarde: ['#7d86c9', '#f4a28c', '#fbd7b0'],
  noche: ['#141838', '#2c2d63', '#5b4c86']
};

function corazonPath(x, y, s) {
  return `M${x} ${y + s * 0.9} C${x - s * 1.6} ${y - s * 0.2} ${x - s * 0.6} ${y - s * 1.4} ${x} ${y - s * 0.5} C${x + s * 0.6} ${y - s * 1.4} ${x + s * 1.6} ${y - s * 0.2} ${x} ${y + s * 0.9}Z`;
}

function escenaSvg(nivel = 0) {
  const p = periodo();
  const noche = p === 'noche';
  const [c1, c2, c3] = CIELOS[p];
  const r = (() => { let x = 7; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); })();
  const estrellas = noche ? Array.from({ length: 46 }, (_, i) => `<circle class="estrella" cx="${(r() * 400).toFixed(1)}" cy="${(r() * 380).toFixed(1)}" r="${(0.6 + r() * 1.6).toFixed(1)}" style="animation-delay:${(r() * 4).toFixed(2)}s"/>`).join('') : '';
  const nube = (x, y, s, d) => `<g class="nube" style="animation-duration:${d}s;animation-delay:-${(r() * d).toFixed(1)}s"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="34" ry="16"/><ellipse cx="-24" cy="6" rx="22" ry="12"/><ellipse cx="26" cy="6" rx="24" ry="12"/><ellipse cx="4" cy="-12" rx="20" ry="14"/></g></g>`;
  const nubes = `<g class="nubes ${noche ? 'tenue' : ''}">${nube(60, 150, 1, 60)}${nube(260, 90, 0.8, 75)}${nube(160, 230, 0.6, 50)}</g>`;
  const astro = noche
    ? '<mask id="creciente"><circle cx="318" cy="120" r="30" fill="#fff"/><circle cx="331" cy="111" r="27" fill="#000"/></mask><circle class="luna" cx="318" cy="120" r="30" fill="#f6f0d8" mask="url(#creciente)"/>'
    : `<circle class="sol" cx="318" cy="${p === 'tarde' ? 300 : 200}" r="${p === 'tarde' ? 40 : 30}" fill="${p === 'tarde' ? '#ffb070' : '#ffe08a'}"/>`;
  const pajaros = p === 'dia' ? '<g class="pajaros"><path d="M0 0 q6 -6 12 0 q6 -6 12 0" /><path d="M30 14 q5 -5 10 0 q5 -5 10 0" /></g>' : '';
  const luciernagas = noche ? Array.from({ length: 10 }, () => `<circle class="luciernaga" cx="${(20 + r() * 360).toFixed(0)}" cy="${(560 + r() * 140).toFixed(0)}" r="2.2" style="animation-delay:${(r() * 5).toFixed(2)}s;animation-duration:${(4 + r() * 4).toFixed(1)}s"/>`).join('') : '';
  const pared = noche ? '#cdb7a6' : '#f6e3cf';
  const tejado = noche ? '#a5574e' : '#e07a6a';
  const luzV = noche ? '#ffd166' : '#fff1c2';
  const cerca = nivel >= 3 ? `<g class="valla" fill="${noche ? '#bfb2a6' : '#fffaf2'}">${Array.from({ length: 16 }, (_, i) => { const x = 20 + i * 24 - (i > 7 ? -10 : 0); return i === 7 || i === 8 ? '' : `<path d="M${x} 640 v-26 l5 -6 l5 6 v26z"/>`; }).join('')}<rect x="14" y="622" width="160" height="5"/><rect x="226" y="622" width="160" height="5"/></g>` : '';
  const torres = nivel >= 4 ? `<g><rect x="78" y="440" width="44" height="160" fill="${pared}"/><path d="M72 442 L100 380 L128 442Z" fill="${tejado}"/><rect x="92" y="470" width="16" height="24" rx="8" fill="${luzV}" class="ventana"/><rect x="278" y="440" width="44" height="160" fill="${pared}"/><path d="M272 442 L300 380 L328 442Z" fill="${tejado}"/><rect x="292" y="470" width="16" height="24" rx="8" fill="${luzV}" class="ventana"/><path d="M100 380 v-16" stroke="#8a5a3c" stroke-width="2"/><path d="M100 364 l12 4 l-12 4z" fill="#e58f9e" class="bandera"/></g>` : '';
  const pisoExtra = nivel >= 2 ? `<rect x="138" y="440" width="34" height="0" />` : '';
  const flores = Array.from({ length: 14 }, (_, i) => {
    const x = i < 7 ? 40 + i * 13 : 262 + (i - 7) * 14;
    const col = ['#e58f9e', '#f2d06b', '#b39ddb', '#ffffff', '#f08c6a'][i % 5];
    return `<g class="flor" style="animation-delay:${(i * 0.23).toFixed(2)}s"><path d="M${x} 640 v-14" stroke="#5f9a52" stroke-width="2"/><circle cx="${x}" cy="${626}" r="4.5" fill="${col}"/><circle cx="${x}" cy="626" r="1.6" fill="#f2d06b"/></g>`;
  }).join('');
  return `<svg class="inicio-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
      <radialGradient id="brillo"><stop offset="0" stop-color="${luzV}" stop-opacity=".9"/><stop offset="1" stop-color="${luzV}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="400" height="800" fill="url(#cielo)"/>
    ${estrellas}${astro}${nubes}${pajaros}
    <g class="suelo-escena">
    <path d="M-20 600 Q90 500 210 560 T420 540 V1100 H-20Z" fill="${noche ? '#3d5a52' : '#a8d08d'}"/>
    <path d="M-20 650 Q120 590 240 630 T420 610 V1100 H-20Z" fill="${noche ? '#2f4a40' : '#8fc46a'}"/>
    <g class="arbol"><rect x="28" y="545" width="12" height="70" rx="5" fill="#8a5a3c"/><circle cx="34" cy="535" r="34" fill="${noche ? '#35614a' : '#6fae5e'}"/><circle cx="16" cy="552" r="20" fill="${noche ? '#2f5642' : '#62a052'}"/><circle cx="52" cy="550" r="22" fill="${noche ? '#2f5642' : '#62a052'}"/><circle cx="24" cy="528" r="4" fill="#e05050"/><circle cx="46" cy="540" r="4" fill="#e05050"/></g>
    <g class="arbusto"><circle cx="350" cy="606" r="22" fill="${noche ? '#2f5642' : '#62a052'}"/><circle cx="372" cy="612" r="18" fill="${noche ? '#35614a' : '#6fae5e'}"/><circle cx="352" cy="598" r="3.5" fill="#f4b3be"/><circle cx="366" cy="606" r="3.5" fill="#f4b3be"/></g>
    ${cerca}${flores}${luciernagas}
    </g>
  </svg>`;
}


export class Inicio {
  constructor(ctx) {
    this.ctx = ctx;
    this.cuenta = JSON.parse(localStorage.getItem(CLAVE_CUENTA) || 'null');
    this.clave = null;
    this.capa = document.createElement('div');
    this.capa.id = 'inicio';
    document.body.appendChild(this.capa);
  }

  guardarCuenta() {
    if (this.cuenta) localStorage.setItem(CLAVE_CUENTA, JSON.stringify(this.cuenta));
    else localStorage.removeItem(CLAVE_CUENTA);
  }

  mostrar() {
    this.capa.classList.remove('fuera');
    this.capa.style.display = 'flex';
    const res = this.ctx.resumen ? this.ctx.resumen() : null;
    this.capa.innerHTML = `<div class="inicio-fondo">${escenaSvg(res ? res.nivel : 0)}</div><div class="inicio-titulo">${'Nuestro Hogar'.split('').map((l, i) => `<span style="animation-delay:${(0.1 + i * 0.06).toFixed(2)}s">${l === ' ' ? '&nbsp;' : l}</span>`).join('')}</div>
      <div class="escaparate"><div class="esc-lienzo"></div><div class="esc-info"><span class="esc-nombre"></span><div class="esc-puntos"></div></div></div><div class="inicio-panel"></div>`;
    this.pintar();
    this.montarEscaparate();
    setTimeout(() => this.pintar(this.vista), 0);
  }

  montarEscaparate() {
    if (this.escaparate) this.escaparate.destruir();
    this.escaparate = null;
    const cont = this.capa.querySelector('.esc-lienzo');
    try {
      this.escaparate = new Escaparate(cont);
    } catch (e) {
      return;
    }
    const nombre = this.capa.querySelector('.esc-nombre');
    const puntos = this.capa.querySelector('.esc-puntos');
    const pintar = (s, i, n) => {
      nombre.textContent = `${s.icono} ${s.nombre}`;
      nombre.classList.remove('cambia');
      void nombre.offsetWidth;
      nombre.classList.add('cambia');
      puntos.innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'activo' : ''}"></i>`).join('');
    };
    this.escaparate.alCambiar = pintar;
    pintar(this.escaparate.sala, this.escaparate.indice, NUM_SALAS);
    cont.addEventListener('click', () => this.escaparate && this.escaparate.siguiente());
  }

  ocultar() {
    this.capa.classList.add('fuera');
    setTimeout(() => {
      this.capa.style.display = 'none';
      if (this.escaparate) this.escaparate.destruir();
      this.escaparate = null;
    }, 450);
  }

  cabecera(sub = '') {
    return sub ? `<div class="inicio-saludo">${sub}</div>` : '';
  }

  tarjetaCasa() {
    const r = this.ctx.resumen ? this.ctx.resumen() : null;
    if (!r) return '';
    return `<div class="ini-casa">
      <div class="ini-casa-cab"><span>${r.icono}</span><div><b>${escapar(r.casa)}</b><small>${escapar(r.nombres || r.nombreNivel)}</small></div></div>
      <div class="ini-stats-mini"><span>🪙<b>${r.monedas}</b></span><span>🔥<b>${r.racha}</b></span><span>🕯️<b>${r.acogedor}</b></span></div>
    </div>
    ${r.novedades.length ? `<div class="ini-avisos">${r.novedades.map((n, k) => `<div class="ini-aviso" style="animation-delay:${0.2 + k * 0.1}s"><i>${n.i}</i><small>${escapar(n.t)}</small></div>`).join('')}</div>` : ''}`;
  }

  pintar(vista = null) {
    this.vista = vista;
    const c = this.cuenta;
    if (!c && !vista) vista = 'bienvenida';
    if (c && !c.hogar && !vista) vista = 'sin-casa';
    if (c && c.hogar && !vista) vista = 'con-casa';
    const panel = {
      bienvenida: `
        <div class="inicio-caja">
          <button class="primario grande latido" data-ir="crear">✨ ¡Empezar!</button>
          <button class="secundario" data-ir="entrar">Ya tengo cuenta</button>
        </div>`,
      entrar: `
        ${this.cabecera('¡Hola otra vez!')}
        <div class="inicio-caja">
          <input id="in-usuario" autocomplete="username" placeholder="Usuario" autocapitalize="off">
          <input id="in-clave" type="password" autocomplete="current-password" placeholder="Contraseña">
          <p class="inicio-error oculto"></p>
          <button class="primario" id="in-entrar">Entrar</button>
          <button class="enlace" data-ir="bienvenida">‹ Volver</button>
        </div>`,
      crear: `
        ${this.cabecera('Crea tu cuenta')}
        <div class="inicio-caja">
          <input id="in-nombre" maxlength="14" placeholder="Tu nombre (el que verá tu pareja)">
          <input id="in-usuario" autocomplete="username" placeholder="Usuario (para entrar)" autocapitalize="off">
          <input id="in-clave" type="password" autocomplete="new-password" placeholder="Contraseña (mínimo 4)">
          <p class="inicio-error oculto"></p>
          <button class="primario" id="in-crear">Crear cuenta</button>
          <button class="enlace" data-ir="bienvenida">‹ Volver</button>
        </div>`,
      'sin-casa': `
        ${this.cabecera(`¡Hola, ${escapar(c && c.nombre)}!`)}
        <div class="inicio-caja">
          <p class="inicio-texto">Cada cuenta tiene una sola casa. Cread una nueva o uníos a la de tu pareja con su código.</p>
          ${this.ctx.codigoLocal() ? `<button class="primario" id="in-vincular">🔗 Seguir en vuestra casa (${this.ctx.codigoLocal()})</button>` : ''}
          <button class="primario" id="in-nueva">🏠 Crear nuestra casa</button>
          <div class="inicio-codigo"><input id="in-codigo" maxlength="6" placeholder="CÓDIGO"><button class="rosa" id="in-unirse">💑 Unirme</button></div>
          <p class="inicio-error oculto"></p>
          <button class="enlace" id="in-salir">Cerrar sesión</button>
        </div>`,
      'con-casa': `
        <div class="inicio-caja">
          ${this.tarjetaCasa()}
          <button class="primario grande latido" id="in-casa">▶ ¡A jugar!</button>
          <p class="inicio-error oculto"></p>
          <div class="ini-pie"><span>Código de la casa: <b>${escapar(c && c.hogar)}</b></span><button class="enlace" id="in-salir">Cerrar sesión</button></div>
        </div>`
    }[vista];
    let destino = this.capa.querySelector('.inicio-panel');
    if (!destino) {
      this.mostrar();
      return;
    }
    destino.innerHTML = panel;
    this.capa.classList.toggle('con-casa', vista === 'con-casa');
    destino.classList.remove('entra');
    void destino.offsetWidth;
    destino.classList.add('entra');
    this.capa.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { this.ctx.sonido.tocar(); this.pintar(b.dataset.ir); }));
    const $ = id => this.capa.querySelector(id);
    if ($('#in-entrar')) $('#in-entrar').addEventListener('click', e => this.entrar(e.currentTarget));
    if ($('#in-crear')) $('#in-crear').addEventListener('click', e => this.crear(e.currentTarget));
    if ($('#in-nueva')) $('#in-nueva').addEventListener('click', e => this.asignar(e.currentTarget, null));
    if ($('#in-vincular')) $('#in-vincular').addEventListener('click', e => this.asignar(e.currentTarget, this.ctx.codigoLocal()));
    if ($('#in-unirse')) $('#in-unirse').addEventListener('click', e => this.asignar(e.currentTarget, $('#in-codigo').value.trim().toUpperCase()));
    if ($('#in-casa')) $('#in-casa').addEventListener('click', e => this.entrarEnCasa(e.currentTarget));
    if ($('#in-salir')) $('#in-salir').addEventListener('click', () => this.cerrarSesion());
    this.capa.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const b = this.capa.querySelector('.inicio-caja .primario');
        if (b) b.click();
      }
    }));
  }

  async entrar(b) {
    const usuario = this.capa.querySelector('#in-usuario').value.trim();
    const clave = this.capa.querySelector('#in-clave').value;
    if (!usuario || !clave) return this.error('Escribe tu usuario y contraseña');
    this.ocupado(b, true);
    try {
      const r = await this.ctx.sync.rpc('entrar', { p_usuario: usuario, p_clave: clave });
      if (r.error) return this.error('Usuario o contraseña incorrectos');
      this.cuenta = { usuario: usuario.toLowerCase(), nombre: r.nombre, hogar: r.hogar, yo: r.yo };
      this.clave = clave;
      this.guardarCuenta();
      this.ctx.sonido.arreglo();
      if (r.hogar) return this.entrarEnCasa(null);
      this.pintar();
    } catch (e) {
      this.error('No hay conexión. Prueba otra vez.');
    } finally {
      this.ocupado(b, false);
    }
  }

  async crear(b) {
    const nombre = this.capa.querySelector('#in-nombre').value.trim();
    const usuario = this.capa.querySelector('#in-usuario').value.trim();
    const clave = this.capa.querySelector('#in-clave').value;
    if (!nombre) return this.error('Pon tu nombre');
    if (usuario.length < 3) return this.error('El usuario tiene que tener 3 letras o más');
    if (!/^[a-zA-Z0-9_.-]+$/.test(usuario)) return this.error('El usuario solo puede tener letras, números, punto y guiones');
    if (clave.length < 4) return this.error('La contraseña tiene que tener 4 caracteres o más');
    this.ocupado(b, true);
    try {
      const r = await this.ctx.sync.rpc('registrar_cuenta', { p_usuario: usuario, p_clave: clave, p_nombre: nombre });
      if (r.error === 'existe') return this.error('Ese usuario ya existe, elige otro');
      if (r.error) return this.error('No se pudo crear la cuenta');
      this.cuenta = { usuario: usuario.toLowerCase(), nombre, hogar: null, yo: null };
      this.clave = clave;
      this.guardarCuenta();
      this.ctx.sonido.premio();
      this.pintar();
    } catch (e) {
      this.error('No hay conexión. Prueba otra vez.');
    } finally {
      this.ocupado(b, false);
    }
  }

  async asignar(b, codigo) {
    if (!this.clave) {
      this.cuenta = null;
      this.guardarCuenta();
      this.pintar('entrar');
      return this.error('Vuelve a escribir tu contraseña');
    }
    if (codigo !== null && codigo.length !== 6) return this.error('El código tiene 6 letras');
    this.ocupado(b, true);
    try {
      let datos = null;
      let nuevo = codigo;
      if (codigo === null) {
        const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        nuevo = Array.from({ length: 6 }, () => L[Math.floor(Math.random() * L.length)]).join('');
        datos = this.ctx.instantanea(this.cuenta.nombre, 0);
      }
      const r = await this.ctx.sync.rpc('asignar_hogar', { p_usuario: this.cuenta.usuario, p_clave: this.clave, p_hogar: nuevo, p_datos: datos });
      if (r.error === 'llena') return this.error('Esa casa ya tiene a dos personas');
      if (r.error === 'no_existe') return this.error('No existe ninguna casa con ese código');
      if (r.error === 'ya_tiene') {
        this.cuenta.hogar = r.hogar;
        this.cuenta.yo = r.yo;
      } else if (r.error) return this.error('No se pudo, prueba otra vez');
      else {
        this.cuenta.hogar = r.hogar;
        this.cuenta.yo = r.yo;
      }
      this.guardarCuenta();
      this.ctx.sonido.premio();
      await this.entrarEnCasa(null, codigo === null);
    } catch (e) {
      this.error('No hay conexión. Prueba otra vez.');
    } finally {
      this.ocupado(b, false);
    }
  }

  async entrarEnCasa(b, recienCreada = false) {
    const c = this.cuenta;
    this.ocupado(b, true);
    try {
      await this.ctx.conectar(c.hogar, c.yo, c.nombre, recienCreada);
      this.ctx.sonido.premio();
      this.ocultar();
    } catch (e) {
      if (this.ctx.codigoLocal() === c.hogar) {
        this.ctx.sonido.pop();
        this.ocultar();
        this.ctx.ui.aviso('Sin conexión: se sincronizará al volver internet', true);
      } else {
        this.pintar('con-casa');
        this.error('No hay conexión para descargar la casa. Prueba otra vez.');
      }
    } finally {
      this.ocupado(b, false);
    }
  }

  cerrarSesion() {
    this.ctx.ui.dialogo({
      titulo: '¿Cerrar sesión?',
      texto: 'La casa está guardada en vuestra cuenta. Al cerrar sesión se borra de este móvil hasta que vuelvas a entrar.',
      botones: [
        { texto: 'Cancelar', tipo: 'secundario' },
        {
          texto: 'Cerrar sesión', tipo: 'rosa', accion: () => {
            this.cuenta = null;
            this.clave = null;
            this.guardarCuenta();
            this.ctx.cerrarSesion();
          }
        }
      ]
    });
  }
}
