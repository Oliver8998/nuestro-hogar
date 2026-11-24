import { INTROS } from './intros.js';

const CLAVE_SALTAR = 'hogar-intro-saltar';

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SALTAR)) || [];
  } catch (e) {
    return [];
  }
}

export function introSaltada(clave) {
  return leer().includes(clave);
}

function marcar(clave, saltar) {
  const l = leer().filter(c => c !== clave);
  if (saltar) l.push(clave);
  try {
    localStorage.setItem(CLAVE_SALTAR, JSON.stringify(l));
  } catch (e) {}
}

export function rutaVideo(clave) {
  return `assets/videos/${clave.replace(/[:]/g, '-')}.mp4`;
}

export function hayIntro(clave) {
  return !!(clave && INTROS[clave]);
}

export function mostrarIntro({ clave, icono, nombre, que = '', como = '', extra = '', sonido = null, boton = '▶ ¡A jugar!' }) {
  const datos = INTROS[clave] || {};
  que = que || datos.que || '';
  como = como || datos.como || '';
  return new Promise(resolve => {
    const capa = document.createElement('div');
    capa.id = 'intro-juego';
    capa.innerHTML = `
      <div class="in-caja">
        <div class="in-cabecera"><b>${icono} ${nombre}</b><button class="cerrar" aria-label="Cerrar">✕</button></div>
        <div class="in-video">
          ${datos.video !== false ? `<video src="${typeof datos.video === 'string' ? `assets/videos/${datos.video}.mp4` : rutaVideo(clave)}" autoplay muted loop playsinline preload="auto"></video>` : ''}
          <span class="in-icono">${icono}</span>
        </div>
        <button class="in-jugar primario">${boton}</button>
        <div class="in-texto">
          ${que ? `<h4>¿De qué va?</h4><p>${que}</p>` : ''}
          ${como ? `<h4>Cómo se juega</h4><p>${como}</p>` : ''}
          ${extra ? `<p class="in-extra">${extra}</p>` : ''}
        </div>
        <label class="in-saltar"><input type="checkbox"> No volver a mostrar esta explicación</label>
      </div>`;
    document.body.appendChild(capa);
    const video = capa.querySelector('video');
    const caja = capa.querySelector('.in-video');
    if (video) {
      video.addEventListener('playing', () => caja.classList.add('con-video'));
      video.addEventListener('error', () => caja.classList.remove('con-video'));
      const p = video.play && video.play();
      if (p && p.catch) p.catch(() => {});
    }
    requestAnimationFrame(() => capa.classList.add('abierto'));
    const cerrar = ok => {
      if (video) video.pause();
      capa.classList.remove('abierto');
      setTimeout(() => capa.remove(), 220);
      resolve(ok);
    };
    capa.querySelector('.cerrar').addEventListener('click', () => {
      if (sonido) sonido.tocar && sonido.tocar();
      cerrar(false);
    });
    capa.querySelector('.in-jugar').addEventListener('click', () => {
      marcar(clave, capa.querySelector('.in-saltar input').checked);
      if (sonido && sonido.pop) sonido.pop();
      cerrar(true);
    });
  });
}

export async function conIntro(op, abrir) {
  if (op && op.clave && !window.__sinIntro && !introSaltada(op.clave) && (hayIntro(op.clave) || op.que || op.como)) {
    const ok = await mostrarIntro(op);
    if (!ok) return null;
  }
  return abrir();
}
