import * as THREE from 'three';
import { CamaraIso } from './camara.js';
import { crearSala } from './sala.js';
import { GestorMuebles } from './muebles.js';
import { Controles } from './controles.js';
import { Inventario } from './inventario.js';
import { UI } from './ui.js';

const CLAVE = 'hogar-estado';
const canvas = document.getElementById('escena');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const escena = new THREE.Scene();
escena.background = new THREE.Color(0xf4e9dc);

const camaraIso = new CamaraIso(window.innerWidth / window.innerHeight);
const sala = crearSala(escena);
const gestor = new GestorMuebles(escena);
const inventario = new Inventario();

let monedas = 300;

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      monedas,
      muebles: gestor.serializar(),
      inventario: inventario.serializar(),
      sala: sala.estado()
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
    return;
  }
  monedas = datos.monedas;
  for (const m of datos.muebles) gestor.anadir(m.id, m.x0, m.z0, m.rot, m);
  inventario.cargar(datos.inventario);
  const antiguas = datos.reparaciones || [];
  sala.restaurar(datos.sala || {
    arreglos: antiguas.filter(id => !id.startsWith('pintura')),
    paredes: [0, 1, 2, 3].map(i => antiguas.includes(`pintura-${i}`) ? 0xf3eadb : null)
  });
}

cargar();

let terminada = sala.progreso().hechos >= sala.progreso().total;

function refrescarHud() {
  ui.monedas(monedas);
  const prog = sala.progreso();
  ui.casa(prog);
  if (!terminada && prog.hechos >= prog.total) {
    terminada = true;
    setTimeout(() => ui.aviso('🏡 ¡Habitación reformada entera!'), 2300);
  }
  refrescarMenu();
}

function opcionesMenu(m) {
  const datos = m.userData;
  const def = datos.def;
  const opciones = [{
    icono: '⟳',
    texto: 'Girar',
    accion: () => {
      if (gestor.rotar(m)) guardar();
      else ui.aviso('No hay sitio para girarlo');
    }
  }];

  if (def.colores) {
    opciones.push({
      icono: '🎨',
      texto: 'Color',
      accion: () => {
        gestor.siguienteColor(m);
        guardar();
      }
    });
  }

  if (def.encendible) {
    opciones.push({
      icono: datos.encendido ? '🌙' : '💡',
      texto: datos.encendido ? 'Apagar' : 'Encender',
      accion: () => {
        gestor.alternarEncendido(m);
        guardar();
        refrescarMenu();
      }
    });
  }

  opciones.push({
    icono: '📦',
    texto: 'Guardar',
    accion: () => {
      inventario.anadir(def.id, def.colores ? datos.color : null);
      controles.seleccionar(null);
      gestor.quitar(m);
      ui.pintarInventario(inventario);
      ui.aviso(`📦 ${def.nombre} al inventario`);
      guardar();
    }
  });

  const devolucion = Math.floor(def.precio / 2);
  opciones.push({
    icono: devolucion ? '💰' : '🗑️',
    texto: devolucion ? `+${devolucion}` : 'Tirar',
    accion: () => {
      monedas += devolucion;
      controles.seleccionar(null);
      gestor.quitar(m);
      refrescarHud();
      guardar();
    }
  });

  return opciones;
}

function refrescarMenu() {
  const m = controles && controles.seleccionado;
  if (m) ui.abrirMenu(opcionesMenu(m));
  else ui.cerrarMenu();
}

let arrastre = null;
let controles = null;

const ui = new UI({
  alComprar(info) {
    if (monedas < info.precio) {
      ui.aviso('No te llega el dinero');
      return false;
    }
    monedas -= info.precio;
    inventario.anadir(info.id, info.tipo === 'mueble' && info.colores ? 0 : null);
    ui.pintarInventario(inventario);
    refrescarHud();
    ui.aviso(`📦 ${info.nombre} al inventario`);
    guardar();
    return true;
  },
  alTocarItem(item, info) {
    if (info.tipo === 'material') {
      ui.aviso(info.pista);
      return;
    }
    const hueco = gestor.buscarHueco(item.id);
    if (!hueco) {
      ui.aviso('No cabe, haz hueco');
      return;
    }
    inventario.quitar(item.id, item.color);
    const m = gestor.anadir(item.id, hueco.x, hueco.z, hueco.rot, { color: item.color ?? undefined });
    controles.seleccionar(m);
    ui.pintarInventario(inventario);
    guardar();
  },
  alEmpezarArrastre(item, info) {
    arrastre = { item, info };
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
        ui.aviso(r.objetivo.tipo === 'pared' ? '🖌️ ¡Pared pintada!' : `✨ ${r.objetivo.d.mensaje}`);
      }
      guardar();
    } else if (r.motivo) {
      ui.aviso(r.motivo);
    }
    ui.pintarInventario(inventario);
    refrescarHud();
  }
});

controles = new Controles(canvas, camaraIso, gestor, sala, {
  alSeleccionar() {
    refrescarMenu();
  },
  alCambiar() {
    guardar();
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

ui.pintarInventario(inventario);
refrescarHud();
redimensionar();

const reloj = new THREE.Clock();
const puntoMenu = new THREE.Vector3();

function colocarMenu() {
  const m = controles.seleccionado;
  if (!m) return;
  if (controles.modo !== 'nada' && controles.modo !== 'rotar') {
    ui.posicionarMenu(null);
    return;
  }
  puntoMenu.set(m.position.x, m.userData.alto + 0.15, m.position.z).project(camaraIso.camara);
  const r = canvas.getBoundingClientRect();
  ui.posicionarMenu((puntoMenu.x + 1) / 2 * r.width + r.left, (1 - puntoMenu.y) / 2 * r.height + r.top);
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 0.1);
  camaraIso.actualizar(dt);
  sala.actualizarParedes(camaraIso.direccionHorizontal());
  sala.actualizar(dt);
  colocarMenu();
  renderer.render(escena, camaraIso.camara);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
