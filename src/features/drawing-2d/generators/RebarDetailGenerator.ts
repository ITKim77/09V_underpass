import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { CadDrawing, CadEntity, CadPolyline, CadCircle } from '../types/drawing';

/**
 * 지하차도 단면 배근 상세도 (Rebar Arrangement Detail) 2D CAD 도면 생성
 * 좌표계 단위: mm (CAD 표준)
 */
export function generateRebarDetailDrawing(project: UnderpassProject): CadDrawing {
  const derived = computeDerivedGeometry(project);
  const { boxSection } = project;
  const entities: CadEntity[] = [];

  const totalW = derived.totalWidth * 1000;
  const totalH = derived.totalHeight * 1000;
  const innerW = derived.innerWidth * 1000;
  const innerH = derived.innerHeight * 1000;
  const botT = boxSection.bottomSlabThickness * 1000;
  const hw = boxSection.haunchWidth * 1000;
  const hh = boxSection.haunchHeight * 1000;

  const halfW = totalW / 2;
  const halfInnerW = innerW / 2;
  const cover = 80; // 피복두께 80mm

  // 1. 콘크리트 외곽 은선/참조선 (LAYER_CONC)
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

  // 내부 중공선
  const innerPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: -halfInnerW + hw, y: botT },
      { x: halfInnerW - hw, y: botT },
      { x: halfInnerW, y: botT + hh },
      { x: halfInnerW, y: botT + innerH - hh },
      { x: halfInnerW - hw, y: botT + innerH },
      { x: -halfInnerW + hw, y: botT + innerH },
      { x: -halfInnerW, y: botT + innerH - hh },
      { x: -halfInnerW, y: botT + hh },
    ],
  };
  entities.push(innerPoly);

  // 2. 상부 슬래브 주철근 (Top & Bottom Mat Rebars - LAYER_REBAR)
  const topRebarY1 = totalH - cover;
  const topRebarY2 = botT + innerH + cover;
  const rebarLeftX = -halfW + cover;
  const rebarRightX = halfW - cover;

  // 상부 외측 주철근
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: rebarLeftX, y: topRebarY1 },
    end: { x: rebarRightX, y: topRebarY1 },
  });
  // 상부 내측 주철근
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfInnerW, y: topRebarY2 },
    end: { x: halfInnerW, y: topRebarY2 },
  });

  // 3. 하부 슬래브 주철근
  const botRebarY1 = cover;
  const botRebarY2 = botT - cover;
  // 하부 외측 주철근
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: rebarLeftX, y: botRebarY1 },
    end: { x: rebarRightX, y: botRebarY1 },
  });
  // 하부 내측 주철근
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfInnerW, y: botRebarY2 },
    end: { x: halfInnerW, y: botRebarY2 },
  });

  // 4. 외벽 수직 주철근 (Left & Right Outer Wall Vertical Rebars)
  // 좌측 외벽 (외측 / 내측)
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfW + cover, y: botRebarY1 },
    end: { x: -halfW + cover, y: topRebarY1 },
  });
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfInnerW - cover, y: botRebarY1 },
    end: { x: -halfInnerW - cover, y: topRebarY1 },
  });

  // 우측 외벽 (외측 / 내측)
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: halfW - cover, y: botRebarY1 },
    end: { x: halfW - cover, y: topRebarY1 },
  });
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: halfInnerW + cover, y: botRebarY1 },
    end: { x: halfInnerW + cover, y: topRebarY1 },
  });

  // 5. 헌치 대각 보강근 (Haunch Diagonal Rebars)
  // 좌하단
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfInnerW + hw * 0.8, y: botT - cover },
    end: { x: -halfInnerW - cover, y: botT + hh * 0.8 },
  });
  // 우하단
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: halfInnerW - hw * 0.8, y: botT - cover },
    end: { x: halfInnerW + cover, y: botT + hh * 0.8 },
  });
  // 좌상단
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: -halfInnerW + hw * 0.8, y: botT + innerH + cover },
    end: { x: -halfInnerW - cover, y: botT + innerH - hh * 0.8 },
  });
  // 우상단
  entities.push({
    type: 'LINE',
    layer: 'LAYER_REBAR',
    start: { x: halfInnerW - hw * 0.8, y: botT + innerH + cover },
    end: { x: halfInnerW + cover, y: botT + innerH - hh * 0.8 },
  });

  // 6. 배력근 점/원형 배열 (Distribution Rebars - LAYER_REBAR)
  const spacing = 250; // 250mm 간격
  const radius = 16;   // D16/D19 표현 반지름

  // 상부 슬래브 배력근
  for (let x = rebarLeftX + 150; x <= rebarRightX - 150; x += spacing) {
    const c1: CadCircle = {
      type: 'CIRCLE',
      layer: 'LAYER_REBAR',
      center: { x, y: topRebarY1 - 25 },
      radius,
      filled: true,
    };
    entities.push(c1);
  }

  // 하부 슬래브 배력근
  for (let x = rebarLeftX + 150; x <= rebarRightX - 150; x += spacing) {
    const c2: CadCircle = {
      type: 'CIRCLE',
      layer: 'LAYER_REBAR',
      center: { x, y: botRebarY1 + 25 },
      radius,
      filled: true,
    };
    entities.push(c2);
  }

  // 외벽 배력근
  for (let y = botT + 150; y <= botT + innerH - 150; y += spacing) {
    entities.push({
      type: 'CIRCLE',
      layer: 'LAYER_REBAR',
      center: { x: -halfW + cover + 25, y },
      radius,
      filled: true,
    });
    entities.push({
      type: 'CIRCLE',
      layer: 'LAYER_REBAR',
      center: { x: halfW - cover - 25, y },
      radius,
      filled: true,
    });
  }

  // 7. 철근 주기 텍스트 및 인출선
  const rebarNotes = [
    { text: '[S1] D25 @ 125 (상부 주철근)', x: -halfW + 500, y: topRebarY1 + 600 },
    { text: '[S2] D25 @ 125 (하부 주철근)', x: -halfW + 500, y: -600 },
    { text: '[W1] D22 @ 150 (외벽 수직근)', x: halfW + 600, y: totalH / 2 },
    { text: '[D1] D16 @ 250 (종방향 배력근)', x: halfW + 600, y: totalH / 2 - 500 },
    { text: `최소 피복두께 C=${cover}mm 준수`, x: 0, y: -1200 },
  ];

  rebarNotes.forEach((n) => {
    entities.push({
      type: 'TEXT',
      layer: 'LAYER_TEXT',
      position: { x: n.x, y: n.y },
      text: n.text,
      fontSize: 220,
    });
  });

  // 타이틀
  entities.push({
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: 0, y: -2000 },
    text: '지하차도 표준단면 배근 상세도 (REBAR DETAIL)',
    fontSize: 280,
    anchor: 'middle',
  });

  return {
    id: 'dwg-rebar-detail',
    title: '배근 상세도 (Rebar Detail)',
    type: 'REBAR_DETAIL',
    scale: '1:30',
    entities,
    bounds: {
      minX: -halfW - 2000,
      minY: -2500,
      maxX: halfW + 4500,
      maxY: totalH + 1200,
      width: totalW + 6500,
      height: totalH + 3700,
    },
  };
}
