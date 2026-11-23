function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function hoy() {
  return new Date().toDateString();
}

export class Pareja {
  constructor(ctx) {
    this.ctx = ctx;
    this.vistos = new Set(JSON.parse(localStorage.getItem('hogar-vistos') || '[]'));
  }

  get estado() {
    return this.ctx.estado;
  }

  get sync() {
    return this.ctx.sync;
  }

  nombre(i) {
    const p = this.estado.pareja || { nombres: ['', ''] };
    return p.nombres[i] || (i === this.sync.yo ? 'Tú' : 'Tu pareja');
  }

  otro() {
    return this.nombre(1 - this.sync.yo);
  }

  marcarVisto(id) {
    this.vistos.add(id);
    localStorage.setItem('hogar-vistos', JSON.stringify([...this.vistos].slice(-200)));
  }

  dia() {
    if (!this.estado.parejaDia || this.estado.parejaDia.dia !== hoy()) {
      this.estado.parejaDia = { dia: hoy(), visto: [false, false], limpiezas: [0, 0], premioVisto: false, premioLimpieza: false };
    }
    return this.estado.parejaDia;
  }

  registrar(evento) {
    if (!this.sync.activo) return;
    const d = this.dia();
    if (evento === 'limpiar') d.limpiezas[this.sync.yo]++;
  }

  revisar() {
    if (!this.sync.activo) return;
    const { ui, sonido } = this.ctx;
    const d = this.dia();
    if (!d.visto[this.sync.yo]) {
      d.visto[this.sync.yo] = true;
      this.ctx.guardar();
    }
    if (d.visto[0] && d.visto[1] && !d.premioVisto) {
      d.premioVisto = true;
      this.estado.monedas += 40;
      this.ctx.refrescarHud();
      this.ctx.guardar();
      sonido.premio();
      ui.aviso('💑 ¡Hoy habéis entrado los dos! +40 monedas');
    }
    if (d.limpiezas[0] + d.limpiezas[1] >= 5 && d.limpiezas[0] > 0 && d.limpiezas[1] > 0 && !d.premioLimpieza) {
      d.premioLimpieza = true;
      this.estado.monedas += 60;
      this.ctx.refrescarHud();
      this.ctx.guardar();
      sonido.premio();
      ui.aviso('🧹💑 ¡Misión de pareja: limpiar juntos! +60 monedas');
    }
    if (this.ctx.dialogoAbierto()) return;
    for (const n of this.estado.notas || []) {
      if (n.de === this.sync.yo || this.vistos.has(n.t)) continue;
      this.marcarVisto(n.t);
      sonido.mascota();
      ui.dialogo({
        titulo: `📝 Nota de ${this.nombre(n.de)}`,
        html: `<div class="nota-papel">${escapar(n.texto)}</div>`,
        botones: [{ texto: 'Responder', tipo: 'secundario', accion: () => setTimeout(() => this.escribirNota(), 250) }, { texto: '💕', tipo: 'primario' }]
      });
      return;
    }
    for (const r of this.estado.regalos || []) {
      if (r.para !== this.sync.yo || r.abierto) continue;
      sonido.premio();
      ui.dialogo({
        imagen: this.ctx.miniaturas.piezas('premio:regalo:raro', this.ctx.piezasRegalo),
        titulo: `🎁 ¡${this.nombre(r.de)} te ha hecho un regalo!`,
        texto: r.mensaje ? `"${escapar(r.mensaje)}"` : '¿Qué será?',
        botones: [{
          texto: 'Abrirlo', tipo: 'primario', accion: () => {
            r.abierto = true;
            this.ctx.inventario.anadir(r.id, r.color ?? null);
            this.ctx.ui.pintarInventario(this.ctx.inventario);
            this.ctx.guardar();
            setTimeout(() => {
              sonido.premio();
              ui.dialogo({ imagen: this.ctx.miniaturas.item(r.id, r.color), titulo: this.ctx.infoItem(r.id).nombre, texto: 'Ya está en el inventario. ¡Dale las gracias!', confeti: true, botones: [{ texto: '💕 ¡Gracias!', tipo: 'primario' }] });
            }, 300);
          }
        }]
      });
      return;
    }
    for (const v of this.estado.votos || []) {
      if (v.de === this.sync.yo || v.estado !== 'pendiente') continue;
      const info = this.ctx.infoItem(v.id);
      ui.dialogo({
        imagen: this.ctx.miniaturas.item(v.id, v.color),
        titulo: `🗳️ ${this.nombre(v.de)} quiere comprar…`,
        texto: `${info.nombre} por 🪙 ${v.precio}. ¿Qué te parece?`,
        botones: [
          { texto: '👎 Mejor no', tipo: 'secundario', accion: () => this.responderVoto(v, false) },
          { texto: '👍 ¡Sí!', tipo: 'primario', accion: () => this.responderVoto(v, true) }
        ]
      });
      return;
    }
    for (const v of this.estado.votos || []) {
      if (v.de !== this.sync.yo || v.estado === 'pendiente' || this.vistos.has(v.vid)) continue;
      this.marcarVisto(v.vid);
      const info = this.ctx.infoItem(v.id);
      ui.aviso(v.estado === 'si' ? `👍 ${this.otro()} ha dicho que sí: ${info.nombre} pedido` : `👎 ${this.otro()} prefiere no comprar ${info.nombre.toLowerCase()}`);
    }
  }

  responderVoto(v, si) {
    v.estado = si ? 'si' : 'no';
    if (si) {
      if (!this.ctx.comprar(v.id, v.color, v.precio)) v.estado = 'no';
    }
    this.ctx.guardar();
  }

  proponer(info, color, precio) {
    if (!this.sync.activo) {
      this.ctx.ui.aviso('Primero conectad vuestras casas en ✨ Más → Pareja', true);
      return;
    }
    if (!this.estado.votos) this.estado.votos = [];
    this.estado.votos.push({ vid: `v${Date.now()}`, de: this.sync.yo, id: info.id, color, precio, estado: 'pendiente' });
    this.estado.votos = this.estado.votos.slice(-10);
    this.ctx.guardar();
    this.ctx.sonido.pop();
    this.ctx.ui.aviso(`🗳️ Propuesta enviada a ${this.otro()}`);
  }

  regalar(info, color, precio) {
    if (!this.sync.activo) {
      this.ctx.ui.aviso('Primero conectad vuestras casas en ✨ Más → Pareja', true);
      return;
    }
    if (this.estado.monedas < precio) {
      this.ctx.sonido.error();
      this.ctx.ui.aviso('No te llega el dinero', true);
      return;
    }
    this.ctx.ui.dialogo({
      titulo: `🎁 Regalo para ${this.otro()}`,
      texto: 'Le llegará envuelto y lo abrirá con sorpresa. ¿Le dejas un mensaje?',
      html: '<div class="campo"><input type="text" maxlength="60" placeholder="Para ti, con cariño 💕"></div>',
      botones: [
        { texto: 'Cancelar', tipo: 'secundario' },
        {
          texto: `Regalar · 🪙 ${precio}`, tipo: 'primario', accion: caja => {
            this.estado.monedas -= precio;
            if (!this.estado.regalos) this.estado.regalos = [];
            this.estado.regalos.push({ rid: `r${Date.now()}`, de: this.sync.yo, para: 1 - this.sync.yo, id: info.id, color, mensaje: caja.querySelector('input').value.trim() });
            this.estado.regalos = this.estado.regalos.filter(r => !r.abierto).slice(-10);
            this.ctx.refrescarHud();
            this.ctx.guardar();
            this.ctx.sonido.comprar();
            this.ctx.ui.aviso(`🎁 ¡Regalo enviado a ${this.otro()}!`);
          }
        }
      ]
    });
  }

  escribirNota() {
    const { ui, sonido } = this.ctx;
    if (!this.sync.activo) {
      ui.aviso('Primero conectad vuestras casas en ✨ Más → Pareja', true);
      return;
    }
    const { caja } = ui.dialogo({
      titulo: `📝 Nota para ${this.otro()}`,
      texto: 'Se quedará pegada en la nevera con un imán.',
      html: '<div class="campo"><textarea maxlength="140" rows="3" placeholder="Te he dejado la cena en el micro 😘"></textarea></div>',
      botones: [
        { texto: 'Cancelar', tipo: 'secundario' },
        {
          texto: 'Pegar en la nevera', tipo: 'primario', accion: c => {
            const texto = c.querySelector('textarea').value.trim();
            if (!texto) return;
            if (!this.estado.notas) this.estado.notas = [];
            const t = Date.now();
            this.estado.notas.push({ t, de: this.sync.yo, texto });
            this.estado.notas = this.estado.notas.slice(-12);
            this.marcarVisto(t);
            this.ctx.guardar();
            sonido.pop();
            ui.aviso('📝 ¡Nota pegada!');
          }
        }
      ]
    });
    setTimeout(() => caja.querySelector('textarea').focus(), 250);
  }

  verNotas() {
    const { ui } = this.ctx;
    const notas = (this.estado.notas || []).slice().reverse();
    ui.dialogo({
      titulo: '📝 Notas de la nevera',
      html: notas.length ? `<div class="notas-lista">${notas.map(n => `<div class="nota-papel"><b>${escapar(this.nombre(n.de))}</b>${escapar(n.texto)}<small>${new Date(n.t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div>`).join('')}</div>` : '<p class="vacio">Todavía no hay notas.</p>',
      botones: [{ texto: 'Cerrar', tipo: 'secundario' }, { texto: '✏️ Escribir', tipo: 'primario', accion: () => setTimeout(() => this.escribirNota(), 250) }]
    });
  }

  hoyISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  recordar(clave, icono, texto) {
    if (!this.estado.primeros) this.estado.primeros = [];
    if (clave && this.estado.primeros.includes(clave)) return;
    if (clave) this.estado.primeros.push(clave);
    if (!this.estado.recuerdos) this.estado.recuerdos = [];
    this.estado.recuerdos.push({ t: Date.now(), icono, texto });
    this.estado.recuerdos = this.estado.recuerdos.slice(-80);
    this.ctx.guardar();
    this.ctx.ui.aviso(`🌳 Nuevo recuerdo: ${texto}`);
  }

  verRecuerdos() {
    const r = (this.estado.recuerdos || []).slice().reverse();
    this.ctx.ui.abrirGen('Nuestros recuerdos', `
      <p class="gen-intro">Los momentos especiales se apuntan solos. Si ponéis el <b>Árbol de recuerdos</b> (tienda → Deco), le sale una hoja por cada uno.</p>
      <div class="recuerdos">${r.length ? r.map(x => `<div class="recuerdo"><span>${x.icono}</span><div><b>${escapar(x.texto)}</b><small>${new Date(x.t).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</small></div></div>`).join('') : '<p class="vacio">Todavía no hay recuerdos. ¡A crearlos!</p>'}</div>`, () => (this.sync.activo ? this.abrir() : this.ctx.abrirMas()));
  }

  alternarDeseo(info, color) {
    const yo = this.sync.activo ? this.sync.yo : 0;
    if (!this.estado.deseos) this.estado.deseos = { 0: [], 1: [] };
    const lista = this.estado.deseos[yo] || (this.estado.deseos[yo] = []);
    const i = lista.findIndex(d => d.id === info.id);
    if (i >= 0) lista.splice(i, 1);
    else lista.push({ id: info.id, color });
    this.ctx.guardar();
    this.ctx.sonido.pop();
    this.ctx.ui.aviso(i >= 0 ? '💔 Quitado de tu lista de deseos' : `❤️ Apuntado en tu lista de deseos${this.sync.activo ? ` (${this.otro()} lo verá)` : ''}`);
    return i < 0;
  }

  esDeseo(id) {
    const yo = this.sync.activo ? this.sync.yo : 0;
    return !!(this.estado.deseos && (this.estado.deseos[yo] || []).some(d => d.id === id));
  }

  verDeseos() {
    const lista = ((this.estado.deseos || {})[1 - this.sync.yo] || []);
    const cuerpo = this.ctx.ui.abrirGen(`Deseos de ${this.otro()}`, `
      <p class="gen-intro">Lo que a ${escapar(this.otro())} le gustaría tener. ¡Pista para regalos!</p>
      <div class="deseos">${lista.length ? lista.map((d, i) => {
        const info = this.ctx.infoItem(d.id);
        return `<button class="deseo" data-i="${i}"><img src="${this.ctx.miniaturas.item(d.id, d.color)}" alt=""><b>${escapar(info.nombre)}</b><small>🎁 Regalar · 🪙 ${info.precio}</small></button>`;
      }).join('') : `<p class="vacio">${escapar(this.otro())} aún no ha apuntado nada. Se apunta con ❤️ en la tienda.</p>`}</div>`, () => this.abrir());
    cuerpo.querySelectorAll('.deseo').forEach(b => b.addEventListener('click', () => {
      const d = lista[Number(b.dataset.i)];
      const info = this.ctx.infoItem(d.id);
      this.regalar(info, d.color, info.precio);
    }));
  }

  verCapsulas() {
    const { ui } = this.ctx;
    const caps = (this.estado.capsulas || []).slice().reverse();
    const ahora = Date.now();
    const cuerpo = ui.abrirGen('Cápsula del tiempo', `
      <p class="gen-intro">Escribid un mensaje que no se podrá leer hasta la fecha que elijáis.</p>
      <button id="cap-nueva" class="primario">✍️ Guardar un mensaje</button>
      <div class="capsulas">${caps.map(c => c.abrir <= ahora
        ? `<div class="capsula abierta"><span>💌</span><div><b>De ${escapar(this.nombre(c.de))}</b><p>${escapar(c.texto)}</p><small>Escrito el ${new Date(c.creada).toLocaleDateString('es-ES')}</small></div></div>`
        : `<div class="capsula"><span>🔒</span><div><b>De ${escapar(this.nombre(c.de))}</b><small>Se abre el ${new Date(c.abrir).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · faltan ${Math.ceil((c.abrir - ahora) / 86400000)} días</small></div></div>`).join('')}</div>`, () => this.abrir());
    cuerpo.querySelector('#cap-nueva').addEventListener('click', () => {
      ui.dialogo({
        titulo: '⏳ Mensaje para el futuro',
        html: '<div class="campo"><textarea maxlength="400" rows="4" placeholder="Querido yo del futuro…"></textarea></div>',
        botones: [
          { texto: 'En 1 mes', tipo: 'secundario', accion: c => this.guardarCapsula(c, 30) },
          { texto: 'En 6 meses', tipo: 'secundario', accion: c => this.guardarCapsula(c, 182) },
          { texto: 'En 1 año', tipo: 'primario', accion: c => this.guardarCapsula(c, 365) }
        ],
        columna: true
      });
    });
  }

  guardarCapsula(caja, dias) {
    const texto = caja.querySelector('textarea').value.trim();
    if (!texto) return;
    if (!this.estado.capsulas) this.estado.capsulas = [];
    const id = `c${Date.now()}`;
    this.estado.capsulas.push({ id, de: this.sync.activo ? this.sync.yo : 0, texto, creada: Date.now(), abrir: Date.now() + dias * 86400000 });
    this.marcarVisto(id);
    this.ctx.guardar();
    this.ctx.sonido.arreglo();
    this.ctx.ui.aviso('⏳ Guardado en la cápsula. ¡Hasta entonces!');
    this.recordar('capsula', '⏳', 'Guardamos nuestro primer mensaje en la cápsula del tiempo');
    setTimeout(() => this.verCapsulas(), 300);
  }

  verPlanes() {
    const { ui } = this.ctx;
    const hoy = this.hoyISO();
    const planes = (this.estado.planes || []).filter(p => p.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const TIPOS = { cena: '🕯️ Cena', viaje: '🧳 Viaje', cine: '🍿 Peli', fiesta: '🎉 Fiesta', otro: '⭐ Otro' };
    const cuerpo = ui.abrirGen('Nuestros planes', `
      <p class="gen-intro">Apuntad planes de verdad. El día antes aparecerán cosas en casa (la maleta en la puerta, velas en la mesa…).</p>
      <div class="ajustes">
        <input id="pl-titulo" maxlength="40" placeholder="Cena en el italiano">
        <div class="fila2"><input id="pl-fecha" type="date" min="${hoy}"><select id="pl-tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <button id="pl-anadir" class="primario">➕ Apuntar plan</button>
      </div>
      <div class="planes">${planes.map(p => `<div class="plan"><span>${TIPOS[p.tipo].split(' ')[0]}</span><div><b>${escapar(p.titulo)}</b><small>${new Date(p.fecha + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</small></div><button class="borrar" data-id="${p.id}">✕</button></div>`).join('') || '<p class="vacio">No hay planes apuntados.</p>'}</div>`, () => this.abrir());
    cuerpo.querySelector('#pl-anadir').addEventListener('click', () => {
      const titulo = cuerpo.querySelector('#pl-titulo').value.trim();
      const fecha = cuerpo.querySelector('#pl-fecha').value;
      const tipo = cuerpo.querySelector('#pl-tipo').value;
      if (!titulo || !fecha) {
        ui.aviso('Pon un título y una fecha', true);
        return;
      }
      if (!this.estado.planes) this.estado.planes = [];
      this.estado.planes.push({ id: `p${Date.now()}`, titulo, fecha, tipo, de: this.sync.activo ? this.sync.yo : 0 });
      this.ctx.guardar();
      this.ctx.sonido.arreglo();
      this.verPlanes();
    });
    cuerpo.querySelectorAll('.plan .borrar').forEach(b => b.addEventListener('click', () => {
      this.estado.planes = this.estado.planes.filter(p => p.id !== b.dataset.id);
      this.ctx.guardar();
      this.verPlanes();
    }));
  }

  planesActivos() {
    const hoy = this.hoyISO();
    const man = new Date(Date.now() + 86400000);
    const manana = `${man.getFullYear()}-${String(man.getMonth() + 1).padStart(2, '0')}-${String(man.getDate()).padStart(2, '0')}`;
    return (this.estado.planes || []).filter(p => p.fecha === hoy || p.fecha === manana);
  }

  revisarPlanes() {
    const hoy = this.hoyISO();
    for (const p of this.estado.planes || []) {
      if (p.fecha < hoy && !p.recordado) {
        p.recordado = true;
        const icono = { cena: '🕯️', viaje: '🧳', cine: '🍿', fiesta: '🎉', otro: '⭐' }[p.tipo];
        this.recordar(null, icono, p.titulo);
      }
    }
    if (this.ctx.dialogoAbierto()) return;
    for (const p of this.planesActivos()) {
      const clave = `plan-${p.id}-${p.fecha === hoy ? 'hoy' : 'manana'}`;
      if (this.vistos.has(clave)) continue;
      this.marcarVisto(clave);
      this.ctx.ui.dialogo({
        imagen: this.ctx.miniaturas.personaje('lola'), personaje: true,
        titulo: p.fecha === hoy ? `¡Hoy toca: ${escapar(p.titulo)}!` : `Mañana: ${escapar(p.titulo)}`,
        texto: p.fecha === hoy ? '¡Que lo paséis genial! 💕' : 'Os he dejado algo preparado en casa 😉',
        botones: [{ texto: '¡Qué ganas!', tipo: 'primario' }]
      });
      return;
    }
    for (const c of this.estado.capsulas || []) {
      if (c.abrir > Date.now() || this.vistos.has(c.id)) continue;
      this.marcarVisto(c.id);
      this.ctx.sonido.premio();
      this.ctx.ui.dialogo({
        titulo: '💌 ¡Se ha abierto la cápsula del tiempo!',
        html: `<div class="nota-papel"><b>${escapar(this.nombre(c.de))}, ${new Date(c.creada).toLocaleDateString('es-ES')}</b>${escapar(c.texto)}</div>`,
        confeti: true,
        botones: [{ texto: '🥹', tipo: 'primario' }]
      });
      return;
    }
  }

  abrir() {
    const { ui } = this.ctx;
    if (!this.sync.activo) {
      const cuerpo = ui.abrirGen('Pareja', `
        <p class="gen-intro">Para compartir la casa, entrad con vuestra cuenta desde el menú principal: uno crea la casa y el otro se une con el código.</p>
        <button id="pj-menu" class="primario">🏠 Ir al menú principal</button>`, () => this.ctx.abrirMas());
      cuerpo.querySelector('#pj-menu').addEventListener('click', () => this.ctx.abrirInicio());
      return;
    }
    const d = this.dia();
    const yo = this.sync.yo;
    const conectado = this.sync.ultimaRemota && Date.now() - this.sync.ultimaRemota < 5 * 60000;
    const notas = this.estado.notas || [];
    const cuerpo = ui.abrirGen('Pareja', `
      <div class="pj-codigo"><small>Vuestro código</small><b>${this.sync.codigo}</b><button id="pj-compartir" class="secundario">📤 Mandárselo</button></div>
      <p class="gen-intro centrado">${this.sync.error ? '⚠️ Sin conexión ahora mismo, se sincronizará al volver.' : conectado ? `🟢 ${escapar(this.otro())} ha estado jugando hace poco` : `Eres <b>${escapar(this.nombre(yo))}</b>. Lo que hagáis se guarda en los dos móviles.`}</p>
      <div class="seccion-titulo">Misiones de pareja (hoy)</div>
      <div class="pj-mision ${d.premioVisto ? 'hecha' : ''}"><span>💑</span><div><b>Entrad los dos hoy</b><small>${d.visto[0] ? '✅' : '⬜'} ${escapar(this.nombre(0))} · ${d.visto[1] ? '✅' : '⬜'} ${escapar(this.nombre(1))}</small></div><em>🪙 40</em></div>
      <div class="pj-mision ${d.premioLimpieza ? 'hecha' : ''}"><span>🧹</span><div><b>Limpiad 5 cosas entre los dos</b><small>${escapar(this.nombre(0))}: ${d.limpiezas[0]} · ${escapar(this.nombre(1))}: ${d.limpiezas[1]} (los dos tenéis que ayudar)</small></div><em>🪙 60</em></div>
      <div class="seccion-titulo">Cosas de pareja</div>
      <button id="pj-nota" class="secundario">📝 Dejar una nota en la nevera</button>
      <button id="pj-notas" class="secundario">📬 Ver notas (${notas.length})</button>
      <button id="pj-deseos" class="secundario">❤️ Lista de deseos de ${escapar(this.otro())} (${((this.estado.deseos || {})[1 - yo] || []).length})</button>
      <button id="pj-capsula" class="secundario">⏳ Cápsula del tiempo (${(this.estado.capsulas || []).length})</button>
      <button id="pj-planes" class="secundario">📅 Nuestros planes (${(this.estado.planes || []).filter(p => p.fecha >= this.hoyISO()).length})</button>
      <button id="pj-recuerdos" class="secundario">🌳 Nuestros recuerdos (${(this.estado.recuerdos || []).length})</button>
      <p class="gen-intro">🎁 Para hacer un regalo o proponer una compra, elegid el objeto en la tienda y usad los botones <b>🎁</b>, <b>🗳️</b> y <b>❤️</b>.</p>
      `, () => this.ctx.abrirMas());
    cuerpo.querySelector('#pj-compartir').addEventListener('click', async () => {
      const texto = `Únete a nuestra casa en Nuestro Hogar 🏠💕 Código: ${this.sync.codigo}\nhttps://oliver8998.github.io/nuestro-hogar/`;
      try {
        if (navigator.share) await navigator.share({ text: texto });
        else {
          await navigator.clipboard.writeText(texto);
          ui.aviso('📋 Copiado');
        }
      } catch (e) {}
    });
    cuerpo.querySelector('#pj-nota').addEventListener('click', () => this.escribirNota());
    cuerpo.querySelector('#pj-notas').addEventListener('click', () => this.verNotas());
    cuerpo.querySelector('#pj-deseos').addEventListener('click', () => this.verDeseos());
    cuerpo.querySelector('#pj-capsula').addEventListener('click', () => this.verCapsulas());
    cuerpo.querySelector('#pj-planes').addEventListener('click', () => this.verPlanes());
    cuerpo.querySelector('#pj-recuerdos').addEventListener('click', () => this.verRecuerdos());
  }
}
