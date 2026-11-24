import * as THREE from 'three';
import { GestorMuebles } from './muebles.js';
import { GestorMascotas } from './mascotas.js';
import { SUELOS, PAPELES } from './casa2.js';
import { periodoSolar } from './sol.js';

const SALAS = [
  {
    icono: '🛋️', nombre: 'Salón acogedor', suelo: 'roble', papel: 'rayas', cortina: 0xf2b8c4,
    muebles: [['alfombra', -3, -3, 0, 0], ['sofa', -3, -6, 0, 0], ['lampara', -6, -4, 0], ['estanteria', 3, -6, 0, 0], ['libros', 3, -6, 0], ['globo', 4, -6, 0], ['planta', -6, -6, 0], ['tele', -6, -2, 1, 0], ['mesita', -1, -2, 0, 1], ['jarron', -1, -2, 0], ['puff', 2, -1, 0, 1], ['cama-mascota', 2, 2, 0, 0], ['pelota', 0, 3, 0], ['planta', 5, 4, 0], ['cojin-corazon', -5, 2, 0], ['radio', 5, 0, 0]],
    mascotas: [['gato', 0.2, -0.9], ['perro', 1.6, 0.8]]
  },
  {
    icono: '🛏️', nombre: 'Dormitorio romántico', suelo: 'blanca', papel: 'corazones', cortina: 0xf3eee4, luz: 0xffb0c8,
    muebles: [['alfombra', -2, -2, 0, 0], ['cama', -2, -6, 0, 0], ['mesita', -3, -6, 0, 1], ['lampara-mesa', -3, -6, 0], ['mesita', 1, -6, 0, 1], ['rosas', 1, -6, 0], ['comoda', 3, -6, 0, 0], ['peluche', 3, -6, 0], ['lampara-corazon', 4, -6, 0], ['puff-corazon', 2, 0, 0], ['espejo', -6, -1, 1], ['planta', -6, -6, 0], ['cama-mascota', 3, 3, 0, 1], ['cojin-corazon', -5, 2, 0], ['lampara', -6, 4, 0, 1]],
    mascotas: [['conejo', 0.4, 1.3], ['gato', -1.4, 1.8]]
  },
  {
    icono: '🍳', nombre: 'Cocina', suelo: 'ajedrez', papel: 'vichy', cortina: 0xd9a63a,
    muebles: [['nevera', -6, -6, 0, 1], ['cocina', -4, -6, 0, 0], ['lavadora', -2, -6, 0, 2], ['huerto', 2, -6, 0], ['planta', 4, -6, 0], ['mesa', 0, -1, 0, 1], ['lampara-mesa', 1, -1, 0], ['silla', -1, -1, 1, 1], ['silla', 2, 0, 3, 1], ['radio', 0, -1, 0], ['lampara', 5, -3, 0, 4], ['comedero', 3, 3, 0], ['planta', -6, 3, 0], ['robot', -3, 2, 0], ['cactus', 5, 4, 0]],
    mascotas: [['conejo', -1.2, 1.4], ['pato', 1.8, 1.6], ['cerdito', 0.2, 2.2]]
  },
  {
    icono: '🎮', nombre: 'Rincón gamer', suelo: 'ceniza', papel: 'estrellas', led: 0xa070ff,
    muebles: [['alfombra', -2, -2, 0, 1], ['arcade', -6, -6, 0], ['escritorio', -2, -6, 0, 2], ['ordenador', -2, -6, 0], ['silla', -1, -4, 2, 2], ['comoda', 2, -6, 0, 2], ['lampara-lava', 2, -6, 0], ['peluche', 3, -6, 0], ['puff', 2, -1, 0, 3], ['tele', -6, -2, 1, 0], ['cactus', 5, -6, 0], ['puff-corazon', 3, 2, 0], ['pelota', 0, 3, 0], ['planta', 5, 5, 0], ['rascador', -5, 3, 0], ['lampara', -6, 1, 0, 3]],
    mascotas: [['gato', 0.6, 0.4], ['panda', -1.6, 1.4]]
  },
  {
    icono: '🌳', nombre: 'Jardín', exterior: true,
    muebles: [['piscina-hinchable', 0, -5, 0, 0], ['tumbona', -5, -5, 0, 0], ['tumbona', -4, -5, 0, 1], ['sombrilla', -3, -6, 0, 0], ['mesa-picnic', -5, 0, 0], ['barbacoa', 3, -6, 0], ['cerezo', -2, 3, 0], ['maceta-grande', 4, 2, 0], ['maceta-grande', -6, 4, 0], ['farola', 5, -6, 0], ['farola', -6, -2, 0], ['farola', 2, 4, 0], ['fuente', 4, -1, 0], ['huerto', -1, 5, 0]],
    mascotas: [['perro', 1.4, 1.6], ['pato', -1.5, 0.3], ['koala', 2.2, 1.7], ['zorro', 0.4, -0.6]]
  },
  {
    icono: '🏰', nombre: 'Salón de la mansión', suelo: 'marmol', papel: 'flores', cortina: 0x8a2b3a,
    muebles: [['alfombra', -1, -4, 0, 3], ['chimenea', -1, -6, 0, 0], ['lampara', -3, -6, 0, 2], ['piano', -6, -2, 1], ['sillon-huevo', 2, -3, 0, 0], ['acuario', 3, -6, 0], ['planta', 5, -6, 0], ['lampara', 5, 0, 0, 2], ['globo', -1, -6, 0], ['sofa', -3, 3, 2, 3], ['mesita', -1, 1, 0, 1], ['lampara-mesa', -1, 1, 0], ['jarron', 4, 4, 0], ['rosas', 5, 4, 0], ['cama-mascota', 2, 2, 0, 2]],
    mascotas: [['zorro', 0.4, 0.4], ['pinguino', 2, 1.6], ['loro', -2.2, 0.2]]
  },
  {
    icono: '🎄', nombre: 'Navidad en casa', suelo: 'nogal', papel: 'ladrillo', cortina: 0x8a2b3a, luz: 0xffc27a,
    muebles: [['alfombra', -3, -3, 0, 0], ['arbol-navidad', -6, -6, 0], ['regalos', -4, -6, 0], ['regalos', -6, -4, 0], ['sofa', -2, -6, 0, 3], ['muneco-nieve', 3, -6, 0], ['lampara', 2, -6, 0], ['planta', 4, -6, 0], ['cojin-corazon', 0, -2, 0], ['mesita', 4, 1, 0, 1], ['lampara-corazon', 4, 1, 0], ['cama-mascota', 1, 2, 0, 0], ['puff', -1, 3, 0, 0], ['estanteria', -6, 1, 1, 0], ['libros', -6, 1, 0]],
    mascotas: [['perro', 0.2, -0.3], ['gato', -1.6, 1], ['conejo', 1.2, 1.4]]
  }
];

function texturaPatron(item, rx, ry) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  item.dibujar(c.getContext('2d'), 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function periodo() {
  const forz = new URLSearchParams(location.search).get('hora');
  if (forz === null) return periodoSolar();
  const h = Number(forz);
  if (h >= 21 || h < 6) return 'noche';
  if (h >= 18 || h < 8) return 'tarde';
  return 'dia';
}

const LUZ = {
  dia: { hemi: [0xfff4e6, 1.5], sol: [0xfff0dd, 1.7], cristal: [0xa9d4e8, 0x8fc3dd], interior: 0, led: 0.6 },
  tarde: { hemi: [0xffd9c0, 1.05], sol: [0xffa766, 1.5], cristal: [0xf4a28c, 0xd9785a], interior: 1.2, led: 1.4 },
  noche: { hemi: [0xa8b0e0, 1.0], sol: [0xaab4ff, 0.5], cristal: [0x2c2d63, 0x1a1b40], interior: 3.6, led: 2.6 }
};

export class Escaparate {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    contenedor.appendChild(this.renderer.domElement);
    this.escena = new THREE.Scene();
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7560, 1.5);
    this.escena.add(this.hemi);
    this.sol = new THREE.DirectionalLight(0xfff0dd, 1.7);
    this.sol.position.set(6, 10, 4);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sol.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 });
    this.sol.shadow.bias = -0.0005;
    this.sol.shadow.normalBias = 0.02;
    this.escena.add(this.sol);
    this.luzSala = new THREE.PointLight(0xffffff, 0, 10, 1.4);
    this.luzSala.position.set(0, 2.4, 0);
    this.escena.add(this.luzSala);
    this.indice = Math.floor(Math.random() * SALAS.length);
    this.t = 0;
    this.tSala = 0;
    this.fase = 'entra';
    this.k = 0;
    this.reloj = new THREE.Clock();
    this.alCambiar = null;
    this.construir(SALAS[this.indice]);
    this.medir();
    this.alRedimensionar = () => this.medir();
    window.addEventListener('resize', this.alRedimensionar);
    this.renderer.setAnimationLoop(() => this.paso());
  }

  medir() {
    const w = this.contenedor.clientWidth || 300;
    const h = this.contenedor.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    const alto = 8.2;
    const ancho = alto * w / h;
    const a = Math.max(ancho, 10.4);
    const b = a * h / w;
    Object.assign(this.camara, { left: -a / 2, right: a / 2, top: b / 2, bottom: -b / 2 });
    this.camara.updateProjectionMatrix();
  }

  limpiar() {
    if (!this.grupo) return;
    if (this.mas) for (const m of [...this.mas.lista]) this.mas.quitar(m);
    for (const m of [...this.gestor.muebles]) this.gestor.quitar(m);
    this.escena.remove(this.grupo);
    this.grupo.traverse(o => {
      if (o.geometry && !o.geometry.userData.compartida) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.grupo = null;
  }

  construir(s) {
    this.limpiar();
    this.sala = s;
    const per = periodo();
    const L = LUZ[per];
    const encender = per !== 'dia';
    const g = new THREE.Group();
    this.grupo = g;
    this.escena.add(g);
    const caja = (w, h, d, color, x, y, z, op = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: op.rug ?? 0.9, ...(op.map ? { map: op.map } : {}) }));
      m.position.set(x, y, z);
      m.castShadow = !op.sinSombra;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };
    caja(6.5, 0.4, 6.5, s.exterior ? 0x8a6a4a : 0xb9a48c, 0, -0.25, 0, { sinSombra: true });
    const suelo = s.suelo && SUELOS.find(x => x.id === s.suelo);
    const matSuelo = { sinSombra: true };
    if (suelo) matSuelo.map = texturaPatron(suelo, 6, 6);
    const pisoColor = s.exterior ? 0x8fc46a : suelo && suelo.tonos ? suelo.tonos[0] : 0xffffff;
    const piso = caja(6, 0.1, 6, pisoColor, 0, -0.05, 0, matSuelo);
    void piso;
    if (s.exterior) {
      const madera = 0xfffaf2;
      for (let k = 0; k <= 12; k++) {
        caja(0.08, 0.7, 0.08, madera, -3 + k * 0.5, 0.35, -3, {});
        caja(0.08, 0.7, 0.08, madera, -3, 0.35, -3 + k * 0.5, {});
      }
      caja(6, 0.06, 0.04, madera, 0, 0.5, -3, {});
      caja(6, 0.06, 0.04, madera, 0, 0.25, -3, {});
      caja(0.04, 0.06, 6, madera, -3, 0.5, 0, {});
      caja(0.04, 0.06, 6, madera, -3, 0.25, 0, {});
    } else {
      const papel = s.papel && PAPELES.find(x => x.id === s.papel);
      const mapa = papel ? texturaPatron(papel, 6, 2.6) : null;
      const pared = (x, z, ry) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, map: mapa }));
        m.position.set(x, 1.3, z);
        m.rotation.y = ry;
        m.receiveShadow = true;
        g.add(m);
        return m;
      };
      pared(0, -3, 0);
      pared(-3, 0, Math.PI / 2);
      caja(6.15, 2.6, 0.15, 0xe9dfd2, 0, 1.3, -3.08, { sinSombra: true });
      caja(0.15, 2.6, 6.15, 0xe9dfd2, -3.08, 1.3, 0, { sinSombra: true });
      caja(6, 0.12, 0.04, 0xf7f1e8, 0, 0.06, -2.98, {});
      caja(0.04, 0.12, 6, 0xf7f1e8, -2.98, 0.06, 0, {});
      const v = new THREE.Group();
      v.position.set(1, 1.55, -2.97);
      g.add(v);
      const marco = 0xfffaf2;
      for (const [w, h, x, y] of [[1.2, 0.08, 0, 0.62], [1.2, 0.08, 0, -0.62], [0.08, 1.3, -0.6, 0], [0.08, 1.3, 0.6, 0], [0.05, 1.2, 0, 0]]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), new THREE.MeshStandardMaterial({ color: marco, roughness: 0.6 }));
        p.position.set(x, y, 0.02);
        v.add(p);
      }
      const cristal = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.2), new THREE.MeshStandardMaterial({ color: L.cristal[0], emissive: L.cristal[1], emissiveIntensity: 0.5 }));
      cristal.position.z = 0.005;
      v.add(cristal);
      if (s.cortina) {
        for (const lado of [-1, 1]) {
          const geo = new THREE.PlaneGeometry(0.4, 1.55, 14, 1);
          const pos = geo.attributes.position;
          for (let k = 0; k < pos.count; k++) pos.setZ(k, Math.sin((pos.getX(k) + 0.2) * Math.PI * 7) * 0.025);
          geo.computeVertexNormals();
          const tela = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: s.cortina, roughness: 0.9, side: THREE.DoubleSide }));
          tela.position.set(lado * 0.76, -0.02, 0.08);
          tela.castShadow = true;
          v.add(tela);
        }
      }
      if (s.led) {
        for (const [w, d, x, z] of [[6, 0.03, 0, -2.95], [0.03, 6, -2.95, 0]]) {
          const tira = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, d), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: s.led, emissiveIntensity: L.led }));
          tira.position.set(x, 2.56, z);
          g.add(tira);
        }
      }
    }
    this.gestor = new GestorMuebles(g);
    if (this.gestor.rejilla) this.gestor.rejilla.visible = false;
    s.muebles.forEach(([id, x0, z0, rot, color, encendido], k) => {
      const m = this.gestor.anadir(id, x0, z0, rot, { color: color ?? 0, encendido: encendido ?? (encender ? true : false) });
      if (m) {
        m.visible = false;
        m.userData.aparece = 0.15 + k * 0.07;
      }
    });
    this.mas = new GestorMascotas(g, this.gestor, { particula: () => {} });
    this.mas.trastadas = false;
    const personalidades = ['juguetona', 'carinosa', 'traviesa', 'juguetona'];
    this.mascotas = s.mascotas.map(([esp, x, z], k) => {
      const m = this.mas.crear({ id: `esc${k}`, especie: esp, nombre: '', x, z, hambre: 90, felicidad: 95, energia: 90, nacida: Date.now() - 10 * 86400000, personalidad: personalidades[k % 4] });
      m.angulo = Math.atan2(4 - x, 4 - z) + (Math.random() - 0.5) * 0.8;
      m.objetivoAngulo = m.angulo;
      m.tEstado = 0.4 + k * 0.5 + Math.random() * 0.5;
      m.grupo.visible = false;
      m.grupo.userData.aparece = 0.35 + k * 0.15;
      return m;
    });
    this.hemi.color.setHex(L.hemi[0]);
    this.hemi.intensity = L.hemi[1];
    this.sol.color.setHex(L.sol[0]);
    this.sol.intensity = L.sol[1];
    this.sol.position.set(per === 'tarde' ? 9 : 6, per === 'tarde' ? 4 : 10, 4);
    this.luzSala.color.setHex(s.luz || s.led || 0xffd9a0);
    this.luzSala.intensity = s.exterior ? 0 : s.luz || s.led ? Math.max(L.led, L.interior) : L.interior;
    this.tSala = 0;
    this.fase = 'entra';
    if (this.alCambiar) this.alCambiar(s, this.indice, SALAS.length);
  }

  siguiente() {
    this.indice = (this.indice + 1) % SALAS.length;
    this.construir(SALAS[this.indice]);
  }

  paso() {
    const dt = Math.min(0.05, this.reloj.getDelta());
    this.t += dt;
    this.tSala += dt;
    const DUR = 7.5;
    if (this.fase === 'entra') {
      this.k = Math.min(1, this.tSala / 0.6);
      if (this.k >= 1) this.fase = 'quieta';
    } else if (this.fase === 'quieta' && this.tSala > DUR) {
      this.fase = 'sale';
      this.tSale = 0;
    } else if (this.fase === 'sale') {
      this.tSale += dt;
      this.k = Math.max(0, 1 - this.tSale / 0.35);
      if (this.k <= 0) this.siguiente();
    }
    const c1 = 1.70158;
    const q = this.k - 1;
    const e = this.fase === 'entra' ? 1 + (c1 + 1) * q * q * q + c1 * q * q : this.k;
    const escala = this.fase === 'sale' ? Math.max(0.001, this.k * this.k) : Math.max(0.001, e);
    this.grupo.scale.setScalar(escala);
    this.grupo.rotation.y = this.fase === 'sale' ? (1 - this.k) * 0.8 : 0;
    for (const m of this.gestor.muebles) {
      if (!m.visible && this.tSala > m.userData.aparece) {
        m.visible = true;
        m.userData.rebote = 0.8;
      }
    }
    this.gestor.actualizar(dt);
    for (const m of this.mascotas) {
      if (!m.grupo.visible && this.tSala > m.grupo.userData.aparece) m.grupo.visible = true;
    }
    if (this.mas) this.mas.actualizar(dt);
    const ang = Math.PI / 4 + Math.sin(this.t * 0.25) * 0.35;
    const d = 14;
    this.camara.position.set(Math.sin(ang) * d, 9.2, Math.cos(ang) * d);
    this.camara.lookAt(0, 0.55, 0);
    this.renderer.render(this.escena, this.camara);
  }

  destruir() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.alRedimensionar);
    this.limpiar();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
