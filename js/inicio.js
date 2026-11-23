const CLAVE_CUENTA = 'hogar-cuenta';

function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
    this.pintar();
  }

  ocultar() {
    this.capa.classList.add('fuera');
    setTimeout(() => { this.capa.style.display = 'none'; }, 450);
  }

  cabecera(sub = '') {
    return `<div class="inicio-logo"><div class="casita">🏠</div><h1>Nuestro Hogar</h1><p>${sub || 'Vuestra casita, a medias 💕'}</p></div>`;
  }

  error(texto) {
    const el = this.capa.querySelector('.inicio-error');
    if (el) {
      el.textContent = texto;
      el.classList.remove('oculto');
    }
    this.ctx.sonido.error();
  }

  ocupado(b, si) {
    if (!b) return;
    b.disabled = si;
    b.classList.toggle('cargando', si);
  }

  pintar(vista = null) {
    const c = this.cuenta;
    if (!c && !vista) vista = 'bienvenida';
    if (c && !c.hogar && !vista) vista = 'sin-casa';
    if (c && c.hogar && !vista) vista = 'con-casa';
    const panel = {
      bienvenida: `
        ${this.cabecera()}
        <div class="inicio-caja">
          <button class="primario" data-ir="entrar">Iniciar sesión</button>
          <button class="secundario" data-ir="crear">Crear cuenta</button>
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
        ${this.cabecera(`¡Hola, ${escapar(c && c.nombre)}!`)}
        <div class="inicio-caja">
          <button class="primario grande" id="in-casa">🏠 Entrar en casa</button>
          <p class="inicio-texto">Casa <b>${escapar(c && c.hogar)}</b></p>
          <p class="inicio-error oculto"></p>
          <button class="enlace" id="in-salir">Cerrar sesión</button>
        </div>`
    }[vista];
    this.capa.innerHTML = `<div class="inicio-fondo"></div><div class="inicio-panel">${panel}</div>`;
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
