import * as THREE from 'three';

export class CamaraIso {
  constructor(aspecto) {
    this.tamano = 10;
    this.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.angulo = Math.PI / 4;
    this.altura = Math.atan(1 / Math.sqrt(2));
    this.distancia = 20;
    this.objetivo = new THREE.Vector3(0, 0, 0);
    this.zoomMin = 0.6;
    this.zoomMax = 3;
    this.redimensionar(aspecto);
    this.actualizar();
  }

  redimensionar(aspecto) {
    const ancho = aspecto < 1 ? this.tamano : this.tamano * aspecto;
    const alto = ancho / aspecto;
    this.camara.left = -ancho / 2;
    this.camara.right = ancho / 2;
    this.camara.top = alto / 2;
    this.camara.bottom = -alto / 2;
    this.camara.updateProjectionMatrix();
  }

  rotar(delta) {
    this.angulo += delta;
    this.actualizar();
  }

  zoom(factor) {
    this.camara.zoom = THREE.MathUtils.clamp(this.camara.zoom * factor, this.zoomMin, this.zoomMax);
    this.camara.updateProjectionMatrix();
  }

  actualizar() {
    const horizontal = this.distancia * Math.cos(this.altura);
    this.camara.position.set(
      this.objetivo.x + horizontal * Math.sin(this.angulo),
      this.objetivo.y + this.distancia * Math.sin(this.altura),
      this.objetivo.z + horizontal * Math.cos(this.angulo)
    );
    this.camara.lookAt(this.objetivo);
  }

  direccionHorizontal() {
    return new THREE.Vector3(Math.sin(this.angulo), 0, Math.cos(this.angulo));
  }
}
