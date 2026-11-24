const azar = n => Math.floor(Math.random() * n);
const elegir = l => l[azar(l.length)];

function cronometro(j, seg, alFin) {
  const ini = performance.now();
  let vivo = true;
  const id = setInterval(() => {
    if (!vivo) return;
    const t = (performance.now() - ini) / 1000;
    j.tiempo(Math.max(0, 1 - t / seg));
    if (t >= seg) {
      vivo = false;
      clearInterval(id);
      alFin();
    }
  }, 100);
  const parar = () => { vivo = false; clearInterval(id); };
  const previo = j.alTerminar;
  j.alTerminar = () => { parar(); if (previo) previo(); };
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
  j.alTerminar = () => { parar(); if (previo) previo(); };
  return parar;
}

const marcador = (j, texto) => {
  const el = j.cuerpo.querySelector('.fv-marcador');
  if (el) el.innerHTML = texto;
};

export const JUEGOS_FAVOR = {
  tartaletas: {
    icono: '🥧',
    jugar(j, s) {
      j.info('Mantén pulsado para echar crema y suelta justo en la raya. ¡Sin pasarte!');
      j.cuerpo.innerHTML = `<div class="fv fv-tarta"><div class="fv-marcador">Tartaleta 1 de 5</div><div class="fv-tartaleta"><div class="raya"></div><div class="crema"></div></div><button class="fv-boton">🥄 Mantener</button></div>`;
      const crema = j.cuerpo.querySelector('.crema');
      const raya = j.cuerpo.querySelector('.raya');
      const boton = j.cuerpo.querySelector('.fv-boton');
      let ronda = 0;
      let nivel = 0;
      let echando = false;
      let objetivo = 0.6;
      let total = 0;
      const nueva = () => {
        nivel = 0;
        objetivo = 0.45 + Math.random() * 0.4;
        raya.style.bottom = `${objetivo * 100}%`;
        crema.style.height = '0%';
        marcador(j, `Tartaleta ${ronda + 1} de 5`);
      };
      nueva();
      boton.addEventListener('pointerdown', e => { e.preventDefault(); echando = true; });
      const soltar = () => {
        if (!echando) return;
        echando = false;
        if (nivel === 0) return;
        const err = Math.abs(nivel - objetivo);
        const p = nivel > objetivo + 0.04 ? Math.max(0, 0.4 - err * 3) : Math.max(0, 1 - err * 6);
        total += p;
        s.sonido[p > 0.7 ? 'arreglo' : p > 0.3 ? 'pop' : 'error']();
        ronda++;
        if (ronda >= 5) {
          parar();
          j.final(total > 4.2 ? '¡Tartaletas de pastelería!' : total > 2.5 ? '¡Muy apañadas!' : 'Alguna se ha desbordado…', total / 5);
          return;
        }
        setTimeout(nueva, 350);
      };
      boton.addEventListener('pointerup', soltar);
      boton.addEventListener('pointerleave', soltar);
      const parar = bucle(j, dt => {
        if (!echando) return;
        nivel = Math.min(1, nivel + dt * (0.35 + nivel * 0.5));
        crema.style.height = `${nivel * 100}%`;
      });
    }
  },

  cesped: {
    icono: '🚜',
    jugar(j, s) {
      j.info('Arrastra el dedo para cortar todo el césped. ¡Cuidado con las flores 🌼 del vecino!');
      const C = 7;
      const F = 9;
      const flores = new Set();
      while (flores.size < 6) flores.add(azar(C * F));
      j.cuerpo.innerHTML = `<div class="fv fv-cesped"><div class="fv-marcador">🌱 0%</div><div class="fv-prado" style="grid-template-columns:repeat(${C},1fr)">${Array.from({ length: C * F }, (_, i) => `<i data-i="${i}" class="${flores.has(i) ? 'flor' : ''}">${flores.has(i) ? '🌼' : ''}</i>`).join('')}</div></div>`;
      const prado = j.cuerpo.querySelector('.fv-prado');
      const celdas = [...prado.querySelectorAll('i')];
      const cortado = new Set();
      let pisadas = 0;
      const total = C * F - flores.size;
      const pisar = (x, y) => {
        const el = document.elementFromPoint(x, y);
        if (!el || !el.dataset || el.dataset.i === undefined) return;
        const i = Number(el.dataset.i);
        if (flores.has(i)) {
          if (!el.classList.contains('pisada')) {
            el.classList.add('pisada');
            el.textContent = '🥀';
            pisadas++;
            s.sonido.error();
          }
          return;
        }
        if (cortado.has(i)) return;
        cortado.add(i);
        celdas[i].classList.add('cortado');
        if (cortado.size % 4 === 0) s.sonido.tic();
        marcador(j, `🌱 ${Math.round((cortado.size / total) * 100)}%`);
        if (cortado.size === total) fin();
      };
      let activo = false;
      prado.addEventListener('pointerdown', e => { activo = true; prado.setPointerCapture(e.pointerId); pisar(e.clientX, e.clientY); });
      prado.addEventListener('pointermove', e => { if (activo) pisar(e.clientX, e.clientY); });
      prado.addEventListener('pointerup', () => { activo = false; });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        const p = Math.max(0, cortado.size / total - pisadas * 0.12);
        j.final(pisadas ? `Césped cortado… y ${pisadas} flores pisadas` : '¡Césped de campo de golf!', p);
      };
      const parar = cronometro(j, 25, fin);
    }
  },

  gotas: {
    icono: '🪣',
    jugar(j, s) {
      j.info('Mueve el cubo arrastrando para recoger las gotas que caen de las tuberías');
      j.cuerpo.innerHTML = `<div class="fv fv-gotas"><div class="fv-marcador">💧 0</div><div class="fv-techo">${'🟫'.repeat(5)}</div><div class="fv-zona"><div class="fv-cubo">🪣</div></div></div>`;
      const zona = j.cuerpo.querySelector('.fv-zona');
      const cubo = j.cuerpo.querySelector('.fv-cubo');
      let x = 0.5;
      const gotas = [];
      let cogidas = 0;
      let caidas = 0;
      let sig = 0;
      let t = 0;
      zona.addEventListener('pointermove', e => {
        const r = zona.getBoundingClientRect();
        x = Math.max(0.07, Math.min(0.93, (e.clientX - r.left) / r.width));
      });
      zona.addEventListener('pointerdown', e => {
        const r = zona.getBoundingClientRect();
        x = Math.max(0.07, Math.min(0.93, (e.clientX - r.left) / r.width));
      });
      const parar = bucle(j, dt => {
        t += dt;
        cubo.style.left = `${x * 100}%`;
        if (t > sig) {
          sig = t + Math.max(0.35, 0.9 - t * 0.02);
          const el = document.createElement('span');
          el.className = 'fv-gota';
          el.textContent = '💧';
          const g = { x: (azar(5) + 0.5) / 5, y: 0, v: 0.45 + Math.random() * 0.25 + t * 0.012, el };
          el.style.left = `${g.x * 100}%`;
          zona.appendChild(el);
          gotas.push(g);
        }
        for (const g of [...gotas]) {
          g.y += g.v * dt;
          g.el.style.top = `${g.y * 100}%`;
          if (g.y > 0.86 && g.y < 0.96 && Math.abs(g.x - x) < 0.11) {
            cogidas++;
            s.sonido.pop();
            g.el.remove();
            gotas.splice(gotas.indexOf(g), 1);
            marcador(j, `💧 ${cogidas}`);
          } else if (g.y > 1) {
            caidas++;
            g.el.remove();
            gotas.splice(gotas.indexOf(g), 1);
            s.sonido.tic();
          }
        }
      });
      cronometro(j, 25, () => {
        parar();
        const p = cogidas / Math.max(1, cogidas + caidas);
        j.final(p > 0.85 ? '¡Ni una gota al suelo!' : p > 0.5 ? 'Casi todo recogido' : 'Se ha encharcado un poco…', p);
      });
    }
  },

  buscar: {
    icono: '🔍',
    jugar(j, s) {
      const cosas = ['👓', '🔑', '📻', '☂️', '🧦', '📮', '🕰️', '🎩', '🪥', '📒', '🧶', '🥄', '🪀', '🧸', '🔦', '🧤', '🪒', '📷', '🎲', '🪃'];
      const buscar = [...cosas].sort(() => Math.random() - 0.5).slice(0, 5);
      let ronda = 0;
      let aciertos = 0;
      let fallos = 0;
      j.info('Don Ramón no encuentra nada en el trastero. ¡Toca lo que te pide!');
      const pintar = () => {
        const objetivo = buscar[ronda];
        const resto = cosas.filter(c => c !== objetivo).sort(() => Math.random() - 0.5).slice(0, 19);
        const todo = [...resto, objetivo].sort(() => Math.random() - 0.5);
        j.cuerpo.innerHTML = `<div class="fv fv-buscar"><div class="fv-pide">Busca: <b>${objetivo}</b></div><div class="fv-marcador">${ronda + 1} de ${buscar.length}</div><div class="fv-trastero">${todo.map(c => `<button style="transform:rotate(${azar(50) - 25}deg)">${c}</button>`).join('')}</div></div>`;
        j.cuerpo.querySelectorAll('.fv-trastero button').forEach(b => b.addEventListener('click', () => {
          if (b.textContent === objetivo) {
            aciertos++;
            s.sonido.arreglo();
            ronda++;
            if (ronda >= buscar.length) { fin(); return; }
            pintar();
          } else {
            fallos++;
            b.classList.add('mal');
            s.sonido.error();
          }
        }));
      };
      pintar();
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        const p = Math.max(0, aciertos / buscar.length - fallos * 0.06);
        j.final(p > 0.85 ? '¡Lo habéis encontrado todo!' : 'Algo ha aparecido…', p);
      };
      const parar = cronometro(j, 30, fin);
    }
  },

  escalera: {
    icono: '📦',
    jugar(j, s) {
      j.info('Sube la caja por la escalera: toca izquierda y derecha alternando, ¡sin perder el ritmo!');
      j.cuerpo.innerHTML = `<div class="fv fv-escalera"><div class="fv-marcador">🪜 Escalón 0 de 40</div><div class="fv-equilibrio"><i></i></div><div class="fv-persona">🧍📦</div><div class="fv-pies"><button data-l="0">🦶 Izq.</button><button data-l="1">Der. 🦶</button></div></div>`;
      const barra = j.cuerpo.querySelector('.fv-equilibrio i');
      const persona = j.cuerpo.querySelector('.fv-persona');
      let toca = 0;
      let escalones = 0;
      let equilibrio = 0;
      let caidas = 0;
      j.cuerpo.querySelectorAll('.fv-pies button').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        const l = Number(b.dataset.l);
        if (l === toca) {
          escalones++;
          toca = 1 - toca;
          equilibrio *= 0.6;
          s.sonido.tic();
          persona.style.transform = `translateY(${-(escalones % 2) * 4}px)`;
        } else {
          equilibrio += l ? 0.45 : -0.45;
          s.sonido.error();
        }
        marcador(j, `🪜 Escalón ${escalones} de 40`);
        if (escalones >= 40) fin();
      }));
      const parar = bucle(j, dt => {
        equilibrio += (Math.random() - 0.5) * dt * 1.2;
        equilibrio *= 1 + dt * 0.4;
        barra.style.left = `${50 + Math.max(-1, Math.min(1, equilibrio)) * 45}%`;
        persona.style.rotate = `${equilibrio * 25}deg`;
        if (Math.abs(equilibrio) >= 1) {
          caidas++;
          equilibrio = 0;
          escalones = Math.max(0, escalones - 4);
          s.sonido.error();
          j.info('¡Uy! Casi se cae la caja. Bajas unos escalones');
          marcador(j, `🪜 Escalón ${escalones} de 40`);
        }
      });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        const p = Math.max(0, Math.min(1, escalones / 40) - caidas * 0.1);
        j.final(escalones >= 40 ? (caidas ? '¡Arriba! Con algún susto' : '¡Caja arriba sin un rasguño!') : `Os habéis quedado en el escalón ${escalones}`, p);
      };
      const pararT = cronometro(j, 22, fin);
    }
  },

  regar: {
    icono: '🪴',
    jugar(j, s) {
      j.info('Toca cada planta para regarla. Ni muy seca ni encharcada: ¡en la zona verde!');
      const plantas = ['🪴', '🌵', '🌿', '🌻', '🌱', '🌷'];
      const agua = plantas.map(() => 0.45 + Math.random() * 0.2);
      const sed = plantas.map((p, i) => (p === '🌵' ? 0.02 : 0.045 + i * 0.006));
      j.cuerpo.innerHTML = `<div class="fv fv-regar"><div class="fv-marcador">Mantenlas a todas contentas</div><div class="fv-macetas">${plantas.map((p, i) => `<button data-i="${i}"><span>${p}</span><div class="nivel"><b></b><i></i></div></button>`).join('')}</div></div>`;
      const botones = [...j.cuerpo.querySelectorAll('.fv-macetas button')];
      let bien = 0;
      let muestras = 0;
      botones.forEach((b, i) => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        agua[i] = Math.min(1.1, agua[i] + 0.18);
        s.sonido.agua();
      }));
      const parar = bucle(j, dt => {
        botones.forEach((b, i) => {
          agua[i] = Math.max(0, agua[i] - sed[i] * dt * 1.6);
          const v = agua[i];
          b.querySelector('i').style.height = `${Math.min(1, v) * 100}%`;
          const ok = v >= 0.35 && v <= 0.8;
          b.classList.toggle('seca', v < 0.35);
          b.classList.toggle('ahogada', v > 0.8);
          muestras++;
          if (ok) bien++;
        });
      });
      cronometro(j, 28, () => {
        parar();
        const p = bien / Math.max(1, muestras);
        j.final(p > 0.85 ? '¡Plantas felices!' : p > 0.6 ? 'Han sobrevivido todas' : 'Alguna lo ha pasado mal…', Math.min(1, p * 1.08));
      });
    }
  },

  cuadros: {
    icono: '🖼️',
    jugar(j, s) {
      j.info('El cuadro se balancea: toca para clavarlo cuando esté recto');
      j.cuerpo.innerHTML = `<div class="fv fv-cuadros"><div class="fv-marcador">Cuadro 1 de 5</div><div class="fv-pared"><div class="fv-nivel">— nivel —</div><div class="fv-marco">${elegir(['🌄', '🌊', '🐱', '🌻', '🗻'])}</div></div><button class="fv-boton">🔨 ¡Clavar!</button></div>`;
      const marco = j.cuerpo.querySelector('.fv-marco');
      let ang = 0;
      let t = 0;
      let vel = 2.2;
      let ronda = 0;
      let total = 0;
      let pausa = 0;
      const parar = bucle(j, dt => {
        if (pausa > 0) { pausa -= dt; return; }
        t += dt * vel;
        ang = Math.sin(t) * 28 + Math.sin(t * 2.3) * 6;
        marco.style.transform = `rotate(${ang}deg)`;
      });
      j.cuerpo.querySelector('.fv-boton').addEventListener('click', () => {
        if (pausa > 0) return;
        const p = Math.max(0, 1 - Math.abs(ang) / 12);
        total += p;
        s.sonido[p > 0.75 ? 'arreglo' : p > 0.35 ? 'pop' : 'error']();
        marco.classList.add('clavado');
        pausa = 0.7;
        ronda++;
        if (ronda >= 5) {
          setTimeout(() => { parar(); j.final(total > 4 ? '¡Rectísimos!' : total > 2.5 ? 'Un poco torcidillos' : 'Parece una casa encantada…', total / 5); }, 500);
          return;
        }
        setTimeout(() => {
          marco.classList.remove('clavado');
          marco.textContent = elegir(['🌄', '🌊', '🐱', '🌻', '🗻', '🏰', '🌈']);
          vel += 0.5;
          marcador(j, `Cuadro ${ronda + 1} de 5`);
        }, 650);
      });
    }
  },

  parrilla: {
    icono: '🥩',
    jugar(j, s) {
      j.info('Toca la carne cuando esté dorada para darle la vuelta, y otra vez para servirla. ¡Que no se queme!');
      const N = 6;
      j.cuerpo.innerHTML = `<div class="fv fv-parrilla"><div class="fv-marcador">🍽️ 0 servidas</div><div class="fv-grill">${Array.from({ length: N }, (_, i) => `<button data-i="${i}"><span></span><div class="punto"><i></i></div></button>`).join('')}</div></div>`;
      const huecos = [...j.cuerpo.querySelectorAll('.fv-grill button')];
      const piezas = huecos.map(() => null);
      let servidas = 0;
      let quemadas = 0;
      let crudas = 0;
      const poner = i => { piezas[i] = { tipo: elegir(['🥩', '🍗', '🌭', '🍖']), lado: 0, coccion: 0, v: 0.16 + Math.random() * 0.1 }; };
      huecos.forEach((h, i) => {
        setTimeout(() => poner(i), i * 700);
        h.addEventListener('pointerdown', e => {
          e.preventDefault();
          const p = piezas[i];
          if (!p) return;
          if (p.coccion < 0.55) {
            crudas++;
            s.sonido.error();
            p.coccion = Math.max(0, p.coccion - 0.05);
            return;
          }
          if (p.lado === 0) {
            p.lado = 1;
            p.coccion = 0;
            s.sonido.chasquido();
          } else {
            servidas++;
            s.sonido.arreglo();
            piezas[i] = null;
            marcador(j, `🍽️ ${servidas} servidas`);
            setTimeout(() => poner(i), 900);
          }
        });
      });
      const parar = bucle(j, dt => {
        huecos.forEach((h, i) => {
          const p = piezas[i];
          h.querySelector('span').textContent = p ? (p.coccion > 1 ? '🔥' : p.tipo) : '';
          h.classList.toggle('dorado', !!p && p.coccion >= 0.55 && p.coccion <= 1);
          h.querySelector('i').style.width = p ? `${Math.min(1, p.coccion) * 100}%` : '0%';
          h.classList.toggle('vuelta', !!p && p.lado === 1);
          if (!p) return;
          p.coccion += p.v * dt;
          if (p.coccion > 1.35) {
            quemadas++;
            s.sonido.error();
            piezas[i] = null;
            setTimeout(() => poner(i), 1100);
          }
        });
      });
      cronometro(j, 35, () => {
        parar();
        const p = Math.max(0, Math.min(1, servidas / 12) - quemadas * 0.06 - crudas * 0.02);
        j.final(quemadas ? `${servidas} servidas y ${quemadas} carbonizadas` : `¡${servidas} en su punto!`, p);
      });
    }
  },

  globos: {
    icono: '🎈',
    jugar(j, s) {
      j.info('Toca muchas veces para inflar el globo y para justo dentro de la marca. ¡Si te pasas, explota!');
      j.cuerpo.innerHTML = `<div class="fv fv-globos"><div class="fv-marcador">Globo 1 de 5</div><div class="fv-aire"><div class="marca"></div><div class="globo">🎈</div></div><div class="tb-acciones"><button class="fv-soplar">💨 Soplar</button><button class="primario fv-atar">🎀 Atar</button></div></div>`;
      const globo = j.cuerpo.querySelector('.globo');
      const marca = j.cuerpo.querySelector('.marca');
      let tam = 0;
      let objetivo = 0.7;
      let ronda = 0;
      let total = 0;
      const nuevo = () => {
        tam = 0;
        objetivo = 0.55 + Math.random() * 0.3;
        marca.style.width = marca.style.height = `${40 + objetivo * 140}px`;
        globo.style.fontSize = '36px';
        globo.textContent = '🎈';
        globo.style.filter = `hue-rotate(${azar(360)}deg)`;
        marcador(j, `Globo ${ronda + 1} de 5`);
      };
      nuevo();
      const siguiente = p => {
        total += p;
        ronda++;
        if (ronda >= 5) {
          setTimeout(() => j.final(total > 4 ? '¡Fiesta con globos perfectos!' : total > 2.5 ? 'Algún globo pochito' : '¡Cuántos estallidos!', total / 5), 500);
          return;
        }
        setTimeout(nuevo, 600);
      };
      j.cuerpo.querySelector('.fv-soplar').addEventListener('pointerdown', e => {
        e.preventDefault();
        if (tam < 0) return;
        tam += 0.045 + Math.random() * 0.03;
        s.sonido.tono(200 + tam * 300, 0, 0.08, { hasta: 260 + tam * 300, volumen: 0.04 });
        globo.style.fontSize = `${36 + tam * 120}px`;
        if (tam > objetivo + 0.12 + Math.random() * 0.05) {
          tam = -1;
          globo.textContent = '💥';
          s.sonido.error();
          siguiente(0);
        }
      });
      j.cuerpo.querySelector('.fv-atar').addEventListener('click', () => {
        if (tam <= 0) return;
        const err = Math.abs(tam - objetivo);
        const p = Math.max(0, 1 - err * 5);
        s.sonido[p > 0.7 ? 'arreglo' : 'pop']();
        tam = -1;
        siguiente(p);
      });
    }
  },

  hoguera: {
    icono: '🔥',
    jugar(j, s) {
      j.info('Frota los palitos arrastrando el dedo de lado a lado, rápido, hasta que prenda');
      j.cuerpo.innerHTML = `<div class="fv fv-hoguera"><div class="fv-marcador">Hoguera 1 de 3</div><div class="fv-fuego">🪵</div><div class="fv-calor"><i></i></div><div class="fv-frotar">↔️ Frota aquí</div></div>`;
      const zona = j.cuerpo.querySelector('.fv-frotar');
      const calor = j.cuerpo.querySelector('.fv-calor i');
      const fuego = j.cuerpo.querySelector('.fv-fuego');
      let ultimoX = null;
      let dir = 0;
      let heat = 0;
      let ronda = 0;
      let encendidas = 0;
      zona.addEventListener('pointerdown', e => { zona.setPointerCapture(e.pointerId); ultimoX = e.clientX; });
      zona.addEventListener('pointermove', e => {
        if (ultimoX === null) return;
        const dx = e.clientX - ultimoX;
        if (Math.abs(dx) < 3) return;
        const d = Math.sign(dx);
        if (d !== dir) {
          dir = d;
          heat += 0.035;
          if (Math.random() < 0.3) s.sonido.ruido(0.05, { freq: 2500, q: 1, volumen: 0.05 });
        }
        heat += Math.abs(dx) * 0.0006;
        ultimoX = e.clientX;
      });
      zona.addEventListener('pointerup', () => { ultimoX = null; });
      const parar = bucle(j, dt => {
        heat = Math.max(0, heat - dt * 0.12);
        calor.style.width = `${Math.min(1, heat) * 100}%`;
        fuego.textContent = heat > 0.66 ? '💨' : '🪵';
        if (heat >= 1) {
          encendidas++;
          heat = 0;
          fuego.textContent = '🔥';
          s.sonido.arreglo();
          ronda++;
          if (ronda >= 3) { fin(); return false; }
          setTimeout(() => marcador(j, `Hoguera ${ronda + 1} de 3`), 300);
        }
      });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        j.final(encendidas >= 3 ? '¡Fuego de campamento!' : `Habéis encendido ${encendidas} de 3`, encendidas / 3);
      };
      const pararT = cronometro(j, 30, fin);
    }
  },

  cola: {
    icono: '🧺',
    jugar(j, s) {
      const productos = ['🍞', '🥛', '🍎', '🧀', '🥚', '🍌'];
      j.info('Mira lo que pide el cliente de delante y dáselo rápido');
      j.cuerpo.innerHTML = `<div class="fv fv-cola"><div class="fv-marcador">😊 0 atendidos</div><div class="fv-clientes"></div><div class="fv-productos">${productos.map(p => `<button>${p}</button>`).join('')}</div></div>`;
      const fila = j.cuerpo.querySelector('.fv-clientes');
      const caras = ['🧑', '👩', '👴', '👧', '🧔', '👵', '👨‍🦰', '👩‍🦱'];
      const cola = [];
      let atendidos = 0;
      let enfadados = 0;
      let fallos = 0;
      const nuevo = () => cola.push({ cara: elegir(caras), quiere: elegir(productos), paciencia: 1 });
      for (let i = 0; i < 3; i++) nuevo();
      const pintar = () => {
        fila.innerHTML = cola.slice(0, 4).map((c, i) => `<div class="${i === 0 ? 'primero' : ''}"><span>${c.cara}</span>${i === 0 ? `<b>${c.quiere}</b>` : ''}<i style="width:${c.paciencia * 100}%"></i></div>`).join('');
      };
      j.cuerpo.querySelectorAll('.fv-productos button').forEach(b => b.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (!cola.length) return;
        if (b.textContent === cola[0].quiere) {
          cola.shift();
          atendidos++;
          s.sonido.comprar();
          marcador(j, `😊 ${atendidos} atendidos`);
        } else {
          fallos++;
          cola[0].paciencia -= 0.2;
          s.sonido.error();
        }
        pintar();
      }));
      let sig = 1.5;
      let t = 0;
      const parar = bucle(j, dt => {
        t += dt;
        if (t > sig && cola.length < 6) { nuevo(); sig = t + Math.max(0.9, 2 - t * 0.04); }
        if (cola.length) {
          cola[0].paciencia -= dt * 0.18;
          if (cola[0].paciencia <= 0) { cola.shift(); enfadados++; s.sonido.error(); }
        }
        pintar();
      });
      cronometro(j, 30, () => {
        parar();
        const p = Math.max(0, Math.min(1, atendidos / 16) - enfadados * 0.08 - fallos * 0.02);
        j.final(enfadados ? `${atendidos} atendidos y ${enfadados} se fueron enfadados` : `¡${atendidos} clientes contentos!`, p);
      });
    }
  },

  bici: {
    icono: '🚲',
    jugar(j, s) {
      j.info('Toca para saltar los baches y los conos. ¡No se te caigan los pedidos!');
      j.cuerpo.innerHTML = `<div class="fv fv-bici"><div class="fv-marcador">📦 Pedidos intactos: 5</div><div class="fv-calle"><div class="fv-ciclista">🚲</div></div></div>`;
      const calle = j.cuerpo.querySelector('.fv-calle');
      const bici = j.cuerpo.querySelector('.fv-ciclista');
      let y = 0;
      let vy = 0;
      let vidas = 5;
      let saltados = 0;
      let t = 0;
      let sig = 1;
      const obst = [];
      const saltar = e => {
        if (e) e.preventDefault();
        if (y === 0) { vy = 2.6; s.sonido.tono(500, 0, 0.12, { hasta: 900, volumen: 0.05 }); }
      };
      calle.addEventListener('pointerdown', saltar);
      const parar = bucle(j, dt => {
        t += dt;
        vy -= 7.5 * dt;
        y = Math.max(0, y + vy * dt);
        if (y === 0) vy = 0;
        bici.style.bottom = `${12 + y * 60}px`;
        const vel = 0.45 + t * 0.012;
        if (t > sig) {
          sig = t + 1.1 + Math.random() * 1.1 - Math.min(0.5, t * 0.015);
          const el = document.createElement('span');
          el.className = 'fv-obst';
          el.textContent = elegir(['🚧', '🕳️', '🛢️', '🐈']);
          calle.appendChild(el);
          obst.push({ x: 1.05, el, golpe: false });
        }
        for (const o of [...obst]) {
          o.x -= vel * dt;
          o.el.style.left = `${o.x * 100}%`;
          if (!o.golpe && o.x < 0.2 && o.x > 0.08) {
            if (y < 0.35) {
              o.golpe = true;
              vidas--;
              s.sonido.error();
              bici.classList.add('golpe');
              setTimeout(() => bici.classList.remove('golpe'), 400);
              marcador(j, `📦 Pedidos intactos: ${Math.max(0, vidas)}`);
              if (vidas <= 0) { fin(); return false; }
            }
          }
          if (o.x < -0.1) {
            if (!o.golpe) saltados++;
            o.el.remove();
            obst.splice(obst.indexOf(o), 1);
          }
        }
      });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        const p = Math.max(0, vidas / 5) * 0.7 + Math.min(1, saltados / 14) * 0.3;
        j.final(vidas === 5 ? '¡Repartido todo sin un rasguño!' : vidas > 0 ? `Repartido, con ${5 - vidas} pedidos chafados` : '¡Los pedidos por los suelos!', p);
      };
      const pararT = cronometro(j, 28, fin);
    }
  },

  bandeja: {
    icono: '🍹',
    jugar(j, s) {
      j.info('La bandeja se inclina: mantén pulsado el lado contrario para que no se caigan los vasos');
      j.cuerpo.innerHTML = `<div class="fv fv-bandeja"><div class="fv-marcador">🥤 Vasos: 4</div><div class="fv-mesa"><div class="fv-plato">🥤🍹☕🥤</div></div><div class="tb-acciones"><button class="fv-izq">⬅️ Izquierda</button><button class="fv-der">Derecha ➡️</button></div></div>`;
      const plato = j.cuerpo.querySelector('.fv-plato');
      let ang = 0;
      let v = 0;
      let empuje = 0;
      let vasos = 4;
      let estable = 0;
      let total = 0;
      const pulsar = (b, d) => {
        b.addEventListener('pointerdown', e => { e.preventDefault(); empuje = d; });
        b.addEventListener('pointerup', () => { empuje = 0; });
        b.addEventListener('pointerleave', () => { empuje = 0; });
      };
      pulsar(j.cuerpo.querySelector('.fv-izq'), -1);
      pulsar(j.cuerpo.querySelector('.fv-der'), 1);
      let t = 0;
      const parar = bucle(j, dt => {
        t += dt;
        const viento = Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3 + 1) * 0.4;
        v += (viento * (1 + t * 0.03) + empuje * 2.2 + ang * 0.6) * dt * 22;
        v *= 0.92;
        ang += v * dt;
        plato.style.transform = `rotate(${ang}deg)`;
        total += dt;
        if (Math.abs(ang) < 8) estable += dt;
        if (Math.abs(ang) > 22) {
          vasos--;
          s.sonido.error();
          ang *= 0.3;
          v = 0;
          plato.textContent = ['', '🥤', '🥤🍹', '🥤🍹☕', '🥤🍹☕🥤'][Math.max(0, vasos)];
          marcador(j, `🥤 Vasos: ${Math.max(0, vasos)}`);
          if (vasos <= 0) { fin(); return false; }
        }
      });
      let hecho = false;
      const fin = () => {
        if (hecho) return;
        hecho = true;
        parar();
        pararT();
        const p = (vasos / 4) * 0.7 + (estable / Math.max(1, total)) * 0.3;
        j.final(vasos === 4 ? '¡Camarero del año!' : vasos > 0 ? `Llegaron ${vasos} de 4 vasos` : 'Todo por el suelo… ¡a fregar!', p);
      };
      const pararT = cronometro(j, 25, fin);
    }
  }
};
