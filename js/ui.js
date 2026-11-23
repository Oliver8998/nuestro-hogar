export class UI {
  constructor(catalogo, reparaciones, eventos) {
    this.elMonedas = document.getElementById('monedas-valor');
    this.elContador = document.getElementById('contador');
    this.elAcciones = document.getElementById('acciones');
    this.elCatalogo = document.getElementById('catalogo');
    this.elLista = document.getElementById('lista-reparar');
    this.elAviso = document.getElementById('aviso');
    this.elProgreso = document.getElementById('progreso');
    this.elProgresoTexto = this.elProgreso.querySelector('.texto');
    this.elProgresoRelleno = this.elProgreso.querySelector('.relleno');
    this.btnModo = document.getElementById('btn-modo');
    this.botones = [];
    this.tAviso = null;
    this.tProgreso = null;
    this.modoActual = 'decorar';

    for (const def of catalogo.filter(d => d.enTienda !== false)) {
      const b = document.createElement('button');
      b.className = 'item';
      b.innerHTML = `<span class="icono">${def.icono}</span>${def.nombre}<br><span class="precio">🪙 ${def.precio}</span>`;
      b.addEventListener('click', () => eventos.alComprar(def));
      this.elCatalogo.appendChild(b);
      this.botones.push({ b, def });
    }

    this.chips = reparaciones.map(r => {
      const c = document.createElement('div');
      c.className = 'item';
      this.elLista.appendChild(c);
      return { c, r };
    });

    this.btnModo.addEventListener('click', () => eventos.alCambiarModo(this.modoActual === 'decorar' ? 'reparar' : 'decorar'));
    document.getElementById('btn-rotar').addEventListener('click', () => eventos.alRotar());
    document.getElementById('btn-vender').addEventListener('click', () => eventos.alVender());

    this.actualizarReparaciones();
  }

  monedas(n) {
    this.elMonedas.textContent = n;
    for (const { b, def } of this.botones) b.disabled = def.precio > n;
  }

  modo(m) {
    this.modoActual = m;
    this.btnModo.textContent = m === 'decorar' ? '🔨 Reparar' : '🛋️ Decorar';
    this.elCatalogo.classList.toggle('oculto', m !== 'decorar');
    this.elLista.classList.toggle('oculto', m !== 'reparar');
    if (m === 'reparar') this.acciones(false);
  }

  actualizarReparaciones() {
    let hechas = 0;
    const ordenados = [...this.chips].sort((a, b) => a.r.hecha - b.r.hecha);
    for (const { c, r } of ordenados) {
      if (r.hecha) hechas++;
      c.classList.toggle('hecha', r.hecha);
      const precio = r.hecha ? 'hecho' : r.coste ? `🪙 ${r.coste}` : 'gratis';
      c.innerHTML = `<span class="icono">${r.hecha ? '✅' : r.icono}</span>${r.nombre}<br><span class="precio">${precio}</span>`;
      this.elLista.appendChild(c);
    }
    this.elContador.textContent = `${hechas}/${this.chips.length}`;
  }

  progreso(rep, x, y) {
    clearTimeout(this.tProgreso);
    this.elProgreso.classList.remove('oculto');
    this.elProgreso.style.left = `${x}px`;
    this.elProgreso.style.top = `${Math.max(10, y - 80)}px`;
    this.elProgresoTexto.textContent = rep.coste ? `${rep.pista} · 🪙 ${rep.coste}` : rep.pista;
    this.elProgresoRelleno.style.width = `${Math.round(rep.progreso * 100)}%`;
  }

  finProgreso() {
    clearTimeout(this.tProgreso);
    this.tProgreso = setTimeout(() => this.elProgreso.classList.add('oculto'), 500);
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
