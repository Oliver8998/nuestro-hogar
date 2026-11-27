import { TIEMPO, VELOCIDAD } from './favores2.js';

const azar = n => Math.floor(Math.random() * n);
const elegir = l => l[azar(l.length)];

function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(Math.random() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

function alTerminar(j, fn) {
  const previo = j.alTerminar;
  j.alTerminar = () => { fn(); if (previo) previo(); };
}

function cronometro(j, seg, alFin) {
  seg *= TIEMPO;
  const ini = performance.now();
  let vivo = true;
  const id = setInterval(() => {
    if (!vivo) return;
    const t = (performance.now() - ini) / 1000;
    j.tiempo(Math.max(0, 1 - t / seg));
    if (t >= seg) {
      vivo = false;
      clearInterval(id);
      alFin();
    }
  }, 100);
  const parar = () => { vivo = false; clearInterval(id); };
  alTerminar(j, parar);
  return parar;
}

function bucle(j, fn) {
  let vivo = true;
  let ultimo = performance.now();
  const paso = t => {
    if (!vivo) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000) * VELOCIDAD;
    ultimo = t;
    if (fn(dt) === false) return;
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  const parar = () => { vivo = false; };
  alTerminar(j, parar);
  return parar;
}

const marcador = (j, texto) => {
  const el = j.cuerpo.querySelector('.t2-marcador');
  if (el) el.innerHTML = texto;
};

const limitar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function arrastrable(el, { alCoger, alMover, alSoltar }) {
  el.addEventListener('pointerdown', e => {
    if (el.classList.contains('bloqueado')) return;
    e.preventDefault();
    if (alCoger && alCoger() === false) return;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const dx = e.clientX - r.left;
    const dy = e.clientY - r.top;
    const fantasma = el.cloneNode(true);
    fantasma.classList.add('t2-fantasma');
    fantasma.style.width = `${r.width}px`;
    fantasma.style.height = `${r.height}px`;
    document.body.appendChild(fantasma);
    el.classList.add('levantado');
    const mover = ev => {
      fantasma.style.left = `${ev.clientX - dx}px`;
      fantasma.style.top = `${ev.clientY - dy}px`;
      if (alMover) alMover(ev.clientX, ev.clientY);
    };
    mover(e);
    const soltar = ev => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', soltar);
      el.removeEventListener('pointercancel', soltar);
      el.classList.remove('levantado');
      const ok = ev.type !== 'pointercancel' && alSoltar(ev.clientX, ev.clientY, fantasma);
      if (!ok) fantasma.remove();
    };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  });
}

const dentroDe = (el, x, y, m = 6) => {
  const r = el.getBoundingClientRect();
  return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m;
};

const limpiarFantasmas = () => document.querySelectorAll('.t2-fantasma').forEach(x => x.remove());

function rebotar(fantasma) {
  fantasma.classList.add('rebota');
  setTimeout(() => fantasma.remove(), 380);
}

function chispas(caja, x, y, emoji = '✨', n = 5) {
  const r = caja.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 't2-chispa';
    c.textContent = emoji;
    c.style.left = `${x - r.left}px`;
    c.style.top = `${y - r.top}px`;
    c.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    c.style.setProperty('--dy', `${-30 - Math.random() * 70}px`);
    caja.appendChild(c);
    setTimeout(() => c.remove(), 700);
  }
}

export const PESCADOR = {
  id: 'pescador', icono: '🎣', nombre: 'Pescador en el pantano', texto: 'Mantened el pez dentro de la red verde hasta sacarlo del agua', pago: 125,
  jugar(j, s) {
    const PECES = [
      { e: '🐟', n: 'Carpa', vel: 1.4, salto: 0.35, prob: 0.45 },
      { e: '🐠', n: 'Pez payaso', vel: 2.2, salto: 0.55, prob: 0.3 },
      { e: '🐡', n: 'Pez globo', vel: 3.0, salto: 0.7, prob: 0.18 },
      { e: '🦈', n: '¡Un tiburón!', vel: 4.0, salto: 0.9, prob: 0.07 }
    ];
    j.info('Cuando pique, mantén pulsado para subir la red y suelta para bajarla. ¡Que el pez no se salga!');
    j.cuerpo.innerHTML = `<div class="t2 t2-pesca"><div class="t2-marcador"></div>
      <div class="ps-escena"><div class="ps-sol"></div><div class="ps-juncos">🌾🌾</div><div class="ps-agua"><i class="ps-onda"></i><i class="ps-onda b"></i><div class="ps-boya">🎈</div></div><div class="ps-cubo"></div></div>
      <div class="ps-panel"><div class="ps-pista"><div class="ps-red"></div><div class="ps-pez"></div></div><div class="ps-progreso"><i></i></div></div>
      <button class="ps-boton">🎣 Mantener</button></div>`;
    const caja = j.cuerpo.querySelector('.t2-pesca');
    const pista = caja.querySelector('.ps-pista');
    const red = caja.querySelector('.ps-red');
    const pezEl = caja.querySelector('.ps-pez');
    const prog = caja.querySelector('.ps-progreso i');
    const boya = caja.querySelector('.ps-boya');
    const cubo = caja.querySelector('.ps-cubo');
    const boton = caja.querySelector('.ps-boton');
    const ALTO_RED = 0.26;
    let pulsado = false;
    let fase = 'espera';
    let espera = 1 + Math.random() * 1.5;
    let z = 0.2;
    let v = 0;
    let f = 0.5;
    let objetivo = 0.5;
    let cambio = 0;
    let p = 0.3;
    let pez = null;
    let pescados = [];
    let escapados = 0;
    let puntos = 0;
    const pintarMarcador = () => marcador(j, `🪣 ${pescados.length} peces · 💨 ${escapados} escapados`);
    pintarMarcador();
    red.style.bottom = '20%';
    red.style.height = `${ALTO_RED * 100}%`;
    const abajo = e => { e.preventDefault(); pulsado = true; boton.classList.add('on'); };
    const arriba = () => { pulsado = false; boton.classList.remove('on'); };
    caja.addEventListener('pointerdown', abajo);
    window.addEventListener('pointerup', arriba);
    window.addEventListener('pointercancel', arriba);
    alTerminar(j, () => { window.removeEventListener('pointerup', arriba); window.removeEventListener('pointercancel', arriba); });
    const elegirPez = () => {
      let r = Math.random();
      for (const x of PECES) { r -= x.prob; if (r <= 0) return x; }
      return PECES[0];
    };
    caja.classList.add('esperando');
    const parar = bucle(j, dt => {
      if (fase === 'espera') {
        espera -= dt;
        boya.style.transform = `translateY(${Math.sin(performance.now() / 300) * 3}px)`;
        if (espera <= 0) {
          fase = 'pica';
          pez = elegirPez();
          pezEl.textContent = pez.e;
          p = 0.3;
          f = 0.5;
          objetivo = 0.5;
          caja.classList.remove('esperando');
          caja.classList.add('picando');
          s.sonido.chasquido();
          j.info(`¡Ha picado algo! ${pez.e} Mantén el pez dentro de la red verde`);
        }
        return;
      }
      if (fase !== 'pica') return;
      boya.style.transform = `translateY(${6 + Math.sin(performance.now() / 70) * 5}px)`;
      v += (pulsado ? 2.6 : -2.3) * dt;
      v = limitar(v, -1.6, 1.6);
      z += v * dt;
      if (z < 0) { z = 0; v = Math.max(0, v) * 0.3; }
      if (z > 1 - ALTO_RED) { z = 1 - ALTO_RED; v = Math.min(0, v) * 0.3; }
      cambio -= dt;
      if (cambio <= 0) {
        cambio = 0.35 + Math.random() * (1.4 - pez.salto);
        objetivo = limitar(f + (Math.random() - 0.5) * 2 * pez.salto, 0.05, 0.95);
      }
      f += (objetivo - f) * Math.min(1, dt * pez.vel);
      const dentro = Math.abs(f - (z + ALTO_RED / 2)) < ALTO_RED / 2;
      p += (dentro ? 0.32 : -0.22) * dt;
      red.style.bottom = `${z * 100}%`;
      red.style.height = `${ALTO_RED * 100}%`;
      red.classList.toggle('dentro', dentro);
      pezEl.style.bottom = `calc(${f * 100}% - 14px)`;
      pezEl.classList.toggle('lucha', !dentro);
      prog.style.height = `${limitar(p) * 100}%`;
      prog.style.background = p > 0.66 ? '#6cc08a' : p > 0.33 ? '#f2c15b' : '#e57373';
      if (p >= 1) {
        pescados.push(pez.e);
        puntos += pez === PECES[3] ? 2 : pez === PECES[2] ? 1.5 : 1;
        cubo.textContent = pescados.slice(-6).join('');
        s.sonido.arreglo();
        const r = pista.getBoundingClientRect();
        chispas(caja, r.left + r.width / 2, r.top + r.height * (1 - f), '💦', 6);
        j.info(`¡${pez.n} al cubo! ${pez.e} Espera a que vuelva a picar…`);
        fase = 'espera';
        espera = 0.8 + Math.random() * 1.6;
        caja.classList.remove('picando');
        caja.classList.add('esperando');
        pintarMarcador();
      } else if (p <= 0) {
        escapados++;
        s.sonido.error();
        j.info(`Se ha escapado ${pez.e}… ¡A por el siguiente!`);
        fase = 'espera';
        espera = 1 + Math.random() * 1.5;
        caja.classList.remove('picando');
        caja.classList.add('esperando');
        pintarMarcador();
      }
    });
    cronometro(j, 60, () => {
      parar();
      j.final(pescados.length ? `¡${pescados.length} peces! ${pescados.join('')}` : 'Hoy no picaba nada…', limitar((puntos - escapados * 0.3) / 6));
    });
  }
};

export const CARTERO = {
  id: 'cartero', icono: '✉️', nombre: 'Cartero', texto: 'Arrastrad cada carta al buzón de su piso. La publicidad, a la papelera', pago: 115,
  jugar(j, s) {
    const PISOS = ['1ºA', '1ºB', '2ºA', '2ºB', '3ºA', '3ºB', '4ºA', '4ºB'];
    const SOBRES = ['#fff7e6', '#e8f4ff', '#fde8ef', '#eefbe8'];
    let bien = 0;
    let mal = 0;
    let urgentes = 0;
    let carta = null;
    let reloj = 0;
    let cartasHechas = 0;
    j.info('Arrastra la carta al buzón correcto. Las ⚡ urgentes dan propina si vuelan, y la 📰 publicidad va a la papelera');
    j.cuerpo.innerHTML = `<div class="t2 t2-cartero"><div class="t2-marcador"></div>
      <div class="ca-buzones"></div>
      <div class="ca-mesa"><div class="ca-saca">👜</div><div class="ca-hueco"></div><div class="ca-papelera">🗑️<small>Publicidad</small></div></div></div>`;
    const caja = j.cuerpo.querySelector('.t2-cartero');
    const buzones = caja.querySelector('.ca-buzones');
    const hueco = caja.querySelector('.ca-hueco');
    const papelera = caja.querySelector('.ca-papelera');
    let usados = PISOS.slice(0, 6);
    const pintarBuzones = () => {
      usados = barajar([...PISOS]).slice(0, cartasHechas >= 8 ? 8 : 6).sort();
      if (cartasHechas >= 14) barajar(usados);
      buzones.innerHTML = usados.map(p => `<div class="ca-buzon" data-p="${p}"><i></i><b>${p}</b></div>`).join('');
      buzones.classList.toggle('ocho', usados.length === 8);
    };
    const pintarMarcador = () => marcador(j, `✅ ${bien} · ❌ ${mal}${urgentes ? ` · ⚡ ${urgentes}` : ''}`);
    const nueva = () => {
      if (cartasHechas && cartasHechas % 6 === 0) {
        pintarBuzones();
        buzones.classList.add('cambio');
        setTimeout(() => buzones.classList.remove('cambio'), 400);
      }
      const publi = Math.random() < 0.18;
      const urgente = !publi && Math.random() < 0.22;
      const piso = elegir(usados);
      const nombre = elegir(['Familia García', 'Sra. Pérez', 'D. Ramón', 'Sol Martín', 'Hnos. López', 'Lucía R.', 'Andrés M.', 'Carmen V.']);
      carta = { piso, publi, urgente };
      reloj = 0;
      hueco.innerHTML = `<div class="ca-carta${publi ? ' publi' : ''}${urgente ? ' urgente' : ''}" style="--sobre:${elegir(SOBRES)}">${publi ? '<b>📰 ¡OFERTAS!</b><small>Pizzería Luigi · 2x1</small>' : `<small>${nombre}</small><b>C/ Mayor 7 · ${piso}</b>${urgente ? '<em>⚡ URGENTE</em>' : '<em>✉️</em>'}`}</div>`;
      const el = hueco.firstElementChild;
      arrastrable(el, {
        alCoger: () => s.sonido.tic(),
        alMover: (x, y) => {
          buzones.querySelectorAll('.ca-buzon').forEach(b => b.classList.toggle('encima', dentroDe(b, x, y)));
          papelera.classList.toggle('encima', dentroDe(papelera, x, y));
        },
        alSoltar: (x, y, fantasma) => {
          buzones.querySelectorAll('.encima').forEach(b => b.classList.remove('encima'));
          papelera.classList.remove('encima');
          const b = [...buzones.querySelectorAll('.ca-buzon')].find(q => dentroDe(q, x, y));
          const tira = dentroDe(papelera, x, y);
          if (!b && !tira) return false;
          const ok = carta.publi ? tira : (b && b.dataset.p === carta.piso);
          if (ok) {
            bien++;
            cartasHechas++;
            if (carta.urgente && reloj < 4) { urgentes++; chispas(caja, x, y, '⚡', 4); }
            const destino = b || papelera;
            destino.classList.add('recibe');
            setTimeout(() => destino.classList.remove('recibe'), 300);
            fantasma.classList.add('entra');
            setTimeout(() => fantasma.remove(), 250);
            s.sonido.tono(tira ? 300 : 660, 0, 0.1, { tipo: 'triangle', volumen: 0.07 });
            el.remove();
            pintarMarcador();
            setTimeout(nueva, 150);
          } else {
            mal++;
            s.sonido.error();
            rebotar(fantasma);
            j.info(carta.publi ? '¡Eso es publicidad! A la papelera 🗑️' : `Esa carta es para el ${carta.piso}, ¡mira bien el buzón!`);
            pintarMarcador();
          }
          return true;
        }
      });
    };
    pintarBuzones();
    pintarMarcador();
    nueva();
    const parar = bucle(j, dt => {
      reloj += dt;
      const el = hueco.querySelector('.ca-carta.urgente');
      if (el) el.classList.toggle('tarde', reloj >= 4);
    });
    alTerminar(j, limpiarFantasmas);
    cronometro(j, 50, () => {
      parar();
      limpiarFantasmas();
      j.final(`${bien} cartas repartidas${urgentes ? ` (${urgentes} urgentes a tiempo)` : ''}${mal ? ` · ${mal} fallos` : ''}`, limitar((bien + urgentes * 0.5 - mal * 1.5) / 20));
    });
  }
};

export const SOCORRISTA = {
  id: 'socorrista', icono: '🛟', nombre: 'Socorrista', texto: 'Tocad a quien pida ayuda en la piscina. ¡Los que saludan solo os saludan!', pago: 120,
  jugar(j, s) {
    const BANISTAS = ['🏊', '🏊‍♀️', '🏊‍♂️', '🤽', '🤽‍♀️'];
    j.info('Toca a los que se hunden 🆘 antes de que se acabe su burbuja. Los que saludan 👋 están bien: ¡no les toques!');
    j.cuerpo.innerHTML = `<div class="t2 t2-piscina"><div class="t2-marcador"></div><div class="pi-borde"><div class="pi-agua"><div class="pi-calles"><i></i><i></i><i></i></div></div><div class="pi-silla">🪑🧑‍🚒</div></div></div>`;
    const caja = j.cuerpo.querySelector('.t2-piscina');
    const agua = caja.querySelector('.pi-agua');
    let salvados = 0;
    let fallos = 0;
    let perdidos = 0;
    let total = 0;
    let t = 0;
    let proximo = 1.2;
    const gente = [];
    const pintarMarcador = () => marcador(j, `🛟 ${salvados} salvados · ❌ ${fallos} · 😵 ${perdidos}`);
    pintarMarcador();
    const crear = i => {
      const el = document.createElement('button');
      el.className = 'pi-banista';
      el.innerHTML = `<span>${BANISTAS[i % BANISTAS.length]}</span><i class="pi-burbuja"><b></b></i>`;
      agua.appendChild(el);
      const p = { el, x: Math.random() * 0.8 + 0.1, y: 0.1 + (i % 4) * 0.24 + Math.random() * 0.06, vx: (Math.random() < 0.5 ? -1 : 1) * (0.06 + Math.random() * 0.06), estado: 'nada', t: 0 };
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (p.estado === 'hunde') {
          salvados++;
          p.estado = 'nada';
          p.t = 0;
          el.className = 'pi-banista salvado';
          setTimeout(() => el.classList.remove('salvado'), 600);
          s.sonido.arreglo();
          chispas(caja, e.clientX, e.clientY, '💙', 5);
        } else {
          fallos++;
          s.sonido.error();
          el.classList.add('mal');
          setTimeout(() => el.classList.remove('mal'), 350);
          j.info(p.estado === 'saluda' ? '¡Solo te estaba saludando! 👋 Fíjate en el 🆘' : 'Ese nada tan tranquilo. Toca solo a los que tienen 🆘');
        }
        pintarMarcador();
      });
      gente.push(p);
    };
    for (let i = 0; i < 7; i++) crear(i);
    const parar = bucle(j, dt => {
      t += dt;
      proximo -= dt;
      if (proximo <= 0) {
        proximo = Math.max(0.55, 1.6 - t * 0.022) * (0.7 + Math.random() * 0.6);
        const libres = gente.filter(g => g.estado === 'nada');
        if (libres.length) {
          const g = elegir(libres);
          const hunde = Math.random() < 0.62;
          g.estado = hunde ? 'hunde' : 'saluda';
          g.t = 0;
          g.limite = hunde ? Math.max(1.9, 3.2 - t * 0.025) : 1.6;
          g.el.className = `pi-banista ${g.estado}`;
          g.el.querySelector('span').textContent = hunde ? '🙆' : '🙋';
          if (hunde) total++;
        }
      }
      for (const g of gente) {
        g.t += dt;
        if (g.estado === 'nada') {
          g.x += g.vx * dt;
          if (g.x < 0.06 || g.x > 0.9) g.vx *= -1;
          g.el.querySelector('span').textContent = BANISTAS[gente.indexOf(g) % BANISTAS.length];
          g.el.querySelector('span').style.transform = `scaleX(${g.vx < 0 ? 1 : -1})`;
        } else {
          g.el.querySelector('span').style.transform = '';
          const k = g.t / g.limite;
          g.el.querySelector('.pi-burbuja b').style.width = `${(1 - k) * 100}%`;
          if (k >= 1) {
            if (g.estado === 'hunde') {
              perdidos++;
              s.sonido.ruido(0.25, { volumen: 0.05 });
              j.info('¡Uy! Ese ha tragado agua… ¡más atentos!');
              pintarMarcador();
            }
            g.estado = 'nada';
            g.el.className = 'pi-banista';
          }
        }
        g.el.style.left = `${g.x * 100}%`;
        g.el.style.top = `${g.y * 100 + Math.sin(t * 3 + g.x * 9) * 1.5}%`;
      }
    });
    cronometro(j, 45, () => {
      parar();
      j.final(`¡${salvados} rescates!${perdidos ? ` (${perdidos} tragaron agua)` : ''}`, limitar((salvados - fallos * 0.5 - perdidos * 0.6) / Math.max(10, total)));
    });
  }
};

export const CERRAJERO = {
  id: 'cerrajero', icono: '🔐', nombre: 'Cerrajero', texto: 'Subid cada pin justo cuando la ganzúa pasa por la zona verde', pago: 135,
  jugar(j, s) {
    let abiertas = 0;
    let fallos = 0;
    let pins = 0;
    let fijados = 0;
    let pos = 0;
    let dir = 1;
    let zona = { a: 0.4, b: 0.6 };
    let vel = 0.9;
    let bloqueo = 0;
    const PUERTAS = ['🚪', '🏠', '🚗', '🧳', '🗄️', '🏦'];
    j.info('Toca la cerradura (o el botón) cuando la ganzúa esté en la franja verde. Si fallas, se cae un pin');
    j.cuerpo.innerHTML = `<div class="t2 t2-cerradura"><div class="t2-marcador"></div>
      <div class="ce-puerta"><span></span><small></small></div>
      <div class="ce-cilindro"><div class="ce-pins"></div></div>
      <div class="ce-medidor"><div class="ce-zona"></div><div class="ce-aguja"></div></div>
      <button class="ce-boton primario">🔧 ¡Ahora!</button></div>`;
    const caja = j.cuerpo.querySelector('.t2-cerradura');
    const pinsEl = caja.querySelector('.ce-pins');
    const zonaEl = caja.querySelector('.ce-zona');
    const aguja = caja.querySelector('.ce-aguja');
    const puerta = caja.querySelector('.ce-puerta');
    const pintarMarcador = () => marcador(j, `🔓 ${abiertas} cerraduras · ❌ ${fallos}`);
    const nuevaZona = () => {
      const ancho = Math.max(0.09, 0.22 - abiertas * 0.025 - fijados * 0.01);
      const a = 0.08 + Math.random() * (0.84 - ancho);
      zona = { a, b: a + ancho };
      zonaEl.style.left = `${a * 100}%`;
      zonaEl.style.width = `${ancho * 100}%`;
    };
    const pintarPins = () => {
      pinsEl.innerHTML = Array.from({ length: pins }, (_, i) => `<i class="${i < fijados ? 'arriba' : i === fijados ? 'activo' : ''}"><b></b></i>`).join('');
    };
    const nueva = () => {
      pins = Math.min(6, 3 + abiertas);
      fijados = 0;
      vel = 0.85 + abiertas * 0.18;
      puerta.querySelector('span').textContent = PUERTAS[abiertas % PUERTAS.length];
      puerta.querySelector('small').textContent = `Cerradura ${abiertas + 1} · ${pins} pines`;
      caja.classList.remove('abierta');
      nuevaZona();
      pintarPins();
      pintarMarcador();
    };
    const intento = e => {
      if (e) e.preventDefault();
      if (bloqueo > 0) return;
      if (pos >= zona.a && pos <= zona.b) {
        fijados++;
        s.sonido.tono(700 + fijados * 90, 0, 0.08, { tipo: 'square', volumen: 0.05 });
        if (fijados >= pins) {
          abiertas++;
          caja.classList.add('abierta');
          s.sonido.arreglo();
          const r = puerta.getBoundingClientRect();
          chispas(caja, r.left + r.width / 2, r.top + r.height / 2, '🔓', 4);
          bloqueo = 0.9;
          setTimeout(nueva, 850);
        } else {
          nuevaZona();
          pintarPins();
        }
      } else {
        fallos++;
        fijados = Math.max(0, fijados - 1);
        s.sonido.error();
        caja.classList.add('mal');
        setTimeout(() => caja.classList.remove('mal'), 300);
        bloqueo = 0.35;
        pintarPins();
      }
      pintarMarcador();
    };
    caja.querySelector('.ce-boton').addEventListener('pointerdown', intento);
    caja.querySelector('.ce-cilindro').addEventListener('pointerdown', intento);
    nueva();
    const parar = bucle(j, dt => {
      bloqueo = Math.max(0, bloqueo - dt);
      pos += dir * vel * dt;
      if (pos > 1) { pos = 1; dir = -1; }
      if (pos < 0) { pos = 0; dir = 1; }
      aguja.style.left = `${pos * 100}%`;
      aguja.classList.toggle('verde', pos >= zona.a && pos <= zona.b);
    });
    cronometro(j, 50, () => {
      parar();
      j.final(`¡${abiertas} cerraduras abiertas!${fallos ? ` (${fallos} pines caídos)` : ''}`, limitar((abiertas + fijados / Math.max(1, pins) - fallos * 0.12) / 5));
    });
  }
};

export const SUSHI = {
  id: 'sushi', icono: '🍣', nombre: 'Restaurante de sushi', texto: 'Coged los platos de la cinta y arrastradlos al cliente que los ha pedido', pago: 130,
  jugar(j, s) {
    const PLATOS = ['🍣', '🍙', '🍤', '🥟', '🍜', '🍡'];
    const CLIENTES = ['👩', '👨‍🦰', '👵', '🧑', '👱‍♀️', '🧔', '👧', '🧑‍🦳'];
    j.info('Arrastra cada plato desde la cinta hasta el cliente que lo quiere. ¡Que no se cansen de esperar!');
    j.cuerpo.innerHTML = `<div class="t2 t2-sushi"><div class="t2-marcador"></div>
      <div class="su-barra"></div>
      <div class="su-cinta"><div class="su-rodillos"></div><div class="su-platos"></div></div>
      <div class="su-cocina">👨‍🍳 <small>El cocinero va sacando platos…</small></div></div>`;
    const caja = j.cuerpo.querySelector('.t2-sushi');
    const barra = caja.querySelector('.su-barra');
    const platosEl = caja.querySelector('.su-platos');
    const rodillos = caja.querySelector('.su-rodillos');
    let servidos = 0;
    let fallos = 0;
    let enfadados = 0;
    let t = 0;
    let saleEn = 0.3;
    let desplaz = 0;
    const platos = [];
    const asientos = [0, 1, 2].map(i => {
      const el = document.createElement('div');
      el.className = 'su-asiento';
      el.innerHTML = '<div class="su-pide"></div><span></span><i class="su-paciencia"><b></b></i>';
      barra.appendChild(el);
      return { el, i, pide: [], paciencia: 0, max: 1, cliente: null, vacio: 0.4 + i * 0.6 };
    });
    const pintarMarcador = () => marcador(j, `🍱 ${servidos} servidos · ❌ ${fallos} · 😤 ${enfadados}`);
    pintarMarcador();
    const sentar = a => {
      a.cliente = elegir(CLIENTES);
      const n = 1 + (Math.random() < Math.min(0.7, 0.2 + t * 0.012) ? 1 : 0);
      a.pide = Array.from({ length: n }, () => elegir(PLATOS));
      a.max = 13 + n * 5 - Math.min(5, t * 0.08);
      a.paciencia = a.max;
      a.el.querySelector('span').textContent = a.cliente;
      a.el.classList.add('ocupado');
      a.el.classList.remove('feliz', 'enfadado');
      pintarPide(a);
    };
    const pintarPide = a => {
      a.el.querySelector('.su-pide').innerHTML = a.pide.map(p => `<i>${p}</i>`).join('');
    };
    const vaciar = (a, feliz) => {
      a.el.classList.add(feliz ? 'feliz' : 'enfadado');
      a.el.querySelector('span').textContent = feliz ? '😋' : '😤';
      a.el.querySelector('.su-pide').innerHTML = '';
      a.cliente = null;
      a.pide = [];
      a.vacio = 1.2 + Math.random();
      setTimeout(() => {
        if (!a.cliente) {
          a.el.classList.remove('ocupado', 'feliz', 'enfadado');
          a.el.querySelector('span').textContent = '';
        }
      }, 700);
    };
    const pedidosVivos = () => asientos.flatMap(a => a.pide);
    const sacarPlato = () => {
      const vivos = pedidosVivos();
      const tipo = vivos.length && Math.random() < 0.6 ? elegir(vivos) : elegir(PLATOS);
      const el = document.createElement('div');
      el.className = 'su-plato';
      el.innerHTML = `<b>${tipo}</b>`;
      platosEl.appendChild(el);
      const pl = { el, tipo, x: 1.05, fuera: false };
      platos.push(pl);
      arrastrable(el, {
        alCoger: () => { pl.cogido = true; s.sonido.tic(); },
        alMover: (x, y) => asientos.forEach(a => a.el.classList.toggle('encima', dentroDe(a.el, x, y, 10))),
        alSoltar: (x, y, fantasma) => {
          pl.cogido = false;
          asientos.forEach(a => a.el.classList.remove('encima'));
          const a = asientos.find(q => dentroDe(q.el, x, y, 10));
          if (!a) return false;
          const k = a.pide.indexOf(pl.tipo);
          if (a.cliente && k >= 0) {
            a.pide.splice(k, 1);
            pl.fuera = true;
            el.remove();
            fantasma.remove();
            s.sonido.tono(880, 0, 0.08, { tipo: 'triangle', volumen: 0.06 });
            if (!a.pide.length) {
              servidos++;
              s.sonido.arreglo();
              chispas(caja, x, y, '⭐', 4);
              vaciar(a, true);
            } else pintarPide(a);
          } else {
            fallos++;
            s.sonido.error();
            rebotar(fantasma);
            j.info(a.cliente ? `${a.cliente} no ha pedido ${pl.tipo}. Mira su bocadillo` : 'Ese sitio está vacío');
          }
          pintarMarcador();
          return true;
        }
      });
    };
    alTerminar(j, limpiarFantasmas);
    const parar = bucle(j, dt => {
      t += dt;
      const vel = 0.11 + Math.min(0.06, t * 0.0015);
      desplaz = (desplaz + vel * dt * 600) % 40;
      rodillos.style.backgroundPositionX = `${-desplaz}px`;
      saleEn -= dt;
      if (saleEn <= 0) { saleEn = 1.25 + Math.random() * 0.6; sacarPlato(); }
      for (const pl of [...platos]) {
        if (pl.fuera) { platos.splice(platos.indexOf(pl), 1); continue; }
        if (!pl.cogido) pl.x -= vel * dt;
        pl.el.style.left = `${pl.x * 100}%`;
        if (pl.x < -0.12) {
          pl.el.remove();
          platos.splice(platos.indexOf(pl), 1);
        }
      }
      for (const a of asientos) {
        if (!a.cliente) {
          a.vacio -= dt;
          if (a.vacio <= 0) sentar(a);
          continue;
        }
        a.paciencia -= dt;
        const k = a.paciencia / a.max;
        const b = a.el.querySelector('.su-paciencia b');
        b.style.width = `${limitar(k) * 100}%`;
        b.style.background = k > 0.5 ? '#6cc08a' : k > 0.25 ? '#f2c15b' : '#e57373';
        if (a.paciencia <= 0) {
          enfadados++;
          s.sonido.error();
          vaciar(a, false);
          pintarMarcador();
        }
      }
    });
    cronometro(j, 60, () => {
      parar();
      limpiarFantasmas();
      j.final(`¡${servidos} clientes servidos!${enfadados ? ` (${enfadados} se fueron enfadados)` : ''}`, limitar((servidos - fallos * 0.5 - enfadados * 0.7) / 11));
    });
  }
};

export const HELADERIA = {
  id: 'heladeria', icono: '🍦', nombre: 'Heladería', texto: 'Moved el cucurucho para coger las bolas en el orden del pedido', pago: 125,
  jugar(j, s) {
    const SABORES = { fresa: ['#f4a6b8', 'Fresa'], choco: ['#8a5a3c', 'Chocolate'], vainilla: ['#fff1c9', 'Vainilla'], menta: ['#a8e6cf', 'Menta'], limon: ['#fff176', 'Limón'], mora: ['#9b7ede', 'Mora'] };
    const claves = Object.keys(SABORES);
    j.info('Arrastra el cucurucho a izquierda y derecha. Coge las bolas en el orden del pedido (de abajo a arriba). ¡Una equivocada estropea el helado!');
    j.cuerpo.innerHTML = `<div class="t2 t2-helados"><div class="t2-marcador"></div>
      <div class="he-pedido"><span>🧒</span><div class="he-receta"></div></div>
      <div class="he-cielo"><div class="he-toldo"></div><div class="he-cono"><div class="he-bolas"></div><i></i></div></div></div>`;
    const caja = j.cuerpo.querySelector('.t2-helados');
    const cielo = caja.querySelector('.he-cielo');
    const cono = caja.querySelector('.he-cono');
    const bolasEl = caja.querySelector('.he-bolas');
    const receta = caja.querySelector('.he-receta');
    const nino = caja.querySelector('.he-pedido span');
    let x = 0.5;
    let pedido = [];
    let llevo = 0;
    let helados = 0;
    let estropeados = 0;
    let t = 0;
    let prox = 0.5;
    const caen = [];
    const pintarMarcador = () => marcador(j, `🍦 ${helados} helados · 💔 ${estropeados}`);
    const pintarPedido = () => {
      receta.innerHTML = pedido.map((k, i) => `<i class="${i < llevo ? 'hecho' : i === llevo ? 'toca' : ''}" style="--c:${SABORES[k][0]}" title="${SABORES[k][1]}"></i>`).join('');
    };
    const nuevoPedido = () => {
      const n = Math.min(5, 2 + Math.floor(helados / 2));
      pedido = Array.from({ length: n }, () => elegir(claves));
      llevo = 0;
      bolasEl.innerHTML = '';
      nino.textContent = elegir(['🧒', '👧', '👦', '👩', '👴', '🧑']);
      pintarPedido();
    };
    const moverA = cx => {
      const r = cielo.getBoundingClientRect();
      x = limitar((cx - r.left) / r.width, 0.08, 0.92);
    };
    cielo.addEventListener('pointerdown', e => { e.preventDefault(); cielo.setPointerCapture(e.pointerId); moverA(e.clientX); });
    cielo.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') moverA(e.clientX); });
    nuevoPedido();
    pintarMarcador();
    const parar = bucle(j, dt => {
      t += dt;
      prox -= dt;
      if (prox <= 0) {
        prox = Math.max(0.42, 0.9 - t * 0.008);
        const toca = pedido[llevo];
        const k = Math.random() < 0.42 ? toca : elegir(claves);
        const el = document.createElement('i');
        el.className = 'he-cae';
        el.style.setProperty('--c', SABORES[k][0]);
        cielo.appendChild(el);
        caen.push({ el, k, x: 0.08 + Math.random() * 0.84, y: -0.05, v: 0.28 + Math.random() * 0.12 + Math.min(0.2, t * 0.004) });
      }
      cono.style.left = `${x * 100}%`;
      const altoPila = 0.62 - llevo * 0.045;
      for (const b of [...caen]) {
        b.y += b.v * dt;
        b.el.style.left = `${b.x * 100}%`;
        b.el.style.top = `${b.y * 100}%`;
        if (b.y > altoPila && b.y < altoPila + 0.08 && Math.abs(b.x - x) < 0.085) {
          b.el.remove();
          caen.splice(caen.indexOf(b), 1);
          if (b.k === pedido[llevo]) {
            llevo++;
            const bola = document.createElement('i');
            bola.style.setProperty('--c', SABORES[b.k][0]);
            bolasEl.appendChild(bola);
            s.sonido.pop();
            pintarPedido();
            if (llevo >= pedido.length) {
              helados++;
              s.sonido.arreglo();
              const r = cono.getBoundingClientRect();
              chispas(caja, r.left + r.width / 2, r.top, '💖', 5);
              cono.classList.add('servido');
              setTimeout(() => cono.classList.remove('servido'), 400);
              setTimeout(nuevoPedido, 250);
              pintarMarcador();
            }
          } else {
            estropeados++;
            s.sonido.error();
            cono.classList.add('mal');
            setTimeout(() => cono.classList.remove('mal'), 400);
            j.info(`¡Esa era de ${SABORES[b.k][1].toLowerCase()}! Tocaba ${SABORES[pedido[llevo]][1].toLowerCase()}. Empezamos otro`);
            setTimeout(nuevoPedido, 200);
            pintarMarcador();
          }
          continue;
        }
        if (b.y > 1.05) {
          b.el.remove();
          caen.splice(caen.indexOf(b), 1);
        }
      }
    });
    cronometro(j, 55, () => {
      parar();
      j.final(`¡${helados} helados servidos!${estropeados ? ` (${estropeados} al suelo)` : ''}`, limitar((helados - estropeados * 0.4) / 7));
    });
  }
};

export const TRABAJOS2 = [PESCADOR, CARTERO, SOCORRISTA, CERRAJERO, SUSHI, HELADERIA];

const PALOS = ['♥', '♦', '♣', '♠'];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const JUEGOS_FAVOR3 = {
  cartas: {
    icono: '🃏',
    jugar(j, s) {
      const FRASES_BIEN = ['¡Eso es!', '¡Tenéis buen ojo!', '¡Ja! Me vais a dejar sin pensión', '¡Olé!'];
      const FRASES_MAL = ['¡Ja, ja! Os pillé', 'La suerte es así…', 'Eso os pasa por jóvenes'];
      let baraja = barajar(PALOS.flatMap(p => VALORES.map((v, i) => ({ p, v, n: i + 1 }))));
      let actual = baraja.pop();
      let aciertos = 0;
      let racha = 0;
      let mejor = 0;
      let ronda = 0;
      const RONDAS = 12;
      j.info('¿La siguiente carta será mayor o menor? Si sale igual, cuenta como acierto. ¡Don Ramón se pica!');
      const carta = c => `<div class="cr-carta ${c.p === '♥' || c.p === '♦' ? 'roja' : ''}"><b>${c.v}</b><span>${c.p}</span><b class="ab">${c.v}</b></div>`;
      j.cuerpo.innerHTML = `<div class="t2 t2-cartas"><div class="t2-marcador"></div>
        <div class="cr-ramon"><span>👴</span><p>Vamos a ver qué sabéis hacer…</p></div>
        <div class="cr-mesa"><div class="cr-actual"></div><div class="cr-mazo"><i></i><i></i><i></i></div></div>
        <div class="cr-botones"><button data-a="mayor" class="primario">⬆️ Mayor</button><button data-a="menor" class="primario">⬇️ Menor</button></div></div>`;
      const caja = j.cuerpo.querySelector('.t2-cartas');
      const actualEl = caja.querySelector('.cr-actual');
      const dice = caja.querySelector('.cr-ramon p');
      const pintar = () => {
        actualEl.innerHTML = carta(actual);
        marcador(j, `🃏 ${ronda}/${RONDAS} · ✅ ${aciertos} · 🔥 ${racha}`);
      };
      pintar();
      let ocupado = false;
      caja.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
        if (ocupado) return;
        ocupado = true;
        const sig = baraja.pop();
        const ok = sig.n === actual.n || (b.dataset.a === 'mayor' ? sig.n > actual.n : sig.n < actual.n);
        ronda++;
        actualEl.innerHTML = `${carta(actual)}<div class="cr-nueva">${carta(sig)}</div>`;
        s.sonido.chasquido();
        setTimeout(() => {
          if (ok) {
            aciertos++;
            racha++;
            mejor = Math.max(mejor, racha);
            s.sonido.tono(600 + racha * 70, 0, 0.1, { tipo: 'triangle', volumen: 0.06 });
            dice.textContent = elegir(FRASES_BIEN);
            caja.classList.add('bien');
          } else {
            racha = 0;
            s.sonido.error();
            dice.textContent = elegir(FRASES_MAL);
            caja.classList.add('mal');
          }
          setTimeout(() => caja.classList.remove('bien', 'mal'), 350);
          actual = sig;
          if (baraja.length < 2) baraja = barajar(PALOS.flatMap(p => VALORES.map((v, i) => ({ p, v, n: i + 1 }))));
          pintar();
          ocupado = false;
          if (ronda >= RONDAS) {
            const p = limitar((aciertos - 6) / 5 + mejor * 0.03);
            j.final(aciertos >= 10 ? `¡${aciertos} de ${RONDAS}! Don Ramón pide la revancha` : aciertos >= 8 ? `${aciertos} de ${RONDAS}. «No está mal, chavales»` : `${aciertos} de ${RONDAS}. «Otro día será»`, p);
          }
        }, 450);
      }));
    }
  },

  karaoke: {
    icono: '🎤',
    jugar(j, s) {
      const NOTAS = [
        { c: '#e57373', f: 392, e: '🎸' },
        { c: '#f2c15b', f: 494, e: '🥁' },
        { c: '#6cc08a', f: 587, e: '🎹' },
        { c: '#5a9fd6', f: 698, e: '🎺' }
      ];
      const META = 9;
      let serie = [];
      let paso = 0;
      let turno = 'escucha';
      let fallos = 0;
      let mejor = 0;
      j.info('Escuchad la canción y repetidla tocando los instrumentos en el mismo orden. ¡Cada vez es más larga!');
      j.cuerpo.innerHTML = `<div class="t2 t2-karaoke"><div class="t2-marcador"></div>
        <div class="ka-escenario"><div class="ka-focos"><i></i><i></i><i></i></div><div class="ka-cantante">🧑‍🎤</div><div class="ka-publico">👏🙌🥳👏🙌</div></div>
        <div class="ka-teclas">${NOTAS.map((n, i) => `<button data-i="${i}" style="--c:${n.c}">${n.e}</button>`).join('')}</div></div>`;
      const caja = j.cuerpo.querySelector('.t2-karaoke');
      const teclas = [...caja.querySelectorAll('.ka-teclas button')];
      const cantante = caja.querySelector('.ka-cantante');
      const encender = (i, ms = 320) => {
        teclas[i].classList.add('on');
        caja.style.setProperty('--foco', NOTAS[i].c);
        s.sonido.tono(NOTAS[i].f, 0, ms / 1000, { tipo: 'triangle', volumen: 0.08 });
        setTimeout(() => teclas[i].classList.remove('on'), ms - 40);
      };
      const pintarMarcador = () => marcador(j, `🎵 ${serie.length}/${META} notas · ❌ ${fallos}/3`);
      let vivo = true;
      alTerminar(j, () => { vivo = false; });
      const reproducir = () => {
        turno = 'escucha';
        caja.classList.add('escuchando');
        j.info('🎧 Escuchad…');
        const ms = Math.max(280, 520 - serie.length * 25);
        serie.forEach((n, k) => setTimeout(() => vivo && encender(n, ms - 60), 500 + k * ms));
        setTimeout(() => {
          if (!vivo) return;
          turno = 'toca';
          paso = 0;
          caja.classList.remove('escuchando');
          j.info('🎤 ¡Vuestro turno!');
        }, 500 + serie.length * ms);
      };
      const ronda = () => {
        serie.push(azar(4));
        pintarMarcador();
        reproducir();
      };
      teclas.forEach((b, i) => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (turno !== 'toca') return;
        encender(i, 250);
        if (serie[paso] === i) {
          paso++;
          cantante.classList.add('canta');
          setTimeout(() => cantante.classList.remove('canta'), 200);
          if (paso >= serie.length) {
            mejor = serie.length;
            turno = 'espera';
            caja.classList.add('aplausos');
            setTimeout(() => caja.classList.remove('aplausos'), 600);
            if (serie.length >= META) {
              s.sonido.arreglo();
              vivo = false;
              j.final('¡Ovación del público! 🎤✨', 1);
              return;
            }
            setTimeout(ronda, 700);
          }
        } else {
          fallos++;
          turno = 'espera';
          s.sonido.error();
          caja.classList.add('mal');
          setTimeout(() => caja.classList.remove('mal'), 400);
          pintarMarcador();
          if (fallos >= 3) {
            vivo = false;
            j.final(`Llegasteis a ${mejor} notas seguidas`, limitar(mejor / META));
            return;
          }
          j.info('¡Desafinado! Os la ponemos otra vez');
          setTimeout(reproducir, 800);
        }
      }));
      setTimeout(() => vivo && ronda(), 300);
    }
  },

  calcetines: {
    icono: '🧦',
    jugar(j, s) {
      const COLORES = ['#e57373', '#5a9fd6', '#6cc08a', '#f2c15b', '#a070d8', '#f08c2a', '#ec8fb5', '#7a8a99'];
      const DIBUJOS = ['liso', 'rayas', 'lunares', 'rombos'];
      let parejas = 0;
      let fallos = 0;
      let tanda = 0;
      let elegido = null;
      j.info('Toca un calcetín y luego su pareja (mismo color y mismo dibujo). ¡Ojo, que hay muy parecidos!');
      j.cuerpo.innerHTML = `<div class="t2 t2-colada"><div class="t2-marcador"></div><div class="co-monton"></div><div class="co-cesta">🧺 <span></span></div></div>`;
      const caja = j.cuerpo.querySelector('.t2-colada');
      const monton = caja.querySelector('.co-monton');
      const cesta = caja.querySelector('.co-cesta span');
      const pintarMarcador = () => marcador(j, `🧦 ${parejas} parejas · ❌ ${fallos}`);
      const nueva = () => {
        tanda++;
        const n = Math.min(8, 4 + tanda);
        const tipos = new Set();
        while (tipos.size < n) tipos.add(`${azar(Math.min(COLORES.length, 3 + tanda))}-${elegir(DIBUJOS)}`);
        const lista = barajar([...tipos].flatMap(t => [t, t]));
        monton.innerHTML = lista.map((t, i) => {
          const [c, d] = t.split('-');
          return `<button class="co-calcetin ${d}" data-t="${t}" style="--c:${COLORES[c]};--r:${-25 + azar(50)}deg;--d:${i * 30}ms"><i></i></button>`;
        }).join('');
        monton.querySelectorAll('.co-calcetin').forEach(b => b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (b.classList.contains('fuera')) return;
          if (!elegido) {
            elegido = b;
            b.classList.add('elegido');
            s.sonido.tic();
            return;
          }
          if (elegido === b) {
            b.classList.remove('elegido');
            elegido = null;
            return;
          }
          if (elegido.dataset.t === b.dataset.t) {
            parejas++;
            for (const x of [elegido, b]) x.classList.add('fuera');
            cesta.textContent = '🧦'.repeat(Math.min(12, parejas));
            s.sonido.pop();
            chispas(caja, e.clientX, e.clientY, '✨', 3);
            elegido = null;
            if (!monton.querySelector('.co-calcetin:not(.fuera)')) {
              s.sonido.arreglo();
              setTimeout(nueva, 400);
            }
          } else {
            fallos++;
            s.sonido.error();
            const a = elegido;
            a.classList.remove('elegido');
            for (const x of [a, b]) x.classList.add('mal');
            setTimeout(() => { a.classList.remove('mal'); b.classList.remove('mal'); }, 350);
            elegido = null;
          }
          pintarMarcador();
        }));
        pintarMarcador();
      };
      nueva();
      cronometro(j, 45, () => j.final(`¡${parejas} parejas dobladas!${fallos ? ` (${fallos} despistes)` : ''}`, limitar((parejas - fallos * 0.7) / 17)));
    }
  },

  toby: {
    icono: '🐶',
    jugar(j, s) {
      const SITIOS = ['🛋️', '🪴', '🛏️', '📦', '🧺', '🚪', '🪑', '🗄️', '🧸'];
      const META = 6;
      let pillado = 0;
      let fallos = 0;
      let donde = -1;
      let visible = 0;
      let espera = 0.8;
      let t = 0;
      j.info('¡Toby se esconde por la casa! Tócale cuando asome la cabeza 🐶. Ojo con el gato 🐱, que no es él');
      j.cuerpo.innerHTML = `<div class="t2 t2-toby"><div class="t2-marcador"></div><div class="tb2-casa">${SITIOS.map((x, i) => `<button data-i="${i}"><span class="mueble">${x}</span><span class="asoma"></span></button>`).join('')}</div><div class="tb2-sol">👩 <small>¡Toby, ven aquí!</small></div></div>`;
      const caja = j.cuerpo.querySelector('.t2-toby');
      const huecos = [...caja.querySelectorAll('.tb2-casa button')];
      const pintarMarcador = () => marcador(j, `🐶 ${pillado}/${META} · ❌ ${fallos}`);
      pintarMarcador();
      let gato = false;
      const esconder = () => {
        huecos.forEach(h => h.classList.remove('fuera', 'gato'));
        donde = -1;
      };
      huecos.forEach((h, i) => h.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (i === donde && !gato) {
          pillado++;
          s.sonido.mascota();
          chispas(caja, e.clientX, e.clientY, '🦴', 4);
          esconder();
          espera = 0.6 + Math.random() * 0.6;
          pintarMarcador();
          if (pillado >= META) {
            parar();
            pararReloj();
            j.final(`¡Toby atrapado! ${fallos ? `(${fallos} sustos)` : 'A la primera'}`, limitar(1 - fallos * 0.08 - Math.max(0, t - 18) * 0.02));
          }
        } else {
          fallos++;
          s.sonido.error();
          h.classList.add('mal');
          setTimeout(() => h.classList.remove('mal'), 300);
          if (i === donde && gato) j.info('¡Ese es el gato de Don Ramón! 🐱');
          pintarMarcador();
        }
      }));
      const parar = bucle(j, dt => {
        t += dt;
        if (donde >= 0) {
          visible -= dt;
          if (visible <= 0) { esconder(); espera = 0.3 + Math.random() * 0.7; }
          return;
        }
        espera -= dt;
        if (espera > 0) return;
        donde = azar(huecos.length);
        gato = Math.random() < 0.22;
        visible = Math.max(0.55, 1.1 - pillado * 0.08);
        huecos[donde].querySelector('.asoma').textContent = gato ? '🐱' : '🐶';
        huecos[donde].classList.add('fuera');
        huecos[donde].classList.toggle('gato', gato);
        if (!gato) s.sonido.tono(900, 0, 0.05, { tipo: 'square', volumen: 0.03 });
      });
      const pararReloj = cronometro(j, 30, () => {
        parar();
        j.final(`Toby se ha escapado… pillado ${pillado} de ${META} veces`, limitar(pillado / META - fallos * 0.05));
      });
    }
  }
};

for (const t of TRABAJOS2) JUEGOS_FAVOR3[t.id] = { icono: t.icono, jugar: t.jugar };

export { cronometro, bucle, chispas, marcador, limitar, barajar, alTerminar, arrastrable, dentroDe, limpiarFantasmas, rebotar, azar, elegir };
