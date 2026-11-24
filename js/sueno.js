import { paga } from './balance.js';

export const METAS = [
  { id: 'obras', icono: '🏗️', texto: 'Todas las obras hechas', meta: v => v.totalObras, valor: v => v.obras },
  { id: 'nivel', icono: '⭐', texto: 'Llegar al nivel 30', meta: () => 30, valor: v => v.nivel },
  { id: 'acogedor', icono: '🛋️', texto: 'Una casa acogedora de verdad (90 puntos)', meta: () => 90, valor: v => v.acogedor },
  { id: 'album', icono: '📒', texto: 'El álbum casi lleno (80 %)', meta: v => Math.ceil(v.albumTotal * 0.8), valor: v => v.album },
  { id: 'familia', icono: '🐾', texto: 'Una familia de 3 mascotas', meta: () => 3, valor: v => v.mascotas },
  { id: 'recuerdos', icono: '🌳', texto: '50 recuerdos juntos', meta: () => 50, valor: v => v.recuerdos },
  { id: 'barrio', icono: '🏘️', texto: 'Que 4 vecinos os adoren', meta: () => 4, valor: v => v.queridos },
  { id: 'dias', icono: '📅', texto: '100 días jugando', meta: () => 100, valor: v => v.dias }
];

const PREMIO_META = 400;
const PREMIO_FINAL = 3000;

function escapar(t) {
  return String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fecha(t, conAno = true) {
  return new Date(t).toLocaleDateString('es-ES', conAno ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });
}

export class Sueno {
  constructor(ctx) {
    this.ctx = ctx;
  }

  get estado() {
    return this.ctx.estado;
  }

  datos() {
    const e = this.estado;
    if (!e.sueno) e.sueno = { hechas: [], final: 0 };
    if (!e.inicio) {
      const primero = (e.recuerdos || []).reduce((m, r) => Math.min(m, r.t || m), Date.now());
      e.inicio = primero;
    }
    return e.sueno;
  }

  valores() {
    return this.ctx.valores();
  }

  progreso() {
    const v = this.valores();
    const d = this.datos();
    return METAS.map(m => {
      const meta = Math.max(1, m.meta(v));
      const valor = Math.min(meta, m.valor(v) || 0);
      return { ...m, metaN: meta, valorN: valor, hecha: d.hechas.includes(m.id) || valor >= meta };
    });
  }

  porcentaje() {
    const p = this.progreso();
    return Math.round(p.reduce((s, m) => s + (m.hecha ? 1 : m.valorN / m.metaN), 0) / p.length * 100);
  }

  completas() {
    return this.progreso().filter(m => m.hecha).length;
  }

  revisar() {
    const d = this.datos();
    let nuevas = 0;
    for (const m of this.progreso()) {
      if (!m.hecha || d.hechas.includes(m.id)) continue;
      d.hechas.push(m.id);
      nuevas++;
      this.estado.monedas += paga(PREMIO_META);
      this.ctx.recordar(`sueno-${m.id}`, m.icono, `Sueño cumplido: ${m.texto.toLowerCase()}`);
      this.ctx.ui.aviso(`🏡 Un paso más hacia la casa de vuestros sueños: ${m.texto} (+${paga(PREMIO_META)} 🪙)`);
    }
    if (nuevas) {
      this.ctx.refrescarHud();
      this.ctx.guardar();
    }
    if (d.hechas.length >= METAS.length && !d.final && !this.programado) {
      this.programado = true;
      const intentar = () => {
        if (this.ctx.ocupado()) return setTimeout(intentar, 4000);
        this.escenaFinal(true);
      };
      setTimeout(intentar, 2500);
    }
  }

  abrir(atras) {
    const p = this.progreso();
    const pct = this.porcentaje();
    const d = this.datos();
    const cuerpo = this.ctx.ui.abrirGen('La casa de vuestros sueños', `
      <div class="sueno-cabecera">
        <div class="sueno-anillo" style="--p:${pct}"><span>🏡</span></div>
        <div>
          <b>${d.final ? '¡Lo habéis conseguido!' : `${pct} % del sueño`}</b>
          <small>${d.final ? `Desde el ${fecha(d.final)}` : 'Cumplid los 8 sueños para convertir este piso en vuestro hogar soñado. Cada uno da premio y al final hay sorpresa.'}</small>
        </div>
      </div>
      <div class="sueno-metas">${p.map(m => `
        <div class="sueno-meta${m.hecha ? ' hecha' : ''}">
          <span class="sm-icono">${m.hecha ? '✅' : m.icono}</span>
          <div><b>${m.texto}</b><div class="sm-barra"><i style="width:${Math.round(m.valorN / m.metaN * 100)}%"></i></div><small>${m.valorN} / ${m.metaN}</small></div>
        </div>`).join('')}</div>
      <div class="sueno-botones">
        <button id="sn-libro" class="primario">📖 Libro de recuerdos</button>
        ${d.final ? '<button id="sn-final" class="secundario">🎬 Ver el final otra vez</button>' : ''}
      </div>`, atras);
    cuerpo.querySelector('#sn-libro').addEventListener('click', () => this.libro(() => this.abrir(atras)));
    const f = cuerpo.querySelector('#sn-final');
    if (f) f.addEventListener('click', () => { this.ctx.ui.cerrarHojas(); setTimeout(() => this.escenaFinal(false), 250); });
  }

  nombres() {
    const n = ((this.estado.pareja && this.estado.pareja.nombres) || []).filter(Boolean);
    return n.length >= 2 ? `${n[0]} y ${n[1]}` : n[0] || 'Vosotros';
  }

  frasesFinal() {
    const v = this.valores();
    this.datos();
    const dias = Math.max(1, Math.round((Date.now() - (this.estado.inicio || Date.now())) / 86400000));
    return [
      `Hace ${dias} días esto era un piso cutre con humedades…`,
      `${v.muebles} muebles, ${v.mascotas} ${v.mascotas === 1 ? 'mascota' : 'mascotas'} y ${v.recuerdos} recuerdos después…`,
      'lo habéis convertido en',
      '<big>La casa de vuestros sueños</big>',
      `<big class="sf-nombres">${escapar(this.nombres())}</big>`
    ];
  }

  escenaFinal(primeraVez) {
    const d = this.datos();
    const ui = this.ctx.ui;
    ui.cerrarHojas && ui.cerrarHojas();
    const capa = document.createElement('div');
    capa.id = 'final-sueno';
    capa.innerHTML = `<div class="sf-franja arriba"></div><div class="sf-textos"></div><div class="sf-franja abajo"><small>Toca para saltar</small></div><div class="sf-fuegos"></div>`;
    document.body.appendChild(capa);
    document.body.classList.add('modo-cine');
    const textos = capa.querySelector('.sf-textos');
    const cam = this.ctx.camara;
    const zoomAntes = cam.zoomObj;
    cam.reiniciar();
    cam.zoomObj = 0.85;
    this.ctx.sonido && this.ctx.sonido.premio();
    let vivo = true;
    let ultimo = performance.now();
    const girar = t => {
      if (!vivo) return;
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      cam.anguloObj += dt * 0.22;
      requestAnimationFrame(girar);
    };
    requestAnimationFrame(girar);
    const frases = this.frasesFinal();
    const tiempos = [];
    frases.forEach((f, i) => {
      tiempos.push(setTimeout(() => {
        const p = document.createElement('p');
        p.innerHTML = f;
        if (i < 3) setTimeout(() => p.classList.add('fuera'), 3200);
        textos.appendChild(p);
        if (i === 3) this.fuegos(capa.querySelector('.sf-fuegos'));
      }, 600 + i * 3600));
    });
    const terminar = () => {
      if (!vivo) return;
      vivo = false;
      tiempos.forEach(clearTimeout);
      clearTimeout(fin);
      capa.classList.add('saliendo');
      setTimeout(() => capa.remove(), 600);
      document.body.classList.remove('modo-cine');
      cam.zoomObj = zoomAntes || 1;
      if (primeraVez && !d.final) this.premioFinal();
    };
    const fin = setTimeout(terminar, 600 + frases.length * 3600 + 3500);
    capa.addEventListener('click', () => {
      if (!primeraVez || performance.now() - ultimoToque > 400) terminar();
    });
    const ultimoToque = performance.now() + 1500;
  }

  fuegos(el) {
    const colores = ['#ffd166', '#ef476f', '#06d6a0', '#7fb3ff', '#f7a1c4'];
    for (let r = 0; r < 7; r++) {
      setTimeout(() => {
        const x = 15 + Math.random() * 70;
        const y = 12 + Math.random() * 35;
        for (let i = 0; i < 18; i++) {
          const c = document.createElement('i');
          const a = (i / 18) * Math.PI * 2;
          c.style.left = `${x}%`;
          c.style.top = `${y}%`;
          c.style.background = colores[(r + i) % colores.length];
          c.style.setProperty('--dx', `${Math.cos(a) * 70}px`);
          c.style.setProperty('--dy', `${Math.sin(a) * 70}px`);
          el.appendChild(c);
          setTimeout(() => c.remove(), 1500);
        }
      }, r * 650);
    }
  }

  premioFinal() {
    const d = this.datos();
    d.final = Date.now();
    this.estado.monedas += paga(PREMIO_FINAL);
    this.estado.tickets = (this.estado.tickets || 0) + 10;
    this.ctx.darItem('placa-suenos');
    this.ctx.recordar('sueno-final', '🏡', 'Hicimos realidad la casa de nuestros sueños');
    this.ctx.refrescarHud();
    this.ctx.guardar();
    this.ctx.emitir && this.ctx.emitir();
    this.ctx.ui.dialogo({
      titulo: '🏡 ¡La casa de vuestros sueños!',
      html: `<p>Lo habéis conseguido juntos. Os lleváis <b>${paga(PREMIO_FINAL)} 🪙</b>, <b>10 tickets</b> y la <b>Placa de la casa soñada</b> (está en el inventario).</p><p>Esto no se acaba aquí: la casa sigue siendo vuestra para seguir decorándola, cuidando de las mascotas y llenándola de recuerdos.</p>`,
      confeti: true,
      columna: true,
      botones: [
        { texto: '📖 Abrir el libro de recuerdos', tipo: 'primario', accion: () => setTimeout(() => this.libro(null), 300) },
        { texto: 'Seguir jugando', tipo: 'secundario' }
      ]
    });
  }

  paginas() {
    const e = this.estado;
    const v = this.valores();
    const d = this.datos();
    const pags = [];
    const dias = Math.max(1, Math.round((Date.now() - (e.inicio || Date.now())) / 86400000));
    pags.push(`<div class="lb-portada"><span class="lb-casa">🏡</span><h2>${escapar((e.pareja && e.pareja.casa) || 'Nuestro Hogar')}</h2><p>${escapar(this.nombres())}</p><small>Desde el ${fecha(e.inicio || Date.now())}</small></div>`);
    const mascotas = this.ctx.mascotas();
    pags.push(`<h3>Nuestros números</h3><ul class="lb-numeros">
      <li><b>${dias}</b> días desde que empezamos</li>
      <li><b>${v.dias}</b> días jugando</li>
      <li><b>${v.recuerdos}</b> recuerdos</li>
      <li><b>${v.muebles}</b> muebles en casa</li>
      <li><b>${v.obras}</b> obras hechas</li>
      <li>Nivel <b>${v.nivel}</b></li>
      <li>Racha más larga: <b>${(e.rachaMax || (e.racha && e.racha.n) || 0)}</b> días</li>
      <li>${d.final ? `🏡 Casa soñada el <b>${fecha(d.final)}</b>` : `🏡 Sueño al <b>${this.porcentaje()} %</b>`}</li>
    </ul>${mascotas.length ? `<p class="lb-mascotas">${mascotas.map(m => `<span>${m.icono} ${escapar(m.nombre)}</span>`).join('')}</p>` : ''}`);
    const rec = (e.recuerdos || []).slice().sort((a, b) => a.t - b.t);
    for (let i = 0; i < rec.length; i += 6) {
      const trozo = rec.slice(i, i + 6);
      const m1 = new Date(trozo[0].t).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const m2 = new Date(trozo[trozo.length - 1].t).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const txt = m1 === m2 ? m1 : m1.slice(-4) === m2.slice(-4) ? `${m1.split(' de ')[0]} – ${m2}` : `${m1} – ${m2}`;
      const mes = txt.charAt(0).toUpperCase() + txt.slice(1);
      pags.push(`<h3>${mes}</h3><div class="lb-recuerdos">${trozo.map(r => `<div><span>${r.icono}</span><p>${escapar(r.texto)}<small>${fecha(r.t, false)}</small></p></div>`).join('')}</div>`);
    }
    if (!rec.length) pags.push('<h3>Recuerdos</h3><p class="vacio">Todavía no hay recuerdos. Se apuntan solos al vivir momentos especiales.</p>');
    const fotos = this.ctx.fotos().slice(0, 16);
    for (let i = 0; i < fotos.length; i += 4) {
      pags.push(`<h3>Fotos</h3><div class="lb-fotos">${fotos.slice(i, i + 4).map((f, k) => `<figure style="--r:${((i + k) % 5) - 2}deg"><img src="${f.data}" alt=""><figcaption>${f.fecha ? fecha(f.fecha, false) : ''}</figcaption></figure>`).join('')}</div>`);
    }
    pags.push(`<div class="lb-portada"><span class="lb-casa">💕</span><p>Y lo que nos queda…</p></div>`);
    return pags;
  }

  libro(atras) {
    this.ctx.ui.cerrarHojas && this.ctx.ui.cerrarHojas();
    const pags = this.paginas();
    let k = 0;
    const capa = document.createElement('div');
    capa.id = 'libro-recuerdos';
    capa.innerHTML = `<div class="lb-libro"><button class="lb-cerrar" aria-label="Cerrar">✕</button><div class="lb-pagina"></div><div class="lb-pie"><button class="lb-ant">‹</button><span class="lb-num"></span><button class="lb-sig">›</button></div></div>`;
    document.body.appendChild(capa);
    const hoja = capa.querySelector('.lb-pagina');
    const pintar = dir => {
      hoja.classList.remove('pasa-izq', 'pasa-der');
      void hoja.offsetWidth;
      if (dir) hoja.classList.add(dir > 0 ? 'pasa-izq' : 'pasa-der');
      hoja.innerHTML = pags[k];
      capa.querySelector('.lb-num').textContent = `${k + 1} / ${pags.length}`;
      capa.querySelector('.lb-ant').disabled = k === 0;
      capa.querySelector('.lb-sig').disabled = k === pags.length - 1;
    };
    const ir = dir => {
      const n = Math.max(0, Math.min(pags.length - 1, k + dir));
      if (n === k) return;
      k = n;
      this.ctx.sonido && this.ctx.sonido.pop();
      pintar(dir);
    };
    capa.querySelector('.lb-ant').addEventListener('click', () => ir(-1));
    capa.querySelector('.lb-sig').addEventListener('click', () => ir(1));
    let x0 = null;
    hoja.addEventListener('pointerdown', ev => { x0 = ev.clientX; });
    hoja.addEventListener('pointerup', ev => {
      if (x0 === null) return;
      const dx = ev.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
    });
    const cerrar = () => {
      capa.classList.add('saliendo');
      setTimeout(() => capa.remove(), 250);
      if (atras) setTimeout(atras, 260);
    };
    capa.querySelector('.lb-cerrar').addEventListener('click', cerrar);
    capa.addEventListener('click', ev => { if (ev.target === capa) cerrar(); });
    pintar(0);
  }
}
