import * as THREE from 'three';
import { enSala } from './medidas.js';
import { CATALOGO } from './catalogo.js';
import { crearModeloMascota } from './mascotas.js';
import { crearExclamacion } from './telefono.js';

const MIN = 60000;

function hoy() {
  return new Date().toDateString();
}

function pista(nombre, intento) {
  if (intento <= 0) return null;
  if (intento === 1) return `Tiene ${nombre.replace(/\s/g, '').length} letras`;
  if (intento === 2) return `Empieza por «${nombre[0].toUpperCase()}»`;
  return nombre.split('').map((c, i) => (c === ' ' ? ' ' : i % 2 === 0 ? c : '_')).join('');
}

export class Sorpresas {
  constructor(ctx) {
    this.ctx = ctx;
    this.t = 0;
    this.tRevisar = 5;
    this.nieve = null;
    this.gato = null;
  }

  get estado() {
    return this.ctx.estado;
  }

  activa() {
    const s = this.estado.sorpresa;
    if (s && Date.now() > s.hasta) {
      this.estado.sorpresa = null;
      this.limpiar();
      this.ctx.chip();
      return null;
    }
    return s || null;
  }

  invierno() {
    const forzado = new URLSearchParams(location.search).get('temporada');
    if (forzado) return forzado === 'invierno' || forzado === 'navidad';
    const m = new Date().getMonth();
    return m === 11 || m <= 1;
  }

  forzada() {
    return new URLSearchParams(location.search).get('sorpresa');
  }

  revisar() {
    if (this.ctx.visitando()) return;
    const s = this.activa();
    if (s) {
      this.mostrar(s);
      return;
    }
    const forz = this.forzada();
    if (!forz) {
      if (!this.ctx.genera()) return;
      if (this.estado.sorpresaDia === hoy()) return;
      const h = new Date().getHours();
      if (h < 9 || h > 23) return;
      if (Math.random() > 0.05) return;
    } else if (this.estado.sorpresaForzada === forz) return;
    const tipos = ['gato', 'tesoro', 'tesoro'];
    if (this.invierno()) tipos.push('nieve', 'nieve');
    else if (Math.random() < 0.3) tipos.push('nieve');
    const tipo = forz || tipos[Math.floor(Math.random() * tipos.length)];
    const nueva = { tipo, hasta: Date.now() + 40 * MIN };
    if (tipo === 'tesoro') {
      const candidatos = this.ctx.gestor.muebles.filter(m => !['colchon', 'caja'].includes(m.userData.def.id));
      if (candidatos.length < 3) return;
      const m = candidatos[Math.floor(Math.random() * candidatos.length)];
      nueva.uid = m.userData.uid;
      nueva.hab = this.estado.habActual || 0;
      nueva.intentos = 0;
      nueva.hasta = Date.now() + 3 * 60 * MIN;
    }
    this.estado.sorpresa = nueva;
    this.estado.sorpresaDia = hoy();
    if (forz) this.estado.sorpresaForzada = forz;
    this.ctx.guardar();
    this.mostrar(nueva);
    this.ctx.sonido.mascota();
    this.ctx.ui.aviso({ nieve: '❄️ ¡Está nevando dentro de casa!', gato: '🐱 Hay un gatito en la puerta…', tesoro: '🗺️ ¡Habéis encontrado un mapa del tesoro!' }[tipo]);
    this.ctx.chip();
  }

  mostrar(s) {
    if (s.tipo === 'nieve' && !this.nieve) this.ponerNieve();
    if (s.tipo === 'gato' && !this.gato && (this.estado.habActual || 0) === 0) this.ponerGato();
  }

  limpiar() {
    if (this.nieve) {
      this.ctx.escena.remove(this.nieve);
      this.nieve.geometry.dispose();
      this.nieve.material.dispose();
      this.nieve = null;
    }
    if (this.gato) {
      this.ctx.escena.remove(this.gato.raiz);
      this.gato = null;
    }
  }

  ponerNieve() {
    const n = 400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 5.8;
      pos[i * 3 + 1] = Math.random() * 2.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5.8;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 32);
    const mat = new THREE.PointsMaterial({ size: 0.07, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
    this.nieve = new THREE.Points(geo, mat);
    this.ctx.escena.add(this.nieve);
  }

  ponerGato() {
    const partes = crearModeloMascota('gato');
    partes.raiz.position.set(...(([x, z]) => [x, 0, z])(enSala(-1.0, 2.55)));
    partes.raiz.rotation.y = Math.PI;
    partes.raiz.scale.multiplyScalar(0.67);
    const exc = crearExclamacion(0.3 / partes.raiz.scale.x);
    exc.position.y = 0.7 / partes.raiz.scale.x;
    partes.raiz.add(exc);
    partes.exclamacion = exc;
    this.ctx.escena.add(partes.raiz);
    this.gato = partes;
  }

  chips() {
    const s = this.activa();
    if (!s) return [];
    if (s.tipo === 'nieve') return [{ id: 'nieve', texto: '❄️ ¡Nieva!', accion: () => this.cazarCopos() }];
    if (s.tipo === 'gato') return [];
    if (s.tipo === 'tesoro') return [{ id: 'tesoro', texto: '🗺️ Tesoro', accion: () => this.verMapa() }];
    return [];
  }

  async cazarCopos() {
    const { juegos, sonido } = this.ctx;
    const res = await juegos.custom('❄️', 'Atrapa los copos', j => {
      j.info('¡Tocad todos los copos que podáis antes de que se derritan!');
      j.cuerpo.innerHTML = '<div class="copos"><b class="contador">0</b></div>';
      const zona = j.cuerpo.querySelector('.copos');
      const cont = zona.querySelector('.contador');
      let n = 0;
      let t = 0;
      const dur = 15;
      let vivo = true;
      const crear = () => {
        if (!vivo) return;
        const el = document.createElement('button');
        el.className = 'copo';
        el.textContent = Math.random() < 0.08 ? '⛄' : '❄️';
        const especial = el.textContent === '⛄';
        el.style.left = `${5 + Math.random() * 85}%`;
        el.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
        el.addEventListener('pointerdown', e => {
          e.preventDefault();
          n += especial ? 5 : 1;
          cont.textContent = n;
          sonido.tic();
          el.remove();
        });
        el.addEventListener('animationend', () => el.remove());
        zona.appendChild(el);
        setTimeout(crear, 230 + Math.random() * 280);
      };
      crear();
      const reloj = setInterval(() => {
        t += 0.1;
        j.tiempo(1 - t / dur);
        if (t >= dur) {
          clearInterval(reloj);
          vivo = false;
          j.final(`¡${n} copos atrapados!`, Math.min(1, n / 40));
        }
      }, 100);
      j.alTerminar = () => {
        vivo = false;
        clearInterval(reloj);
      };
    });
    if (res === null || res === undefined) return;
    this.estado.sorpresa = null;
    this.limpiar();
    this.ctx.registrar('nieve');
    this.ctx.ganar(Math.round(20 + res * 60), null, '❄️');
    this.ctx.chip();
  }

  tocable(rayo) {
    if (this.gato && this.activa() && this.activa().tipo === 'gato' && rayo.intersectObject(this.gato.raiz, true).length) return () => this.atenderGato();
    return null;
  }

  atenderGato() {
    const { ui, sonido } = this.ctx;
    ui.dialogo({
      imagen: this.ctx.miniaturas.mascota('gato'),
      titulo: '🐱 Un gatito callejero',
      texto: 'Está maullando en la puerta. Tiene pinta de tener hambre… y de querer quedarse.',
      botones: [
        {
          texto: '🏠 ¡Adoptarlo!', tipo: 'primario', accion: async () => {
            const ok = await this.ctx.adoptar('gato', true);
            if (!ok) return;
            this.estado.sorpresa = null;
            this.limpiar();
            this.ctx.registrar('gato-callejero');
            this.ctx.recordar('gato-callejero', '🐈', 'Adoptamos un gatito que apareció en la puerta');
            this.ctx.guardar();
            this.ctx.chip();
          }
        },
        {
          texto: '🥛 Darle de comer', tipo: 'secundario', accion: () => {
            this.estado.sorpresa = null;
            this.limpiar();
            sonido.mascota();
            ui.aviso('🐱 Se ha ido contentísimo. ¡Os ha dejado algo en el felpudo!');
            this.ctx.registrar('gato-comida');
            this.ctx.ganar(25, null, '🐾');
            this.ctx.chip();
          }
        },
        { texto: 'Ahora no', tipo: 'secundario' }
      ],
      columna: true
    });
  }

  muebleTesoro() {
    const s = this.estado.sorpresa;
    if (!s || s.tipo !== 'tesoro') return null;
    return this.ctx.buscarMueble(s.uid, s.hab);
  }

  verMapa() {
    const { ui } = this.ctx;
    const s = this.activa();
    const objetivo = this.muebleTesoro();
    if (!objetivo) {
      this.estado.sorpresa = null;
      ui.aviso('🗺️ El mapa ya no sirve… alguien movió las cosas');
      this.ctx.chip();
      return;
    }
    const hab = this.ctx.nombreHab(s.hab);
    const pistas = [];
    for (let k = 1; k <= s.intentos; k++) pistas.push(pista(objetivo.nombre, k));
    ui.dialogo({
      titulo: '🗺️ Mapa del tesoro',
      texto: `«El tesoro está escondido en ${hab === this.ctx.nombreHab(this.estado.habActual || 0) ? 'esta habitación' : `el ${hab.toLowerCase()}`}, dentro o debajo de un mueble.» Mantened pulsado un mueble y pulsad 🔍 Buscar. Tenéis ${Math.max(0, 5 - s.intentos)} intentos.`,
      html: pistas.length ? `<div class="pistas">${pistas.map(p => `<div>🔎 ${p}</div>`).join('')}</div>` : '',
      botones: [{ texto: '¡A buscar!', tipo: 'primario' }]
    });
  }

  opcionesMueble(m) {
    const s = this.activa();
    if (!s || s.tipo !== 'tesoro' || s.hab !== (this.estado.habActual || 0)) return [];
    return [{ icono: '🔍', texto: 'Buscar', accion: () => this.buscar(m) }];
  }

  buscar(m) {
    const { ui, sonido, inventario } = this.ctx;
    const s = this.estado.sorpresa;
    if (m.userData.uid === s.uid) {
      this.estado.sorpresa = null;
      const raros = CATALOGO.filter(d => (d.rareza === 'raro' || d.rareza === 'epico') && !d.mascota);
      const it = raros[Math.floor(Math.random() * raros.length)];
      inventario.anadir(it.id, it.colores ? 0 : null);
      ui.pintarInventario(inventario);
      this.estado.monedas += 50;
      this.ctx.registrar('tesoro');
      this.ctx.recordar('tesoro', '🗺️', `Encontramos un tesoro escondido en ${m.userData.def.nombre.toLowerCase()}`);
      this.ctx.refrescarHud();
      this.ctx.guardar();
      this.ctx.chip();
      sonido.premio();
      ui.dialogo({
        imagen: this.ctx.miniaturas.item(it.id, it.colores ? 0 : null),
        titulo: '💰 ¡Tesoro encontrado!',
        texto: `Estaba en ${m.userData.def.nombre.toLowerCase()}: 50 monedas y ${it.nombre.toLowerCase()}. ¡Está en el inventario!`,
        confeti: true,
        botones: [{ texto: '¡Toma ya!', tipo: 'primario' }]
      });
      return;
    }
    s.intentos++;
    sonido.error();
    this.ctx.guardar();
    if (s.intentos >= 5) {
      const obj = this.muebleTesoro();
      this.estado.sorpresa = null;
      this.ctx.guardar();
      this.ctx.chip();
      ui.dialogo({ titulo: '🗺️ Se acabaron los intentos', texto: `Estaba en ${obj ? obj.nombre.toLowerCase() : 'otro sitio'}. ¡La próxima vez será!`, botones: [{ texto: 'Vaya…', tipo: 'primario' }] });
      return;
    }
    const obj = this.muebleTesoro();
    ui.aviso(`Aquí no está… Pista: ${obj ? pista(obj.nombre, s.intentos) : '???'}`);
  }

  actualizar(dt) {
    if (this.gato && this.gato.mixer) this.gato.mixer.update(dt);
    if (this.gato && this.gato.exclamacion) {
      const e = this.gato.exclamacion;
      e.position.y = (e.userData.y0 ?? (e.userData.y0 = e.position.y)) * (1 + Math.sin(this.t * 4) * 0.05);
    }
    this.t += dt;
    if (this.nieve) {
      const pos = this.nieve.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - dt * (0.35 + (i % 7) * 0.04);
        if (y < 0) y = 2.6;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(this.t * 1.3 + i) * dt * 0.08);
      }
      pos.needsUpdate = true;
    }
    if (this.gato) {
      const p = this.gato;
      p.raiz.position.y = Math.abs(Math.sin(this.t * 3)) * 0.02;
      if (p.cola) p.cola.rotation.y = Math.sin(this.t * 4) * 0.6;
    }
    this.tRevisar -= dt;
    if (this.tRevisar <= 0) {
      this.tRevisar = 30;
      this.revisar();
    }
  }
}
