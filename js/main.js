import * as THREE from 'three';
import { CamaraIso } from './camara.js';
import { crearSala } from './sala.js';
import { GestorMuebles } from './muebles.js';
import { Controles } from './controles.js';
import { Inventario } from './inventario.js';
import { UI } from './ui.js';
import { Miniaturas } from './miniaturas.js';
import { GestorMascotas, ESPECIES, PERSONALIDADES, ACCESORIOS } from './mascotas.js';
import { infoItem, precioVenta, RAREZAS } from './catalogo.js';
import { elegirSegmento, resolverPremio, COSTE_TIRADA, PIEZAS_PREMIO } from './ruleta.js';
import { sonido } from './sonido.js';
import { Entregas } from './entregas.js';
import { Suciedad, TIPOS as TIPOS_SUCIEDAD, construirJardin } from './suciedad.js';
import { HISTORIA, EVENTOS, puntuacion, nuevasDiarias, infoDiaria, textoPremio } from './misiones.js';
import { poolDe } from './ruleta.js';
import { Minijuegos } from './minijuegos.js';
import { cargarModelos } from './modelos.js';
import { Ambiente, temporada, NOMBRE_TEMPORADA } from './ambiente.js';
import { Mas } from './mas.js';
import { Juegos, JUEGOS, PARTIDAS_PREMIADAS } from './juegos.js';
import { Usos } from './usos.js';
import { Vida } from './vida.js';
import { Economia } from './economia.js';
import { Inicio } from './inicio.js';
import { Pareja2 } from './pareja2.js';
import { JUEGOS_DOS } from './juegos.js';
import { Sync } from './sync.js';
import { Pareja } from './pareja.js';
import { Casa2 } from './casa2.js';
import { Mascotas2, TRUCOS } from './mascotas2.js';
import { Social } from './social.js';
import { Sorpresas } from './sorpresas.js';
import { Lofi } from './lofi.js';
import { Trabajos } from './trabajos.js';
import { activarTraduccion } from './i18n.js';
import { Guia } from './guia.js';
import * as avisos from './avisos.js';

let guia = null;
import { CASAS, COLECCIONES, LOGROS, EXTERIORES, calcularAcogedor, coleccionesCompletas } from './progreso.js';

activarTraduccion();
await cargarModelos();

const CLAVE = 'hogar-estado';
const NOMBRES = ['Michi', 'Coco', 'Luna', 'Toby', 'Nube', 'Canela', 'Pipo', 'Kiwi', 'Lola', 'Bimba', 'Churro', 'Galleta', 'Mochi', 'Rufo', 'Trufa', 'Pelusa'];
const canvas = document.getElementById('escena');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;

const escena = new THREE.Scene();
const camaraIso = new CamaraIso(window.innerWidth / window.innerHeight);
const sala = crearSala(escena);
const gestor = new GestorMuebles(escena);
const ambiente = new Ambiente(sala, renderer);
const inventario = new Inventario();
const miniaturas = new Miniaturas(160);

const estado = {
  monedas: 250,
  tickets: 0,
  dia: null,
  gratis: true,
  bienvenida: false,
  jardin: false,
  limpiadoraHasta: 0,
  diarias: null,
  historia: 0,
  evento: null
};

let mascotaSel = null;
let controles = null;
let mas = null;
let arrastre = null;
let tRefrescoMenu = 0;

const mascotas = new GestorMascotas(escena, gestor, {
  particula(emoji, m, n = 1) {
    const p = pantalla(new THREE.Vector3(m.grupo.position.x, 0.75 * m.e.tam, m.grupo.position.z));
    ui.particula(emoji, p.x, p.y, n);
  },
  trastada(m, obj) {
    sonido.error();
    ui.aviso(`😼 ¡${m.nombre} ha tirado ${obj.userData.def.nombre.toLowerCase()}! Tocadlo para levantarlo`);
    if (['planta', 'cactus', 'cerezo'].includes(obj.userData.def.id) && suciedad.genera !== false) suciedad.anadir('barro', { x: obj.position.x + 0.25, z: obj.position.z + 0.1 });
    guardar();
  }
});

const entregas = new Entregas(escena, {
  alClaxon() {
    sonido.claxon();
  },
  alLlegar() {
    sonido.pop();
    ui.aviso('📦 ¡Ha llegado un paquete! Tocadlo para abrirlo');
    guardar();
  }
});

const suciedad = new Suciedad(escena, {
  mascotas,
  gestor,
  eventos: {
    particula(emoji, pos, n = 2) {
      const p = pantalla(new THREE.Vector3(pos.x, (pos.y || 0) + 0.3, pos.z));
      ui.particula(emoji, p.x, p.y, n);
    },
    alLimpiado(d, quien) {
      if (quien === 'yo' || quien === 'expres') {
        registrar('limpiar');
        if (d.tipo === 'caca') registrar('limpiar-caca');
      }
      refrescarHud();
      guardar();
    },
    alNuevaSuciedad(tipo, m) {
      if (tipo === 'caca' && m) ui.aviso(`💩 ${m.nombre} ha hecho caca en el suelo`);
      else if (tipo === 'bichos') ui.aviso('🐜 ¡Han entrado hormigas!');
      refrescarHud();
    },
    alLlegaLimpiadora() {
      sonido.pop();
      ui.aviso('🤖 Ha llegado Robi a limpiar');
    },
    alVisitaLimpiadora() {
      ui.aviso('✨ Robi ha dejado la casa reluciente');
      guardar();
    }
  }
});

const minijuegos = new Minijuegos(sonido);

const LOCALES = ['dia', 'bienvenida', 'juegosHoy', 'gratis', 'habActual', 'reforma'];
let sync = null;
let pareja = null;
let casa2 = null;
let mascotas2 = null;
let social = null;
let sorpresas = null;
let trabajos = null;
let visitando = false;
let guardarPendiente = false;
let remotoPendiente = null;
let visitaPrevia = null;
const lofi = new Lofi(sonido);

function habitacionViva() {
  return { muebles: gestor.serializar(), suciedad: suciedad.serializar().lista, paredes: sala.estado().paredes };
}

function todasHabitaciones() {
  const habs = (estado.habs || []).slice();
  habs[estado.habActual || 0] = habitacionViva();
  const n = habsCasa().length;
  while (habs.length < n) habs.push({ muebles: [], suciedad: [], paredes: [null, null, null, null] });
  return habs;
}

const AMPLIACIONES = [
  { nombre: 'Cine', icono: '🎬', precio: 6000 },
  { nombre: 'Biblioteca', icono: '📚', precio: 6000 },
  { nombre: 'Gimnasio', icono: '🏋️', precio: 7000 },
  { nombre: 'Invernadero', icono: '🪴', precio: 8000 },
  { nombre: 'Salón de baile', icono: '💃', precio: 10000 },
  { nombre: 'Torre del observatorio', icono: '🔭', precio: 14000 }
];

function habsCasa(e = estado) {
  const n = (e.casa && e.casa.nivel) || 0;
  const base = CASAS[n].habitaciones;
  return n === CASAS.length - 1 ? [...base, ...(e.ampliaciones || [])] : base;
}

function nivelCasa() {
  return (estado.casa && estado.casa.nivel) || 0;
}

function instantanea() {
  const e = {};
  for (const [k, v] of Object.entries(estado)) if (!LOCALES.includes(k)) e[k] = v;
  e.habs = todasHabitaciones();
  return {
    estado: e,
    muebles: gestor.serializar(),
    inventario: inventario.serializar(),
    sala: sala.estado(),
    mascotas: mascotas.serializar(),
    suciedad: suciedad.serializar()
  };
}

function sincronizarMuebles(lista) {
  const porUid = new Map(gestor.muebles.map(m => [m.userData.uid, m]));
  const remotos = new Set(lista.map(d => d.uid));
  const cambiados = [];
  const ocupado = m => controles && controles.seleccionado === m && controles.modo !== 'nada';
  for (const m of [...gestor.muebles]) {
    if (remotos.has(m.userData.uid) || ocupado(m)) continue;
    if (controles && controles.seleccionado === m) controles.seleccionar(null);
    gestor.quitar(m);
    cambiados.push({ tipo: 'quitar', nombre: m.userData.def.nombre });
  }
  for (const d of [...lista].sort((a, b) => a.base - b.base)) {
    const m = porUid.get(d.uid);
    if (!m) {
      const n = gestor.anadir(d.id, d.x0, d.z0, d.rot, d);
      if (n) {
        n.userData.rebote = 0.8;
        cambiados.push({ tipo: 'poner', nombre: n.userData.def.nombre });
      }
      continue;
    }
    if (ocupado(m)) continue;
    const u = m.userData;
    if (u.x0 !== d.x0 || u.z0 !== d.z0 || u.rot !== d.rot || Math.abs(u.base - d.base) > 0.001) {
      gestor.colocar(m, d.x0, d.z0, d.rot, d.base);
      u.rebote = 0.6;
      cambiados.push({ tipo: 'mover', nombre: u.def.nombre });
    }
    if ((u.color ?? null) !== (d.color ?? null) || u.encendido !== d.encendido) {
      u.color = d.color;
      u.encendido = d.encendido;
      gestor.aplicarApariencia(m);
    }
    if (d.datos) u.datos = d.datos;
  }
  return cambiados;
}

function aplicarRemoto(datos, conflicto = false, inicial = false) {
  if (!datos || !datos.estado) return;
  if (visitando) {
    remotoPendiente = [datos, conflicto, inicial];
    return;
  }
  const nivelAntes = nivelCasa();
  const otroYo = sync && sync.activo ? 1 - sync.yo : null;
  const animoAntes = otroYo !== null && estado.animo && estado.animo[otroYo] ? estado.animo[otroYo].t : 0;
  for (const [k, v] of Object.entries(datos.estado)) if (!LOCALES.includes(k)) estado[k] = v;
  if (otroYo !== null) setTimeout(revisarRachaPareja, 0);
  if (!inicial && otroYo !== null && estado.animo && estado.animo[otroYo] && estado.animo[otroYo].t > animoAntes) {
    const a = estado.animo[otroYo];
    setTimeout(() => ui.aviso(`💭 ${pareja.otro()} está: ${a.e} ${a.txt}`), 1200);
  }
  const habR = datos.estado.habs && datos.estado.habs[estado.habActual || 0];
  const cambios = sincronizarMuebles(habR ? habR.muebles : (datos.muebles || []));
  if (habR && (estado.habActual || 0) !== 0) sala.pintarParedes(habR.paredes, CASAS[nivelCasa()].pared);
  if (nivelAntes !== nivelCasa()) aplicarEstiloCasa();
  inventario.cargar(datos.inventario);
  ui.pintarInventario(inventario);
  if (datos.sala) sala.restaurar(datos.sala);
  mascotas.sincronizar(datos.mascotas || []);
  if (habR) suciedad.sincronizar(habR.suciedad || []);
  else if (datos.suciedad) suciedad.sincronizar(datos.suciedad.lista || []);
  if (estado.jardin) ponerJardin();
  suciedad.limpiadoraHasta = estado.limpiadoraHasta;
  mas.pintarPared();
  mas.montarCartel();
  refrescarHud();
  guardar();
  if (!inicial && cambios.length) {
    const c = cambios[cambios.length - 1];
    const verbo = { mover: 'ha movido', poner: 'ha puesto', quitar: 'ha quitado' }[c.tipo];
    ui.aviso(`💗 ${pareja.otro()} ${verbo} ${c.nombre.toLowerCase()}${cambios.length > 1 ? ` y ${cambios.length - 1} cosa${cambios.length > 2 ? 's' : ''} más` : ''}`);
  }
}


async function jugarMinijuego(d) {
  const producto = TIPOS_SUCIEDAD[d.tipo].producto;
  if (!inventario.cantidad(producto)) return;
  ui.cerrarInventario();
  const ok = await minijuegos.jugar(d.tipo);
  if (!ok) {
    ui.aviso('Lo dejáis para luego');
    return;
  }
  if (d.limpia) return;
  inventario.usar(producto, null, infoItem(producto).usos || 1);
  ui.pintarInventario(inventario);
  suciedad.eventos.particula('✨', d.grupo.position, 5);
  suciedad.limpiar(d, 'yo');
  ui.aviso('✨ ¡Limpio!');
}

let jardinMalla = null;
function ponerJardin() {
  if (jardinMalla) return;
  jardinMalla = construirJardin();
  escena.add(jardinMalla);
  suciedad.jardin = true;
}

function hayTrampa() {
  return gestor.muebles.some(m => m.userData.def.trampa);
}

function tiempoEntrega(cantidad) {
  return Math.min(45, 20 + 4 * (cantidad - 1));
}

function abrirPaquete(p) {
  const pos = p.paquete ? pantalla(p.paquete.position.clone().add(new THREE.Vector3(0, 0.3, 0))) : null;
  const items = entregas.abrir(p);
  for (const it of items) inventario.anadir(it.id, it.color ?? null, it.cantidad);
  sonido.arreglo();
  if (pos) ui.particula('✨', pos.x, pos.y, 6);
  const nombres = items.map(it => `${it.cantidad > 1 ? `${it.cantidad} × ` : ''}${infoItem(it.id).nombre}`).join(', ');
  ui.aviso(`🎁 ${nombres} al inventario`);
  ui.pintarInventario(inventario);
  ui.abrirInventario();
  ui.avisarInventarioNuevo();
  registrar('paquete');
  guardar();
}

function pantalla(v) {
  const q = v.clone().project(camaraIso.camara);
  const r = canvas.getBoundingClientRect();
  return { x: (q.x + 1) / 2 * r.width + r.left, y: (1 - q.y) / 2 * r.height + r.top };
}

function guardar() {
  if (visitando) {
    guardarPendiente = true;
    return;
  }
  if (sync) sync.marcarCambio();
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      ...estado,
      muebles: gestor.serializar(),
      inventario: inventario.serializar(),
      sala: sala.estado(),
      mascotas: mascotas.serializar(),
      pedidos: entregas.serializar(),
      suciedad: suciedad.serializar(),
      t: Date.now()
    }));
  } catch (e) {}
}

function cargar() {
  let datos = null;
  try {
    datos = JSON.parse(localStorage.getItem(CLAVE));
  } catch (e) {}
  if (!datos) {
    gestor.anadir('colchon', -5, -5, 0);
    gestor.anadir('caja', 3, -4, 0);
    gestor.anadir('caja', 4, -4, 0);
    gestor.anadir('caja', 3, -3, 0);
    gestor.anadir('caja', 3, -4, 0, { base: 0.42 });
    suciedad.anadir('polvo', null, false);
    suciedad.anadir('polvo', null, false);
    suciedad.anadir('telarana', { hueco: 0 }, false);
    return false;
  }
  estado.monedas = datos.monedas ?? 250;
  estado.tickets = datos.tickets ?? 0;
  estado.dia = datos.dia ?? null;
  estado.gratis = datos.gratis ?? true;
  estado.bienvenida = datos.bienvenida ?? true;
  estado.jardin = datos.jardin ?? false;
  estado.limpiadoraHasta = datos.limpiadoraHasta ?? 0;
  estado.diarias = datos.diarias ?? null;
  estado.historia = datos.historia ?? 0;
  estado.evento = datos.evento ?? null;
  const MUNDO = ['muebles', 'inventario', 'sala', 'mascotas', 'pedidos', 'suciedad', 't', 'reparaciones'];
  for (const [k, v] of Object.entries(datos)) if (!MUNDO.includes(k) && !(k in estado)) estado[k] = v;
  for (const m of datos.muebles || []) gestor.anadir(m.id, m.x0, m.z0, m.rot, m);
  inventario.cargar(datos.inventario);
  const antiguas = datos.reparaciones || [];
  sala.restaurar(datos.sala || {
    arreglos: antiguas.filter(id => !id.startsWith('pintura')),
    paredes: [0, 1, 2, 3].map(i => antiguas.includes(`pintura-${i}`) ? 0xf3eadb : null)
  });
  mascotas.cargar(datos.mascotas, datos.t ? (Date.now() - datos.t) / 1000 : 0);
  entregas.cargar(datos.pedidos);
  if (estado.jardin) ponerJardin();
  suciedad.limpiadoraHasta = estado.limpiadoraHasta;
  suciedad.cargar(datos.suciedad, datos.t ? (Date.now() - datos.t) / 1000 : 0, hayTrampa());
  return true;
}

const habiaPartida = cargar();
let terminada = sala.progreso().hechos >= sala.progreso().total;

function refrescarHud() {
  ui.monedas(estado.monedas);
  ui.tickets(estado.tickets);
  ui.tiradaGratis(estado.gratis);
  const enPrincipal = (estado.habActual || 0) === 0 && nivelCasa() === 0;
  if (enPrincipal) estado.reforma = sala.progreso();
  const prog = estado.reforma || sala.progreso();
  ui.casa(prog);
  ui.limpieza(suciedad.limpieza());
  ui.contadorMisiones(misionesListas());
  ordenarHud();
  if (!terminada && prog.hechos >= prog.total) {
    terminada = true;
    setTimeout(() => {
      sonido.premio();
      ui.dialogo({
        imagen: miniaturas.personaje('lola'), personaje: true,
        titulo: '¡Habitación reformada!',
        texto: 'Ha quedado preciosa. Os habéis ganado un regalo: 200 monedas y 2 tickets.',
        confeti: true,
        botones: [{ texto: '¡Gracias, Pilar!', tipo: 'primario' }]
      });
      estado.monedas += 200;
      estado.tickets += 2;
      refrescarHud();
      guardar();
    }, 1200);
  }
  refrescarMenu();
}

function comprarDirecto(id, color = null, precio = null, cantidad = 1) {
  const info = infoItem(id);
  const coste = (precio ?? info.precio) * cantidad;
  if (estado.monedas < coste) {
    sonido.error();
    ui.aviso('No te llega el dinero', true);
    return false;
  }
  if (info.servicio === 'jardin' && estado.jardin) {
    ui.aviso('Ya tenéis jardín 🌳');
    return false;
  }
  estado.monedas -= coste;
  if (info.servicio) {
    if (info.servicio === 'limpiadora') {
      estado.limpiadoraHasta = Math.max(Date.now(), estado.limpiadoraHasta) + 3 * 86400000;
      suciedad.limpiadoraHasta = estado.limpiadoraHasta;
      suciedad.tVisita = 2;
      ui.aviso('🤖 Robi vendrá a limpiar durante 3 días');
    } else if (info.servicio === 'jardin') {
      estado.jardin = true;
      ponerJardin();
      ui.aviso('🌳 ¡Jardín instalado junto a la casa!');
    }
    sonido.premio();
    refrescarHud();
    guardar();
    return true;
  }
  registrar('pedido');
  pareja.recordar('compra', '🛒', `Nuestra primera compra: ${info.nombre.toLowerCase()}`);
  const segundos = tiempoEntrega(cantidad);
  entregas.pedir([{ id, color: info.tipo === 'mueble' && info.colores ? (color ?? 0) : null, cantidad }], segundos);
  sonido.comprar();
  refrescarHud();
  ui.aviso(`🚚 ¡Pedido! ${cantidad > 1 ? `${cantidad} × ` : ''}${info.nombre} llega en ${segundos} s`);
  guardar();
  return true;
}

function ofrecerCompra(id, titulo) {
  const info = infoItem(id);
  ui.dialogo({
    imagen: miniaturas.item(id),
    titulo: titulo || `No tenéis ${info.nombre.toLowerCase()}`,
    texto: '¿Lo pedimos? Os lo traen a la puerta en un momento.',
    botones: [
      { texto: 'Ahora no', tipo: 'secundario' },
      { texto: `Comprar · 🪙 ${info.precio}`, tipo: 'primario', desactivado: estado.monedas < info.precio, accion: () => comprarDirecto(id) }
    ]
  });
}

function opcionesMueble(m) {
  const datos = m.userData;
  const def = datos.def;
  const opciones = [{
    icono: '⟳',
    texto: 'Girar',
    accion: () => {
      const r = gestor.rotar(m);
      if (r === 'ok') {
        sonido.pop();
        guardar();
      } else {
        sonido.error();
        ui.aviso(r === 'encima' ? 'Quita primero lo que tiene encima' : 'No hay sitio para girarlo', true);
      }
    }
  }];

  opciones.push(...usos.opciones(m));
  if (casa2) opciones.push(...casa2.opciones(m));
  if (sorpresas) opciones.push(...sorpresas.opcionesMueble(m));
  if (def.colores) {
    opciones.push({ icono: '🎨', texto: 'Color', accion: () => { gestor.siguienteColor(m); sonido.pop(); guardar(); } });
  }
  if (def.encendible && !def.ordenador && def.id !== 'tele') {
    opciones.push({
      icono: datos.encendido ? '🌙' : '💡',
      texto: datos.encendido ? 'Apagar' : 'Encender',
      accion: () => {
        gestor.alternarEncendido(m);
        sonido.pop();
        guardar();
        refrescarMenu();
      }
    });
  }
  opciones.push({
    icono: '📦',
    texto: 'Guardar',
    accion: () => {
      if (gestor.tieneEncima(m)) {
        sonido.error();
        ui.aviso('Quita primero lo que tiene encima', true);
        return;
      }
      inventario.anadir(def.id, def.colores ? datos.color : null);
      controles.seleccionar(null);
      gestor.quitar(m);
      sonido.pop();
      ui.pintarInventario(inventario);
      ui.aviso(`📦 ${def.nombre} al inventario`);
      guardar();
    }
  });
  const venta = precioVenta(def);
  opciones.push({
    icono: venta ? '💰' : '🗑️',
    texto: venta ? `+${venta}` : 'Tirar',
    accion: () => {
      if (gestor.tieneEncima(m)) {
        sonido.error();
        ui.aviso('Quita primero lo que tiene encima', true);
        return;
      }
      const vender = () => {
        estado.monedas += venta;
        controles.seleccionar(null);
        gestor.quitar(m);
        sonido.comprar();
        refrescarHud();
        guardar();
      };
      if (def.rareza) {
        ui.dialogo({
          imagen: miniaturas.item(def.id, datos.color),
          etiqueta: { texto: RAREZAS[def.rareza].nombre, color: RAREZAS[def.rareza].color },
          titulo: `¿Vender ${def.nombre.toLowerCase()}?`,
          texto: 'Es un objeto exclusivo de la ruleta. Si lo vendéis, no se puede comprar en la tienda.',
          botones: [{ texto: 'Mejor no', tipo: 'secundario' }, { texto: `Vender · +${venta}`, tipo: 'rosa', accion: vender }]
        });
      } else vender();
    }
  });
  return opciones;
}

function barra(etiqueta, valor, color) {
  return `<div class="stat"><span>${etiqueta}</span><div class="barra-stat"><i style="width:${Math.round(valor)}%;background:${color}"></i></div></div>`;
}

function cabeceraMascota(m) {
  const pers = PERSONALIDADES[m.personalidad];
  const edad = m.edadDias() < 4 ? ' · bebé' : '';
  return `<b>${m.nombre}</b><small>${ESPECIES[m.especie].nombre}${edad}${pers ? ` · ${pers.icono} ${pers.nombre}` : ''}${m.estado === 'dormir' ? ' · 💤' : ''}</small>
    ${barra('🍖', m.hambre, '#f2a03c')}${barra('💕', m.felicidad, '#e58f9e')}${barra('⚡', m.energia, '#5a9fd6')}`;
}

function opcionesMascota(m) {
  const comida = inventario.cantidad('pienso');
  const chuches = inventario.cantidad('chuches');
  return [
    {
      icono: '💕', texto: 'Mimos', accion: () => {
        mascotas.acariciar(m);
        registrar('mimos');
        sonido.mascota();
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🍖', texto: comida ? `Comer ×${comida}` : 'Comer', accion: () => {
        if (!comida) return ofrecerCompra('pienso', `${m.nombre} tiene hambre`);
        inventario.usar('pienso', null, infoItem('pienso').usos);
        mascotas.alimentar(m);
        registrar('comer');
        sonido.mascota();
        ui.pintarInventario(inventario);
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🍬', texto: chuches ? `Premio ×${chuches}` : 'Premio', accion: () => {
        if (!chuches) return ofrecerCompra('chuches', `Sin chuches para ${m.nombre}`);
        inventario.usar('chuches', null, infoItem('chuches').usos);
        mascotas.premio(m);
        sonido.mascota();
        ui.pintarInventario(inventario);
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🎾', texto: 'Jugar', accion: () => {
        if (m.energia < 15) {
          ui.aviso(`${m.nombre} está muy cansado, dejadle dormir`, true);
          return;
        }
        mascotas.jugar(m);
        registrar('jugar');
        sonido.mascota();
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🎀', texto: 'Ropa', accion: () => elegirAccesorio(m)
    },
    {
      icono: '⭐', texto: 'Más', accion: () => mascotas2.abrir(m)
    },
    {
      icono: '✏️', texto: 'Nombre', accion: async () => {
        const nombre = await ui.pedirNombre({ imagen: miniaturas.mascota(m.especie), titulo: '¿Cómo se llama?', texto: '', sugerencias: [m.nombre, ...NOMBRES] });
        if (!nombre) return;
        m.nombre = nombre;
        guardar();
        refrescarMenu();
      }
    }
  ];
}

function elegirAccesorio(m) {
  const tengo = inventario.items.filter(i => infoItem(i.id) && infoItem(i.id).accesorio);
  const botones = tengo.map(i => {
    const info = infoItem(i.id);
    return {
      texto: `${ACCESORIOS[info.accesorio]}${i.cantidad > 1 ? ` (${i.cantidad})` : ''}`, tipo: 'primario', accion: () => {
        if (m.accesorio) {
          const viejo = Object.keys(ACCESORIOS).includes(m.accesorio) ? `acc-${m.accesorio}` : null;
          if (viejo) inventario.anadir(viejo, null);
        }
        inventario.quitar(i.id, i.color);
        m.accesorio = info.accesorio;
        ui.pintarInventario(inventario);
        sonido.arreglo();
        mascotas.eventos.particula('✨', m, 3);
        guardar();
      }
    };
  });
  if (m.accesorio) {
    botones.push({
      texto: `Quitar ${ACCESORIOS[m.accesorio].toLowerCase()}`, tipo: 'secundario', accion: () => {
        inventario.anadir(`acc-${m.accesorio}`, null);
        m.accesorio = null;
        ui.pintarInventario(inventario);
        sonido.pop();
        guardar();
      }
    });
  }
  botones.push({ texto: tengo.length ? 'Cerrar' : '🛒 Ir a la tienda', tipo: 'secundario', accion: tengo.length ? null : () => ui.abrirTienda('mascotas') });
  ui.dialogo({
    imagen: miniaturas.mascota(m.especie),
    titulo: `Ropa de ${m.nombre}`,
    texto: tengo.length ? 'Elige qué se pone:' : 'No tenéis accesorios. En la tienda (Mascotas) hay lazos, gorritos, gafas…',
    botones,
    columna: true
  });
}

function seleccionarMascota(m) {
  mascotaSel = m;
  refrescarMenu();
}

function refrescarMenu() {
  if (mascotaSel) ui.abrirMenu(opcionesMascota(mascotaSel), cabeceraMascota(mascotaSel));
  else if (controles && controles.seleccionado) ui.abrirMenu(opcionesMueble(controles.seleccionado));
  else ui.cerrarMenu();
}

async function adoptar(especie, gratis = false) {
  const e = ESPECIES[especie];
  if (!gratis && estado.monedas < e.precio) {
    sonido.error();
    ui.aviso('No os llega para adoptarlo', true);
    return false;
  }
  const nombre = await ui.pedirNombre({
    imagen: miniaturas.mascota(especie),
    titulo: `¡Un ${e.nombre.toLowerCase()} nuevo!`,
    texto: 'Ponedle un nombre bonito:',
    sugerencias: NOMBRES
  });
  if (!nombre) return false;
  if (!gratis) estado.monedas -= e.precio;
  ui.cerrarHojas();
  const m = mascotas.adoptar(especie, nombre);
  pareja.recordar(mascotas.lista.length === 1 ? 'mascota' : null, '🐾', `Adoptamos a ${nombre} (${e.nombre.toLowerCase()})`);
  sonido.premio();
  ui.aviso(`🏠 ¡Bienvenido a casa, ${nombre}!`);
  seleccionarMascota(m);
  refrescarHud();
  guardar();
  return true;
}

function mostrarPremio(premio) {
  if (premio.tipo === 'monedas') {
    sonido.premio();
    ui.dialogo({
      imagen: miniaturas.piezas('premio:monedas', PIEZAS_PREMIO.monedas),
      titulo: `¡+${premio.cantidad} monedas!`,
      texto: 'Directas a vuestra hucha.',
      botones: [{ texto: '¡Genial!', tipo: 'primario' }]
    });
  } else if (premio.tipo === 'ticket') {
    sonido.premio();
    ui.dialogo({
      imagen: miniaturas.piezas('premio:ticket', PIEZAS_PREMIO.ticket),
      titulo: '¡Un ticket extra!',
      texto: 'Podéis volver a tirar gratis.',
      botones: [{ texto: '¡Otra vez!', tipo: 'primario' }]
    });
  } else {
    const info = infoItem(premio.id);
    const r = RAREZAS[premio.rareza];
    const exclusivo = info.rareza && info.enTienda === false;
    sonido.premio();
    ui.dialogo({
      imagen: miniaturas.item(premio.id),
      etiqueta: { texto: r.nombre, color: r.color },
      titulo: info.nombre,
      texto: exclusivo ? '¡Exclusivo de la ruleta! Ya está en vuestro inventario.' : 'Ya está en vuestro inventario.',
      confeti: premio.rareza === 'epico' || premio.rareza === 'legendario',
      botones: [{ texto: '¡Qué bien!', tipo: 'primario' }]
    });
  }
}

const ui = new UI(miniaturas, {
  alSonido(nombre) {
    sonido[nombre]();
  },
  alPrimerToque() {
    sonido.desbloquear();
  },
  alAlternarSonido() {
    sonido.alternar();
  },
  alMas() {
    mas.abrir();
  },
  alHabitaciones() {
    abrirHabitaciones();
  },
  alAcogedor() {
    abrirAcogedor();
  },
  alOfertasExtra() {
    return vida.ofertasHoy();
  },
  alMercadillo() {
    return economia.mercadillo();
  },
  alHayPareja() {
    return sync && sync.activo;
  },
  alRegalar(info, color, precio) {
    pareja.regalar(info, color, precio);
  },
  alProponer(info, color, precio) {
    pareja.proponer(info, color, precio);
  },
  alDesear(info, color) {
    return pareja.alternarDeseo(info, color);
  },
  alEsDeseo(id) {
    return pareja ? pareja.esDeseo(id) : false;
  },
  alClima() {
    const t = temporadaActual();
    const climas = { sol: 'Hace sol', nubes: 'Está nublado', lluvia: 'Está lloviendo', nieve: '¡Está nevando!' };
    const prox = mas.proximaFecha();
    ui.aviso(`${ambiente.icono()} ${ambiente.textoHora()} · ${climas[ambiente.clima] || ''}${t ? ` · ${NOMBRE_TEMPORADA[t]}` : ''}${prox && prox.dias <= 30 ? ` · Faltan ${prox.dias} días para ${prox.texto}` : ''}`);
  },
  alComprar(info, color, precio, cantidad = 1) {
    return comprarDirecto(info.id, color, precio, cantidad);
  },
  alPedirMascotas() {
    return mascotas.lista;
  },
  alPedirMisiones() {
    return datosMisiones();
  },
  alInfoLimpieza() {
    const pct = suciedad.limpieza();
    const n = suciedad.lista.length;
    ui.aviso(n ? `🧹 Limpieza ${pct}% · ${n} cosa${n > 1 ? 's' : ''} por limpiar. ¡Tocadlas!` : '✨ ¡La casa está reluciente!');
  },
  alAdoptar(especie) {
    adoptar(especie);
  },
  alVerMascota(m) {
    ui.cerrarHojas();
    setTimeout(() => seleccionarMascota(m), 250);
  },
  alEstadoRuleta() {
    return { gratis: estado.gratis, tickets: estado.tickets };
  },
  alGirar() {
    if (estado.gratis) estado.gratis = false;
    else if (estado.tickets > 0) estado.tickets--;
    else if (estado.monedas >= COSTE_TIRADA) estado.monedas -= COSTE_TIRADA;
    else {
      sonido.error();
      ui.aviso('No tenéis tickets ni monedas suficientes', true);
      return null;
    }
    registrar('ruleta');
    const indice = elegirSegmento();
    const premio = resolverPremio(indice);
    if (premio.tipo === 'monedas') estado.monedas += premio.cantidad;
    else if (premio.tipo === 'ticket') estado.tickets += premio.cantidad;
    else inventario.anadir(premio.id, infoItem(premio.id).colores ? 0 : null);
    guardar();
    ui.monedas(estado.monedas - (premio.tipo === 'monedas' ? premio.cantidad : 0));
    ui.tickets(estado.tickets - (premio.tipo === 'ticket' ? premio.cantidad : 0));
    ui.tiradaGratis(estado.gratis);
    return { indice, premio };
  },
  alFinGiro(premio) {
    mostrarPremio(premio);
    ui.pintarInventario(inventario);
    refrescarHud();
  },
  alTocarItem(item, info) {
    if (info.mascota) {
      adoptar(info.mascota, true).then(ok => {
        if (!ok) return;
        inventario.quitar(item.id, item.color);
        ui.pintarInventario(inventario);
        guardar();
      });
      return;
    }
    ui.aviso(info.tipo === 'material' ? info.pista : `Arrastra ${info.nombre.toLowerCase()} hasta la habitación`);
  },
  alChipReparto() {
    const enPuerta = entregas.enPuerta();
    if (enPuerta.length) {
      for (const p of enPuerta) abrirPaquete(p);
      return;
    }
    const s = entregas.segundosProximo();
    if (s !== null) ui.aviso(`🚚 El próximo paquete llega en ${s} s`);
  },
  alEmpezarArrastre(item, info) {
    arrastre = { item, info };
    mascotaSel = null;
    controles.empezarColocacion(item, info);
  },
  alMoverArrastre(x, y, sobreBarra) {
    return controles.moverColocacion(x, y, sobreBarra);
  },
  alSoltarArrastre(x, y, cancelar) {
    const a = arrastre;
    arrastre = null;
    if (a && a.info && a.info.exterior && !exteriorActual() && !cancelar) {
      cancelar = true;
      ui.aviso('🌳 Esto va fuera: id a la terraza o al jardín', true);
    }
    const r = controles.soltarColocacion(x, y, cancelar);
    if (r.minijuego) {
      ui.pintarInventario(inventario);
      jugarMinijuego(r.minijuego);
      return;
    }
    if (r.ok) {
      if (a.info.tipo === 'material') inventario.usar(a.item.id, a.item.color, a.info.usos || 1);
      else inventario.quitar(a.item.id, a.item.color);
      if (r.suciedad) {
        sonido.arreglo();
        ui.particula('✨', x, y, 5);
        ui.aviso('✨ ¡Limpio!');
      } else if (a.info.tipo === 'material') {
        sonido.arreglo();
        ui.particula('✨', x, y, 6);
        ui.aviso(r.objetivo.tipo === 'pared' ? '🖌️ ¡Pared pintada!' : `✨ ${r.objetivo.d.mensaje}`);
        if (guia) guia.evento('arreglar');
      } else {
        sonido.colocar();
        registrar('colocar');
      }
      guardar();
    } else if (r.motivo) {
      sonido.error();
      ui.aviso(r.motivo, true);
    }
    ui.pintarInventario(inventario);
    refrescarHud();
  }
});

controles = new Controles(canvas, camaraIso, gestor, sala, mascotas, entregas, {
  distCuadro: r => (mas && !visitando ? mas.cuadros.distancia(r) : Infinity),
  tocarCuadro: r => (mas && !visitando ? mas.cuadros.tocar(r) : false),
  alAbrirPaquete(p) {
    abrirPaquete(p);
  },
  alPrimerToque() {
    sonido.desbloquear();
  },
  alSeleccionar(m) {
    if (m) {
      mascotaSel = null;
      sonido.tocar();
    }
    refrescarMenu();
  },
  alSeleccionarMascota(m) {
    if (m) {
      sonido.mascota();
      mascotas.eventos.particula('💗', m);
    }
    seleccionarMascota(m);
  },
  alCambiar() {
    sonido.colocar();
    guardar();
  },
  alAviso(texto, error) {
    if (error) sonido.error();
    ui.aviso(texto, error);
  },
  alTocarSuciedad(d) {
    sonido.pop();
    tocarSuciedad(d);
  },
  alTocarDesperfecto(obj) {
    sonido.pop();
    if (obj.tipo === 'pared') {
      const pintada = obj.pintura !== null && obj.pintura !== undefined;
      ui.dialogo({
        imagen: miniaturas.item('pintura-crema'),
        titulo: pintada ? 'Pared pintada' : 'Pared sin pintar',
        texto: pintada ? 'Podéis cambiarle el color cuando queráis con otro bote de pintura.' : 'Está gris y apagada. Con un bote de pintura quedará como nueva.',
        botones: [{ texto: 'Vale', tipo: 'secundario' }, { texto: '🖌️ Ver pinturas', tipo: 'primario', accion: () => ui.abrirTienda('reparar') }]
      });
      return;
    }
    const d = obj.d;
    const mat = infoItem(d.material);
    const tiene = inventario.cantidad(d.material);
    const pedido = entregas.cantidadPedida(d.material);
    const linea = tiene
      ? `Tenéis ${tiene}. Arrastradlo desde el inventario hasta aquí.`
      : pedido
        ? 'Ya lo habéis pedido. Llegará en un paquete a la puerta.'
        : `Cuesta 🪙 ${mat.precio} en la tienda.`;
    ui.dialogo({
      imagen: miniaturas.item(d.material),
      titulo: d.nombre,
      texto: d.descripcion,
      html: `<div class="necesita${tiene || pedido ? ' tienes-ya' : ''}">
        <div><b>${tiene ? '✅' : pedido ? '🚚' : '🛠️'} Necesitas: ${mat.nombre}</b>
        <small>${linea}</small></div></div>`,
      botones: tiene || pedido
        ? [{ texto: '¡Entendido!', tipo: 'primario' }]
        : [
            { texto: 'Ahora no', tipo: 'secundario' },
            { texto: `Pedir · 🪙 ${mat.precio}`, tipo: 'primario', desactivado: estado.monedas < mat.precio, accion: () => comprarDirecto(d.material) }
          ]
    });
  }
});


function tocarSuciedad(d) {
  const info = TIPOS_SUCIEDAD[d.tipo];
  const prod = infoItem(info.producto);
  const tiene = inventario.cantidad(info.producto);
  const pedido = entregas.cantidadPedida(info.producto);
  const expres = 40;
  const soluciones = {
    polvo: 'Un robot friegasuelos lo limpia solo. Robi, el robot de limpieza, también.',
    barro: 'Un robot friegasuelos lo limpia solo. Robi, el robot de limpieza, también.',
    caca: 'Con un arenero (gatos, conejos y hámsters) o un jardín (perros, patos, pingüinos y zorros) no volverá a pasar.',
    bichos: 'Una trampa para bichos los mantiene lejos para siempre.',
    telarana: 'Robi, el robot de limpieza, también las quita.'
  };
  const botones = [];
  if (tiene) {
    botones.push({
      texto: `🧽 Limpiar a mano (usa 1 de ${tiene})`, tipo: 'primario', accion: () => setTimeout(() => jugarMinijuego(d), 250)
    });
  } else if (!pedido) {
    botones.push({ texto: `Pedir ${prod.nombre.toLowerCase()} · 🪙 ${prod.precio}`, tipo: 'primario', desactivado: estado.monedas < prod.precio, accion: () => comprarDirecto(info.producto) });
  }
  botones.push({
    texto: `⚡ Que lo limpie Robi ya · 🪙 ${expres}`, tipo: 'rosa', desactivado: estado.monedas < expres, accion: () => {
      estado.monedas -= expres;
      sonido.arreglo();
      suciedad.eventos.particula('✨', d.grupo.position, 4);
      suciedad.limpiar(d, 'expres');
    }
  });
  botones.push({ texto: 'Ahora no', tipo: 'secundario' });
  ui.dialogo({
    imagen: miniaturas.item(info.producto),
    titulo: info.nombre,
    texto: d.tipo === 'caca' ? info.descripcion + ' 💩' : info.descripcion,
    html: `<div class="necesita${tiene || pedido ? ' tienes-ya' : ''}"><div><b>${tiene ? '✅' : pedido ? '🚚' : '🧽'} A mano: ${prod.nombre}</b>
      <small>${tiene ? 'Limpiad a mano con un minijuego, o arrastradlo encima.' : pedido ? 'Ya está pedido, llegará a la puerta.' : `Cuesta 🪙 ${prod.precio}.`}</small></div></div>
      <div class="solucion">💡 ${soluciones[d.tipo]}</div>`,
    botones,
    columna: true
  });
}

function contexto() {
  const est = sala.estado();
  return {
    arreglado: id => est.arreglos.includes(id),
    tieneMueble: id => gestor.muebles.some(m => m.userData.def.id === id),
    paredesPintadas: () => est.paredes.filter(p => p !== null && p !== undefined).length,
    numMascotas: () => mascotas.lista.length,
    numMuebles: () => idsEnCasa().filter(id => id !== 'colchon' && id !== 'caja').length,
    limpieza: () => suciedad.limpieza(),
    reformaCompleta: () => nivelCasa() > 0 || (estado.reforma || sala.progreso()).hechos >= (estado.reforma || sala.progreso()).total,
    reformaPct: () => nivelCasa() > 0 ? 1 : (estado.reforma || sala.progreso()).hechos / (estado.reforma || sala.progreso()).total,
    stat: e => (estado.stats && estado.stats[e]) || 0,
    fotosPared: () => (estado.cuadros || []).length,
    conPareja: () => sync && sync.activo,
    acogedor: () => acogedor().total,
    colecciones: () => (estado.colecciones || []).length,
    nivelCasa,
    racha: () => (estado.racha && estado.racha.n) || 0,
    hora: () => new Date().getHours(),
    trabajosDistintos: () => ((estado.trabajos && estado.trabajos.hechos) || []).length,
    trucosMax: () => Math.max(0, ...mascotas.lista.map(m => TRUCOS.filter(t => (m.trucos[t.id] || 0) >= 3).length)),
    tieneLegendario: () => idsEnCasa().concat(inventario.items.map(i => i.id)).some(id => infoItem(id) && infoItem(id).rareza === 'legendario')
  };
}

function idsEnCasa() {
  const ids = gestor.muebles.map(m => m.userData.def.id);
  (estado.habs || []).forEach((h, i) => {
    if (i !== (estado.habActual || 0) && h) for (const m of h.muebles || []) ids.push(m.id);
  });
  return ids;
}

function acogedor() {
  return calcularAcogedor({
    muebles: gestor.muebles.filter(m => !(m.userData.datos && m.userData.datos.mustia)),
    limpieza: suciedad.limpieza(),
    paredesPintadas: sala.estado().paredes.filter(p => p !== null && p !== undefined).length,
    fotos: mas ? mas.cuadros.enEstaHab().length : 0,
    mascotas: mascotas.lista.length,
    noche: ambiente.esNoche(),
    extras: casa2 ? casa2.extrasAcogedor(gestor.muebles) : []
  });
}

function exteriorActual() {
  const casa = CASAS[nivelCasa()];
  return EXTERIORES[habsCasa()[estado.habActual || 0]] || null;
}

function aplicarEstiloCasa() {
  const casa = CASAS[nivelCasa()];
  const hab = estado.habActual || 0;
  const ext = exteriorActual();
  sala.modoExterior(ext ? ext.tipo : null);
  sala.pintarSuelo(ext ? ext.suelo : casa.suelo);
  ui.ponerNivelCasa(nivelCasa());
  ambiente.vista = ['calle', 'calle', 'tejados', 'jardin', 'colinas'][nivelCasa()];
  if (nivelCasa() > 0) {
    sala.completarTodo();
    estado.reforma = { hechos: 10, total: 10 };
  }
  if (nivelCasa() > 0 || hab > 0) sala.pintarParedes(sala.estado().paredes, casa.pared);
  const pill = document.getElementById('pill-hab');
  pill.classList.toggle('oculto', habsCasa().length < 2);
  pill.textContent = `${casa.icono} ${habsCasa()[hab] || 'Salón'} ▾`;
  if (casa2) {
    casa2.aplicar();
    mas.cuadros.terminar(false);
    mas.pintarPared();
  }
}

function cambiarHabitacion(i) {
  const actual = estado.habActual || 0;
  if (i === actual) return;
  if (controles.seleccionado) controles.seleccionar(null);
  mascotaSel = null;
  ui.cerrarHojas();
  estado.habs = todasHabitaciones();
  for (const m of [...gestor.muebles]) gestor.quitar(m);
  suciedad.sincronizar([]);
  estado.habActual = i;
  const h = estado.habs[i];
  for (const d of [...h.muebles].sort((a, b) => a.base - b.base)) gestor.anadir(d.id, d.x0, d.z0, d.rot, d);
  for (const d of h.suciedad || []) suciedad.anadir(d.tipo, d, false);
  if (i === 0 && nivelCasa() === 0) {
    sala.pintarParedes(h.paredes, null);
  } else {
    sala.pintarParedes(h.paredes, CASAS[nivelCasa()].pared);
  }
  aplicarEstiloCasa();
  for (const m of mascotas.lista) {
    const c = mascotas.celdaLibreAlAzar(mascotas.bloqueadas());
    if (c) m.grupo.position.set((c[0] - 6 + 0.5) * 0.5, 0, (c[1] - 6 + 0.5) * 0.5);
    m.ruta = [];
    m.estado = 'quieto';
  }
  sonido.pop();
  ui.aviso(`${CASAS[nivelCasa()].icono} ${habsCasa()[i]}`);
  refrescarHud();
  guardar();
}

function abrirHabitaciones() {
  const casa = CASAS[nivelCasa()];
  const actual = estado.habActual || 0;
  ui.dialogo({
    titulo: `${casa.icono} ${casa.nombre}`,
    texto: '¿A qué habitación vamos?',
    botones: habsCasa().map((h, i) => ({ texto: `${i === actual ? '📍 ' : ''}${h}`, tipo: i === actual ? 'secundario' : 'primario', accion: () => setTimeout(() => cambiarHabitacion(i), 200) })),
    columna: true
  });
}

function abrirAcogedor() {
  const a = acogedor();
  ui.dialogo({
    titulo: `🕯️ Acogedor: ${a.total}/100`,
    texto: 'Lo cómoda y bonita que está esta habitación.',
    html: `<div class="acogedor-lista">${a.partes.map(p => `<div class="${p.valor >= p.max ? 'lleno' : ''}"><span>${p.texto}</span><i><b style="width:${Math.round(p.valor / p.max * 100)}%"></b></i>${p.valor < p.max ? `<small>💡 ${p.consejo}</small>` : ''}</div>`).join('')}</div>`,
    botones: [{ texto: '¡Vamos a mejorarla!', tipo: 'primario' }]
  });
}

function abrirCasas() {
  const nivel = nivelCasa();
  const a = acogedor().total;
  const reformada = contexto().reformaCompleta();
  const cuerpo = ui.abrirGen('Casas', `
    <p class="gen-intro">Cuando la casa esté acogedora y tengáis ahorros, podéis mudaros a una mejor. Os lleváis todos los muebles.</p>
    <div class="casas-lista">${CASAS.map((c, i) => {
      const estadoCasa = i < nivel ? 'pasada' : i === nivel ? 'actual' : i === nivel + 1 ? 'siguiente' : 'bloqueada';
      const faltan = [];
      if (estadoCasa === 'siguiente') {
        if (c.requisitoReforma && !reformada) faltan.push('reformar el piso');
        if (a < c.acogedor) faltan.push(`${c.acogedor} de acogedor (tenéis ${a})`);
        if (estado.monedas < c.precio) faltan.push(`🪙 ${c.precio}`);
      }
      return `<div class="casa-fila ${estadoCasa}"><span>${c.icono}</span><div><b>${c.nombre}</b><small>${c.habitaciones.length} ${c.habitaciones.length > 1 ? 'habitaciones' : 'habitación'} · ${c.habitaciones.join(', ')}</small>${estadoCasa === 'siguiente' ? (faltan.length ? `<small class="falta">Falta: ${faltan.join(' · ')}</small>` : `<button class="primario mudarse">🚚 Mudarse · 🪙 ${c.precio}</button>`) : ''}</div><em>${estadoCasa === 'actual' ? '📍 Aquí' : estadoCasa === 'pasada' ? '✅' : estadoCasa === 'bloqueada' ? '🔒' : ''}</em></div>`;
    }).join('')}</div>
    ${nivel === CASAS.length - 1 ? `<h4 class="gen-sub">🏗️ Ampliar la mansión</h4>
    <p class="gen-intro">Ya vivís en lo más alto, pero siempre se puede soñar más grande: añadid habitaciones nuevas.</p>
    <div class="casas-lista">${AMPLIACIONES.map(x => {
      const hecha = (estado.ampliaciones || []).includes(x.nombre);
      return `<div class="casa-fila ${hecha ? 'pasada' : 'siguiente'}"><span>${x.icono}</span><div><b>${x.nombre}</b>${hecha ? '<small>Ya es vuestra</small>' : estado.monedas >= x.precio ? `<button class="primario ampliar" data-n="${x.nombre}">🏗️ Construir · 🪙 ${x.precio}</button>` : `<small class="falta">Falta: 🪙 ${x.precio}</small>`}</div><em>${hecha ? '✅' : ''}</em></div>`;
    }).join('')}</div>` : ''}`, () => mas.abrir());
  const b = cuerpo.querySelector('.mudarse');
  if (b) b.addEventListener('click', () => mudarse(nivel + 1));
  cuerpo.querySelectorAll('.ampliar').forEach(x => x.addEventListener('click', () => ampliar(x.dataset.n)));
}

function ampliar(nombre) {
  const x = AMPLIACIONES.find(a => a.nombre === nombre);
  if (!x || estado.monedas < x.precio || (estado.ampliaciones || []).includes(nombre)) return;
  estado.monedas -= x.precio;
  estado.habs = todasHabitaciones();
  estado.ampliaciones = [...(estado.ampliaciones || []), nombre];
  estado.habs = todasHabitaciones();
  ui.cerrarHojas();
  refrescarHud();
  aplicarEstiloCasa();
  guardar();
  pareja.recordar(null, x.icono, `Construimos ${nombre.toLowerCase() === 'cine' ? 'un cine' : `la habitación «${nombre}»`} en la mansión`);
  sonido.premio();
  ui.dialogo({
    imagen: miniaturas.personaje('lola'), personaje: true,
    titulo: `${x.icono} ¡${nombre} terminado!`,
    texto: 'Los obreros ya han acabado. Id a la nueva habitación con el botón de arriba y decoradla a vuestro gusto.',
    confeti: true,
    botones: [{ texto: '¡A estrenarla!', tipo: 'primario' }]
  });
}

function mudarse(n) {
  const c = CASAS[n];
  if (estado.monedas < c.precio) return;
  estado.monedas -= c.precio;
  estado.habs = todasHabitaciones();
  if (!estado.casa) estado.casa = {};
  estado.casa.nivel = n;
  for (const h of estado.habs) h.suciedad = [];
  suciedad.sincronizar([]);
  while (estado.habs.length < c.habitaciones.length) estado.habs.push({ muebles: [], suciedad: [], paredes: [null, null, null, null] });
  if ((estado.habActual || 0) === 0) sala.pintarParedes(estado.habs[0].paredes, c.pared);
  aplicarEstiloCasa();
  ui.cerrarHojas();
  refrescarHud();
  guardar();
  registrar('mudanza');
  pareja.recordar(null, c.icono, `Nos mudamos a nuestro ${c.nombre.toLowerCase()}`);
  setTimeout(() => {
    sonido.premio();
    ui.dialogo({
      imagen: miniaturas.personaje('lola'), personaje: true,
      titulo: `¡Bienvenidos a vuestro ${c.nombre.toLowerCase()}! ${c.icono}`,
      texto: `Tenéis ${c.habitaciones.length} habitaciones: ${c.habitaciones.join(', ')}. Cambiad de habitación tocando el botón de arriba.`,
      confeti: true,
      botones: [{ texto: '¡Qué ilusión!', tipo: 'primario' }]
    });
    setTimeout(() => mas.anadirDiario(`Nos mudamos: ${c.nombre}`, true), 1500);
  }, 400);
}

function abrirLogros() {
  const hechos = estado.logros || [];
  const normales = LOGROS.filter(l => !l.secreto);
  const secretos = LOGROS.filter(l => l.secreto);
  const fila = l => {
    const ok = hechos.includes(l.id);
    if (l.secreto && !ok) return '<div class="logro secreto"><span>❔</span><div><b>???</b><small>Logro secreto. ¡Seguid jugando!</small></div></div>';
    return `<div class="logro ${ok ? 'hecho' : ''}"><span>${ok ? l.icono : '🔒'}</span><div><b>${l.nombre}</b><small>${l.texto}</small></div></div>`;
  };
  ui.abrirGen('Logros', `
    <p class="gen-intro">${hechos.length} de ${LOGROS.length} conseguidos</p>
    <div class="logros">${normales.map(fila).join('')}</div>
    <h4 class="gen-sub">🤫 Secretos (${secretos.filter(l => hechos.includes(l.id)).length} de ${secretos.length})</h4>
    <div class="logros">${secretos.map(fila).join('')}</div>`, () => abrirObjetivos());
}

function abrirColecciones() {
  const ids = idsEnCasa();
  const hechas = estado.colecciones || [];
  ui.abrirGen('Colecciones', `
    <p class="gen-intro">Colocad en casa todas las piezas de una colección para ganar el premio.</p>
    ${COLECCIONES.map(c => `<div class="coleccion ${hechas.includes(c.id) ? 'hecha' : ''}">
      <div class="col-cab"><b>${c.icono} ${c.nombre}</b><em>${hechas.includes(c.id) ? '✅ Completa' : `🪙 ${c.premio.monedas} · 🎟️ ${c.premio.tickets}`}</em></div>
      <div class="col-items">${c.items.map(id => `<div class="${ids.includes(id) ? 'tiene' : ''}"><img src="${miniaturas.item(id, 0)}" alt=""><small>${infoItem(id).nombre}</small></div>`).join('')}</div>
    </div>`).join('')}`, () => abrirObjetivos());
}

function revisarProgreso() {
  if (dialogoAbierto() || visitando) return;
  estado.puntuacion = acogedor().total;
  const c = contexto();
  if (!estado.logros) estado.logros = [];
  for (const l of LOGROS) {
    if (estado.logros.includes(l.id)) continue;
    let ok = false;
    try {
      ok = l.check(c);
    } catch (e) {}
    if (!ok) continue;
    estado.logros.push(l.id);
    estado.monedas += l.secreto ? 80 : 30;
    sonido.premio();
    ui.aviso(l.secreto ? `🤫 ¡Logro secreto! ${l.icono} ${l.nombre} (+80 🪙)` : `🏆 Logro: ${l.nombre} (+30 🪙)`);
    refrescarHud();
    guardar();
    return;
  }
  if (!estado.colecciones) estado.colecciones = [];
  for (const col of coleccionesCompletas(idsEnCasa())) {
    if (estado.colecciones.includes(col.id)) continue;
    estado.colecciones.push(col.id);
    pareja.recordar(null, col.icono, `Completamos la colección ${col.nombre}`);
    estado.monedas += col.premio.monedas;
    estado.tickets += col.premio.tickets;
    refrescarHud();
    guardar();
    sonido.premio();
    ui.dialogo({
      titulo: `📚 ¡Colección completa! ${col.icono}`,
      texto: `${col.nombre}: +${col.premio.monedas} monedas y ${col.premio.tickets} ticket${col.premio.tickets > 1 ? 's' : ''}.`,
      confeti: true,
      botones: [{ texto: '¡Toma ya!', tipo: 'primario' }]
    });
    return;
  }
  const a = acogedor().total;
  if (!estado.acogedorPremios) estado.acogedorPremios = [];
  for (const umbral of [50, 70, 90]) {
    if (a >= umbral && !estado.acogedorPremios.includes(umbral)) {
      estado.acogedorPremios.push(umbral);
      estado.tickets += 1;
      refrescarHud();
      guardar();
      sonido.premio();
      ui.aviso(`🕯️ ¡${umbral} de acogedor! +1 ticket`);
      return;
    }
  }
}

function asegurarDiarias() {
  const hoy = new Date().toDateString();
  if (!estado.diarias || estado.diarias.dia !== hoy) {
    estado.diarias = { dia: hoy, lista: nuevasDiarias(mascotas.lista.length > 0) };
  }
}

function registrar(evento, n = 1) {
  if (pareja) pareja.registrar(evento);
  if (guia) guia.evento(evento);
  if (!estado.stats) estado.stats = {};
  estado.stats[evento] = (estado.stats[evento] || 0) + n;
  asegurarDiarias();
  for (const d of estado.diarias.lista) {
    const info = infoDiaria(d.id);
    if (!info || info.evento !== evento || d.reclamada || d.progreso >= info.meta) continue;
    d.progreso = Math.min(info.meta, d.progreso + n);
    if (d.progreso >= info.meta) {
      setTimeout(() => {
        sonido.premio();
        ui.aviso(`📋 ¡Misión cumplida: ${info.texto}!`);
      }, 900);
    }
  }
  ui.contadorMisiones(misionesListas());
}

function darPremio(premio) {
  if (premio.monedas) estado.monedas = Math.max(0, estado.monedas + premio.monedas);
  if (premio.tickets) estado.tickets += premio.tickets;
  let item = null;
  if (premio.item) {
    const pool = poolDe(premio.item);
    item = pool[Math.floor(Math.random() * pool.length)];
    inventario.anadir(item, infoItem(item).colores ? 0 : null);
    ui.pintarInventario(inventario);
  }
  refrescarHud();
  guardar();
  return item;
}

function misionesListas() {
  asegurarDiarias();
  let n = estado.diarias.lista.filter(d => !d.reclamada && d.progreso >= (infoDiaria(d.id)?.meta ?? 1)).length;
  const h = HISTORIA[estado.historia];
  if (h && h.check(contexto())) n++;
  return n;
}

function restanteTexto(ms) {
  const h = Math.max(0, Math.floor(ms / 3600000));
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d} día${d > 1 ? 's' : ''} y ${h % 24} h`;
  const m = Math.max(0, Math.floor(ms / 60000) % 60);
  return `${h} h ${m} min`;
}

function iniciarEvento(idx, avisar) {
  const ev = EVENTOS[idx % EVENTOS.length];
  estado.evento = { idx: idx % EVENTOS.length, fin: Date.now() + ev.dias * 86400000 };
  guardar();
  if (avisar) {
    ui.dialogo({
      imagen: miniaturas.personaje(ev.personaje), personaje: true,
      titulo: ev.titulo,
      texto: ev.texto,
      botones: [{ texto: '¡Nos ponemos a ello!', tipo: 'primario' }]
    });
  }
}

function enMenu() {
  const i = document.getElementById('inicio');
  return !!i && i.style.display !== 'none' && !i.classList.contains('fuera');
}

function dialogoAbierto() {
  return enMenu() || document.getElementById('dialogo').classList.contains('abierto') || !document.getElementById('juego').classList.contains('oculto') || !!document.getElementById('foto-editor') || visitando;
}

function comprobarEvento() {
  if (!estado.bienvenida || dialogoAbierto()) return;
  if (!estado.evento && guia && guia.activa()) return;
  if (!estado.evento) {
    iniciarEvento(0, true);
    return;
  }
  if (Date.now() < estado.evento.fin) return;
  const ev = EVENTOS[estado.evento.idx];
  const { total } = puntuacion(ev, contexto());
  const res = ev.resultados.find(r => total >= r.min);
  const siguiente = estado.evento.idx + 1;
  iniciarEvento(siguiente, false);
  const item = darPremio(res.premio);
  sonido.premio();
  ui.dialogo({
    imagen: miniaturas.personaje(ev.personaje), personaje: true,
    etiqueta: { texto: `${total}/100`, color: total >= 80 ? '#6cc08a' : total >= 50 ? '#f2a03c' : '#e57373' },
    titulo: res.titulo,
    texto: res.texto + (item ? ` (${infoItem(item).nombre})` : ''),
    confeti: total >= 80,
    botones: [{
      texto: 'Vale', tipo: 'primario', accion: () => setTimeout(() => {
        const nuevo = EVENTOS[estado.evento.idx];
        ui.dialogo({
          imagen: miniaturas.personaje(nuevo.personaje), personaje: true,
          titulo: nuevo.titulo, texto: nuevo.texto,
          botones: [{ texto: '¡Nos ponemos a ello!', tipo: 'primario' }]
        });
      }, 400)
    }]
  });
}

function textoChipEvento() {
  if (!estado.evento) return null;
  const ev = EVENTOS[estado.evento.idx];
  const dias = Math.ceil((estado.evento.fin - Date.now()) / 86400000);
  if (dias > 2) return null;
  return `${ev.id === 'mama' ? '👵' : '🎉'} ${ev.id === 'mama' ? 'Mamá' : 'Fiesta'} en ${dias} d`;
}

function datosMisiones() {
  asegurarDiarias();
  const c = contexto();
  let evento = null;
  if (estado.evento) {
    const ev = EVENTOS[estado.evento.idx];
    const p = puntuacion(ev, c);
    evento = {
      personaje: ev.personaje, titulo: ev.titulo, texto: ev.texto,
      restante: `Faltan ${restanteTexto(estado.evento.fin - Date.now())}`,
      puntos: p.total,
      detalle: `Reforma ${Math.round(p.partes.reforma * 100)}% · Limpieza ${Math.round(p.partes.limpieza * 100)}% · Muebles ${c.numMuebles()}/${ev.objetivoMuebles}`
    };
  }
  const iconos = { limpiar: '🧹', colocar: '🛋️', pedido: '📦', ruleta: '🎡', paquete: '🎁', mimos: '💕', comer: '🍖', jugar: '🎾', caca: '💩' };
  const diarias = estado.diarias.lista.map(d => {
    const info = infoDiaria(d.id);
    const lista = d.progreso >= info.meta;
    return {
      icono: iconos[d.id] || '⭐', texto: info.texto, progreso: d.progreso, meta: info.meta,
      premioTexto: textoPremio(info.premio),
      estado: d.reclamada ? 'hecha' : lista ? 'lista' : 'curso',
      accion: () => {
        d.reclamada = true;
        sonido.premio();
        darPremio(info.premio);
        ui.aviso(`🎉 ${textoPremio(info.premio)}`);
      }
    };
  });
  const h = HISTORIA[estado.historia];
  const historia = h ? {
    icono: '🏠', texto: `${estado.historia + 1}/${HISTORIA.length} · ${h.texto}`, progreso: 0, meta: 1,
    premioTexto: textoPremio(h.premio),
    estado: h.check(c) ? 'lista' : 'curso',
    accion: () => {
      estado.historia++;
      sonido.premio();
      darPremio(h.premio);
      ui.aviso(`🎉 ${textoPremio(h.premio)}`);
    }
  } : null;
  return { evento, diarias, historia };
}

controles.suciedad = suciedad;

function temporadaActual() {
  const forzada = new URLSearchParams(location.search).get('temporada');
  if (forzada) return forzada;
  return temporada(new Date(), estado.pareja && estado.pareja.aniversario);
}

mas = new Mas({
  estado, ui, sonido, sala, ambiente, renderer, escena, camara: camaraIso.camara, lofi,
  claveHab: () => `${nivelCasa()}-${estado.habActual || 0}`,
  controles: () => controles,
  registrar: e => registrar(e),
  abrirInicio: () => { ui.cerrarHojas(); inicio.mostrar(); },
  alFotoNueva: f => sync && sync.subirFoto(f),
  alFotoBorrada: id => sync && sync.borrarFoto(id),
  guardar: () => guardar(),
  temporada: () => temporadaActual(),
  instantanea: () => instantanea(),
  aplicarRemoto: (d, c, i) => aplicarRemoto(d, c, i),
  mascotas: () => mascotas.lista,
  datosPareja: () => ({ activo: !!(sync && sync.activo), codigo: sync && sync.codigo, yo: sync ? sync.yo : 0 }),
  extrasMenu: () => (window.extrasMenu ? window.extrasMenu() : [])
});

const juegos = new Juegos({ sonido, miniaturas });

function ganar(n, m = null, emoji = '🪙') {
  estado.monedas += n;
  sonido.premio();
  if (m) {
    const p = pantalla(new THREE.Vector3(m.position.x, m.userData.base + m.userData.alto + 0.2, m.position.z));
    ui.particula(emoji, p.x, p.y, 4);
  }
  ui.aviso(`${emoji} +${n} monedas`);
  refrescarHud();
  guardar();
}

const usos = new Usos({
  estado, ui, sonido, gestor, mascotas, miniaturas, escena,
  cosecha: () => (casa2 ? casa2.cosecha() : []),
  guardar: () => guardar(),
  refrescarMenu: () => refrescarMenu(),
  registrar: e => registrar(e),
  ganar,
  particulaEn(m, emoji, n = 2) {
    const p = pantalla(new THREE.Vector3(m.position.x, m.userData.base + m.userData.alto + 0.15, m.position.z));
    ui.particula(emoji, p.x, p.y, n);
  }
});

function partidasHoy() {
  const hoy = new Date().toDateString();
  if (!estado.juegosHoy || estado.juegosHoy.dia !== hoy) estado.juegosHoy = { dia: hoy, n: {} };
  return estado.juegosHoy.n;
}

function abrirJuegos() {
  const n = partidasHoy();
  const cuerpo = ui.abrirGen('Minijuegos', `
    <p class="gen-intro">Jugad juntos o por turnos para ganar monedas. Las ${PARTIDAS_PREMIADAS} primeras partidas de cada juego al día dan el premio completo.</p>
    <div class="lista-juegos">${[...JUEGOS, ...JUEGOS_DOS].map(j => {
      const hechas = n[j.id] || 0;
      return `<button class="juego-fila" data-id="${j.id}"><span>${j.icono}</span><div><b>${j.nombre}</b><small>${j.texto}</small></div><em>🪙 ${hechas < PARTIDAS_PREMIADAS ? `hasta ${j.premio}` : `hasta ${Math.round(j.premio * 0.3)}`}<br><i>${Math.min(hechas, PARTIDAS_PREMIADAS)}/${PARTIDAS_PREMIADAS} hoy</i></em></button>`;
    }).join('')}</div>`, () => abrirGanar());
  cuerpo.querySelectorAll('.juego-fila').forEach(b => b.addEventListener('click', async () => {
    const j = [...JUEGOS, ...JUEGOS_DOS].find(x => x.id === b.dataset.id);
    ui.cerrarHojas();
    let imagen = null;
    if (j.id === 'puzzle') imagen = mas.fotos.length && Math.random() < 0.7 ? mas.fotos[Math.floor(Math.random() * mas.fotos.length)].data : mas.capturar(600).toDataURL('image/jpeg', 0.85);
    const puntos = await juegos.jugar(j.id, { imagen });
    if (puntos === null || puntos === undefined) return;
    const veces = partidasHoy();
    veces[j.id] = (veces[j.id] || 0) + 1;
    const factor = veces[j.id] <= PARTIDAS_PREMIADAS ? 1 : 0.3;
    const premio = Math.max(5, Math.round(j.premio * puntos * factor));
    registrar('minijuego');
    ganar(premio, null, j.icono);
  }));
}

const toquesPareja = [];
function mostrarReaccion(emoji, de) {
  const el = document.createElement('div');
  el.className = 'reaccion-grande';
  el.textContent = emoji;
  el.style.left = `${30 + Math.random() * 40}%`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
  if (de !== undefined && de !== sync.yo) {
    sonido.mascota();
    ui.aviso(`${emoji} ${pareja.nombre(de)}`);
  }
}

function marcaToque(x, z, de) {
  const lienzo = document.createElement('canvas');
  lienzo.width = 128;
  lienzo.height = 128;
  const c = lienzo.getContext('2d');
  c.font = '84px serif';
  c.textAlign = 'center';
  c.fillText('💗', 64, 86);
  c.font = '900 30px Nunito, sans-serif';
  c.fillStyle = '#fff';
  c.fillText((pareja.nombre(de) || '?')[0].toUpperCase(), 64, 74);
  const tex = new THREE.CanvasTexture(lienzo);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(0.45, 0.45, 1);
  sprite.position.set(x, 0.35, z);
  sprite.renderOrder = 10;
  escena.add(sprite);
  toquesPareja.push({ sprite, t: 0 });
}

function animarToques(dt) {
  for (const k of [...toquesPareja]) {
    k.t += dt;
    k.sprite.position.y += dt * 0.25;
    k.sprite.material.opacity = Math.max(0, 1 - k.t / 1.6);
    if (k.t > 1.6) {
      escena.remove(k.sprite);
      k.sprite.material.map.dispose();
      k.sprite.material.dispose();
      toquesPareja.splice(toquesPareja.indexOf(k), 1);
    }
  }
}

sync = new Sync({
  instantanea,
  aplicar: (datos, conflicto) => aplicarRemoto(datos, conflicto),
  mensaje: m => {
    if (m.tipo === 'reaccion' && m.datos && Date.now() - Date.parse(m.creado) < 60000) mostrarReaccion(m.datos.emoji, m.datos.de);
    if (m.tipo === 'buenasnoches' && m.datos && Date.now() - Date.parse(m.creado) < 600000) pareja2.recibirBuenasNoches(m.datos.de);
    if (m.tipo === 'visita' && social) social.recibir(m);
  },
  directo: (evento, datos) => {
    if (evento === 'reaccion') mostrarReaccion(datos.emoji, datos.de);
    if (evento === 'toque') marcaToque(datos.x, datos.z, datos.de);
    if (evento === 'buenasnoches') pareja2.recibirBuenasNoches(datos.de);
  }
});

let ultimoToque = 0;
const rayoToque = new THREE.Raycaster();
const sueloToque = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
renderer.domElement.addEventListener('pointerdown', e => {
  if (!sync.activo || !sync.enDirecto || performance.now() - ultimoToque < 350) return;
  ultimoToque = performance.now();
  const r = renderer.domElement.getBoundingClientRect();
  rayoToque.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camaraIso.camara);
  const p = new THREE.Vector3();
  if (rayoToque.ray.intersectPlane(sueloToque, p) && Math.abs(p.x) < 3.2 && Math.abs(p.z) < 3.2) sync.emitir('toque', { x: +p.x.toFixed(2), z: +p.z.toFixed(2) });
});

function pintarBotonReaccion() {
  document.getElementById('btn-reaccion').classList.toggle('oculto', !sync.activo);
}
document.getElementById('btn-reaccion').addEventListener('click', () => {
  document.getElementById('reacciones').classList.toggle('oculto');
});
document.querySelectorAll('#reacciones button').forEach(b => b.addEventListener('click', () => {
  document.getElementById('reacciones').classList.add('oculto');
  if (b.classList.contains('dormir')) {
    pareja2.buenasNoches();
    return;
  }
  mostrarReaccion(b.textContent);
  sync.emitir('reaccion', { emoji: b.textContent });
  if (window.avisarPareja) window.avisarPareja('reaccion', `${b.textContent} Te está pensando`);
}));
window.avisarPareja = (tipo, texto) => {
  if (!sync || !sync.activo || !sync.codigo) return;
  const yo = sync.yo;
  const nombre = (estado.pareja && estado.pareja.nombres && estado.pareja.nombres[yo]) || 'Tu pareja';
  avisos.enviar(sync.codigo, yo, tipo, `💗 ${nombre}`, texto);
};
window.avisos = avisos;
setTimeout(() => sync && sync.activo && avisos.renovar(sync.codigo, sync.yo), 8000);

const TURNO_GEN = 120000;
function soyGenerador() {
  if (!sync || !sync.activo) return true;
  const g = estado.generador;
  return !g || g.hasta < Date.now() || g.yo === sync.yo;
}
function turnoGenerador() {
  if (visitando) return;
  if (sync && sync.activo && soyGenerador()) {
    const g = estado.generador;
    const ahora = Date.now();
    if (!g || g.yo !== sync.yo || g.hasta - ahora < TURNO_GEN / 2) {
      estado.generador = { yo: sync.yo, hasta: ahora + TURNO_GEN };
      guardar();
    }
  }
  const si = soyGenerador();
  suciedad.genera = si;
  mascotas.trastadas = si;
}
turnoGenerador();
setInterval(turnoGenerador, 15000);

pareja = new Pareja({
  estado, ui, sonido, sync, miniaturas, inventario, infoItem,
  piezasRegalo: PIEZAS_PREMIO.regalo(0xe58f9e),
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  dialogoAbierto: () => dialogoAbierto(),
  comprar: (id, color, precio) => comprarDirecto(id, color, precio),
  instantanea,
  aplicarRemoto,
  abrirMas: () => mas.abrir(),
  abrirInicio: () => { ui.cerrarHojas(); inicio.mostrar(); },
  alDesconectar: () => { suciedad.genera = true; pintarBotonReaccion(); },
  alConectar: () => { pintarBotonReaccion(); sync.conectarDirecto(); pareja.recordar('pareja', '💑', 'Conectamos nuestras casas'); }
});
usos.ctx.pareja = pareja;
const pareja2 = new Pareja2({
  estado, ui, sonido, sync, pareja,
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  dialogoAbierto: () => dialogoAbierto(),
  abrirMas: () => abrirNosotros()
});
usos.ctx.pareja2 = pareja2;
pintarBotonReaccion();
sync.conectarDirecto();

function ponerMiNombre(nombre, yo) {
  if (!nombre) return;
  if (!estado.pareja) estado.pareja = { nombres: ['', ''], aniversario: '', cumples: ['', ''], casa: 'Nuestro Hogar' };
  if (!estado.pareja.nombres[yo]) estado.pareja.nombres[yo] = nombre;
}

const inicio = new Inicio({
  sync, ui, sonido,
  resumen() {
    const n = nivelCasa();
    const p = estado.pareja || {};
    const nombres = (p.nombres || []).filter(Boolean).join(' & ');
    const novedades = [];
    try {
      if (nuevoDia) novedades.push({ i: '🎁', t: 'Regalo' });
    } catch (e) {}
    if (trabajos && trabajos.turnosHoy() < 3) novedades.push({ i: trabajos.delDia().icono, t: 'Trabajo' });
    if (mascotas.lista.length) {
      const triste = mascotas.lista.some(m => m.hambre < 40 || m.felicidad < 40);
      novedades.push({ i: triste ? '🥺' : '🐾', t: triste ? '¡Hambre!' : `${mascotas.lista.length}` });
    }
    try {
      if (vida && vida.noLeidas()) novedades.push({ i: '✉️', t: `${vida.noLeidas()}` });
      if (pareja2 && pareja2.pendientePregunta()) novedades.push({ i: '💕', t: 'Pregunta' });
      const f = mas.proximaFecha();
      if (f && f.dias <= 14) novedades.push({ i: f.dias === 0 ? '🎉' : '📅', t: f.dias === 0 ? '¡Hoy!' : `${f.dias} d` });
    } catch (e) {}
    return {
      nivel: n, icono: CASAS[n].icono, nombreNivel: CASAS[n].nombre,
      casa: p.casa || 'Nuestro Hogar', nombres,
      monedas: estado.monedas || 0,
      racha: sync && sync.activo ? rachaPareja() : (estado.racha && estado.racha.n) || 0,
      acogedor: estado.puntuacion || acogedor().total,
      novedades: novedades.slice(0, 5)
    };
  },
  codigoLocal: () => sync.codigo || null,
  instantanea: (nombre, yo) => {
    ponerMiNombre(nombre, yo);
    return instantanea();
  },
  async conectar(codigo, yo, nombre, recienCreada) {
    if (recienCreada) {
      sync.usar(codigo, yo, 1);
    } else if (sync.codigo !== codigo || !sync.activo) {
      const datos = await sync.unirse(codigo, yo);
      if (!datos) throw new Error('sin casa');
      aplicarRemoto(datos, false, true);
    } else {
      sync.conf.yo = yo;
      sync.guardarConf();
      await sync.traer();
    }
    ponerMiNombre(nombre, yo);
    turnoGenerador();
    mas.montarCartel();
    guardar();
    pintarBotonReaccion();
    sync.conectarDirecto();
    pareja.recordar('pareja', '💑', 'Estrenamos nuestra casa compartida');
    sincronizarFotos();
  },
  cerrarSesion() {
    sync.salir();
    for (const k of ['hogar-estado', 'hogar-fotos', 'hogar-diario', 'hogar-vistos', 'hogar-sync']) localStorage.removeItem(k);
    location.reload();
  }
});
inicio.mostrar();
setTimeout(() => {
  const carga = document.getElementById('carga');
  if (!carga) return;
  carga.classList.add('fuera');
  setTimeout(() => carga.remove(), 600);
}, 350);

async function sincronizarFotos() {
  if (!sync.activo) return;
  const r = await sync.listaFotos(mas.fotos.map(f => f.id));
  if (r) {
    const locales = mas.fotos.filter(f => !r.todas.includes(f.id));
    for (const f of locales) sync.subirFoto(f);
    if (locales.length) r.todas.push(...locales.map(f => f.id));
    mas.fusionarFotos(r);
  }
}

function tileHtml(t) {
  return `<button class="mas-tile${t.bloqueo ? ' bloqueado' : ''}" data-id="${t.id}"><span>${t.bloqueo ? '🔒' : t.icono}</span><b>${t.texto}</b><small>${t.bloqueo || t.sub}</small>${!t.bloqueo && t.insignia ? `<i class="insignia">${t.insignia}</i>` : ''}</button>`;
}

function abrirHub(titulo, tiles, volver = () => mas.abrir()) {
  const cuerpo = ui.abrirGen(titulo, `<div class="mas-rejilla">${tiles.map(tileHtml).join('')}</div>`, volver);
  cuerpo.querySelectorAll('.mas-tile').forEach(b => b.addEventListener('click', () => {
    const t = tiles.find(x => x.id === b.dataset.id);
    if (t.bloqueo) {
      sonido.error();
      return ui.aviso(`🔒 ${t.bloqueo}`, true);
    }
    sonido.tocar();
    t.accion();
  }));
}

function bloqueoSi(cond, texto) {
  return cond ? null : texto;
}

function abrirGanar() {
  abrirHub('Ganar monedas', [
    { id: 'trabajos', icono: '💼', texto: 'Trabajo del día', sub: `${trabajos.delDia().icono} ${trabajos.delDia().nombre} · ${Math.max(0, 3 - trabajos.turnosHoy())} turnos`, insignia: trabajos.turnosHoy() < 3 ? '!' : null, accion: () => trabajos.abrir() },
    { id: 'juegos', icono: '🎮', texto: 'Minijuegos', sub: 'Cocina rápida, parejas, puzzle y duelos', accion: abrirJuegos }
  ]);
}

function abrirObjetivos() {
  abrirHub('Objetivos', [
    { id: 'pase', icono: '🗓️', texto: 'Pase del mes', sub: `${economia.pase().reclamados.length} de 10 tareas`, insignia: economia.pendientesPase() || null, accion: () => economia.abrirPase() },
    { id: 'logros', icono: '🏆', texto: 'Logros', sub: `${(estado.logros || []).length} de ${LOGROS.length}`, accion: abrirLogros },
    { id: 'colecciones', icono: '📚', texto: 'Colecciones', sub: `${(estado.colecciones || []).length} de ${COLECCIONES.length} completas`, accion: abrirColecciones }
  ]);
}

window.abrirGanar = () => abrirGanar();
window.abrirObjetivos = () => abrirObjetivos();
window.abrirNosotros = () => abrirNosotros();

window.extrasMenu = () => {
  const nivel = nivelCasa();
  const h = estado.historia || 0;
  const tieneCocina = gestor.muebles.some(m => m.userData.def.id === 'cocina') || (estado.habs || []).some(x => (x.muebles || []).some(d => d.id === 'cocina'));
  return [
    { id: 'buzon', icono: '📬', texto: 'Buzón', sub: vida.noLeidas() ? `${vida.noLeidas()} carta${vida.noLeidas() > 1 ? 's' : ''} sin leer` : 'Cartas, postales y ofertas', insignia: vida.noLeidas() || null, accion: () => vida.abrirCorreo() },
    { id: 'nosotros', icono: '💕', texto: 'Nosotros', sub: 'Notas, regalos, preguntas, viajes y recuerdos', insignia: pareja2.pendientePregunta() ? '!' : null, accion: abrirNosotros },
    { id: 'ganar', icono: '💼', texto: 'Ganar monedas', sub: `Hoy: ${trabajos.delDia().icono} ${trabajos.delDia().nombre} · minijuegos`, insignia: trabajos.turnosHoy() < 3 ? '!' : null, accion: abrirGanar },
    { id: 'objetivos', icono: '🏆', texto: 'Objetivos', sub: 'Pase del mes, logros y colecciones', insignia: economia.pendientesPase() || null, accion: abrirObjetivos },
    { id: 'casas', icono: CASAS[nivel].icono, texto: 'Casas', sub: nivel < CASAS.length - 1 ? `Siguiente: ${CASAS[nivel + 1].nombre}` : 'Lo más alto', accion: abrirCasas },
    { id: 'reformas', icono: '🪵', texto: 'Reformas', sub: 'Suelos, papel pintado, ventanas y luces LED', bloqueo: bloqueoSi(nivel >= 1 || h >= 4, 'Arreglad las grietas y la humedad'), accion: () => casa2.abrirReformas() },
    { id: 'cocina', icono: '🍳', texto: 'Cocina', sub: `${Object.values(estado.despensa || {}).reduce((a, b) => a + b, 0)} ingredientes · ${casa2.totalPlatos()} platos`, bloqueo: bloqueoSi(nivel >= 2 || tieneCocina, 'Comprad una cocina o mudaos al ático'), accion: () => casa2.abrirCocina(null) },
    { id: 'amigos', icono: '🏘️', texto: 'Amigos', sub: 'Visitad casas, ranking y fiestas', bloqueo: bloqueoSi(nivel >= 1 || h >= 6, 'Avanzad en la historia (6/10)'), accion: () => social.abrir() },
    { id: 'taller', icono: '🔨', texto: 'Taller', sub: 'Reciclar, fabricar y encargos a medida', bloqueo: bloqueoSi(nivel >= 1 || h >= 8, 'Avanzad en la historia (8/10)'), accion: () => economia.abrirTaller() },
    { id: 'reto', icono: '🎨', texto: 'Reto de decoración', sub: '10 minutos y tu pareja puntúa', bloqueo: bloqueoSi(nivel >= 1, 'Mudaos al piso reformado'), accion: () => (estado.reto && !estado.reto.terminado ? verReto() : empezarReto()) }
  ];
};

const vida = new Vida({
  estado, ui, sonido, gestor, mascotas, miniaturas, escena, ambiente, inventario, juegos,
  pantalla: v => pantalla(v),
  particula: (emoji, m, n) => mascotas.eventos.particula(emoji, m, n),
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  registrar: e => registrar(e),
  dialogoAbierto: () => dialogoAbierto(),
  acogedor: () => acogedor().total,
  recordar: (...a) => pareja.recordar(...a),
  abrirMas: () => mas.abrir(),
  chip: () => pintarChipsVida()
});

const economia = new Economia({
  estado, ui, sonido, miniaturas, inventario, entregas,
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  abrirMas: () => mas.abrir()
});
ui.ponerMercadillo(economia.esFinde());

casa2 = new Casa2({
  estado, ui, sonido, sala, gestor, juegos, inventario, miniaturas, escena, ambiente, mascotas,
  nivelCasa,
  nombreHabitacion: () => habsCasa()[estado.habActual || 0] || 'Salón',
  aplicarEstilo: () => aplicarEstiloCasa(),
  idsEnCasa: () => idsEnCasa(),
  genera: () => soyGenerador(),
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  refrescarMenu: () => refrescarMenu(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  ganar,
  chip: () => pintarChipsVida(),
  abrirMas: () => mas.abrir()
});

mascotas2 = new Mascotas2({
  estado, ui, sonido, mascotas, juegos, inventario, miniaturas,
  adoptar: (e, g) => adoptar(e, g),
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  ganar,
  chip: () => pintarChipsVida(),
  cerrar: () => { ui.cerrarHojas(); refrescarMenu(); }
});

social = new Social({
  estado, ui, sonido, sync, gestor, mascotas, miniaturas, escena, casa2,
  pantalla: v => pantalla(v),
  acogedor: () => acogedor().total,
  habitacionesDe: datos => habsCasa(datos.estado),
  entrarVisita: datos => entrarVisita(datos),
  verHabitacionVisita: i => verHabitacionVisita(i),
  salirVisita: () => salirVisita(),
  guardar: () => guardar(),
  guardarSiempre: () => guardar(),
  refrescarHud: () => refrescarHud(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  abrirMas: () => mas.abrir()
});

trabajos = new Trabajos({
  estado, ui, sonido, juegos,
  guardar: () => guardar(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  ganar,
  chip: () => pintarChipsVida(),
  abrirMas: () => mas.abrir()
});

sorpresas = new Sorpresas({
  estado, ui, sonido, gestor, juegos, inventario, miniaturas, escena,
  adoptar: (e, g) => adoptar(e, g),
  visitando: () => visitando,
  genera: () => soyGenerador(),
  nombreHab: i => habsCasa()[i] || 'Salón',
  buscarMueble(uid, hab) {
    if (hab === (estado.habActual || 0)) {
      const m = gestor.muebles.find(x => x.userData.uid === uid);
      return m ? { nombre: m.userData.def.nombre } : null;
    }
    const h = estado.habs && estado.habs[hab];
    const d = h && (h.muebles || []).find(x => x.uid === uid);
    return d && infoItem(d.id) ? { nombre: infoItem(d.id).nombre } : null;
  },
  guardar: () => guardar(),
  refrescarHud: () => refrescarHud(),
  registrar: e => registrar(e),
  recordar: (...a) => pareja.recordar(...a),
  ganar,
  chip: () => pintarChipsVida()
});

function entrarVisita() {
  if (visitando) return;
  if (controles.seleccionado) controles.seleccionar(null);
  mascotaSel = null;
  ui.cerrarMenu();
  estado.habs = todasHabitaciones();
  guardar();
  visitaPrevia = { genera: suciedad.genera, trastadas: mascotas.trastadas };
  visitando = true;
  controles.soloMirar = true;
  suciedad.genera = false;
  mascotas.trastadas = false;
  for (const m of mascotas.lista) m.grupo.visible = false;
  vida.quitarVisitante();
  sorpresas.limpiar();
  sala.modoVisita(true);
  mas.cuadros.terminar(false);
  mas.cuadros.ocultar();
  if (mas.cartel) mas.cartel.grupo.visible = false;
  document.body.classList.add('visitando');
}

function verHabitacionVisita(i) {
  const datos = social.visita.datos;
  const e = datos.estado;
  const n = (e.casa && e.casa.nivel) || 0;
  const casa = CASAS[n];
  for (const m of [...gestor.muebles]) gestor.quitar(m);
  suciedad.sincronizar([]);
  const vacia = { muebles: [], suciedad: [], paredes: [null, null, null, null] };
  const h = (e.habs && e.habs[i]) || (i === 0 ? { muebles: datos.muebles || [], suciedad: (datos.suciedad && datos.suciedad.lista) || [], paredes: (datos.sala && datos.sala.paredes) || vacia.paredes } : vacia);
  for (const d of [...(h.muebles || [])].sort((a, b) => a.base - b.base)) if (infoItem(d.id)) gestor.anadir(d.id, d.x0, d.z0, d.rot, d);
  for (const d of h.suciedad || []) suciedad.anadir(d.tipo, d, false);
  const ext = EXTERIORES[habsCasa()[i]] || null;
  sala.modoExterior(ext ? ext.tipo : null);
  sala.pintarSuelo(ext ? ext.suelo : casa.suelo);
  sala.pintarParedes(h.paredes || vacia.paredes, n > 0 || i > 0 ? casa.pared : null);
  ambiente.vista = ['calle', 'calle', 'tejados', 'jardin', 'colinas'][n];
  casa2.aplicar(((e.decor && e.decor.salas) || {})[`${n}-${i}`] || {});
}

function salirVisita() {
  if (!visitando) return;
  for (const m of [...gestor.muebles]) gestor.quitar(m);
  suciedad.sincronizar([]);
  visitando = false;
  controles.soloMirar = false;
  sala.modoVisita(false);
  const h = estado.habs[estado.habActual || 0] || { muebles: [], suciedad: [], paredes: [null, null, null, null] };
  for (const d of [...h.muebles].sort((a, b) => a.base - b.base)) gestor.anadir(d.id, d.x0, d.z0, d.rot, d);
  for (const d of h.suciedad || []) suciedad.anadir(d.tipo, d, false);
  sala.pintarParedes(h.paredes, (estado.habActual || 0) === 0 && nivelCasa() === 0 ? null : CASAS[nivelCasa()].pared);
  aplicarEstiloCasa();
  suciedad.genera = visitaPrevia ? visitaPrevia.genera : true;
  mascotas.trastadas = visitaPrevia ? visitaPrevia.trastadas : true;
  for (const m of mascotas.lista) m.grupo.visible = true;
  mas.pintarPared();
  if (mas.cartel) mas.cartel.grupo.visible = true;
  document.body.classList.remove('visitando');
  if (remotoPendiente) {
    const r = remotoPendiente;
    remotoPendiente = null;
    aplicarRemoto(...r);
  }
  if (guardarPendiente) {
    guardarPendiente = false;
    guardar();
  }
  pintarChipsVida();
}

const TEMAS_RETO = [
  { id: 'playa', nombre: 'Casa de playa', icono: '🏖️' },
  { id: 'romantico', nombre: 'Rincón romántico', icono: '💕' },
  { id: 'selva', nombre: 'Selva urbana (muchas plantas)', icono: '🌿' },
  { id: 'gamer', nombre: 'Cueva gamer', icono: '🎮' },
  { id: 'minimal', nombre: 'Minimalista (poquitas cosas)', icono: '🤍' },
  { id: 'abuela', nombre: 'Casa de la abuela', icono: '👵' },
  { id: 'fiesta', nombre: 'Listo para una fiesta', icono: '🎉' },
  { id: 'spa', nombre: 'Relax total', icono: '🧖' }
];

const ANIMOS = [
  ['😊', 'Feliz'], ['🥰', 'Con ganas de verte'], ['🤗', 'Necesito un abrazo'], ['😴', 'Con sueño'],
  ['😔', 'Un poco de bajón'], ['😤', 'Con estrés'], ['🤒', 'Me encuentro mal'], ['🍕', 'Con hambre'],
  ['📚', 'Estudiando'], ['💼', 'Trabajando'], ['😌', 'Tranquilidad total'], ['🎉', 'De fiesta']
];

function animoDe(yo) {
  const a = estado.animo && estado.animo[yo];
  return a && Date.now() - a.t < 20 * 3600000 ? a : null;
}

function abrirAnimo() {
  const yo = sync && sync.activo ? sync.yo : 0;
  const suyo = sync && sync.activo ? animoDe(1 - yo) : null;
  const mio = animoDe(yo);
  const { caja } = ui.dialogo({
    titulo: '💭 ¿Cómo estás?',
    html: `${suyo ? `<p class="animo-suyo">${escaparHtml(pareja.otro())} está: <b>${suyo.e} ${suyo.txt}</b></p>` : ''}
      <div class="animos">${ANIMOS.map(([e, t]) => `<button class="animo ${mio && mio.e === e ? 'activo' : ''}" data-e="${e}"><span>${e}</span><small>${t}</small></button>`).join('')}</div>`,
    botones: [{ texto: 'Cerrar', tipo: 'secundario' }]
  });
  caja.querySelectorAll('.animo').forEach(b => b.addEventListener('click', () => {
    const [e, t] = ANIMOS.find(a => a[0] === b.dataset.e);
    if (!estado.animo) estado.animo = {};
    estado.animo[yo] = { e, txt: t, t: Date.now() };
    guardar();
    if (sync && sync.activo && sync.emitir) sync.emitir('reaccion', { emoji: e });
    if (window.avisarPareja) window.avisarPareja('animo', `${e} ${t}`);
    sonido.arreglo();
    caja.querySelector('.dialogo-botones button').click();
    ui.aviso(`💭 ${e} ${t}`);
    pintarChipsVida();
  }));
}

function rachaPareja() {
  const r = estado.rachaPareja;
  if (!r) return 0;
  const ayer = new Date(Date.now() - 86400000).toDateString();
  return r.dia === new Date().toDateString() || r.dia === ayer ? r.n : 0;
}

function revisarRachaPareja() {
  if (!sync || !sync.activo) return;
  const hoy = new Date().toDateString();
  if (!estado.vistos) estado.vistos = {};
  let cambio = false;
  if (estado.vistos[sync.yo] !== hoy) {
    estado.vistos[sync.yo] = hoy;
    cambio = true;
  }
  const r = estado.rachaPareja || { n: 0, dia: null };
  if (estado.vistos[0] === hoy && estado.vistos[1] === hoy && r.dia !== hoy) {
    const ayer = new Date(Date.now() - 86400000).toDateString();
    estado.rachaPareja = { n: r.dia === ayer ? r.n + 1 : 1, dia: hoy };
    cambio = true;
    const n = estado.rachaPareja.n;
    if (n > 1) {
      estado.monedas += Math.min(10 * n, 100);
      setTimeout(() => {
        sonido.premio();
        ui.aviso(`🔥 ¡Racha de pareja: ${n} días entrando los dos! +${Math.min(10 * n, 100)} monedas`);
      }, 2500);
    }
  }
  if (cambio) guardar();
}

function escaparHtml(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pintarChipsVida() {
  const caja = document.getElementById('chips-vida');
  const chips = [];
  if (sync && sync.activo) {
    const suyo = animoDe(1 - sync.yo);
    const mio = animoDe(sync.yo);
    chips.push({ id: 'animo', texto: suyo ? `💭 ${suyo.e}` : mio ? `💭 ${mio.e}` : '💭 ¿Cómo estás?', accion: abrirAnimo });
  }
  if (estado.visita) chips.push({ id: 'visita', texto: '🚪 ¡Visita!', accion: () => vida.atenderVisita() });
  if (estado.averia) chips.push({ id: 'averia', texto: estado.averia.tipo === 'gotera' ? '💧 Gotera' : '⚡ Sin luz', accion: () => vida.arreglarAveria() });
  const n = vida.noLeidas();
  if (n) chips.push({ id: 'correo', texto: `✉️ ${n}`, accion: () => vida.abrirCorreo() });
  const ca = pareja2.chipCuentaAtras();
  if (ca) chips.push({ id: 'cuenta', texto: ca, accion: () => pareja2.abrirCuentaAtras() });
  if (estado.reto && !estado.reto.terminado) {
    const min = Math.max(0, Math.ceil((estado.reto.fin - Date.now()) / 60000));
    chips.push({ id: 'reto', texto: `🎨 ${min} min`, accion: () => verReto() });
  }
  if (trabajos) {
    const ct = trabajos.chip();
    if (ct) chips.push(ct);
  }
  if (casa2) chips.push(...casa2.chips());
  if (mascotas2) chips.push(...mascotas2.chips());
  if (sorpresas) chips.push(...sorpresas.chips());
  const URGENTES = ['visita', 'averia', 'nieve', 'gato', 'tesoro'];
  const urgentes = chips.filter(c => URGENTES.includes(c.id));
  const resto = chips.filter(c => !URGENTES.includes(c.id));
  if (!resto.length) avisosAbierto = false;
  caja.innerHTML = urgentes.map(c => `<button class="pastilla reparto" data-id="${c.id}">${c.texto}</button>`).join('')
    + (resto.length ? `<button class="pastilla reparto avisos-btn ${avisosAbierto ? 'abierto' : ''}" data-id="__avisos">🔔 <b>${resto.length}</b></button>
      <div class="avisos-panel ${avisosAbierto ? '' : 'oculto'}">${resto.map(c => `<button class="aviso-fila" data-id="${c.id}">${c.texto}</button>`).join('')}</div>` : '');
  caja.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.id === '__avisos') {
      avisosAbierto = !avisosAbierto;
      sonido.tocar();
      pintarChipsVida();
      return;
    }
    avisosAbierto = false;
    chips.find(c => c.id === b.dataset.id).accion();
    pintarChipsVida();
  }));
}

let avisosAbierto = false;

function ordenarHud() {
  const prog = estado.reforma || sala.progreso();
  const enReforma = nivelCasa() === 0 && prog.hechos < prog.total;
  document.querySelector('#hud .pastilla.casa').classList.toggle('oculto', !enReforma);
  document.getElementById('pill-acogedor').classList.toggle('oculto', enReforma);
  document.getElementById('pill-limpieza').classList.toggle('oculto', suciedad.limpieza() >= 100);
}

function empezarReto() {
  const tema = TEMAS_RETO[Math.floor(Math.random() * TEMAS_RETO.length)];
  ui.dialogo({
    imagen: miniaturas.personaje('lola'), personaje: true,
    titulo: `🎨 Reto: ${tema.icono} ${tema.nombre}`,
    texto: `Tenéis 10 minutos para decorar esta habitación con ese estilo. Al acabar, ${sync.activo ? pareja.otro() : 'tu pareja'} la puntuará de 1 a 5 estrellas.`,
    botones: [
      { texto: 'Otro tema', tipo: 'secundario', accion: () => setTimeout(empezarReto, 250) },
      {
        texto: '¡A decorar!', tipo: 'primario', accion: () => {
          estado.reto = { tema: tema.id, fin: Date.now() + 10 * 60000, de: sync.activo ? sync.yo : 0, terminado: false, estrellas: null };
          ui.cerrarHojas();
          guardar();
          pintarChipsVida();
        }
      }
    ]
  });
}

function verReto() {
  const r = estado.reto;
  const tema = TEMAS_RETO.find(t => t.id === r.tema);
  ui.dialogo({
    titulo: `🎨 ${tema.icono} ${tema.nombre}`,
    texto: `Quedan ${Math.max(0, Math.ceil((r.fin - Date.now()) / 60000))} minutos.`,
    botones: [{ texto: 'Seguir decorando', tipo: 'secundario' }, { texto: '¡Ya está!', tipo: 'primario', accion: () => terminarReto() }]
  });
}

function terminarReto() {
  const r = estado.reto;
  if (!r || r.terminado) return;
  r.terminado = true;
  r.foto = mas.capturar(320).toDataURL('image/jpeg', 0.7);
  guardar();
  pintarChipsVida();
  sonido.arreglo();
  ui.aviso(sync.activo ? `🎨 ¡Listo! Ahora ${pareja.otro()} lo puntuará` : '🎨 ¡Listo! Dale el móvil a tu pareja para que lo puntúe');
  if (!sync.activo) setTimeout(puntuarReto, 900);
}

function puntuarReto() {
  const r = estado.reto;
  if (!r || !r.terminado || r.estrellas) return false;
  if (sync.activo && r.de === sync.yo) return false;
  const tema = TEMAS_RETO.find(t => t.id === r.tema);
  const { caja } = ui.dialogo({
    titulo: `⭐ Puntúa el reto: ${tema.icono} ${tema.nombre}`,
    html: `<img class="foto-grande" src="${r.foto}" alt=""><div class="estrellas">${[1, 2, 3, 4, 5].map(n => `<button data-n="${n}">⭐</button>`).join('')}</div>`,
    botones: [{ texto: 'Luego', tipo: 'secundario' }]
  });
  caja.querySelectorAll('.estrellas button').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.n);
    r.estrellas = n;
    estado.monedas += n * 20;
    registrar('reto');
    refrescarHud();
    guardar();
    caja.querySelector('.dialogo-botones button').click();
    sonido.premio();
    ui.aviso(`${'⭐'.repeat(n)} ¡+${n * 20} monedas!`);
    if (n === 5) pareja.recordar(null, '🎨', `Decoramos un ${tema.nombre.toLowerCase()} de 5 estrellas`);
  }));
  return true;
}

function abrirNosotros() {
  const tiles = [
    { id: 'pareja', icono: '💑', texto: 'Notas y regalos', sub: 'Notitas en la nevera, regalos, votos y misiones de pareja', accion: () => pareja.abrir() },
    { id: 'pregunta', icono: '💬', texto: 'Pregunta del día', sub: pareja2.pendientePregunta() ? '¡Hoy toca responder!' : 'Respondida', insignia: pareja2.pendientePregunta() ? '!' : null, accion: () => pareja2.abrirPregunta() },
    { id: 'quiz', icono: '🎯', texto: '¿Cuánto me conoces?', sub: 'Quiz de pareja', accion: () => pareja2.abrirQuiz() },
    { id: 'viajes', icono: '✈️', texto: 'Mapa de viajes', sub: `${(estado.viajes || []).length} sitios`, accion: () => pareja2.abrirViajes() },
    { id: 'cuenta', icono: '⏳', texto: 'Cuenta atrás', sub: pareja2.textoFalta() || 'Para la próxima vez que os veis', accion: () => pareja2.abrirCuentaAtras() },
    { id: 'metas', icono: '📌', texto: 'Nuestras metas', sub: `${(estado.metas || []).filter(m => m.hecha).length}/${(estado.metas || []).length} cumplidas`, accion: () => pareja2.abrirMetas() },
    { id: 'recuerdos', icono: '🌳', texto: 'Recuerdos', sub: `${(estado.recuerdos || []).length} momentos`, accion: () => pareja.verRecuerdos() },
    { id: 'capsula', icono: '💌', texto: 'Cápsula del tiempo', sub: `${(estado.capsulas || []).length} mensajes`, accion: () => pareja.verCapsulas() },
    { id: 'planes', icono: '📅', texto: 'Planes', sub: 'Cenas, viajes, pelis…', accion: () => pareja.verPlanes() }
  ];
  abrirHub('Nosotros', tiles);
}

function aplicarTemporada() {
  const t = temporadaActual();
  ui.ponerTemporada(t && t !== 'aniversario' ? t : null, t ? NOMBRE_TEMPORADA[t] : '');
}

function revisarFechas() {
  if (dialogoAbierto()) return false;
  if (!estado.celebrado) estado.celebrado = {};
  for (const f of mas.fechasEspeciales()) {
    if (estado.celebrado[f.clave]) continue;
    estado.celebrado[f.clave] = true;
    if (!f.temporada) pareja.recordar(null, f.titulo.includes('aniversario') ? '💍' : '🎂', f.titulo.replace(/!|¡/g, '').trim());
    if (f.temporada) estado.tickets += 1;
    else {
      estado.monedas += 150;
      estado.tickets += 2;
    }
    refrescarHud();
    guardar();
    sonido.premio();
    ui.dialogo({
      imagen: miniaturas.personaje('lola'), personaje: true,
      titulo: f.titulo, texto: f.texto + (f.temporada ? '' : ' (+150 monedas y 2 tickets)'),
      confeti: true,
      botones: [{ texto: f.temporada ? '¡A la tienda!' : '¡Gracias, Pilar!', tipo: 'primario', accion: f.temporada ? () => ui.abrirTienda('temporada') : null }]
    });
    return true;
  }
  return false;
}

function pintarClima() {
  const el = document.getElementById('pill-clima');
  el.textContent = `${ambiente.icono()} ${ambiente.textoHora()}`;
}

function redimensionar() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camaraIso.redimensionar(w / h);
}

window.addEventListener('resize', redimensionar);
document.addEventListener('gesturestart', e => e.preventDefault());

const hoy = new Date().toDateString();
const nuevoDia = estado.dia !== hoy;
const diasFuera = estado.dia ? Math.round((new Date(hoy) - new Date(estado.dia)) / 86400000) : 0;
if (nuevoDia) {
  const ayer = new Date(Date.now() - 86400000).toDateString();
  estado.racha = { n: estado.racha && estado.dia === ayer ? estado.racha.n + 1 : 1 };
  estado.gratis = true;
  estado.dia = hoy;
}

aplicarTemporada();
pintarClima();
if ((estado.habActual || 0) !== 0 && estado.habs && estado.habs[estado.habActual]) {
  sala.pintarParedes(estado.habs[estado.habActual].paredes, CASAS[nivelCasa()].pared);
}
aplicarEstiloCasa();
ui.pintarInventario(inventario);
refrescarHud();
redimensionar();
guardar();

guia = new Guia({
  ui, sonido, cara: miniaturas.personaje('lola'),
  categoriaTienda: () => ui.categoria,
  posPaquete: () => {
    const p = entregas.enPuerta().find(x => x.paquete);
    return p ? pantalla(p.paquete.position.clone().add(new THREE.Vector3(0, 0.25, 0))) : null;
  }
});
setInterval(() => guia && guia.ocultarSi(dialogoAbierto()), 300);
setInterval(() => {
  if (!enMenu() && !dialogoAbierto() && !ui.hojaAbierta && !(guia && guia.activa()) && performance.now() > 12000) mas.postalDelDia();
}, 5000);
setTimeout(function alEntrar() {
  if (enMenu()) return setTimeout(alEntrar, 500);
  revisarRachaPareja();
  guia.empezar((estado.historia || 0) >= 3 || nivelCasa() >= 1);
  if (!estado.bienvenida) {
    estado.bienvenida = true;
    estado.tickets += 1;
    refrescarHud();
    guardar();
    ui.dialogo({
      imagen: miniaturas.personaje('lola'), personaje: true,
      titulo: '¡Bienvenidos a casa!',
      texto: 'Soy Pilar, la de la tienda. Este piso está hecho un desastre… Tocad lo que esté roto y os diré qué hace falta. Lo que pidáis os llegará en un paquete a la puerta. ¡Os regalo un ticket para la ruleta!',
      botones: [{ texto: '¡Vamos allá!', tipo: 'primario' }]
    });
  } else if (revisarFechas()) {
    return;
  } else if (nuevoDia && habiaPartida && diasFuera >= 3) {
    const monedas = Math.min(300, 60 * diasFuera);
    estado.monedas += monedas;
    estado.tickets += 2;
    refrescarHud();
    guardar();
    ui.dialogo({
      imagen: miniaturas.personaje('lola'), personaje: true,
      titulo: '¡Os echábamos de menos!',
      texto: `Hacía ${diasFuera} días que no veníais. La casa os ha esperado tranquila y os he guardado un regalo de bienvenida: +${monedas} monedas y 2 tickets para la ruleta.`,
      botones: [{ texto: '¡Qué bien volver!', tipo: 'primario' }],
      confeti: true
    });
  } else if (nuevoDia && habiaPartida) {
    const racha = estado.racha ? estado.racha.n : 1;
    const bonus = 50 + 10 * (Math.min(racha, 7) - 1);
    estado.monedas += bonus;
    refrescarHud();
    guardar();
    ui.dialogo({
      imagen: miniaturas.piezas('premio:monedas', PIEZAS_PREMIO.monedas),
      etiqueta: racha > 1 ? { texto: `🔥 Racha de ${racha} días`, color: '#f2a03c' } : null,
      titulo: '¡Buenos días!',
      texto: `Por volver hoy: +${bonus} monedas y una tirada gratis en la ruleta.${racha < 7 ? ' Si volvéis mañana, ¡más!' : ''}`,
      botones: [{ texto: '¡A por ello!', tipo: 'primario' }]
    });
  }
}, 600);

setTimeout(() => mas.revisarDiario(), 4000);

const reloj = new THREE.Clock();
const puntoMenu = new THREE.Vector3();
let tGuardado = 0;
let tChip = 0;
let tMisiones = 0;
let tFotos = 25;
let tProgreso = 0;

function colocarMenu(dt) {
  if (mascotaSel) {
    if (!mascotas.lista.includes(mascotaSel)) {
      mascotaSel = null;
      ui.cerrarMenu();
      return;
    }
    tRefrescoMenu += dt;
    if (tRefrescoMenu > 1.5) {
      tRefrescoMenu = 0;
      refrescarMenu();
    }
    const p = mascotaSel.grupo.position;
    puntoMenu.set(p.x, 0.5 * mascotaSel.e.tam, p.z);
  } else {
    const m = controles.seleccionado;
    if (!m) return;
    puntoMenu.set(m.position.x, m.userData.base + m.userData.alto + 0.15, m.position.z);
  }
  if (controles.modo === 'arrastrar' || controles.modo === 'gesto' || controles.modo === 'colocar') {
    ui.posicionarMenu(null);
    return;
  }
  const s = pantalla(puntoMenu);
  ui.posicionarMenu(s.x, s.y);
}

if (new URLSearchParams(location.search).has('debug')) window.__h = { trabajos, estado, gestor, mascotas, casa2, mascotas2, social, sorpresas, controles, sala, opcionesMueble, opcionesMascota, sync, lofi, mas, ui, aplicarEstiloCasa, acogedor, pintarChipsVida };

renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 0.1);
  camaraIso.actualizar(dt);
  sala.actualizarParedes(camaraIso.direccionHorizontal());
  sala.actualizar(dt);
  ambiente.actualizar(dt);
  usos.actualizar(dt);
  sync.actualizar(dt);
  animarToques(dt);
  if (!visitando) vida.actualizar(dt);
  casa2.actualizar(dt);
  social.actualizar(dt);
  sorpresas.actualizar(dt);
  lofi.actualizar(ambiente.hora, !!usos.musica || !!social.fiesta);
  gestor.actualizar(dt);
  mascotas.actualizar(dt);
  entregas.actualizar(dt);
  suciedad.visibilidadParedes(sala.visibles());
  suciedad.actualizar(dt, hayTrampa());
  tMisiones += dt;
  if (tMisiones > 1) {
    tMisiones = 0;
    comprobarEvento();
    pintarClima();
    pareja.revisar();
    pareja.revisarPlanes();
    pareja2.revisarCuentaAtras();
    ambiente.furgoneta = entregas.pedidos.some(p => p.estado === 'camino');
    if (estado.reto && !estado.reto.terminado && Date.now() > estado.reto.fin) terminarReto();
    if (estado.reto && estado.reto.terminado && !estado.reto.estrellas && sync.activo && !dialogoAbierto()) puntuarReto();
    if (tProgreso === 0) pintarChipsVida();
    document.getElementById('acogedor-valor').textContent = acogedor().total;
    tProgreso += 1;
    if (tProgreso >= 3) {
      tProgreso = 0;
      revisarProgreso();
    }
    tFotos += 1;
    if (tFotos > 30) {
      tFotos = 0;
      sincronizarFotos();
    }
    ui.limpieza(suciedad.limpieza());
    ui.contadorMisiones(misionesListas());
    ui.chipEvento(textoChipEvento());
    ordenarHud();
  }
  colocarMenu(dt);
  tChip += dt;
  if (tChip > 0.25) {
    tChip = 0;
    const n = entregas.enPuerta().length;
    const s = entregas.segundosProximo();
    if (n) ui.chipReparto(n > 1 ? `📦 ${n} paquetes en la puerta` : '📦 ¡Paquete en la puerta!', true);
    else if (s !== null) ui.chipReparto(`🚚 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, false);
    else ui.chipReparto(null);
  }
  renderer.render(escena, camaraIso.camara);
  tGuardado += dt;
  if (tGuardado > 20) {
    tGuardado = 0;
    guardar();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
