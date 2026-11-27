import { cronometro, bucle, chispas, marcador, limitar, barajar, alTerminar, azar, elegir } from './trabajos2.js';

const tiembla = el => {
  el.classList.remove('j3-tiembla');
  void el.offsetWidth;
  el.classList.add('j3-tiembla');
};

const flotar = (caja, x, y, texto, clase = '') => {
  const r = caja.getBoundingClientRect();
  const e = document.createElement('b');
  e.className = `j3-flota ${clase}`;
  e.textContent = texto;
  e.style.left = `${x - r.left}px`;
  e.style.top = `${y - r.top}px`;
  caja.appendChild(e);
  setTimeout(() => e.remove(), 900);
};

const centro = el => {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
};

function lienzo(cv, alto) {
  const r = window.devicePixelRatio || 1;
  const w = Math.min(380, cv.parentElement.clientWidth || 340);
  cv.width = w * r;
  cv.height = alto * r;
  cv.style.width = `${w}px`;
  cv.style.height = `${alto}px`;
  const ctx = cv.getContext('2d');
  ctx.setTransform(r, 0, 0, r, 0, 0);
  return { ctx, w, h: alto };
}

export const PANADERO = {
  id: 'panadero', icono: '🥖', nombre: 'Panadero de madrugada', texto: 'Sacad cada pan del horno cuando esté doradito: ni crudo ni quemado', pago: 120,
  jugar(j, s) {
    const PANES = [
      { e: '🥖', n: 'Barra', t: 4.4 },
      { e: '🥐', n: 'Cruasán', t: 3.3 },
      { e: '🍞', n: 'Pan de molde', t: 5.4 },
      { e: '🥯', n: 'Rosca', t: 3.8 },
      { e: '🥨', n: 'Lazo', t: 2.9 }
    ];
    const DORADO = [0.7, 0.92];
    const PERFECTO = [0.77, 0.85];
    const QUEMA = 1.18;
    j.info('Toca cada pan cuando la barra llegue a la zona dorada. ¡Si te pasas, se quema!');
    j.cuerpo.innerHTML = `<div class="t2 j3-horno"><div class="t2-marcador"></div>
      <div class="hn-horno"><div class="hn-luz"></div><div class="hn-rejilla"></div></div>
      <div class="hn-cesta"><span>🧺</span><div></div></div></div>`;
    const caja = j.cuerpo.querySelector('.j3-horno');
    const rejilla = caja.querySelector('.hn-rejilla');
    const cesta = caja.querySelector('.hn-cesta div');
    let buenos = 0, perfectos = 0, quemados = 0, crudos = 0, racha = 0, total = 0;
    const pintar = () => marcador(j, `🧺 ${buenos} panes · 🔥 ${quemados} quemados${racha >= 3 ? ` · <span class="j3-racha">🔥 racha ×${racha}</span>` : ''}`);
    pintar();
    const ventana = `left:${(DORADO[0] / QUEMA) * 100}%;width:${((DORADO[1] - DORADO[0]) / QUEMA) * 100}%`;
    const huecos = Array.from({ length: 6 }, (_, i) => {
      const el = document.createElement('button');
      el.className = 'hn-hueco vacio';
      el.innerHTML = `<span></span><i><em style="${ventana}"></em><u></u></i>`;
      rejilla.appendChild(el);
      const h = { el, pan: null, k: 0, espera: 0.4 + i * 0.55, quemado: 0 };
      el.addEventListener('pointerdown', e => { e.preventDefault(); sacar(h, e.clientX, e.clientY); });
      return h;
    });
    const sacar = (h, x, y) => {
      if (!h.pan || h.quemado) return;
      const k = h.k;
      if (k < DORADO[0]) {
        crudos++;
        racha = 0;
        s.sonido.error();
        flotar(caja, x, y, '¡Crudo!', 'mal');
        tiembla(h.el);
      } else {
        const perfecto = k >= PERFECTO[0] && k <= PERFECTO[1];
        buenos++;
        racha++;
        if (perfecto) perfectos++;
        s.sonido.tono(perfecto ? 880 : 660, 0, 0.12, { tipo: 'triangle', volumen: 0.1 });
        if (racha % 5 === 0) s.sonido.arreglo();
        flotar(caja, x, y, perfecto ? '¡Perfecto!' : '¡Rico!', perfecto ? 'oro' : 'bien');
        chispas(caja, x, y, perfecto ? '✨' : '🌾', perfecto ? 7 : 4);
        const p = document.createElement('i');
        p.textContent = h.pan.e;
        cesta.appendChild(p);
        while (cesta.children.length > 9) cesta.firstChild.remove();
      }
      vaciar(h, 0.5 + Math.random() * 0.8);
      pintar();
    };
    const vaciar = (h, espera) => {
      h.pan = null;
      h.k = 0;
      h.quemado = 0;
      h.espera = espera;
      h.el.className = 'hn-hueco vacio';
      h.el.querySelector('span').textContent = '';
      h.el.querySelector('span').style.filter = '';
      h.el.querySelector('u').style.width = '0%';
    };
    let t = 0;
    const parar = bucle(j, dt => {
      t += dt;
      const ritmo = 1 + t / 55;
      for (const h of huecos) {
        if (h.quemado) {
          h.quemado -= dt;
          if (h.quemado <= 0) vaciar(h, 0.6);
          continue;
        }
        if (!h.pan) {
          h.espera -= dt;
          if (h.espera <= 0) {
            h.pan = elegir(PANES);
            h.k = 0;
            total++;
            h.el.classList.remove('vacio');
            h.el.querySelector('span').textContent = h.pan.e;
          }
          continue;
        }
        h.k += (dt * ritmo) / h.pan.t;
        const k = h.k;
        const brillo = k < 0.8 ? 1.65 - 0.8 * k : Math.max(0.25, 1.01 - (k - 0.8) * 2);
        const sat = k < 0.8 ? 0.25 + k * 0.95 : 1;
        h.el.querySelector('span').style.filter = `brightness(${brillo.toFixed(2)}) saturate(${sat.toFixed(2)})`;
        h.el.querySelector('u').style.width = `${Math.min(100, (k / QUEMA) * 100)}%`;
        h.el.classList.toggle('listo', k >= DORADO[0] && k <= DORADO[1]);
        h.el.classList.toggle('humo', k > DORADO[1]);
        if (k >= QUEMA) {
          quemados++;
          racha = 0;
          s.sonido.error();
          h.quemado = 0.9;
          h.el.className = 'hn-hueco quemado';
          h.el.querySelector('span').textContent = '🔥';
          h.el.querySelector('span').style.filter = '';
          pintar();
        }
      }
    });
    cronometro(j, 45, () => {
      parar();
      j.final(buenos ? `¡${buenos} panes recién hechos!${perfectos ? ` (${perfectos} perfectos)` : ''}${quemados ? ` · ${quemados} quemados` : ''}` : 'Hoy se ha quemado todo…', limitar((buenos + perfectos * 0.5 - quemados * 0.6 - crudos * 0.4) / 15));
    });
  }
};

export const LAVACOCHES = {
  id: 'lavacoches', icono: '🚿', nombre: 'Túnel de lavado', texto: 'Enjabonad el barro con la esponja y luego aclarad la espuma con la manguera', pago: 115,
  jugar(j, s) {
    const COCHES = ['🚗', '🚙', '🚕', '🚐', '🏎️', '🚓'];
    j.info('🧽 Frota el barro hasta hacer espuma y luego cambia a 🚿 para aclararla');
    j.cuerpo.innerHTML = `<div class="t2 j3-lavado"><div class="t2-marcador"></div><canvas class="lv-lienzo"></canvas>
      <div class="lv-herr"><button data-h="esponja" class="on">🧽 Esponja</button><button data-h="manguera">🚿 Manguera</button></div></div>`;
    const caja = j.cuerpo.querySelector('.j3-lavado');
    const cv = caja.querySelector('canvas');
    const { ctx, w, h } = lienzo(cv, 300);
    const botones = [...caja.querySelectorAll('.lv-herr button')];
    let herr = 'esponja';
    const elegirHerr = x => {
      herr = x;
      botones.forEach(b => b.classList.toggle('on', b.dataset.h === x));
      botones.forEach(b => b.classList.remove('avisa'));
      s.sonido.tocar();
    };
    botones.forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); elegirHerr(b.dataset.h); }));
    let coche = null;
    let lavados = 0;
    let n = 4;
    let salida = 0;
    let puntero = null;
    let anterior = null;
    let pulsado = false;
    let gotas = [];
    let avisado = 0;
    const nuevo = () => {
      const manchas = [];
      for (let i = 0; i < n; i++) {
        manchas.push({ x: w / 2 + (Math.random() - 0.5) * 170, y: h * 0.52 + (Math.random() - 0.4) * 60, r: 18 + Math.random() * 14, barro: 1, espuma: 0, forma: Array.from({ length: 5 }, () => [Math.random() - 0.5, Math.random() - 0.5, 0.5 + Math.random() * 0.5]) });
      }
      coche = { e: COCHES[lavados % COCHES.length], manchas, x: -w, brillo: 0 };
      n = Math.min(9, n + 1);
    };
    nuevo();
    const pintar = () => marcador(j, `🚘 ${lavados} coches relucientes`);
    pintar();
    const pos = e => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); pulsado = true; puntero = anterior = pos(e); });
    cv.addEventListener('pointermove', e => {
      puntero = pos(e);
      if (!pulsado || !coche || coche.x !== 0 || salida) { anterior = puntero; return; }
      const d = Math.hypot(puntero.x - anterior.x, puntero.y - anterior.y);
      for (const m of coche.manchas) {
        if (Math.hypot(puntero.x - m.x, puntero.y - m.y) > m.r * 1.5) continue;
        if (herr === 'esponja') {
          if (m.barro > 0) {
            const q = Math.min(m.barro, d / (m.r * 7));
            m.barro -= q;
            m.espuma = Math.min(1, m.espuma + q * 1.2);
            if (Math.random() < 0.15) s.sonido.chasquido();
          }
        } else if (m.barro > 0.05) {
          if (performance.now() - avisado > 1500) {
            avisado = performance.now();
            j.info('Ese barro aún no tiene jabón: ¡primero la esponja! 🧽');
          }
        } else if (m.espuma > 0) {
          m.espuma = Math.max(0, m.espuma - d / (m.r * 4.5));
          if (m.espuma === 0) { m.barro = 0; s.sonido.pop(); }
        }
      }
      if (herr === 'manguera') s.sonido.ruido(0.05, { volumen: 0.02, freq: 2400, q: 0.6 });
      anterior = puntero;
    });
    const soltar = () => { pulsado = false; };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
    const parar = bucle(j, dt => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#d9eef7';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#9aa6ad';
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (let x = (performance.now() / 20) % 60 - 60; x < w; x += 60) ctx.fillRect(x, h * 0.86, 30, 4);
      if (!coche) return;
      if (coche.x < 0) coche.x = Math.min(0, coche.x + dt * w * 2.2);
      if (salida) {
        salida += dt;
        coche.x += dt * w * 2.6;
        if (coche.x > w) { salida = 0; nuevo(); j.info('🧽 ¡Otro! Esponja al barro y luego manguera'); }
      }
      ctx.save();
      ctx.translate(coche.x, 0);
      ctx.font = '190px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.save();
      ctx.translate(w / 2, h * 0.5);
      ctx.scale(-1, 1);
      ctx.fillText(coche.e, 0, 0);
      ctx.restore();
      for (const m of coche.manchas) {
        if (m.barro > 0) {
          ctx.globalAlpha = Math.min(1, m.barro * 1.1) * 0.9;
          ctx.fillStyle = '#6b4a2b';
          for (const [dx, dy, k] of m.forma) {
            ctx.beginPath();
            ctx.arc(m.x + dx * m.r, m.y + dy * m.r, m.r * k, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (m.espuma > 0) {
          ctx.globalAlpha = Math.min(1, m.espuma);
          ctx.fillStyle = '#fff';
          for (const [dx, dy, k] of m.forma) {
            ctx.beginPath();
            ctx.arc(m.x + dx * m.r * 1.3, m.y + dy * m.r * 1.3, m.r * k * 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = 'rgba(150,200,255,.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (coche.brillo > 0) {
        coche.brillo -= dt;
        ctx.font = '30px serif';
        for (let i = 0; i < 4; i++) ctx.fillText('✨', w / 2 + Math.cos(i * 1.7 + performance.now() / 200) * 90, h * 0.45 + Math.sin(i * 2.3) * 40);
      }
      ctx.restore();
      if (pulsado && puntero && herr === 'manguera') {
        for (let i = 0; i < 3; i++) gotas.push({ x: w - 10, y: 10, tx: puntero.x + (Math.random() - 0.5) * 24, ty: puntero.y + (Math.random() - 0.5) * 24, t: 0 });
      }
      ctx.fillStyle = 'rgba(80,160,230,.8)';
      for (const g of gotas) {
        g.t += dt * 4;
        const x = g.x + (g.tx - g.x) * g.t;
        const y = g.y + (g.ty - g.y) * g.t - Math.sin(g.t * Math.PI) * 30;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      gotas = gotas.filter(g => g.t < 1);
      if (puntero) {
        ctx.font = '38px serif';
        ctx.fillText(herr === 'esponja' ? '🧽' : '🚿', puntero.x + 14, puntero.y - 24);
      }
      if (!salida && coche.x === 0) {
        const sinBarro = coche.manchas.every(m => m.barro <= 0.05);
        if (sinBarro && herr === 'esponja' && coche.manchas.some(m => m.espuma > 0)) botones[1].classList.add('avisa');
        if (coche.manchas.every(m => m.barro <= 0.05 && m.espuma <= 0)) {
          lavados++;
          coche.brillo = 0.8;
          salida = 0.001;
          s.sonido.arreglo();
          j.info('✨ ¡Reluciente! Ahí viene otro…');
          pintar();
          elegirHerr('esponja');
        }
      }
    });
    cronometro(j, 55, () => {
      parar();
      const parcial = coche ? coche.manchas.filter(m => m.barro <= 0.05 && m.espuma <= 0).length / coche.manchas.length : 0;
      j.final(lavados ? `¡${lavados} coches relucientes! 🚘✨` : 'Los coches siguen llenos de barro…', limitar((lavados + parcial * 0.6) / 5));
    });
  }
};

export const MUSICO = {
  id: 'musico', icono: '🎸', nombre: 'Músico callejero', texto: 'Tocad cada nota justo cuando llegue a la línea. ¡Con racha caen más monedas al sombrero!', pago: 110,
  jugar(j, s) {
    const NOTAS = [[262, 330, 392], [294, 349, 440], [330, 392, 494]];
    const LINEA = 0.84;
    j.info('Toca el carril cuando la nota pase por la línea blanca');
    j.cuerpo.innerHTML = `<div class="t2 j3-ritmo"><div class="t2-marcador"></div>
      <div class="rt-publico"></div>
      <div class="rt-pista">${[0, 1, 2].map(i => `<div class="rt-carril c${i}" data-c="${i}"><b>${['🎸', '🥁', '🎺'][i]}</b></div>`).join('')}<div class="rt-linea"></div></div>
      <div class="rt-sombrero"><span>🎩</span><b>0</b></div></div>`;
    const caja = j.cuerpo.querySelector('.j3-ritmo');
    const pista = caja.querySelector('.rt-pista');
    const carriles = [...caja.querySelectorAll('.rt-carril')];
    const publico = caja.querySelector('.rt-publico');
    const sombrero = caja.querySelector('.rt-sombrero b');
    const GENTE = ['🧑', '👩', '👨‍🦳', '👧', '🧔', '👵', '🧑‍🦱', '👨‍👧', '👩‍🦰', '🕺'];
    let notas = [];
    let puntos = 0, racha = 0, mejor = 0, monedas = 0, aciertos = 0, fallos = 0;
    let t = 0, prox = 1, acorde = 0;
    const VIAJE = 1.7;
    const pintar = () => {
      marcador(j, `🎵 ${aciertos} notas${racha >= 4 ? ` · <span class="j3-racha">racha ×${racha}</span>` : ''}`);
      const n = Math.min(GENTE.length, Math.floor(racha / 3));
      if (publico.children.length !== n) publico.innerHTML = GENTE.slice(0, n).map((g, i) => `<i style="animation-delay:${i * 0.13}s">${g}</i>`).join('');
      sombrero.textContent = monedas;
    };
    pintar();
    const tocar = c => {
      const el = carriles[c];
      el.classList.remove('pulsa');
      void el.offsetWidth;
      el.classList.add('pulsa');
      let mejorN = null, dist = Infinity;
      for (const n of notas) {
        if (n.c !== c || n.hecha) continue;
        const d = Math.abs((LINEA - n.y) * VIAJE);
        if (d < dist) { dist = d; mejorN = n; }
      }
      const r = pista.getBoundingClientRect();
      const x = r.left + (c + 0.5) * r.width / 3;
      const y = r.top + r.height * LINEA;
      if (mejorN && dist < 0.19) {
        mejorN.hecha = true;
        mejorN.el.classList.add('tocada');
        setTimeout(() => mejorN.el.remove(), 250);
        const perfecto = dist < 0.08;
        aciertos++;
        racha++;
        mejor = Math.max(mejor, racha);
        puntos += (perfecto ? 2 : 1) * (racha >= 10 ? 2 : 1);
        s.sonido.tono(NOTAS[acorde][c] * (perfecto ? 2 : 1), 0, 0.3, { tipo: 'triangle', volumen: 0.12 });
        flotar(caja, x, y - 30, perfecto ? '¡Perfecto!' : 'Bien', perfecto ? 'oro' : 'bien');
        if (perfecto) chispas(caja, x, y, '✨', 3);
        if (racha % 5 === 0) {
          monedas += 1 + Math.floor(racha / 10);
          chispas(caja, x, y, '🪙', 4);
        }
      } else {
        racha = 0;
        s.sonido.error();
        tiembla(el);
      }
      pintar();
    };
    carriles.forEach(el => el.addEventListener('pointerdown', e => { e.preventDefault(); tocar(+el.dataset.c); }));
    const crear = c => {
      const el = document.createElement('i');
      el.className = `rt-nota c${c}`;
      el.textContent = ['🎵', '🎶', '🎵'][c];
      carriles[c].appendChild(el);
      notas.push({ c, y: -0.06, el, hecha: false });
    };
    const parar = bucle(j, dt => {
      t += dt;
      prox -= dt;
      if (prox <= 0 && t < 34) {
        const hueco = Math.max(0.36, 0.78 - t * 0.012);
        prox = hueco * (Math.random() < 0.25 ? 0.5 : 1);
        const c = azar(3);
        crear(c);
        if (t > 12 && Math.random() < 0.18) crear((c + 1 + azar(2)) % 3);
        if (Math.random() < 0.12) acorde = azar(NOTAS.length);
      }
      for (const n of notas) {
        if (n.hecha) continue;
        n.y += dt / VIAJE;
        n.el.style.top = `${n.y * 100}%`;
        if ((n.y - LINEA) * VIAJE > 0.2) {
          n.hecha = true;
          n.el.classList.add('fallada');
          setTimeout(() => n.el.remove(), 300);
          fallos++;
          if (racha) { racha = 0; pintar(); }
        }
      }
      notas = notas.filter(n => !n.hecha || n.el.isConnected);
    });
    cronometro(j, 37, () => {
      parar();
      j.final(`¡${aciertos} notas y ${monedas} 🪙 en el sombrero!${mejor >= 10 ? ` Racha máxima: ${mejor}` : ''}`, limitar((puntos + monedas) / 95));
    });
  }
};

export const MECANICO = {
  id: 'mecanico', icono: '🔧', nombre: 'Taller de neumáticos', texto: 'Inflad cada rueda hasta la zona verde. ¡Si os pasáis, revienta!', pago: 125,
  jugar(j, s) {
    const VEHICULOS = [
      { e: '🚗', n: 'coche', ruedas: 4, zona: 0.14 },
      { e: '🚲', n: 'bici', ruedas: 2, zona: 0.09 },
      { e: '🛵', n: 'moto', ruedas: 2, zona: 0.11 },
      { e: '🚙', n: 'todoterreno', ruedas: 4, zona: 0.12 },
      { e: '🛻', n: 'furgoneta', ruedas: 4, zona: 0.1 }
    ];
    j.info('Mantén «Inflar» y suelta dentro de la zona verde. Si te quedas corto, sigue inflando');
    j.cuerpo.innerHTML = `<div class="t2 j3-taller"><div class="t2-marcador"></div>
      <div class="tl-vehiculo"><span></span><div class="tl-ruedas"></div></div>
      <div class="tl-medidor"><div class="tl-zona"></div><div class="tl-aguja"></div><small>PSI</small></div>
      <button class="tl-boton">💨 Inflar</button></div>`;
    const caja = j.cuerpo.querySelector('.j3-taller');
    const veh = caja.querySelector('.tl-vehiculo span');
    const ruedasEl = caja.querySelector('.tl-ruedas');
    const zonaEl = caja.querySelector('.tl-zona');
    const aguja = caja.querySelector('.tl-aguja');
    const medidor = caja.querySelector('.tl-medidor');
    const boton = caja.querySelector('.tl-boton');
    let v = null, rueda = 0, p = 0, pulsado = false, sujeto = 0, quieto = 0, zona = [0.6, 0.74];
    let ok = 0, perfectas = 0, reventadas = 0, idx = 0;
    const pintar = () => marcador(j, `🛞 ${ok} ruedas · 💥 ${reventadas} reventadas`);
    const pintarRuedas = () => {
      ruedasEl.innerHTML = Array.from({ length: v.ruedas }, (_, i) => `<i class="${i < rueda ? (v.estado[i] ? 'ok' : 'mal') : i === rueda ? 'actual' : ''}">${i < rueda ? (v.estado[i] ? '✅' : '💥') : '🛞'}</i>`).join('');
    };
    const nuevaRueda = () => {
      p = 0.08 + Math.random() * 0.15;
      const ancho = Math.max(0.065, v.zona - ok * 0.004);
      const ini = 0.5 + Math.random() * (0.88 - ancho - 0.5);
      zona = [ini, ini + ancho];
      zonaEl.style.bottom = `${zona[0] * 100}%`;
      zonaEl.style.height = `${ancho * 100}%`;
      quieto = 0;
    };
    const nuevo = () => {
      const base = VEHICULOS[idx++ % VEHICULOS.length];
      v = { ...base, estado: [] };
      rueda = 0;
      veh.textContent = v.e;
      veh.classList.remove('sale');
      void veh.offsetWidth;
      veh.classList.add('entra');
      nuevaRueda();
      pintarRuedas();
    };
    nuevo();
    pintar();
    const abajo = e => { e.preventDefault(); pulsado = true; sujeto = 0; boton.classList.add('on'); };
    const arriba = () => { pulsado = false; boton.classList.remove('on'); };
    boton.addEventListener('pointerdown', abajo);
    window.addEventListener('pointerup', arriba);
    window.addEventListener('pointercancel', arriba);
    alTerminar(j, () => { window.removeEventListener('pointerup', arriba); window.removeEventListener('pointercancel', arriba); });
    let espera = 0;
    const terminarRueda = bien => {
      v.estado[rueda] = bien;
      rueda++;
      pintarRuedas();
      pintar();
      if (rueda >= v.ruedas) {
        espera = 0.8;
        veh.classList.remove('entra');
        veh.classList.add('sale');
        if (v.estado.every(Boolean)) { s.sonido.arreglo(); j.info(`¡${v.n[0].toUpperCase() + v.n.slice(1)} listo! 👍`); }
      } else nuevaRueda();
    };
    const parar = bucle(j, dt => {
      if (espera > 0) {
        espera -= dt;
        if (espera <= 0) nuevo();
        return;
      }
      if (pulsado) {
        sujeto += dt;
        p += (0.1 + sujeto * 0.32) * dt;
        p += Math.sin(performance.now() / 60) * 0.004;
        quieto = 0;
        if (Math.random() < 0.3) s.sonido.ruido(0.05, { volumen: 0.03, freq: 900 + p * 1200, q: 1 });
      } else {
        p = Math.max(0, p - 0.025 * dt);
        if (p >= zona[0] && p <= zona[1]) {
          quieto += dt;
          if (quieto > 0.45) {
            const medio = (zona[0] + zona[1]) / 2;
            const perfecta = Math.abs(p - medio) < (zona[1] - zona[0]) * 0.2;
            ok++;
            if (perfecta) perfectas++;
            s.sonido.tono(perfecta ? 990 : 740, 0, 0.15, { tipo: 'triangle', volumen: 0.1 });
            const [x, y] = centro(medidor);
            flotar(caja, x, y - 40, perfecta ? '¡Perfecta!' : '¡Bien!', perfecta ? 'oro' : 'bien');
            terminarRueda(true);
          }
        } else quieto = 0;
      }
      if (p > 1) {
        reventadas++;
        s.sonido.ruido(0.35, { volumen: 0.25, freq: 300, q: 0.5 });
        tiembla(caja);
        const [x, y] = centro(veh);
        chispas(caja, x, y, '💥', 6);
        pulsado = false;
        boton.classList.remove('on');
        j.info('¡PUM! Te has pasado… A por la siguiente');
        terminarRueda(false);
      }
      aguja.style.bottom = `${Math.min(1, p) * 100}%`;
      medidor.classList.toggle('dentro', p >= zona[0] && p <= zona[1]);
      medidor.classList.toggle('peligro', p > zona[1]);
    });
    cronometro(j, 48, () => {
      parar();
      j.final(ok ? `¡${ok} ruedas a punto!${perfectas ? ` (${perfectas} perfectas)` : ''}${reventadas ? ` · ${reventadas} reventadas` : ''}` : 'Hoy el taller ha sido un desastre…', limitar((ok + perfectas * 0.3 - reventadas * 0.8) / 14));
    });
  }
};

export const RECEPCION = {
  id: 'recepcion', icono: '🛎️', nombre: 'Recepcionista de hotel', texto: 'Dad a cada huésped la llave de su habitación y colgad las que os devuelvan', pago: 120,
  jugar(j, s) {
    const HAB = [101, 102, 103, 104, 201, 202, 203, 204, 301, 302, 303, 304];
    const GENTE = ['🧑‍💼', '👩‍🦰', '👨‍🦳', '👩‍👧', '🧔', '👵', '🧑‍🎤', '👨‍🍳', '👰', '🧑‍🚀'];
    j.info('Toca la llave que pide el primer huésped. Si viene a devolverla, toca su gancho vacío');
    j.cuerpo.innerHTML = `<div class="t2 j3-hotel"><div class="t2-marcador"></div>
      <div class="ht-cola"></div><div class="ht-mostrador">🛎️</div>
      <div class="ht-tablero">${HAB.map(n => `<button data-n="${n}"><b>${n}</b><span>🔑</span></button>`).join('')}</div></div>`;
    const caja = j.cuerpo.querySelector('.j3-hotel');
    const colaEl = caja.querySelector('.ht-cola');
    const ganchos = {};
    caja.querySelectorAll('.ht-tablero button').forEach(b => { ganchos[b.dataset.n] = b; });
    const colgada = Object.fromEntries(HAB.map(n => [n, Math.random() < 0.7]));
    const pintarTablero = () => { for (const n of HAB) ganchos[n].classList.toggle('vacio', !colgada[n]); };
    pintarTablero();
    let cola = [];
    let atendidos = 0, enfadados = 0, propinas = 0, t = 0, prox = 0.4;
    const pintar = () => marcador(j, `😊 ${atendidos} atendidos · 😠 ${enfadados} enfadados · 🪙 ${propinas}`);
    pintar();
    const pedidos = () => new Set(cola.map(g => g.n));
    const llegar = () => {
      const enUso = pedidos();
      const conLlave = HAB.filter(n => colgada[n] && !enUso.has(n));
      const sinLlave = HAB.filter(n => !colgada[n] && !enUso.has(n));
      const devuelve = sinLlave.length && (Math.random() < 0.35 || !conLlave.length);
      const lista = devuelve ? sinLlave : conLlave;
      if (!lista.length) return;
      const g = { n: elegir(lista), devuelve, e: elegir(GENTE), paciencia: 1, dur: Math.max(5.5, 10 - t * 0.08) };
      g.el = document.createElement('div');
      g.el.className = 'ht-huesped';
      g.el.innerHTML = `<span>${g.e}</span><p>${devuelve ? `Me voy 👋<br><b>🔑 ${g.n}</b>` : `Habitación<br><b>${g.n}</b>`}</p><i><u></u></i>`;
      colaEl.appendChild(g.el);
      cola.push(g);
      s.sonido.tono(1320, 0, 0.12, { tipo: 'sine', volumen: 0.07 });
    };
    const irse = (g, contento) => {
      cola = cola.filter(x => x !== g);
      g.el.classList.add(contento ? 'contento' : 'enfadado');
      g.el.querySelector('span').textContent = contento ? '😊' : '😠';
      setTimeout(() => g.el.remove(), 450);
    };
    caja.querySelectorAll('.ht-tablero button').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault();
      const g = cola[0];
      const n = +b.dataset.n;
      if (!g) return;
      const bien = g.n === n && (g.devuelve ? !colgada[n] : colgada[n]);
      if (bien) {
        colgada[n] = g.devuelve;
        pintarTablero();
        atendidos++;
        const tip = g.paciencia > 0.66 ? 3 : g.paciencia > 0.33 ? 2 : 1;
        propinas += tip;
        s.sonido.tono(880, 0, 0.1, { tipo: 'triangle', volumen: 0.1 });
        s.sonido.tono(1175, 0.08, 0.14, { tipo: 'triangle', volumen: 0.1 });
        flotar(caja, e.clientX, e.clientY - 20, `+${tip} 🪙`, 'oro');
        irse(g, true);
        pintar();
      } else {
        g.paciencia -= 0.28;
        s.sonido.error();
        tiembla(b);
        tiembla(g.el);
      }
    }));
    const parar = bucle(j, dt => {
      t += dt;
      prox -= dt;
      if (prox <= 0 && cola.length < 3) {
        llegar();
        prox = Math.max(1.4, 3 - t * 0.03);
      }
      cola.forEach((g, i) => {
        g.paciencia -= dt / g.dur * (i === 0 ? 1 : 0.6);
        g.el.classList.toggle('primero', i === 0);
        g.el.querySelector('u').style.width = `${Math.max(0, g.paciencia) * 100}%`;
        g.el.classList.toggle('prisa', g.paciencia < 0.33);
        if (g.paciencia <= 0) {
          enfadados++;
          s.sonido.error();
          irse(g, false);
          pintar();
        }
      });
    });
    cronometro(j, 50, () => {
      parar();
      j.final(atendidos ? `¡${atendidos} huéspedes atendidos y ${propinas} 🪙 de propina!${enfadados ? ` (${enfadados} enfadados)` : ''}` : 'El hotel ha sido un caos…', limitar((atendidos + propinas * 0.15 - enfadados * 0.6) / 16));
    });
  }
};

const LISTA = {
  icono: '🛒',
  jugar(j, s) {
    const PRODUCTOS = ['🍎', '🥛', '🍞', '🧀', '🥚', '🍌', '🐟', '🥕', '🍅'];
    const FRASES = ['¡Qué memoria tenéis!', '¡Eso es, cariño!', '¡Igualitos que vuestro padre!', '¡Perfecto!'];
    const RONDAS = 7;
    j.info('Mamá dice la lista una vez. Luego toca los productos en el mismo orden');
    j.cuerpo.innerHTML = `<div class="t2 j3-lista"><div class="t2-marcador"></div>
      <div class="ls-mama"><span>👵</span><p></p></div>
      <div class="ls-carro">🛒<div></div></div>
      <div class="ls-estante"></div></div>`;
    const caja = j.cuerpo.querySelector('.j3-lista');
    const bocadillo = caja.querySelector('.ls-mama p');
    const carro = caja.querySelector('.ls-carro div');
    const estante = caja.querySelector('.ls-estante');
    let ronda = 0, vidas = 2, seq = [], paso = 0, fase = 'mira', completas = 0;
    let orden = PRODUCTOS.slice();
    const pintar = () => marcador(j, `📝 Lista ${Math.min(ronda + 1, RONDAS)} de ${RONDAS} · ${'❤️'.repeat(vidas)}${'🤍'.repeat(2 - vidas)}`);
    const montarEstante = () => {
      estante.innerHTML = orden.map(p => `<button data-p="${p}">${p}</button>`).join('');
      estante.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); elegirP(b); }));
    };
    const esperas = [];
    const luego = (fn, ms) => esperas.push(setTimeout(fn, ms));
    alTerminar(j, () => esperas.forEach(clearTimeout));
    const empezar = () => {
      fase = 'mira';
      caja.classList.add('mirando');
      paso = 0;
      carro.innerHTML = '';
      seq = Array.from({ length: ronda + 3 }, () => elegir(PRODUCTOS));
      if (ronda >= 2) { orden = barajar(orden.slice()); montarEstante(); }
      pintar();
      bocadillo.innerHTML = 'Apuntad…';
      const ms = Math.max(520, 900 - ronda * 60);
      seq.forEach((p, i) => luego(() => {
        bocadillo.innerHTML = `<b class="ls-grande">${p}</b>`;
        s.sonido.tono(523 + i * 60, 0, 0.15, { tipo: 'sine', volumen: 0.09 });
      }, 600 + i * ms));
      luego(() => {
        bocadillo.innerHTML = '¡Ahora vosotros!';
        fase = 'toca';
        caja.classList.remove('mirando');
      }, 600 + seq.length * ms);
    };
    const elegirP = b => {
      if (fase !== 'toca') return;
      const p = b.dataset.p;
      if (p === seq[paso]) {
        paso++;
        s.sonido.tono(660 + paso * 40, 0, 0.1, { tipo: 'triangle', volumen: 0.1 });
        b.classList.remove('bien');
        void b.offsetWidth;
        b.classList.add('bien');
        const i = document.createElement('i');
        i.textContent = p;
        carro.appendChild(i);
        if (paso >= seq.length) {
          fase = 'espera';
          completas++;
          ronda++;
          s.sonido.arreglo();
          bocadillo.textContent = elegir(FRASES);
          const [x, y] = centro(carro);
          chispas(caja, x, y, '✨', 6);
          if (ronda >= RONDAS) luego(acabar, 900);
          else luego(empezar, 1200);
        }
      } else {
        vidas--;
        fase = 'espera';
        s.sonido.error();
        tiembla(b);
        bocadillo.innerHTML = `¡Eso no! Era ${seq[paso]}`;
        pintar();
        if (vidas <= 0) luego(acabar, 1100);
        else luego(empezar, 1500);
      }
    };
    const acabar = () => j.final(completas >= RONDAS ? '¡La lista entera sin fallar! Mamá está orgullosa' : `¡${completas} listas completas!`, limitar(completas / (RONDAS - 1)));
    montarEstante();
    empezar();
  }
};

const TOPOS = {
  icono: '🔨',
  jugar(j, s) {
    const BICHOS = [
      { e: '🐹', tipo: 'topo', p: 0.62, puntos: 1 },
      { e: '🐹', tipo: 'oro', p: 0.1, puntos: 3 },
      { e: '🌷', tipo: 'flor', p: 0.15, puntos: -2 },
      { e: '🐱', tipo: 'gato', p: 0.13, puntos: -2 }
    ];
    const QUEJAS = { flor: '¡Mis tulipanes no! 😱', gato: '¡Al gato no, criaturas! 🐱' };
    j.info('¡Dales a los topos! Ni a las flores de Don Ramón ni a su gato');
    j.cuerpo.innerHTML = `<div class="t2 j3-topos"><div class="t2-marcador"></div><div class="tp-ramon"><span>👴</span><p>¡Que me destrozan el huerto!</p></div>
      <div class="tp-huerto">${Array.from({ length: 9 }, (_, i) => `<button class="tp-agujero" data-i="${i}"><span></span></button>`).join('')}</div></div>`;
    const caja = j.cuerpo.querySelector('.j3-topos');
    const ramon = caja.querySelector('.tp-ramon p');
    const agujeros = [...caja.querySelectorAll('.tp-agujero')].map(el => ({ el, b: null, t: 0, dur: 0 }));
    let puntos = 0, golpes = 0, escapados = 0, errores = 0, t = 0, prox = 0.5;
    const pintar = () => marcador(j, `🔨 ${golpes} topos · 💨 ${escapados} escapados`);
    pintar();
    const elegirBicho = () => {
      let r = Math.random();
      for (const b of BICHOS) { r -= b.p; if (r <= 0) return b; }
      return BICHOS[0];
    };
    const bajar = a => {
      a.b = null;
      a.el.classList.remove('arriba', 'oro', 'flor', 'gato', 'topo');
    };
    agujeros.forEach(a => a.el.addEventListener('pointerdown', e => {
      e.preventDefault();
      a.el.classList.remove('martillo');
      void a.el.offsetWidth;
      a.el.classList.add('martillo');
      if (!a.b || a.golpeado) return;
      const b = a.b;
      a.golpeado = true;
      puntos += b.puntos;
      if (b.puntos > 0) {
        golpes++;
        s.sonido.tono(b.tipo === 'oro' ? 1047 : 330, 0, 0.12, { tipo: 'square', volumen: 0.07, hasta: 180 });
        chispas(caja, e.clientX, e.clientY, b.tipo === 'oro' ? '⭐' : '💫', b.tipo === 'oro' ? 7 : 4);
        flotar(caja, e.clientX, e.clientY - 30, `+${b.puntos}`, b.tipo === 'oro' ? 'oro' : 'bien');
        a.el.querySelector('span').textContent = '😵';
        ramon.textContent = b.tipo === 'oro' ? '¡El topo dorado! ¡Bravo!' : elegir(['¡Toma!', '¡Eso es!', '¡Dale!', '¡Ja!']);
      } else {
        errores++;
        s.sonido.error();
        tiembla(caja);
        flotar(caja, e.clientX, e.clientY - 30, `${b.puntos}`, 'mal');
        ramon.textContent = QUEJAS[b.tipo];
      }
      a.dur = Math.min(a.dur, a.t + 0.25);
      pintar();
    }));
    const parar = bucle(j, dt => {
      t += dt;
      prox -= dt;
      if (prox <= 0) {
        prox = Math.max(0.32, 0.75 - t * 0.012) * (0.7 + Math.random() * 0.6);
        const libres = agujeros.filter(a => !a.b);
        if (libres.length) {
          const a = elegir(libres);
          const b = elegirBicho();
          a.b = b;
          a.t = 0;
          a.golpeado = false;
          a.dur = Math.max(0.55, 1.05 - t * 0.012) * (b.tipo === 'oro' ? 0.7 : 1);
          a.el.querySelector('span').textContent = b.e;
          a.el.classList.add('arriba', b.tipo);
        }
      }
      for (const a of agujeros) {
        if (!a.b) continue;
        a.t += dt;
        if (a.t >= a.dur) {
          if (!a.golpeado && a.b.puntos > 0) { escapados++; pintar(); }
          bajar(a);
        }
      }
    });
    cronometro(j, 36, () => {
      parar();
      j.final(golpes ? `¡${golpes} topos a raya!${errores ? ` (${errores} sustos)` : ''}` : 'Los topos se han quedado con el huerto…', limitar(puntos / 30));
    });
  }
};

export const TRABAJOS3 = [PANADERO, LAVACOCHES, MUSICO, MECANICO, RECEPCION];

export const JUEGOS_FAVOR4 = {
  hornear: { icono: PANADERO.icono, jugar: PANADERO.jugar },
  lavado: { icono: LAVACOCHES.icono, jugar: LAVACOCHES.jugar },
  concierto: { icono: MUSICO.icono, jugar: MUSICO.jugar },
  ruedas: { icono: MECANICO.icono, jugar: MECANICO.jugar },
  hotel: { icono: RECEPCION.icono, jugar: RECEPCION.jugar },
  lista: LISTA,
  topos: TOPOS
};
