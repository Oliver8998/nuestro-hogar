const CLAVE = 'hogar-guia';

const PASOS = [
  { boton: 'btn-tienda', texto: 'Empezad por la tienda: comprad algo para arreglar el piso (un insecticida para las cucarachas, por ejemplo).', avanza: ['pedido'] },
  { boton: null, texto: 'El pedido llega en furgoneta. Cuando veáis el paquete flotando en la puerta, tocadlo para abrirlo.', avanza: ['paquete'] },
  { boton: 'btn-inventario', texto: 'Lo que compráis va al inventario. Arrastradlo hasta lo que está roto o sucio, o a donde queráis ponerlo.', avanza: ['colocar', 'limpiar', 'arreglar'] },
  { boton: 'btn-misiones', texto: 'Las misiones os dicen qué hacer y dan monedas. ¡Echadles un ojo!', avanza: ['clic:btn-misiones'] },
  { boton: 'btn-mas', texto: 'En Más tenéis el trabajo del día para ganar monedas, y muchas cosas que se irán desbloqueando.', avanza: ['clic:btn-mas'] }
];

export class Guia {
  constructor(ctx) {
    this.ctx = ctx;
    this.paso = this.leer();
    this.caja = null;
    this.flecha = null;
    for (const p of PASOS) {
      for (const a of p.avanza) {
        if (!a.startsWith('clic:')) continue;
        const b = document.getElementById(a.slice(5));
        if (b) b.addEventListener('click', () => this.evento(a));
      }
    }
    window.addEventListener('resize', () => this.colocarFlecha());
  }

  leer() {
    try {
      const v = localStorage.getItem(CLAVE);
      return v === null ? null : Number(v);
    } catch (e) {
      return null;
    }
  }

  escribir(n) {
    this.paso = n;
    try {
      localStorage.setItem(CLAVE, String(n));
    } catch (e) {}
  }

  empezar(veterano) {
    if (this.paso === null) this.escribir(veterano ? PASOS.length : 0);
    this.pintar();
  }

  activa() {
    return this.paso !== null && this.paso < PASOS.length;
  }

  evento(e) {
    if (!this.activa()) return;
    if (!PASOS[this.paso].avanza.includes(e)) return;
    this.escribir(this.paso + 1);
    if (this.ctx.sonido) this.ctx.sonido.pop();
    if (!this.activa()) {
      this.quitar();
      this.ctx.ui.aviso('🎉 ¡Ya sabéis lo básico! A disfrutar de vuestra casa');
      return;
    }
    setTimeout(() => this.pintar(), 700);
  }

  saltar() {
    this.escribir(PASOS.length);
    this.quitar();
  }

  quitar() {
    if (this.caja) this.caja.remove();
    if (this.flecha) this.flecha.remove();
    this.caja = null;
    this.flecha = null;
  }

  pintar() {
    this.quitar();
    if (!this.activa()) return;
    const p = PASOS[this.paso];
    const caja = document.createElement('div');
    caja.className = 'guia-caja';
    caja.innerHTML = `<img src="${this.ctx.cara || ''}" alt=""><div><small>Pilar · ${this.paso + 1}/${PASOS.length}</small><p>${p.texto}</p><button class="enlace">Saltar la guía</button></div>`;
    if (!this.ctx.cara) caja.querySelector('img').remove();
    caja.querySelector('button').addEventListener('click', () => this.saltar());
    document.body.appendChild(caja);
    this.caja = caja;
    if (p.boton) {
      const f = document.createElement('div');
      f.className = 'guia-flecha';
      f.textContent = '👇';
      document.body.appendChild(f);
      this.flecha = f;
      this.colocarFlecha();
    }
  }

  colocarFlecha() {
    if (!this.flecha || !this.activa()) return;
    const b = document.getElementById(PASOS[this.paso].boton);
    if (!b) return;
    const r = b.getBoundingClientRect();
    const oculto = !r.width || b.offsetParent === null;
    this.flecha.style.display = oculto ? 'none' : '';
    this.flecha.style.left = `${r.left + r.width / 2}px`;
    this.flecha.style.top = `${r.top - 8}px`;
  }

  ocultarSi(si) {
    if (this.caja) this.caja.style.display = si ? 'none' : '';
    if (this.flecha) this.flecha.style.display = si ? 'none' : '';
    if (!si) this.colocarFlecha();
  }
}
