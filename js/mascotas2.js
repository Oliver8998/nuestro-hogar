import { paga } from './balance.js';
import { ESPECIES } from './mascotas.js';
import { CATALOGO } from './catalogo.js';
import { INGREDIENTES } from './casa2.js';

export const TRUCOS = [
  { id: 'sentarse', nombre: 'Sentarse', icono: '🪑' },
  { id: 'pata', nombre: 'Dar la pata', icono: '🐾' },
  { id: 'girar', nombre: 'Dar vueltas', icono: '🌀' },
  { id: 'saltar', nombre: 'Saltar', icono: '⬆️' },
  { id: 'rodar', nombre: 'Rodar', icono: '🔄' },
  { id: 'muerto', nombre: 'Hacerse el muerto', icono: '😵' }
];

const RIVALES = [
  ['Canela', '🐶'], ['Bigotes', '🐱'], ['Pelusa', '🐰'], ['Toby', '🐕'], ['Luna', '🐈'], ['Copito', '🐹'],
  ['Rocky', '🐕‍🦺'], ['Nala', '🦊'], ['Cuac', '🦆'], ['Lola', '🐩'], ['Simba', '🐈‍⬛'], ['Chispa', '🐿️']
];

const EMOJI = { hamster: '🐹', conejo: '🐰', pato: '🦆', gato: '🐱', perro: '🐶', pinguino: '🐧', cobaya: '🐹', tortuga: '🐢', loro: '🦜', dragon: '🐲', zorro: '🦊' };
const PREMIOS = [150, 80, 40];
const DIA = 86400000;

function semana() {
  const d = new Date();
  const ini = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-${Math.ceil(((d - ini) / DIA + ini.getDay() + 1) / 7)}`;
}

function semilla(texto) {
  let x = 0;
  for (const c of texto) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return () => {
    x = (x * 1103515245 + 12345) >>> 0;
    return (x % 10000) / 10000;
  };
}

export class Mascotas2 {
  constructor(ctx) {
    this.ctx = ctx;
  }

  get estado() {
    return this.ctx.estado;
  }

  emoji(m) {
    return EMOJI[m.especie] || '🐾';
  }

  aprendidos(m) {
    return TRUCOS.filter(t => (m.trucos[t.id] || 0) >= 3);
  }

  concursos() {
    const s = semana();
    if (!this.estado.concursos || this.estado.concursos.semana !== s) this.estado.concursos = { semana: s, hechos: {} };
    return this.estado.concursos;
  }

  abrir(m) {
    const { ui } = this.ctx;
    const c = this.concursos();
    const aprendidos = this.aprendidos(m);
    const puedePasear = ESPECIES[m.especie].perro || m.especie === 'zorro';
    const pareja = this.ctx.mascotas.lista.filter(o => o !== m && o.especie === m.especie);
    const trofeos = (this.estado.trofeos || []).filter(t => t.id === m.id);
    const cuerpo = ui.abrirGen(`${this.emoji(m)} ${m.nombre}`, `
      ${trofeos.length ? `<div class="trofeos">${trofeos.map(t => `<span title="${t.texto}">${t.icono}</span>`).join('')}</div>` : ''}
      <h4 class="gen-sub">🎓 Trucos</h4>
      <div class="trucos">${TRUCOS.map(t => {
        const n = Math.min(3, m.trucos[t.id] || 0);
        return `<button class="truco ${n >= 3 ? 'sabe' : ''}" data-truco="${t.id}"><span>${t.icono}</span><b>${t.nombre}</b><small>${n >= 3 ? '¡Lo sabe! Tocad para verlo' : `Entrenar · ${'●'.repeat(n)}${'○'.repeat(3 - n)}`}</small></button>`;
      }).join('')}</div>
      <h4 class="gen-sub">🏆 Concursos de la semana</h4>
      <div class="concursos">
        <button data-concurso="belleza" ${c.hechos[`${m.id}-belleza`] ? 'disabled' : ''}><span>🎀</span><div><b>Concurso de belleza</b><small>${c.hechos[`${m.id}-belleza`] ? `Quedó ${c.hechos[`${m.id}-belleza`]}º esta semana` : 'Cuenta su humor, su ropa y sus trucos'}</small></div></button>
        <button data-concurso="carrera" ${c.hechos[`${m.id}-carrera`] ? 'disabled' : ''}><span>🏁</span><div><b>Carrera</b><small>${c.hechos[`${m.id}-carrera`] ? `Quedó ${c.hechos[`${m.id}-carrera`]}º esta semana` : '¡Tocad rápido para que corra!'}</small></div></button>
      </div>
      ${puedePasear ? `<h4 class="gen-sub">🦮 Paseo</h4><button class="fila-accion" data-paseo><span>🌳</span><div><b>Sacar a pasear</b><small>Salta charcos y encuentra cosas por el parque</small></div></button>` : ''}
      <h4 class="gen-sub">💞 Familia</h4>
      <button class="fila-accion" data-crias><span>🥚</span><div><b>Tener crías</b><small>${pareja.length ? `Con ${pareja.map(o => o.nombre).join(' o ')}` : `Hace falta otro ${ESPECIES[m.especie].nombre.toLowerCase()} en casa`}</small></div></button>`, () => this.ctx.cerrar());
    cuerpo.querySelectorAll('[data-truco]').forEach(b => b.addEventListener('click', () => {
      const t = TRUCOS.find(x => x.id === b.dataset.truco);
      if ((m.trucos[t.id] || 0) >= 3) {
        ui.cerrarHojas();
        this.ctx.mascotas.truco(m, t.id);
        this.ctx.sonido.mascota();
        this.ctx.registrar('truco');
      } else this.entrenar(m, t);
    }));
    cuerpo.querySelectorAll('[data-concurso]').forEach(b => b.addEventListener('click', () => (b.dataset.concurso === 'belleza' ? this.belleza(m) : this.carrera(m))));
    const p = cuerpo.querySelector('[data-paseo]');
    if (p) p.addEventListener('click', () => this.pasear(m));
    cuerpo.querySelector('[data-crias]').addEventListener('click', () => this.crias(m, pareja));
    void aprendidos;
  }

  async entrenar(m, t) {
    const { ui, juegos, sonido } = this.ctx;
    if (m.energia < 15) {
      ui.aviso(`${m.nombre} está muy cansado para entrenar`, true);
      return;
    }
    ui.cerrarHojas();
    const puntos = await juegos.custom(t.icono, `Entrenar: ${t.nombre}`, j => {
      j.info(`Toca cuando el aro coincida con el círculo. ¡${m.nombre} está atento!`);
      j.cuerpo.innerHTML = `<div class="entreno"><div class="diana"><div class="objetivo"></div><div class="aro"></div><span>${this.emoji(m)}</span></div><small class="rondas">Intento 1 de 5 · aciertos 0</small><button class="primario grande">¡Ahora!</button></div>`;
      const aro = j.cuerpo.querySelector('.aro');
      const cara = j.cuerpo.querySelector('.diana span');
      let r = 1;
      let vel = 0.75;
      let intento = 0;
      let bien = 0;
      let vivo = true;
      let ultimo = performance.now();
      const bucle = ts => {
        if (!vivo) return;
        const dt = (ts - ultimo) / 1000;
        ultimo = ts;
        r -= vel * dt;
        if (r < 0.05) r = 1;
        aro.style.transform = `translate(-50%,-50%) scale(${r})`;
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
      j.alTerminar = () => { vivo = false; };
      j.cuerpo.querySelector('button').addEventListener('click', () => {
        if (!vivo) return;
        const ok = Math.abs(r - 0.45) < 0.08;
        if (ok) bien++;
        sonido[ok ? 'mascota' : 'error']();
        cara.textContent = ok ? '😻' : '🙈';
        setTimeout(() => { cara.textContent = this.emoji(m); }, 450);
        intento++;
        r = 1;
        vel *= 1.12;
        j.cuerpo.querySelector('.rondas').textContent = `Intento ${Math.min(5, intento + 1)} de 5 · aciertos ${bien}`;
        if (intento >= 5) {
          vivo = false;
          j.final(bien >= 3 ? '¡Buena sesión de entreno!' : 'Le ha costado un poco… otra vez', bien / 5);
        }
      });
    });
    if (puntos === null || puntos === undefined) return;
    m.energia = Math.max(0, m.energia - 15);
    m.felicidad = Math.min(100, m.felicidad + 6);
    if (puntos >= 0.6) {
      m.trucos[t.id] = Math.min(3, (m.trucos[t.id] || 0) + 1);
      if (m.trucos[t.id] >= 3) {
        ui.aviso(`🎓 ¡${m.nombre} ha aprendido a ${t.nombre.toLowerCase()}!`);
        this.ctx.recordar(null, '🎓', `${m.nombre} aprendió a ${t.nombre.toLowerCase()}`);
        this.ctx.mascotas.truco(m, t.id);
        this.ctx.registrar('aprender-truco');
      } else ui.aviso(`🎓 ${m.nombre} va aprendiendo (${m.trucos[t.id]}/3)`);
    } else ui.aviso(`${m.nombre} se ha distraído. ¡Probad otra vez!`);
    this.ctx.ganar(Math.round(5 + puntos * 10), null, '🎓');
    this.ctx.guardar();
  }

  rivales(tipo) {
    const r = semilla(`${semana()}-${tipo}`);
    const lista = [];
    const usados = new Set();
    while (lista.length < 4) {
      const k = Math.floor(r() * RIVALES.length);
      if (usados.has(k)) continue;
      usados.add(k);
      lista.push({ nombre: RIVALES[k][0], emoji: RIVALES[k][1], puntos: Math.round(48 + r() * 46), velocidad: 9 + r() * 5 });
    }
    return lista;
  }

  premiar(m, tipo, puesto) {
    const { ui } = this.ctx;
    const c = this.concursos();
    c.hechos[`${m.id}-${tipo}`] = puesto;
    const premio = paga(PREMIOS[puesto - 1] || 15);
    if (puesto <= 3) {
      if (!this.estado.trofeos) this.estado.trofeos = [];
      const icono = puesto === 1 ? '🥇' : puesto === 2 ? '🥈' : '🥉';
      this.estado.trofeos.push({ id: m.id, icono, texto: `${tipo === 'belleza' ? 'Belleza' : 'Carrera'} · semana ${c.semana}`, fecha: Date.now() });
      if (puesto === 1) this.ctx.recordar(null, '🏆', `${m.nombre} ganó el concurso de ${tipo === 'belleza' ? 'belleza' : 'carreras'}`);
    }
    this.ctx.registrar(puesto === 1 ? 'concurso-ganado' : 'concurso');
    this.estado.monedas += premio;
    this.ctx.sonido.premio();
    this.ctx.refrescarHud();
    this.ctx.guardar();
    ui.aviso(`${puesto === 1 ? '🥇' : puesto === 2 ? '🥈' : puesto === 3 ? '🥉' : '🎗️'} ${puesto}º puesto · +${premio} monedas`);
  }

  belleza(m) {
    const { ui } = this.ctx;
    const mios = Math.round(Math.min(100,
      m.felicidad * 0.35 + (100 - Math.abs(70 - m.hambre)) * 0.1 + (m.accesorio ? 22 : 0) + this.aprendidos(m).length * 5 + m.crecimiento() * 15 + Math.random() * 12));
    const lista = [...this.rivales('belleza'), { nombre: m.nombre, emoji: this.emoji(m), puntos: mios, yo: true }].sort((a, b) => b.puntos - a.puntos);
    const puesto = lista.findIndex(x => x.yo) + 1;
    ui.abrirGen('🎀 Concurso de belleza', `
      <p class="gen-intro">El jurado ha mirado el pelo, la ropa, el buen humor y los trucos…</p>
      <div class="podio">${lista.map((x, i) => `<div class="fila-podio ${x.yo ? 'yo' : ''}" style="animation-delay:${(lista.length - i) * 0.35}s"><em>${i + 1}º</em><span>${x.emoji}</span><b>${x.nombre}</b><i>${x.puntos} pts</i></div>`).join('')}</div>
      <p class="gen-intro">${puesto === 1 ? `¡${m.nombre} es la mascota más bonita de la semana! 🏆` : m.accesorio ? '¡Casi! Más mimos y algún truco ayudan.' : 'Consejo: ponedle algo de ropa y que esté contenta.'}</p>`, () => this.abrir(m));
    this.premiar(m, 'belleza', puesto);
  }

  async carrera(m) {
    const { ui, juegos, sonido } = this.ctx;
    if (m.energia < 20) {
      ui.aviso(`${m.nombre} está muy cansado para correr`, true);
      return;
    }
    ui.cerrarHojas();
    const rivales = this.rivales('carrera').slice(0, 3);
    let puestoFinal = 4;
    const res = await juegos.custom('🏁', 'Carrera de mascotas', j => {
      j.info('¡Alternad los dos botones lo más rápido posible!');
      const corredores = [{ nombre: m.nombre, emoji: this.emoji(m), yo: true, x: 0 }, ...rivales.map(r => ({ ...r, x: 0 }))];
      j.cuerpo.innerHTML = `<div class="carrera"><div class="pista">${corredores.map((c, i) => `<div class="calle ${c.yo ? 'yo' : ''}"><small>${c.nombre}</small><span data-i="${i}">${c.emoji}</span><i>🏁</i></div>`).join('')}</div><div class="cuenta">3</div><div class="pedales"><button data-l="0">👈</button><button data-l="1">👉</button></div></div>`;
      const els = [...j.cuerpo.querySelectorAll('.calle span')];
      const cuenta = j.cuerpo.querySelector('.cuenta');
      let ultimoLado = -1;
      let empezado = false;
      let vivo = true;
      let llegados = [];
      const bonus = 0.8 + m.felicidad / 400 + m.energia / 500;
      let n = 3;
      const tCuenta = setInterval(() => {
        n--;
        if (n > 0) {
          cuenta.textContent = n;
          sonido.tic();
        } else {
          cuenta.textContent = '¡Ya!';
          sonido.claxon();
          empezado = true;
          clearInterval(tCuenta);
          setTimeout(() => cuenta.remove(), 600);
        }
      }, 700);
      j.cuerpo.querySelectorAll('.pedales button').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (!empezado || !vivo) return;
        const lado = Number(b.dataset.l);
        if (lado === ultimoLado) return;
        ultimoLado = lado;
        corredores[0].x += 2.1 * bonus;
        b.classList.add('pulsado');
        setTimeout(() => b.classList.remove('pulsado'), 90);
      }));
      let ultimo = performance.now();
      const bucle = ts => {
        if (!vivo) return;
        const dt = Math.min(0.05, (ts - ultimo) / 1000);
        ultimo = ts;
        if (empezado) {
          corredores.forEach((c, i) => {
            if (!c.yo) c.x += c.velocidad * dt * (0.85 + Math.random() * 0.3);
            if (c.x >= 100 && !llegados.includes(i)) llegados.push(i);
            els[i].style.left = `${Math.min(100, c.x) * 0.86}%`;
          });
          if (llegados.includes(0) || llegados.length >= 3) {
            vivo = false;
            const orden = [...llegados, ...corredores.map((_, i) => i).filter(i => !llegados.includes(i)).sort((a, b) => corredores[b].x - corredores[a].x)];
            puestoFinal = orden.indexOf(0) + 1;
            setTimeout(() => j.final(puestoFinal === 1 ? `¡${m.nombre} ha ganado la carrera!` : `${m.nombre} ha llegado ${puestoFinal}º`, (5 - puestoFinal) / 4), 500);
            return;
          }
        }
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
      j.alTerminar = () => { vivo = false; clearInterval(tCuenta); };
    });
    if (res === null || res === undefined) return;
    m.energia = Math.max(0, m.energia - 20);
    m.felicidad = Math.min(100, m.felicidad + 10);
    this.premiar(m, 'carrera', puestoFinal);
  }

  async pasear(m) {
    const { ui, juegos, sonido } = this.ctx;
    if (m.energia < 25) {
      ui.aviso(`${m.nombre} está muy cansado. Mejor mañana`, true);
      return;
    }
    ui.cerrarHojas();
    const botin = { monedas: 0, ing: {}, raro: null };
    const res = await juegos.custom('🌳', `Paseo con ${m.nombre}`, j => {
      j.info('Toca para saltar charcos y piedras. ¡Coge todo lo que veas!');
      j.cuerpo.innerHTML = `<div class="paseo"><canvas width="360" height="230"></canvas><div class="botin"></div></div>`;
      const cv = j.cuerpo.querySelector('canvas');
      const g = cv.getContext('2d');
      const botinEl = j.cuerpo.querySelector('.botin');
      const SUELO = 180;
      const perro = { y: 0, vy: 0, golpe: 0 };
      const cosas = [];
      let t = 0;
      let tSig = 1;
      let vivo = true;
      let duracion = 30;
      let choques = 0;
      let cogidos = 0;
      const saltar = e => {
        e.preventDefault();
        if (perro.y === 0 && vivo) {
          perro.vy = 520;
          sonido.pop();
        }
      };
      cv.addEventListener('pointerdown', saltar);
      const pintarBotin = () => {
        botinEl.textContent = `🪙 ${botin.monedas}  ${Object.entries(botin.ing).map(([k, n]) => `${INGREDIENTES[k].icono}${n}`).join(' ')} ${botin.raro ? '💎' : ''}`;
      };
      pintarBotin();
      const TIPOS = [
        { e: '💧', malo: true, alto: false, p: 0.22 },
        { e: '🪨', malo: true, alto: false, p: 0.18 },
        { e: '🦴', monedas: 5, alto: false, p: 0.16 },
        { e: '🪙', monedas: 10, alto: true, p: 0.16 },
        { e: '🍄', ing: 'seta', alto: false, p: 0.11 },
        { e: '🫐', ing: 'mora', alto: true, p: 0.11 },
        { e: '💎', raro: true, alto: true, p: 0.02 },
        { e: '🎾', monedas: 15, alto: true, p: 0.04 }
      ];
      const elegir = () => {
        let x = Math.random();
        for (const tp of TIPOS) {
          if ((x -= tp.p) <= 0) return tp;
        }
        return TIPOS[0];
      };
      let ultimo = performance.now();
      const bucle = ts => {
        if (!vivo) return;
        const dt = Math.min(0.05, (ts - ultimo) / 1000);
        ultimo = ts;
        t += dt;
        j.tiempo(1 - t / duracion);
        const vel = 150 + t * 3;
        tSig -= dt;
        if (tSig <= 0) {
          const tp = elegir();
          cosas.push({ ...tp, x: 380, y: tp.alto ? SUELO - 85 : SUELO - 8 });
          tSig = 0.55 + Math.random() * 0.75;
        }
        perro.vy -= 1500 * dt;
        perro.y = Math.max(0, perro.y + perro.vy * dt);
        if (perro.y === 0) perro.vy = 0;
        perro.golpe = Math.max(0, perro.golpe - dt);
        g.clearRect(0, 0, 360, 230);
        const cielo = g.createLinearGradient(0, 0, 0, 230);
        cielo.addColorStop(0, '#bfe3f5');
        cielo.addColorStop(1, '#eaf6e0');
        g.fillStyle = cielo;
        g.fillRect(0, 0, 360, 230);
        g.font = '34px serif';
        for (let k = 0; k < 4; k++) {
          const x = ((k * 120 - t * 30) % 480 + 480) % 480 - 60;
          g.fillText('🌳', x, SUELO - 12);
        }
        g.fillStyle = '#8fc46a';
        g.fillRect(0, SUELO, 360, 50);
        g.fillStyle = '#d9c39a';
        g.fillRect(0, SUELO + 8, 360, 16);
        g.font = '28px serif';
        g.textAlign = 'center';
        for (const c of [...cosas]) {
          c.x -= vel * dt;
          if (c.x < -30) {
            cosas.splice(cosas.indexOf(c), 1);
            continue;
          }
          const py = SUELO - 10 - perro.y;
          const cerca = Math.abs(c.x - 70) < 26 && Math.abs(c.y - py) < 34;
          if (cerca) {
            cosas.splice(cosas.indexOf(c), 1);
            if (c.malo) {
              if (!perro.golpe) {
                choques++;
                perro.golpe = 0.8;
                sonido.error();
              }
            } else {
              cogidos++;
              if (c.monedas) botin.monedas += c.monedas;
              if (c.ing) botin.ing[c.ing] = (botin.ing[c.ing] || 0) + 1;
              if (c.raro) botin.raro = true;
              sonido.tic();
              pintarBotin();
            }
            continue;
          }
          g.fillText(c.e, c.x, c.y);
        }
        g.save();
        g.translate(70, SUELO - 6 - perro.y);
        g.scale(-1, 1);
        if (perro.golpe && Math.floor(perro.golpe * 10) % 2) g.globalAlpha = 0.4;
        g.font = '40px serif';
        g.fillText(this.emoji(m) === '🦊' ? '🦊' : '🐕', 0, 0);
        g.restore();
        if (t >= duracion) {
          vivo = false;
          const punt = Math.max(0, Math.min(1, cogidos / 14 - choques * 0.06));
          j.final(`¡Qué buen paseo! ${cogidos} cosas encontradas`, punt);
          return;
        }
        requestAnimationFrame(bucle);
      };
      requestAnimationFrame(bucle);
      j.alTerminar = () => { vivo = false; };
    });
    if (res === null || res === undefined) return;
    m.energia = Math.max(0, m.energia - 25);
    m.felicidad = Math.min(100, m.felicidad + 25);
    m.hambre = Math.max(0, m.hambre - 10);
    if (!this.estado.despensa) this.estado.despensa = {};
    for (const [k, n] of Object.entries(botin.ing)) this.estado.despensa[k] = (this.estado.despensa[k] || 0) + n;
    if (botin.raro) {
      const raros = CATALOGO.filter(d => d.rareza === 'raro' && !d.mascota);
      const it = raros[Math.floor(Math.random() * raros.length)];
      this.ctx.inventario.anadir(it.id, it.colores ? 0 : null);
      this.ctx.ui.pintarInventario(this.ctx.inventario);
      ui.aviso(`💎 ¡${m.nombre} ha encontrado ${it.nombre.toLowerCase()}! Está en el inventario`);
    }
    this.ctx.registrar('pasear');
    this.ctx.ganar(botin.monedas + 10, null, '🦴');
    this.ctx.guardar();
  }

  crias(m, posibles) {
    const { ui } = this.ctx;
    const e = ESPECIES[m.especie];
    const esperando = (this.estado.crias || []).find(c => c.especie === m.especie);
    if (esperando) {
      ui.aviso(`🥚 Ya hay una cría de ${e.nombre.toLowerCase()} en camino`);
      return;
    }
    if (!posibles.length) {
      ui.aviso(`Hace falta otro ${e.nombre.toLowerCase()} en casa`, true);
      return;
    }
    const listos = posibles.filter(o => o.edadDias() >= 4 && o.felicidad >= 70 && Date.now() - (o.ultimaCria || 0) > 7 * DIA);
    const problemas = [];
    if (m.edadDias() < 4) problemas.push(`${m.nombre} todavía es un bebé`);
    if (m.felicidad < 70) problemas.push(`${m.nombre} tiene que estar más contento`);
    if (Date.now() - (m.ultimaCria || 0) < 7 * DIA) problemas.push(`${m.nombre} tuvo crías hace poco`);
    if (!listos.length) problemas.push(`${posibles.map(o => o.nombre).join(' y ')} ${posibles.length > 1 ? 'tienen' : 'tiene'} que ser mayor y estar contento`);
    if (problemas.length) {
      ui.dialogo({ titulo: '💞 Todavía no', texto: `${problemas.join('. ')}. Hace falta que los dos sean adultos (4 días) y estén contentos.`, botones: [{ texto: 'Vale', tipo: 'primario' }] });
      return;
    }
    ui.dialogo({
      titulo: '💞 ¿Formar una familia?',
      texto: `Si se llevan bien, en 24 horas tendréis una cría de ${e.nombre.toLowerCase()}.`,
      botones: [...listos.map(o => ({
        texto: `${m.nombre} + ${o.nombre}`, tipo: 'primario', accion: () => {
          if (!this.estado.crias) this.estado.crias = [];
          this.estado.crias.push({ especie: m.especie, padres: [m.nombre, o.nombre], listo: Date.now() + DIA });
          m.ultimaCria = Date.now();
          o.ultimaCria = Date.now();
          this.ctx.mascotas.eventos.particula('💞', m, 5);
          this.ctx.mascotas.eventos.particula('💞', o, 5);
          this.ctx.sonido.premio();
          ui.cerrarHojas();
          ui.aviso('🥚 ¡Viene una cría en camino! Mañana nace');
          this.ctx.guardar();
          this.ctx.chip();
        }
      })), { texto: 'Ahora no', tipo: 'secundario' }],
      columna: true
    });
  }

  chips() {
    const lista = [];
    for (const c of this.estado.crias || []) {
      const listo = Date.now() >= c.listo;
      const h = Math.max(1, Math.ceil((c.listo - Date.now()) / 3600000));
      lista.push({ id: `cria-${c.especie}`, texto: listo ? '🐣 ¡Ha nacido!' : `🥚 ${h} h`, accion: () => (listo ? this.nacer(c) : this.ctx.ui.aviso(`🥚 La cría de ${c.padres.join(' y ')} nacerá en ${h} h`)) });
    }
    return lista;
  }

  async nacer(c) {
    const ok = await this.ctx.adoptar(c.especie, true);
    if (!ok) return;
    this.estado.crias = (this.estado.crias || []).filter(x => x !== c);
    const bebe = this.ctx.mascotas.lista[this.ctx.mascotas.lista.length - 1];
    if (bebe) this.ctx.recordar(null, '🐣', `Nació ${bebe.nombre}, hijo de ${c.padres.join(' y ')}`);
    this.ctx.registrar('cria');
    this.ctx.guardar();
    this.ctx.chip();
  }
}
