import * as THREE from 'three';
import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';

export interface BoxMeshGroup {
  group: THREE.Group;
  concreteVolumeM3: number;
  parts: {
    topSlab: THREE.Mesh;
    bottomSlab: THREE.Mesh;
    leftWall: THREE.Mesh;
    rightWall: THREE.Mesh;
    centerWall?: THREE.Mesh;
    haunches: THREE.Mesh[];
    roadway: THREE.Mesh;
  };
}

/**
 * 박스 암거 구간의 Three.js 3D 지오메트리 생성
 * 좌표계: X = 횡방향(폭), Y = 연직방향(높이, 위쪽 양수), Z = 종방향(연장, 도로 진행방향)
 */
export function buildBoxCulvertGeometry(project: UnderpassProject): BoxMeshGroup {
  const derived = computeDerivedGeometry(project);
  const { boxSection, boxLength } = project;
  const group = new THREE.Group();
  group.name = 'BoxCulvertSection';

  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Slate-400 (콘크리트 회색)
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const roadwayMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155, // 아스팔트 암회색
    roughness: 0.9,
    metalness: 0.05,
  });

  const totalW = derived.totalWidth;
  const innerW = derived.innerWidth;
  const innerH = derived.innerHeight;
  const topT = boxSection.topSlabThickness;
  const botT = boxSection.bottomSlabThickness;
  const wallT = boxSection.outerWallThickness;
  const length = boxLength;

  // 1. 하부 슬래브 (Bottom Slab)
  // 중심 위치: X=0, Y = botT/2, Z = length/2
  const botSlabGeom = new THREE.BoxGeometry(totalW, botT, length);
  const bottomSlab = new THREE.Mesh(botSlabGeom, concreteMaterial);
  bottomSlab.position.set(0, botT / 2, length / 2);
  bottomSlab.name = 'BottomSlab';
  bottomSlab.castShadow = true;
  bottomSlab.receiveShadow = true;
  group.add(bottomSlab);

  // 2. 상부 슬래브 (Top Slab)
  // 중심 위치: X=0, Y = botT + innerH + topT/2, Z = length/2
  const topSlabGeom = new THREE.BoxGeometry(totalW, topT, length);
  const topSlab = new THREE.Mesh(topSlabGeom, concreteMaterial);
  topSlab.position.set(0, botT + innerH + topT / 2, length / 2);
  topSlab.name = 'TopSlab';
  topSlab.castShadow = true;
  topSlab.receiveShadow = true;
  group.add(topSlab);

  // 3. 좌측 외벽 (Left Wall)
  // 위치: X = -totalW/2 + wallT/2, Y = botT + innerH/2, Z = length/2
  const wallGeom = new THREE.BoxGeometry(wallT, innerH, length);
  const leftWall = new THREE.Mesh(wallGeom, concreteMaterial);
  leftWall.position.set(-totalW / 2 + wallT / 2, botT + innerH / 2, length / 2);
  leftWall.name = 'LeftOuterWall';
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  // 4. 우측 외벽 (Right Wall)
  const rightWall = new THREE.Mesh(wallGeom, concreteMaterial);
  rightWall.position.set(totalW / 2 - wallT / 2, botT + innerH / 2, length / 2);
  rightWall.name = 'RightOuterWall';
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // 5. 2련인 경우 중앙벽체 (Center Wall)
  let centerWall: THREE.Mesh | undefined;
  if (boxSection.cellType === 'DOUBLE' && boxSection.centerWallThickness) {
    const centerWallGeom = new THREE.BoxGeometry(boxSection.centerWallThickness, innerH, length);
    centerWall = new THREE.Mesh(centerWallGeom, concreteMaterial);
    centerWall.position.set(0, botT + innerH / 2, length / 2);
    centerWall.name = 'CenterWall';
    centerWall.castShadow = true;
    centerWall.receiveShadow = true;
    group.add(centerWall);
  }

  // 6. 4개 모서리 헌치 (Corner Haunches - 삼각기둥 지오메트리)
  const haunches: THREE.Mesh[] = [];
  const hw = boxSection.haunchWidth;
  const hh = boxSection.haunchHeight;

  // 삼각기둥 형상 생성 함수
  function createPrismGeometry(p1: [number, number], p2: [number, number], p3: [number, number], depth: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(p1[0], p1[1]);
    shape.lineTo(p2[0], p2[1]);
    shape.lineTo(p3[0], p3[1]);
    shape.closePath();

    const extrudeSettings = {
      depth,
      bevelEnabled: false,
    };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  // 좌하단 헌치 (Left-Bottom)
  const lbInnerX = -innerW / 2;
  const lbInnerY = botT;
  const lbGeom = createPrismGeometry([lbInnerX, lbInnerY], [lbInnerX + hw, lbInnerY], [lbInnerX, lbInnerY + hh], length);
  const lbHaunch = new THREE.Mesh(lbGeom, concreteMaterial);
  lbHaunch.name = 'Haunch_LeftBottom';
  group.add(lbHaunch);
  haunches.push(lbHaunch);

  // 우하단 헌치 (Right-Bottom)
  const rbInnerX = innerW / 2;
  const rbInnerY = botT;
  const rbGeom = createPrismGeometry([rbInnerX, rbInnerY], [rbInnerX - hw, rbInnerY], [rbInnerX, rbInnerY + hh], length);
  const rbHaunch = new THREE.Mesh(rbGeom, concreteMaterial);
  rbHaunch.name = 'Haunch_RightBottom';
  group.add(rbHaunch);
  haunches.push(rbHaunch);

  // 좌상단 헌치 (Left-Top)
  const ltInnerX = -innerW / 2;
  const ltInnerY = botT + innerH;
  const ltGeom = createPrismGeometry([ltInnerX, ltInnerY], [ltInnerX + hw, ltInnerY], [ltInnerX, ltInnerY - hh], length);
  const ltHaunch = new THREE.Mesh(ltGeom, concreteMaterial);
  ltHaunch.name = 'Haunch_LeftTop';
  group.add(ltHaunch);
  haunches.push(ltHaunch);

  // 우상단 헌치 (Right-Top)
  const rtInnerX = innerW / 2;
  const rtInnerY = botT + innerH;
  const rtGeom = createPrismGeometry([rtInnerX, rtInnerY], [rtInnerX - hw, rtInnerY], [rtInnerX, rtInnerY - hh], length);
  const rtHaunch = new THREE.Mesh(rtGeom, concreteMaterial);
  rtHaunch.name = 'Haunch_RightTop';
  group.add(rtHaunch);
  haunches.push(rtHaunch);

  // 7. 도로 노면 포장층 (Roadway Pavement Surface)
  const roadwayGeom = new THREE.BoxGeometry(innerW, 0.08, length);
  const roadway = new THREE.Mesh(roadwayGeom, roadwayMaterial);
  roadway.position.set(0, botT + 0.04, length / 2);
  roadway.name = 'RoadwayPavement';
  roadway.receiveShadow = true;
  group.add(roadway);

  // 콘크리트 체적 계산 (단면적 * 연장)
  const concreteVolumeM3 = Number((derived.crossSectionAreaConcrete * length).toFixed(3));

  return {
    group,
    concreteVolumeM3,
    parts: {
      topSlab,
      bottomSlab,
      leftWall,
      rightWall,
      centerWall,
      haunches,
      roadway,
    },
  };
}
