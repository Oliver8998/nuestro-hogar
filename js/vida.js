import * as THREE from 'three';
import { crearPersonaje } from './personajes.js';
import { CATALOGO } from './catalogo.js';

const VISITANTES = {
  mama: { nombre: 'Mamá', saludo: '¡Hola, cariños! Pasaba por aquí…' },
  mateo: { nombre: 'Mateo, el vecino', saludo: 'Buenas… ¿me prestáis un poco de sal?' },
  sol: { nombre: 'Sol, vuestra amiga', saludo: '¡Sorpresaaa! Venía a cotillear la casa 👀' },
  amigos: { nombre: 'Dani, un colega', saludo: '¡Ey! ¿Qué tal la casita?' },
  lola: { nombre: 'Pilar', saludo: '¡Hola! Os traigo una cosita de la tienda.' }
};

const FRASES_LORO = ['¡Hola guapa!', '¡Te quiero!', '¿Qué hay de cena?', '¡Limpia, limpia!', '¡Pilar! ¡Pilar!', '¡Qué bonita casa!', '¡A dormir!', '¡Galletita!', '¡Cuchi cuchi!'];

const CARTAS_PILAR = [
  'Un truco: las plantas y las lámparas hacen la casa mucho más acogedora. ¡Y las fotos vuestras también!',
  'Si regáis las plantas cada día, crecen preciosas. Si no, se ponen mustias…',
  'Los fines de semana monto el mercadillo con cosas que no veréis en la tienda normal.',
  '¿Sabíais que en el taller podéis convertir muebles repetidos en piezas para fabricar exclusivos?',
  'Las mascotas con buen humor no hacen trastadas. ¡Dadles mimos!',
  'Si el sofá se ve viejo, se puede tapizar. Queda como nuevo.'
];

const POSTALES = [
  { de: 'Mamá', texto: 'Os echo de menos. Os mando unas monedillas para algo bonito para la casa. ¡Besos!', monedas: 40 },
  { de: 'La abuela', texto: 'Qué alegría que tengáis vuestra casita. Comed bien, ¿eh? Aquí va un regalito.', monedas: 60 },
  { de: 'Sol', texto: 'Desde la playa 🏖️ ¡Ojalá estuvierais aquí! Os traeré un recuerdo.', monedas: 25 },
  { de: 'Mateo, el vecino', texto: 'Gracias por la sal del otro día. Os dejo esto por las molestias.', monedas: 30 }
];

function hoyClave() {
  return new Date().toDateString();
}

function azarDia(n) {
  let x = 0;
  for (const c of hoyClave()) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x % n;
}

export class Vida {
  constructor(ctx) {
    this.ctx = ctx;
    this.t = 0;
    this.tLento = 0;
    this.visitante = null;
    this.mantas = new Map();
    this.gotera = null;
    this.tartas = [];
  }

  get estado() {
    return this.ctx.estado;
  }

  tarde() {
    const h = this.ctx.ambiente.hora;
    return h >= 23 || h < 7;
  }

  bocadillo(pos, texto) {
    const p = this.ctx.pantalla(pos);
    const el = document.createElement('div');
    el.className = 'bocadillo-3d';
    el.textContent = texto;
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  dormir() {
    const tarde = this.tarde();
    for (const m of this.ctx.gestor.muebles) {
      if (m.userData.def.id !== 'sofa') continue;
      let manta = this.mantas.get(m);
      if (tarde && !manta) {
        manta = new THREE.Group();
        const tela = new THREE.MeshStandardMaterial({ color: 0xe8a8b8, roughness: 0.95 });
        const encima = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.6), tela);
        encima.position.set(0.45, 0.52, 0.12);
        encima.rotation.y = 0.15;
        const cae = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.04), tela);
        cae.position.set(0.47, 0.36, 0.44);
        cae.rotation.y = 0.15;
        const rayas = new THREE.Mesh(new THREE.BoxGeometry(0.71, 0.045, 0.08), new THREE.MeshStandardMaterial({ color: 0xf7f3e8, roughness: 0.95 }));
        rayas.position.set(0.45, 0.52, 0.12);
        rayas.rotation.y = 0.15;
        manta.add(encima, cae, rayas);
        manta.traverse(o => { if (o.isMesh) o.castShadow = true; });
        m.add(manta);
        this.mantas.set(m, manta);
      } else if (!tarde && manta) {
        m.remove(manta);
        this.mantas.delete(m);
      }
    }
    for (const [m, manta] of this.mantas) if (!this.ctx.gestor.muebles.includes(m)) this.mantas.delete(m);
    if (tarde) {
      for (const p of this.ctx.mascotas.lista) {
        if (p.estado !== 'dormir' && p.energia > 25) p.energia = 25;
      }
    }
  }

  loroYDragon() {
    for (const m of this.ctx.mascotas.lista) {
      if (m.estado === 'dormir') continue;
      if (m.especie === 'loro' && Math.random() < 0.25) {
        const extra = [];
        const p = this.estado.pareja;
        if (p) extra.push(...p.nombres.filter(Boolean).map(n => `¡${n}! ¡${n}!`));
        for (const n of (this.estado.notas || []).slice(-3)) extra.push(n.texto.split(/[.!?]/)[0].slice(0, 28));
        const frases = [...FRASES_LORO, ...extra];
        this.bocadillo(new THREE.Vector3(m.grupo.position.x, 0.9, m.grupo.position.z), `🦜 ${frases[Math.floor(Math.random() * frases.length)]}`);
      }
      if (m.especie === 'dragon' && (m.estado === 'feliz' || m.estado === 'jugar' || Math.random() < 0.15)) {
        this.ctx.particula('🔥', m, 2);
      }
    }
  }

  revisarVisita() {
    const v = this.estado.visita;
    if (v && Date.now() > v.hasta) {
      this.estado.visita = null;
      this.quitarVisitante();
      this.ctx.chip();
      return;
    }
    if (v && !this.visitante && (this.estado.habActual || 0) === 0) this.ponerVisitante(v.quien);
    if (v) return;
    const ultima = this.estado.ultimaVisita || 0;
    const h = this.ctx.ambiente.hora;
    if (h < 10 || h > 21 || Date.now() - ultima < 18 * 3600000) return;
    if (Math.random() > 0.08) return;
    const ids = Object.keys(VISITANTES);
    const quien = ids[Math.floor(Math.random() * ids.length)];
    this.estado.visita = { quien, hasta: Date.now() + 4 * 60000 };
    this.estado.ultimaVisita = Date.now();
    this.ctx.guardar();
    this.ponerVisitante(quien);
    this.ctx.sonido.mascota();
    this.ctx.ui.aviso(`🚪 ¡Ha venido ${VISITANTES[quien].nombre}! Tocad el aviso de arriba`);
    this.ctx.chip();
  }

  ponerVisitante(quien) {
    this.quitarVisitante();
    const p = crearPersonaje(quien);
    p.position.set(1.0, 0, 2.35);
    p.rotation.y = Math.PI;
    p.scale.setScalar(1.25);
    this.ctx.escena.add(p);
    this.visitante = p;
  }

  quitarVisitante() {
    if (this.visitante) {
      this.ctx.escena.remove(this.visitante);
      this.visitante = null;
    }
  }

  atenderVisita() {
    const v = this.estado.visita;
    if (!v) return;
    const info = VISITANTES[v.quien];
    const a = this.ctx.acogedor();
    const opinion = a >= 75 ? '¡Madre mía, qué casa más bonita! Se nota que la cuidáis.' : a >= 50 ? 'Está quedando muy apañada. ¡Un par de plantas más y perfecta!' : 'Bueno… le falta cariño, pero vais por buen camino.';
    const monedas = 30 + Math.round(a / 2);
    const baratos = CATALOGO.filter(d => d.enTienda !== false && !d.temporada && d.precio <= 120 && d.categoria === 'deco');
    const regalo = Math.random() < 0.4 ? baratos[Math.floor(Math.random() * baratos.length)] : null;
    this.ctx.ui.dialogo({
      imagen: this.ctx.miniaturas.personaje(v.quien), personaje: true,
      titulo: info.nombre,
      texto: `${info.saludo} ${opinion} ${regalo ? `Os he traído ${regalo.nombre.toLowerCase()}.` : `Tomad, ${monedas} monedas para la casa.`}`,
      botones: [{
        texto: '¡Gracias por venir! 💕', tipo: 'primario', accion: () => {
          if (regalo) {
            this.ctx.inventario.anadir(regalo.id, regalo.colores ? 0 : null);
            this.ctx.ui.pintarInventario(this.ctx.inventario);
          } else this.estado.monedas += monedas;
          this.estado.visita = null;
          this.quitarVisitante();
          this.ctx.registrar('visita');
          this.ctx.refrescarHud();
          this.ctx.guardar();
          this.ctx.chip();
          this.ctx.sonido.premio();
        }
      }]
    });
  }

  revisarAveria() {
    const a = this.estado.averia;
    if (a) {
      this.mostrarAveria(a.tipo);
      return;
    }
    this.mostrarAveria(null);
    const ultima = this.estado.ultimaAveria || Date.now() - 12 * 3600000;
    if (this.estado.ultimaAveria === undefined) this.estado.ultimaAveria = ultima;
    if (Date.now() - ultima < 30 * 3600000 || Math.random() > 0.05) return;
    const tipo = Math.random() < 0.5 ? 'gotera' : 'luz';
    this.estado.averia = { tipo, desde: Date.now() };
    this.estado.ultimaAveria = Date.now();
    this.ctx.guardar();
    this.ctx.sonido.error();
    this.ctx.ui.aviso(tipo === 'gotera' ? '💧 ¡Hay una gotera! Arreglad la tubería' : '⚡ ¡Se ha ido la luz! Mirad el cuadro eléctrico');
    this.ctx.chip();
  }

  mostrarAveria(tipo) {
    if (tipo === 'gotera' && !this.gotera) {
      const g = new THREE.Group();
      const charco = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), new THREE.MeshStandardMaterial({ color: 0x9fc4e0, roughness: 0.1, transparent: true, opacity: 0.6, depthWrite: false }));
      charco.rotation.x = -Math.PI / 2;
      charco.position.y = 0.006;
      charco.scale.set(1, 0.7, 1);
      const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 10), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 }));
      tubo.rotation.z = Math.PI / 2;
      tubo.position.set(0, 2.45, -0.25);
      const gota = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9fd0ff, roughness: 0.1 }));
      gota.position.set(0, 2.4, -0.25);
      g.add(charco, tubo, gota);
      g.position.set(-2.4, 0, -2.5);
      g.userData.gota = gota;
      this.ctx.escena.add(g);
      this.gotera = g;
    } else if (tipo !== 'gotera' && this.gotera) {
      this.ctx.escena.remove(this.gotera);
      this.gotera = null;
    }
    this.ctx.ambiente.apagon = tipo === 'luz';
  }

  async arreglarAveria() {
    const a = this.estado.averia;
    if (!a) return;
    const ok = await this.ctx.juegos.jugar(a.tipo === 'gotera' ? 'gotera' : 'luz');
    if (!ok) return;
    this.estado.averia = null;
    this.mostrarAveria(null);
    this.ctx.ambiente.calcular();
    this.estado.monedas += 25;
    this.ctx.registrar('averia');
    this.ctx.refrescarHud();
    this.ctx.guardar();
    this.ctx.chip();
    this.ctx.ui.aviso(a.tipo === 'gotera' ? '🔧 ¡Tubería arreglada! +25 🪙' : '💡 ¡Ha vuelto la luz! +25 🪙');
  }

  revisarCumples() {
    if (!this.estado.cumplesMascotas) this.estado.cumplesMascotas = {};
    for (const m of this.ctx.mascotas.lista) {
      const meses = Math.floor(m.edadDias() / 30);
      if (meses < 1) continue;
      const clave = `${m.id}-${meses}`;
      if (this.estado.cumplesMascotas[m.id] === meses) continue;
      if (this.ctx.dialogoAbierto()) return;
      this.estado.cumplesMascotas[m.id] = meses;
      this.estado.monedas += 50;
      this.ctx.refrescarHud();
      this.ctx.guardar();
      this.ponerTarta(m);
      this.ctx.sonido.premio();
      this.ctx.ui.dialogo({
        imagen: this.ctx.miniaturas.mascota(m.especie),
        titulo: `🎂 ¡${m.nombre} cumple ${meses} ${meses === 1 ? 'mes' : 'meses'}!`,
        texto: '¡Hay tarta! Pilar os manda 50 monedas para celebrarlo.',
        confeti: true,
        botones: [{ texto: '¡Cumpleaños feliz! 🎉', tipo: 'primario' }]
      });
      this.ctx.recordar(null, '🎂', `${m.nombre} cumplió ${meses} ${meses === 1 ? 'mes' : 'meses'}`);
      void clave;
      return;
    }
  }

  ponerTarta(m) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xf6d8e0 }));
    base.position.y = 0.06;
    const nata = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.03, 20), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    nata.position.y = 0.12;
    const vela = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x5a9fd6 }));
    vela.position.y = 0.18;
    const llama = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffc040, emissive: 0xffa020, emissiveIntensity: 2 }));
    llama.position.y = 0.235;
    g.add(base, nata, vela, llama);
    g.position.set(m.grupo.position.x + 0.3, 0, m.grupo.position.z + 0.2);
    this.ctx.escena.add(g);
    this.tartas.push({ g, hasta: Date.now() + 3600000 });
  }

  correo() {
    if (!this.estado.correo) this.estado.correo = { lista: [], dia: null };
    const c = this.estado.correo;
    if (c.dia === hoyClave()) return;
    c.dia = hoyClave();
    const tipo = ['pilar', 'catalogo', 'postal'][azarDia(3)];
    const id = `c${Date.now()}`;
    if (tipo === 'pilar') c.lista.push({ id, tipo, de: 'Pilar', titulo: 'Un consejito', texto: CARTAS_PILAR[azarDia(CARTAS_PILAR.length)], t: Date.now() });
    else if (tipo === 'postal') {
      const p = POSTALES[azarDia(POSTALES.length)];
      c.lista.push({ id, tipo, de: p.de, titulo: 'Una postal', texto: p.texto, monedas: p.monedas, t: Date.now() });
    } else {
      const ids = CATALOGO.filter(d => d.enTienda !== false && !d.temporada && !d.exterior && d.precio >= 40).map(d => d.id);
      const elegidos = [ids[azarDia(ids.length)], ids[(azarDia(ids.length) + 7) % ids.length], ids[(azarDia(ids.length) + 13) % ids.length]];
      c.lista.push({ id, tipo, de: 'Tienda de Pilar', titulo: 'Catálogo de ofertas (solo hoy)', texto: 'Hoy tenéis un 25% de descuento en estas cosas:', ofertas: [...new Set(elegidos)], dia: hoyClave(), t: Date.now() });
    }
    c.lista = c.lista.slice(-15);
    this.ctx.guardar();
  }

  noLeidas() {
    return ((this.estado.correo && this.estado.correo.lista) || []).filter(x => !x.leida).length;
  }

  ofertasHoy() {
    const c = this.estado.correo;
    if (!c) return [];
    const cat = c.lista.find(x => x.tipo === 'catalogo' && x.dia === hoyClave());
    return cat ? cat.ofertas : [];
  }

  abrirCorreo() {
    const { ui, miniaturas } = this.ctx;
    const lista = ((this.estado.correo && this.estado.correo.lista) || []).slice().reverse();
    const cuerpo = ui.abrirGen('Buzón', lista.length ? `<div class="cartas">${lista.map(c => `<button class="carta-correo ${c.leida ? '' : 'nueva'}" data-id="${c.id}"><span>${c.tipo === 'postal' ? '🖼️' : c.tipo === 'catalogo' ? '📰' : '💌'}</span><div><b>${c.titulo}</b><small>De ${c.de} · ${new Date(c.t).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</small></div></button>`).join('')}</div>` : '<p class="vacio">El buzón está vacío. Mañana llegará algo.</p>', () => this.ctx.abrirMas());
    cuerpo.querySelectorAll('.carta-correo').forEach(b => b.addEventListener('click', () => {
      const c = this.estado.correo.lista.find(x => x.id === b.dataset.id);
      const primera = !c.leida;
      c.leida = true;
      if (primera && c.monedas) {
        this.estado.monedas += c.monedas;
        this.ctx.refrescarHud();
      }
      this.ctx.guardar();
      this.ctx.chip();
      ui.dialogo({
        titulo: c.titulo,
        html: `<div class="nota-papel"><b>De ${c.de}</b>${c.texto}${c.ofertas ? `<div class="ofertas-carta">${c.ofertas.map(id => `<img src="${miniaturas.item(id, 0)}" alt="">`).join('')}</div>` : ''}${c.monedas ? `<small>🪙 +${c.monedas} monedas</small>` : ''}</div>`,
        botones: c.ofertas && c.dia === hoyClave() ? [{ texto: 'Cerrar', tipo: 'secundario' }, { texto: '🛒 Ir a la tienda', tipo: 'primario', accion: () => ui.abrirTienda('muebles') }] : [{ texto: 'Cerrar', tipo: 'primario', accion: () => this.abrirCorreo() }]
      });
    }));
  }

  actualizar(dt) {
    this.t += dt;
    if (this.visitante) this.visitante.position.y = Math.abs(Math.sin(this.t * 2)) * 0.03;
    if (this.gotera) {
      const g = this.gotera.userData.gota;
      g.position.y -= dt * 2.5;
      if (g.position.y < 0.05) g.position.y = 2.4;
    }
    this.tLento += dt;
    if (this.tLento < 3) return;
    this.tLento = 0;
    this.dormir();
    if (Math.random() < 0.35) this.loroYDragon();
    this.revisarVisita();
    this.revisarAveria();
    this.revisarCumples();
    this.correo();
    for (const t of [...this.tartas]) {
      if (Date.now() > t.hasta) {
        this.ctx.escena.remove(t.g);
        this.tartas.splice(this.tartas.indexOf(t), 1);
      }
    }
  }
}
