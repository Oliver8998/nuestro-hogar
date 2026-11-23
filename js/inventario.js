export class Inventario {
  constructor() {
    this.items = [];
  }

  buscar(id, color) {
    return this.items.find(i => i.id === id && i.color === color);
  }

  anadir(id, color = null, cantidad = 1) {
    let item = this.buscar(id, color);
    if (!item) {
      item = { id, color, cantidad: 0 };
      this.items.push(item);
    }
    item.cantidad += cantidad;
  }

  quitar(id, color = null) {
    const item = this.buscar(id, color);
    if (!item) return false;
    item.cantidad--;
    if (item.cantidad <= 0) this.items = this.items.filter(i => i !== item);
    return true;
  }

  usar(id, color = null, maxUsos = 1) {
    const item = this.buscar(id, color);
    if (!item) return false;
    if (maxUsos <= 1) return this.quitar(id, color);
    if (item.usos === undefined || item.usos === null) item.usos = maxUsos;
    item.usos--;
    if (item.usos <= 0) {
      item.usos = null;
      this.quitar(id, color);
    }
    return true;
  }

  cantidad(id) {
    return this.items.filter(i => i.id === id).reduce((s, i) => s + i.cantidad, 0);
  }

  serializar() {
    return this.items.map(i => ({ ...i }));
  }

  cargar(lista) {
    this.items = (lista || []).filter(i => i.cantidad > 0).map(i => ({ id: i.id, color: i.color ?? null, cantidad: i.cantidad, usos: i.usos ?? null }));
  }
}
