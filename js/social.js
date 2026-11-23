import * as THREE from 'three';
import { crearPersonaje } from './personajes.js';

const INVITADOS = {
  mama: 'Mamá',
  mateo: 'Mateo',
  sol: 'Sol',
  amigos: 'Dani',
  lola: 'Pilar'
};
const MUSICA = ['radio', 'piano', 'arcade', 'tele'];
const LAMPARAS = ['lampara', 'lampara-mesa', 'lampara-lava', 'lampara-corazon', 'arbol-navidad', 'calabaza', 'chimenea'];
const NOTAS_FIESTA = [523.3, 659.3, 784, 659.3, 587.3, 698.5, 880, 698.5];

function escapar(t) {
  return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function hoy() {
  return new Date().toDateString();
}

export class Social {
  constructor(ctx) {
    this.ctx = ctx;
    this.visita = null;
    this.fiesta = null;
    this.t = 0;
    const barra = document.createElement('div');
    barra.id = 'visita-barra';
    barra.className = 'oculto';
    barra.innerHTML = `
      <div class="vb-cab"><b></b><small></small></div>
      <div class="vb-habs"><button data-h="-1">‹</button><span></span><button data-h="1">›</button></div>
      <div class="vb-botones"><button class="vb-like">❤️ Me gusta</button><button class="vb-nota">📝 Nota</button><button class="vb-volver primario">🏠 Volver</button></div>`;
    document.body.appendChild(barra);
    this.barra = barra;
    barra.querySelectorAll('.vb-habs button').forEach(b => b.addEventListener('click', () => this.moverHab(Number(b.dataset.h))));
    barra.querySelector('.vb-like').addEventListener('click', () => this.like());
    barra.querySelector('.vb-nota').addEventListener('click', () => this.nota());
    barra.querySelector('.vb-volver').addEventListener('click', () => this.volver());
  }

  get estado() {
    return this.ctx.estado;
  }

  amigos() {
    if (!this.estado.amigos) this.estado.amigos = [];
    return this.estado.amigos;
  }

  abrir() {
    const { ui, sync } = this.ctx;
    const amigos = this.amigos();
    const recibidas = (this.estado.visitas || []).slice(-6).reverse();
    const cuerpo = ui.abrirGen('🏘️ Amigos', `
      <div class="codigo-propio">${sync.activo ? `Vuestro código para que os visiten:<b>${sync.codigo}</b>` : 'Conectad la casa desde el menú principal para que vuestros amigos os puedan visitar.'}</div>
      <div class="campo fila-campo"><input id="cod-visita" maxlength="8" placeholder="Código de un amigo" autocapitalize="characters"><button class="primario" id="ir-visita">Visitar</button></div>
      ${amigos.length ? `<h4 class="gen-sub">Casas de amigos</h4><div class="amigos">${amigos.map(a => `<div class="amigo"><span>🏠</span><div><b>${escapar(a.nombre || a.codigo)}</b><small>${a.codigo}</small></div><button data-ir="${a.codigo}">Visitar</button><button class="quitar" data-quitar="${a.codigo}">✕</button></div>`).join('')}</div>` : ''}
      <div class="botones-social">
        <button class="fila-accion" id="ver-ranking"><span>🏆</span><div><b>Ranking de casas</b><small>Las casas más acogedoras de vuestros amigos</small></div></button>
        <button class="fila-accion" id="montar-fiesta"><span>🎉</span><div><b>Montar una fiesta</b><small>${this.puedeFiesta() ? 'Invitad gente: cuentan la comida, la música y las luces' : 'Ya habéis hecho fiesta hoy. ¡Mañana más!'}</small></div></button>
      </div>
      ${recibidas.length ? `<h4 class="gen-sub">Os han visitado</h4><div class="visitas-recibidas">${recibidas.map(v => `<div><b>${v.like ? '❤️' : '📝'} ${escapar(v.de || 'Alguien')}</b>${v.nota ? `<small>"${escapar(v.nota)}"</small>` : ''}</div>`).join('')}</div>` : ''}
      <p class="gen-intro">❤️ ${this.estado.likes || 0} me gusta en vuestra casa</p>`, () => this.ctx.abrirMas());
    const input = cuerpo.querySelector('#cod-visita');
    cuerpo.querySelector('#ir-visita').addEventListener('click', () => this.visitar(input.value.trim().toUpperCase()));
    cuerpo.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => this.visitar(b.dataset.ir)));
    cuerpo.querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', () => {
      this.estado.amigos = amigos.filter(a => a.codigo !== b.dataset.quitar);
      this.ctx.guardar();
      this.abrir();
    }));
    cuerpo.querySelector('#ver-ranking').addEventListener('click', () => this.ranking());
    cuerpo.querySelector('#montar-fiesta').addEventListener('click', () => this.prepararFiesta());
  }

  async visitar(codigo) {
    const { ui, sync } = this.ctx;
    if (!/^[A-Z0-9]{4,8}$/.test(codigo)) {
      ui.aviso('Escribid un código válido', true);
      return;
    }
    if (codigo === sync.codigo) {
      ui.aviso('¡Esa es vuestra casa! 😄', true);
      return;
    }
    ui.aviso('🚶 Yendo de visita…');
    let datos = null;
    try {
      datos = await sync.verCasa(codigo);
    } catch (e) {
      ui.aviso('No hay conexión ahora mismo', true);
      return;
    }
    if (!datos || !datos.estado) {
      ui.aviso('No existe ninguna casa con ese código', true);
      return;
    }
    const e = datos.estado;
    const nombre = (e.pareja && e.pareja.casa) || 'Casa de amigos';
    const amigos = this.amigos();
    const ya = amigos.find(a => a.codigo === codigo);
    if (ya) ya.nombre = nombre;
    else amigos.push({ codigo, nombre });
    this.estado.amigos = amigos.slice(-20);
    this.ctx.guardar();
    ui.cerrarHojas();
    this.visita = { codigo, datos, nombre, hab: 0 };
    this.ctx.entrarVisita(datos);
    this.ctx.verHabitacionVisita(0);
    this.pintarBarra();
    this.barra.classList.remove('oculto');
    this.ctx.sonido.premio();
  }

  pintarBarra() {
    const v = this.visita;
    const e = v.datos.estado;
    const nombres = e.pareja && e.pareja.nombres ? e.pareja.nombres.filter(Boolean).join(' y ') : '';
    const habs = this.ctx.habitacionesDe(v.datos);
    this.barra.querySelector('.vb-cab b').textContent = `🏠 ${v.nombre}`;
    this.barra.querySelector('.vb-cab small').textContent = `${nombres ? `${nombres} · ` : ''}❤️ ${e.likes || 0}`;
    this.barra.querySelector('.vb-habs span').textContent = habs[v.hab] || 'Salón';
    this.barra.querySelector('.vb-habs').classList.toggle('oculto', habs.length < 2);
    const dado = (this.estado.likesDados || {})[v.codigo] === hoy();
    this.barra.querySelector('.vb-like').classList.toggle('dado', dado);
  }

  moverHab(d) {
    const v = this.visita;
    const n = this.ctx.habitacionesDe(v.datos).length;
    v.hab = (v.hab + d + n) % n;
    this.ctx.verHabitacionVisita(v.hab);
    this.pintarBarra();
    this.ctx.sonido.pop();
  }

  miNombre() {
    const p = this.estado.pareja;
    return (p && p.casa) || 'Unos amigos';
  }

  async like() {
    const v = this.visita;
    if (!this.estado.likesDados) this.estado.likesDados = {};
    if (this.estado.likesDados[v.codigo] === hoy()) {
      this.ctx.ui.aviso('Ya les habéis dado un me gusta hoy ❤️');
      return;
    }
    const ok = await this.ctx.sync.mandarA(v.codigo, 'visita', { like: true, de: this.miNombre(), codigo: this.ctx.sync.codigo || null });
    if (!ok) {
      this.ctx.ui.aviso('No se ha podido enviar', true);
      return;
    }
    this.estado.likesDados[v.codigo] = hoy();
    this.ctx.guardarSiempre();
    v.datos.estado.likes = (v.datos.estado.likes || 0) + 1;
    this.ctx.sonido.premio();
    this.ctx.ui.aviso('❤️ ¡Les ha llegado vuestro me gusta!');
    const r = document.createElement('div');
    r.className = 'reaccion-grande';
    r.textContent = '❤️';
    r.style.left = '45%';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 2600);
    this.pintarBarra();
  }

  nota() {
    const { ui } = this.ctx;
    const v = this.visita;
    const { caja } = ui.dialogo({
      titulo: `📝 Nota para ${v.nombre}`,
      texto: 'La verán cuando entren en su casa.',
      html: '<div class="campo"><textarea maxlength="120" rows="3" placeholder="¡Qué salón más bonito! 😍"></textarea></div>',
      botones: [
        { texto: 'Cancelar', tipo: 'secundario' },
        {
          texto: 'Dejar nota', tipo: 'primario', accion: async c => {
            const texto = c.querySelector('textarea').value.trim();
            if (!texto) return;
            const ok = await this.ctx.sync.mandarA(v.codigo, 'visita', { nota: texto, de: this.miNombre(), codigo: this.ctx.sync.codigo || null });
            ui.aviso(ok ? '📝 ¡Nota dejada!' : 'No se ha podido enviar', !ok);
            if (ok) this.ctx.sonido.pop();
          }
        }
      ]
    });
    setTimeout(() => caja.querySelector('textarea').focus(), 250);
  }

  volver() {
    if (!this.visita) return;
    this.visita = null;
    this.barra.classList.add('oculto');
    this.ctx.salirVisita();
    this.ctx.sonido.pop();
  }

  recibir(m) {
    const d = m.datos || {};
    if (!this.estado.visitas) this.estado.visitas = [];
    this.estado.visitas.push({ de: d.de, like: !!d.like, nota: d.nota || null, fecha: Date.parse(m.creado) || Date.now() });
    this.estado.visitas = this.estado.visitas.slice(-20);
    if (d.like) this.estado.likes = (this.estado.likes || 0) + 1;
    this.ctx.registrar('like-recibido');
    this.ctx.sonido.mascota();
    this.ctx.ui.aviso(d.like ? `❤️ A ${d.de || 'alguien'} le encanta vuestra casa` : `📝 ${d.de || 'Alguien'} os ha dejado una nota: "${d.nota}"`);
    this.ctx.guardar();
  }

  async ranking() {
    const { ui, sync } = this.ctx;
    const amigos = this.amigos();
    const codigos = [...(sync.activo ? [sync.codigo] : []), ...amigos.map(a => a.codigo)];
    if (!amigos.length) {
      ui.aviso('Visitad alguna casa de amigos primero', true);
      return;
    }
    const cuerpo = ui.abrirGen('🏆 Ranking', '<p class="gen-intro">Cargando…</p>', () => this.abrir());
    let filas = [];
    try {
      filas = await sync.ranking(codigos);
    } catch (e) {
      cuerpo.innerHTML = '<p class="gen-intro">No hay conexión ahora mismo.</p>';
      return;
    }
    if (!sync.activo) filas.push({ id: 'yo', p: this.ctx.acogedor(), n: this.miNombre(), l: this.estado.likes || 0, yo: true });
    filas = filas.map(f => ({ ...f, yo: f.yo || f.id === sync.codigo, p: Number(f.p) || 0, l: Number(f.l) || 0 })).sort((a, b) => b.p - a.p || b.l - a.l);
    const iconos = ['🏚️', '🏠', '🌇', '🏡', '🏰'];
    cuerpo.innerHTML = `<p class="gen-intro">Ordenado por lo acogedora que es cada casa (y luego por los me gusta).</p>
      <div class="podio">${filas.map((f, i) => `<div class="fila-podio ${f.yo ? 'yo' : ''}"><em>${i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}º`}</em><span>${iconos[Number(f.c) || 0] || '🏠'}</span><b>${escapar(f.n || f.id)}${f.yo ? ' (vosotros)' : ''}</b><i>🕯️ ${f.p} · ❤️ ${f.l}</i></div>`).join('')}</div>`;
    const pos = filas.findIndex(f => f.yo) + 1;
    if (pos === 1 && filas.length > 1) this.ctx.registrar('ranking-primero');
  }

  puedeFiesta() {
    return Date.now() - (this.estado.ultimaFiesta || 0) > 20 * 3600000;
  }

  prepararFiesta() {
    const { ui } = this.ctx;
    if (this.fiesta) return;
    if (!this.puedeFiesta()) {
      ui.aviso('Ya habéis hecho una fiesta hoy 🥳', true);
      return;
    }
    const elegidos = new Set(['sol', 'amigos']);
    const pintar = caja => {
      caja.querySelectorAll('.invitado').forEach(b => b.classList.toggle('activo', elegidos.has(b.dataset.id)));
    };
    const platos = this.ctx.casa2.totalPlatos();
    const { caja } = ui.dialogo({
      titulo: '🎉 ¿A quién invitáis?',
      texto: `Contará la comida (${platos ? `tenéis ${platos} plato${platos > 1 ? 's' : ''}` : 'no tenéis platos: ¡cocinad antes!'}), la música, las luces y lo acogedora que esté esta habitación.`,
      html: `<div class="invitados">${Object.entries(INVITADOS).map(([id, n]) => `<button class="invitado" data-id="${id}"><img src="${this.ctx.miniaturas.personaje(id)}" alt=""><small>${n}</small></button>`).join('')}</div>`,
      botones: [
        { texto: 'Ahora no', tipo: 'secundario' },
        {
          texto: '¡Que empiece la fiesta!', tipo: 'primario', accion: () => {
            if (elegidos.size < 1) return;
            this.empezarFiesta([...elegidos]);
          }
        }
      ]
    });
    caja.querySelectorAll('.invitado').forEach(b => b.addEventListener('click', () => {
      if (elegidos.has(b.dataset.id)) elegidos.delete(b.dataset.id);
      else elegidos.add(b.dataset.id);
      pintar(caja);
    }));
    pintar(caja);
  }

  puntuarFiesta(invitados) {
    const { gestor, casa2 } = this.ctx;
    const ids = gestor.muebles.map(m => m.userData.def.id);
    const usados = Math.min(3, casa2.totalPlatos());
    const comida = usados / 3;
    const musica = ids.some(id => id === 'radio' || id === 'piano') ? 1 : ids.some(id => MUSICA.includes(id)) ? 0.5 : 0;
    const lamparas = gestor.muebles.filter(m => LAMPARAS.includes(m.userData.def.id) && m.userData.encendido).length;
    const luces = Math.min(1, (casa2.led ? 0.5 : 0) + (casa2.bombilla ? 0.25 : 0) + lamparas * 0.25);
    const acog = this.ctx.acogedor() / 100;
    const gente = Math.min(1, invitados.length / 3);
    const media = comida * 0.3 + musica * 0.2 + luces * 0.2 + acog * 0.2 + gente * 0.1;
    return { comida, musica, luces, acog, gente, usados, estrellas: Math.max(1, Math.min(5, Math.round(1 + media * 4))) };
  }

  empezarFiesta(invitados) {
    const { ui, escena, mascotas, ctxPantalla } = this.ctx;
    void ctxPantalla;
    ui.cerrarHojas();
    const bloqueadas = mascotas.bloqueadas();
    const figuras = invitados.map((id, i) => {
      const p = crearPersonaje(id);
      const c = mascotas.celdaLibreAlAzar(bloqueadas) || [4 + i, 6];
      bloqueadas.add(c[0] * 12 + c[1]);
      p.position.set((c[0] - 6 + 0.5) * 0.5, 0, (c[1] - 6 + 0.5) * 0.5);
      p.scale.setScalar(1.2);
      p.userData.fase = Math.random() * 6;
      escena.add(p);
      return p;
    });
    this.fiesta = { figuras, invitados, fin: this.t + 22, tNota: 0, nota: 0, tConfeti: 0 };
    document.body.classList.add('de-fiesta');
    ui.aviso('🎉 ¡Fiesta en casa!');
    this.ctx.sonido.premio();
  }

  terminarFiesta() {
    const f = this.fiesta;
    const { ui, escena, casa2 } = this.ctx;
    for (const p of f.figuras) escena.remove(p);
    document.body.classList.remove('de-fiesta');
    this.fiesta = null;
    const r = this.puntuarFiesta(f.invitados);
    for (let k = 0; k < r.usados; k++) {
      const id = Object.keys(casa2.platos())[0];
      if (id) casa2.quitarPlato(id);
    }
    const monedas = 30 * r.estrellas + f.invitados.length * 10;
    this.estado.ultimaFiesta = Date.now();
    this.estado.monedas += monedas;
    this.ctx.registrar(r.estrellas >= 5 ? 'fiesta-perfecta' : 'fiesta');
    this.ctx.recordar(r.estrellas >= 5 ? 'fiesta5' : null, '🎉', `Hicimos una fiesta en casa (${'⭐'.repeat(r.estrellas)})`);
    this.ctx.refrescarHud();
    this.ctx.guardar();
    const barra = (t, v) => `<div class="stat"><span>${t}</span><div class="barra-stat"><i style="width:${Math.round(v * 100)}%;background:#e58f9e"></i></div></div>`;
    ui.dialogo({
      titulo: `${'⭐'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}`,
      texto: r.estrellas >= 5 ? '¡La mejor fiesta del año! Nadie se quería ir.' : r.estrellas >= 3 ? '¡Se lo han pasado genial!' : 'Ha estado bien, pero podría ser mejor…',
      html: `<div class="fiesta-notas">${barra('🍕 Comida', r.comida)}${barra('🎵 Música', r.musica)}${barra('💡 Luces', r.luces)}${barra('🕯️ Acogedor', r.acog)}${barra('👥 Gente', r.gente)}</div><p class="gen-intro">+${monedas} monedas</p>`,
      confeti: r.estrellas >= 4,
      botones: [{ texto: '¡Qué fiestón!', tipo: 'primario' }]
    });
  }

  actualizar(dt) {
    this.t += dt;
    const f = this.fiesta;
    if (!f) return;
    for (const p of f.figuras) {
      const fa = p.userData.fase + this.t * 7;
      p.position.y = Math.abs(Math.sin(fa)) * 0.12;
      p.rotation.y = Math.sin(fa * 0.5) * 0.9;
      p.rotation.z = Math.sin(fa) * 0.08;
    }
    f.tNota -= dt;
    if (f.tNota <= 0) {
      f.tNota = 0.28;
      const n = NOTAS_FIESTA[f.nota % NOTAS_FIESTA.length];
      this.ctx.sonido.tono(n, 0, 0.22, { tipo: 'triangle', volumen: 0.05 });
      if (f.nota % 2 === 0) this.ctx.sonido.tono(n / 4, 0, 0.25, { tipo: 'sine', volumen: 0.08 });
      f.nota++;
    }
    f.tConfeti -= dt;
    if (f.tConfeti <= 0) {
      f.tConfeti = 0.6;
      const p = this.ctx.pantalla(new THREE.Vector3((Math.random() - 0.5) * 4, 2.2, (Math.random() - 0.5) * 4));
      this.ctx.ui.particula(['🎉', '🎊', '✨', '🎈', '🥳'][Math.floor(Math.random() * 5)], p.x, p.y, 3);
    }
    if (this.t >= f.fin) this.terminarFiesta();
  }
}
