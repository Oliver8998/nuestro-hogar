import * as THREE from 'three';
import { CamaraIso } from './camara.js';
import { crearSala } from './sala.js';
import { GestorMuebles } from './muebles.js';
import { Controles } from './controles.js';
import { Inventario } from './inventario.js';
import { UI } from './ui.js';
import { Miniaturas } from './miniaturas.js';
import { GestorMascotas, ESPECIES } from './mascotas.js';
import { infoItem, precioVenta, RAREZAS } from './catalogo.js';
import { elegirSegmento, resolverPremio, COSTE_TIRADA, PIEZAS_PREMIO } from './ruleta.js';
import { sonido } from './sonido.js';

const CLAVE = 'hogar-estado';
const NOMBRES = ['Michi', 'Coco', 'Luna', 'Toby', 'Nube', 'Canela', 'Pipo', 'Kiwi', 'Lola', 'Bimba', 'Churro', 'Galleta', 'Mochi', 'Rufo', 'Trufa', 'Pelusa'];
const canvas = document.getElementById('escena');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
const camaraIso = new CamaraIso(window.innerWidth / window.innerHeight);
const sala = crearSala(escena);
const gestor = new GestorMuebles(escena);
const inventario = new Inventario();
const miniaturas = new Miniaturas(160);

const estado = {
  monedas: 300,
  tickets: 0,
  dia: null,
  gratis: true,
  bienvenida: false
};

let mascotaSel = null;
let controles = null;
let arrastre = null;
let tRefrescoMenu = 0;

const mascotas = new GestorMascotas(escena, gestor, {
  particula(emoji, m, n = 1) {
    const p = pantalla(new THREE.Vector3(m.grupo.position.x, 0.75 * m.e.tam, m.grupo.position.z));
    ui.particula(emoji, p.x, p.y, n);
  }
});

function pantalla(v) {
  const q = v.clone().project(camaraIso.camara);
  const r = canvas.getBoundingClientRect();
  return { x: (q.x + 1) / 2 * r.width + r.left, y: (1 - q.y) / 2 * r.height + r.top };
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      ...estado,
      muebles: gestor.serializar(),
      inventario: inventario.serializar(),
      sala: sala.estado(),
      mascotas: mascotas.serializar(),
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
    return false;
  }
  estado.monedas = datos.monedas ?? 300;
  estado.tickets = datos.tickets ?? 0;
  estado.dia = datos.dia ?? null;
  estado.gratis = datos.gratis ?? true;
  estado.bienvenida = datos.bienvenida ?? true;
  for (const m of datos.muebles || []) gestor.anadir(m.id, m.x0, m.z0, m.rot, m);
  inventario.cargar(datos.inventario);
  const antiguas = datos.reparaciones || [];
  sala.restaurar(datos.sala || {
    arreglos: antiguas.filter(id => !id.startsWith('pintura')),
    paredes: [0, 1, 2, 3].map(i => antiguas.includes(`pintura-${i}`) ? 0xf3eadb : null)
  });
  mascotas.cargar(datos.mascotas, datos.t ? (Date.now() - datos.t) / 1000 : 0);
  return true;
}

const habiaPartida = cargar();
let terminada = sala.progreso().hechos >= sala.progreso().total;

function refrescarHud() {
  ui.monedas(estado.monedas);
  ui.tickets(estado.tickets);
  ui.tiradaGratis(estado.gratis);
  const prog = sala.progreso();
  ui.casa(prog);
  if (!terminada && prog.hechos >= prog.total) {
    terminada = true;
    setTimeout(() => {
      sonido.premio();
      ui.dialogo({
        imagen: miniaturas.personaje('lola'), personaje: true,
        titulo: '¡Habitación reformada!',
        texto: 'Ha quedado preciosa. Os habéis ganado un regalo: 150 monedas y 2 tickets.',
        confeti: true,
        botones: [{ texto: '¡Gracias, Lola!', tipo: 'primario' }]
      });
      estado.monedas += 150;
      estado.tickets += 2;
      refrescarHud();
      guardar();
    }, 1200);
  }
  refrescarMenu();
}

function comprarDirecto(id, color = null, precio = null) {
  const info = infoItem(id);
  const coste = precio ?? info.precio;
  if (estado.monedas < coste) {
    sonido.error();
    ui.aviso('No te llega el dinero', true);
    return false;
  }
  estado.monedas -= coste;
  inventario.anadir(id, info.tipo === 'mueble' && info.colores ? (color ?? 0) : null);
  sonido.comprar();
  ui.pintarInventario(inventario);
  refrescarHud();
  ui.aviso(`📦 ${info.nombre} al inventario`);
  guardar();
  return true;
}

function ofrecerCompra(id, titulo) {
  const info = infoItem(id);
  ui.dialogo({
    imagen: miniaturas.item(id),
    titulo: titulo || `No tenéis ${info.nombre.toLowerCase()}`,
    texto: '¿Lo compramos? Irá directo a vuestro inventario.',
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

  if (def.colores) {
    opciones.push({ icono: '🎨', texto: 'Color', accion: () => { gestor.siguienteColor(m); sonido.pop(); guardar(); } });
  }
  if (def.encendible) {
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
  return `<b>${m.nombre}</b><small>${ESPECIES[m.especie].nombre}${m.estado === 'dormir' ? ' · durmiendo 💤' : ''}</small>
    ${barra('🍖', m.hambre, '#f2a03c')}${barra('💕', m.felicidad, '#e58f9e')}${barra('⚡', m.energia, '#5a9fd6')}`;
}

function opcionesMascota(m) {
  const comida = inventario.cantidad('pienso');
  const chuches = inventario.cantidad('chuches');
  return [
    {
      icono: '💕', texto: 'Mimos', accion: () => {
        mascotas.acariciar(m);
        sonido.mascota();
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🍖', texto: comida ? `Comer ×${comida}` : 'Comer', accion: () => {
        if (!comida) return ofrecerCompra('pienso', `${m.nombre} tiene hambre`);
        inventario.quitar('pienso');
        mascotas.alimentar(m);
        sonido.mascota();
        ui.pintarInventario(inventario);
        guardar();
        refrescarMenu();
      }
    },
    {
      icono: '🍬', texto: chuches ? `Premio ×${chuches}` : 'Premio', accion: () => {
        if (!chuches) return ofrecerCompra('chuches', `Sin chuches para ${m.nombre}`);
        inventario.quitar('chuches');
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
        sonido.mascota();
        guardar();
        refrescarMenu();
      }
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
    ui.iconoSonido(sonido.alternar());
  },
  alComprar(info, color, precio) {
    return comprarDirecto(info.id, color, precio);
  },
  alPedirMascotas() {
    return mascotas.lista;
  },
  alAdoptar(especie) {
    adoptar(especie);
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
    if (info.tipo === 'material') {
      ui.aviso(info.pista);
      return;
    }
    const hueco = gestor.buscarHueco(item.id);
    if (!hueco) {
      sonido.error();
      ui.aviso('No cabe, haz hueco', true);
      return;
    }
    inventario.quitar(item.id, item.color);
    const m = gestor.anadir(item.id, hueco.x, hueco.z, hueco.rot, { color: item.color ?? undefined });
    m.userData.rebote = 1;
    seleccionarMascota(null);
    controles.seleccionar(m);
    sonido.colocar();
    ui.pintarInventario(inventario);
    guardar();
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
    const r = controles.soltarColocacion(x, y, cancelar);
    if (r.ok) {
      inventario.quitar(a.item.id, a.item.color);
      if (a.info.tipo === 'material') {
        sonido.arreglo();
        ui.particula('✨', x, y, 6);
        ui.aviso(r.objetivo.tipo === 'pared' ? '🖌️ ¡Pared pintada!' : `✨ ${r.objetivo.d.mensaje}`);
      } else {
        sonido.colocar();
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

controles = new Controles(canvas, camaraIso, gestor, sala, mascotas, {
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
    ui.dialogo({
      imagen: miniaturas.item(d.material),
      titulo: d.nombre,
      texto: d.descripcion,
      html: `<div class="necesita${tiene ? ' tienes-ya' : ''}">
        <div><b>${tiene ? '✅' : '🛠️'} Necesitas: ${mat.nombre}</b>
        <small>${tiene ? `Tenéis ${tiene}. Arrastradlo desde el inventario hasta aquí.` : `Cuesta 🪙 ${mat.precio} en la tienda.`}</small></div></div>`,
      botones: tiene
        ? [{ texto: '¡Entendido!', tipo: 'primario' }]
        : [
            { texto: 'Ahora no', tipo: 'secundario' },
            { texto: `Comprar · 🪙 ${mat.precio}`, tipo: 'primario', desactivado: estado.monedas < mat.precio, accion: () => comprarDirecto(d.material) }
          ]
    });
  }
});

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
if (nuevoDia) {
  estado.gratis = true;
  estado.dia = hoy;
}

ui.iconoSonido(sonido.activo);
ui.pintarInventario(inventario);
refrescarHud();
redimensionar();
guardar();

setTimeout(() => {
  if (!estado.bienvenida) {
    estado.bienvenida = true;
    estado.tickets += 1;
    refrescarHud();
    guardar();
    ui.dialogo({
      imagen: miniaturas.personaje('lola'), personaje: true,
      titulo: '¡Bienvenidos a casa!',
      texto: 'Soy Lola, la de la tienda. Este piso está hecho un desastre… Tocad lo que esté roto y os diré qué hace falta. ¡Os regalo un ticket para la ruleta!',
      botones: [{ texto: '¡Vamos allá!', tipo: 'primario' }]
    });
  } else if (nuevoDia && habiaPartida) {
    estado.monedas += 50;
    refrescarHud();
    guardar();
    ui.dialogo({
      imagen: miniaturas.piezas('premio:monedas', PIEZAS_PREMIO.monedas),
      titulo: '¡Buenos días!',
      texto: 'Por volver hoy: +50 monedas y una tirada gratis en la ruleta.',
      botones: [{ texto: '¡A por ello!', tipo: 'primario' }]
    });
  }
}, 600);

const reloj = new THREE.Clock();
const puntoMenu = new THREE.Vector3();
let tGuardado = 0;

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

renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 0.1);
  camaraIso.actualizar(dt);
  sala.actualizarParedes(camaraIso.direccionHorizontal());
  sala.actualizar(dt);
  gestor.actualizar(dt);
  mascotas.actualizar(dt);
  colocarMenu(dt);
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
