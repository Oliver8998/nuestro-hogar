import * as THREE from 'three';

const LIMITE_PAN = 2.5;
const ANGULO_INICIAL = Math.PI / 4;

export class CamaraIso {
  constructor(aspecto) {
    this.tamano = 10;
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 4, 44);
    this.camara.layers.enable(1);
    this.altura = THREE.MathUtils.degToRad(32);
    this.distancia = 20;
    this.zoomMin = 0.5;
    this.zoomMax = 3;
    this.angulo = ANGULO_INICIAL;
    this.anguloObj = ANGULO_INICIAL;
    this.zoomActual = 1;
    this.zoomObj = 1;
    this.objetivo = new THREE.Vector3(0, 1.0, 0);
    this.objetivoObj = new THREE.Vector3(0, 1.0, 0);
    this.inercia = 0;
    this.agarrada = false;
    this.anchoVista = this.tamano;
    this.limX = LIMITE_PAN;
    this.limZ = LIMITE_PAN;
    this.redimensionar(aspecto);
    this.aplicar();
  }

  ajustar(ancho, fondo) {
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
    this.camara.top = alto / 2;
    this.camara.bottom = -alto / 2;
    this.camara.updateProjectionMatrix();
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
    this.zoomObj = 1;
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
