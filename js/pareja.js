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

  abrir() {
    const { ui } = this.ctx;
    if (!this.sync.activo) {
      const p = this.estado.pareja || { nombres: ['', ''] };
      const cuerpo = ui.abrirGen('Pareja', `
        <p class="gen-intro">Conectad vuestros móviles para que la casa sea la misma en los dos: lo que uno mueve, el otro lo ve.</p>
        <label class="etq">¿Quién eres tú?</label>
        <div class="fila2 quien">
          <button class="secundario sel-quien" data-i="0">${escapar(p.nombres[0] || 'Persona 1')}</button>
          <button class="secundario sel-quien" data-i="1">${escapar(p.nombres[1] || 'Persona 2')}</button>
        </div>
        <small class="nota">Los nombres se cambian en Ajustes.</small>
        <button id="pj-crear" class="primario">🏠 Crear casa compartida</button>
        <p class="gen-intro centrado">¿Tu pareja ya la ha creado?</p>
        <div class="campo"><input id="pj-codigo" maxlength="6" placeholder="CÓDIGO" style="text-transform:uppercase;letter-spacing:4px;text-align:center"></div>
        <button id="pj-unirse" class="rosa">💑 Unirme con el código</button>`, () => this.ctx.abrirMas());
      let yo = null;
      cuerpo.querySelectorAll('.sel-quien').forEach(b => b.addEventListener('click', () => {
        yo = Number(b.dataset.i);
        cuerpo.querySelectorAll('.sel-quien').forEach(x => x.classList.toggle('elegido', x === b));
      }));
      const pedirQuien = () => {
        if (yo === null) {
          ui.aviso('Primero elige quién eres', true);
          return false;
        }
        return true;
      };
      cuerpo.querySelector('#pj-crear').addEventListener('click', async e => {
        if (!pedirQuien()) return;
        e.currentTarget.disabled = true;
        try {
          const codigo = await this.sync.crear(this.ctx.instantanea(), yo);
          this.ctx.sonido.premio();
          this.abrir();
          ui.aviso(`🏠 Casa creada. Código: ${codigo}`);
        } catch (err) {
          ui.aviso('No se pudo conectar. ¿Tienes internet?', true);
          e.currentTarget.disabled = false;
        }
      });
      cuerpo.querySelector('#pj-unirse').addEventListener('click', async e => {
        if (!pedirQuien()) return;
        const codigo = cuerpo.querySelector('#pj-codigo').value.trim();
        if (codigo.length < 6) {
          ui.aviso('El código tiene 6 letras', true);
          return;
        }
        ui.dialogo({
          titulo: '¿Unirte a la casa de tu pareja?',
          texto: 'La casa de este móvil se cambiará por la compartida (vuestras fotos se quedan).',
          botones: [
            { texto: 'Cancelar', tipo: 'secundario' },
            {
              texto: 'Unirme', tipo: 'primario', accion: async () => {
                try {
                  const datos = await this.sync.unirse(codigo, yo);
                  if (!datos) {
                    ui.aviso('No existe ninguna casa con ese código', true);
                    return;
                  }
                  this.ctx.aplicarRemoto(datos, false, true);
                  this.ctx.sonido.premio();
                  ui.aviso('💑 ¡Conectados! Ya estáis en la misma casa');
                  this.abrir();
                } catch (err) {
                  ui.aviso('No se pudo conectar. ¿Tienes internet?', true);
                }
              }
            }
          ]
        });
      });
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
      <p class="gen-intro">🎁 Para hacer un regalo o proponer una compra, elegid el objeto en la tienda y usad los botones <b>🎁</b> y <b>🗳️</b>.</p>
      <button id="pj-salir" class="secundario">Desconectar este móvil</button>`, () => this.ctx.abrirMas());
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
    cuerpo.querySelector('#pj-salir').addEventListener('click', () => {
      ui.dialogo({
        titulo: '¿Desconectar?',
        texto: 'Este móvil dejará de compartir la casa. La casa seguirá guardada aquí tal cual.',
        botones: [{ texto: 'Cancelar', tipo: 'secundario' }, { texto: 'Desconectar', tipo: 'rosa', accion: () => { this.sync.salir(); this.ctx.alDesconectar(); this.abrir(); } }]
      });
    });
  }
}
