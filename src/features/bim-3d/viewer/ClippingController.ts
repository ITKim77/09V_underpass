import * as THREE from 'three';

export type ClippingMode = 'NONE' | 'LONGITUDINAL' | 'CROSS_SECTION' | 'TOP_DOWN';

export class ClippingController {
  private plane: THREE.Plane;
  private renderer: THREE.WebGLRenderer;
  private currentMode: ClippingMode = 'NONE';
  private currentOffset: number = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 10);
    this.renderer.localClippingEnabled = true;
  }

  public setMode(mode: ClippingMode, offset: number = 0) {
    this.currentMode = mode;
    this.currentOffset = offset;
    this.applyPlane();
  }

  public setOffset(offset: number) {
    this.currentOffset = offset;
    this.applyPlane();
  }

  private applyPlane() {
    if (this.currentMode === 'NONE') {
      this.renderer.clippingPlanes = [];
      return;
    }

    switch (this.currentMode) {
      case 'LONGITUDINAL': // X축 절단 (좌/우 반단면)
        this.plane.normal.set(1, 0, 0);
        this.plane.constant = this.currentOffset;
        break;
      case 'CROSS_SECTION': // Z축 절단 (진행방향 횡단면 슬라이스)
        this.plane.normal.set(0, 0, -1);
        this.plane.constant = this.currentOffset;
        break;
      case 'TOP_DOWN': // Y축 절단 (상부 슬래브 오픈 평면 뷰)
        this.plane.normal.set(0, -1, 0);
        this.plane.constant = this.currentOffset;
        break;
    }

    this.renderer.clippingPlanes = [this.plane];
  }

  public getMode(): ClippingMode {
    return this.currentMode;
  }

  public getOffset(): number {
    return this.currentOffset;
  }

  public dispose() {
    this.renderer.clippingPlanes = [];
  }
}

