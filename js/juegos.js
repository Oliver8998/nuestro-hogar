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
      const j = JUEGOS.find(x => x.id === id);
      this.capa.querySelector('.jg-titulo').textContent = `${j.icono} ${j.nombre}`;
      this.capa.classList.remove('oculto');
      requestAnimationFrame(() => this.capa.classList.add('abierto'));
      this.tiempo(null);
      if (id === 'cocina') this.cocina();
      else if (id === 'memory') this.memory();
      else if (id === 'puzzle') this.puzzle(extra.imagen);
    });
  }

  terminar(resultado) {
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

  cocina() {
    const lista = barajar(RECETAS.slice()).slice(0, 4);
    let ronda = 0;
    let hechas = 0;
    let paso = 0;
    const total = 45;
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
    const ids = barajar(CATALOGO.filter(d => d.enTienda !== false && !d.temporada).map(d => d.id)).slice(0, 6);
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
        this.info(`${parejas} de 6 parejas · ${fallos} fallos`);
        if (parejas === 6) setTimeout(() => this.final(`¡Todas las parejas con ${fallos} fallos!`, fallos <= 4 ? 1 : fallos <= 9 ? 0.66 : 0.4), 500);
      } else {
        fallos++;
        this.info(`${parejas} de 6 parejas · ${fallos} fallos`);
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
    const total = 90;
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
