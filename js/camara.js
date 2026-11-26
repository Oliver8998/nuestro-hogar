import * as THREE from 'three';

const LIMITE_PAN = 2.5;
const ANGULO_INICIAL = Math.PI / 4;
export const ZOOM_INICIAL = 1.2;

export class CamaraIso {
  constructor(aspecto) {
    this.tamano = 10;
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 4, 44);
    this.camara.layers.enable(1);
    this.altura = THREE.MathUtils.degToRad(44);
    this.distancia = 20;
    this.zoomMin = 0.5;
    this.zoomMax = 3;
    this.angulo = ANGULO_INICIAL;
    this.anguloObj = ANGULO_INICIAL;
    this.zoomActual = ZOOM_INICIAL;
    this.zoomObj = ZOOM_INICIAL;
    this.objetivo = new THREE.Vector3(0, 1.0, 0);
    this.objetivoObj = new THREE.Vector3(0, 1.0, 0);
    this.inercia = 0;
    this.agarrada = false;
    this.anchoVista = this.tamano;
    this.limX = LIMITE_PAN;
    this.limZ = LIMITE_PAN;
    this.salaW = 6;
    this.salaD = 6;
    this.margenArriba = 0;
    this.margenAbajo = 0;
    this.altoPx = window.innerHeight || 760;
    this.zoomFit = ZOOM_INICIAL;
    this.centroY = 0;
    this.redimensionar(aspecto);
    this.zoomActual = this.zoomObj = this.zoomFit;
    this.aplicar();
  }

  ajustar(ancho, fondo) {
    this.salaW = ancho;
    this.salaD = fondo;
    this.tamano = 10 * Math.max(1, (ancho + fondo) / 12);
    this.limX = LIMITE_PAN + Math.max(0, ancho - 6) / 2;
    this.limZ = LIMITE_PAN + Math.max(0, fondo - 6) / 2;
    if (this.aspecto) this.redimensionar(this.aspecto);
  }

  redimensionar(aspecto) {
    this.aspecto = aspecto;
    const ancho = aspecto < 1 ? this.tamano : this.tamano * aspecto;
    const alto = ancho / aspecto;
    this.anchoVista = ancho;
    this.camara.left = -ancho / 2;
    this.camara.right = ancho / 2;
    this.altoVista = alto;
    this.camara.top = alto / 2;
    this.camara.bottom = -alto / 2;
    this.camara.updateProjectionMatrix();
    this.encajar();
  }

  ponerMargenes(arriba, abajo, altoPx) {
    if (Math.abs(arriba - this.margenArriba) < 2 && Math.abs(abajo - this.margenAbajo) < 2 && Math.abs(altoPx - this.altoPx) < 2) return;
    this.margenArriba = arriba;
    this.margenAbajo = abajo;
    this.altoPx = altoPx;
    this.encajar();
  }

  encajar() {
    if (!this.altoVista) return;
    const G = 0.2;
    const sa = Math.sin(this.altura);
    const ca = Math.cos(this.altura);
    const a = ANGULO_INICIAL;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [-0.45, 2.75]) {
      const px = x * (this.salaW / 2 + G);
      const pz = z * (this.salaD / 2 + G);
      const sx = px * Math.cos(a) - pz * Math.sin(a);
      const sy = (y - 1.0) * ca - (px * Math.sin(a) + pz * Math.cos(a)) * sa;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const libre = Math.max(0.3, (this.altoPx - this.margenArriba - this.margenAbajo) / this.altoPx);
    const antes = this.zoomFit;
    this.zoomFit = Math.min(this.anchoVista * 0.97 / (x1 - x0), this.altoVista * libre * 0.95 / (y1 - y0));
    this.centroCaja = (y0 + y1) / 2;
    this.zoomMin = this.zoomFit * 0.5;
    this.zoomMax = this.zoomFit * 3.2;
    if (antes && Math.abs(this.zoomObj - antes) < 0.02) this.zoomObj = this.zoomFit;
    else this.zoomObj = THREE.MathUtils.clamp(this.zoomObj, this.zoomMin, this.zoomMax);
  }

  ampliada() {
    return this.zoomObj > this.zoomFit * 1.25;
  }

  acercarA(punto) {
    this.zoomObj = this.zoomFit * 2;
    this.objetivoObj.set(
      THREE.MathUtils.clamp(punto.x, -this.limX, this.limX),
      1.0,
      THREE.MathUtils.clamp(punto.z, -this.limZ, this.limZ)
    );
  }

  agarrar() {
    this.agarrada = true;
    this.inercia = 0;
  }

  soltar(conInercia) {
    this.agarrada = false;
    if (!conInercia) this.inercia = 0;
  }

  rotar(delta) {
    this.anguloObj += delta;
    this.inercia = delta * 0.6;
  }

  zoom(factor) {
    this.zoomObj = THREE.MathUtils.clamp(this.zoomObj * factor, this.zoomMin, this.zoomMax);
  }

  desplazar(dxPx, dyPx, anchoPx) {
    const porPx = this.anchoVista / this.zoomActual / anchoPx;
    const derecha = new THREE.Vector3(Math.cos(this.angulo), 0, -Math.sin(this.angulo));
    const fondo = new THREE.Vector3(-Math.sin(this.angulo), 0, -Math.cos(this.angulo));
    this.objetivoObj.addScaledVector(derecha, -dxPx * porPx);
    this.objetivoObj.addScaledVector(fondo, dyPx * porPx / Math.sin(this.altura));
    this.objetivoObj.x = THREE.MathUtils.clamp(this.objetivoObj.x, -this.limX, this.limX);
    this.objetivoObj.z = THREE.MathUtils.clamp(this.objetivoObj.z, -this.limZ, this.limZ + 1.2);
  }

  reiniciar() {
    const vueltas = Math.round((this.anguloObj - ANGULO_INICIAL) / (Math.PI * 2));
    this.anguloObj = ANGULO_INICIAL + vueltas * Math.PI * 2;
    this.zoomObj = this.zoomFit;
    this.objetivoObj.set(0, 1.0, 0);
    this.inercia = 0;
  }

  actualizar(dt) {
    if (!this.agarrada && Math.abs(this.inercia) > 0.0002) {
      this.anguloObj += this.inercia;
      this.inercia *= Math.pow(0.85, dt * 60);
    }
    if (!this.agarrada && !this.libre && Math.abs(this.inercia) < 0.004) {
      const paso = Math.PI / 2;
      const diagonal = ANGULO_INICIAL + Math.round((this.anguloObj - ANGULO_INICIAL) / paso) * paso;
      this.anguloObj += (diagonal - this.anguloObj) * Math.min(1, dt * 5);
    }
    const k = 1 - Math.pow(0.0001, dt);
    this.angulo += (this.anguloObj - this.angulo) * k;
    this.zoomActual += (this.zoomObj - this.zoomActual) * k;
    this.objetivo.lerp(this.objetivoObj, k);
    this.aplicar();
  }

  aplicar() {
    if (this.altoVista) {
      const c = (this.centroCaja || 0) + (this.margenArriba - this.margenAbajo) / 2 * this.altoVista / (this.zoomActual * this.altoPx);
      this.camara.top = this.altoVista / 2 + c;
      this.camara.bottom = -this.altoVista / 2 + c;
    }
    this.camara.zoom = this.zoomActual;
    this.camara.updateProjectionMatrix();
    const horizontal = this.distancia * Math.cos(this.altura);
    this.camara.position.set(
      this.objetivo.x + horizontal * Math.sin(this.angulo),
      this.objetivo.y + this.distancia * Math.sin(this.altura),
      this.objetivo.z + horizontal * Math.cos(this.angulo)
    );
    this.camara.lookAt(this.objetivo);
    this.camara.updateMatrixWorld();
  }

  direccionHorizontal() {
    return new THREE.Vector3(Math.sin(this.angulo), 0, Math.cos(this.angulo));
  }
}
