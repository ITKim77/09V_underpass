import * as THREE from 'three';
import { UTypeSection, Meter } from '../../../core/types/domain';

export interface UTypeMeshGroup {
  group: THREE.Group;
  concreteVolumeM3: number;
}

/**
 * U-Type 가변 옹벽 접속부 3D 지오메트리 생성
 * 시점부 높이(startWallHeight)에서 종점부 높이(endWallHeight)로 선형 변화하는 사다리꼴 측벽 생성
 * @param section U-Type 제원
 * @param innerWidth 도로 노면 유효 순폭 (m)
 * @param zOffset Z축 시작 오프셋 (m)
 * @param isReversed 진행 방향 반전 여부 (진출부의 경우 높이가 높은 곳에서 낮아짐)
 */
export function buildUTypeGeometry(
  section: UTypeSection,
  innerWidth: Meter,
  zOffset: Meter,
  namePrefix: string = 'UType_Start'
): UTypeMeshGroup {
  const group = new THREE.Group();
  group.name = namePrefix;

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0xa1a1aa, // Zinc-400
    roughness: 0.75,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const roadwayMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.9,
    metalness: 0.05,
  });

  const totalW = innerWidth + 2 * section.wallThickness;
  const length = section.length;
  const botT = section.baseSlabThickness;
  const wallT = section.wallThickness;
  const hStart = section.startWallHeight;
  const hEnd = section.endWallHeight;

  // 1. U-Type 저판 슬래브 (Base Slab)
  const baseSlabGeom = new THREE.BoxGeometry(totalW, botT, length);
  const baseSlab = new THREE.Mesh(baseSlabGeom, concreteMaterial);
  baseSlab.position.set(0, botT / 2, zOffset + length / 2);
  baseSlab.name = `${namePrefix}_BaseSlab`;
  baseSlab.castShadow = true;
  baseSlab.receiveShadow = true;
  group.add(baseSlab);

  // 2. 가변 높이 측벽 (사다리꼴 측면 폴리곤 Extrude)
  // X-Y 평면에서 Z축(길이방향)으로 높이가 hStart -> hEnd로 변하는 사다리꼴
  // Three.js 좌표계: Y축 = 높이, Z축 = 길이 방향
  // Z-Y 단면 형상을 만든 후 X축(두께방향)으로 돌출
  const trapezoidShape = new THREE.Shape();
  trapezoidShape.moveTo(0, botT);
  trapezoidShape.lineTo(length, botT);
  trapezoidShape.lineTo(length, botT + hEnd);
  trapezoidShape.lineTo(0, botT + hStart);
  trapezoidShape.closePath();

  const extrudeSettings = {
    depth: wallT,
    bevelEnabled: false,
  };

  // 좌측 옹벽 (Left Retaining Wall)
  const leftWallGeom = new THREE.ExtrudeGeometry(trapezoidShape, extrudeSettings);
  // Extrude는 Z축 방향으로 돌출되므로 회전 및 위치 변환
  // Shape의 (0,0) ~ (length, height) -> Z축 [zOffset, zOffset + length], Y축 [botT, botT + h]
  leftWallGeom.rotateY(-Math.PI / 2);
  const leftWall = new THREE.Mesh(leftWallGeom, concreteMaterial);
  leftWall.position.set(-totalW / 2 + wallT, 0, zOffset);
  leftWall.name = `${namePrefix}_LeftWall`;
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // 우측 옹벽 (Right Retaining Wall)
  const rightWallGeom = new THREE.ExtrudeGeometry(trapezoidShape, extrudeSettings);
  rightWallGeom.rotateY(-Math.PI / 2);
  const rightWall = new THREE.Mesh(rightWallGeom, concreteMaterial);
  rightWall.position.set(totalW / 2, 0, zOffset);
  rightWall.name = `${namePrefix}_RightWall`;
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // 3. 노면 포장 (Roadway Surface)
  const roadGeom = new THREE.BoxGeometry(innerWidth, 0.08, length);
  const roadway = new THREE.Mesh(roadGeom, roadwayMaterial);
  roadway.position.set(0, botT + 0.04, zOffset + length / 2);
  roadway.name = `${namePrefix}_Roadway`;
  group.add(roadway);

  // 정밀 체적 계산 (m³)
  // 저판 슬래브 체적
  const baseSlabVol = totalW * botT * length;
  // 좌/우 사다리꼴 벽체 체적 (2개 * 평균높이 * 두께 * 연장)
  const avgWallHeight = (hStart + hEnd) / 2;
  const wallsVol = 2 * (avgWallHeight * wallT * length);
  const concreteVolumeM3 = Number((baseSlabVol + wallsVol).toFixed(3));

  return {
    group,
    concreteVolumeM3,
  };
}

