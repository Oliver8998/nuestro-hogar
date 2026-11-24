import { paga } from './balance.js';
import { INGREDIENTES } from './casa2.js';
import { CATALOGO } from './catalogo.js';
import { JUEGOS_FAVOR3 } from './trabajos2.js';

const ICONOS = { planta: '🪴', cactus: '🌵', jarron: '💐' };
const elegir = l => l[Math.floor(Math.random() * l.length)];

export const CLIENTE_DE = { mama: 'mama', ramon: 'ramon', sol: 'sol', amigos: 'amigos', lola: 'pilar' };

export const EVENTOS = {
  saludo: { quien: ['mama', 'mateo', 'sol', 'amigos', 'lola', 'ramon'], peso: 2, aviso: n => `🚪 ¡Ha venido ${n}! Tocadle para saludar` },
  sal: { quien: ['mateo', 'ramon', 'sol'], peso: 2, aviso: n => `🚪 ${n} llama a la puerta. Parece que necesita algo` },
  cartas: { quien: ['ramon'], peso: 2, aviso: () => '🃏 Don Ramón ha subido con una baraja bajo el brazo' },
  toby: { quien: ['sol'], peso: 2, aviso: () => '🐶 ¡Sol viene corriendo! Toby se ha colado en vuestra casa' },
  pelis: { quien: ['amigos'], peso: 2, aviso: () => '🍿 Vuestros amigos se presentan con una peli. ¿Noche de cine?' },
  tupper: { quien: ['mama'], peso: 2, aviso: () => '🥡 Mamá viene cargada de tuppers' },
  muestras: { quien: ['lola'], peso: 2, aviso: () => '🎁 Pilar os trae muestras de la tienda' },
  ruido: { quien: ['ramon', 'mateo'], peso: 1, aviso: n => `😠 ${n} ha subido con cara de pocos amigos…` },
  cita: { quien: ['sol'], peso: 2, aviso: () => '👗 Sol necesita vuestra opinión ¡urgente!' },
  karaoke: { quien: ['amigos'], peso: 1, aviso: () => '🎤 Vuestros amigos vienen a buscaros para ir al karaoke' },
  esquejes: { quien: ['ramon', 'mama'], peso: 1, aviso: n => `🌱 ${n} trae algo verde en una maceta` },
  consejo: { quien: ['mateo', 'sol', 'amigos'], peso: 1, aviso: n => `💬 ${n} quiere contaros algo` }
};

export function elegirEvento(quien) {
  const posibles = Object.entries(EVENTOS).filter(([, e]) => e.quien.includes(quien));
  let r = Math.random() * posibles.reduce((a, [, e]) => a + e.peso, 0);
  for (const [id, e] of posibles) {
    r -= e.peso;
    if (r <= 0) return id;
  }
  return 'saludo';
}

function conf(ctx, quien, n) {
  const c = CLIENTE_DE[quien];
  const enc = ctx.encargos && ctx.encargos();
  if (!c || !enc) return '';
  const d = enc.datos();
  const antes = Math.floor(d.conf[c] / 20);
  d.conf[c] = Math.max(0, Math.min(100, d.conf[c] + n));
  const ahora = Math.floor(d.conf[c] / 20);
  if (ahora > antes) return ' ❤️ ¡Os tiene más cariño!';
  return n > 0 ? ' 💕' : n < 0 ? ' 💔' : '';
}

function dar(ctx, monedas) {
  if (!monedas) return;
  ctx.estado.monedas += monedas;
  ctx.ui.aviso(`🪙 +${monedas} monedas`);
}

function anadirIngredientes(ctx, lista) {
  const desp = ctx.estado.despensa || (ctx.estado.despensa = {});
  for (const k of lista) desp[k] = (desp[k] || 0) + 1;
}

function regaloDeco(filtro) {
  const l = CATALOGO.filter(d => d.enTienda !== false && !d.temporada && filtro(d));
  return l.length ? elegir(l) : null;
}

function darObjeto(ctx, d) {
  ctx.inventario.anadir(d.id, d.colores ? 0 : null);
  ctx.ui.pintarInventario(ctx.inventario);
}

async function jugarFavor(vida, v, favor, titulo) {
  const { ctx } = vida;
  const f = JUEGOS_FAVOR3[favor];
  const p = await ctx.juegos.custom(f.icono, titulo, j => f.jugar(j, { sonido: ctx.sonido }), { clave: `fav:${favor}` });
  if (p === null || p === undefined) return null;
  return p;
}

export function atenderEvento(vida, v, nombre) {
  const { ctx } = vida;
  const { ui, miniaturas } = ctx;
  const img = miniaturas.personaje(v.quien);
  const dialogo = (texto, botones, extra = {}) => ui.dialogo({ imagen: img, personaje: true, titulo: nombre, texto, botones, columna: botones.length > 2, ...extra });
  const cerrar = () => vida.terminarVisita();
  const ev = v.ev;

  if (ev === 'sal') {
    const opciones = ['huevo', 'harina', 'leche', 'queso'];
    const k = v.pide || (v.pide = elegir(opciones));
    const ing = INGREDIENTES[k];
    const tengo = (ctx.estado.despensa || {})[k] || 0;
    const frases = {
      mateo: `Perdonad la molestia… estoy haciendo un bizcocho y me falta ${ing.nombre.toLowerCase()}. ¿Me prestáis un poco?`,
      ramon: `Buenas, chavales. Se me ha acabado ${ing.nombre.toLowerCase() === 'huevos' ? 'los huevos' : `la ${ing.nombre.toLowerCase()}`} y no me apetece bajar a la tienda con estas rodillas. ¿Tenéis?`,
      sol: `¡Socorro! Tengo invitados a cenar y me falta ${ing.nombre.toLowerCase()}. ¿Me salváis?`
    };
    const botones = [];
    if (tengo) {
      botones.push({ texto: `Dárselo ${ing.icono} (tenéis ${tengo})`, tipo: 'primario', accion: () => {
        ctx.estado.despensa[k]--;
        const m = paga(25 + Math.floor(Math.random() * 20));
        const c = conf(ctx, v.quien, 4);
        setTimeout(() => dialogo(`¡Mil gracias! Tomad, por las molestias.${c}`, [{ texto: `Cobrar 🪙 ${m}`, tipo: 'primario', accion: () => { dar(ctx, m); cerrar(); } }]), 260);
      } });
    } else {
      botones.push({ texto: `Comprárselo en la tienda · 🪙 ${ing.precio}`, tipo: 'primario', accion: () => {
        if (ctx.estado.monedas < ing.precio) { ctx.sonido.error(); ui.aviso('No os llega…', true); setTimeout(() => atenderEvento(vida, v, nombre), 300); return; }
        ctx.estado.monedas -= ing.precio;
        const c = conf(ctx, v.quien, 5);
        const m = paga(30 + Math.floor(Math.random() * 20));
        setTimeout(() => dialogo(`¿Habéis bajado a por ello? ¡Qué majos! Tomad, que os lo pago con creces.${c}`, [{ texto: `Cobrar 🪙 ${m}`, tipo: 'primario', accion: () => { dar(ctx, m); cerrar(); } }]), 260);
      } });
    }
    botones.push({ texto: 'Lo sentimos, no tenemos', tipo: 'secundario', accion: () => { conf(ctx, v.quien, -1); ui.aviso(`${nombre} lo pedirá en otra puerta`); cerrar(); } });
    dialogo(frases[v.quien] || frases.mateo, botones);
    return;
  }

  if (ev === 'cartas' || ev === 'toby' || ev === 'karaoke') {
    const info = {
      cartas: ['¿Echamos una partidita a mayor o menor? Si ganáis, os invito. Si gano yo… me lo invitáis vosotros, ¡ja!', 'cartas', 'Partida con Don Ramón', '¡A jugar! 🃏'],
      toby: ['¡Perdonad! Abristeis la puerta y Toby se ha colado. Ahora se esconde por todas partes. ¿Me ayudáis a pillarlo?', 'toby', '¡Pillad a Toby!', '¡Vamos a por él! 🐶'],
      karaoke: ['¡Esta noche hay karaoke en el bar de abajo! Si no venís, cantamos nosotros y nos echan del barrio.', 'karaoke', 'Karaoke en el bar', '¡Vamos a cantar! 🎤']
    }[ev];
    dialogo(info[0], [
      { texto: info[3], tipo: 'primario', accion: async () => {
        const p = await jugarFavor(vida, v, info[1], info[2]);
        if (p === null) { setTimeout(() => atenderEvento(vida, v, nombre), 300); return; }
        const m = paga(Math.round(30 + 70 * p));
        const c = conf(ctx, v.quien, Math.round((p - 0.4) * 8));
        const textos = {
          cartas: p >= 0.7 ? '¡Me habéis desplumado! Aquí tenéis, ganado a pulso.' : p >= 0.35 ? 'Una partida reñida. Tomad para un café.' : '¡Os gané! Pero tomad algo, que me habéis hecho compañía.',
          toby: p >= 0.7 ? '¡Lo tenemos! Toby, ¡malo! Gracias, de verdad.' : p >= 0.35 ? 'Al final se dejó coger… ¡qué perro!' : 'Se ha escapado escaleras abajo… ya lo encontraré. Gracias igualmente.',
          karaoke: p >= 0.7 ? '¡Habéis triunfado! Nos han invitado a la siguiente ronda.' : p >= 0.35 ? '¡Qué risas! Repetimos el mes que viene.' : 'Bueno… nos han pedido que no volvamos a cantar. ¡Pero qué bien lo pasamos!'
        };
        ctx.registrar('minijuego');
        setTimeout(() => dialogo(`${textos[ev]}${c}`, [{ texto: `Cobrar 🪙 ${m}`, tipo: 'primario', accion: () => { dar(ctx, m); cerrar(); } }], { confeti: p >= 0.85 }), 300);
      } },
      { texto: 'Hoy no podemos', tipo: 'secundario', accion: () => { conf(ctx, v.quien, -1); cerrar(); } }
    ]);
    return;
  }

  if (ev === 'pelis') {
    const desp = ctx.estado.despensa || {};
    const hay = Object.entries(desp).filter(([, n]) => n > 0).map(([k]) => k);
    const botones = [];
    if (hay.length >= 2) {
      const usar = hay.sort(() => Math.random() - 0.5).slice(0, 2);
      botones.push({ texto: `Preparar algo casero ${usar.map(k => INGREDIENTES[k] ? INGREDIENTES[k].icono : '').join('')}`, tipo: 'primario', accion: () => {
        for (const k of usar) desp[k]--;
        const c = conf(ctx, v.quien, 6);
        ctx.registrar('comer-juntos');
        setTimeout(() => dialogo(`¡Qué rico! Mejor que cualquier pizza. La próxima en nuestra casa, prometido.${c}`, [{ texto: '¡Qué buena noche! 🍿', tipo: 'primario', accion: cerrar }], { confeti: true }), 260);
      } });
    }
    const coste = paga(40);
    botones.push({ texto: `Pedir unas pizzas · 🪙 ${coste}`, tipo: hay.length >= 2 ? 'secundario' : 'primario', accion: () => {
      if (ctx.estado.monedas < coste) { ctx.sonido.error(); ui.aviso('No os llega para pizzas…', true); setTimeout(() => atenderEvento(vida, v, nombre), 300); return; }
      ctx.estado.monedas -= coste;
      const c = conf(ctx, v.quien, 4);
      setTimeout(() => dialogo(`¡Pizza y peli, el plan perfecto! Y encima la elegimos nosotros 😏${c}`, [{ texto: '¡Qué buena noche! 🍕', tipo: 'primario', accion: cerrar }]), 260);
    } });
    botones.push({ texto: 'Mejor otro día', tipo: 'secundario', accion: () => { conf(ctx, v.quien, -1); cerrar(); } });
    dialogo('¡Sorpresa! Hemos traído una peli de miedo. Vosotros ponéis la casa y la comida, ¿no?', botones);
    return;
  }

  if (ev === 'tupper') {
    const posibles = Object.keys(INGREDIENTES).filter(k => !INGREDIENTES[k].paseo);
    const lista = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => elegir(posibles));
    const texto = elegir([
      'Os veo muy delgados. Os he traído cosas de casa, que seguro que coméis cualquier cosa.',
      'He ido al mercado y he comprado de más. ¡Para vosotros, que tenéis que comer bien!',
      'Me ha dado la vecina del pueblo cosas de su huerto. Tomad, que a mí no me caben.'
    ]);
    dialogo(texto, [{ texto: `Gracias, mamá 💕 ${lista.map(k => INGREDIENTES[k].icono).join('')}`, tipo: 'primario', accion: () => {
      anadirIngredientes(ctx, lista);
      conf(ctx, v.quien, 2);
      ui.aviso(`🥡 A la despensa: ${lista.map(k => INGREDIENTES[k].icono).join(' ')}`);
      cerrar();
    } }]);
    return;
  }

  if (ev === 'muestras' || ev === 'esquejes') {
    const filtro = ev === 'esquejes'
      ? d => d.categoria === 'deco' && /planta|flor|cactus|maceta|helecho|bonsai/i.test(`${d.id} ${d.nombre}`)
      : d => (d.categoria === 'deco' || d.categoria === 'limpieza') && d.precio <= 150;
    const opciones = [];
    for (let i = 0; i < 10 && opciones.length < 3; i++) {
      const d = regaloDeco(filtro);
      if (d && !opciones.includes(d)) opciones.push(d);
    }
    if (!opciones.length) {
      const m = paga(40);
      dialogo('Pasaba a saludar. Tomad esto para la casa.', [{ texto: `Gracias 🪙 ${m}`, tipo: 'primario', accion: () => { dar(ctx, m); cerrar(); } }]);
      return;
    }
    const texto = ev === 'esquejes'
      ? (v.quien === 'ramon' ? 'Mis plantas han echado hijos y no me caben. Escoged una, que a vosotros os hacen falta en ese piso.' : 'He trasplantado las plantas del patio. ¿Cuál os quedáis?')
      : 'Me han llegado muestras de los proveedores y me sobran. Elegid la que más os guste, ¡gratis!';
    dialogo(texto, opciones.map(d => ({ texto: `${ICONOS[d.id] || (d.categoria === 'limpieza' ? '🧽' : '🎁')} ${d.nombre}`, tipo: 'primario', accion: () => {
      darObjeto(ctx, d);
      conf(ctx, v.quien, 2);
      ui.aviso(`🎁 ${d.nombre} al inventario`);
      cerrar();
    } })), { columna: true });
    return;
  }

  if (ev === 'ruido') {
    const texto = v.quien === 'ramon'
      ? 'Llevo toda la tarde oyendo golpes y música. ¡Que yo duermo la siesta, hombre! ¿Qué estáis haciendo ahí arriba?'
      : 'Perdonad… es que se oye todo desde mi casa. ¿Podríais bajar un poquito el volumen?';
    const coste = paga(15);
    dialogo(texto, [
      { texto: 'Perdón, bajamos el volumen 🙏', tipo: 'primario', accion: () => { const c = conf(ctx, v.quien, 2); setTimeout(() => dialogo(`Bueno… se agradece. Buenas tardes.${c}`, [{ texto: 'Buenas tardes', tipo: 'primario', accion: cerrar }]), 260); } },
      { texto: `Invitarle a un café para hacer las paces · 🪙 ${coste}`, tipo: 'secundario', accion: () => {
        if (ctx.estado.monedas < coste) { ctx.sonido.error(); ui.aviso('No os llega…', true); setTimeout(() => atenderEvento(vida, v, nombre), 300); return; }
        ctx.estado.monedas -= coste;
        const c = conf(ctx, v.quien, 6);
        setTimeout(() => dialogo(`Hombre… si es así, da gusto. ¡Qué casa más maja tenéis, por cierto!${c}`, [{ texto: '☕ ¡Cuando quiera!', tipo: 'primario', accion: cerrar }]), 260);
      } },
      { texto: 'Hacerse el sordo 🙉', tipo: 'secundario', accion: () => { const c = conf(ctx, v.quien, -6); ui.aviso(`${nombre} se ha ido refunfuñando…${c}`, true); cerrar(); } }
    ]);
    return;
  }

  if (ev === 'cita') {
    const PLANES = [
      { plan: 'Me lleva a cenar a un restaurante con velas y mantel blanco', bien: 'elegante' },
      { plan: 'Vamos a hacer una ruta por la sierra y comer de picnic', bien: 'deportivo' },
      { plan: 'Hemos quedado para tomar algo en el bar de la esquina y luego al cine', bien: 'casual' },
      { plan: 'Vamos a un concierto de rock al aire libre', bien: 'casual' },
      { plan: 'Es la boda de su prima y voy de acompañante', bien: 'elegante' },
      { plan: 'Vamos a patinar al parque y luego a por un helado', bien: 'deportivo' }
    ];
    const ROPA = { elegante: '👗 El vestido elegante', deportivo: '👟 Mallas y zapatillas', casual: '👖 Vaqueros y camiseta bonita' };
    const pl = v.plan || (v.plan = elegir(PLANES));
    dialogo(`¡Tengo una cita esta noche y no sé qué ponerme! ${pl.plan}. ¿Qué me pongo?`, Object.entries(ROPA).map(([k, t]) => ({ texto: t, tipo: 'primario', accion: () => {
      const ok = k === pl.bien;
      const c = conf(ctx, v.quien, ok ? 5 : 1);
      const m = ok ? paga(35) : 0;
      ctx.sonido[ok ? 'arreglo' : 'error']();
      setTimeout(() => dialogo(ok ? `¡Perfecto! Me queda genial y es justo lo que pega. Os debo una 💕${c}` : `Mmm… ¿con eso? No sé yo si pega mucho… Bueno, me lo pruebo. ¡Gracias!${c}`, [{ texto: ok ? `Cobrar 🪙 ${m}` : '¡Que te vaya bien!', tipo: 'primario', accion: () => { dar(ctx, m); cerrar(); } }], { confeti: ok }), 260);
    } })), { columna: true });
    return;
  }

  if (ev === 'consejo') {
    const PREGUNTAS = [
      { p: '¿Sabéis cuál es la mejor manera de que la casa sea más acogedora?', ops: [['Plantas, lámparas y fotos', true], ['Paredes grises y nada más', false], ['Muchas cajas apiladas', false]] },
      { p: 'Quiero adoptar una mascota. ¿Qué es lo más importante para que esté contenta?', ops: [['Mimos, comida y jugar con ella', true], ['Dejarla sola todo el día', false], ['Darle solo chuches', false]] },
      { p: 'Mi casa siempre está llena de polvo. ¿Qué hago?', ops: [['Limpiar un poco cada día', true], ['Esperar a que se vaya solo', false], ['Abrir la ventana y rezar', false]] },
      { p: '¿Qué le regalo a mi pareja por nuestro aniversario?', ops: [['Algo hecho por mí, con cariño', true], ['Un recibo de la luz', false], ['Nada, que ya sabe que la quiero', false]] }
    ];
    const q = v.preg || (v.preg = elegir(PREGUNTAS));
    dialogo(q.p, q.ops.map(([t, ok]) => ({ texto: t, tipo: 'primario', accion: () => {
      const c = conf(ctx, v.quien, ok ? 3 : -1);
      setTimeout(() => dialogo(ok ? `¡Tenéis toda la razón! Sois los mejores.${c}` : `¿En serio? Creo que me estáis tomando el pelo… 🤨${c}`, [{ texto: 'Vale', tipo: 'primario', accion: () => { if (ok) dar(ctx, paga(20)); cerrar(); } }]), 260);
    } })).sort(() => Math.random() - 0.5), { columna: true });
  }
}
