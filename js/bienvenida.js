const ACTIVIDAD = {
  regar: ['💧', 'ha regado las plantas'],
  banar: ['🛁', 'ha bañado a una mascota'],
  comer: ['🍖', 'ha dado de comer a las mascotas'],
  mimos: ['💕', 'ha hecho mimos a las mascotas'],
  jugar: ['🎾', 'ha jugado con las mascotas'],
  pasear: ['🌳', 'ha sacado de paseo a una mascota'],
  limpiar: ['🧽', 'ha limpiado la casa'],
  'limpiar-caca': ['💩', 'ha recogido una caca'],
  cocinar: ['🍳', 'ha cocinado'],
  trabajar: ['💼', 'ha ido a trabajar'],
  encargo: ['🤝', 'ha hecho un favor a un vecino'],
  reformar: ['🔨', 'ha hecho una reforma'],
  obra: ['🏗️', 'ha hecho una obra en el piso'],
  'colgar-cuadro': ['🖼️', 'ha colgado un cuadro'],
  cosechar: ['🍅', 'ha cosechado el huerto'],
  visita: ['🚪', 'ha atendido a una visita'],
  peces: ['🐟', 'ha dado de comer a los peces'],
  pedido: ['📦', 'ha hecho un pedido'],
  duo: ['🎮', 'ha jugado contigo a dúo'],
  tender: ['👕', 'ha tendido la ropa'],
  averia: ['🔧', 'ha arreglado una avería']
};

const CLAVE_VISTO = 'hogar-actividad-vista';

export function anotarActividad(estado, yo, evento) {
  const a = ACTIVIDAD[evento];
  if (!a || yo === null || yo === undefined) return;
  if (!estado.actividad) estado.actividad = [];
  const ultimo = estado.actividad[estado.actividad.length - 1];
  if (ultimo && ultimo.de === yo && ultimo.e === evento && Date.now() - ultimo.t < 30 * 60000) {
    ultimo.n = (ultimo.n || 1) + 1;
    ultimo.t = Date.now();
    return;
  }
  estado.actividad.push({ de: yo, e: evento, t: Date.now(), n: 1 });
  if (estado.actividad.length > 60) estado.actividad.splice(0, estado.actividad.length - 60);
}

export function actividadNueva(estado, yo) {
  let visto = 0;
  try { visto = Number(localStorage.getItem(CLAVE_VISTO)) || 0; } catch (e) {}
  return (estado.actividad || []).filter(a => a.de !== yo && a.t > visto);
}

export function marcarActividadVista() {
  try { localStorage.setItem(CLAVE_VISTO, String(Date.now())); } catch (e) {}
}

export function textoActividad(a, nombre) {
  const [icono, texto] = ACTIVIDAD[a.e] || ['✨', 'ha hecho algo'];
  return { icono, texto: `${nombre} ${texto}${a.n > 1 ? ` (×${a.n})` : ''}` };
}

function saludo() {
  const h = new Date().getHours();
  if (h >= 6 && h < 14) return '¡Buenos días!';
  if (h >= 14 && h < 21) return '¡Buenas tardes!';
  return '¡Buenas noches!';
}

function hace(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `hace ${Math.max(1, m)} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export function mostrarBienvenida(ui, d) {
  const secciones = [];
  if (d.fecha) {
    secciones.push(`<div class="bv-tarjeta bv-fecha"><span>${d.fecha.icono}</span><div><b>${d.fecha.titulo}</b><small>${d.fecha.texto}</small></div></div>`);
  }
  if (d.postal) {
    secciones.push(`<div class="bv-postal"><img src="${d.postal.data}" alt=""><button class="bv-album">🖼️ Al álbum</button></div>`);
  }
  if (d.racha) {
    secciones.push(`<div class="bv-tarjeta bv-racha"><div class="bv-cab"><b>🔥 ${d.racha.titulo}</b><em>${d.racha.premio}</em></div>${d.racha.html}</div>`);
  }
  const extras = [];
  if (d.vuelta) extras.push(`<li>🏡 ${d.vuelta}</li>`);
  if (d.rachaPareja) extras.push(`<li>💑 ${d.rachaPareja}</li>`);
  if (extras.length) secciones.push(`<ul class="bv-lista">${extras.join('')}</ul>`);
  if (d.pareja && d.pareja.length) {
    secciones.push(`<div class="bv-tarjeta"><b class="bv-sub">Mientras no estabas</b><ul class="bv-lista">${d.pareja.slice(-6).reverse().map(x => `<li>${x.icono} ${x.texto} <small>${hace(x.t)}</small></li>`).join('')}</ul></div>`);
  }
  if (d.pendientes && d.pendientes.length) {
    secciones.push(`<div class="bv-tarjeta"><b class="bv-sub">La casa os necesita</b><div class="bv-chips">${d.pendientes.map(p => `<span>${p}</span>`).join('')}</div></div>`);
  }
  if (!secciones.length) return false;
  const { caja } = ui.dialogo({
    titulo: `${saludo()}${d.nombre ? ` ${d.nombre}` : ''}`,
    etiqueta: d.etiqueta || null,
    html: `<div class="bv">${secciones.join('')}</div>`,
    botones: [
      ...(d.fecha && d.fecha.boton ? [{ texto: d.fecha.boton.texto, tipo: 'secundario', accion: d.fecha.boton.accion }] : []),
      { texto: '🏠 ¡A casa!', tipo: 'primario' }
    ],
    confeti: !!d.confeti
  });
  const b = caja.querySelector('.bv-album');
  if (b && d.postal && d.postal.alAlbum) b.addEventListener('click', () => {
    d.postal.alAlbum();
    b.textContent = '✅ Guardada';
    b.disabled = true;
  });
  return true;
}

const PASOS_TARDE = [
  {
    icono: '👋',
    titulo: n => `¡Bienvenido/a a casa${n.yo ? `, ${n.yo}` : ''}!`,
    html: (n, d) => `<p>${n.otro.charAt(0).toUpperCase() + n.otro.slice(1)} lleva ${d.dias === 1 ? 'ya un día' : `${d.dias} días`} cuidando de este piso. Esto es lo que ya tenéis:</p>
      <div class="bv-chips gt-chips">${d.chips.map(c => `<span>${c}</span>`).join('')}</div>`
  },
  {
    icono: '👆',
    titulo: () => 'Aquí no hay muñecos: sois vosotros',
    html: n => `<ul class="gt-lista">
      <li><b>Toca</b> un mueble para usarlo (regar, cocinar, encender…).</li>
      <li><b>Mantén pulsado y arrastra</b> para moverlo de sitio.</li>
      <li><b>Toca las mascotas</b> para darles de comer, jugar o bañarlas.</li>
      <li>Todo lo que hagas lo ve ${n.otro} al momento.</li></ul>`
  },
  {
    icono: '🪙',
    titulo: () => 'Cómo se avanza',
    html: () => `<ul class="gt-lista">
      <li><b>💼 Trabajar</b>: minijuegos para ganar monedas.</li>
      <li><b>📋 Misiones</b>: tareas del día con premio.</li>
      <li><b>🛒 Tienda</b>: muebles, comida y cosas para la casa.</li>
      <li><b>✨ Más → Objetivos → 🏡</b>: la casa de vuestros sueños, la meta de los dos.</li></ul>`
  },
  {
    icono: '💕',
    titulo: () => 'Y sobre todo, juntos',
    html: n => `<ul class="gt-lista">
      <li><b>✨ Más → Jugar juntos</b>: minijuegos a dúo, cada uno con su móvil.</li>
      <li><b>💕 Nosotros</b>: notas, regalos, preguntas y el libro de recuerdos.</li>
      <li>El <b>💗</b> de arriba le manda un beso a ${n.otro}.</li></ul>`
  }
];

export function mostrarGuiaTarde(ui, n, d, alTerminar) {
  n = { ...n, otro: n.otro || 'tu pareja' };
  let k = 0;
  const paso = () => {
    const p = PASOS_TARDE[k];
    const ultimo = k === PASOS_TARDE.length - 1;
    ui.dialogo({
      titulo: `${p.icono} ${p.titulo(n)}`,
      etiqueta: { texto: `${k + 1} / ${PASOS_TARDE.length}`, color: '#c98a2b' },
      html: `<div class="guia-tarde">${p.html(n, d)}</div>`,
      confeti: k === 0,
      botones: ultimo
        ? [{ texto: '¡A por ello!', tipo: 'primario', accion: () => alTerminar && alTerminar() }]
        : [{ texto: 'Siguiente', tipo: 'primario', accion: () => { k++; setTimeout(paso, 280); } }]
    });
  };
  paso();
}
