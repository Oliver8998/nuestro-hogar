const PREGUNTAS = [
  '¿Cuál fue nuestra primera cita?', '¿Qué te enamoró de mí?', '¿Cuál es tu recuerdo favorito juntos?', '¿A dónde te gustaría viajar conmigo?',
  '¿Qué canción te recuerda a nosotros?', '¿Qué es lo que más te hace reír de mí?', '¿Cuál es tu comida favorita que hago yo?', '¿Qué plan perfecto harías un domingo?',
  '¿Qué tres cosas meterías en nuestra casa ideal?', '¿Qué superpoder te gustaría tener?', '¿Cuál ha sido el mejor regalo que te he hecho?', '¿Qué serie veríamos otra vez desde el principio?',
  '¿Qué mascota tendríamos si pudiéramos tener cualquiera?', '¿Cuál es tu manía más rara?', '¿Qué es lo primero que pensaste de mí?', '¿Qué te gustaría que hiciéramos este año?',
  '¿Cuál es tu película favorita para ver juntos?', '¿Qué te hace sentir más querido/a?', '¿Qué sueño tienes que aún no me has contado?', '¿Dónde te gustaría que viviéramos de mayores?',
  '¿Qué es lo más bonito que te he dicho?', '¿Qué apodo te gusta más que te diga?', '¿Qué echas de menos cuando no estamos juntos?', '¿Cuál es nuestro chiste privado favorito?',
  '¿Qué cosa de casa te encanta hacer conmigo?', '¿Qué canción pondrías en nuestra boda?', '¿Qué día de los que hemos pasado repetirías?', '¿Qué es lo que más admiras de mí?',
  '¿Qué plato aprenderías a cocinar para mí?', '¿Qué haríamos si nos tocara la lotería?'
];

export const CIUDADES = {
  'Madrid': [-3.7, 40.4], 'Barcelona': [2.17, 41.38], 'Valencia': [-0.38, 39.47], 'Sevilla': [-5.98, 37.39], 'Málaga': [-4.42, 36.72], 'Granada': [-3.6, 37.18],
  'Bilbao': [-2.93, 43.26], 'Santiago': [-8.54, 42.88], 'Ciudad Real': [-3.93, 38.98], 'Toledo': [-4.02, 39.86], 'Palma': [2.65, 39.57], 'Tenerife': [-16.25, 28.46],
  'Cádiz': [-6.29, 36.53], 'Asturias': [-5.84, 43.36], 'Lisboa': [-9.14, 38.72], 'Oporto': [-8.61, 41.15], 'París': [2.35, 48.86], 'Londres': [-0.13, 51.5],
  'Roma': [12.5, 41.9], 'Venecia': [12.33, 45.44], 'Florencia': [11.25, 43.77], 'Berlín': [13.4, 52.52], 'Ámsterdam': [4.9, 52.37], 'Praga': [14.42, 50.08],
  'Viena': [16.37, 48.21], 'Budapest': [19.04, 47.5], 'Atenas': [23.73, 37.98], 'Estambul': [28.98, 41.01], 'Dublín': [-6.26, 53.35], 'Edimburgo': [-3.19, 55.95],
  'Marrakech': [-7.99, 31.63], 'El Cairo': [31.24, 30.04], 'Nueva York': [-74, 40.71], 'Los Ángeles': [-118.24, 34.05], 'Cancún': [-86.85, 21.16], 'Ciudad de México': [-99.13, 19.43],
  'Buenos Aires': [-58.38, -34.6], 'Río de Janeiro': [-43.2, -22.9], 'Tokio': [139.69, 35.69], 'Seúl': [126.98, 37.57], 'Bangkok': [100.5, 13.75], 'Bali': [115.19, -8.41],
  'Sídney': [151.21, -33.87], 'Maldivas': [73.22, 3.2], 'Islandia': [-21.94, 64.15], 'Laponia': [25.73, 66.5]
};

function escapar(t) {
  return String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dibujarMapa(ctx, w, h, viajes) {
  ctx.fillStyle = '#bfe0ee';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8d9b0';
  const P = (lon, lat) => [(lon + 180) / 360 * w, (90 - lat) / 180 * h];
  const continentes = [
    [[-168, 66], [-140, 70], [-95, 72], [-60, 60], [-55, 48], [-80, 25], [-97, 16], [-80, 8], [-105, 22], [-118, 33], [-125, 48], [-150, 60]],
    [[-80, 10], [-50, 0], [-35, -8], [-40, -22], [-58, -38], [-68, -55], [-75, -40], [-70, -18], [-80, -2]],
    [[-10, 36], [-9, 43], [-2, 48], [-5, 58], [10, 64], [30, 70], [60, 70], [100, 75], [140, 70], [170, 66], [140, 50], [122, 30], [108, 18], [100, 5], [80, 8], [72, 20], [56, 26], [45, 13], [35, 30], [28, 36], [10, 38]],
    [[-17, 21], [-6, 36], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -18], [8, 4], [-8, 5]],
    [[113, -22], [130, -12], [143, -11], [153, -27], [146, -39], [130, -32], [115, -34]],
    [[-50, 60], [-20, 70], [-25, 82], [-60, 82], [-72, 76]]
  ];
  for (const c of continentes) {
    ctx.beginPath();
    c.forEach(([lo, la], i) => {
      const [x, y] = P(lo, la);
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  for (const v of viajes) {
    const c = CIUDADES[v.lugar];
    if (!c) continue;
    const [x, y] = P(c[0], c[1]);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath(); ctx.arc(x + 1.5, y + 1.5, w * 0.012, 0, 7); ctx.fill();
    ctx.fillStyle = '#e05070';
    ctx.beginPath(); ctx.arc(x, y, w * 0.012, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - w * 0.004, y - w * 0.004, w * 0.004, 0, 7); ctx.fill();
  }
}

export class Pareja2 {
  constructor(ctx) {
    this.ctx = ctx;
  }

  get estado() {
    return this.ctx.estado;
  }

  get p() {
    return this.ctx.pareja;
  }

  yo() {
    return this.ctx.sync.activo ? this.ctx.sync.yo : 0;
  }

  preguntaHoy() {
    const d = new Date();
    const n = Math.floor(d.getTime() / 86400000);
    return PREGUNTAS[n % PREGUNTAS.length];
  }

  abrirPregunta() {
    const { ui, sonido } = this.ctx;
    if (!this.estado.preguntas) this.estado.preguntas = {};
    const hoy = hoyISO();
    const dia = this.estado.preguntas[hoy] || (this.estado.preguntas[hoy] = { q: this.preguntaHoy(), r: ['', ''] });
    const yo = this.yo();
    const otro = 1 - yo;
    const ambas = dia.r[0] && dia.r[1];
    const cuerpo = ui.abrirGen('Pregunta del día', `
      <div class="pregunta-dia">❓ ${escapar(dia.q)}</div>
      ${ambas ? `
        <div class="nota-papel"><b>${escapar(this.p.nombre(0))}</b>${escapar(dia.r[0])}</div>
        <div class="nota-papel" style="transform:rotate(1deg)"><b>${escapar(this.p.nombre(1))}</b>${escapar(dia.r[1])}</div>`
        : dia.r[yo]
          ? `<p class="gen-intro centrado">Ya has respondido. Cuando ${escapar(this.p.otro())} responda, veréis las dos respuestas 🤫</p>`
          : `<div class="ajustes"><textarea id="pd-resp" rows="3" maxlength="200" placeholder="Tu respuesta (no la verá hasta que responda)"></textarea><button id="pd-ok" class="primario">Responder</button></div>`}
      <div class="seccion-titulo">Días anteriores</div>
      <div class="recuerdos">${Object.entries(this.estado.preguntas).filter(([f, x]) => f !== hoy && x.r[0] && x.r[1]).slice(-10).reverse().map(([f, x]) => `<div class="recuerdo"><span>💬</span><div><b>${escapar(x.q)}</b><small>${escapar(this.p.nombre(0))}: ${escapar(x.r[0])}<br>${escapar(this.p.nombre(1))}: ${escapar(x.r[1])}</small></div></div>`).join('') || '<p class="vacio">Aquí se irán guardando.</p>'}</div>`, null);
    const ok = cuerpo.querySelector('#pd-ok');
    if (ok) ok.addEventListener('click', () => {
      const t = cuerpo.querySelector('#pd-resp').value.trim();
      if (!t) return;
      dia.r[yo] = t;
      if (!this.ctx.sync.activo) dia.r[otro] = dia.r[otro] || '';
      if (dia.r[0] && dia.r[1]) {
        this.estado.monedas += 10;
        this.ctx.refrescarHud();
        sonido.premio();
        ui.aviso('💬 ¡Ya podéis ver las dos respuestas! +10 🪙');
      } else sonido.arreglo();
      this.ctx.guardar();
      this.abrirPregunta();
    });
  }

  pendientePregunta() {
    const dia = (this.estado.preguntas || {})[hoyISO()];
    return !dia || !dia.r[this.yo()];
  }

  abrirQuiz() {
    const { ui } = this.ctx;
    const q = this.estado.quiz;
    const yo = this.yo();
    let html = '<p class="gen-intro">Uno escribe tres preguntas sobre sí mismo y el otro tiene que acertarlas.</p>';
    if (q && !q.resultado && q.de !== yo) html += `<button id="qz-jugar" class="primario">🎯 Responder el quiz de ${escapar(this.p.nombre(q.de))}</button>`;
    else if (q && !q.resultado) html += `<p class="gen-intro centrado">Esperando a que ${escapar(this.p.otro())} responda tu quiz…</p>`;
    if (q && q.resultado) html += `<div class="pj-codigo"><small>Último quiz de ${escapar(this.p.nombre(q.de))}</small><b>${q.resultado.aciertos}/${q.preguntas.length}</b><small>${q.resultado.aciertos === q.preguntas.length ? '¡Te conoce a la perfección! 💯' : q.resultado.aciertos >= 2 ? '¡Muy bien!' : 'Hay que conocerse más 😜'}</small></div>`;
    if (!q || q.resultado) html += `<button id="qz-crear" class="secundario">✍️ Crear un quiz sobre mí</button>`;
    const cuerpo = ui.abrirGen('¿Cuánto me conoces?', html, null);
    const crear = cuerpo.querySelector('#qz-crear');
    if (crear) crear.addEventListener('click', () => this.crearQuiz());
    const jugar = cuerpo.querySelector('#qz-jugar');
    if (jugar) jugar.addEventListener('click', () => this.jugarQuiz(0, 0));
  }

  crearQuiz() {
    const cuerpo = this.ctx.ui.abrirGen('Tu quiz', `
      <p class="gen-intro">Escribe 3 preguntas sobre ti, la respuesta buena y dos falsas.</p>
      ${[0, 1, 2].map(i => `<div class="ajustes quiz-crear"><label>Pregunta ${i + 1}</label><input class="qq" maxlength="80" placeholder="${['¿Cuál es mi comida favorita?', '¿Qué haría un día libre?', '¿Mi peli favorita?'][i]}"><input class="qb" maxlength="40" placeholder="✅ Respuesta buena"><div class="fila2"><input class="qm" maxlength="40" placeholder="❌ Falsa"><input class="qm" maxlength="40" placeholder="❌ Falsa"></div></div>`).join('')}
      <button id="qz-guardar" class="primario">Mandar quiz</button>`, () => this.abrirQuiz());
    cuerpo.querySelector('#qz-guardar').addEventListener('click', () => {
      const bloques = [...cuerpo.querySelectorAll('.quiz-crear')];
      const preguntas = [];
      for (const b of bloques) {
        const q = b.querySelector('.qq').value.trim();
        const buena = b.querySelector('.qb').value.trim();
        const malas = [...b.querySelectorAll('.qm')].map(x => x.value.trim()).filter(Boolean);
        if (q && buena && malas.length === 2) preguntas.push({ q, buena, malas });
      }
      if (preguntas.length < 3) {
        this.ctx.ui.aviso('Rellena las 3 preguntas con sus respuestas', true);
        return;
      }
      this.estado.quiz = { de: this.yo(), preguntas, resultado: null };
      this.ctx.guardar();
      this.ctx.sonido.arreglo();
      this.ctx.ui.aviso(this.ctx.sync.activo ? `📨 Quiz enviado a ${this.p.otro()}` : '📨 ¡Listo! Dale el móvil a tu pareja');
      this.abrirQuiz();
    });
  }

  jugarQuiz(i, aciertos) {
    const q = this.estado.quiz;
    const pr = q.preguntas[i];
    const ops = [pr.buena, ...pr.malas].sort(() => Math.random() - 0.5);
    const cuerpo = this.ctx.ui.abrirGen(`Pregunta ${i + 1} de ${q.preguntas.length}`, `<div class="pregunta-dia">${escapar(pr.q)}</div>${ops.map(o => `<button class="secundario qz-op">${escapar(o)}</button>`).join('')}`, () => this.abrirQuiz());
    cuerpo.querySelectorAll('.qz-op').forEach(b => b.addEventListener('click', () => {
      const bien = b.textContent === pr.buena;
      b.style.background = bien ? '#c9efd6' : '#f8d3d8';
      if (bien) this.ctx.sonido.arreglo();
      else this.ctx.sonido.error();
      setTimeout(() => {
        const n = aciertos + (bien ? 1 : 0);
        if (i + 1 < q.preguntas.length) return this.jugarQuiz(i + 1, n);
        q.resultado = { aciertos: n, t: Date.now() };
        this.estado.monedas += n * 8;
        this.ctx.refrescarHud();
        this.ctx.guardar();
        this.ctx.sonido.premio();
        this.ctx.ui.aviso(`🎯 ${n}/${q.preguntas.length} aciertos · +${n * 8} 🪙`);
        if (n === q.preguntas.length) this.p.recordar(null, '💯', `${this.p.nombre(this.yo())} acertó todo el quiz de ${this.p.nombre(q.de)}`);
        this.abrirQuiz();
      }, 700);
    }));
  }

  abrirViajes() {
    const { ui } = this.ctx;
    const viajes = this.estado.viajes || [];
    const cuerpo = ui.abrirGen('Mapa de viajes', `
      <canvas id="vj-mapa" width="640" height="320" class="mapa-viajes"></canvas>
      <p class="gen-intro">Poned el <b>Mapa del mundo</b> (tienda → Deco) en casa y saldrán las chinchetas.</p>
      <div class="ajustes"><div class="fila2"><select id="vj-lugar">${Object.keys(CIUDADES).map(c => `<option>${c}</option>`).join('')}</select><input id="vj-fecha" type="month"></div>
      <button id="vj-add" class="primario">📍 Poner chincheta</button></div>
      <div class="recuerdos">${viajes.slice().reverse().map((v, k) => `<div class="recuerdo"><span>📍</span><div><b>${escapar(v.lugar)}</b><small>${v.fecha ? new Date(v.fecha + '-01T12:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : ''}</small></div><button class="borrar plan-borrar" data-k="${viajes.length - 1 - k}">✕</button></div>`).join('')}</div>`, null);
    dibujarMapa(cuerpo.querySelector('#vj-mapa').getContext('2d'), 640, 320, viajes);
    cuerpo.querySelector('#vj-add').addEventListener('click', () => {
      const lugar = cuerpo.querySelector('#vj-lugar').value;
      const fecha = cuerpo.querySelector('#vj-fecha').value;
      if (!this.estado.viajes) this.estado.viajes = [];
      this.estado.viajes.push({ lugar, fecha });
      this.p.recordar(null, '✈️', `Viajamos a ${lugar}`);
      this.ctx.sonido.arreglo();
      this.ctx.guardar();
      this.ctx.alViajes && this.ctx.alViajes();
      this.abrirViajes();
    });
    cuerpo.querySelectorAll('.plan-borrar').forEach(b => b.addEventListener('click', () => {
      this.estado.viajes.splice(Number(b.dataset.k), 1);
      this.ctx.guardar();
      this.ctx.alViajes && this.ctx.alViajes();
      this.abrirViajes();
    }));
  }

  abrirCuentaAtras() {
    const { ui } = this.ctx;
    const f = this.estado.proximaVez;
    const cuerpo = ui.abrirGen('Cuenta atrás', `
      <p class="gen-intro">¿Cuándo os volvéis a ver? Saldrá arriba cuánto falta, y ese día habrá sorpresa.</p>
      ${f ? `<div class="pj-codigo"><small>Os veis el</small><b style="font-size:26px;letter-spacing:0">${new Date(f).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</b><small>${this.textoFalta()}</small></div>` : ''}
      <div class="ajustes"><input id="ca-fecha" type="datetime-local"><button id="ca-ok" class="primario">⏳ Poner cuenta atrás</button>${f ? '<button id="ca-quitar" class="secundario">Quitar</button>' : ''}</div>`, null);
    cuerpo.querySelector('#ca-ok').addEventListener('click', () => {
      const v = cuerpo.querySelector('#ca-fecha').value;
      if (!v) return;
      this.estado.proximaVez = new Date(v).getTime();
      this.estado.proximaVezCelebrada = false;
      this.ctx.guardar();
      this.ctx.sonido.arreglo();
      this.abrirCuentaAtras();
    });
    const q = cuerpo.querySelector('#ca-quitar');
    if (q) q.addEventListener('click', () => {
      this.estado.proximaVez = null;
      this.ctx.guardar();
      this.abrirCuentaAtras();
    });
  }

  textoFalta() {
    const f = this.estado.proximaVez;
    if (!f) return '';
    const ms = f - Date.now();
    if (ms <= 0) return '¡Es hoy! 💕';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms % 86400000 / 3600000);
    return d > 0 ? `Faltan ${d} d ${h} h` : `Faltan ${h} h ${Math.floor(ms % 3600000 / 60000)} min`;
  }

  chipCuentaAtras() {
    const f = this.estado.proximaVez;
    if (!f) return null;
    const ms = f - Date.now();
    if (ms < -86400000) return null;
    const d = Math.ceil(ms / 86400000);
    return ms <= 0 ? '💑 ¡Hoy!' : d <= 1 ? `💑 ${Math.ceil(ms / 3600000)} h` : `💑 ${d} d`;
  }

  revisarCuentaAtras() {
    const f = this.estado.proximaVez;
    if (!f || this.estado.proximaVezCelebrada || Date.now() < f || this.ctx.dialogoAbierto()) return;
    this.estado.proximaVezCelebrada = true;
    this.estado.monedas += 25;
    this.ctx.refrescarHud();
    this.ctx.guardar();
    this.ctx.sonido.premio();
    this.ctx.ui.dialogo({ titulo: '💑 ¡Por fin os veis!', texto: 'Disfrutad muchísimo. Pilar os deja 25 monedas para celebrarlo.', confeti: true, botones: [{ texto: '💕💕💕', tipo: 'primario' }] });
    this.p.recordar(null, '💑', '¡Nos volvimos a ver!');
  }

  buenasNoches() {
    const { sync, ui, sonido } = this.ctx;
    if (!sync.activo) return ui.aviso('Conectad la casa para mandar las buenas noches', true);
    sync.emitir('buenasnoches', {});
    if (!sync.enDirecto) sync.mandar('buenasnoches', { de: sync.yo });
    this.estado.durmiendo = { quien: sync.yo, t: Date.now() };
    if (window.avisarPareja) window.avisarPareja('noches', '🌙 Se va a dormir. ¡Dale las buenas noches!');
    this.ctx.guardar();
    sonido.mascota();
    ui.aviso('🌙 ¡Buenas noches! Que descanses');
  }

  recibirBuenasNoches(de) {
    this.ctx.sonido.mascota();
    this.ctx.ui.dialogo({ titulo: `🌙 ${this.p.nombre(de)} se va a dormir`, texto: '¡Dale las buenas noches!', botones: [{ texto: '😴 Buenas noches', tipo: 'primario', accion: () => this.ctx.sync.emitir('reaccion', { emoji: '😴' }) }, { texto: '💋 Un besito', tipo: 'rosa', accion: () => this.ctx.sync.emitir('reaccion', { emoji: '😘' }) }] });
  }

  abrirMetas() {
    const { ui } = this.ctx;
    const metas = this.estado.metas || [];
    const cuerpo = ui.abrirGen('Nuestras metas', `
      <p class="gen-intro">El corcho de los sueños: cosas que queréis hacer juntos. Tachadlas cuando se cumplan 🎯</p>
      <div class="ajustes"><input id="mt-texto" maxlength="60" placeholder="Viajar a Japón, tener un perro…"><button id="mt-add" class="primario">📌 Clavar en el corcho</button></div>
      <div class="corcho">${metas.map((m, k) => `<button class="meta ${m.hecha ? 'hecha' : ''}" data-k="${k}" style="transform:rotate(${(k % 3 - 1) * 2.5}deg)">📌 ${escapar(m.texto)}${m.hecha ? `<small>✅ ${new Date(m.hecha).toLocaleDateString('es-ES')}</small>` : ''}</button>`).join('') || '<p class="vacio">El corcho está vacío.</p>'}</div>`, null);
    cuerpo.querySelector('#mt-add').addEventListener('click', () => {
      const t = cuerpo.querySelector('#mt-texto').value.trim();
      if (!t) return;
      if (!this.estado.metas) this.estado.metas = [];
      this.estado.metas.push({ texto: t, hecha: null });
      this.ctx.guardar();
      this.ctx.sonido.pop();
      this.abrirMetas();
    });
    cuerpo.querySelectorAll('.meta').forEach(b => b.addEventListener('click', () => {
      const m = this.estado.metas[Number(b.dataset.k)];
      if (m.hecha) return;
      ui.dialogo({
        titulo: `📌 ${m.texto}`,
        botones: [
          { texto: '🗑️ Quitar', tipo: 'secundario', accion: () => { this.estado.metas.splice(Number(b.dataset.k), 1); this.ctx.guardar(); this.abrirMetas(); } },
          { texto: '🎉 ¡Cumplida!', tipo: 'primario', accion: () => { m.hecha = Date.now(); this.estado.monedas += 30; this.ctx.refrescarHud(); this.p.recordar(null, '🎯', `Cumplimos una meta: ${m.texto}`); this.ctx.guardar(); this.ctx.sonido.premio(); this.abrirMetas(); } }
        ]
      });
    }));
  }
}
