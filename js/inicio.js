import { Escaparate, periodo } from './escaparate.js';

const CLAVE_CUENTA = 'hogar-cuenta';

function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}


const CIELOS = {
  dia: { cielo: ['#5fb4ea', '#8fcdf2', '#c8e7f7', '#f3f0e4'], nube: ['#ffffff', '#e4eef7', '#c3d6e8'], sol: ['#fff6c8', '#ffd76a'], halo: '#fff3b0' },
  tarde: { cielo: ['#4b4a9a', '#9a6fb5', '#f08a7c', '#ffc98f'], nube: ['#ffd9c4', '#f2a6a0', '#b77a9e'], sol: ['#ffe3a0', '#ff8a4c'], halo: '#ffb070' },
  noche: { cielo: ['#070a24', '#141a45', '#2a2a66', '#4a3d78'], nube: ['#3c3f78', '#2c2f63', '#1f2250'], sol: ['#fffbe8', '#e8e0c0'], halo: '#c9d4ff' }
};

function nubeSvg(r, x, y, s, dur, clase = '') {
  const bolas = [];
  const n = 6 + Math.floor(r() * 4);
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const bx = (t - 0.5) * 110 + (r() - 0.5) * 10;
    const alto = Math.sin(t * Math.PI);
    const rad = 14 + alto * 22 + r() * 8;
    bolas.push([bx, -alto * 18 - r() * 6, rad]);
  }
  const cuerpo = bolas.map(([bx, by, rad]) => `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${rad.toFixed(1)}"/>`).join('');
  return `<g class="nube ${clase}" style="animation-duration:${dur}s;animation-delay:-${(r() * dur).toFixed(1)}s"><g transform="translate(${x} ${y}) scale(${s})">
    <g fill="url(#nubeSombra)" transform="translate(4 7)">${cuerpo}<rect x="-62" y="-4" width="124" height="20" rx="10"/></g>
    <g fill="url(#nubeCuerpo)">${cuerpo}<rect x="-62" y="-6" width="124" height="20" rx="10"/></g>
    <g fill="url(#nubeLuz)" opacity=".85">${bolas.filter((_, k) => k % 2).map(([bx, by, rad]) => `<circle cx="${(bx - rad * 0.2).toFixed(1)}" cy="${(by - rad * 0.25).toFixed(1)}" r="${(rad * 0.7).toFixed(1)}"/>`).join('')}</g>
  </g></g>`;
}

function escenaSvg() {
  const p = periodo();
  const noche = p === 'noche';
  const C = CIELOS[p];
  const r = (() => { let x = 11; return () => ((x = (x * 9301 + 49297) % 233280) / 233280); })();
  const sx = noche ? 68 : p === 'tarde' ? 340 : 338;
  const sy = p === 'tarde' ? 560 : noche ? 64 : 60;
  let astro;
  if (noche) {
    astro = `<circle cx="${sx}" cy="${sy}" r="90" fill="url(#halo)" class="halo"/>
      <circle cx="${sx}" cy="${sy}" r="34" fill="url(#luna)"/>
      <circle cx="${sx - 10}" cy="${sy - 8}" r="7" fill="#d8d0b0" opacity=".55"/><circle cx="${sx + 12}" cy="${sy + 6}" r="5" fill="#d8d0b0" opacity=".5"/><circle cx="${sx + 2}" cy="${sy + 16}" r="3.5" fill="#d8d0b0" opacity=".5"/><circle cx="${sx - 14}" cy="${sy + 12}" r="2.5" fill="#d8d0b0" opacity=".45"/>`;
  } else {
    const rayos = Array.from({ length: 12 }, (_, k) => {
      const a = k * Math.PI / 6;
      return `<path d="M${(sx + Math.cos(a - 0.08) * 46).toFixed(1)} ${(sy + Math.sin(a - 0.08) * 46).toFixed(1)} L${(sx + Math.cos(a) * (k % 2 ? 78 : 96)).toFixed(1)} ${(sy + Math.sin(a) * (k % 2 ? 78 : 96)).toFixed(1)} L${(sx + Math.cos(a + 0.08) * 46).toFixed(1)} ${(sy + Math.sin(a + 0.08) * 46).toFixed(1)}Z"/>`;
    }).join('');
    astro = `<circle cx="${sx}" cy="${sy}" r="${p === 'tarde' ? 150 : 120}" fill="url(#halo)" class="halo"/>
      <g class="rayos" style="transform-origin:${sx}px ${sy}px" fill="${C.halo}" opacity=".35">${rayos}</g>
      <circle cx="${sx}" cy="${sy}" r="${p === 'tarde' ? 44 : 36}" fill="url(#sol)"/>`;
  }
  const estrellas = noche ? Array.from({ length: 70 }, () => {
    const x = r() * 400;
    const y = r() * 520;
    const t = r();
    if (t > 0.9) return `<path class="estrella brilla" style="animation-delay:${(r() * 4).toFixed(2)}s;transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px" d="M${x} ${y - 6} Q${x} ${y} ${x + 6} ${y} Q${x} ${y} ${x} ${y + 6} Q${x} ${y} ${x - 6} ${y} Q${x} ${y} ${x} ${y - 6}Z"/>`;
    return `<circle class="estrella" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5 + t * 1.4).toFixed(1)}" style="animation-delay:${(r() * 4).toFixed(2)}s"/>`;
  }).join('') : '';
  const via = noche ? '<ellipse cx="160" cy="240" rx="260" ry="46" fill="url(#via)" transform="rotate(-28 160 240)" opacity=".5"/>' : '';
  const fugaz = noche ? '<g class="fugaz"><path d="M0 0 L-70 -26" stroke="url(#estela)" stroke-width="2.4" stroke-linecap="round"/><circle r="2.2" fill="#fff"/></g>' : '';
  const nubesLejos = `<g class="banco" opacity="${noche ? 0.5 : 0.9}">${Array.from({ length: 9 }, (_, k) => `<circle cx="${k * 50 - 10}" cy="${700 + (k % 2) * 16}" r="${60 + (k % 3) * 14}" fill="url(#nubeCuerpo)"/>`).join('')}<rect x="0" y="720" width="400" height="80" fill="url(#nubeCuerpo)"/></g>`;
  const nubes = `${nubeSvg(r, 70, 250, 0.95, 90)}${nubeSvg(r, 250, 120, 0.7, 120, 'lejana')}${nubeSvg(r, 180, 420, 1.15, 70)}${nubeSvg(r, 40, 560, 0.8, 100, 'lejana')}`;
  const globo = p !== 'noche' ? `<g class="globo"><g transform="translate(0 0)">
      <path d="M0 -30 C20 -30 26 -12 20 4 C15 16 6 22 4 26 L-4 26 C-6 22 -15 16 -20 4 C-26 -12 -20 -30 0 -30Z" fill="url(#globo)"/>
      <path d="M0 -30 C8 -20 8 10 4 26 M0 -30 C-8 -20 -8 10 -4 26" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"/>
      <path d="M-4 26 L-5 33 M4 26 L5 33" stroke="#8a5a3c" stroke-width="1"/><rect x="-6" y="33" width="12" height="8" rx="2" fill="#a0703f"/>
    </g></g>` : '';
  const pajaros = p === 'dia' ? '<g class="pajaros"><path d="M0 0 q6 -6 12 0 q6 -6 12 0"/><path d="M30 14 q5 -5 10 0 q5 -5 10 0"/><path d="M14 26 q4 -4 8 0 q4 -4 8 0"/></g>' : '';
  return `<svg class="inicio-svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">${C.cielo.map((c, k) => `<stop offset="${(k / (C.cielo.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>
      <radialGradient id="halo"><stop offset="0" stop-color="${C.halo}" stop-opacity=".75"/><stop offset=".4" stop-color="${C.halo}" stop-opacity=".25"/><stop offset="1" stop-color="${C.halo}" stop-opacity="0"/></radialGradient>
      <radialGradient id="sol" cx=".4" cy=".35"><stop offset="0" stop-color="${C.sol[0]}"/><stop offset="1" stop-color="${C.sol[1]}"/></radialGradient>
      <radialGradient id="luna" cx=".35" cy=".35"><stop offset="0" stop-color="#fffdf2"/><stop offset="1" stop-color="#e6dcb8"/></radialGradient>
      <linearGradient id="nubeCuerpo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.nube[0]}"/><stop offset="1" stop-color="${C.nube[1]}"/></linearGradient>
      <linearGradient id="nubeSombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.nube[2]}" stop-opacity=".3"/><stop offset="1" stop-color="${C.nube[2]}" stop-opacity=".7"/></linearGradient>
      <radialGradient id="nubeLuz"><stop offset="0" stop-color="#fff" stop-opacity="${noche ? 0.15 : 0.9}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="via" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7fd0" stop-opacity="0"/><stop offset=".5" stop-color="#b0a6ff" stop-opacity=".35"/><stop offset="1" stop-color="#8a7fd0" stop-opacity="0"/></linearGradient>
      <linearGradient id="estela" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="globo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e58f9e"/><stop offset=".33" stop-color="#e58f9e"/><stop offset=".33" stop-color="#f2d06b"/><stop offset=".66" stop-color="#f2d06b"/><stop offset=".66" stop-color="#7fc4e0"/><stop offset="1" stop-color="#7fc4e0"/></linearGradient>
    </defs>
    <rect width="400" height="800" fill="url(#cielo)"/>
    ${via}${estrellas}${fugaz}${astro}${nubes}${globo}${pajaros}${nubesLejos}
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
    this.capa.innerHTML = `<div class="inicio-fondo">${escenaSvg()}</div><div class="inicio-titulo">${'Nuestro Hogar'.split('').map((l, i) => `<span style="animation-delay:${(0.1 + i * 0.06).toFixed(2)}s">${l === ' ' ? '&nbsp;' : l}</span>`).join('')}</div>
      <div class="escaparate"><div class="esc-lienzo"></div></div><div class="inicio-panel"></div>`;
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
`;
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
