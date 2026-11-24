const PI = Math.PI;
const azar = l => l[Math.floor(Math.random() * l.length)];
const suave = k => k * k * (3 - 2 * k);

export class Interacciones {
  constructor(ctx) {
    this.ctx = ctx;
    this.anims = new Map();
    this.t = 0;
    const s = ctx.sonido;
    const tono = (f, i, d, op) => s.tono(f, i, d, op);
    const ruido = (d, op) => s.ruido(d, op);
    this.s = {
      boing: () => tono(170, 0, 0.28, { tipo: 'sine', hasta: 460, volumen: 0.16 }),
      blando: () => { ruido(0.25, { freq: 300, q: 0.8, volumen: 0.1 }); tono(140, 0, 0.3, { hasta: 90, volumen: 0.1 }); },
      toc: () => { ruido(0.05, { freq: 450, q: 3, volumen: 0.25 }); ruido(0.05, { freq: 420, q: 3, volumen: 0.22, inicio: 0.15 }); },
      cruje: () => tono(320, 0, 0.45, { tipo: 'sawtooth', hasta: 210, volumen: 0.025 }),
      chisporroteo: () => { for (let i = 0; i < 6; i++) ruido(0.12, { freq: 4500 + Math.random() * 2000, q: 0.7, volumen: 0.04, inicio: i * 0.12 }); },
      zumbido: () => { tono(110, 0, 0.9, { volumen: 0.07 }); tono(220, 0, 0.9, { volumen: 0.02 }); },
      motor: () => { for (let i = 0; i < 8; i++) ruido(0.2, { freq: 160 + (i % 2) * 60, q: 1.2, volumen: 0.12, inicio: i * 0.17 }); },
      clic: () => tono(1900, 0, 0.025, { tipo: 'square', volumen: 0.05 }),
      encender: () => { tono(1300, 0, 0.08, { tipo: 'square', hasta: 300, volumen: 0.035 }); tono(600, 0.08, 0.2, { tipo: 'sine', hasta: 900, volumen: 0.06 }); },
      apagar: () => tono(900, 0, 0.22, { tipo: 'sine', hasta: 120, volumen: 0.08 }),
      pitido: () => tono(1500, 0, 0.12, { tipo: 'sine', hasta: 2100, volumen: 0.07 }),
      campanitas: () => [1319, 1568, 2093, 1760].forEach((f, i) => tono(f, i * 0.09, 0.3, { tipo: 'triangle', volumen: 0.06 })),
      chapoteo: () => { ruido(0.45, { freq: 900, q: 0.7, volumen: 0.14 }); s.agua(); },
      fantasma: () => { tono(330, 0, 1.1, { tipo: 'sine', hasta: 160, volumen: 0.08 }); tono(345, 0.05, 1.0, { tipo: 'sine', hasta: 170, volumen: 0.05 }); },
      ladrido: () => { tono(520, 0, 0.09, { tipo: 'sawtooth', hasta: 300, volumen: 0.06 }); tono(540, 0.18, 0.1, { tipo: 'sawtooth', hasta: 310, volumen: 0.06 }); },
      aranazo: () => { for (let i = 0; i < 4; i++) ruido(0.07, { freq: 3200, q: 1.5, volumen: 0.08, inicio: i * 0.1 }); },
      zum: () => tono(200, 0, 1.3, { tipo: 'sawtooth', hasta: 340, volumen: 0.02 }),
      teclas: () => { for (let i = 0; i < 7; i++) ruido(0.03, { freq: 2500 + Math.random() * 1500, q: 1, volumen: 0.07, inicio: i * 0.08 + Math.random() * 0.03 }); },
      glup: () => [300, 380, 460].forEach((f, i) => tono(f, i * 0.13, 0.1, { hasta: f * 1.6, volumen: 0.08 })),
      ochoBits: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tono(f, i * 0.08, 0.08, { tipo: 'square', volumen: 0.035 })),
      paginas: () => { ruido(0.18, { freq: 4200, q: 0.5, volumen: 0.06 }); ruido(0.18, { freq: 3800, q: 0.5, volumen: 0.05, inicio: 0.22 }); },
      bostezo: () => tono(420, 0, 0.7, { tipo: 'triangle', hasta: 230, volumen: 0.06 }),
      pio: () => tono(1500, 0, 0.12, { hasta: 2300, volumen: 0.07 }),
      ay: () => { tono(700, 0, 0.12, { tipo: 'triangle', hasta: 1100, volumen: 0.08 }); tono(1100, 0.12, 0.2, { tipo: 'triangle', hasta: 600, volumen: 0.07 }); },
      clac: () => { ruido(0.04, { freq: 2000, q: 2, volumen: 0.3 }); tono(160, 0, 0.1, { tipo: 'square', volumen: 0.05 }); },
      whoosh: () => ruido(0.5, { freq: 1200, q: 0.4, volumen: 0.08 }),
      brillo: () => [1760, 2349, 2637].forEach((f, i) => tono(f, i * 0.06, 0.25, { tipo: 'sine', volumen: 0.04 })),
      melodia: () => {
        const penta = [523, 587, 659, 784, 880, 1047, 1175];
        let k = Math.floor(Math.random() * 4);
        for (let i = 0; i < 6; i++) {
          k = Math.max(0, Math.min(penta.length - 1, k + azar([-2, -1, 1, 1, 2])));
          tono(penta[k], i * 0.16, i === 5 ? 0.6 : 0.3, { tipo: 'triangle', volumen: 0.09 });
        }
      },
      villancico: () => [659, 659, 659, 0, 659, 659, 659, 0, 659, 784, 523, 587, 659].forEach((f, i) => f && tono(f, i * 0.13, 0.16, { tipo: 'triangle', volumen: 0.07 })),
      burbujeo: () => { for (let i = 0; i < 5; i++) tono(200 + Math.random() * 200, i * 0.12, 0.08, { hasta: 600, volumen: 0.05 }); }
    };
    this.reacciones = this.crearReacciones();
  }

  pos(m, extra = 0.15) {
    return this.ctx.pantalla(m.position.x, m.userData.base + (m.userData.alto || 0.5) + extra, m.position.z);
  }

  p(m, emoji, n = 2) {
    const p = this.pos(m);
    this.ctx.ui.particula(emoji, p.x, p.y, n);
  }

  txt(m, texto) {
    const p = this.pos(m, 0.35);
    this.ctx.ui.bocadillo(texto, p.x, p.y);
  }

  anim(m, tipo, dur = 0.8, op = {}) {
    if (this.ctx.gestor.tieneEncima(m) && tipo !== 'luz') tipo = 'nada';
    this.parar(m);
    this.anims.set(m, { m, tipo, t: 0, dur, op, ry: m.rotation.y, x: m.position.x, z: m.position.z });
  }

  parar(m) {
    const a = this.anims.get(m);
    if (!a) return;
    this.anims.delete(m);
    this.restaurar(a);
  }

  restaurar(a) {
    const m = a.m;
    m.rotation.y = a.ry;
    m.position.x = a.x;
    m.position.z = a.z;
    if (!(m.userData.datos && m.userData.datos.tirado)) {
      m.rotation.z = 0;
      m.position.y = m.userData.base;
    }
    m.scale.set(1, 1, 1);
  }

  parpadear(m, veces, final) {
    const { gestor } = this.ctx;
    if (!m.userData.def.encendible) return;
    const inicial = !!m.userData.encendido;
    for (let i = 0; i < veces * 2; i++) {
      setTimeout(() => {
        if (!gestor.muebles.includes(m)) return;
        gestor.alternarEncendido(m);
        if (i % 2 === 0) this.s.clic();
      }, i * 85);
    }
    setTimeout(() => {
      if (!gestor.muebles.includes(m)) return;
      const quiero = final === undefined ? !inicial : final;
      if (!!m.userData.encendido !== quiero) gestor.alternarEncendido(m);
      this.ctx.guardar();
    }, veces * 2 * 85 + 40);
  }

  crearReacciones() {
    const s = this.s;
    const lampara = (emoji, frases) => [
      m => { this.parpadear(m, 2); this.anim(m, 'latido', 0.6); setTimeout(() => this.p(m, m.userData.encendido ? emoji : '🌑', 1), 420); },
      m => { this.parpadear(m, 4, !!m.userData.encendido); this.txt(m, azar(frases)); }
    ];
    const blando = (emojis, frases) => [
      m => { this.anim(m, 'aplastar', 0.9); s.blando(); this.p(m, azar(emojis), 2); },
      m => { this.anim(m, 'aplastar', 0.9); s.boing(); this.txt(m, azar(frases)); }
    ];
    const planta = (emoji, frases) => [
      m => { this.anim(m, 'meneo', 1.1); s.paginas(); this.p(m, emoji, 3); },
      m => { this.anim(m, 'meneo', 1.1); this.txt(m, azar(frases)); this.p(m, emoji, 1); }
    ];
    return {
      colchon: blando(['💤', '🛌'], ['Mmm, blandito…', 'Cinco minutitos más…']),
      cama: [
        m => { this.anim(m, 'aplastar', 1); s.bostezo(); this.p(m, '💤', 3); },
        m => { this.anim(m, 'aplastar', 1); s.boing(); this.txt(m, azar(['¡Nada de saltar en la cama!', 'Huele a sábanas limpias'])); },
        m => { this.anim(m, 'salto', 0.7, { h: 0.12 }); s.boing(); this.p(m, '🪶', 4); this.txt(m, '¡Guerra de almohadas!'); }
      ],
      silla: [
        m => { this.anim(m, 'meneo', 0.8); s.cruje(); },
        m => { this.anim(m, 'temblor', 0.5); s.cruje(); this.txt(m, 'Ñiiic…'); }
      ],
      mesita: [m => { this.anim(m, 'latido', 0.4); s.toc(); this.txt(m, 'Toc, toc'); }],
      mesa: [
        m => { this.anim(m, 'latido', 0.4); s.toc(); this.p(m, '🍽️', 1); },
        m => { s.toc(); this.txt(m, azar(['¡A comer!', '¿Qué hay de cena?'])); }
      ],
      escritorio: [
        m => { s.teclas(); this.p(m, azar(['📎', '✏️', '📝']), 2); },
        m => { s.paginas(); this.txt(m, azar(['Mucho papeleo…', 'Hay que ordenar esto'])); }
      ],
      comoda: [
        m => { this.anim(m, 'temblor', 0.5); s.toc(); this.p(m, '🧦', 1); this.txt(m, '¡Un calcetín perdido!'); },
        m => { this.anim(m, 'temblor', 0.5); s.toc(); this.p(m, azar(['👕', '🧣', '🩲']), 1); }
      ],
      estanteria: [
        m => { this.anim(m, 'temblor', 0.4); s.paginas(); this.p(m, '📚', 2); },
        m => { s.toc(); this.txt(m, azar(['Uy, polvo…', '¿Y si leemos algo?'])); this.p(m, '💨', 1); }
      ],
      libros: [
        m => { this.anim(m, 'salto', 0.5, { h: 0.08 }); s.paginas(); this.p(m, '📖', 2); },
        m => { s.paginas(); this.txt(m, azar(['Érase una vez…', 'Este tiene buena pinta'])); }
      ],
      tele: [m => {
        this.ctx.gestor.alternarEncendido(m);
        if (m.userData.encendido) {
          s.encender();
          this.p(m, azar(['📺', '🎬', '🦸']), 1);
          if (this.ctx.mascotasMirar) this.ctx.mascotasMirar(m);
        } else {
          s.apagar();
        }
        this.ctx.guardar();
      }],
      nevera: [
        m => { this.anim(m, 'temblor', 0.6); s.zumbido(); this.p(m, '❄️', 3); },
        m => { s.zumbido(); this.p(m, azar(['🧃', '🧀', '🍉', '🍦', '🥛']), 1); this.txt(m, azar(['¡Fresquito!', '¿Algo de picar?'])); }
      ],
      cocina: [
        m => { s.chisporroteo(); this.p(m, '🔥', 2); setTimeout(() => this.p(m, '💨', 2), 500); },
        m => { s.chisporroteo(); this.p(m, azar(['🍳', '🥞', '🍝']), 1); this.txt(m, '¡Qué bien huele!'); }
      ],
      lavadora: [
        m => { this.anim(m, 'temblor', 1.6, { fuerza: 0.035 }); s.motor(); this.p(m, '🫧', 4); },
        m => { this.anim(m, 'temblor', 1.2, { fuerza: 0.03 }); s.motor(); this.txt(m, 'Centrifugando…'); this.p(m, '🫧', 2); }
      ],
      chimenea: [
        m => { this.parpadear(m, 1); s.chisporroteo(); setTimeout(() => this.p(m, m.userData.encendido ? '🔥' : '💨', 2), 250); },
        m => { s.chisporroteo(); this.p(m, '✨', 3); this.txt(m, 'Crac, crac…'); }
      ],
      sofa: blando(['💤', '🛋️', '😌'], ['Aquí se está de lujo', '¿Peli y manta?']),
      puff: blando(['😌', '💨'], ['¡Pfffff!', 'Blandiiito']),
      'puff-corazon': blando(['💗', '💕'], ['¡Achuchable!', 'Blandiiito']),
      'cojin-corazon': blando(['💗', '💞'], ['¡Abrazo!']),
      tumbona: blando(['😎', '☀️'], ['Modo vacaciones', 'A tomar el sol']),
      'sillon-huevo': [
        m => { this.anim(m, 'giro', 1.2, { vueltas: 1 }); s.whoosh(); this.p(m, '🌀', 1); },
        m => { this.anim(m, 'meneo', 1); s.cruje(); this.txt(m, 'Qué gustito'); }
      ],
      caja: [
        m => { this.anim(m, 'salto', 0.6, { h: 0.12 }); s.toc(); this.p(m, azar(['🧸', '🧶', '🕸️', '🎞️', '🧦']), 1); this.txt(m, '¿Qué habrá dentro?'); },
        m => { this.anim(m, 'temblor', 0.5); s.toc(); this.p(m, '💨', 2); }
      ],
      cactus: [
        m => { this.anim(m, 'temblor', 0.4); s.ay(); this.txt(m, '¡Ay! ¡Que pincha!'); },
        m => { this.anim(m, 'meneo', 0.8); this.p(m, '🌵', 2); s.pio(); }
      ],
      jarron: [m => { this.anim(m, 'latido', 0.7); s.brillo(); this.p(m, '🌷', 3); }],
      planta: planta('🍃', ['¡Más agua, por favor!', 'Hoy hace buen día']),
      'maceta-grande': planta('🌿', ['¡Crezco, crezco!']),
      cerezo: [
        m => { this.anim(m, 'meneo', 1.3); s.campanitas(); this.p(m, '🌸', 5); },
        m => { this.anim(m, 'meneo', 1); this.txt(m, 'Hanami en casa'); this.p(m, '🌸', 2); }
      ],
      rosas: [m => { this.anim(m, 'latido', 0.8); s.brillo(); this.p(m, azar(['🌹', '💕']), 3); }],
      radio: [m => { this.ctx.usos.alternarMusica(m); this.anim(m, 'latido', 0.6); this.p(m, this.ctx.usos.musica ? '🎵' : '🔇', 2); }],
      'lampara-mesa': lampara('💡', ['¡Hágase la luz!', 'Clic, clic']),
      lampara: lampara('💡', ['¡Hágase la luz!', 'Se va la luz… ¡no, era broma!']),
      'lampara-lava': [
        m => { this.parpadear(m, 1); s.glup(); this.p(m, '🫧', 3); },
        m => { this.anim(m, 'latido', 1); s.glup(); this.txt(m, 'Bloop… bloop…'); }
      ],
      'lampara-corazon': lampara('💖', ['Luz de amor', 'Pa-pum, pa-pum']),
      farola: lampara('💡', ['Ilumina la noche', 'Bzzzz…']),
      calabaza: [
        m => { this.parpadear(m, 3); s.fantasma(); this.p(m, '🦇', 2); },
        m => { this.anim(m, 'salto', 0.5, { h: 0.1 }); s.fantasma(); this.txt(m, '¡Truco o trato!'); this.p(m, '🍬', 2); }
      ],
      espejo: [
        m => { s.brillo(); this.p(m, '✨', 3); this.txt(m, azar(['¡Qué guapos estáis hoy!', 'Espejito, espejito…'])); },
        m => { s.brillo(); this.p(m, '😘', 1); }
      ],
      alfombra: [
        m => { this.anim(m, 'latido', 0.5); s.blando(); this.p(m, '✨', 2); },
        m => { s.blando(); this.txt(m, 'Mullidita'); }
      ],
      pelota: [m => {
        this.anim(m, 'salto', 0.8, { h: 0.35, botes: 2 });
        s.boing();
        setTimeout(() => s.boing(), 420);
        m.userData.empuje = { dir: Math.random() * PI * 2, v: 1.4 };
        this.p(m, '🎾', 1);
        if (this.ctx.llamarMascota) this.ctx.llamarMascota(m, 'pelota');
      }],
      comedero: [m => { s.glup(); this.p(m, '🦴', 2); this.anim(m, 'temblor', 0.4); if (this.ctx.llamarMascota) this.ctx.llamarMascota(m, 'comida'); }],
      'cama-mascota': blando(['🐾', '💤'], ['Calentita', 'Huele a mascota']),
      rascador: [m => { this.anim(m, 'temblor', 0.6); s.aranazo(); this.p(m, '🐾', 2); }],
      caseta: [
        m => { this.anim(m, 'temblor', 0.4); s.ladrido(); this.txt(m, '¡Guau!'); },
        m => { s.toc(); this.p(m, '🦴', 1); this.txt(m, '¿Hay alguien?'); }
      ],
      robot: [
        m => { this.anim(m, 'giro', 1.4, { vueltas: 2 }); s.zum(); this.p(m, '✨', 2); },
        m => { this.anim(m, 'temblor', 0.6); s.pitido(); this.txt(m, 'Bip bup. Aspirando…'); }
      ],
      arenero: [m => { this.anim(m, 'temblor', 0.4); s.aranazo(); this.p(m, '🐾', 1); this.txt(m, '¡Recién cambiado!'); }],
      trampa: [m => { this.anim(m, 'salto', 0.3, { h: 0.06 }); s.clac(); this.txt(m, '¡Clac!'); }],
      peluche: [
        m => { this.anim(m, 'salto', 0.6, { h: 0.15 }); s.pio(); this.p(m, '💕', 2); },
        m => { this.anim(m, 'aplastar', 0.7); s.pio(); this.txt(m, '¡Achuchón!'); }
      ],
      globo: [
        m => { this.anim(m, 'flotar', 2, { h: 0.18 }); s.pio(); this.p(m, '🎈', 1); },
        m => { this.anim(m, 'balanceo', 1.6); s.cruje(); this.txt(m, '¡Que no se escape!'); }
      ],
      acuario: [
        m => { s.burbujeo(); this.p(m, '🫧', 4); },
        m => { s.glup(); this.p(m, '🐠', 1); this.txt(m, azar(['Glu, glu', '¡Hola, pececitos!'])); }
      ],
      arcade: [
        m => { s.ochoBits(); this.parpadear(m, 2, true); this.p(m, azar(['👾', '🕹️', '⭐']), 2); },
        m => { s.ochoBits(); this.txt(m, azar(['¡Récord nuevo!', 'INSERT COIN', 'GAME OVER'])); }
      ],
      piano: [m => { s.melodia(); this.p(m, '🎵', 2); setTimeout(() => this.p(m, '🎶', 2), 450); }],
      ordenador: [
        m => { s.teclas(); this.p(m, '💻', 1); },
        m => { s.pitido(); this.txt(m, azar(['Bip bup', 'Tienes 0 correos nuevos', 'Actualizando…'])); }
      ],
      huerto: [m => { this.anim(m, 'meneo', 0.8); s.paginas(); this.p(m, azar(['🌱', '🐛', '🐞']), 1); }],
      'arbol-recuerdos': [m => { this.anim(m, 'meneo', 1.2); s.campanitas(); this.p(m, azar(['💌', '🍃', '💕']), 3); }],
      'mapa-mundi': [m => { s.whoosh(); this.p(m, '✈️', 1); this.txt(m, azar(['¿A dónde vamos?', 'Próximo destino…'])); }],
      barbacoa: [
        m => { s.chisporroteo(); this.p(m, '🔥', 2); setTimeout(() => this.p(m, '💨', 2), 500); },
        m => { s.chisporroteo(); this.p(m, azar(['🌭', '🍗', '🌽']), 1); this.txt(m, '¡A la brasa!'); }
      ],
      sombrilla: [m => { this.anim(m, 'giro', 1.5, { vueltas: 1 }); s.whoosh(); this.p(m, '☀️', 1); }],
      columpio: [m => { this.anim(m, 'balanceo', 2.8, { fuerza: 0.22, vel: 4 }); s.cruje(); setTimeout(() => s.cruje(), 900); this.p(m, '🎶', 1); }],
      'piscina-hinchable': [m => { this.anim(m, 'latido', 0.6); s.chapoteo(); this.p(m, '💦', 4); }],
      piscina: [m => { s.chapoteo(); this.p(m, '💦', 4); this.txt(m, azar(['¡Al agua!', '¡Splash!'])); }],
      fuente: [m => { s.chapoteo(); this.p(m, '💧', 3); this.txt(m, '¡Pide un deseo!'); this.p(m, '🪙', 1); }],
      'mesa-picnic': [m => { s.toc(); this.p(m, '🧺', 1); this.txt(m, '¡Día de picnic!'); }],
      'arbol-navidad': [
        m => { this.parpadear(m, 4, true); s.villancico(); this.p(m, '✨', 3); },
        m => { this.anim(m, 'temblor', 0.4); s.campanitas(); this.p(m, '🎄', 1); this.txt(m, '¡Feliz Navidad!'); }
      ],
      'muneco-nieve': [m => { this.anim(m, 'temblor', 0.5); s.pio(); this.p(m, '❄️', 3); this.txt(m, '¡Brrr!'); }],
      regalos: [m => { this.anim(m, 'salto', 0.6, { h: 0.12 }); s.brillo(); this.p(m, '🎁', 1); this.txt(m, '¡No se abre hasta el día!'); }],
      fantasma: [
        m => { this.anim(m, 'flotar', 2, { h: 0.2 }); s.fantasma(); this.txt(m, '¡Buuuu!'); },
        m => { this.anim(m, 'giro', 1, { vueltas: 1 }); s.fantasma(); this.p(m, '👻', 2); }
      ],
      caldero: [m => { s.burbujeo(); this.parpadear(m, 1, true); this.p(m, azar(['🧪', '🫧', '🐸']), 2); this.txt(m, 'Abracadabra…'); }]
    };
  }

  tocar(m) {
    const d = m.userData;
    if (d.datos && d.datos.tirado) {
      d.datos.tirado = false;
      d.rebote = 0.8;
      this.ctx.sonido.arreglo();
      this.p(m, '🙌', 1);
      this.ctx.guardar();
      return;
    }
    d.toques = (d.toques || 0) + 1;
    const lista = this.reacciones[d.def.id];
    if (lista) {
      lista[(d.toques - 1) % lista.length](m);
    } else {
      this.anim(m, azar(['salto', 'meneo', 'latido']), 0.6, { h: 0.1 });
      this.s.boing();
      this.p(m, '✨', 2);
    }
  }

  tocarMascota(m) {
    const { mascotas, sonido } = this.ctx;
    const e = m.e;
    const agudo = 1 + (1 - Math.min(1, e.tam || 0.6)) * 0.6;
    const voz = () => {
      sonido.tono(700 * agudo, 0, 0.09, { hasta: 1000 * agudo, volumen: 0.09 });
      sonido.tono(900 * agudo, 0.11, 0.1, { hasta: 1250 * agudo, volumen: 0.07 });
    };
    if (m.estado === 'dormir') {
      m.toquesSueno = (m.toquesSueno || 0) + 1;
      if (m.toquesSueno >= 3) {
        m.toquesSueno = 0;
        mascotas.accion(m, 'bostezo', 1.8);
        this.s.bostezo();
        this.ctx.particulaMascota('😪', m);
      } else {
        sonido.tono(160, 0, 0.5, { tipo: 'triangle', hasta: 120, volumen: 0.05 });
        this.ctx.particulaMascota('💤', m);
      }
      return;
    }
    if (m.estado === 'sofa' || m.estado === 'truco') {
      voz();
      this.ctx.particulaMascota('💗', m);
      return;
    }
    const cuadrupedo = !e.ave && !e.tortuga;
    const opciones = [
      ['saltito', 1.1, '❗'],
      ['vueltas', 1.6, '✨'],
      ['feliz', 1.4, '💕']
    ];
    if (e.perro || e.gato || e.hocico === 'zorro' || e.dragon) opciones.push(['cola', 1.6, '💗']);
    if (e.ave || e.dragon) opciones.push(['aletear', 1.4, e.dragon ? '🔥' : '🪶']);
    if (cuadrupedo) opciones.push(['saludo', 1.6, '👋'], ['estirarse', 1.6, '😌']);
    if (e.tortuga) opciones.push(['mirar', 1.4, '❔']);
    m.ultimaReaccion = ((m.ultimaReaccion ?? -1) + 1 + Math.floor(Math.random() * (opciones.length - 1))) % opciones.length;
    const [estado, dur, emoji] = opciones[m.ultimaReaccion];
    mascotas.accion(m, estado, dur, { objetivoMirar: null, mirarA: 0 });
    m.felicidad = Math.min(100, (m.felicidad || 0) + 2);
    voz();
    this.ctx.particulaMascota(emoji, m);
  }

  actualizar(dt) {
    this.t += dt;
    for (const a of [...this.anims.values()]) {
      const m = a.m;
      if (!this.ctx.gestor.muebles.includes(m)) {
        this.anims.delete(m);
        continue;
      }
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      const fin = 1 - k;
      const base = m.userData.base;
      const op = a.op;
      switch (a.tipo) {
        case 'salto': {
          const botes = op.botes || 1;
          const kb = (k * botes) % 1;
          const h = (op.h || 0.12) * Math.sin(kb * PI) * (1 - Math.floor(k * botes) / (botes + 0.5));
          const aplasta = kb < 0.15 || kb > 0.9 ? 0.1 : -0.05;
          m.position.y = base + h;
          m.scale.set(1 + aplasta * 0.5, 1 - aplasta, 1 + aplasta * 0.5);
          break;
        }
        case 'meneo':
          m.rotation.y = a.ry + Math.sin(a.t * 16) * 0.16 * fin;
          break;
        case 'temblor': {
          const f = (op.fuerza || 0.02) * (k < 0.85 ? 1 : fin / 0.15);
          m.position.x = a.x + (Math.random() - 0.5) * f;
          m.position.z = a.z + (Math.random() - 0.5) * f;
          break;
        }
        case 'giro':
          m.rotation.y = a.ry + suave(k) * PI * 2 * (op.vueltas || 1);
          break;
        case 'latido': {
          const s = 1 + Math.sin(k * PI * 3) * 0.07 * fin;
          m.scale.set(s, s, s);
          break;
        }
        case 'aplastar': {
          const s = Math.sin(k * PI * 2) * 0.12 * fin;
          m.scale.set(1 + s * 0.5, 1 - s, 1 + s * 0.5);
          break;
        }
        case 'balanceo':
          m.rotation.z = Math.sin(a.t * (op.vel || 6)) * (op.fuerza || 0.14) * fin;
          m.position.y = base;
          break;
        case 'flotar':
          m.position.y = base + Math.sin(k * PI) * (op.h || 0.15) + Math.sin(a.t * 6) * 0.02 * fin;
          break;
        default:
          break;
      }
      if (k >= 1) {
        this.anims.delete(m);
        this.restaurar(a);
      }
    }
  }
}
