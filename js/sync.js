const URL_BASE = 'https://lekqmspkizhxsceyswzu.supabase.co/rest/v1';
const CLAVE = 'sb_publishable_voSDxyUttxgPjrF0l0MG7w_7XCPV2Dr';
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function cabeceras(extra = {}) {
  return { apikey: CLAVE, Authorization: `Bearer ${CLAVE}`, 'Content-Type': 'application/json', ...extra };
}

async function pedir(ruta, opciones = {}) {
  const r = await fetch(`${URL_BASE}/${ruta}`, { ...opciones, headers: cabeceras(opciones.headers) });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

function leerLocal(clave, defecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? defecto;
  } catch (e) {
    return defecto;
  }
}

export class Sync {
  constructor(eventos) {
    this.ev = eventos;
    this.conf = leerLocal('hogar-sync', null);
    this.dispositivo = localStorage.getItem('hogar-dispositivo');
    if (!this.dispositivo) {
      this.dispositivo = Math.random().toString(36).slice(2, 12);
      localStorage.setItem('hogar-dispositivo', this.dispositivo);
    }
    this.version = this.conf ? this.conf.version || 0 : 0;
    this.pendiente = false;
    this.enviando = false;
    this.ultimoMensaje = this.conf ? this.conf.ultimoMensaje || new Date(Date.now() - 86400000).toISOString() : null;
    this.ultimaRemota = 0;
    this.error = false;
    this.tPoll = 0;
    this.tEnvio = 0;
  }

  get activo() {
    return !!this.conf;
  }

  get codigo() {
    return this.conf && this.conf.codigo;
  }

  get yo() {
    return this.conf ? this.conf.yo : 0;
  }

  guardarConf() {
    if (this.conf) {
      this.conf.version = this.version;
      this.conf.ultimoMensaje = this.ultimoMensaje;
    }
    localStorage.setItem('hogar-sync', JSON.stringify(this.conf));
  }

  async crear(datos, yo) {
    let codigo = '';
    for (let i = 0; i < 6; i++) codigo += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    await pedir('hogares', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ id: codigo, datos, version: 1, autor: this.dispositivo })
    });
    this.conf = { codigo, yo };
    this.version = 1;
    this.ultimoMensaje = new Date().toISOString();
    this.guardarConf();
    return codigo;
  }

  async unirse(codigo, yo) {
    codigo = codigo.trim().toUpperCase();
    const filas = await pedir(`hogares?id=eq.${encodeURIComponent(codigo)}&select=datos,version`);
    if (!filas || !filas.length) return null;
    this.conf = { codigo, yo };
    this.version = filas[0].version;
    this.ultimoMensaje = new Date(Date.now() - 3 * 86400000).toISOString();
    this.guardarConf();
    return filas[0].datos;
  }

  salir() {
    this.conf = null;
    localStorage.removeItem('hogar-sync');
  }

  marcarCambio() {
    if (!this.activo || this.aplicando) return;
    this.pendiente = true;
    this.tEnvio = 0;
  }

  async enviar() {
    if (!this.activo || this.enviando || !this.pendiente) return;
    this.enviando = true;
    this.pendiente = false;
    const datos = this.ev.instantanea();
    try {
      const nueva = this.version + 1;
      const filas = await pedir(`hogares?id=eq.${this.codigo}&version=eq.${this.version}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ datos, version: nueva, autor: this.dispositivo, actualizado: new Date().toISOString() })
      });
      if (filas && filas.length) {
        this.version = nueva;
        this.guardarConf();
      } else {
        await this.traer(true);
        this.pendiente = true;
      }
      this.error = false;
    } catch (e) {
      this.error = true;
      this.pendiente = true;
    }
    this.enviando = false;
  }

  async traer(conflicto = false) {
    if (!this.activo) return;
    try {
      const filas = await pedir(`hogares?id=eq.${this.codigo}&version=gt.${this.version}&select=datos,version,autor,actualizado`);
      if (filas && filas.length) {
        const f = filas[0];
        if (f.autor !== this.dispositivo) {
          this.aplicando = true;
          try {
            this.ev.aplicar(f.datos, conflicto);
          } finally {
            this.aplicando = false;
          }
          this.ultimaRemota = Date.now();
        }
        this.version = f.version;
        this.guardarConf();
      }
      this.error = false;
    } catch (e) {
      this.error = true;
    }
  }

  async mensajesNuevos() {
    if (!this.activo) return;
    try {
      const filas = await pedir(`mensajes?hogar=eq.${this.codigo}&creado=gt.${encodeURIComponent(this.ultimoMensaje)}&order=creado.asc&limit=30`);
      for (const m of filas || []) {
        this.ultimoMensaje = m.creado;
        if (m.de === this.dispositivo) continue;
        this.ev.mensaje(m);
      }
      if (filas && filas.length) this.guardarConf();
    } catch (e) {
      this.error = true;
    }
  }

  async mandar(tipo, datos) {
    if (!this.activo) return false;
    try {
      await pedir('mensajes', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ hogar: this.codigo, tipo, de: this.dispositivo, datos })
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async subirFoto(foto) {
    if (!this.activo) return;
    try {
      await pedir('fotos', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id: foto.id, hogar: this.codigo, data: foto.data })
      });
    } catch (e) {}
  }

  async borrarFoto(id) {
    if (!this.activo) return;
    try {
      await pedir(`fotos?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}
  }

  async listaFotos(conocidas) {
    if (!this.activo) return null;
    try {
      const ids = await pedir(`fotos?hogar=eq.${this.codigo}&select=id`);
      const faltan = ids.map(f => f.id).filter(id => !conocidas.includes(id));
      const nuevas = [];
      for (const id of faltan.slice(0, 6)) {
        const f = await pedir(`fotos?id=eq.${encodeURIComponent(id)}&select=id,data,creado`);
        if (f && f[0]) nuevas.push({ id: f[0].id, data: f[0].data, fecha: Date.parse(f[0].creado) });
      }
      return { todas: ids.map(f => f.id), nuevas };
    } catch (e) {
      return null;
    }
  }

  actualizar(dt) {
    if (!this.activo) return;
    this.tPoll += dt;
    this.tEnvio += dt;
    if (this.pendiente && this.tEnvio > 1.2) this.enviar();
    if (this.tPoll > (document.hidden ? 20 : 3)) {
      this.tPoll = 0;
      if (!this.enviando) this.traer();
      this.mensajesNuevos();
    }
  }
}
