import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { CadDrawing, CadEntity, CadPolyline, CadLine, CadText } from '../types/drawing';

/**
 * 지하차도 종단면도 (Profile View) 2D CAD 도면 생성
 * X축: 종방향 스테이션(STA), Y축: 높이 (mm 단위)
 */
export function generateProfileViewDrawing(project: UnderpassProject): CadDrawing {
  const derived = computeDerivedGeometry(project);
  const { approachStart, approachEnd, boxLength, boxSection } = project;
  const entities: CadEntity[] = [];

  const lStart = approachStart.length * 1000;
  const lBox = boxLength * 1000;
  const lEnd = approachEnd.length * 1000;
  const totalL = derived.totalProjectLength * 1000;

  const totalH = derived.totalHeight * 1000;
  const botT = boxSection.bottomSlabThickness * 1000;
  const uStartH1 = (approachStart.baseSlabThickness + approachStart.startWallHeight) * 1000;
  const uStartH2 = (approachStart.baseSlabThickness + approachStart.endWallHeight) * 1000;
  const uEndH1 = (approachEnd.baseSlabThickness + approachEnd.startWallHeight) * 1000;
  const uEndH2 = (approachEnd.baseSlabThickness + approachEnd.endWallHeight) * 1000;

  // 1. 계획 구조물 외곽선 (Profile Concrete Outline)
  // 진입부 U-Type: (0, 0) -> (lStart, 0) -> (lStart, uStartH2) -> (0, uStartH1)
  const uStartPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: 0, y: 0 },
      { x: lStart, y: 0 },
      { x: lStart, y: uStartH2 },
      { x: 0, y: uStartH1 },
    ],
  };
  entities.push(uStartPoly);

  // 본선 박스 암거: (lStart, 0) -> (lStart + lBox, 0) -> (lStart + lBox, totalH) -> (lStart, totalH)
  const boxPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: lStart, y: 0 },
      { x: lStart + lBox, y: 0 },
      { x: lStart + lBox, y: totalH },
      { x: lStart, y: totalH },
    ],
  };
  entities.push(boxPoly);

  // 진출부 U-Type: (lStart + lBox, 0) -> (totalL, 0) -> (totalL, uEndH2) -> (lStart + lBox, uEndH1)
  const uEndPoly: CadPolyline = {
    type: 'POLYLINE',
    layer: 'LAYER_CONC',
    closed: true,
    points: [
      { x: lStart + lBox, y: 0 },
      { x: totalL, y: 0 },
      { x: totalL, y: uEndH2 },
      { x: lStart + lBox, y: uEndH1 },
    ],
  };
  entities.push(uEndPoly);

  // 2. 내부 바닥 저면선 (Invert Level Line)
  const invertLine: CadLine = {
    type: 'LINE',
    layer: 'LAYER_CONC',
    start: { x: 0, y: botT },
    end: { x: totalL, y: botT },
    strokeDash: '4 4',
  };
  entities.push(invertLine);

  // 3. 지반선 (Natural Ground Level - GL)
  const glHeight = totalH + (boxSection.soilCover * 1000);
  const glLine: CadLine = {
    type: 'LINE',
    layer: 'LAYER_CENTER',
    start: { x: -5000, y: glHeight },
    end: { x: totalL + 5000, y: glHeight },
    strokeDash: '10 5',
  };
  entities.push(glLine);

  const glText: CadText = {
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: -4500, y: glHeight + 500 },
    text: `원지반선 (G.L) +${(glHeight / 1000).toFixed(1)}m`,
    fontSize: 350,
  };
  entities.push(glText);

  // 4. 구간 연장 치수선
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: 0, y: -1500 },
    end: { x: lStart, y: -1500 },
    offset: 0,
    orientation: 'HORIZONTAL',
    measurement: approachStart.length,
    textOverride: `진입 U-Type (L=${lStart / 1000}m)`,
  });
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: lStart, y: -1500 },
    end: { x: lStart + lBox, y: -1500 },
    offset: 0,
    orientation: 'HORIZONTAL',
    measurement: boxLength,
    textOverride: `본선 박스암거 (L=${lBox / 1000}m)`,
  });
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: lStart + lBox, y: -1500 },
    end: { x: totalL, y: -1500 },
    offset: 0,
    orientation: 'HORIZONTAL',
    measurement: approachEnd.length,
    textOverride: `진출 U-Type (L=${lEnd / 1000}m)`,
  });
  entities.push({
    type: 'DIMENSION',
    layer: 'LAYER_DIM',
    start: { x: 0, y: -3000 },
    end: { x: totalL, y: -3000 },
    offset: 0,
    orientation: 'HORIZONTAL',
    measurement: derived.totalProjectLength,
    textOverride: `전체 연장 L=${totalL / 1000}m`,
  });

  // 5. 스테이션 표기 (Stationing)
  const stations = [
    { x: 0, text: 'STA. 0+000 (시점)' },
    { x: lStart, text: `STA. 0+${(lStart / 1000).toFixed(0).padStart(3, '0')} (박스시점)` },
    { x: lStart + lBox, text: `STA. 0+${((lStart + lBox) / 1000).toFixed(0).padStart(3, '0')} (박스종점)` },
    { x: totalL, text: `STA. 0+${(totalL / 1000).toFixed(0).padStart(3, '0')} (종점)` },
  ];

  stations.forEach((st) => {
    entities.push({
      type: 'LINE',
      layer: 'LAYER_DIM',
      start: { x: st.x, y: 0 },
      end: { x: st.x, y: -1000 },
    });
    entities.push({
      type: 'TEXT',
      layer: 'LAYER_TEXT',
      position: { x: st.x, y: -800 },
      text: st.text,
      fontSize: 280,
      rotation: 90,
    });
  });

  // 6. 타이틀
  entities.push({
    type: 'TEXT',
    layer: 'LAYER_TEXT',
    position: { x: totalL / 2, y: -5000 },
    text: '지하차도 종단면도 (PROFILE VIEW)',
    fontSize: 450,
    anchor: 'middle',
  });

  return {
    id: 'dwg-profile',
    title: '종단면도 (Profile View)',
    type: 'PROFILE',
    scale: '1:200',
    entities,
    bounds: {
      minX: -8000,
      minY: -6500,
      maxX: totalL + 8000,
      maxY: glHeight + 3000,
      width: totalL + 16000,
      height: glHeight + 9500,
    },
  };
}
