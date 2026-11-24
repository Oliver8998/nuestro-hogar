const limitar = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function abrirBano(ctx, m) {
  const { juegos, sonido, miniaturas } = ctx;
  return juegos.custom('🛁', `Bañar a ${m.nombre}`, j => {
    j.info('🧽 Frota las manchas de barro hasta que no quede ninguna. Luego aclara toda la espuma con la ducha 🚿');
    j.cuerpo.innerHTML = `<div class="t2 t2-bano"><div class="t2-marcador"></div>
      <div class="ba-bano"><div class="ba-pared"></div><div class="ba-tina"><div class="ba-agua"></div></div><img class="ba-mascota" src="${miniaturas.mascota(m.especie)}" alt=""><canvas class="ba-capa"></canvas><div class="ba-patito">🦆</div></div>
      <div class="ba-herramientas"><button data-h="esponja" class="activo">🧽 Enjabonar</button><button data-h="ducha">🚿 Aclarar</button></div></div>`;
    const caja = j.cuerpo.querySelector('.t2-bano');
    const zona = caja.querySelector('.ba-bano');
    const lienzo = caja.querySelector('.ba-capa');
    const img = caja.querySelector('.ba-mascota');
    const botones = [...caja.querySelectorAll('.ba-herramientas button')];
    const g = lienzo.getContext('2d');
    let W = 0;
    let H = 0;
    const medir = () => {
      const r = zona.getBoundingClientRect();
      W = lienzo.width = Math.round(r.width);
      H = lienzo.height = Math.round(r.height);
    };
    medir();
    const n = Math.max(4, Math.round(4 + (m.sucia || 0.5) * 6));
    const manchas = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      return { x: 0.5 + Math.cos(a) * d * 0.2, y: 0.42 + Math.sin(a) * d * 0.15, r: 0.04 + Math.random() * 0.035, v: 1, forma: Array.from({ length: 5 }, () => [Math.random() - 0.5, Math.random() - 0.5, 0.5 + Math.random() * 0.6]) };
    });
    const espuma = [];
    const gotas = [];
    let herramienta = 'esponja';
    let puntero = null;
    let fase = 'frotar';
    let t = 0;
    let vivo = true;
    let ultimoSonido = 0;
    const elegir = h => {
      herramienta = h;
      botones.forEach(b => b.classList.toggle('activo', b.dataset.h === h));
      zona.dataset.h = h;
    };
    botones.forEach(b => b.addEventListener('click', () => elegir(b.dataset.h)));
    elegir('esponja');
    const marcador = () => {
      const quedan = manchas.filter(x => x.v > 0.05).length;
      const el = caja.querySelector('.t2-marcador');
      el.textContent = fase === 'frotar' ? `🟤 ${quedan} manchas · 🫧 ${espuma.length}` : fase === 'aclarar' ? `🫧 Quedan ${espuma.length} burbujas` : '✨ ¡Limpio!';
    };
    const mover = (x, y, dx) => {
      if (fase === 'fin') return;
      if (herramienta === 'esponja') {
        let froto = false;
        for (const k of manchas) {
          const d = Math.hypot(x / W - k.x, y / H - k.y);
          if (d < k.r + 0.06 && k.v > 0) {
            k.v = Math.max(0, k.v - dx * 0.0045);
            froto = true;
          }
        }
        if (espuma.length < 260 && Math.random() < 0.7) espuma.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, r: 5 + Math.random() * 9 });
        if (froto && performance.now() - ultimoSonido > 120) {
          ultimoSonido = performance.now();
          sonido.tono(900 + Math.random() * 400, 0, 0.04, { tipo: 'sine', volumen: 0.02 });
        }
        if (fase === 'frotar' && manchas.every(k => k.v <= 0.05)) {
          fase = 'aclarar';
          sonido.arreglo();
          j.info('¡Sin barro! Ahora 🚿 aclara toda la espuma');
          elegir('ducha');
        }
      } else {
        for (let i = 0; i < 3; i++) gotas.push({ x: x + (Math.random() - 0.5) * 34, y: y - 40, v: 300 + Math.random() * 200, vida: 0.25 });
        if (fase === 'frotar') return;
        for (let i = espuma.length - 1; i >= 0; i--) {
          const e = espuma[i];
          if (Math.hypot(e.x - x, e.y - y) < 36) espuma.splice(i, 1);
        }
        if (performance.now() - ultimoSonido > 160) {
          ultimoSonido = performance.now();
          sonido.ruido(0.12, { volumen: 0.02 });
        }
        if (fase === 'aclarar' && espuma.length === 0) terminar();
      }
      marcador();
    };
    lienzo.addEventListener('pointerdown', e => {
      e.preventDefault();
      lienzo.setPointerCapture(e.pointerId);
      const r = lienzo.getBoundingClientRect();
      puntero = { x: e.clientX - r.left, y: e.clientY - r.top };
      mover(puntero.x, puntero.y, 0);
    });
    lienzo.addEventListener('pointermove', e => {
      if (!puntero) return;
      const r = lienzo.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const dx = Math.hypot(x - puntero.x, y - puntero.y);
      puntero = { x, y };
      mover(x, y, dx);
    });
    const soltar = () => { puntero = null; };
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    const terminar = () => {
      if (fase === 'fin') return;
      fase = 'fin';
      marcador();
      img.classList.add('sacude');
      sonido.premio();
      for (let i = 0; i < 30; i++) gotas.push({ x: W / 2 + (Math.random() - 0.5) * 60, y: H / 2, vx: (Math.random() - 0.5) * 500, v: -200 - Math.random() * 200, vida: 0.9, sacude: true });
      setTimeout(() => {
        vivo = false;
        j.final(t < 20 ? '¡Reluciente y en un momento! ✨' : '¡Limpito y oliendo a champú! 🫧', limitar(1 - Math.max(0, t - 15) / 40));
      }, 1300);
    };
    let ultimo = performance.now();
    const dibujar = ahora => {
      if (!vivo) return;
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      t += dt;
      if (lienzo.width !== Math.round(zona.getBoundingClientRect().width)) medir();
      g.clearRect(0, 0, W, H);
      for (const k of manchas) {
        if (k.v <= 0.02) continue;
        g.fillStyle = `rgba(107, 74, 43, ${0.85 * k.v})`;
        for (const [ox, oy, s] of k.forma) {
          g.beginPath();
          g.arc((k.x + ox * k.r) * W, (k.y + oy * k.r) * H, k.r * W * 0.55 * s, 0, Math.PI * 2);
          g.fill();
        }
      }
      for (const e of espuma) {
        g.beginPath();
        g.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,0.88)';
        g.fill();
        g.strokeStyle = 'rgba(150,200,230,0.8)';
        g.lineWidth = 1.5;
        g.stroke();
      }
      g.strokeStyle = 'rgba(90,170,230,0.8)';
      g.lineWidth = 2;
      for (let i = gotas.length - 1; i >= 0; i--) {
        const d = gotas[i];
        d.vida -= dt;
        if (d.sacude) { d.x += d.vx * dt; d.v += 900 * dt; }
        d.y += d.v * dt;
        g.beginPath();
        g.moveTo(d.x, d.y);
        g.lineTo(d.x + (d.vx || 0) * 0.02, d.y + 8);
        g.stroke();
        if (d.vida <= 0) gotas.splice(i, 1);
      }
      requestAnimationFrame(dibujar);
    };
    requestAnimationFrame(dibujar);
    marcador();
    const previo = j.alTerminar;
    j.alTerminar = () => { vivo = false; if (previo) previo(); };
  }, { clave: 'bano', que: `${m.nombre} se ha puesto perdido de barro. ¡Toca baño!` });
}
