import * as THREE from 'three';

let texturaExcl = null;

function texturaExclamacion() {
  if (texturaExcl) return texturaExcl;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath(); g.arc(64, 70, 54, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(64, 62, 56, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffb320';
  g.beginPath(); g.arc(64, 62, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff';
  g.font = '900 74px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('!', 64, 66);
  texturaExcl = new THREE.CanvasTexture(c);
  texturaExcl.colorSpace = THREE.SRGBColorSpace;
  return texturaExcl;
}

export function crearExclamacion(tam = 0.34) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaExclamacion(), depthTest: false, transparent: true }));
  s.scale.setScalar(tam);
  s.renderOrder = 20;
  s.userData.exclamacion = true;
  return s;
}

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });

function modeloTelefono() {
  const raiz = new THREE.Group();
  const madera = mat(0x8a5a3b, { roughness: 0.75 });
  const carcasa = mat(0xe4675f, { roughness: 0.4 });
  const crema = mat(0xf6ecd8, { roughness: 0.5 });
  const oscuro = mat(0x3a2b26, { roughness: 0.6 });
  const metal = mat(0xd9c38a, { roughness: 0.3, metalness: 0.6 });

  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.025), madera);
  placa.position.set(0, 0, 0.0125);
  raiz.add(placa);
  for (const y of [-0.17, 0.17]) {
    const tornillo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 10), metal);
    tornillo.rotation.x = Math.PI / 2;
    tornillo.position.set(0, y, 0.028);
    raiz.add(tornillo);
  }

  const cuerpo = new THREE.Group();
  cuerpo.position.set(0.02, -0.01, 0.025);
  raiz.add(cuerpo);
  const caja = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.07), carcasa);
  caja.position.z = 0.035;
  caja.castShadow = true;
  cuerpo.add(caja);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 20, 1, false, 0, Math.PI), carcasa);
  tapa.rotation.z = Math.PI / 2;
  tapa.rotation.y = Math.PI / 2;
  tapa.scale.set(1, 1, 0.35);
  tapa.position.set(0, 0.125, 0.035);
  cuerpo.add(tapa);

  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.072, 0.014, 24), crema);
  disco.rotation.x = Math.PI / 2;
  disco.position.set(0, -0.02, 0.075);
  cuerpo.add(disco);
  const centro = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.006, 16), carcasa);
  centro.rotation.x = Math.PI / 2;
  centro.position.set(0, -0.02, 0.084);
  cuerpo.add(centro);
  const agujero = new THREE.CylinderGeometry(0.009, 0.009, 0.004, 10);
  for (let i = 0; i < 10; i++) {
    const a = Math.PI * 0.35 + (i / 10) * Math.PI * 1.65;
    const h = new THREE.Mesh(agujero, oscuro);
    h.rotation.x = Math.PI / 2;
    h.position.set(Math.cos(a) * 0.049, -0.02 + Math.sin(a) * 0.049, 0.083);
    cuerpo.add(h);
  }
  const campanilla = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal);
  campanilla.rotation.x = Math.PI / 2;
  campanilla.position.set(0, 0.085, 0.07);
  cuerpo.add(campanilla);

  const horquilla = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), oscuro);
  horquilla.position.set(-0.112, 0.07, 0.04);
  cuerpo.add(horquilla);
  const horquilla2 = horquilla.clone();
  horquilla2.position.y = -0.09;
  cuerpo.add(horquilla2);

  const auricular = new THREE.Group();
  auricular.position.set(-0.13, -0.01, 0.075);
  cuerpo.add(auricular);
  const mango = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.17, 6, 12), carcasa);
  mango.castShadow = true;
  auricular.add(mango);
  for (const y of [0.11, -0.11]) {
    const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.05, 16), carcasa);
    copa.rotation.x = Math.PI / 2;
    copa.position.set(0, y, 0.018);
    copa.castShadow = true;
    auricular.add(copa);
    const rejilla = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.004, 14), oscuro);
    rejilla.rotation.x = Math.PI / 2;
    rejilla.position.set(0, y, 0.044);
    auricular.add(rejilla);
  }

  const puntos = [];
  const vueltas = 9;
  for (let i = 0; i <= 160; i++) {
    const k = i / 160;
    const a = k * vueltas * Math.PI * 2;
    const y = -0.13 - k * 0.11 + Math.sin(k * Math.PI) * -0.05;
    const x = -0.13 + k * 0.13;
    puntos.push(new THREE.Vector3(x + Math.cos(a) * 0.011, y, 0.05 + Math.sin(a) * 0.011));
  }
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 320, 0.0035, 6), oscuro);
  cuerpo.add(cable);

  return { raiz, cuerpo, auricular, campanilla };
}

export class Telefono {
  constructor(escena, sala) {
    this.escena = escena;
    this.sala = sala;
    const m = modeloTelefono();
    this.grupo = new THREE.Group();
    m.raiz.scale.setScalar(1.6);
    this.grupo.add(m.raiz);
    this.cuerpo = m.cuerpo;
    this.auricular = m.auricular;
    this.reposoAuricular = m.auricular.position.clone();
    this.zona = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    this.zona.position.z = 0.15;
    this.grupo.add(this.zona);
    this.excl = crearExclamacion(0.42);
    this.excl.position.set(0, 0.6, 0.2);
    this.excl.visible = false;
    this.grupo.add(this.excl);

    this.poste = new THREE.Group();
    const madera = mat(0x8a5a3b, { roughness: 0.8 });
    const palo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 0.12), madera);
    palo.position.y = 0.75;
    palo.castShadow = true;
    const tejado = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.16, 4), mat(0xb5524a));
    tejado.rotation.y = Math.PI / 4;
    tejado.position.set(0, 1.72, 0.1);
    this.poste.add(palo, tejado);
    this.poste.position.set(-2.55, 0, -2.55);
    this.poste.rotation.y = Math.PI / 4;
    this.poste.visible = false;
    escena.add(this.poste);

    this.sitio = null;
    this.activo = true;
    this.pendiente = false;
    this.t = 0;
    this.descolgado = 0;
    this.colocar();
  }

  fijar(pared, x, y) {
    this.fijo = { pared, x, y };
    this.sitio = null;
    this.colocar();
  }

  colocar() {
    if (this.sala.esExterior()) {
      if (this.sitio !== 'poste') {
        this.poste.add(this.grupo);
        this.grupo.position.set(0, 1.1, 0.06);
        this.grupo.rotation.set(0, 0, 0);
        this.sitio = 'poste';
      }
      this.poste.visible = this.activo;
      return;
    }
    this.poste.visible = false;
    const f = this.fijo || { pared: 0, x: -2.45, y: 1.3 };
    if (this.sitio === f) return;
    this.sala.paredes[f.pared].add(this.grupo);
    this.grupo.position.set(f.x, f.y, this.sala.cara);
    this.grupo.rotation.set(0, 0, 0);
    this.sitio = f;
  }

  marcar(pendiente) {
    this.pendiente = pendiente;
  }

  visible() {
    if (!this.activo) return false;
    for (let o = this.grupo; o; o = o.parent) if (!o.visible) return false;
    return !!this.grupo.parent;
  }

  distancia(rayo) {
    if (!this.visible()) return Infinity;
    const h = rayo.intersectObject(this.zona, false);
    return h.length ? h[0].distance : Infinity;
  }

  tocar(rayo) {
    if (this.distancia(rayo) === Infinity) return false;
    this.descolgado = 1.4;
    return true;
  }

  posicionPantalla() {
    const v = new THREE.Vector3();
    this.cuerpo.getWorldPosition(v);
    return v;
  }

  actualizar(dt) {
    this.t += dt;
    this.colocar();
    this.grupo.visible = this.activo;
    this.excl.visible = this.pendiente && this.descolgado <= 0;
    if (this.excl.visible) {
      const k = (Math.sin(this.t * 4) + 1) / 2;
      this.excl.position.y = 0.58 + k * 0.06;
      this.excl.scale.setScalar(0.4 + k * 0.04);
    }
    const ciclo = this.t % 3.2;
    const sonando = this.pendiente && this.descolgado <= 0 && ciclo < 0.7;
    this.cuerpo.rotation.z = sonando ? Math.sin(this.t * 55) * 0.05 : this.cuerpo.rotation.z * 0.8;
    if (this.descolgado > 0) {
      this.descolgado -= dt;
      const k = Math.min(1, Math.sin(Math.min(1, (1.4 - this.descolgado) / 1.4) * Math.PI) * 1.6);
      this.auricular.position.set(this.reposoAuricular.x - k * 0.05, this.reposoAuricular.y + k * 0.12, this.reposoAuricular.z + k * 0.1);
      this.auricular.rotation.z = k * 0.5;
    } else {
      this.auricular.position.copy(this.reposoAuricular);
      this.auricular.rotation.z = 0;
    }
  }
}
