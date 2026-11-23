const COLORES = ['#2b2420', '#ffffff', '#e05050', '#f08c2a', '#f2d06b', '#8fc46a', '#3f8f5a', '#5ac8d8', '#5a9fd6', '#3f5f9f', '#a070d8', '#e58f9e', '#f4c6cf', '#9c6b45', '#d9b98c', '#9aa0a6'];
const GROSORES = [4, 10, 22, 44];
const FORMATOS = {
  cuadrado: [600, 600],
  vertical: [480, 640],
  horizontal: [640, 480]
};

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rellenar(g, x, y, color) {
  const { width: W, height: H } = g.canvas;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  const i0 = (y * W + x) * 4;
  const obj = [d[i0], d[i0 + 1], d[i0 + 2]];
  const nuevo = hexRgb(color);
  const parecido = i => Math.abs(d[i] - obj[0]) + Math.abs(d[i + 1] - obj[1]) + Math.abs(d[i + 2] - obj[2]) < 60;
  if (Math.abs(obj[0] - nuevo[0]) + Math.abs(obj[1] - nuevo[1]) + Math.abs(obj[2] - nuevo[2]) < 6) return;
  const visto = new Uint8Array(W * H);
  const pila = [[x, y]];
  while (pila.length) {
    const [px, py] = pila.pop();
    let lx = px;
    while (lx >= 0 && !visto[py * W + lx] && parecido((py * W + lx) * 4)) lx--;
    lx++;
    let arriba = false;
    let abajo = false;
    for (let cx = lx; cx < W; cx++) {
      const k = py * W + cx;
      if (visto[k] || !parecido(k * 4)) break;
      visto[k] = 1;
      d[k * 4] = nuevo[0];
      d[k * 4 + 1] = nuevo[1];
      d[k * 4 + 2] = nuevo[2];
      d[k * 4 + 3] = 255;
      if (py > 0) {
        const a = !visto[k - W] && parecido((k - W) * 4);
        if (a && !arriba) pila.push([cx, py - 1]);
        arriba = a;
      }
      if (py < H - 1) {
        const b = !visto[k + W] && parecido((k + W) * 4);
        if (b && !abajo) pila.push([cx, py + 1]);
        abajo = b;
      }
    }
  }
  g.putImageData(img, 0, 0);
}

export function pintarCuadro({ sonido, base = null, formato = 'cuadrado' }) {
  return new Promise(resolve => {
    const capa = document.createElement('div');
    capa.id = 'pintar';
    document.body.appendChild(capa);
    const est = { color: COLORES[0], grosor: 1, herramienta: 'pincel', formato, fondo: '#fffaf2' };
    let lienzo;
    let g;
    const historia = [];
    const guardarPaso = () => {
      historia.push(g.getImageData(0, 0, lienzo.width, lienzo.height));
      if (historia.length > 25) historia.shift();
    };
    const cerrar = res => {
      capa.classList.remove('abierto');
      setTimeout(() => capa.remove(), 250);
      resolve(res);
    };

    const elegirFormato = () => {
      capa.innerHTML = `
        <div class="pt-cab"><button class="pt-cancelar">✕</button><b>🎨 Pintar un cuadro</b><span></span></div>
        <div class="pt-formatos"><p>¿Qué forma tiene el lienzo?</p>
          ${Object.keys(FORMATOS).map(f => `<button data-f="${f}"><i class="f-${f}"></i><small>${f[0].toUpperCase() + f.slice(1)}</small></button>`).join('')}
          <p>Color de fondo</p>
          <div class="pt-fondos">${['#fffaf2', '#ffffff', '#f4e9dc', '#cfe4f5', '#2b2b45', '#f4c6cf'].map(c => `<button data-fondo="${c}" style="background:${c}" class="${c === est.fondo ? 'activo' : ''}"></button>`).join('')}</div>
        </div>`;
      capa.querySelector('.pt-cancelar').addEventListener('click', () => cerrar(null));
      capa.querySelectorAll('[data-fondo]').forEach(b => b.addEventListener('click', () => {
        est.fondo = b.dataset.fondo;
        capa.querySelectorAll('[data-fondo]').forEach(x => x.classList.toggle('activo', x === b));
      }));
      capa.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
        est.formato = b.dataset.f;
        montar();
      }));
    };

    const montar = () => {
      const [W, H] = FORMATOS[est.formato];
      capa.innerHTML = `
        <div class="pt-cab"><button class="pt-cancelar">✕</button><b>🎨 Pintar</b><button class="pt-listo primario">Colgar</button></div>
        <div class="pt-zona"><canvas width="${W}" height="${H}"></canvas></div>
        <div class="pt-herr">
          <button data-h="pincel" class="activa">🖌️</button>
          <button data-h="borrar">🧽</button>
          <button data-h="cubo">🪣</button>
          <span class="pt-sep"></span>
          ${GROSORES.map((s, i) => `<button data-g="${i}" class="${i === est.grosor ? 'activa' : ''}"><i style="width:${Math.max(4, s / 2)}px;height:${Math.max(4, s / 2)}px"></i></button>`).join('')}
          <span class="pt-sep"></span>
          <button data-a="deshacer">↩️</button>
          <button data-a="limpiar">🗑️</button>
        </div>
        <div class="pt-colores">${COLORES.map(c => `<button data-c="${c}" style="background:${c}" class="${c === est.color ? 'activo' : ''}"></button>`).join('')}<label class="pt-libre">🌈<input type="color" value="#e58f9e"></label></div>`;
      lienzo = capa.querySelector('canvas');
      g = lienzo.getContext('2d', { willReadFrequently: true });
      g.fillStyle = est.fondo;
      g.fillRect(0, 0, W, H);
      if (base) {
        const img = new Image();
        img.onload = () => g.drawImage(img, 0, 0, W, H);
        img.src = base;
      }
      g.lineCap = 'round';
      g.lineJoin = 'round';
      capa.querySelector('.pt-cancelar').addEventListener('click', () => {
        if (historia.length > 1 && !confirm('¿Salir sin guardar el cuadro?')) return;
        cerrar(null);
      });
      capa.querySelector('.pt-listo').addEventListener('click', () => {
        cerrar({ data: lienzo.toDataURL('image/jpeg', 0.88), ancho: W, alto: H });
      });
      capa.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => {
        est.herramienta = b.dataset.h;
        capa.querySelectorAll('[data-h]').forEach(x => x.classList.toggle('activa', x === b));
        sonido && sonido.tic();
      }));
      capa.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
        est.grosor = Number(b.dataset.g);
        capa.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('activa', x === b));
        sonido && sonido.tic();
      }));
      const ponerColor = c => {
        est.color = c;
        capa.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('activo', x.dataset.c === c));
        if (est.herramienta === 'borrar') capa.querySelector('[data-h=pincel]').click();
      };
      capa.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => ponerColor(b.dataset.c)));
      capa.querySelector('.pt-libre input').addEventListener('input', e => ponerColor(e.target.value));
      capa.querySelector('[data-a=deshacer]').addEventListener('click', () => {
        if (historia.length > 1) {
          historia.pop();
          g.putImageData(historia[historia.length - 1], 0, 0);
          sonido && sonido.pop();
        }
      });
      capa.querySelector('[data-a=limpiar]').addEventListener('click', () => {
        g.fillStyle = est.fondo;
        g.fillRect(0, 0, W, H);
        guardarPaso();
        sonido && sonido.pop();
      });

      const punto = e => {
        const r = lienzo.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
      };
      let trazo = null;
      lienzo.addEventListener('pointerdown', e => {
        e.preventDefault();
        lienzo.setPointerCapture(e.pointerId);
        const [x, y] = punto(e);
        if (est.herramienta === 'cubo') {
          rellenar(g, x, y, est.color);
          guardarPaso();
          sonido && sonido.pop();
          return;
        }
        trazo = { pts: [[x, y]] };
        g.strokeStyle = est.herramienta === 'borrar' ? est.fondo : est.color;
        g.fillStyle = g.strokeStyle;
        g.lineWidth = GROSORES[est.grosor] * (est.herramienta === 'borrar' ? 1.6 : 1);
        g.beginPath();
        g.arc(x, y, g.lineWidth / 2, 0, Math.PI * 2);
        g.fill();
      });
      lienzo.addEventListener('pointermove', e => {
        if (!trazo) return;
        const eventos = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of eventos.length ? eventos : [e]) {
          const p = punto(ev);
          const pts = trazo.pts;
          const a = pts[pts.length - 1];
          pts.push(p);
          const m = [(a[0] + p[0]) / 2, (a[1] + p[1]) / 2];
          g.beginPath();
          if (pts.length > 2) {
            const prev = pts[pts.length - 3];
            g.moveTo((prev[0] + a[0]) / 2, (prev[1] + a[1]) / 2);
            g.quadraticCurveTo(a[0], a[1], m[0], m[1]);
          } else {
            g.moveTo(a[0], a[1]);
            g.lineTo(m[0], m[1]);
          }
          g.stroke();
        }
      });
      const fin = () => {
        if (!trazo) return;
        trazo = null;
        guardarPaso();
      };
      lienzo.addEventListener('pointerup', fin);
      lienzo.addEventListener('pointercancel', fin);
      setTimeout(guardarPaso, base ? 200 : 0);
    };

    requestAnimationFrame(() => capa.classList.add('abierto'));
    if (base) montar();
    else elegirFormato();
  });
}
