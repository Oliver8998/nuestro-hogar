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
    for (const m of datos.muebles) gestor.anadir(m.id, m.x0, m.z0, m.rot);
    sala.completarGuardadas(datos.reparaciones || []);
  } else {
    gestor.anadir('colchon', -5, -5, 0);
    gestor.anadir('caja', 3, -4, 0);
    gestor.anadir('caja', 4, -4, 0);
    gestor.anadir('caja', 3, -3, 0);
  }
}

cargar();

const ui = new UI(CATALOGO, sala.reparaciones, {
  alComprar(def) {
    if (monedas < def.precio) return ui.aviso('No te llega el dinero');
    const hueco = gestor.buscarHueco(def.id);
    if (!hueco) return ui.aviso('No cabe, haz hueco');
    monedas -= def.precio;
    const mueble = gestor.anadir(def.id, hueco.x, hueco.z, hueco.rot);
    controles.seleccionar(mueble);
    ui.monedas(monedas);
    guardar();
  },
  alRotar() {
    const m = controles.seleccionado;
    if (!m) return;
    if (gestor.rotar(m)) guardar();
    else ui.aviso('No hay sitio para girarlo');
  },
  alVender() {
    const m = controles.seleccionado;
    if (!m) return;
    monedas += Math.floor(m.userData.def.precio / 2);
    controles.seleccionar(null);
    gestor.quitar(m);
    ui.monedas(monedas);
    guardar();
  },
  alCambiarModo(m) {
    controles.cambiarModo(m);
    ui.modo(m);
    if (m === 'reparar') ui.aviso('Toca lo que esté roto para arreglarlo');
  }
});

const controles = new Controles(canvas, camaraIso, gestor, sala, {
  alSeleccionar(m) {
    ui.acciones(!!m);
  },
  alMoverCamara() {
    sala.actualizarParedes(camaraIso.direccionHorizontal());
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
    ui.monedas(monedas);
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

ui.monedas(monedas);
redimensionar();
sala.actualizarParedes(camaraIso.direccionHorizontal());

const reloj = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 0.1);
  sala.animar(dt);
  controles.actualizar(dt);
  renderer.render(escena, camaraIso.camara);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
