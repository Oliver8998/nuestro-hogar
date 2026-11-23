const DIA = 86400000;
const TURNOS = 3;

function barajar(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function azar(n) {
  return Math.floor(Math.random() * n);
}

function hash(t) {
  let x = 2166136261;
  for (const c of t) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return x;
}

function cronometro(j, seg, alFin, alTick) {
  const ini = performance.now();
  let vivo = true;
  const id = setInterval(() => {
    if (!vivo) return;
    const t = (performance.now() - ini) / 1000;
    j.tiempo(Math.max(0, 1 - t / seg));
    if (alTick) alTick(t);
    if (t >= seg) {
      vivo = false;
      clearInterval(id);
      alFin();
    }
  }, 100);
  const parar = () => {
    vivo = false;
    clearInterval(id);
  };
  const previo = j.alTerminar;
  j.alTerminar = () => {
    parar();
    if (previo) previo();
  };
  return parar;
}

function bucle(j, fn) {
  let vivo = true;
  let ultimo = performance.now();
  const paso = t => {
    if (!vivo) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    if (fn(dt) === false) return;
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  const parar = () => { vivo = false; };
  const previo = j.alTerminar;
  j.alTerminar = () => {
    parar();
    if (previo) previo();
  };
  return parar;
}

function marcador(j, texto) {
  const el = j.cuerpo.querySelector('.tb-marcador');
  if (el) el.innerHTML = texto;
}

const euros = c => `${(c / 100).toFixed(2).replace('.', ',')} €`;

export const TRABAJOS = [
  {
    id: 'pizza', icono: '🍕', nombre: 'Repartidor de pizzas', texto: 'Llevad cada pizza al portal correcto antes de que se enfríe', pago: 110,
    jugar(j, s) {
      let bien = 0;
      let mal = 0;
      let pedido = 0;
      j.info('Mira el número del pedido y toca ese portal. ¡Rápido, que se enfría!');
      const ronda = () => {
        const nums = barajar(Array.from({ length: 40 }, (_, i) => i + 1)).slice(0, 12);
        pedido = nums[azar(nums.length)];
        const casas = ['🏠', '🏡', '🏢', '🏘️', '🏬', '🏣'];
        j.cuerpo.innerHTML = `<div class="tb-pizza"><div class="tb-marcador"></div><div class="tb-pedido">🛵🍕 <span>Calle Mayor, nº <b>${pedido}</b></span></div>
          <div class="tb-calle">${nums.map(n => `<button data-n="${n}"><i>${casas[n % casas.length]}</i><b>${n}</b></button>`).join('')}</div></div>`;
        marcador(j, `✅ ${bien} entregadas · ❌ ${mal}`);
        j.cuerpo.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
          if (Number(b.dataset.n) === pedido) {
            bien++;
            s.sonido.arreglo();
          } else {
            mal++;
            s.sonido.error();
            b.classList.add('mal');
            marcador(j, `✅ ${bien} entregadas · ❌ ${mal}`);
            return;
          }
          ronda();
        }));
      };
      ronda();
      cronometro(j, 40, () => j.final(`¡${bien} pizzas entregadas calentitas!`, Math.max(0, Math.min(1, (bien - mal * 0.5) / 14))));
    }
  },
  {
    id: 'barista', icono: '☕', nombre: 'Barista', texto: 'Preparad los cafés tal y como los piden los clientes', pago: 120,
    jugar(j, s) {
      const ING = { cafe: ['☕', 'Café', '#5b3a29'], leche: ['🥛', 'Leche', '#f2ece0'], espuma: ['☁️', 'Espuma', '#fffaf2'], cacao: ['🍫', 'Cacao', '#7a4a2e'], hielo: ['🧊', 'Hielo', '#cfe9f5'], caramelo: ['🍯', 'Caramelo', '#e0a83a'] };
      const CARTA = [
        ['Cortado', ['cafe', 'leche']], ['Capuchino', ['cafe', 'leche', 'espuma']], ['Moca', ['cafe', 'cacao', 'leche', 'espuma']],
        ['Café con hielo', ['cafe', 'hielo']], ['Latte de caramelo', ['cafe', 'leche', 'caramelo']], ['Chocolate', ['cacao', 'leche', 'espuma']], ['Frappé', ['cafe', 'hielo', 'leche', 'espuma']]
      ];
      let bien = 0;
      let pedido;
      let vaso = [];
      const clientes = ['👩', '👨', '👵', '🧑‍🦱', '👩‍🦰', '🧔', '👱‍♀️', '🧑‍💼'];
      j.info('Lee la carta y echa los ingredientes en orden. Si te equivocas, tira el vaso 🗑️');
      const pintarVaso = () => {
        const v = j.cuerpo.querySelector('.tb-vaso');
        v.innerHTML = vaso.map(k => `<i style="background:${ING[k][2]}"></i>`).join('');
      };
      const nuevo = () => {
        pedido = CARTA[azar(CARTA.length)];
        vaso = [];
        j.cuerpo.querySelector('.tb-cliente').innerHTML = `${clientes[azar(clientes.length)]} <span>«Un <b>${pedido[0].toLowerCase()}</b>, porfa»</span>`;
        pintarVaso();
      };
      j.cuerpo.innerHTML = `<div class="tb-barista"><div class="tb-marcador"></div>
        <div class="tb-carta">${CARTA.map(([n, r]) => `<div><b>${n}</b><span>${r.map(k => ING[k][0]).join('')}</span></div>`).join('')}</div>
        <div class="tb-cliente"></div><div class="tb-vaso"></div>
        <div class="tb-ingredientes">${Object.entries(ING).map(([k, v]) => `<button data-k="${k}">${v[0]}<small>${v[1]}</small></button>`).join('')}</div>
        <div class="tb-acciones"><button class="tb-tirar">🗑️ Tirar</button><button class="tb-servir primario">Servir ☕</button></div></div>`;
      marcador(j, '0 cafés servidos');
      j.cuerpo.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
        if (vaso.length >= 5) return;
        vaso.push(b.dataset.k);
        s.sonido.pop();
        pintarVaso();
      }));
      j.cuerpo.querySelector('.tb-tirar').addEventListener('click', () => { vaso = []; pintarVaso(); s.sonido.pop(); });
      j.cuerpo.querySelector('.tb-servir').addEventListener('click', () => {
        const ok = vaso.join() === pedido[1].join();
        if (ok) {
          bien++;
          s.sonido.arreglo();
          marcador(j, `${bien} cafés servidos`);
          nuevo();
        } else {
          s.sonido.error();
          j.cuerpo.querySelector('.tb-cliente span').innerHTML = '«¡Esto no es lo que he pedido! 😤»';
          vaso = [];
          pintarVaso();
          setTimeout(() => j.cuerpo.querySelector('.tb-cliente span') && (j.cuerpo.querySelector('.tb-cliente span').innerHTML = `«Un <b>${pedido[0].toLowerCase()}</b>, porfa»`), 900);
        }
      });
      nuevo();
      cronometro(j, 50, () => j.final(`¡${bien} cafés servidos!`, Math.min(1, bien / 9)));
    }
  },
  {
    id: 'florista', icono: '💐', nombre: 'Floristería', texto: 'Montad los ramos exactamente como los encargan', pago: 110,
    jugar(j, s) {
      const FLORES = ['🌹', '🌷', '🌻', '🌼', '🪻', '🌸'];
      let bien = 0;
      let pedido;
      let ramo = [];
      j.info('Pon justo las flores que pide el encargo (ni una más) y entrégalo');
      const cuenta = l => l.reduce((a, f) => ({ ...a, [f]: (a[f] || 0) + 1 }), {});
      const pintar = () => {
        j.cuerpo.querySelector('.tb-ramo').innerHTML = ramo.length ? ramo.map(f => `<span>${f}</span>`).join('') : '<small>Ramo vacío</small>';
      };
      const nuevo = () => {
        const tipos = barajar([...FLORES]).slice(0, 2 + azar(2));
        pedido = {};
        for (const t of tipos) pedido[t] = 1 + azar(3);
        ramo = [];
        j.cuerpo.querySelector('.tb-encargo').innerHTML = `📝 Encargo: ${Object.entries(pedido).map(([f, n]) => `<b>${n}×${f}</b>`).join(' ')}`;
        pintar();
      };
      j.cuerpo.innerHTML = `<div class="tb-florista"><div class="tb-marcador"></div><div class="tb-encargo"></div><div class="tb-ramo"></div>
        <div class="tb-flores">${FLORES.map(f => `<button data-f="${f}">${f}</button>`).join('')}</div>
        <div class="tb-acciones"><button class="tb-tirar">↩️ Quitar</button><button class="tb-servir primario">Entregar 💐</button></div></div>`;
      marcador(j, '0 ramos');
      j.cuerpo.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
        if (ramo.length >= 10) return;
        ramo.push(b.dataset.f);
        s.sonido.pop();
        pintar();
      }));
      j.cuerpo.querySelector('.tb-tirar').addEventListener('click', () => { ramo.pop(); pintar(); });
      j.cuerpo.querySelector('.tb-servir').addEventListener('click', () => {
        const a = cuenta(ramo);
        const ok = Object.keys(a).length === Object.keys(pedido).length && Object.entries(pedido).every(([f, n]) => a[f] === n);
        s.sonido[ok ? 'arreglo' : 'error']();
        if (ok) {
          bien++;
          marcador(j, `${bien} ramos`);
          nuevo();
        } else j.info('¡Ese ramo no es el del encargo! Revísalo');
      });
      nuevo();
      cronometro(j, 45, () => j.final(`¡${bien} ramos preciosos!`, Math.min(1, bien / 8)));
    }
  },
  {
    id: 'almacen', icono: '📦', nombre: 'Mozo de almacén', texto: 'Clasificad los paquetes de la cinta según su destino', pago: 100,
    jugar(j, s) {
      const DEST = [['🔴', 'Madrid'], ['🔵', 'Barcelona'], ['🟢', 'Sevilla']];
      let bien = 0;
      let mal = 0;
      let paquete = null;
      j.info('Mete cada paquete en su camión antes de que se caiga de la cinta');
      j.cuerpo.innerHTML = `<div class="tb-almacen"><div class="tb-marcador"></div><div class="tb-cinta"><div class="tb-paquete">📦<b></b></div></div>
        <div class="tb-camiones">${DEST.map(([e, n], i) => `<button data-d="${i}">🚚<b>${e}</b><small>${n}</small></button>`).join('')}</div></div>`;
      const pq = j.cuerpo.querySelector('.tb-paquete');
      const nuevo = () => {
        paquete = { d: azar(3), x: 0, v: 0.35 + (bien + mal) * 0.018 };
        pq.querySelector('b').textContent = DEST[paquete.d][0];
        pq.classList.remove('cae');
      };
      const marcar = () => marcador(j, `✅ ${bien} · ❌ ${mal}`);
      marcar();
      j.cuerpo.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
        if (!paquete) return;
        if (Number(b.dataset.d) === paquete.d) {
          bien++;
          s.sonido.pop();
        } else {
          mal++;
          s.sonido.error();
        }
        marcar();
        nuevo();
      }));
      nuevo();
      const parar = bucle(j, dt => {
        paquete.x += paquete.v * dt;
        pq.style.left = `${paquete.x * 88}%`;
        if (paquete.x >= 1) {
          mal++;
          s.sonido.error();
          marcar();
          nuevo();
        }
      });
      cronometro(j, 40, () => { parar(); j.final(`${bien} paquetes bien enviados`, Math.max(0, Math.min(1, (bien - mal * 0.5) / 28))); });
    }
  },
  {
    id: 'fachada', icono: '🖌️', nombre: 'Pintor de fachadas', texto: 'Pintad toda la pared con el rodillo sin manchar las ventanas', pago: 120,
    jugar(j, s) {
      const colores = ['#f4b3be', '#9cc8b8', '#f2d06b', '#9cb8d9', '#c9a7d9'];
      const color = colores[azar(colores.length)];
      j.info('Arrastra el dedo para pintar. ¡Las ventanas no se pintan!');
      j.cuerpo.innerHTML = '<div class="tb-fachada"><div class="tb-marcador"></div><canvas width="360" height="300"></canvas></div>';
      const cv = j.cuerpo.querySelector('canvas');
      const g = cv.getContext('2d');
      const W = 360;
      const H = 300;
      const ventanas = [];
      for (let fila = 0; fila < 2; fila++) for (let col = 0; col < 3; col++) ventanas.push([30 + col * 120, 30 + fila * 140, 60, 80]);
      const pintarFondo = () => {
        g.fillStyle = '#b8ab98';
        g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(90,70,50,.15)';
        for (let k = 0; k < 40; k++) g.fillRect(Math.random() * W, Math.random() * H, 12, 6);
      };
      const pintarVentanas = () => {
        for (const [x, y, w, h] of ventanas) {
          g.fillStyle = '#a9d4e8';
          g.fillRect(x, y, w, h);
          g.strokeStyle = '#fffaf2';
          g.lineWidth = 5;
          g.strokeRect(x, y, w, h);
          g.beginPath();
          g.moveTo(x + w / 2, y);
          g.lineTo(x + w / 2, y + h);
          g.stroke();
        }
      };
      pintarFondo();
      pintarVentanas();
      const N = 24;
      const M = 20;
      const celdas = new Uint8Array(N * M);
      const esVentana = (cx, cy) => ventanas.some(([x, y, w, h]) => cx >= x && cx <= x + w && cy >= y && cy <= y + h);
      let total = 0;
      for (let i = 0; i < N; i++) for (let k = 0; k < M; k++) if (!esVentana((i + 0.5) * W / N, (k + 0.5) * H / M)) total++;
      let manchas = 0;
      let ultimo = null;
      const pintarEn = (x, y) => {
        g.strokeStyle = color;
        g.lineWidth = 34;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(ultimo ? ultimo[0] : x, ultimo ? ultimo[1] : y);
        g.lineTo(x, y);
        g.stroke();
        ultimo = [x, y];
        for (let i = 0; i < N; i++) for (let k = 0; k < M; k++) {
          const cx = (i + 0.5) * W / N;
          const cy = (k + 0.5) * H / M;
          if (Math.hypot(cx - x, cy - y) < 18 && !celdas[i * M + k]) {
            celdas[i * M + k] = 1;
            if (esVentana(cx, cy)) manchas++;
          }
        }
      };
      const progreso = () => {
        let hechas = 0;
        for (let i = 0; i < N; i++) for (let k = 0; k < M; k++) if (celdas[i * M + k] && !esVentana((i + 0.5) * W / N, (k + 0.5) * H / M)) hechas++;
        return hechas / total;
      };
      const pos = e => {
        const r = cv.getBoundingClientRect();
        return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
      };
      let pintando = false;
      let fin = false;
      cv.addEventListener('pointerdown', e => { e.preventDefault(); pintando = true; ultimo = null; pintarEn(...pos(e)); });
      cv.addEventListener('pointermove', e => {
        if (!pintando || fin) return;
        pintarEn(...pos(e));
      });
      const soltar = () => {
        pintando = false;
        const p = progreso();
        marcador(j, `🎨 ${Math.round(p * 100)}% pintado ${manchas ? `· 🪟 ${manchas} manchas` : ''}`);
        if (p >= 0.97 && !fin) acabar();
      };
      cv.addEventListener('pointerup', soltar);
      cv.addEventListener('pointercancel', soltar);
      marcador(j, '🎨 0% pintado');
      let parar;
      const acabar = () => {
        fin = true;
        parar();
        const p = progreso();
        j.final(`Pared pintada al ${Math.round(p * 100)}%${manchas ? ` (con ${manchas} manchas en las ventanas)` : ''}`, Math.max(0, Math.min(1, p * 1.05 - manchas * 0.02)));
      };
      parar = cronometro(j, 25, acabar);
      void s;
    }
  },
  {
    id: 'cajero', icono: '🛒', nombre: 'Cajero del súper', texto: 'Devolved el cambio exacto a cada cliente', pago: 130,
    jugar(j, s) {
      const VALORES = [1000, 500, 200, 100, 50, 20, 10, 5];
      let bien = 0;
      let cambio = 0;
      let dado = [];
      j.info('Toca monedas y billetes hasta dar el cambio exacto');
      const nuevo = () => {
        const precio = (50 + azar(1900)) * 5;
        const pagos = [500, 1000, 2000, 5000].filter(p => p > precio);
        const paga = pagos[azar(Math.min(2, pagos.length))];
        cambio = paga - precio;
        dado = [];
        j.cuerpo.querySelector('.tb-ticket').innerHTML = `<div>🧾 Total: <b>${euros(precio)}</b></div><div>💶 Paga con: <b>${euros(paga)}</b></div><div class="cambio">Cambio: <b>?</b></div>`;
        pintar();
      };
      const pintar = () => {
        const suma = dado.reduce((a, b) => a + b, 0);
        j.cuerpo.querySelector('.tb-bandeja').innerHTML = dado.length ? dado.map(v => `<span class="${v >= 500 ? 'billete' : 'moneda'}">${v >= 100 ? `${v / 100}€` : `${v}c`}</span>`).join('') : '<small>Toca para dar el cambio</small>';
        j.cuerpo.querySelector('.tb-suma').textContent = `Llevas: ${euros(suma)}`;
      };
      j.cuerpo.innerHTML = `<div class="tb-cajero"><div class="tb-marcador"></div><div class="tb-ticket"></div><div class="tb-bandeja"></div><small class="tb-suma"></small>
        <div class="tb-caja">${VALORES.map(v => `<button data-v="${v}" class="${v >= 500 ? 'billete' : 'moneda'}">${v >= 100 ? `${v / 100}€` : `${v}c`}</button>`).join('')}</div>
        <div class="tb-acciones"><button class="tb-tirar">↩️ Quitar</button><button class="tb-servir primario">Dar cambio</button></div></div>`;
      marcador(j, '0 clientes atendidos');
      j.cuerpo.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
        dado.push(Number(b.dataset.v));
        s.sonido.tic();
        pintar();
      }));
      j.cuerpo.querySelector('.tb-tirar').addEventListener('click', () => { dado.pop(); pintar(); });
      j.cuerpo.querySelector('.tb-servir').addEventListener('click', () => {
        const suma = dado.reduce((a, b) => a + b, 0);
        if (suma === cambio) {
          bien++;
          s.sonido.comprar();
          marcador(j, `${bien} clientes atendidos`);
          nuevo();
        } else {
          s.sonido.error();
          j.info(suma > cambio ? '¡Le estás dando de más!' : '¡Le falta dinero!');
        }
      });
      nuevo();
      cronometro(j, 60, () => j.final(`¡${bien} clientes contentos!`, Math.min(1, bien / 6)));
    }
  },
  {
    id: 'hamburguesa', icono: '🍔', nombre: 'Hamburguesería', texto: 'Apilad los ingredientes bien centrados para montar hamburguesas', pago: 120,
    jugar(j, s) {
      const CAPAS = [['pan-abajo', '#e0a85a', 22], ['carne', '#6b3f25', 16], ['queso', '#f2c84a', 8], ['lechuga', '#8fc46a', 10], ['tomate', '#e05050', 10], ['pan-arriba', '#e0a85a', 26]];
      let hechas = 0;
      let capa = 0;
      let x = 0;
      let dir = 1;
      let pila = [];
      let cayendo = false;
      j.info('El ingrediente se mueve: toca para soltarlo encima. ¡Que no se caiga!');
      j.cuerpo.innerHTML = `<div class="tb-burger"><div class="tb-marcador"></div><div class="tb-zona"><div class="tb-movil"></div><div class="tb-pila"></div><div class="tb-plato"></div></div><button class="primario grande">¡Soltar!</button></div>`;
      const movil = j.cuerpo.querySelector('.tb-movil');
      const pilaEl = j.cuerpo.querySelector('.tb-pila');
      const pintarMovil = () => {
        const [, color, alto] = CAPAS[capa];
        movil.style.background = color;
        movil.style.height = `${alto}px`;
        movil.style.borderRadius = capa === 5 ? '60px 60px 8px 8px' : capa === 0 ? '6px 6px 20px 20px' : '8px';
      };
      const pintarPila = () => {
        pilaEl.innerHTML = pila.map(p => `<i style="background:${CAPAS[p.c][1]};height:${CAPAS[p.c][2]}px;transform:translateX(${p.x * 100}px);border-radius:${p.c === 5 ? '60px 60px 8px 8px' : p.c === 0 ? '6px 6px 20px 20px' : '8px'}"></i>`).join('');
      };
      marcador(j, '0 hamburguesas');
      pintarMovil();
      const soltar = () => {
        if (cayendo) return;
        const base = pila.length ? pila[pila.length - 1].x : 0;
        const desv = x - base;
        if (Math.abs(desv) > 0.55) {
          s.sonido.error();
          j.info('¡Se ha caído! Empieza otra hamburguesa');
          pila = [];
          capa = 0;
        } else {
          pila.push({ c: capa, x });
          s.sonido.pop();
          capa++;
          if (capa >= CAPAS.length) {
            hechas++;
            s.sonido.arreglo();
            marcador(j, `${hechas} hamburguesas`);
            cayendo = true;
            setTimeout(() => { pila = []; capa = 0; cayendo = false; pintarPila(); pintarMovil(); }, 500);
          }
        }
        pintarPila();
        if (!cayendo) pintarMovil();
      };
      j.cuerpo.querySelector('button').addEventListener('click', soltar);
      j.cuerpo.querySelector('.tb-zona').addEventListener('pointerdown', soltar);
      const parar = bucle(j, dt => {
        x += dir * dt * (1.3 + hechas * 0.25);
        if (x > 1) dir = -1;
        if (x < -1) dir = 1;
        movil.style.transform = `translateX(${x * 100}px)`;
      });
      cronometro(j, 45, () => { parar(); j.final(`¡${hechas} hamburguesas montadas!`, Math.min(1, (hechas + capa / 6) / 5)); });
    }
  },
  {
    id: 'dj', icono: '🎧', nombre: 'DJ en una boda', texto: 'Tocad las notas al ritmo para que la gente no pare de bailar', pago: 130,
    jugar(j, s) {
      j.info('Toca cada carril cuando la nota llegue a la línea');
      j.cuerpo.innerHTML = `<div class="tb-dj"><div class="tb-marcador"></div><canvas width="300" height="380"></canvas><div class="tb-carriles"><button data-l="0">🔴</button><button data-l="1">🟡</button><button data-l="2">🔵</button></div></div>`;
      const cv = j.cuerpo.querySelector('canvas');
      const g = cv.getContext('2d');
      const notas = [];
      const tonos = [[523.3, 659.3, 784], [587.3, 740, 880], [659.3, 830.6, 987.8]];
      let t = 0;
      let siguiente = 1;
      let aciertos = 0;
      let total = 0;
      let racha = 0;
      const LINEA = 330;
      const vel = 170;
      const golpe = l => {
        const n = notas.find(o => o.l === l && !o.hecha && Math.abs(o.y - LINEA) < 34);
        if (n) {
          n.hecha = true;
          aciertos++;
          racha++;
          s.sonido.tono(tonos[l][racha % 3], 0, 0.25, { tipo: 'triangle', volumen: 0.06 });
        } else {
          racha = 0;
          s.sonido.tono(150, 0, 0.12, { tipo: 'square', volumen: 0.03 });
        }
      };
      j.cuerpo.querySelectorAll('[data-l]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); golpe(Number(b.dataset.l)); b.classList.add('pulsado'); setTimeout(() => b.classList.remove('pulsado'), 90); }));
      const parar = bucle(j, dt => {
        t += dt;
        if (t >= siguiente && t < 28) {
          const l = azar(3);
          notas.push({ l, y: -20 });
          total++;
          if (Math.random() < 0.18 && t > 6) {
            notas.push({ l: (l + 1 + azar(2)) % 3, y: -20 });
            total++;
          }
          siguiente = t + Math.max(0.32, 0.75 - t * 0.014);
        }
        g.fillStyle = '#2b2445';
        g.fillRect(0, 0, 300, 380);
        for (let k = 0; k < 3; k++) {
          g.fillStyle = `hsla(${(t * 60 + k * 120) % 360},70%,60%,.08)`;
          g.fillRect(k * 100, 0, 100, 380);
        }
        g.fillStyle = '#fff';
        g.fillRect(0, LINEA - 2, 300, 4);
        const cols = ['#e05050', '#f2d06b', '#5a9fd6'];
        for (const n of notas) {
          n.y += vel * dt;
          if (n.hecha) continue;
          g.fillStyle = cols[n.l];
          g.beginPath();
          g.arc(n.l * 100 + 50, n.y, 22, 0, Math.PI * 2);
          g.fill();
          if (n.y > LINEA + 40 && !n.perdida) {
            n.perdida = true;
            racha = 0;
          }
        }
        marcador(j, `🎵 ${aciertos}/${total} · racha ${racha}`);
        if (t > 31) {
          j.final(`¡La pista no se ha vaciado! ${aciertos} de ${total} notas`, total ? aciertos / total : 0);
          return false;
        }
        j.tiempo(Math.max(0, 1 - t / 31));
      });
      void parar;
    }
  },
  {
    id: 'jardinero', icono: '🌿', nombre: 'Jardinero', texto: 'Quitad las malas hierbas y los caracoles sin tocar las flores', pago: 100,
    jugar(j, s) {
      let puntos = 0;
      j.info('Toca las malas hierbas 🌿 y los caracoles 🐌. ¡Las flores 🌷 no!');
      j.cuerpo.innerHTML = `<div class="tb-jardin"><div class="tb-marcador"></div><div class="tb-hoyos">${Array.from({ length: 12 }, (_, i) => `<button data-i="${i}"><span></span></button>`).join('')}</div></div>`;
      const hoyos = [...j.cuerpo.querySelectorAll('[data-i]')];
      const estado = hoyos.map(() => null);
      const quitar = i => {
        estado[i] = null;
        hoyos[i].querySelector('span').textContent = '';
        hoyos[i].classList.remove('arriba');
      };
      hoyos.forEach((h, i) => h.addEventListener('pointerdown', e => {
        e.preventDefault();
        const c = estado[i];
        if (!c) return;
        if (c.tipo === '🌷') {
          puntos = Math.max(0, puntos - 2);
          s.sonido.error();
        } else {
          puntos += c.tipo === '🐌' ? 2 : 1;
          s.sonido.pop();
        }
        quitar(i);
        marcador(j, `🌿 ${puntos} puntos`);
      }));
      marcador(j, '🌿 0 puntos');
      let t = 0;
      let sig = 0;
      const parar = bucle(j, dt => {
        t += dt;
        for (let i = 0; i < estado.length; i++) if (estado[i] && t > estado[i].hasta) quitar(i);
        if (t > sig) {
          sig = t + Math.max(0.3, 0.8 - t * 0.015);
          const libres = estado.map((c, i) => (c ? -1 : i)).filter(i => i >= 0);
          if (libres.length) {
            const i = libres[azar(libres.length)];
            const r = Math.random();
            const tipo = r < 0.6 ? '🌿' : r < 0.78 ? '🐌' : '🌷';
            estado[i] = { tipo, hasta: t + (tipo === '🐌' ? 0.9 : 1.4) };
            hoyos[i].querySelector('span').textContent = tipo;
            hoyos[i].classList.add('arriba');
          }
        }
      });
      cronometro(j, 30, () => { parar(); j.final(`¡Jardín impecable! ${puntos} puntos`, Math.min(1, puntos / 30)); });
    }
  },
  {
    id: 'taxi', icono: '🚕', nombre: 'Taxista', texto: 'Recoged pasajeros esquivando el tráfico', pago: 120,
    jugar(j, s) {
      j.info('Cambia de carril con las flechas. Recoge a la gente 🙋 y esquiva los coches');
      j.cuerpo.innerHTML = `<div class="tb-taxi"><div class="tb-marcador"></div><canvas width="300" height="400"></canvas><div class="pedales"><button data-d="-1">⬅️</button><button data-d="1">➡️</button></div></div>`;
      const cv = j.cuerpo.querySelector('canvas');
      const g = cv.getContext('2d');
      let carril = 1;
      let xTaxi = 1;
      let t = 0;
      let sig = 0.5;
      let recogidos = 0;
      let choques = 0;
      let golpe = 0;
      const cosas = [];
      const mover = d => {
        carril = Math.max(0, Math.min(2, carril + d));
        s.sonido.tic();
      };
      j.cuerpo.querySelectorAll('[data-d]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); mover(Number(b.dataset.d)); }));
      let xIni = null;
      cv.addEventListener('pointerdown', e => { xIni = e.clientX; });
      cv.addEventListener('pointerup', e => {
        if (xIni === null) return;
        const dx = e.clientX - xIni;
        if (Math.abs(dx) > 20) mover(Math.sign(dx));
        else {
          const r = cv.getBoundingClientRect();
          mover((e.clientX - r.left) / r.width < 0.5 ? -1 : 1);
        }
        xIni = null;
      });
      const parar = bucle(j, dt => {
        t += dt;
        const vel = 200 + t * 6;
        xTaxi += (carril - xTaxi) * Math.min(1, dt * 12);
        golpe = Math.max(0, golpe - dt);
        if (t > sig) {
          sig = t + Math.max(0.4, 0.9 - t * 0.012);
          const r = Math.random();
          cosas.push({ l: azar(3), y: -40, e: r < 0.3 ? '🙋' : r < 0.36 ? '🙋‍♂️' : ['🚗', '🚙', '🚌', '🚧'][azar(4)] });
        }
        g.fillStyle = '#5a5a63';
        g.fillRect(0, 0, 300, 400);
        g.fillStyle = '#8fc46a';
        g.fillRect(0, 0, 14, 400);
        g.fillRect(286, 0, 14, 400);
        g.fillStyle = '#f2efe9';
        for (let k = 0; k < 8; k++) {
          const y = ((k * 60 + t * vel) % 480) - 60;
          g.fillRect(105, y, 6, 30);
          g.fillRect(195, y, 6, 30);
        }
        g.font = '38px serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (const c of [...cosas]) {
          c.y += vel * dt;
          if (c.y > 440) {
            cosas.splice(cosas.indexOf(c), 1);
            continue;
          }
          if (Math.abs(c.y - 340) < 34 && Math.abs(c.l - xTaxi) < 0.5) {
            cosas.splice(cosas.indexOf(c), 1);
            if (c.e.startsWith('🙋')) {
              recogidos++;
              s.sonido.comprar();
            } else if (!golpe) {
              choques++;
              golpe = 1;
              s.sonido.claxon();
            }
            continue;
          }
          g.save();
          g.translate(c.l * 90 + 60, c.y);
          g.fillText(c.e, 0, 0);
          g.restore();
        }
        g.globalAlpha = golpe && Math.floor(golpe * 10) % 2 ? 0.35 : 1;
        g.font = '46px serif';
        g.fillText('🚕', xTaxi * 90 + 60, 340);
        g.globalAlpha = 1;
        marcador(j, `🙋 ${recogidos} pasajeros · 💥 ${choques}`);
      });
      cronometro(j, 35, () => { parar(); j.final(`${recogidos} carreras hechas${choques ? ` y ${choques} sustos` : ' sin un rasguño'}`, Math.max(0, Math.min(1, recogidos / 12 - choques * 0.08))); });
    }
  },
  {
    id: 'fotografo', icono: '📸', nombre: 'Fotógrafo de naturaleza', texto: 'Haced fotos a los animales justo en el centro del visor', pago: 120,
    jugar(j, s) {
      const ANIMALES = ['🐦', '🦋', '🐿️', '🦊', '🦔', '🐝', '🦉', '🐇'];
      let fotos = 0;
      let calidad = 0;
      let animal;
      j.info('Cuando el animal pase por el centro del visor, ¡dispara! Tienes 10 fotos');
      j.cuerpo.innerHTML = `<div class="tb-foto"><div class="tb-marcador"></div><div class="tb-bosque"><span class="tb-animal"></span><div class="tb-visor"></div><div class="tb-flash"></div></div><div class="tb-carrete"></div><button class="primario grande">📸 Disparar</button></div>`;
      const el = j.cuerpo.querySelector('.tb-animal');
      const carrete = j.cuerpo.querySelector('.tb-carrete');
      const nuevo = () => {
        animal = { e: ANIMALES[azar(ANIMALES.length)], t: 0, vx: (0.25 + Math.random() * 0.25) * (Math.random() < 0.5 ? 1 : -1), fase: Math.random() * 6, amp: 0.08 + Math.random() * 0.15 };
        animal.x = animal.vx > 0 ? -0.1 : 1.1;
        el.textContent = animal.e;
        el.style.transform = animal.vx > 0 ? 'scaleX(-1)' : '';
      };
      nuevo();
      marcador(j, '📷 0/10 fotos');
      const parar = bucle(j, dt => {
        animal.t += dt;
        animal.x += animal.vx * dt * (1 + fotos * 0.08);
        animal.y = 0.5 + Math.sin(animal.t * 3 + animal.fase) * animal.amp;
        if (animal.x < -0.15 || animal.x > 1.15) nuevo();
        el.style.left = `${animal.x * 100}%`;
        el.style.top = `${animal.y * 100}%`;
      });
      j.cuerpo.querySelector('button').addEventListener('click', () => {
        if (fotos >= 10) return;
        const d = Math.hypot(animal.x - 0.5, animal.y - 0.5);
        const q = Math.max(0, 1 - d / 0.25);
        calidad += q;
        fotos++;
        const fl = j.cuerpo.querySelector('.tb-flash');
        fl.classList.remove('on');
        void fl.offsetWidth;
        fl.classList.add('on');
        s.sonido.tono(1800, 0, 0.05, { tipo: 'square', volumen: 0.04 });
        carrete.innerHTML += `<span class="${q > 0.7 ? 'buena' : q > 0.3 ? 'media' : 'mala'}">${q > 0.3 ? animal.e : '🌫️'}</span>`;
        marcador(j, `📷 ${fotos}/10 fotos`);
        if (q > 0.3) nuevo();
        if (fotos >= 10) {
          parar();
          pararReloj();
          setTimeout(() => j.final(`Reportaje terminado: ${Math.round(calidad / 10 * 100)}% de calidad`, calidad / 10), 600);
        }
      });
      const pararReloj = cronometro(j, 45, () => { parar(); if (fotos < 10) j.final(`Se acabó la luz… ${fotos} fotos hechas`, calidad / 10); });
    }
  },
  {
    id: 'pastelero', icono: '🧁', nombre: 'Pastelería', texto: 'Repetid la decoración de la tarta en el mismo orden', pago: 120,
    jugar(j, s) {
      const TOP = [['🍓', '#f4b3be', 523.3], ['🍫', '#a0785a', 659.3], ['🍒', '#e05050', 784], ['🥝', '#8fc46a', 392]];
      const sec = [];
      let paso = 0;
      let mostrando = false;
      let nivel = 0;
      j.info('Mira el orden en que se encienden y repítelo. Cada tarta lleva un adorno más');
      j.cuerpo.innerHTML = `<div class="tb-simon"><div class="tb-marcador"></div><div class="tb-tarta">🎂</div><div class="tb-tops">${TOP.map((t, i) => `<button data-i="${i}" style="--c:${t[1]}">${t[0]}</button>`).join('')}</div></div>`;
      const botones = [...j.cuerpo.querySelectorAll('[data-i]')];
      const encender = i => {
        botones[i].classList.add('on');
        s.sonido.tono(TOP[i][2], 0, 0.3, { tipo: 'sine', volumen: 0.08 });
        setTimeout(() => botones[i].classList.remove('on'), 320);
      };
      const ronda = () => {
        sec.push(azar(4));
        paso = 0;
        mostrando = true;
        marcador(j, `🎂 Tarta ${sec.length}`);
        sec.forEach((i, k) => setTimeout(() => encender(i), 600 + k * Math.max(330, 600 - sec.length * 30)));
        setTimeout(() => { mostrando = false; }, 600 + sec.length * Math.max(330, 600 - sec.length * 30));
      };
      botones.forEach((b, i) => b.addEventListener('click', () => {
        if (mostrando) return;
        encender(i);
        if (sec[paso] !== i) {
          s.sonido.error();
          j.cuerpo.querySelector('.tb-tarta').textContent = '😵';
          setTimeout(() => j.final(`¡Has decorado ${nivel} tartas seguidas!`, Math.min(1, nivel / 9)), 700);
          mostrando = true;
          return;
        }
        paso++;
        if (paso >= sec.length) {
          nivel++;
          s.sonido.arreglo();
          j.cuerpo.querySelector('.tb-tarta').textContent = nivel % 2 ? '🍰' : '🎂';
          mostrando = true;
          if (nivel >= 12) {
            setTimeout(() => j.final('¡Pastelero estrella! 12 tartas perfectas', 1), 600);
            return;
          }
          setTimeout(ronda, 700);
        }
      }));
      ronda();
    }
  },
  {
    id: 'biblioteca', icono: '📚', nombre: 'Biblioteca', texto: 'Ordenad los libros por número de menor a mayor', pago: 110,
    jugar(j, s) {
      let hechos = 0;
      let estanterias = 0;
      let orden = [];
      j.info('Toca los libros de menor a mayor número. ¡Cada estantería, más difícil!');
      const colores = ['#e58f9e', '#5a9fd6', '#6cc08a', '#f2d06b', '#a070d8', '#f08c2a', '#9c6b45', '#5ac8d8'];
      const nueva = () => {
        const n = 8 + Math.min(4, estanterias);
        const nums = new Set();
        while (nums.size < n) nums.add(1 + azar(estanterias > 1 ? 199 : 60));
        orden = [...nums].sort((a, b) => a - b);
        const lista = barajar([...nums]);
        j.cuerpo.querySelector('.tb-estante').innerHTML = lista.map(v => `<button data-v="${v}" style="background:${colores[v % colores.length]};height:${70 + (v % 4) * 10}px"><b>${v}</b></button>`).join('');
        j.cuerpo.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
          if (Number(b.dataset.v) === orden[0]) {
            orden.shift();
            hechos++;
            b.classList.add('hecho');
            s.sonido.tic();
            if (!orden.length) {
              estanterias++;
              s.sonido.arreglo();
              marcador(j, `📚 ${estanterias} estanterías ordenadas`);
              setTimeout(nueva, 350);
            }
          } else {
            s.sonido.error();
            b.classList.add('mal');
            setTimeout(() => b.classList.remove('mal'), 300);
          }
        }));
      };
      j.cuerpo.innerHTML = '<div class="tb-biblio"><div class="tb-marcador"></div><div class="tb-estante"></div><div class="tb-balda"></div></div>';
      marcador(j, '📚 0 estanterías ordenadas');
      nueva();
      cronometro(j, 45, () => j.final(`${estanterias} estanterías y ${hechos} libros colocados`, Math.min(1, hechos / 45)));
    }
  },
  {
    id: 'fontanero', icono: '🔧', nombre: 'Fontanería', texto: 'Girad las tuberías para que el agua llegue al grifo', pago: 140,
    jugar(j, s) {
      const N = 4;
      const D = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
      const opuesto = b => ({ 1: 4, 2: 8, 4: 1, 8: 2 }[b]);
      const rot = m => ((m << 1) | (m >> 3)) & 15;
      let hechos = 0;
      let celdas;
      let entrada;
      let salida;
      j.info('Toca las piezas para girarlas y conecta la entrada 💧 con el grifo 🚰');
      const generar = () => {
        for (let intento = 0; intento < 200; intento++) {
          entrada = azar(N);
          salida = azar(N);
          const camino = [[0, entrada]];
          const visto = new Set([`0,${entrada}`]);
          let ok = false;
          const dfs = () => {
            const [x, y] = camino[camino.length - 1];
            if (x === N - 1 && y === salida) return true;
            for (const [dx, dy] of barajar([[1, 0], [0, 1], [0, -1], [1, 0], [-1, 0]])) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= N || ny >= N || visto.has(`${nx},${ny}`)) continue;
              visto.add(`${nx},${ny}`);
              camino.push([nx, ny]);
              if (dfs()) return true;
              camino.pop();
            }
            return false;
          };
          ok = dfs();
          if (!ok || camino.length < N + 1) continue;
          celdas = Array.from({ length: N * N }, () => [3, 5, 7][azar(3)]);
          camino.forEach(([x, y], k) => {
            let m = 0;
            const prev = k === 0 ? [-1, entrada] : camino[k - 1];
            const sig = k === camino.length - 1 ? [N, salida] : camino[k + 1];
            for (const [px, py] of [prev, sig]) {
              const d = D.find(([dx, dy]) => dx === px - x && dy === py - y);
              m |= d[2];
            }
            celdas[y * N + x] = m;
          });
          celdas = celdas.map(m => {
            let r = m;
            for (let k = azar(4); k > 0; k--) r = rot(r);
            return r;
          });
          if (conectado()) continue;
          return;
        }
      };
      const recorrido = () => {
        const llenas = new Set();
        let x = 0;
        let y = entrada;
        let desde = 8;
        for (let k = 0; k < N * N + 2; k++) {
          if (x < 0 || y < 0 || x >= N || y >= N) return { llenas, fin: x === N && y === salida && desde === 8 };
          const m = celdas[y * N + x];
          if (!(m & desde)) return { llenas, fin: false };
          llenas.add(y * N + x);
          const sale = D.find(d => d[2] !== desde && (m & d[2]));
          if (!sale) return { llenas, fin: false };
          x += sale[0];
          y += sale[1];
          desde = opuesto(sale[2]);
        }
        return { llenas, fin: false };
      };
      const conectado = () => recorrido().fin;
      const svg = (m, llena) => {
        const c = llena ? '#5aa9ff' : '#9aa0a6';
        const l = D.filter(d => m & d[2]).map(([dx, dy]) => `<line x1="50" y1="50" x2="${50 + dx * 50}" y2="${50 + dy * 50}" stroke="${c}" stroke-width="22" stroke-linecap="round"/>`).join('');
        return `<svg viewBox="0 0 100 100">${l}<circle cx="50" cy="50" r="11" fill="${c}"/></svg>`;
      };
      const pintar = () => {
        const { llenas } = recorrido();
        const t = j.cuerpo.querySelector('.tb-tablero');
        t.innerHTML = Array.from({ length: N * N }, (_, i) => `<button data-i="${i}">${svg(celdas[i], llenas.has(i))}</button>`).join('');
        j.cuerpo.querySelector('.tb-entra').style.marginTop = `${20 + entrada * 67}px`;
        j.cuerpo.querySelector('.tb-sale').style.marginTop = `${20 + salida * 67}px`;
        t.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
          const i = Number(b.dataset.i);
          celdas[i] = rot(celdas[i]);
          s.sonido.tic();
          pintar();
          if (conectado()) {
            hechos++;
            s.sonido.agua();
            marcador(j, `🚰 ${hechos} averías arregladas`);
            j.cuerpo.querySelector('.tb-tablero').classList.add('agua');
            setTimeout(() => { generar(); pintar(); j.cuerpo.querySelector('.tb-tablero') && j.cuerpo.querySelector('.tb-tablero').classList.remove('agua'); }, 800);
          }
        }));
      };
      j.cuerpo.innerHTML = '<div class="tb-fonta"><div class="tb-marcador"></div><div class="tb-marco-tubos"><span class="tb-entra">💧</span><div class="tb-tablero"></div><span class="tb-sale">🚰</span></div></div>';
      marcador(j, '🚰 0 averías arregladas');
      generar();
      pintar();
      cronometro(j, 70, () => j.final(`¡${hechos} averías arregladas!`, Math.min(1, hechos / 4)));
    }
  }
];

export class Trabajos {
  constructor(ctx) {
    this.ctx = ctx;
  }

  get estado() {
    return this.ctx.estado;
  }

  delDia(fecha = new Date()) {
    const dia = d => hash(`trabajo-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) % TRABAJOS.length;
    let i = dia(fecha);
    const ayer = new Date(fecha.getTime() - DIA);
    if (i === dia(ayer)) i = (i + 1) % TRABAJOS.length;
    const forzado = new URLSearchParams(location.search).get('trabajo');
    if (forzado && TRABAJOS.some(t => t.id === forzado)) return TRABAJOS.find(t => t.id === forzado);
    return TRABAJOS[i];
  }

  datos() {
    const hoy = new Date().toDateString();
    if (!this.estado.trabajos) this.estado.trabajos = { dia: hoy, turnos: 0, mejor: {}, hechos: [] };
    const d = this.estado.trabajos;
    if (d.dia !== hoy) {
      d.dia = hoy;
      d.turnos = 0;
    }
    if (!d.mejor) d.mejor = {};
    if (!d.hechos) d.hechos = [];
    return d;
  }

  turnosHoy() {
    return this.datos().turnos;
  }

  chip() {
    const d = this.datos();
    const t = this.delDia();
    if (d.turnos >= TURNOS) return null;
    return { id: 'trabajo', texto: `${t.icono} ${TURNOS - d.turnos}`, accion: () => this.abrir() };
  }

  abrir() {
    const { ui } = this.ctx;
    const d = this.datos();
    const t = this.delDia();
    const mejor = d.mejor[t.id];
    const cuerpo = ui.abrirGen('💼 Trabajo del día', `
      <div class="trabajo-hoy">
        <span>${t.icono}</span>
        <b>${t.nombre}</b>
        <small>${t.texto}</small>
        <div class="trabajo-datos"><em>🪙 hasta ${t.pago}</em><em>⏱️ Turnos ${Math.min(d.turnos, TURNOS)}/${TURNOS}</em>${mejor ? `<em>🏅 Mejor ${Math.round(mejor * 100)}%</em>` : ''}</div>
        <button class="primario" id="ir-trabajar">${d.turnos < TURNOS ? '¡A trabajar!' : 'Hacer horas extra (paga reducida)'}</button>
      </div>
      <p class="gen-intro">Cada día hay un trabajo distinto. Los ${TURNOS} primeros turnos pagan entero; después, horas extra a un 30%. Mañana… ¡sorpresa!</p>
      <h4 class="gen-sub">Trabajos probados (${d.hechos.length} de ${TRABAJOS.length})</h4>
      <div class="trabajos-lista">${TRABAJOS.map(x => {
        const hecho = d.hechos.includes(x.id);
        return `<div class="${hecho ? 'hecho' : ''} ${x.id === t.id ? 'hoy' : ''}"><span>${hecho || x.id === t.id ? x.icono : '❔'}</span><small>${hecho || x.id === t.id ? x.nombre : '???'}</small>${d.mejor[x.id] ? `<i>${Math.round(d.mejor[x.id] * 100)}%</i>` : ''}</div>`;
      }).join('')}</div>`, () => (window.abrirGanar || this.ctx.abrirMas)());
    cuerpo.querySelector('#ir-trabajar').addEventListener('click', () => this.trabajar(t));
  }

  async trabajar(t) {
    const { ui, juegos, sonido } = this.ctx;
    ui.cerrarHojas();
    const puntos = await juegos.custom(t.icono, t.nombre, j => t.jugar(j, { sonido }));
    if (puntos === null || puntos === undefined) return;
    const d = this.datos();
    const factor = d.turnos < TURNOS ? 1 : 0.3;
    d.turnos++;
    if (!d.hechos.includes(t.id)) d.hechos.push(t.id);
    const antes = d.mejor[t.id] || 0;
    if (puntos > antes) d.mejor[t.id] = Math.round(puntos * 100) / 100;
    const extra = puntos >= 0.99 ? Math.round(t.pago * 0.25) : 0;
    const paga = Math.max(10, Math.round((t.pago * puntos + extra) * factor));
    this.ctx.registrar('trabajar');
    this.ctx.registrar(`trabajo-${t.id}`);
    if (puntos >= 0.99) this.ctx.registrar('trabajo-perfecto');
    this.ctx.ganar(paga, null, t.icono);
    if (extra && factor === 1) setTimeout(() => ui.aviso(`🌟 ¡Turno perfecto! Propina de ${extra}`), 1200);
    if (d.hechos.length === TRABAJOS.length && !d.todos) {
      d.todos = true;
      this.ctx.recordar && this.ctx.recordar('todos-trabajos', '💼', 'Probamos todos los trabajos del barrio');
    }
    this.ctx.guardar();
    this.ctx.chip();
  }
}
