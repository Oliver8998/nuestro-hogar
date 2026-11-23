const FILTROS = [
  { id: 'normal', nombre: 'Normal', css: 'none', p: null },
  { id: 'calido', nombre: 'Cálido', css: 'sepia(.25) saturate(1.25) brightness(1.04)', p: { sepia: 0.25, sat: 1.25, bri: 1.04 } },
  { id: 'frio', nombre: 'Frío', css: 'saturate(.9) brightness(1.05) contrast(1.05)', p: { sat: 0.9, bri: 1.05, con: 1.05, mul: [0.94, 1, 1.1] } },
  { id: 'vintage', nombre: 'Vintage', css: 'sepia(.45) contrast(.9) brightness(1.08) saturate(.85)', p: { sepia: 0.45, con: 0.9, bri: 1.08, sat: 0.85 } },
  { id: 'bn', nombre: 'B/N', css: 'grayscale(1) contrast(1.1)', p: { sat: 0, con: 1.1 } },
  { id: 'sonador', nombre: 'Soñador', css: 'saturate(1.3) brightness(1.1) contrast(.88)', p: { sat: 1.3, bri: 1.1, con: 0.88, mul: [1.04, 1, 1.04] } },
  { id: 'peli', nombre: 'Peli', css: 'contrast(1.2) saturate(1.15) brightness(.95)', p: { con: 1.2, sat: 1.15, bri: 0.95 } }
];

function aplicarFiltro(g, x, y, w, h, p) {
  if (!p) return;
  const img = g.getImageData(x, y, w, h);
  const d = img.data;
  const { sepia = 0, sat = 1, bri = 1, con = 1, mul = [1, 1, 1] } = p;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let gg = d[i + 1];
    let b = d[i + 2];
    if (sepia) {
      const sr = 0.393 * r + 0.769 * gg + 0.189 * b;
      const sg = 0.349 * r + 0.686 * gg + 0.168 * b;
      const sb = 0.272 * r + 0.534 * gg + 0.131 * b;
      r += (sr - r) * sepia;
      gg += (sg - gg) * sepia;
      b += (sb - b) * sepia;
    }
    const l = 0.299 * r + 0.587 * gg + 0.114 * b;
    r = (l + (r - l) * sat) * mul[0] * bri;
    gg = (l + (gg - l) * sat) * mul[1] * bri;
    b = (l + (b - l) * sat) * mul[2] * bri;
    d[i] = (r - 128) * con + 128;
    d[i + 1] = (gg - 128) * con + 128;
    d[i + 2] = (b - 128) * con + 128;
  }
  g.putImageData(img, x, y);
}

const PEGATINAS = ['💕', '❤️', '✨', '⭐', '🌸', '🐾', '🏠', '🎉', '😍', '🥰', '🌈', '☕', '🍕', '🎈', '🌙', '🐶', '🐱', '👑', '💍', '🍰'];

const MARCOS = [
  { id: 'polaroid', nombre: 'Polaroid' },
  { id: 'corazones', nombre: 'Corazones' },
  { id: 'washi', nombre: 'Washi' },
  { id: 'peli', nombre: 'Carrete' },
  { id: 'ninguno', nombre: 'Sin marco' }
];

function corazon(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.6, y - s * 1.4, x, y - s * 0.5);
  g.bezierCurveTo(x + s * 0.6, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  g.fill();
}

export function componer(foto, { filtro = 'normal', marco = 'polaroid', pegatinas = [], titulo = '', subtitulo = '' }) {
  const fil = FILTROS.find(f => f.id === filtro) || FILTROS[0];
  const F = foto.width;
  const conTexto = marco === 'polaroid' || marco === 'corazones';
  const borde = marco === 'ninguno' ? 0 : marco === 'peli' ? 70 : 50;
  const W = F + borde * 2;
  const H = F + borde * 2 + (conTexto ? 230 : 0);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = marco === 'peli' ? '#1d1b1a' : marco === 'corazones' ? '#fde8ec' : '#fffaf2';
  g.fillRect(0, 0, W, H);
  g.drawImage(foto, borde, borde);
  aplicarFiltro(g, borde, borde, F, F, fil.p);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (const p of pegatinas) {
    g.font = `${p.tam * F}px serif`;
    g.save();
    g.translate(borde + p.x * F, borde + p.y * F);
    g.rotate(p.rot || 0);
    g.fillText(p.e, 0, 0);
    g.restore();
  }
  if (marco === 'corazones') {
    g.fillStyle = '#e58f9e';
    for (let k = 0; k < 18; k++) {
      const t = k / 18;
      corazon(g, 20 + t * (W - 40), 22, 12);
      corazon(g, 20 + t * (W - 40), F + borde * 2 - 22, 12);
    }
    for (let k = 1; k < 16; k++) {
      const t = k / 16;
      corazon(g, 22, t * (F + borde * 2), 12);
      corazon(g, W - 22, t * (F + borde * 2), 12);
    }
  }
  if (marco === 'washi') {
    const cinta = (x, y, a, col) => {
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = col;
      g.globalAlpha = 0.8;
      g.fillRect(-90, -24, 180, 48);
      g.globalAlpha = 0.35;
      g.fillStyle = '#fff';
      for (let i = -90; i < 90; i += 20) g.fillRect(i, -24, 8, 48);
      g.restore();
    };
    cinta(borde + 40, borde + 10, -0.6, '#f4b3be');
    cinta(W - borde - 40, borde + 10, 0.6, '#9cc8b8');
    cinta(borde + 40, H - borde - 10, 0.6, '#f2d06b');
    cinta(W - borde - 40, H - borde - 10, -0.6, '#b39ddb');
  }
  if (marco === 'peli') {
    g.fillStyle = '#f6efe2';
    for (let y = 16; y < H; y += 46) {
      g.fillRect(18, y, 30, 22);
      g.fillRect(W - 48, y, 30, 22);
    }
  }
  if (conTexto) {
    g.fillStyle = '#3b2f26';
    g.font = '900 56px Nunito, system-ui, sans-serif';
    g.fillText(titulo, W / 2, F + borde * 2 + 80, W - 80);
    g.font = '700 32px Nunito, system-ui, sans-serif';
    g.fillStyle = '#8a7360';
    g.fillText(subtitulo, W / 2, F + borde * 2 + 150, W - 80);
  }
  return c;
}

export function editarFoto(foto, { titulo, subtitulo, sonido }) {
  return new Promise(resolve => {
    const est = { filtro: 'normal', marco: 'polaroid', pegatinas: [], tab: 'filtros', sel: null };
    const capa = document.createElement('div');
    capa.id = 'foto-editor';
    capa.innerHTML = `
      <div class="fe-cab"><button class="fe-cancelar">✕</button><b>Editar foto</b><button class="fe-listo primario">Listo</button></div>
      <div class="fe-lienzo"><div class="fe-marco"><img alt=""><div class="fe-pegatinas"></div></div></div>
      <div class="fe-tamano oculto"><span>🔍</span><input type="range" min="0.06" max="0.4" step="0.01"><button class="fe-girar">⟳</button><button class="fe-quitar">🗑️</button></div>
      <div class="fe-tabs"><button data-tab="filtros" class="activa">🎨 Filtros</button><button data-tab="pegatinas">😍 Pegatinas</button><button data-tab="marcos">🖼️ Marcos</button></div>
      <div class="fe-opciones"></div>`;
    document.body.appendChild(capa);
    requestAnimationFrame(() => capa.classList.add('abierto'));
    const img = capa.querySelector('.fe-marco img');
    img.src = foto.toDataURL('image/jpeg', 0.85);
    const caja = capa.querySelector('.fe-pegatinas');
    const marcoEl = capa.querySelector('.fe-marco');
    const opciones = capa.querySelector('.fe-opciones');
    const tamano = capa.querySelector('.fe-tamano');
    const rango = tamano.querySelector('input');
    const miniatura = (() => {
      const c = document.createElement('canvas');
      c.width = 120;
      c.height = 120;
      c.getContext('2d').drawImage(foto, 0, 0, 120, 120);
      return c.toDataURL('image/jpeg', 0.7);
    })();

    const pintarPegatinas = () => {
      caja.innerHTML = est.pegatinas.map((p, i) => `<span data-i="${i}" class="${est.sel === i ? 'sel' : ''}" style="left:${p.x * 100}%;top:${p.y * 100}%;font-size:${p.tam * 100}cqw;transform:translate(-50%,-50%) rotate(${p.rot}rad)">${p.e}</span>`).join('');
      tamano.classList.toggle('oculto', est.sel === null);
      if (est.sel !== null) rango.value = est.pegatinas[est.sel].tam;
      caja.querySelectorAll('span').forEach(s => s.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        const i = Number(s.dataset.i);
        est.sel = i;
        pintarPegatinas();
        const r = caja.getBoundingClientRect();
        const mover = ev => {
          const p = est.pegatinas[i];
          p.x = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
          p.y = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
          const el = caja.querySelector(`span[data-i="${i}"]`);
          if (el) {
            el.style.left = `${p.x * 100}%`;
            el.style.top = `${p.y * 100}%`;
          }
        };
        const soltar = () => {
          window.removeEventListener('pointermove', mover);
          window.removeEventListener('pointerup', soltar);
        };
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
      }));
    };
    caja.addEventListener('pointerdown', () => {
      est.sel = null;
      pintarPegatinas();
    });
    rango.addEventListener('input', () => {
      if (est.sel === null) return;
      est.pegatinas[est.sel].tam = Number(rango.value);
      pintarPegatinas();
    });
    tamano.querySelector('.fe-girar').addEventListener('click', () => {
      if (est.sel === null) return;
      est.pegatinas[est.sel].rot = (est.pegatinas[est.sel].rot || 0) + 0.3;
      pintarPegatinas();
    });
    tamano.querySelector('.fe-quitar').addEventListener('click', () => {
      if (est.sel === null) return;
      est.pegatinas.splice(est.sel, 1);
      est.sel = null;
      pintarPegatinas();
    });

    const pintarOpciones = () => {
      capa.querySelectorAll('.fe-tabs button').forEach(b => b.classList.toggle('activa', b.dataset.tab === est.tab));
      if (est.tab === 'filtros') {
        opciones.innerHTML = FILTROS.map(f => `<button data-f="${f.id}" class="${est.filtro === f.id ? 'activa' : ''}"><img src="${miniatura}" style="filter:${f.css}" alt=""><small>${f.nombre}</small></button>`).join('');
        opciones.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
          est.filtro = b.dataset.f;
          img.style.filter = FILTROS.find(f => f.id === est.filtro).css;
          sonido && sonido.tic();
          pintarOpciones();
        }));
      } else if (est.tab === 'pegatinas') {
        opciones.innerHTML = PEGATINAS.map(e => `<button class="fe-peg" data-e="${e}">${e}</button>`).join('');
        opciones.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
          est.pegatinas.push({ e: b.dataset.e, x: 0.3 + Math.random() * 0.4, y: 0.3 + Math.random() * 0.4, tam: 0.14, rot: (Math.random() - 0.5) * 0.5 });
          est.sel = est.pegatinas.length - 1;
          sonido && sonido.pop();
          pintarPegatinas();
        }));
      } else {
        opciones.innerHTML = MARCOS.map(m => `<button data-m="${m.id}" class="fe-marco-op ${est.marco === m.id ? 'activa' : ''}"><i class="m-${m.id}"></i><small>${m.nombre}</small></button>`).join('');
        opciones.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
          est.marco = b.dataset.m;
          marcoEl.className = `fe-marco m-${est.marco}`;
          sonido && sonido.tic();
          pintarOpciones();
        }));
      }
    };
    capa.querySelectorAll('.fe-tabs button').forEach(b => b.addEventListener('click', () => {
      est.tab = b.dataset.tab;
      pintarOpciones();
    }));
    marcoEl.className = 'fe-marco m-polaroid';
    pintarOpciones();
    pintarPegatinas();

    const cerrar = res => {
      capa.classList.remove('abierto');
      setTimeout(() => capa.remove(), 250);
      resolve(res);
    };
    capa.querySelector('.fe-cancelar').addEventListener('click', () => cerrar(null));
    capa.querySelector('.fe-listo').addEventListener('click', () => {
      const c = componer(foto, { ...est, titulo, subtitulo });
      cerrar({ url: c.toDataURL('image/jpeg', 0.9), lienzo: c, filtro: est.filtro, pegatinas: est.pegatinas.length });
    });
  });
}
