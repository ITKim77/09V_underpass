import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { CadDrawing, CadEntity, CadPolyline } from '../types/drawing';

/**
 * 지하차도 평면도 (Plan View) 2D CAD 도면 생성
 * X축: 종방향 스테이션(STA), Y축: 횡방향 폭(mm)
 */
export function generatePlanViewDrawing(project: UnderpassProject): CadDrawing {
  const derived = computeDerivedGeometry(project);
  const { approachStart, boxLength, alignment } = project;
  const entities: CadEntity[] = [];

  const lStart = approachStart.length * 1000;
  const lBox = boxLength * 1000;
  const totalL = derived.totalProjectLength * 1000;

  const totalW = derived.totalWidth * 1000;
  const innerW = derived.innerWidth * 1000;
  const halfW = totalW / 2;
  const halfInnerW = innerW / 2;

  // 1. 도로 중심선 (Centerline)
  entities.push({
    type: 'LINE',
    layer: 'LAYER_CENTER',
    start: { x: -4000, y: 0 },
    end: { x: totalL + 4000, y: 0 },
    strokeDash: '8 4 2 4',
  });

  // 2. 구조물 외곽 경계선 (Outer Structure Boundaries)
  // 본선 박스 외곽 직사각형
  const boxOuter: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: lStart, y: -halfW },
      { x: lStart + lBox, y: -halfW },
      { x: lStart + lBox, y: halfW },
      { x: lStart, y: halfW },
    ],
  };
  entities.push(boxOuter);

  // 진입 U-Type 옹벽 전면선
  const uStartOuter: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: false,
    points: [
      { x: 0, y: -halfW },
      { x: lStart, y: -halfW },
    ],
  };
  entities.push(uStartOuter);
  entities.push({
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: false,
    points: [
      { x: 0, y: halfW },
      { x: lStart, y: halfW },
    ],
  });

  // 진출 U-Type 옹벽 전면선
  entities.push({
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: false,
    points: [
      { x: lStart + lBox, y: -halfW },
      { x: totalL, y: -halfW },
    ],
  });
  entities.push({
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: false,
    points: [
      { x: lStart + lBox, y: halfW },
      { x: totalL, y: halfW },
    ],
  });

  // 3. 차로 및 길어깨 경계선 (Lane & Shoulder Lines)
  // 좌/우 길어깨선
  entities.push({
    type: 'LINE',
    layer: 'LAYER_DIM',
    start: { x: 0, y: -halfInnerW },
    end: { x: totalL, y: -halfInnerW },
  });
  entities.push({
    type: 'LINE',
    layer: 'LAYER_DIM',
    start: { x: 0, y: halfInnerW },
    end: { x: totalL, y: halfInnerW },
  });

  // 차로 분할선 (점선)
  const laneW = alignment.laneWidth * 1000;
  let laneY = -halfInnerW + (alignment.shoulderLeft * 1000);
  for (let i = 1; i < alignment.laneCount; i++) {
    laneY += laneW;
    entities.push({
      type: 'LINE',
      layer: 'LAYER_DIM',
      start: { x: 0, y: laneY },
      end: { x: totalL, y: laneY },
      strokeDash: '6 6',
    });
  }

  // 4. 치수선
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: lStart + lBox / 2, y: -halfW },
    end: { x: lStart + lBox / 2, y: halfW },
    offset: 2500,
    orientation: 'VERTICAL',
    measurement: derived.totalWidth,
    textOverride: `전폭 B=${totalW}`,
  });

  // 5. 타이틀
  entities.push({
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: totalL / 2, y: -halfW - 5000 },
    text: '지하차도 평면도 (PLAN VIEW)',
    fontSize: 450,
    anchor: 'middle',
  });

  return {
    id: 'dwg-plan',
    title: '평면도 (Plan View)',
    type: 'PLAN',
    scale: '1:200',
    entities,
    bounds: {
      minX: -6000,
      minY: -halfW - 6500,
      maxX: totalL + 6000,
      maxY: halfW + 4000,
      width: totalL + 12000,
      height: totalW + 10500,
    },
  };
}
