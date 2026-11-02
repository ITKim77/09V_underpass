import * as THREE from 'three';
import { UnderpassProject, DerivedUnderpassGeometry } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { buildBoxCulvertGeometry } from './BoxCulvertGeometry';
import { buildUTypeGeometry } from './UTypeGeometry';

export interface CompleteBimModel {
  rootGroup: THREE.Group;
  totalConcreteVolumeM3: number;
  boxVolumeM3: number;
  approachStartVolumeM3: number;
  approachEndVolumeM3: number;
  derived: DerivedUnderpassGeometry;
  boundingBox: THREE.Box3;
}

/**
 * 지하차도 전체 3D BIM 모델 빌더 (U-Type 진입부 + 본선 암거 박스 + U-Type 진출부)
 */
export function buildCompleteUnderpassBim(project: UnderpassProject): CompleteBimModel {
  const derived = computeDerivedGeometry(project);
  const rootGroup = new THREE.Group();
  rootGroup.name = 'UnderpassBimModel';

  const { approachStart, approachEnd, boxLength } = project;
  const innerW = derived.innerWidth;

  // 1. 진입부 U-Type 옹벽 (Z: 0 ~ approachStart.length)
  const uStart = buildUTypeGeometry(approachStart, innerW, 0, 'Approach_Start');
  rootGroup.add(uStart.group);

  // 2. 본선 박스 암거 (Z: approachStart.length ~ approachStart.length + boxLength)
  const box = buildBoxCulvertGeometry(project);
  box.group.position.set(0, 0, approachStart.length);
  rootGroup.add(box.group);

  // 3. 진출부 U-Type 옹벽 (Z: approachStart.length + boxLength ~ totalProjectLength)
  const endZOffset = approachStart.length + boxLength;
  const uEnd = buildUTypeGeometry(approachEnd, innerW, endZOffset, 'Approach_End');
  rootGroup.add(uEnd.group);

  // 전체 체적 집계
  const totalConcreteVolumeM3 = Number(
    (uStart.concreteVolumeM3 + box.concreteVolumeM3 + uEnd.concreteVolumeM3).toFixed(3)
  );

  // 모델 중심을 (0, 0, 0)으로 원점 재정렬
  const boundingBox = new THREE.Box3().setFromObject(rootGroup);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  rootGroup.position.set(-center.x, 0, -center.z);

  return {
    rootGroup,
    totalConcreteVolumeM3,
    boxVolumeM3: box.concreteVolumeM3,
    approachStartVolumeM3: uStart.concreteVolumeM3,
    approachEndVolumeM3: uEnd.concreteVolumeM3,
    derived,
    boundingBox,
  };
}

