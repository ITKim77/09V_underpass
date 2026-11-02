import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { CadDrawing, CadEntity, CadPolyline, CadLine, CadDimension, CadText } from '../types/drawing';

/**
 * 지하차도 표준 횡단면도 (Standard Cross Section) 2D CAD 도면 생성
 * 좌표계 단위: mm (CAD 표준)
 */
export function generateCrossSectionDrawing(project: UnderpassProject): CadDrawing {
  const derived = computeDerivedGeometry(project);
  const { boxSection, alignment } = project;
  const entities: CadEntity[] = [];

  // 미터(m) -> 밀리미터(mm) 변환
  const totalW = derived.totalWidth * 1000;
  const totalH = derived.totalHeight * 1000;
  const innerW = derived.innerWidth * 1000;
  const innerH = derived.innerHeight * 1000;
  const topT = boxSection.topSlabThickness * 1000;
  const botT = boxSection.bottomSlabThickness * 1000;
  const wallT = boxSection.outerWallThickness * 1000;
  const hw = boxSection.haunchWidth * 1000;
  const hh = boxSection.haunchHeight * 1000;

  // 원점 (0,0)을 횡단면 하부 저면 중심에 배치
  const halfW = totalW / 2;
  const halfInnerW = innerW / 2;

  // 1. 외곽 콘크리트 폴리라인 (Outer Concrete Contour)
  const outerPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: -halfW, y: 0 },
      { x: halfW, y: 0 },
      { x: halfW, y: totalH },
      { x: -halfW, y: totalH },
    ],
  };
  entities.push(outerPoly);

  // 2. 내부 중공 및 헌치 폴리라인 (Inner Opening with Haunches)
  // 하부 y = botT, 상부 y = botT + innerH
  const innerBottomY = botT;
  const innerTopY = botT + innerH;

  const innerPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      // 하단 좌 -> 우
      { x: -halfInnerW + hw, y: innerBottomY },
      { x: halfInnerW - hw, y: innerBottomY },
      // 우하단 헌치
      { x: halfInnerW, y: innerBottomY + hh },
      // 우측 내벽
      { x: halfInnerW, y: innerTopY - hh },
      // 우상단 헌치
      { x: halfInnerW - hw, y: innerTopY },
      // 상단 우 -> 좌
      { x: -halfInnerW + hw, y: innerTopY },
      // 좌상단 헌치
      { x: -halfInnerW, y: innerTopY - hh },
      // 좌측 내벽
      { x: -halfInnerW, y: innerBottomY + hh },
    ],
  };
  entities.push(innerPoly);

  // 3. 2련 박스인 경우 중앙벽체
  if (boxSection.cellType === 'DOUBLE' && boxSection.centerWallThickness) {
    const centerT = boxSection.centerWallThickness * 1000;
    const centerWallPoly: CadPolyline = {
      type: 'POLYLINE',
      layer: 'LAYER_CONC',
      closed: true,
      points: [
        { x: -centerT / 2, y: innerBottomY },
        { x: centerT / 2, y: innerBottomY },
        { x: centerT / 2, y: innerTopY },
        { x: -centerT / 2, y: innerTopY },
      ],
    };
    entities.push(centerWallPoly);
  }

  // 4. 도로 중심선 (Centerline)
  const cl: CadLine = {
    type: 'LINE',
    layer: 'LAYER_CENTER',
    start: { x: 0, y: -500 },
    end: { x: 0, y: totalH + 800 },
    strokeDash: '8 4 2 4',
  };
  entities.push(cl);

  // 5. 치수선 (Dimensions)
  // (1) 전체 외곽 폭 (상단)
  const dimTotalW: CadDimension = {
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: -halfW, y: totalH },
    end: { x: halfW, y: totalH },
    offset: 600,
    orientation: 'HORIZONTAL',
    measurement: derived.totalWidth,
    textOverride: `${totalW}`,
  };
  entities.push(dimTotalW);

  // (2) 차로폭 및 길어깨 세부 치수 (내부 상단)
  const shoulderL = alignment.shoulderLeft * 1000;
  const laneW = alignment.laneWidth * 1000;
  let currX = -halfInnerW;

  // 좌측 길어깨
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: currX, y: innerBottomY },
    end: { x: currX + shoulderL, y: innerBottomY },
    offset: -400,
    orientation: 'HORIZONTAL',
    measurement: alignment.shoulderLeft,
    textOverride: `${shoulderL}`,
  });
  currX += shoulderL;

  // 각 차로
  for (let i = 0; i < alignment.laneCount; i++) {
    entities.push({
      type: 'DIMENSION',
      layer: 'LAYER_DIM',
      start: { x: currX, y: innerBottomY },
      end: { x: currX + laneW, y: innerBottomY },
      offset: -400,
      orientation: 'HORIZONTAL',
      measurement: alignment.laneWidth,
      textOverride: `차로 ${i + 1} (${laneW})`,
    });
    currX += laneW;
  }

  // (3) 전체 외곽 전고 (우측)
  const dimTotalH: CadDimension = {
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: halfW, y: 0 },
    end: { x: halfW, y: totalH },
    offset: 800,
    orientation: 'VERTICAL',
    measurement: derived.totalHeight,
    textOverride: `${totalH}`,
  };
  entities.push(dimTotalH);

  // (4) 시설한계 유효높이 (내부 좌측)
  const dimClearance: CadDimension = {
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: -halfInnerW + 800, y: innerBottomY },
    end: { x: -halfInnerW + 800, y: innerTopY },
    offset: 0,
    orientation: 'VERTICAL',
    measurement: boxSection.clearanceHeight,
    textOverride: `유효고 H=${innerH}`,
  };
  entities.push(dimClearance);

  // (5) 슬래브 및 벽체 두께 치수
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: -halfW, y: 0 },
    end: { x: -halfW, y: botT },
    offset: -800,
    orientation: 'VERTICAL',
    measurement: boxSection.bottomSlabThickness,
    textOverride: `하부슬래브 T=${botT}`,
  });
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: -halfW, y: innerTopY },
    end: { x: -halfW, y: totalH },
    offset: -800,
    orientation: 'VERTICAL',
    measurement: boxSection.topSlabThickness,
    textOverride: `상부슬래브 T=${topT}`,
  });
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: -halfW, y: 0 },
    end: { x: -halfInnerW, y: 0 },
    offset: -900,
    orientation: 'HORIZONTAL',
    measurement: boxSection.outerWallThickness,
    textOverride: `외벽 T=${wallT}`,
  });

  // 6. 도면 텍스트 타이틀
  const titleText: CadText = {
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: 0, y: -1600 },
    text: '표준 횡단면도 (STANDARD CROSS SECTION)',
    fontSize: 280,
    anchor: 'middle',
  };
  entities.push(titleText);

  const scaleText: CadText = {
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: 0, y: -2000 },
    text: 'SCALE = 1 : 50',
    fontSize: 180,
    anchor: 'middle',
  };
  entities.push(scaleText);

  return {
    id: 'dwg-cross-section',
    title: '표준 횡단면도 (Cross Section)',
    type: 'CROSS_SECTION',
    scale: '1:50',
    entities,
    bounds: {
      minX: -halfW - 1500,
      minY: -2400,
      maxX: halfW + 1500,
      maxY: totalH + 1200,
      width: totalW + 3000,
      height: totalH + 3600,
    },
  };
}

