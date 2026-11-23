import * as THREE from 'three';
import { CamaraIso } from './camara.js';
import { crearSala } from './sala.js';
import { CATALOGO, GestorMuebles } from './muebles.js';
import { Controles } from './controles.js';
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

let monedas = 300;

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({
      monedas,
      muebles: gestor.serializar(),
      reparaciones: sala.reparaciones.filter(r => r.hecha).map(r => r.id)
    }));
  } catch (e) {}
}

function cargar() {
  let datos = null;
  try {
    datos = JSON.parse(localStorage.getItem(CLAVE));
  } catch (e) {}
  if (datos) {
    monedas = datos.monedas;
    for (const m of datos.muebles) gestor.anadir(m.id, m.x0, m.z0, m.rot, m);
    sala.completarGuardadas(datos.reparaciones || []);
  } else {
    gestor.anadir('colchon', -5, -5, 0);
    gestor.anadir('caja', 3, -4, 0);
    gestor.anadir('caja', 4, -4, 0);
    gestor.anadir('caja', 3, -3, 0);
  }
}

cargar();

function actualizarMonedas() {
  ui.monedas(monedas);
  refrescarMenu();
}

function comprar(def, extra = {}) {
  if (monedas < def.precio) {
    ui.aviso('No te llega el dinero');
    return;
  }
  const hueco = gestor.buscarHueco(def.id);
  if (!hueco) {
    ui.aviso('No cabe, haz hueco');
    return;
  }
  monedas -= def.precio;
  const mueble = gestor.anadir(def.id, hueco.x, hueco.z, hueco.rot, extra);
  controles.seleccionar(mueble);
  actualizarMonedas();
  guardar();
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

  if (def.enTienda !== false) {
    opciones.push({
      icono: '➕',
      texto: `Otro 🪙${def.precio}`,
      desactivado: monedas < def.precio,
      accion: () => comprar(def, { color: datos.color, encendido: datos.encendido })
    });
  }

  const devolucion = Math.floor(def.precio / 2);
  opciones.push({
    icono: devolucion ? '💰' : '🗑️',
    texto: devolucion ? `Vender +${devolucion}` : 'Tirar',
    accion: () => {
      monedas += devolucion;
      controles.seleccionar(null);
      gestor.quitar(m);
      actualizarMonedas();
      guardar();
    }
  });

  return opciones;
}

function refrescarMenu() {
  const m = controles.seleccionado;
  if (m) ui.abrirMenu(opcionesMenu(m));
  else ui.cerrarMenu();
}

const ui = new UI(CATALOGO, sala.reparaciones, {
  alComprar(def) {
    comprar(def);
  },
  alCambiarModo(m) {
    controles.cambiarModo(m);
    ui.modo(m);
    if (m === 'reparar') ui.aviso('Toca lo que esté roto para arreglarlo');
  }
});

const controles = new Controles(canvas, camaraIso, gestor, sala, {
  alSeleccionar() {
    refrescarMenu();
  },
  alCambiar() {
    guardar();
  },
  puedeReparar(rep) {
    if (monedas >= rep.coste) return true;
    ui.aviso(`Necesitas 🪙 ${rep.coste} para esto`);
    return false;
  },
  alProgresoReparar(rep, x, y) {
    ui.progreso(rep, x, y);
  },
  alFinReparar() {
    ui.finProgreso();
  },
  alReparar(rep) {
    monedas -= rep.coste;
    actualizarMonedas();
    ui.actualizarReparaciones();
    ui.aviso(`✨ ${rep.nombre}: ¡hecho!`);
    guardar();
    if (sala.reparaciones.every(r => r.hecha)) {
      setTimeout(() => ui.aviso('🏠 ¡Habitación reformada entera!'), 2000);
    }
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

actualizarMonedas();
redimensionar();

const reloj = new THREE.Clock();
const puntoMenu = new THREE.Vector3();

function colocarMenu() {
  const m = controles.seleccionado;
  if (!m) return;
  if (controles.modo === 'arrastrar' || controles.modo === 'gesto') {
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
  sala.animar(dt);
  controles.actualizar(dt);
  colocarMenu();
  renderer.render(escena, camaraIso.camara);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
