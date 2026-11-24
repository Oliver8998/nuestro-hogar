import { paga } from './balance.js';

const limitar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function aleatorio(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(a, r) {
  for (let i = a.length - 1; i > 0; i--) {
    const k = Math.floor(r() * (i + 1));
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}

const PALABRAS = ['casa', 'gato', 'sol', 'árbol', 'coche', 'pizza', 'corazón', 'flor', 'perro', 'luna', 'pez', 'barco', 'helado', 'taza', 'gafas', 'reloj', 'nube', 'montaña', 'playa', 'cama', 'sofá', 'guitarra', 'globo', 'tarta', 'llave', 'zapato', 'camiseta', 'pájaro', 'manzana', 'plátano', 'bicicleta', 'avión', 'estrella', 'fantasma', 'robot', 'cohete', 'paraguas', 'regalo', 'serpiente', 'caracol', 'castillo', 'piña', 'oso', 'tortuga', 'lámpara', 'escalera', 'mariposa', 'cerdo'];

const INGREDIENTES = [
  ['pan', '🍞'], ['carne', '🥩'], ['queso', '🧀'], ['lechuga', '🥬'],
  ['tomate', '🍅'], ['huevo', '🥚'], ['bacon', '🥓'], ['cebolla', '🧅']
];
const ICONO_ING = Object.fromEntries(INGREDIENTES);

export const JUEGOS_DUO = {
  dibujo: { icono: '✏️', nombre: 'Adivina el dibujo', texto: 'Uno dibuja y el otro adivina. 4 rondas, os turnáis.', duracion: '3 min' },
  cocina: { icono: '🍳', nombre: 'Cocina a dúo', texto: 'Quien invita es el chef y ve las comandas. El pinche tiene los ingredientes. ¡Coordinaos!', duracion: '1 min' },
  sofa: { icono: '🛋️', nombre: 'Subir el sofá', texto: 'Cada uno levanta una punta del sofá. Subidlo por la escalera sin darle a las vigas.', duracion: '45 s' }
};

export class Duo {
  constructor(ctx) {
    this.ctx = ctx;
    this.sesion = null;
    this.invitacion = null;
    this.oyentes = [];
    this.vistas = new Set();
  }

  disponible() {
    const s = this.ctx.sync;
    return s && s.activo;
  }

  nombrePareja() {
    const e = this.ctx.estado;
    const yo = this.ctx.sync.yo;
    return (e.pareja && e.pareja.nombres && e.pareja.nombres[1 - yo]) || 'Tu pareja';
  }

  miNombre() {
    const e = this.ctx.estado;
    const yo = this.ctx.sync.yo;
    return (e.pareja && e.pareja.nombres && e.pareja.nombres[yo]) || 'Tu pareja';
  }

  enviar(t, datos = {}) {
    this.ctx.sync.emitir('duo', { t, s: this.sesion && this.sesion.id, ...datos });
  }

  abrir(volver = null) {
    const { ui } = this.ctx;
    if (!this.disponible()) {
      ui.dialogo({ titulo: '🎮 Jugar juntos', texto: 'Para jugar a dúo tenéis que conectar vuestras casas (Más → Pareja) y estar los dos con el juego abierto.', botones: [{ texto: 'Vale', tipo: 'primario' }] });
      return;
    }
    const cuerpo = ui.abrirGen('🎮 Jugar juntos', `
      <p class="gen-intro">Minijuegos para jugar a la vez, cada uno desde su móvil. ${this.ctx.sync.enDirecto ? '🟢 Conectados en directo' : '🟡 Conectando…'}</p>
      <div class="duo-lista">${Object.entries(JUEGOS_DUO).map(([id, g]) => `
        <button class="duo-juego" data-id="${id}"><span>${g.icono}</span><div><b>${g.nombre}</b><small>${g.texto}</small><em>⏱️ ${g.duracion} · 🪙 hasta ${paga(160)}</em></div></button>`).join('')}</div>
      <small class="nota">Las monedas van a la hucha de la casa, así que son para los dos.</small>`, volver);
    cuerpo.querySelectorAll('.duo-juego').forEach(b => b.addEventListener('click', () => this.invitar(b.dataset.id)));
  }

  invitar(juego) {
    const { ui, sync } = this.ctx;
    if (!sync.enDirecto) sync.conectarDirecto && sync.conectarDirecto();
    const id = Math.random().toString(36).slice(2, 10);
    this.sesion = { id, juego, host: true, estado: 'esperando' };
    const g = JUEGOS_DUO[juego];
    const datos = { t: 'invita', s: id, juego, de: this.miNombre(), cuando: Date.now() };
    sync.emitir('duo', datos);
    if (sync.mandar) sync.mandar('duo', datos);
    if (window.avisarPareja) window.avisarPareja('duo', `🎮 ¡Te invita a jugar a ${g.nombre}!`);
    ui.cerrarHojas && ui.cerrarHojas();
    const d = ui.dialogo({
      titulo: `${g.icono} ${g.nombre}`,
      texto: `Esperando a que ${this.nombrePareja()} acepte… Si no tiene el juego abierto, le llegará un aviso.`,
      html: '<div class="duo-espera"><i></i><i></i><i></i></div>',
      botones: [{ texto: 'Cancelar', tipo: 'secundario', accion: () => this.cancelar() }]
    });
    this.dialogoEspera = d;
    clearTimeout(this.tEspera);
    this.tEspera = setTimeout(() => {
      if (this.sesion && this.sesion.id === id && this.sesion.estado === 'esperando') {
        this.cancelar();
        ui.aviso(`${this.nombrePareja()} no ha contestado. ¡Probad cuando estéis los dos!`, true);
      }
    }, 90000);
  }

  cancelar() {
    if (this.sesion && this.sesion.estado === 'esperando') this.enviar('cancela');
    this.sesion = null;
    clearTimeout(this.tEspera);
    if (this.dialogoEspera) this.dialogoEspera.cerrar();
    this.dialogoEspera = null;
  }

  recibir(d) {
    if (!d || !d.t) return;
    const { ui, sonido } = this.ctx;
    if (d.t === 'invita') {
      if (Date.now() - (d.cuando || 0) > 90000 && d.cuando) return;
      if (this.sesion && this.sesion.estado === 'jugando') return;
      if (this.vistas.has(d.s)) return;
      this.vistas.add(d.s);
      this.invitacion = d;
      const g = JUEGOS_DUO[d.juego];
      if (!g) return;
      sonido.premio();
      ui.dialogo({
        titulo: `🎮 ${d.de || this.nombrePareja()} te invita a jugar`,
        texto: `${g.icono} ${g.nombre}: ${g.texto}`,
        botones: [
          { texto: '¡Vamos! 🎮', tipo: 'primario', accion: () => this.aceptar(d) },
          { texto: 'Ahora no', tipo: 'secundario', accion: () => { this.ctx.sync.emitir('duo', { t: 'rechaza', s: d.s }); this.invitacion = null; } }
        ]
      });
      return;
    }
    if (!this.sesion || d.s !== this.sesion.id) {
      if (d.t === 'cancela' && this.invitacion && this.invitacion.s === d.s) {
        this.invitacion = null;
        ui.aviso(`${this.nombrePareja()} ha cancelado la invitación`);
        if (ui.elDialogo && ui.elDialogo.classList.contains('abierto')) ui.elDialogo.classList.remove('abierto');
      }
      return;
    }
    if (d.t === 'acepta' && this.sesion.host && this.sesion.estado === 'esperando') {
      clearTimeout(this.tEspera);
      if (this.dialogoEspera) this.dialogoEspera.cerrar();
      this.dialogoEspera = null;
      const semilla = Math.floor(Math.random() * 1e9);
      this.sesion.semilla = semilla;
      this.enviar('empieza', { juego: this.sesion.juego, semilla });
      this.empezar();
      return;
    }
    if (d.t === 'rechaza' && this.sesion.host) {
      this.cancelar();
      ui.aviso(`${this.nombrePareja()} ahora no puede jugar 😅`);
      return;
    }
    if (d.t === 'empieza' && !this.sesion.host) {
      this.sesion.semilla = d.semilla;
      this.sesion.juego = d.juego;
      this.empezar();
      return;
    }
    if (d.t === 'sale') {
      if (this.sesion.estado === 'jugando' && this.j) {
        this.sesion.estado = 'fin';
        this.j.final(`😢 ${this.nombrePareja()} ha salido de la partida`, 0);
      }
      return;
    }
    if (d.t === 'fin' && !this.sesion.host && this.j) {
      this.sesion.estado = 'fin';
      this.j.final(`${d.texto}<br><small>+${d.monedas} monedas para la casa</small>`, d.p);
      return;
    }
    if (d.t === 'j') for (const f of this.oyentes) f(d);
  }

  aceptar(d) {
    this.sesion = { id: d.s, juego: d.juego, host: false, estado: 'esperando' };
    this.invitacion = null;
    this.ctx.sync.emitir('duo', { t: 'acepta', s: d.s });
    this.ctx.ui.aviso('🎮 ¡Preparados!');
    clearTimeout(this.tEspera);
    this.tEspera = setTimeout(() => {
      if (this.sesion && this.sesion.id === d.s && this.sesion.estado === 'esperando') {
        this.sesion = null;
        this.ctx.ui.aviso('No se ha podido conectar con tu pareja', true);
      }
    }, 15000);
  }

  async empezar() {
    const { juegos, ui } = this.ctx;
    const ses = this.sesion;
    ses.estado = 'jugando';
    clearTimeout(this.tEspera);
    ui.cerrarHojas && ui.cerrarHojas();
    this.oyentes = [];
    const g = JUEGOS_DUO[ses.juego];
    const p = await juegos.custom(g.icono, `${g.nombre} · a dúo`, j => {
      this.j = j;
      const previo = j.alTerminar;
      j.alTerminar = () => {
        if (ses.estado === 'jugando') this.enviar('sale');
        ses.estado = 'fin';
        this.oyentes = [];
        if (previo) previo();
      };
      const api = {
        host: ses.host,
        r: aleatorio(ses.semilla),
        sonido: this.ctx.sonido,
        yo: this.miNombre(),
        otro: this.nombrePareja(),
        mandar: (k, datos = {}) => this.enviar('j', { k, ...datos }),
        escuchar: f => this.oyentes.push(f),
        terminar: (texto, puntos) => {
          if (ses.estado !== 'jugando') return;
          ses.estado = 'fin';
          const monedas = paga(Math.round(40 + 120 * puntos));
          this.enviar('fin', { texto, p: puntos, monedas });
          ses.monedas = monedas;
          j.final(`${texto}<br><small>+${monedas} monedas para la casa</small>`, puntos);
        }
      };
      this.cuentaAtras(j, () => JUEGOS[ses.juego](j, api));
    });
    this.j = null;
    if (ses.host && ses.monedas && p !== null && p !== undefined) {
      this.ctx.estado.monedas += ses.monedas;
      this.ctx.registrar('duo');
      this.ctx.refrescarHud();
      this.ctx.guardar();
    }
    if (this.sesion === ses) this.sesion = null;
  }

  cuentaAtras(j, seguir) {
    let n = 3;
    j.info(`Jugando con ${this.nombrePareja()}`);
    j.cuerpo.innerHTML = '<div class="duo-cuenta"><b>3</b></div>';
    const b = j.cuerpo.querySelector('b');
    const id = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(id);
        seguir();
        return;
      }
      b.textContent = n;
      b.style.animation = 'none';
      void b.offsetWidth;
      b.style.animation = '';
      this.ctx.sonido.tic && this.ctx.sonido.tic();
    }, 800);
  }
}

function cronometro(j, seg, cada, alFin) {
  const ini = performance.now();
  let vivo = true;
  const id = setInterval(() => {
    if (!vivo) return;
    const t = (performance.now() - ini) / 1000;
    j.tiempo(Math.max(0, 1 - t / seg));
    if (cada) cada(t);
    if (t >= seg) {
      vivo = false;
      clearInterval(id);
      alFin && alFin();
    }
  }, 100);
  const previo = j.alTerminar;
  j.alTerminar = () => { vivo = false; clearInterval(id); if (previo) previo(); };
  return () => { vivo = false; clearInterval(id); };
}

const JUEGOS = {
  dibujo(j, api) {
    const RONDAS = 4;
    const SEG = 45;
    const r = api.r;
    const palabras = barajar([...PALABRAS], r);
    const rondas = Array.from({ length: RONDAS }, (_, i) => {
      const palabra = palabras[i];
      const opciones = barajar([palabra, ...palabras.slice(RONDAS + i * 5, RONDAS + i * 5 + 5)], r);
      return { palabra, opciones, dibuja: i % 2 === 0 ? 'host' : 'invitado' };
    });
    let ronda = -1;
    let puntos = 0;
    let aciertos = 0;
    let pararReloj = null;
    let inicioRonda = 0;
    let penal = 0;
    const COLORES = ['#3b2f26', '#e57373', '#5a9fd6', '#6cc08a', '#f2c15b'];
    let color = COLORES[0];
    const yoDibujo = () => (rondas[ronda].dibuja === 'host') === api.host;
    let lienzo = null;
    let g = null;
    let trazo = null;
    let cola = [];
    const linea = (pts, col) => {
      if (!g || pts.length < 1) return;
      const W = lienzo.width;
      const H = lienzo.height;
      g.strokeStyle = col;
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(pts[0][0] * W, pts[0][1] * H);
      for (const [x, y] of pts.slice(1)) g.lineTo(x * W, y * H);
      if (pts.length === 1) g.lineTo(pts[0][0] * W + 0.1, pts[0][1] * H);
      g.stroke();
    };
    const pintar = () => {
      const R = rondas[ronda];
      const dibujo = yoDibujo();
      j.info(dibujo ? `✏️ Dibuja: «${R.palabra.toUpperCase()}» para que ${api.otro} lo adivine. ¡Sin letras!` : `🤔 ${api.otro} está dibujando. ¿Qué es?`);
      j.cuerpo.innerHTML = `<div class="t2 t2-dibujo"><div class="t2-marcador">Ronda ${ronda + 1}/${RONDAS} · ⭐ ${aciertos}</div>
        ${dibujo ? `<div class="di-palabra">${R.palabra}</div>` : ''}
        <canvas class="di-lienzo ${dibujo ? 'mio' : ''}"></canvas>
        ${dibujo ? `<div class="di-colores">${COLORES.map(c => `<button style="--c:${c}" data-c="${c}" class="${c === color ? 'activo' : ''}"></button>`).join('')}<button class="di-borrar">🧽</button></div>`
          : `<div class="di-opciones">${R.opciones.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>`}</div>`;
      lienzo = j.cuerpo.querySelector('.di-lienzo');
      const rect = lienzo.getBoundingClientRect();
      lienzo.width = Math.round(rect.width);
      lienzo.height = Math.round(rect.height);
      g = lienzo.getContext('2d');
      if (dibujo) {
        const punto = e => {
          const b = lienzo.getBoundingClientRect();
          return [+((e.clientX - b.left) / b.width).toFixed(3), +((e.clientY - b.top) / b.height).toFixed(3)];
        };
        lienzo.addEventListener('pointerdown', e => {
          e.preventDefault();
          lienzo.setPointerCapture(e.pointerId);
          trazo = [punto(e)];
          cola.push({ nuevo: true, c: color, p: [trazo[0]] });
          linea(trazo, color);
        });
        lienzo.addEventListener('pointermove', e => {
          if (!trazo) return;
          const p = punto(e);
          linea([trazo[trazo.length - 1], p], color);
          trazo.push(p);
          const ult = cola[cola.length - 1];
          if (ult && !ult.enviado) ult.p.push(p);
          else cola.push({ nuevo: false, c: color, p: [trazo[trazo.length - 2], p] });
        });
        const fin = () => { trazo = null; };
        lienzo.addEventListener('pointerup', fin);
        lienzo.addEventListener('pointercancel', fin);
        j.cuerpo.querySelectorAll('.di-colores [data-c]').forEach(b => b.addEventListener('click', () => {
          color = b.dataset.c;
          j.cuerpo.querySelectorAll('.di-colores [data-c]').forEach(x => x.classList.toggle('activo', x === b));
        }));
        j.cuerpo.querySelector('.di-borrar').addEventListener('click', () => {
          g.clearRect(0, 0, lienzo.width, lienzo.height);
          cola = [];
          api.mandar('borra', { r: ronda });
        });
      } else {
        j.cuerpo.querySelectorAll('.di-opciones button').forEach(b => b.addEventListener('click', () => {
          if (b.disabled) return;
          const i = Number(b.dataset.i);
          if (R.opciones[i] === R.palabra) {
            b.classList.add('bien');
            api.sonido.arreglo();
            api.mandar('acierto', { r: ronda });
            if (api.host) cerrarRonda(true);
          } else {
            b.disabled = true;
            b.classList.add('mal');
            api.sonido.error();
            penal += 4;
            api.mandar('fallo', { r: ronda, i });
          }
        }));
      }
    };
    const enviarTrazos = setInterval(() => {
      if (ronda < 0 || !yoDibujo() || !cola.length) return;
      for (const t of cola) {
        if (t.enviado && t.p.length < 2) continue;
        api.mandar('trazo', { r: ronda, n: t.nuevo && !t.enviado, c: t.c, p: t.p });
        t.enviado = true;
        t.nuevo = false;
        t.p = [t.p[t.p.length - 1]];
      }
      cola = cola.slice(-1);
    }, 90);
    const previo = j.alTerminar;
    j.alTerminar = () => { clearInterval(enviarTrazos); if (pararReloj) pararReloj(); if (previo) previo(); };
    const siguiente = n => {
      if (pararReloj) pararReloj();
      ronda = n;
      penal = 0;
      cola = [];
      inicioRonda = performance.now();
      if (ronda >= RONDAS) {
        clearInterval(enviarTrazos);
        if (api.host) api.terminar(aciertos === RONDAS ? '¡Os leéis la mente! 🧠💕' : aciertos >= 2 ? `¡${aciertos} de ${RONDAS} adivinados!` : 'Más práctica de dibujo… 🎨', limitar(puntos / RONDAS));
        return;
      }
      pintar();
      pararReloj = cronometro(j, SEG, t => {
        if (t + penal >= SEG && api.host) cerrarRonda(false);
      }, null);
    };
    const cerradas = new Set();
    const cerrarRonda = ok => {
      if (!api.host || cerradas.has(ronda)) return;
      cerradas.add(ronda);
      const t = (performance.now() - inicioRonda) / 1000 + penal;
      const pts = ok ? 0.45 + 0.55 * limitar(1 - t / SEG) : 0;
      if (ok) { puntos += pts; aciertos++; }
      api.mandar('ronda', { n: ronda + 1, ok, puntos, aciertos, palabra: rondas[ronda].palabra });
      resultado(ok, rondas[ronda].palabra, () => siguiente(ronda + 1));
    };
    const resultado = (ok, palabra, luego) => {
      if (pararReloj) pararReloj();
      const caja = j.cuerpo.querySelector('.t2-dibujo');
      if (caja) {
        const aviso = document.createElement('div');
        aviso.className = `di-resultado ${ok ? 'bien' : 'mal'}`;
        aviso.innerHTML = ok ? `✅ ¡Era «${palabra}»!` : `⏰ Era «${palabra}»`;
        caja.appendChild(aviso);
      }
      api.sonido[ok ? 'premio' : 'error']();
      setTimeout(luego, 1800);
    };
    api.escuchar(d => {
      if (d.k === 'trazo' && d.r === ronda && !yoDibujo()) linea(d.p, d.c);
      if (d.k === 'borra' && d.r === ronda && g) g.clearRect(0, 0, lienzo.width, lienzo.height);
      if (d.k === 'acierto' && api.host && d.r === ronda) cerrarRonda(true);
      if (d.k === 'fallo' && d.r === ronda && yoDibujo()) {
        penal += 4;
        const R = rondas[ronda];
        const caja = j.cuerpo.querySelector('.t2-dibujo');
        if (caja) {
          const b = document.createElement('div');
          b.className = 'di-fallo';
          b.textContent = `❌ ¿${R.opciones[d.i]}?`;
          caja.appendChild(b);
          setTimeout(() => b.remove(), 1500);
        }
      }
      if (d.k === 'ronda' && !api.host) {
        puntos = d.puntos;
        aciertos = d.aciertos;
        resultado(d.ok, d.palabra, () => siguiente(d.n));
      }
    });
    siguiente(0);
  },

  cocina(j, api) {
    const SEG = 60;
    const r = api.r;
    const NOMBRES = ['Bocata del abuelo', 'Burger doble', 'Tosta loca', 'Sándwich mixto', 'El especial', 'Hamburguesa veggie', 'Mollete', 'Desayuno inglés'];
    const comanda = () => {
      const n = 3 + Math.floor(Math.random() * 3);
      const ing = INGREDIENTES.map(x => x[0]);
      const lista = ['pan'];
      for (let i = 0; i < n - 2; i++) lista.push(ing[1 + Math.floor(Math.random() * (ing.length - 1))]);
      lista.push(Math.random() < 0.7 ? 'pan' : ing[1 + Math.floor(Math.random() * (ing.length - 1))]);
      return { nombre: NOMBRES[Math.floor(Math.random() * NOMBRES.length)], lista };
    };
    let st = { plato: [], servidos: 0, fallos: 0, n: 0 };
    let receta = api.host ? comanda() : null;
    const icono = k => ICONO_ING[k];
    const pintarPlato = () => {
      const el = j.cuerpo.querySelector('.co2-plato');
      if (el) el.innerHTML = st.plato.map((k, i) => `<i style="--k:${i}">${icono(k)}</i>`).join('') || '<small>Plato vacío</small>';
      const m = j.cuerpo.querySelector('.t2-marcador');
      if (m) m.textContent = `🍽️ ${st.servidos} servidos · ❌ ${st.fallos}`;
    };
    const difundir = () => api.mandar('st', st);
    if (api.host) {
      j.info(`👨‍🍳 Eres el chef. Toca los ingredientes de la comanda para decírselos a ${api.otro} y sirve cuando esté bien`);
      const pintarReceta = () => {
        j.cuerpo.querySelector('.co2-comanda').innerHTML = `<b>🧾 ${receta.nombre}</b><div>${receta.lista.map((k, i) => `<button data-k="${k}" class="${st.plato[i] === k ? 'hecho' : ''}">${icono(k)}</button>`).join('<em>›</em>')}</div><small>De abajo (primero) a arriba</small>`;
        j.cuerpo.querySelectorAll('.co2-comanda button').forEach(b => b.addEventListener('click', () => {
          api.mandar('grita', { ing: b.dataset.k });
          api.sonido.pop();
          b.classList.add('grita');
          setTimeout(() => b.classList.remove('grita'), 300);
        }));
      };
      j.cuerpo.innerHTML = `<div class="t2 t2-cocina2"><div class="t2-marcador"></div>
        <div class="co2-comanda"></div>
        <div class="co2-mesa"><div class="co2-plato"></div></div>
        <div class="co2-botones"><button class="co2-tirar">🗑️ Tirar</button><button class="co2-servir primario">🛎️ ¡Servir!</button></div></div>`;
      pintarReceta();
      pintarPlato();
      j.cuerpo.querySelector('.co2-tirar').addEventListener('click', () => {
        st.plato = [];
        api.sonido.error();
        pintarPlato();
        pintarReceta();
        difundir();
      });
      j.cuerpo.querySelector('.co2-servir').addEventListener('click', () => {
        if (!st.plato.length) return;
        const ok = st.plato.length === receta.lista.length && st.plato.every((k, i) => k === receta.lista[i]);
        if (ok) {
          st.servidos++;
          api.sonido.premio();
          j.cuerpo.querySelector('.co2-mesa').classList.add('servido');
          setTimeout(() => { const m = j.cuerpo.querySelector('.co2-mesa'); if (m) m.classList.remove('servido'); }, 400);
        } else {
          st.fallos++;
          api.sonido.error();
          j.cuerpo.querySelector('.co2-mesa').classList.add('mal');
          setTimeout(() => { const m = j.cuerpo.querySelector('.co2-mesa'); if (m) m.classList.remove('mal'); }, 400);
        }
        st.plato = [];
        st.n++;
        receta = comanda();
        st.ok = ok;
        pintarReceta();
        pintarPlato();
        difundir();
        st.ok = undefined;
      });
      api.escuchar(d => {
        if (d.k === 'pon' && st.plato.length < 7) {
          st.plato.push(d.ing);
          api.sonido.tic && api.sonido.tic();
          pintarPlato();
          pintarReceta();
          difundir();
        }
      });
      cronometro(j, SEG, null, () => api.terminar(st.servidos >= 6 ? '¡Cocina de cinco estrellas! ⭐' : `¡${st.servidos} platos servidos!`, limitar((st.servidos - st.fallos * 0.5) / 6)));
    } else {
      j.info(`🧑‍🍳 Eres el pinche. ${api.otro} ve las comandas: escucha lo que te pide y pon los ingredientes en orden`);
      j.cuerpo.innerHTML = `<div class="t2 t2-cocina2"><div class="t2-marcador"></div>
        <div class="co2-grito"></div>
        <div class="co2-mesa"><div class="co2-plato"></div></div>
        <div class="co2-despensa"></div></div>`;
      const pintarDespensa = () => {
        const orden = barajar(INGREDIENTES.slice(), r);
        const el = j.cuerpo.querySelector('.co2-despensa');
        el.innerHTML = orden.map(([k, e]) => `<button data-k="${k}">${e}<small>${k}</small></button>`).join('');
        el.querySelectorAll('button').forEach(b => b.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          api.mandar('pon', { ing: b.dataset.k });
          b.classList.add('pulsa');
          setTimeout(() => b.classList.remove('pulsa'), 200);
        }));
      };
      pintarDespensa();
      pintarPlato();
      let n = 0;
      api.escuchar(d => {
        if (d.k === 'st') {
          const cambio = d.n !== n;
          st = d;
          if (cambio) {
            n = d.n;
            api.sonido[d.ok ? 'premio' : 'error']();
            const m = j.cuerpo.querySelector('.co2-mesa');
            if (m) {
              m.classList.add(d.ok ? 'servido' : 'mal');
              setTimeout(() => m.classList.remove('servido', 'mal'), 400);
            }
            pintarDespensa();
          }
          pintarPlato();
        }
        if (d.k === 'grita') {
          const el = j.cuerpo.querySelector('.co2-grito');
          if (el) {
            el.innerHTML = `<span>${api.otro}:</span> ¡${icono(d.ing)} ${d.ing}!`;
            el.classList.remove('nuevo');
            void el.offsetWidth;
            el.classList.add('nuevo');
          }
          api.sonido.tono && api.sonido.tono(700, 0, 0.08, { tipo: 'triangle', volumen: 0.05 });
        }
      });
      cronometro(j, SEG, null, null);
    }
  },

  sofa(j, api) {
    const SEG = 45;
    const r = api.r;
    const vigas = [];
    let x = 0.14;
    while (x < 0.92) {
      const largo = 0.05 + r() * 0.05;
      vigas.push([x, x + largo]);
      x += largo + 0.12 + r() * 0.12;
    }
    let mio = 0;
    let suyo = 0;
    let pulsado = false;
    let progreso = 0;
    let golpes = 0;
    let enfriar = 0;
    let terminado = false;
    let ultimoEnvio = 0;
    const izq = api.host;
    j.info(`Mantén pulsado para levantar tu punta (${izq ? 'izquierda' : 'derecha'}). Subid a la vez, y bajad antes de las vigas 🚧`);
    j.cuerpo.innerHTML = `<div class="t2 t2-sofa"><div class="t2-marcador"></div>
      <div class="so-escena"><div class="so-escalera"></div><div class="so-vigas">${vigas.map(([a, b]) => `<i style="left:${a * 100}%;width:${(b - a) * 100}%"></i>`).join('')}</div>
        <div class="so-sofa"><div class="so-cuerpo">🛋️</div><span class="so-mano izq">${izq ? '🫵' : '🤝'}</span><span class="so-mano der">${izq ? '🤝' : '🫵'}</span></div></div>
      <div class="so-medidores"><div class="so-medidor ${izq ? 'mio' : ''}"><i></i><small>${izq ? api.yo : api.otro}</small></div><div class="so-medidor ${izq ? '' : 'mio'}"><i></i><small>${izq ? api.otro : api.yo}</small></div></div>
      <button class="so-boton">💪 Levantar</button></div>`;
    const boton = j.cuerpo.querySelector('.so-boton');
    const sofa = j.cuerpo.querySelector('.so-sofa');
    const medidores = j.cuerpo.querySelectorAll('.so-medidor i');
    const escena = j.cuerpo.querySelector('.so-escena');
    const abajo = e => { e.preventDefault(); pulsado = true; boton.classList.add('on'); };
    const arriba = () => { pulsado = false; boton.classList.remove('on'); };
    boton.addEventListener('pointerdown', abajo);
    window.addEventListener('pointerup', arriba);
    window.addEventListener('pointercancel', arriba);
    const enViga = p => vigas.some(([a, b]) => p >= a - 0.02 && p <= b);
    const vigaCerca = p => vigas.some(([a, b]) => p >= a - 0.08 && p <= b);
    api.escuchar(d => {
      if (d.k === 'h' && api.host) suyo = d.h;
      if (d.k === 's' && !api.host) {
        suyo = d.h;
        progreso = d.pr;
        if (d.g > golpes) {
          golpes = d.g;
          golpe();
        }
      }
    });
    const golpe = () => {
      api.sonido.error();
      escena.classList.add('golpe');
      setTimeout(() => escena.classList.remove('golpe'), 350);
    };
    let ultimo = performance.now();
    let vivo = true;
    const paso = t => {
      if (!vivo) return;
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      mio = limitar(mio + (pulsado ? 1.3 : -1.1) * dt);
      if (t - ultimoEnvio > 80) {
        ultimoEnvio = t;
        if (api.host) api.mandar('s', { h: +mio.toFixed(3), pr: +progreso.toFixed(4), g: golpes });
        else api.mandar('h', { h: +mio.toFixed(3) });
      }
      const hI = izq ? mio : suyo;
      const hD = izq ? suyo : mio;
      if (api.host && !terminado) {
        enfriar = Math.max(0, enfriar - dt);
        const dif = Math.abs(hI - hD);
        const alto = Math.max(hI, hD);
        if (enViga(progreso) && alto > 0.5) {
          if (!enfriar) { golpes++; enfriar = 1; golpe(); }
        } else if (dif > 0.45) {
          if (!enfriar) { golpes++; enfriar = 1; golpe(); }
        } else if (dif < 0.28 && !enfriar) {
          progreso = Math.min(1, progreso + dt * 0.055 * Math.min(hI, hD) * 2);
        }
        if (progreso >= 1) {
          terminado = true;
          api.terminar(golpes === 0 ? '¡Ni un rasguño! Mudanceros profesionales 💪' : `¡Arriba! Con ${golpes} golpe${golpes > 1 ? 's' : ''} en la pared`, limitar(0.75 + 0.25 * (1 - (performance.now() - inicio) / 1000 / SEG) - golpes * 0.07));
        }
      }
      medidores[0].style.height = `${hI * 100}%`;
      medidores[1].style.height = `${hD * 100}%`;
      const inc = (hD - hI) * 22;
      sofa.style.left = `${8 + progreso * 70}%`;
      sofa.style.bottom = `${10 + progreso * 52 + (hI + hD) * 7}%`;
      sofa.style.transform = `rotate(${-inc}deg)`;
      const m = j.cuerpo.querySelector('.t2-marcador');
      if (m) m.textContent = `🏠 ${Math.round(progreso * 100)}% · 💥 ${golpes}${vigaCerca(progreso) ? ' · 🚧 ¡VIGA! ¡Bajad!' : ''}`;
      escena.classList.toggle('aviso', vigaCerca(progreso));
      requestAnimationFrame(paso);
    };
    const inicio = performance.now();
    requestAnimationFrame(paso);
    const previo = j.alTerminar;
    j.alTerminar = () => { vivo = false; window.removeEventListener('pointerup', arriba); window.removeEventListener('pointercancel', arriba); if (previo) previo(); };
    cronometro(j, SEG, null, () => {
      if (!api.host || terminado) return;
      terminado = true;
      api.terminar(`Se acabó el tiempo… llegasteis al ${Math.round(progreso * 100)}%`, limitar(progreso * 0.7 - golpes * 0.07));
    });
  }
};
