import { idioma } from './i18n.js';
export const TIEMPO = 0.8;
export const VELOCIDAD = 1.2;

const azar = n => Math.floor(Math.random() * n);
const elegir = l => l[azar(l.length)];

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
  const previo = j.alTerminar;
  j.alTerminar = () => { parar(); if (previo) previo(); };
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
  const previo = j.alTerminar;
  j.alTerminar = () => { parar(); if (previo) previo(); };
  return parar;
}

const marcador = (j, texto) => {
  const el = j.cuerpo.querySelector('.fv-marcador');
  if (el) el.innerHTML = texto;
};

function lienzo(cont, proporcion = 1.4, maxAlto = 0.6) {
  const w = Math.min(380, (cont.clientWidth || innerWidth) - 4);
  const h = Math.round(Math.min(innerHeight * maxAlto, w * proporcion));
  const c = document.createElement('canvas');
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  c.className = 'fv-lienzo';
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  cont.appendChild(c);
  return { c, ctx, w, h };
}

function emoji(ctx, e, x, y, tam) {
  ctx.fillStyle = '#000';
  ctx.font = `${tam}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e, x, y);
}

function rect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function cruceta(cont, alDir) {
  const d = document.createElement('div');
  d.className = 'fv-cruceta';
  d.innerHTML = '<button data-d="a">⬆️</button><button data-d="i">⬅️</button><button data-d="b">⬇️</button><button data-d="d">➡️</button>';
  d.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); alDir(b.dataset.d); }));
  cont.appendChild(d);
}

function deslizar(el, alDir) {
  let ini = null;
  el.addEventListener('pointerdown', e => { ini = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', e => {
    if (!ini) return;
    const dx = e.clientX - ini.x;
    const dy = e.clientY - ini.y;
    ini = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    alDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'i') : (dy > 0 ? 'b' : 'a'));
  });
}

const DIRS = { a: [0, -1], b: [0, 1], i: [-1, 0], d: [1, 0] };

function coche(ctx, x, y, w, h, color) {
  rect(ctx, x - w / 2 + 2, y - h / 2 + 4, w, h, 9, 'rgba(0,0,0,.18)');
  rect(ctx, x - w / 2, y - h / 2, w, h, 9, color);
  rect(ctx, x - w / 2 + 5, y - h / 2 + h * 0.18, w - 10, h * 0.2, 4, '#cfe8f2');
  rect(ctx, x - w / 2 + 5, y + h * 0.18, w - 10, h * 0.14, 4, '#b7d3e0');
}

export const JUEGOS_FAVOR2 = {
  conducir: {
    icono: '🚗',
    jugar(j, s) {
      j.info('¡Llegáis tarde al médico! Toca a izquierda o derecha para cambiar de carril y esquiva todo');
      j.cuerpo.innerHTML = '<div class="fv fv-conducir"><div class="fv-marcador">🏥 0% · ⏱️ 0 s</div></div>';
      const cont = j.cuerpo.querySelector('.fv-conducir');
      const { c, ctx, w, h } = lienzo(cont, 1.5, 0.64);
      const N = 3;
      const ancho = (w * 0.78) / N;
      const x0 = w * 0.11;
      const px = k => x0 + (k + 0.5) * ancho;
      let carril = 1;
      let x = px(1);
      let vel = 0;
      const VMAX = 520;
      let dist = 0;
      const META = 14000;
      let t = 0;
      let choques = 0;
      let flash = 0;
      let raya = 0;
      let sig = 0.6;
      const obs = [];
      const cambiar = d => {
        carril = Math.max(0, Math.min(N - 1, carril + d));
        s.sonido.tic();
      };
      c.addEventListener('pointerdown', e => {
        const r = c.getBoundingClientRect();
        cambiar(e.clientX - r.left < r.width / 2 ? -1 : 1);
      });
      const fin = (llego) => {
        parar();
        pararT();
        const base = llego ? Math.max(0, Math.min(1, 1 - (t - 26) / 28)) : (dist / META) * 0.45;
        const p = Math.max(0, base - choques * 0.06);
        j.final(llego ? (choques ? `Llegasteis en ${Math.round(t)} s con ${choques} sustos` : `¡En ${Math.round(t)} s y sin un rasguño!`) : 'Llegasteis tarde a la cita…', p);
      };
      const parar = bucle(j, dt => {
        t += dt;
        vel = Math.min(VMAX + t * 6, vel + dt * 260);
        dist += vel * dt;
        x += (px(carril) - x) * Math.min(1, dt * 12);
        raya = (raya + vel * dt) % 60;
        sig -= dt;
        if (sig <= 0) {
          sig = Math.max(0.32, 0.9 - t * 0.012) * (0.7 + Math.random() * 0.6);
          const tipo = Math.random() < 0.7 ? 'coche' : elegir(['cono', 'bache', 'charco']);
          const libres = [0, 1, 2].filter(k => !obs.some(o => o.k === k && o.y < 120));
          if (libres.length > 1 || Math.random() < 0.3) {
            obs.push({ k: elegir(libres.length ? libres : [0, 1, 2]), y: -70, tipo, v: tipo === 'coche' ? 150 + Math.random() * 160 : 0, color: elegir(['#5a9fd6', '#e05050', '#6cc08a', '#f2d06b', '#b39ddb', '#ffffff']) });
          }
        }
        for (const o of [...obs]) {
          o.y += (vel - o.v) * dt;
          const ox = px(o.k);
          const alto = o.tipo === 'coche' ? 78 : 40;
          if (!o.golpe && Math.abs(ox - x) < ancho * 0.62 && Math.abs(o.y - (h - 90)) < (alto + 70) / 2 - 8) {
            o.golpe = true;
            if (o.tipo === 'charco') { vel *= 0.75; s.sonido.agua(); } else {
              choques++;
              vel *= 0.2;
              flash = 0.4;
              s.sonido.error();
            }
          }
          if (o.y > h + 100) obs.splice(obs.indexOf(o), 1);
        }
        flash = Math.max(0, flash - dt);
        ctx.fillStyle = '#7cb35a';
        ctx.fillRect(0, 0, w, h);
        for (let k = -1; k < h / 70 + 1; k++) {
          const y = ((k * 70 + raya * 1.17) % (h + 70)) - 35;
          emoji(ctx, k % 2 ? '🌳' : '🌲', x0 * 0.45, y, 26);
          emoji(ctx, k % 2 ? '🌲' : '🏠', w - x0 * 0.45, y + 30, 24);
        }
        ctx.fillStyle = '#5b5f66';
        ctx.fillRect(x0, 0, ancho * N, h);
        ctx.fillStyle = '#f2efe9';
        ctx.fillRect(x0 - 4, 0, 4, h);
        ctx.fillRect(x0 + ancho * N, 0, 4, h);
        for (let k = 1; k < N; k++) for (let y = -60 + raya; y < h; y += 60) ctx.fillRect(x0 + ancho * k - 2, y, 4, 30);
        for (const o of obs) {
          const ox = px(o.k);
          if (o.tipo === 'coche') coche(ctx, ox, o.y, ancho * 0.62, 78, o.color);
          else if (o.tipo === 'cono') emoji(ctx, '🚧', ox, o.y, 34);
          else if (o.tipo === 'bache') { ctx.fillStyle = '#34373c'; ctx.beginPath(); ctx.ellipse(ox, o.y, ancho * 0.3, 16, 0, 0, 7); ctx.fill(); }
          else { ctx.fillStyle = 'rgba(120,190,240,.75)'; ctx.beginPath(); ctx.ellipse(ox, o.y, ancho * 0.34, 20, 0, 0, 7); ctx.fill(); }
        }
        coche(ctx, x, h - 90, ancho * 0.62, 80, flash > 0 && Math.floor(flash * 20) % 2 ? '#ffffff' : '#e58f9e');
        emoji(ctx, '👵', x, h - 92, 20);
        if (flash > 0) { ctx.fillStyle = `rgba(229,115,115,${flash * 0.5})`; ctx.fillRect(0, 0, w, h); }
        const pct = Math.min(100, Math.round((dist / META) * 100));
        marcador(j, `🏥 ${pct}% · ⏱️ ${Math.round(t)} s${choques ? ` · 💥 ${choques}` : ''}`);
        if (dist >= META) { fin(true); return false; }
      });
      const pararT = cronometro(j, 75, () => fin(false));
    }
  },

  cruzar: {
    icono: '🚦',
    jugar(j, s) {
      j.info('Lleva a Don Ramón al mercado: cruza la avenida sin que le pille nada. ¡3 viajes!');
      j.cuerpo.innerHTML = '<div class="fv fv-cruzar"><div class="fv-marcador">🛒 0 de 3 viajes</div></div>';
      const cont = j.cuerpo.querySelector('.fv-cruzar');
      const C = 7;
      const F = 10;
      const { c, ctx, w, h } = lienzo(cont, 1.35, 0.5);
      const cw = w / C;
      const ch = h / F;
      const carriles = [];
      for (let f = 1; f < F - 1; f++) {
        if (f === 5) continue;
        const dir = f % 2 ? 1 : -1;
        const v = (1.4 + Math.random() * 1.6 + (f > 5 ? 0.6 : 0)) * dir;
        const lista = [];
        let pos = Math.random() * 2;
        while (pos < C + 2) {
          const largo = Math.random() < 0.3 ? 2 : 1;
          lista.push({ x: pos, largo, color: elegir(['#5a9fd6', '#e05050', '#6cc08a', '#f2d06b', '#b39ddb']), bici: largo === 1 && Math.random() < 0.3 });
          pos += largo + 1.6 + Math.random() * 2.2;
        }
        carriles.push({ f, v, lista, ancho: pos });
      }
      let jx = 3;
      let jy = F - 1;
      let viajes = 0;
      let golpes = 0;
      let aturdido = 0;
      const mover = d => {
        if (aturdido > 0) return;
        const [dx, dy] = DIRS[d];
        jx = Math.max(0, Math.min(C - 1, jx + dx));
        jy = Math.max(0, Math.min(F - 1, jy + dy));
        s.sonido.tic();
        if (jy === 0) {
          viajes++;
          s.sonido.arreglo();
          marcador(j, `🛒 ${viajes} de 3 viajes`);
          jy = F - 1;
          jx = 3;
          if (viajes >= 3) fin();
        }
      };
      deslizar(c, mover);
      cruceta(cont, mover);
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        const p = Math.max(0, viajes / 3 - golpes * 0.07);
        j.final(viajes >= 3 ? (golpes ? `Mercado hecho, con ${golpes} sustos` : '¡Ni un susto! Don Ramón está encantado') : `Solo ${viajes} viajes…`, p);
      };
      const parar = bucle(j, dt => {
        aturdido = Math.max(0, aturdido - dt);
        ctx.fillStyle = '#c8c2b8';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e6c69e';
        ctx.fillRect(0, 0, w, ch);
        for (let k = 0; k < C; k++) emoji(ctx, ['🏪', '🍎', '🥖', '🐟', '🧀', '🌷', '🏪'][k], (k + 0.5) * cw, ch / 2, ch * 0.6);
        ctx.fillStyle = '#9fd08a';
        ctx.fillRect(0, 5 * ch, w, ch);
        for (const cr of carriles) {
          ctx.fillStyle = '#5b5f66';
          ctx.fillRect(0, cr.f * ch, w, ch);
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          for (let x = 0; x < w; x += 40) ctx.fillRect(x, cr.f * ch + ch - 2, 20, 2);
          for (const v of cr.lista) {
            v.x += cr.v * dt;
            if (cr.v > 0 && v.x > C + 1) v.x -= cr.ancho;
            if (cr.v < 0 && v.x + v.largo < -1) v.x += cr.ancho;
            const vx = v.x * cw;
            const vy = cr.f * ch;
            if (v.bici) emoji(ctx, '🚲', vx + cw / 2, vy + ch / 2, ch * 0.75);
            else {
              rect(ctx, vx + 3, vy + 5, v.largo * cw - 6, ch - 10, 8, v.color);
              rect(ctx, vx + (cr.v > 0 ? v.largo * cw - cw * 0.45 : cw * 0.15), vy + 9, cw * 0.3, ch - 18, 4, '#cfe8f2');
            }
            if (aturdido <= 0 && cr.f === jy && jx + 0.75 > v.x && jx + 0.25 < v.x + v.largo) {
              golpes++;
              aturdido = 0.8;
              s.sonido.error();
              jy = F - 1;
              jx = 3;
            }
          }
        }
        ctx.fillStyle = '#c8c2b8';
        ctx.fillRect(0, (F - 1) * ch, w, ch);
        emoji(ctx, aturdido > 0 ? '😵' : '👴', (jx + 0.5) * cw, (jy + 0.5) * ch, ch * 0.8);
      });
      const pararT = cronometro(j, 50, fin);
    }
  },

  pasear: {
    icono: '🐕',
    jugar(j, s) {
      j.info('Pasea a Toby: desliza o usa las flechas para que coja los huesos. ¡Sin enredarse ni chocar!');
      j.cuerpo.innerHTML = '<div class="fv fv-pasear"><div class="fv-marcador">🦴 0</div></div>';
      const cont = j.cuerpo.querySelector('.fv-pasear');
      const C = 12;
      const F = 14;
      const { c, ctx, w, h } = lienzo(cont, F / C, 0.5);
      const cw = w / C;
      const ch = h / F;
      const arboles = new Set();
      while (arboles.size < 7) {
        const x = azar(C);
        const y = azar(F);
        if (y > 4 && y < 10 && x > 1) continue;
        arboles.add(`${x},${y}`);
      }
      let cuerpo = [[5, 7], [4, 7], [3, 7]];
      let dir = [1, 0];
      let sigDir = [1, 0];
      let hueso = null;
      let comidos = 0;
      let paso = 0;
      let vivo = true;
      const libre = (x, y) => !arboles.has(`${x},${y}`) && !cuerpo.some(([a, b]) => a === x && b === y);
      const ponerHueso = () => {
        for (let k = 0; k < 200; k++) {
          const x = azar(C);
          const y = azar(F);
          if (libre(x, y)) { hueso = [x, y]; return; }
        }
      };
      ponerHueso();
      let empezado = false;
      const girar = d => {
        empezado = true;
        const nd = DIRS[d];
        if (nd[0] === -dir[0] && nd[1] === -dir[1]) return;
        sigDir = nd;
      };
      deslizar(c, girar);
      cruceta(cont, girar);
      let hecho = false;
      const fin = choque => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        const p = Math.min(1, comidos / 14) - (choque ? 0.1 : 0);
        j.final(choque ? `¡Toby se ha enredado! ${comidos} huesos` : `¡Paseo completo! ${comidos} huesos`, Math.max(0, p));
      };
      const parar = bucle(j, dt => {
        if (empezado) paso += dt;
        const intervalo = Math.max(0.11, 0.2 - comidos * 0.007);
        if (vivo && paso >= intervalo) {
          paso = 0;
          dir = sigDir;
          const [hx, hy] = cuerpo[0];
          const nx = hx + dir[0];
          const ny = hy + dir[1];
          if (nx < 0 || ny < 0 || nx >= C || ny >= F || !libre(nx, ny)) {
            vivo = false;
            s.sonido.error();
            setTimeout(() => fin(true), 500);
          } else {
            cuerpo.unshift([nx, ny]);
            if (hueso && nx === hueso[0] && ny === hueso[1]) {
              comidos++;
              s.sonido.pop();
              marcador(j, `🦴 ${comidos}`);
              ponerHueso();
            } else cuerpo.pop();
          }
        }
        ctx.fillStyle = '#9fd08a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#8cc27a';
        for (let y = 0; y < F; y++) for (let x = (y % 2); x < C; x += 2) ctx.fillRect(x * cw, y * ch, cw, ch);
        for (const a of arboles) {
          const [x, y] = a.split(',').map(Number);
          emoji(ctx, '🌳', (x + 0.5) * cw, (y + 0.5) * ch, ch * 0.95);
        }
        if (hueso) emoji(ctx, '🦴', (hueso[0] + 0.5) * cw, (hueso[1] + 0.5) * ch, ch * 0.8);
        ctx.strokeStyle = '#e05050';
        ctx.lineWidth = Math.max(4, cw * 0.28);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        cuerpo.forEach(([x, y], i) => (i ? ctx.lineTo((x + 0.5) * cw, (y + 0.5) * ch) : ctx.moveTo((x + 0.5) * cw, (y + 0.5) * ch)));
        ctx.stroke();
        const cola = cuerpo[cuerpo.length - 1];
        emoji(ctx, '🧍', (cola[0] + 0.5) * cw, (cola[1] + 0.5) * ch, ch * 0.9);
        emoji(ctx, vivo ? '🐕' : '😵', (cuerpo[0][0] + 0.5) * cw, (cuerpo[0][1] + 0.5) * ch, ch * 1.05);
        if (!empezado) {
          rect(ctx, w / 2 - 120, h / 2 - 60, 240, 40, 14, 'rgba(255,250,244,.92)');
          ctx.fillStyle = '#3b2f26';
          ctx.font = '800 15px Nunito, system-ui, sans-serif';
          ctx.fillText(idioma() === 'en' ? 'Swipe to start' : 'Desliza para empezar', w / 2, h / 2 - 40);
        }
      });
      const pararT = cronometro(j, 60, () => fin(false));
    }
  },

  almacen: {
    icono: '📦',
    jugar(j, s) {
      const NIVELES = [
        ['#######', '#     #', '# .$@ #', '#     #', '#######'],
        ['#######', '#.   .#', '# $ $ #', '#  @  #', '#######'],
        ['########', '#      #', '# $ $ $#', '#  @   #', '#. .  .#', '########'],
        ['########', '#      #', '# $##$ #', '#.    .#', '#  @   #', '########']
      ];
      let nivel = 0;
      let mapa;
      let jug;
      let historial = [];
      let movs = 0;
      j.info('Empuja las cajas 📦 hasta las marcas 🟩. Si te atascas, deshaz o reinicia');
      const cargar = () => {
        mapa = NIVELES[nivel].map(f => f.split(''));
        historial = [];
        mapa.forEach((f, y) => f.forEach((ch, x) => { if (ch === '@') { jug = [x, y]; f[x] = ' '; } }));
        pintar();
      };
      const objetivo = (x, y) => NIVELES[nivel][y][x] === '.';
      const caja = (x, y) => mapa[y][x] === '$';
      const pared = (x, y) => mapa[y][x] === '#';
      const resuelto = () => mapa.every((f, y) => f.every((ch, x) => ch !== '$' || objetivo(x, y)));
      const mover = d => {
        const [dx, dy] = DIRS[d];
        const [x, y] = jug;
        const nx = x + dx;
        const ny = y + dy;
        if (pared(nx, ny)) return;
        if (caja(nx, ny)) {
          if (pared(nx + dx, ny + dy) || caja(nx + dx, ny + dy)) { s.sonido.error(); return; }
          historial.push({ jug: [...jug], mapa: mapa.map(f => [...f]) });
          mapa[ny][nx] = ' ';
          mapa[ny + dy][nx + dx] = '$';
          s.sonido.chasquido();
        } else historial.push({ jug: [...jug], mapa: mapa.map(f => [...f]) });
        jug = [nx, ny];
        movs++;
        pintar();
        if (resuelto()) {
          s.sonido.arreglo();
          nivel++;
          if (nivel >= NIVELES.length) { fin(); return; }
          setTimeout(cargar, 500);
        }
      };
      const pintar = () => {
        const g = j.cuerpo.querySelector('.fv-sokoban');
        g.style.gridTemplateColumns = `repeat(${mapa[0].length}, 1fr)`;
        g.innerHTML = mapa.map((f, y) => f.map((ch, x) => {
          const esJug = jug[0] === x && jug[1] === y;
          const cls = ch === '#' ? 'muro' : objetivo(x, y) ? 'meta' : 'suelo';
          const dentro = esJug ? '🧑' : ch === '$' ? (objetivo(x, y) ? '✅' : '📦') : '';
          return `<i class="${cls}">${dentro}</i>`;
        }).join('')).join('');
        marcador(j, `Almacén ${Math.min(nivel + 1, NIVELES.length)} de ${NIVELES.length} · ${movs} movimientos`);
      };
      j.cuerpo.innerHTML = '<div class="fv fv-almacen"><div class="fv-marcador"></div><div class="fv-sokoban"></div><div class="fv-sok-botones"><button class="deshacer">↩️ Deshacer</button><button class="reiniciar">🔄 Reiniciar</button></div></div>';
      const cont = j.cuerpo.querySelector('.fv-almacen');
      deslizar(j.cuerpo.querySelector('.fv-sokoban'), mover);
      cruceta(cont, mover);
      cont.querySelector('.deshacer').addEventListener('click', () => {
        const h = historial.pop();
        if (!h) return;
        jug = h.jug;
        mapa = h.mapa;
        pintar();
      });
      cont.querySelector('.reiniciar').addEventListener('click', cargar);
      cargar();
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        pararT();
        const p = Math.min(1, nivel / NIVELES.length);
        j.final(nivel >= NIVELES.length ? `¡Almacén ordenado en ${movs} movimientos!` : `Ordenados ${nivel} de ${NIVELES.length} almacenes`, p);
      };
      const pararT = cronometro(j, 110, fin);
    }
  },

  cometa: {
    icono: '🪁',
    jugar(j, s) {
      j.info('Toca para que la cometa suba. Pásala por los huecos entre los árboles y los cables');
      j.cuerpo.innerHTML = '<div class="fv fv-cometa"><div class="fv-marcador">🪁 0 · ❤️❤️❤️</div></div>';
      const cont = j.cuerpo.querySelector('.fv-cometa');
      const { c, ctx, w, h } = lienzo(cont, 1.3, 0.6);
      let y = h / 2;
      let vy = 0;
      let vidas = 3;
      let puntos = 0;
      let inmune = 1;
      const tubos = [];
      let sig = 0.8;
      let t = 0;
      const x = w * 0.28;
      let empezado = false;
      c.addEventListener('pointerdown', e => {
        e.preventDefault();
        empezado = true;
        vy = -330;
        s.sonido.tono(700, 0, 0.06, { hasta: 900, volumen: 0.03 });
      });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        j.final(vidas > 0 ? `¡${puntos} huecos! La cometa sigue volando` : `Se enredó en un árbol… ${puntos} huecos`, Math.min(1, puntos / 16) * (vidas > 0 ? 1 : 0.85));
      };
      const parar = bucle(j, dt => {
        if (!empezado) dt = 0;
        t += dt;
        vy += 900 * dt;
        y += vy * dt;
        inmune = Math.max(0, inmune - dt);
        sig -= dt;
        const hueco = Math.max(120, 190 - t * 2.2);
        if (sig <= 0) {
          sig = Math.max(1.05, 1.6 - t * 0.012);
          const centro = 70 + hueco / 2 + Math.random() * (h - 140 - hueco);
          tubos.push({ x: w + 30, centro, hueco, contado: false });
        }
        const v = 150 + t * 2;
        for (const tb of [...tubos]) {
          tb.x -= v * dt;
          if (!tb.contado && tb.x < x - 24) { tb.contado = true; puntos++; s.sonido.pop(); }
          if (tb.x < -60) tubos.splice(tubos.indexOf(tb), 1);
          if (inmune <= 0 && Math.abs(tb.x - x) < 34 && (y < tb.centro - tb.hueco / 2 + 12 || y > tb.centro + tb.hueco / 2 - 12)) {
            vidas--;
            inmune = 1.4;
            s.sonido.error();
            if (vidas <= 0) { fin(); return false; }
          }
        }
        if (y > h - 20 || y < 10) {
          if (inmune <= 0) { vidas--; inmune = 1.4; s.sonido.error(); if (vidas <= 0) { fin(); return false; } }
          y = Math.max(10, Math.min(h - 20, y));
          vy = -150;
        }
        const cielo = ctx.createLinearGradient(0, 0, 0, h);
        cielo.addColorStop(0, '#9fd3f0');
        cielo.addColorStop(1, '#dff1fb');
        ctx.fillStyle = cielo;
        ctx.fillRect(0, 0, w, h);
        emoji(ctx, '☁️', (w + 80 - (t * 20) % (w + 160)), 60, 40);
        emoji(ctx, '☁️', (w + 80 - (t * 12 + 200) % (w + 160)), 140, 30);
        for (const tb of tubos) {
          const arriba = tb.centro - tb.hueco / 2;
          const abajo = tb.centro + tb.hueco / 2;
          ctx.fillStyle = '#6b5440';
          ctx.fillRect(tb.x - 6, abajo, 12, h - abajo);
          ctx.fillStyle = '#5a9e4b';
          ctx.beginPath(); ctx.ellipse(tb.x, abajo + 26, 34, 32, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#4a8a3c';
          for (let yy = abajo + 50; yy < h; yy += 44) { ctx.beginPath(); ctx.ellipse(tb.x, yy + 20, 30, 26, 0, 0, 7); ctx.fill(); }
          ctx.fillStyle = '#7d7d7d';
          ctx.fillRect(tb.x - 5, 0, 10, arriba);
          ctx.strokeStyle = '#3b2f26';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(tb.x - 40, arriba - 8); ctx.quadraticCurveTo(tb.x, arriba + 6, tb.x + 40, arriba - 8); ctx.stroke();
          emoji(ctx, '🐦', tb.x + 18, arriba - 14, 18);
        }
        ctx.fillStyle = '#7cb35a';
        ctx.fillRect(0, h - 12, w, 12);
        ctx.strokeStyle = 'rgba(59,47,38,.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x - 30, h * 0.8, x - 70, h); ctx.stroke();
        if (!(inmune > 0 && Math.floor(inmune * 10) % 2)) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.max(-0.5, Math.min(0.6, vy / 700)));
          emoji(ctx, '🪁', 0, 0, 38);
          ctx.restore();
        }
        if (!empezado) {
          rect(ctx, w / 2 - 110, h / 2 - 70, 220, 40, 14, 'rgba(255,250,244,.92)');
          ctx.fillStyle = '#3b2f26';
          ctx.font = '800 15px Nunito, system-ui, sans-serif';
          ctx.fillText(idioma() === 'en' ? 'Tap to start' : 'Toca para empezar', w / 2, h / 2 - 50);
        }
        marcador(j, `🪁 ${puntos} · ${'❤️'.repeat(Math.max(0, vidas))}${'🤍'.repeat(3 - Math.max(0, vidas))}`);
      });
      const pararT = cronometro(j, 45, fin);
    }
  },

  diferencias: {
    icono: '🔎',
    jugar(j, s) {
      const COSAS = ['🛋️', '🪴', '🖼️', '🕰️', '📚', '🧸', '☕', '🕯️', '🧶', '🎀', '📻', '🍎', '🐱', '💡', '🧦', '🪑', '🌷', '📷', '🎈', '🍪'];
      const CAMBIO = { '🛋️': '🪑', '🪴': '🌵', '🖼️': '🪞', '🕰️': '⏰', '📚': '📕', '🧸': '🐻', '☕': '🍵', '🕯️': '💡', '🧶': '🧵', '🎀': '🎗️', '📻': '📺', '🍎': '🍏', '🐱': '🐈', '💡': '🔦', '🧦': '🧤', '🪑': '🛋️', '🌷': '🌹', '📷': '📸', '🎈': '🪁', '🍪': '🍩' };
      const C = 5;
      const F = 4;
      let ronda = 0;
      let encontradas = 0;
      let fallos = 0;
      j.info('Toca en el dibujo de abajo las 5 cosas que han cambiado');
      const nueva = () => {
        const base = Array.from({ length: C * F }, () => elegir(COSAS));
        const giros = Array.from({ length: C * F }, () => azar(3) - 1);
        const difs = new Set();
        while (difs.size < 5) difs.add(azar(C * F));
        const abajo = base.map((e, i) => (difs.has(i) ? CAMBIO[e] || '❓' : e));
        const vistas = new Set();
        const tarjeta = (lista, clic) => `<div class="fv-dif ${clic ? 'clic' : ''}" style="grid-template-columns:repeat(${C},1fr)">${lista.map((e, i) => `<button data-i="${i}" style="transform:rotate(${giros[i] * 8}deg)">${e}</button>`).join('')}</div>`;
        j.cuerpo.innerHTML = `<div class="fv fv-diferencias"><div class="fv-marcador">Lámina ${ronda + 1} de 2 · 🔎 0/5</div>${tarjeta(base, false)}${tarjeta(abajo, true)}</div>`;
        j.cuerpo.querySelectorAll('.fv-dif.clic button').forEach(b => b.addEventListener('click', () => {
          const i = Number(b.dataset.i);
          if (vistas.has(i)) return;
          if (difs.has(i)) {
            vistas.add(i);
            encontradas++;
            b.classList.add('ok');
            j.cuerpo.querySelectorAll('.fv-dif')[0].children[i].classList.add('ok');
            s.sonido.arreglo();
            marcador(j, `Lámina ${ronda + 1} de 2 · 🔎 ${vistas.size}/5`);
            if (vistas.size === 5) {
              ronda++;
              if (ronda >= 2) { fin(); return; }
              setTimeout(nueva, 600);
            }
          } else {
            fallos++;
            b.classList.add('mal');
            s.sonido.error();
            setTimeout(() => b.classList.remove('mal'), 400);
          }
        }));
      };
      nueva();
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        pararT();
        const p = Math.max(0, encontradas / 10 - fallos * 0.05);
        j.final(encontradas >= 10 ? (fallos ? `¡Todas! Con ${fallos} despistes` : '¡Ojo de lince!') : `${encontradas} de 10 diferencias`, p);
      };
      const pararT = cronometro(j, 70, fin);
    }
  }
};
