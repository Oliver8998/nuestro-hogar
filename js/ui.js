export class UI {
  constructor(catalogo, eventos) {
    this.elMonedas = document.getElementById('monedas-valor');
    this.elAcciones = document.getElementById('acciones');
    this.elCatalogo = document.getElementById('catalogo');
    this.elAviso = document.getElementById('aviso');
    this.botones = [];
    this.tAviso = null;

    for (const def of catalogo.filter(d => d.enTienda !== false)) {
      const b = document.createElement('button');
      b.className = 'item';
      b.innerHTML = `<span class="icono">${def.icono}</span>${def.nombre}<br><span class="precio">🪙 ${def.precio}</span>`;
      b.addEventListener('click', () => eventos.alComprar(def));
      this.elCatalogo.appendChild(b);
      this.botones.push({ b, def });
    }

    document.getElementById('btn-rotar').addEventListener('click', () => eventos.alRotar());
    document.getElementById('btn-vender').addEventListener('click', () => eventos.alVender());
  }

  monedas(n) {
    this.elMonedas.textContent = n;
    for (const { b, def } of this.botones) b.disabled = def.precio > n;
  }

  acciones(visible) {
    this.elAcciones.classList.toggle('oculto', !visible);
  }

  aviso(texto) {
    this.elAviso.textContent = texto;
    this.elAviso.classList.add('visible');
    clearTimeout(this.tAviso);
    this.tAviso = setTimeout(() => this.elAviso.classList.remove('visible'), 1800);
  }
}
