import { CATALOGO } from './catalogo.js';

const INGREDIENTES = ['🍅', '🧀', '🥚', '🥬', '🍞', '🥓', '🍄', '🧅', '🥕', '🍗', '🥔', '🌶️'];
const RECETAS = [
  { nombre: 'Tostada', pasos: ['🍞', '🧀', '🍅'] },
  { nombre: 'Tortilla', pasos: ['🥔', '🧅', '🥚'] },
  { nombre: 'Ensalada', pasos: ['🥬', '🍅', '🥕', '🧅'] },
  { nombre: 'Sándwich', pasos: ['🍞', '🥓', '🧀', '🍞'] },
  { nombre: 'Pizza', pasos: ['🍞', '🍅', '🧀', '🍄'] },
  { nombre: 'Pollo asado', pasos: ['🍗', '🥔', '🌶️'] },
  { nombre: 'Huevos rotos', pasos: ['🥔', '🥚', '🥓'] },
  { nombre: 'Revuelto', pasos: ['🥚', '🍄', '🧅', '🧀'] }
];

export const JUEGOS = [
  { id: 'cocina', icono: '🍳', nombre: 'Cocina rápida', texto: 'Prepara las recetas antes de que se acabe el tiempo', premio: 45 },
  { id: 'memory', icono: '🃏', nombre: 'Parejas', texto: 'Encuentra las parejas de muebles', premio: 40 },
  { id: 'puzzle', icono: '🧩', nombre: 'Puzzle', texto: 'Recompón una de vuestras fotos (o la casa)', premio: 50 }
];

export const PARTIDAS_PREMIADAS = 3;

const EXTRA = {
  gotera: { icono: '🔧', nombre: 'Arreglar la tubería' },
  luz: { icono: '⚡', nombre: 'Cuadro eléctrico' },
  duelo: { icono: '🧽', nombre: 'Duelo de limpieza' },
  equipo: { icono: '👩‍🍳', nombre: 'Cocina en equipo' }
};

export const JUEGOS_DOS = [
  { id: 'duelo', icono: '🧽', nombre: 'Duelo de limpieza', texto: 'Uno arriba y otro abajo: ¡quien limpie antes sus manchas gana!', premio: 40 },
  { id: 'equipo', icono: '👩‍🍳', nombre: 'Cocina en equipo', texto: 'Cada uno tiene la mitad de los ingredientes: ¡coordinaos!', premio: 50 }
];

function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Juegos {
  constructor({ sonido, miniaturas }) {
    this.sonido = sonido;
    this.mini = miniaturas;
    const capa = document.createElement('div');
    capa.id = 'juego';
    capa.className = 'oculto';
    capa.innerHTML = `
      <div class="jg-cabecera">
        <div><b class="jg-titulo"></b><small class="jg-info"></small></div>
        <button class="cerrar">✕</button>
      </div>
      <div class="jg-tiempo"><i></i></div>
      <div class="jg-cuerpo"></div>`;
    document.body.appendChild(capa);
    this.capa = capa;
    this.cuerpo = capa.querySelector('.jg-cuerpo');
    capa.querySelector('.cerrar').addEventListener('click', () => this.terminar(null));
  }

  info(texto) {
    this.capa.querySelector('.jg-info').textContent = texto;
  }

  tiempo(k) {
    const el = this.capa.querySelector('.jg-tiempo');
    el.classList.toggle('oculto', k === null);
    if (k !== null) {
      el.querySelector('i').style.width = `${Math.max(0, k) * 100}%`;
      el.classList.toggle('poco', k < 0.25);
    }
  }

  jugar(id, extra = {}) {
    return new Promise(resolve => {
      this.resolver = resolve;
      const j = JUEGOS.find(x => x.id === id) || EXTRA[id];
      this.capa.querySelector('.jg-titulo').textContent = `${j.icono} ${j.nombre}`;
      this.capa.classList.remove('oculto');
      requestAnimationFrame(() => this.capa.classList.add('abierto'));
      this.tiempo(null);
      if (id === 'cocina') this.cocina();
      else if (id === 'memory') this.memory();
      else if (id === 'puzzle') this.puzzle(extra.imagen);
      else if (id === 'gotera') this.gotera();
      else if (id === 'luz') this.luz();
      else if (id === 'duelo') this.duelo();
      else if (id === 'equipo') this.equipo();
    });
  }

  custom(icono, nombre, montar) {
    return new Promise(resolve => {
      this.resolver = resolve;
      this.capa.querySelector('.jg-titulo').textContent = `${icono} ${nombre}`;
      this.info('');
      this.capa.classList.remove('oculto');
      requestAnimationFrame(() => this.capa.classList.add('abierto'));
      this.tiempo(null);
      this.cuerpo.innerHTML = '';
      montar(this);
    });
  }

  terminar(resultado) {
    if (this.alTerminar) {
      this.alTerminar();
      this.alTerminar = null;
    }
    clearInterval(this.reloj);
    this.reloj = null;
    this.capa.classList.remove('abierto');
    setTimeout(() => this.capa.classList.add('oculto'), 250);
    if (this.resolver) this.resolver(resultado);
    this.resolver = null;
  }

  final(texto, puntos) {
    clearInterval(this.reloj);
    this.reloj = null;
    this.tiempo(null);
    this.sonido.premio();
    this.cuerpo.innerHTML = `<div class="jg-final"><span>${puntos >= 0.66 ? '🏆' : puntos >= 0.33 ? '⭐' : '🙂'}</span><b>${texto}</b><button class="primario">Recoger premio</button></div>`;
    this.cuerpo.querySelector('button').addEventListener('click', () => this.terminar(puntos));
  }

  gotera() {
    let vueltas = 0;
    const total = 11;
    let quedan = 10;
    this.info('¡Toca la llave muchas veces para apretar la tubería!');
    this.cuerpo.innerHTML = `<div class="jg-tuberia"><div class="tubo"></div><div class="gotas">💧</div></div><button class="jg-llave">🔧</button><div class="jg-barra"><i></i></div>`;
    const llave = this.cuerpo.querySelector('.jg-llave');
    const barra = this.cuerpo.querySelector('.jg-barra i');
    llave.addEventListener('pointerdown', () => {
      vueltas++;
      llave.style.transform = `rotate(${vueltas * 35}deg)`;
      barra.style.width = `${Math.min(100, vueltas / total * 100)}%`;
      this.sonido.pop();
      if (vueltas >= total) {
        clearInterval(this.reloj);
        this.cuerpo.querySelector('.gotas').textContent = '✨';
        this.sonido.arreglo();
        setTimeout(() => this.terminar(true), 700);
      }
    });
    this.reloj = setInterval(() => {
      quedan -= 0.1;
      this.tiempo(quedan / 10);
      if (quedan <= 0) {
        vueltas = Math.max(0, vueltas - 6);
        quedan = 10;
        this.sonido.error();
        this.info('¡Se ha aflojado! Otra vez, más rápido');
      }
    }, 100);
  }

  luz() {
    const n = 5;
    const estado = Array(n).fill(true);
    const pulsar = (i, arr) => {
      for (const k of [i - 1, i, i + 1]) if (k >= 0 && k < n) arr[k] = !arr[k];
    };
    for (let k = 0; k < 6; k++) pulsar(Math.floor(Math.random() * n), estado);
    if (estado.every(Boolean)) pulsar(2, estado);
    let movs = 0;
    this.info('Cada interruptor mueve también los de al lado. ¡Ponlos todos en ON!');
    const pintar = () => {
      this.cuerpo.innerHTML = `<div class="jg-cuadro"><div class="bombilla ${estado.every(Boolean) ? 'on' : ''}">💡</div><div class="interruptores">${estado.map((on, i) => `<button data-i="${i}" class="${on ? 'on' : ''}"><i></i><small>${on ? 'ON' : 'OFF'}</small></button>`).join('')}</div><small class="movs">${movs} movimientos</small></div>`;
      this.cuerpo.querySelectorAll('.interruptores button').forEach(b => b.addEventListener('click', () => {
        pulsar(Number(b.dataset.i), estado);
        movs++;
        this.sonido.pop();
        pintar();
        if (estado.every(Boolean)) {
          this.sonido.arreglo();
          setTimeout(() => this.terminar(true), 800);
        }
      }));
    };
    pintar();
  }

  duelo() {
    const manchas = () => Array.from({ length: 10 }, () => ({ x: 8 + Math.random() * 80, y: 12 + Math.random() * 70, vida: 3 }));
    const jugadores = [manchas(), manchas()];
    const quedan = [10, 10];
    let fin = false;
    this.info('Cada uno en su mitad. ¡Frotad (tocad) las manchas!');
    this.cuerpo.innerHTML = `<div class="jg-duelo">${[0, 1].map(j => `<div class="mitad m${j}"><b>${j === 0 ? '⬆️ Jugador 1' : '⬇️ Jugador 2'} · <span>10</span> manchas</b>${jugadores[j].map((m, i) => `<button class="mancha" data-j="${j}" data-i="${i}" style="left:${m.x}%;top:${m.y}%"></button>`).join('')}</div>`).join('')}</div>`;
    this.cuerpo.querySelectorAll('.mancha').forEach(b => b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (fin) return;
      const j = Number(b.dataset.j);
      const m = jugadores[j][Number(b.dataset.i)];
      if (m.vida <= 0) return;
      m.vida--;
      b.style.opacity = 0.25 + m.vida * 0.25;
      b.style.transform = `scale(${0.6 + m.vida * 0.13})`;
      this.sonido.pop();
      if (m.vida === 0) {
        b.classList.add('limpia');
        quedan[j]--;
        this.cuerpo.querySelector(`.m${j} span`).textContent = quedan[j];
        if (quedan[j] === 0) {
          fin = true;
          this.sonido.premio();
          this.cuerpo.innerHTML = `<div class="jg-final"><span>🏆</span><b>¡Gana el jugador ${j + 1}!</b><button class="primario">Recoger premio</button></div>`;
          this.cuerpo.querySelector('button').addEventListener('click', () => this.terminar(1));
        }
      }
    }));
  }

  equipo() {
    const lista = barajar(RECETAS.slice()).slice(0, 4);
    let ronda = 0;
    let paso = 0;
    let hechas = 0;
    const total = 48;
    let quedan = total;
    const pintar = () => {
      const r = lista[ronda];
      const todos = barajar([...new Set([...r.pasos, ...barajar(INGREDIENTES.slice()).slice(0, 8)])]).slice(0, 10);
      for (const p of r.pasos) if (!todos.includes(p)) todos[Math.floor(Math.random() * todos.length)] = p;
      const mitades = [todos.filter((_, i) => i % 2 === 0), todos.filter((_, i) => i % 2 === 1)];
      this.info(`Receta ${ronda + 1} de ${lista.length}: ${r.nombre}`);
      this.cuerpo.innerHTML = `<div class="jg-duelo equipo">
        <div class="mitad m0 girada"><div class="jg-receta mini"><div class="pasos">${r.pasos.map((p, i) => `<span class="${i < paso ? 'hecho' : ''}">${p}</span>`).join('<i>›</i>')}</div></div><div class="jg-ingredientes">${mitades[0].map(o => `<button>${o}</button>`).join('')}</div></div>
        <div class="mitad m1"><div class="jg-receta mini"><div class="pasos">${r.pasos.map((p, i) => `<span class="${i < paso ? 'hecho' : ''}">${p}</span>`).join('<i>›</i>')}</div></div><div class="jg-ingredientes">${mitades[1].map(o => `<button>${o}</button>`).join('')}</div></div>
      </div>`;
      this.cuerpo.querySelectorAll('.jg-ingredientes button').forEach(b => b.addEventListener('click', () => {
        if (b.textContent === r.pasos[paso]) {
          paso++;
          this.sonido.pop();
          this.cuerpo.querySelectorAll('.pasos').forEach(ps => ps.children[(paso - 1) * 2] && ps.children[(paso - 1) * 2].classList.add('hecho'));
          if (paso >= r.pasos.length) {
            hechas++;
            ronda++;
            paso = 0;
            this.sonido.arreglo();
            if (ronda >= lista.length) return this.final(`¡${hechas} recetas en equipo!`, hechas / lista.length);
            setTimeout(pintar, 350);
          }
        } else {
          this.sonido.error();
          quedan -= 2;
        }
      }));
    };
    pintar();
    this.reloj = setInterval(() => {
      quedan -= 0.1;
      this.tiempo(quedan / total);
      if (quedan <= 0) this.final(`Se acabó el tiempo: ${hechas} recetas`, hechas / lista.length);
    }, 100);
  }

  cocina() {
    const lista = barajar(RECETAS.slice()).slice(0, 4);
    let ronda = 0;
    let hechas = 0;
    let paso = 0;
    const total = 36;
    let quedan = total;
    const pintar = () => {
      const r = lista[ronda];
      const opciones = barajar([...new Set([...r.pasos, ...barajar(INGREDIENTES.slice()).slice(0, 8)])]).slice(0, 9);
      for (const p of r.pasos) if (!opciones.includes(p)) opciones[Math.floor(Math.random() * opciones.length)] = p;
      this.info(`Receta ${ronda + 1} de ${lista.length} · Toca los ingredientes en orden`);
      this.cuerpo.innerHTML = `
        <div class="jg-receta"><b>${r.nombre}</b><div class="pasos">${r.pasos.map((p, i) => `<span class="${i < paso ? 'hecho' : ''}">${p}</span>`).join('<i>›</i>')}</div></div>
        <div class="jg-sarten">🍳</div>
        <div class="jg-ingredientes">${opciones.map(o => `<button>${o}</button>`).join('')}</div>`;
      this.cuerpo.querySelectorAll('.jg-ingredientes button').forEach(b => b.addEventListener('click', () => {
        if (b.textContent === r.pasos[paso]) {
          paso++;
          this.sonido.pop();
          b.classList.add('bien');
          if (paso >= r.pasos.length) {
            hechas++;
            this.sonido.arreglo();
            ronda++;
            paso = 0;
            if (ronda >= lista.length) return this.final(`¡${hechas} de ${lista.length} recetas!`, hechas / lista.length);
            setTimeout(pintar, 350);
          } else {
            this.cuerpo.querySelectorAll('.pasos span')[paso - 1].classList.add('hecho');
          }
        } else {
          this.sonido.error();
          b.classList.add('mal');
          quedan -= 2;
          setTimeout(() => b.classList.remove('mal'), 300);
        }
      }));
    };
    pintar();
    this.reloj = setInterval(() => {
      quedan -= 0.1;
      this.tiempo(quedan / total);
      if (quedan <= 0) this.final(`Se acabó el tiempo: ${hechas} de ${lista.length} recetas`, hechas / lista.length);
    }, 100);
  }

  memory() {
    const ids = barajar(CATALOGO.filter(d => d.enTienda !== false && !d.temporada)
      .map(d => d.id)).slice(0, 8);
    const cartas = barajar([...ids, ...ids]);
    let abiertas = [];
    let parejas = 0;
    let fallos = 0;
    this.info('Toca dos cartas para darles la vuelta');
    this.cuerpo.innerHTML = `<div class="jg-memory">${cartas.map((id, i) => `
      <button class="carta" data-i="${i}"><div class="dorso">🏠</div><div class="frente"><img src="${this.mini.item(id, 0)}" alt=""></div></button>`).join('')}</div>`;
    const botones = [...this.cuerpo.querySelectorAll('.carta')];
    botones.forEach(b => b.addEventListener('click', () => {
      if (abiertas.length >= 2 || b.classList.contains('vuelta')) return;
      b.classList.add('vuelta');
      this.sonido.tocar();
      abiertas.push(b);
      if (abiertas.length < 2) return;
      const [a, c] = abiertas;
      if (cartas[a.dataset.i] === cartas[c.dataset.i]) {
        parejas++;
        abiertas = [];
        this.sonido.arreglo();
        a.classList.add('hecha');
        c.classList.add('hecha');
        this.info(`${parejas} de 8 parejas · ${fallos} fallos`);
        if (parejas === 8) setTimeout(() => this.final(`¡Todas las parejas con ${fallos} fallos!`, fallos <= 5 ? 1 : fallos <= 10 ? 0.66 : 0.35), 500);
      } else {
        fallos++;
        this.info(`${parejas} de 8 parejas · ${fallos} fallos`);
        setTimeout(() => {
          a.classList.remove('vuelta');
          c.classList.remove('vuelta');
          abiertas = [];
        }, 750);
      }
    }));
  }

  puzzle(imagen) {
    const n = 3;
    let orden = barajar([...Array(n * n).keys()]);
    if (orden.every((v, i) => v === i)) orden = [1, 0, ...orden.slice(2)];
    let sel = null;
    let movimientos = 0;
    const total = 70;
    let quedan = total;
    this.info('Toca dos piezas para cambiarlas de sitio');
    const pintar = () => {
      this.cuerpo.innerHTML = `<div class="jg-puzzle">${orden.map((p, i) => {
        const x = (p % n) * 50;
        const y = Math.floor(p / n) * 50;
        return `<button data-i="${i}" class="${sel === i ? 'sel' : ''}${p === i ? ' ok' : ''}" style="background-image:url(${imagen});background-position:${x}% ${y}%"></button>`;
      }).join('')}</div><div class="jg-modelo"><img src="${imagen}" alt=""><small>Así tiene que quedar</small></div>`;
      this.cuerpo.querySelectorAll('.jg-puzzle button').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        if (sel === null) {
          sel = i;
          this.sonido.tocar();
        } else {
          [orden[sel], orden[i]] = [orden[i], orden[sel]];
          sel = null;
          movimientos++;
          this.sonido.pop();
          if (orden.every((v, k) => v === k)) {
            pintar();
            return setTimeout(() => this.final(`¡Puzzle completo en ${movimientos} movimientos!`, quedan > total * 0.5 ? 1 : quedan > total * 0.2 ? 0.66 : 0.4), 400);
          }
        }
        pintar();
      }));
    };
    pintar();
    this.reloj = setInterval(() => {
      quedan -= 0.1;
      this.tiempo(quedan / total);
      if (quedan <= 0) this.final('Se acabó el tiempo', 0.2);
    }, 100);
  }
}
