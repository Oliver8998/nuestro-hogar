export const INV = 50;
export const NIVEL_INMOBILIARIA = 9;
const HORA = 3600000;
const PERIODO = 3 * 24 * HORA;
const TOPE_HUCHA = 24;

const CALLES = ['Calle del Olmo', 'Calle Mayor', 'Calle de la Luna', 'Calle Ancha', 'Calle del Pez', 'Calle de las Flores', 'Plaza del Reloj', 'Calle del Molino', 'Calle de la Fuente', 'Calle del Sol', 'Calle Nueva', 'Calle de los Tilos'];

const TIPOS_PISO = {
  pintura: { nombre: 'Solo necesita pintura', icono: '🖌️', precio: [6000, 8000], sucio: ['polvo', 'polvo'], trastos: [] },
  polvo: { nombre: 'Hecho polvo', icono: '🕸️', precio: [4500, 6000], sucio: ['polvo', 'polvo', 'polvo', 'telarana', 'telarana', 'barro', 'bichos'], trastos: [['caja', 3, -4], ['caja', 4, -4]] },
  ruina: { nombre: 'Para tirarlo', icono: '🏚️', precio: [3000, 4500], sucio: ['polvo', 'polvo', 'polvo', 'polvo', 'telarana', 'telarana', 'telarana', 'barro', 'barro', 'bichos', 'bichos'], trastos: [['colchon', -5, -5], ['caja', 3, -4], ['caja', 4, -4], ['caja', 3, -3], ['caja', -2, 3]] }
};

export const INQUILINOS = [
  { id: 'estudiante', nombre: 'Lucas, estudiante', icono: '🎓', texto: 'Le vale con lo básico, pero paga poco', mult: 0.85, quiere: [] },
  { id: 'pareja', nombre: 'Ana y Leo, pareja joven', icono: '💑', texto: 'Quieren cocina y alguna planta', mult: 1, quiere: [['cocina'], ['planta', 'cactus', 'maceta-grande']] },
  { id: 'gato', nombre: 'Doña Carmen y su gato', icono: '🐈', texto: 'Su gato necesita un rascador y ella un sofá', mult: 1, quiere: [['rascador'], ['sofa']] },
  { id: 'teletrabajo', nombre: 'Marta, teletrabaja', icono: '💻', texto: 'Necesita escritorio y una lámpara', mult: 1, quiere: [['escritorio'], ['lampara', 'lampara-mesa']] },
  { id: 'familia', nombre: 'Familia García', icono: '👨‍👩‍👧', texto: 'Buscan cama, sofá y tele', mult: 1.1, quiere: [['cama'], ['sofa'], ['tele']] }
];

const AVERIAS = [
  { juego: 'gotera', texto: 'Se ha roto una tubería y está cayendo agua', icono: '🚿' },
  { juego: 'luz', texto: 'Han saltado los plomos y no hay luz', icono: '⚡' }
];

function generador(semilla) {
  let s = semilla % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = s * 16807 % 2147483647) / 2147483647;
}

function nombreItem(id, infoItem) {
  const i = infoItem(id);
  return i ? i.nombre.toLowerCase() : id;
}

export class Inmobiliaria {
  constructor(ctx) {
    this.ctx = ctx;
    this.t = 0;
  }

  get estado() {
    return this.ctx.estado();
  }

  get piso() {
    return this.estado.inversion || null;
  }

  desbloqueada() {
    return this.ctx.nivel() >= NIVEL_INMOBILIARIA && this.ctx.reformada();
  }

  periodo() {
    return Math.floor(Date.now() / PERIODO);
  }

  ofertas() {
    const p = this.periodo();
    const r = generador(p * 48271 + 11);
    const tipos = ['ruina', 'polvo', 'pintura'];
    const calles = [...CALLES].sort(() => r() - 0.5);
    return tipos.map((tipo, i) => {
      const t = TIPOS_PISO[tipo];
      const precio = Math.round((t.precio[0] + r() * (t.precio[1] - t.precio[0])) / 50) * 50;
      return { id: `${p}-${i}`, tipo, calle: `${calles[i]}, ${2 + Math.floor(r() * 40)}`, precio };
    });
  }

  acogedor() {
    const p = this.piso;
    if (!p) return 0;
    if (this.ctx.dentro()) p.acogedor = this.ctx.acogedorAqui();
    return p.acogedor || 0;
  }

  valorVenta() {
    const p = this.piso;
    if (!p) return 0;
    return Math.round(p.precio * (0.8 + 0.8 * this.acogedor() / 100) / 10) * 10;
  }

  mueblesPiso() {
    const p = this.piso;
    if (!p) return [];
    if (this.ctx.dentro()) return this.ctx.mueblesAqui();
    return ((p.hab && p.hab.muebles) || []).map(d => d.id);
  }

  encaja(inq) {
    const ids = this.mueblesPiso();
    const cumple = inq.quiere.filter(grupo => grupo.some(id => ids.includes(id))).length;
    return { cumple, total: inq.quiere.length, todo: cumple === inq.quiere.length };
  }

  tarifa(inq) {
    const p = this.piso;
    if (!p || !inq) return 0;
    const e = this.encaja(inq);
    const gusto = inq.quiere.length ? (e.todo ? 1.4 : 1 - 0.15 * (e.total - e.cumple)) : 1;
    return Math.max(2, Math.round(p.precio * 0.0016 * (0.5 + this.acogedor() / 100) * inq.mult * gusto));
  }

  hucha() {
    const p = this.piso;
    if (!p || !p.inquilino) return 0;
    const horas = Math.min(TOPE_HUCHA, (Date.now() - p.inquilino.desde) / HORA);
    return Math.floor(horas * p.inquilino.tarifa);
  }

  llena() {
    const p = this.piso;
    return !!(p && p.inquilino && Date.now() - p.inquilino.desde >= TOPE_HUCHA * HORA);
  }

  candidatos() {
    const p = this.piso;
    const r = generador((p ? p.compra : 1) % 100000 + this.periodo() * 7 + (p && p.inquilinosVistos || 0) * 13);
    const lista = [...INQUILINOS].sort(() => r() - 0.5);
    return lista.slice(0, 3);
  }

  comprar(oferta) {
    const { ui, sonido } = this.ctx;
    if (this.piso) return;
    if (this.estado.monedas < oferta.precio) {
      sonido.error();
      ui.aviso(`Os faltan ${oferta.precio - this.estado.monedas} monedas`, true);
      return;
    }
    const t = TIPOS_PISO[oferta.tipo];
    this.estado.monedas -= oferta.precio;
    this.estado.inversion = {
      calle: oferta.calle, tipo: oferta.tipo, precio: oferta.precio, compra: Date.now(), acogedor: 0,
      hab: { muebles: t.trastos.map(([id, x0, z0], k) => ({ id, x0, z0, rot: 0, base: 0, uid: `tr${Date.now()}${k}` })), suciedad: [], paredes: [null, null, null, null], sucio: t.sucio },
      inquilino: null, satisfaccion: 100, averia: null, proximaAveria: 0
    };
    this.ctx.registrar('compra-piso');
    this.ctx.recordar('🔑', `Compramos un piso en ${oferta.calle}`);
    sonido.comprar();
    this.ctx.refrescarHud();
    this.ctx.guardar();
    ui.cerrarHojas();
    this.ctx.entrar();
    setTimeout(() => {
      sonido.premio();
      ui.dialogo({
        imagen: this.ctx.miniaturas.personaje('mateo'), personaje: true,
        titulo: `🔑 ¡El piso de ${oferta.calle} es vuestro!`,
        texto: 'Dejadlo bonito: limpiadlo, pintad las paredes y amuebladlo. Cuanto más acogedor, más vale. Luego, desde Inmobiliaria, podréis venderlo o alquilarlo. Ojo: los muebles que pongáis se quedan en el piso.',
        confeti: true,
        botones: [{ texto: '¡Manos a la obra!', tipo: 'primario' }]
      });
    }, 900);
  }

  vender() {
    const { ui, sonido } = this.ctx;
    const p = this.piso;
    if (!p) return;
    const valor = this.valorVenta();
    const ganancia = valor - p.precio;
    ui.dialogo({
      titulo: `🏷️ Vender ${p.calle}`,
      texto: `Os dan 🪙 ${valor} (lo comprasteis por 🪙 ${p.precio}, ${ganancia >= 0 ? `ganáis ${ganancia}` : `perdéis ${-ganancia}`}). Los muebles se quedan en el piso. ¿Vendemos?`,
      botones: [
        { texto: 'Todavía no', tipo: 'secundario' },
        {
          texto: `Vender · 🪙 ${valor}`, tipo: 'primario', accion: () => setTimeout(() => {
            if (!this.piso) return;
            this.ctx.salir();
            this.ctx.limpiarRastro();
            this.estado.inversion = null;
            this.estado.monedas += valor;
            this.estado.pisosVendidos = (this.estado.pisosVendidos || 0) + 1;
            this.ctx.ganarXp(Math.max(60, Math.round(Math.max(0, ganancia) / 10)));
            this.ctx.registrar('venta');
            this.ctx.recordar('🏷️', `Vendimos el piso de ${p.calle} por ${valor} monedas`);
            sonido.premio();
            this.ctx.refrescarHud();
            this.ctx.guardar();
            ui.dialogo({
              imagen: this.ctx.miniaturas.personaje('mateo'), personaje: true,
              titulo: '🤝 ¡Vendido!',
              texto: ganancia >= 0 ? `Habéis ganado 🪙 ${ganancia}. Cuando queráis, tengo más pisos.` : `Esta vez habéis perdido 🪙 ${-ganancia}. Dejadlo más acogedor la próxima vez.`,
              confeti: ganancia > 0,
              botones: [{ texto: 'Genial', tipo: 'primario' }]
            });
          }, 250)
        }
      ]
    });
  }

  elegirInquilino() {
    const { ui, sonido } = this.ctx;
    const p = this.piso;
    if (!p) return;
    const lista = this.candidatos();
    const html = lista.map(inq => {
      const e = this.encaja(inq);
      const faltan = inq.quiere.filter(grupo => !grupo.some(id => this.mueblesPiso().includes(id))).map(grupo => grupo.map(id => nombreItem(id, this.ctx.infoItem)).join(' o '));
      return `<button class="inm-inquilino" data-id="${inq.id}"><span>${inq.icono}</span><div><b>${inq.nombre}</b><small>${inq.texto}</small>${inq.quiere.length ? `<small class="${e.todo ? 'ok' : 'falta'}">${e.todo ? '✅ El piso le encanta' : `Le falta: ${faltan.join(', ')}`}</small>` : ''}</div><em>🪙 ${this.tarifa(inq)}/h</em></button>`;
    }).join('');
    const dlg = ui.dialogo({
      titulo: '🔑 ¿A quién se lo alquilamos?',
      texto: 'Pagan por hora real. Si el piso tiene lo que buscan, pagan bastante más.',
      html: `<div class="inm-lista">${html}</div>`,
      botones: [{ texto: 'Mejor luego', tipo: 'secundario' }],
      columna: true
    });
    document.querySelectorAll('.inm-inquilino').forEach(b => b.addEventListener('click', () => {
      const inq = INQUILINOS.find(x => x.id === b.dataset.id);
      p.inquilino = { id: inq.id, desde: Date.now(), tarifa: this.tarifa(inq) };
      p.satisfaccion = 100;
      p.averia = null;
      p.proximaAveria = Date.now() + (36 + Math.random() * 24) * HORA;
      p.inquilinosVistos = (p.inquilinosVistos || 0) + 1;
      sonido.premio();
      this.ctx.registrar('alquiler');
      this.ctx.recordar('🔑', `Alquilamos el piso de ${p.calle} a ${inq.nombre}`);
      this.ctx.guardar();
      if (dlg && dlg.cerrar) dlg.cerrar();
      ui.aviso(`🔑 ¡${inq.nombre} entra a vivir! 🪙 ${p.inquilino.tarifa}/h`);
      setTimeout(() => this.abrir(), 300);
    }));
  }

  cobrar() {
    const { ui, sonido } = this.ctx;
    const p = this.piso;
    if (!p || !p.inquilino) return;
    const n = this.hucha();
    if (n <= 0) {
      ui.aviso('Todavía no hay nada que cobrar');
      return;
    }
    const inq = INQUILINOS.find(x => x.id === p.inquilino.id);
    if (inq) p.inquilino.tarifa = Math.round((p.inquilino.tarifa + this.tarifa(inq)) / 2);
    p.inquilino.desde = Date.now();
    this.estado.monedas += n;
    p.cobrado = (p.cobrado || 0) + n;
    this.ctx.registrar('cobrar-alquiler');
    sonido.monedas ? sonido.monedas() : sonido.premio();
    ui.aviso(`💰 Alquiler cobrado: 🪙 ${n}`);
    this.ctx.refrescarHud();
    this.ctx.guardar();
  }

  arreglarAveria() {
    const p = this.piso;
    if (!p || !p.averia) return;
    const a = AVERIAS.find(x => x.juego === p.averia.juego) || AVERIAS[0];
    this.ctx.jugar(a.juego).then(r => {
      if (r === null || r === undefined || r === false || (typeof r === 'number' && r < 0.33)) {
        this.ctx.ui.aviso('No ha quedado bien. Probad otra vez', true);
        return;
      }
      p.averia = null;
      p.satisfaccion = Math.min(100, (p.satisfaccion || 0) + 15);
      p.proximaAveria = Date.now() + (36 + Math.random() * 24) * HORA;
      this.ctx.registrar('averia');
      this.ctx.ui.aviso('🔧 ¡Avería arreglada! El inquilino está contento');
      this.ctx.guardar();
    });
  }

  actualizar(dt) {
    this.t += dt;
    if (this.t < 20) return;
    this.t = 0;
    const p = this.piso;
    if (p && this.ctx.dentro()) this.acogedor();
    if (!p || !p.inquilino || !this.ctx.genera()) return;
    const ahora = Date.now();
    let cambio = false;
    if (!p.averia && ahora >= (p.proximaAveria || 0)) {
      const a = AVERIAS[Math.floor(Math.random() * AVERIAS.length)];
      p.averia = { juego: a.juego, desde: ahora };
      cambio = true;
    }
    if (p.averia && ahora - p.averia.desde > 24 * HORA) {
      p.satisfaccion = (p.satisfaccion ?? 100) - 40;
      p.averia.desde = ahora;
      cambio = true;
      if (p.satisfaccion <= 0) {
        const inq = INQUILINOS.find(x => x.id === p.inquilino.id);
        this.estado.monedas += this.hucha();
        p.inquilino = null;
        p.averia = null;
        p.seFue = inq ? inq.nombre : 'El inquilino';
        this.ctx.refrescarHud();
      }
    }
    if (cambio) {
      this.ctx.guardar();
      this.ctx.chips();
    }
  }

  chips() {
    const p = this.piso;
    const l = [];
    if (!p) {
      if (this.desbloqueada() && !this.estado.inmobiliariaVista) l.push({ id: 'inm-llamada', titulo: '📞 Mateo, de la inmobiliaria', texto: '🔑 Mateo: tengo pisos baratos para reformar', accion: () => { this.estado.inmobiliariaVista = true; this.ctx.guardar(); this.abrir(); } });
      return l;
    }
    if (p.averia && p.inquilino) {
      const a = AVERIAS.find(x => x.juego === p.averia.juego) || AVERIAS[0];
      const inq = INQUILINOS.find(x => x.id === p.inquilino.id);
      l.push({ id: `inm-averia-${p.averia.desde}`, titulo: `📞 ${inq ? inq.nombre : 'Inquilino'}`, texto: `${a.icono} Avería en ${p.calle}: ${a.texto.toLowerCase()}`, accion: () => this.verAveria() });
    }
    if (this.llena()) l.push({ id: `inm-hucha-${p.inquilino.desde}`, titulo: '💰 Alquiler', texto: `💰 El alquiler de ${p.calle} está listo para cobrar`, accion: () => this.abrir() });
    if (p.seFue) l.push({ id: `inm-sefue-${p.calle}`, titulo: '📞 Mateo, de la inmobiliaria', texto: `😤 ${p.seFue} se ha ido del piso por las averías`, accion: () => { p.seFue = null; this.ctx.guardar(); this.abrir(); } });
    return l;
  }

  verAveria() {
    const p = this.piso;
    if (!p || !p.averia) return;
    const a = AVERIAS.find(x => x.juego === p.averia.juego) || AVERIAS[0];
    const inq = INQUILINOS.find(x => x.id === p.inquilino.id);
    const horas = Math.max(1, Math.ceil((24 * HORA - (Date.now() - p.averia.desde)) / HORA));
    this.ctx.ui.dialogo({
      titulo: `${a.icono} Avería en ${p.calle}`,
      texto: `${inq ? inq.icono + ' ' + inq.nombre : 'El inquilino'}: «${a.texto}. ¿Podéis venir a arreglarlo?» Si no lo arregláis en ${horas} h se enfadará.`,
      botones: [
        { texto: 'Luego', tipo: 'secundario' },
        { texto: '🔧 Ir a arreglarlo', tipo: 'primario', accion: () => setTimeout(() => this.arreglarAveria(), 250) }
      ]
    });
  }

  abrir(atras = null) {
    const { ui } = this.ctx;
    const p = this.piso;
    if (!this.desbloqueada()) {
      ui.abrirGen('🔑 Inmobiliaria', `<p class="gen-intro">Se desbloquea en el nivel ${NIVEL_INMOBILIARIA}, con vuestro piso ya reformado.</p>`, atras);
      return;
    }
    if (!p) {
      const ofertas = this.ofertas();
      const cuerpo = ui.abrirGen('🔑 Inmobiliaria', `
        <div class="inm-mateo"><span>🧑‍💼</span><p>Soy Mateo. Compradme un piso barato, reformadlo y luego vendedlo más caro o alquiladlo para tener ingresos todos los días. Solo podéis tener uno a la vez.</p></div>
        <div class="casas-lista">${ofertas.map(o => {
          const t = TIPOS_PISO[o.tipo];
          return `<div class="casa-fila siguiente"><span>${t.icono}</span><div><b>${o.calle}</b><small>${t.nombre} · 🪙 ${o.precio}</small>${this.estado.monedas >= o.precio ? `<button class="primario inm-comprar" data-id="${o.id}">🔑 Comprar · 🪙 ${o.precio}</button>` : `<small class="falta">Os faltan 🪙 ${o.precio - this.estado.monedas}</small>`}</div></div>`;
        }).join('')}</div>
        <p class="gen-intro inm-pie">Cada 3 días salen pisos nuevos.</p>`, atras);
      cuerpo.querySelectorAll('.inm-comprar').forEach(b => b.addEventListener('click', () => {
        const o = ofertas.find(x => x.id === b.dataset.id);
        ui.dialogo({
          titulo: `🔑 ${o.calle}`,
          texto: `${TIPOS_PISO[o.tipo].nombre}. ¿Lo compramos por 🪙 ${o.precio}?`,
          botones: [{ texto: 'Mejor no', tipo: 'secundario' }, { texto: `Comprar · 🪙 ${o.precio}`, tipo: 'primario', accion: () => setTimeout(() => this.comprar(o), 250) }]
        });
      }));
      return;
    }
    const acog = this.acogedor();
    const inq = p.inquilino ? INQUILINOS.find(x => x.id === p.inquilino.id) : null;
    const dentro = this.ctx.dentro();
    const hucha = this.hucha();
    const cuerpo = ui.abrirGen('🔑 Inmobiliaria', `
      <div class="inm-ficha">
        <b>🔑 ${p.calle}</b>
        <small>Comprado por 🪙 ${p.precio}${p.cobrado ? ` · alquiler cobrado: 🪙 ${p.cobrado}` : ''}</small>
        <div class="inm-datos"><span>🕯️ Acogedor <b>${acog}</b></span><span>🏷️ Valor <b>🪙 ${this.valorVenta()}</b></span></div>
        ${dentro ? '' : '<small class="inm-nota">El acogedor se actualiza cuando entráis al piso.</small>'}
      </div>
      ${inq ? `<div class="inm-ficha"><b>${inq.icono} ${inq.nombre}</b><small>Paga 🪙 ${p.inquilino.tarifa}/h · contento: ${'❤️'.repeat(Math.max(0, Math.ceil((p.satisfaccion ?? 100) / 20)))}${'🤍'.repeat(5 - Math.max(0, Math.ceil((p.satisfaccion ?? 100) / 20)))}</small>
        <div class="inm-hucha"><i><b style="width:${Math.min(100, (Date.now() - p.inquilino.desde) / (TOPE_HUCHA * HORA) * 100)}%"></b></i><small>Hucha: 🪙 ${hucha}${this.llena() ? ' · ¡llena! Cobradla para que siga sumando' : ` · se llena en ${TOPE_HUCHA} h`}</small></div>
        ${p.averia ? '<button class="secundario inm-averia">🔧 Hay una avería: arreglarla</button>' : ''}
        <button class="primario inm-cobrar" ${hucha <= 0 ? 'disabled' : ''}>💰 Cobrar · 🪙 ${hucha}</button></div>` : ''}
      <div class="inm-botones">
        <button class="${dentro ? 'secundario' : 'primario'} inm-ir">${dentro ? '🏠 Volver a casa' : '🚪 Ir al piso'}</button>
        ${inq ? '' : '<button class="primario inm-alquilar">🔑 Alquilar</button>'}
        <button class="secundario inm-vender">🏷️ Vender · 🪙 ${this.valorVenta()}</button>
      </div>
      <p class="gen-intro inm-pie">Vender: os pagan entre ×0,8 y ×1,6 de lo que costó según lo acogedor que esté. Los muebles se quedan en el piso.</p>`, atras);
    const on = (sel, fn) => { const b = cuerpo.querySelector(sel); if (b) b.addEventListener('click', fn); };
    on('.inm-ir', () => { ui.cerrarHojas(); if (dentro) this.ctx.salir(); else this.ctx.entrar(); });
    on('.inm-alquilar', () => this.elegirInquilino());
    on('.inm-vender', () => this.vender());
    on('.inm-cobrar', () => { this.cobrar(); this.abrir(atras); });
    on('.inm-averia', () => { ui.cerrarHojas(); this.arreglarAveria(); });
  }
}
