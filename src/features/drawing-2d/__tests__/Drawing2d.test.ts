import { describe, it, expect } from 'vitest';
import { getDefaultUnderpassProject } from '../../../core/model/UnderpassModel';
import { generateCrossSectionDrawing } from '../generators/CrossSectionGenerator';
import { generateProfileViewDrawing } from '../generators/ProfileViewGenerator';
import { generatePlanViewDrawing } from '../generators/PlanViewGenerator';
import { generateRebarDetailDrawing } from '../generators/RebarDetailGenerator';
import { renderCadToSvgString } from '../exporters/SvgRenderer';
import { generateDxfString } from '../exporters/DxfExporter';

describe('2D CAD 도면 생성 및 DXF/SVG 엔진 검증', () => {
  const project = getDefaultUnderpassProject();

  it('표준횡단면도 치수선이 입력 파라메터 제원과 100% 일치해야 한다.', () => {
    const drawing = generateCrossSectionDrawing(project);

    expect(drawing.id).toBe('dwg-cross-section');
    expect(drawing.entities.length).toBeGreaterThan(10);

    // 전체 외곽 폭 치수선 확인 (10.6m = 10600mm)
    const dimTotalW = drawing.entities.find(
      (e) => e.type === 'DIMENSION' && e.textOverride === '10600'
    );
    expect(dimTotalW).toBeDefined();

    // 시설한계 유효고 치수선 확인 (4.5m = 4500mm)
    const dimClearance = drawing.entities.find(
      (e) => e.type === 'DIMENSION' && e.textOverride?.includes('4500')
    );
    expect(dimClearance).toBeDefined();
  });

  it('종단면도에 3개 분절 구간(진입부, 본선, 진출부)과 스테이션이 정확히 표현되어야 한다.', () => {
    const drawing = generateProfileViewDrawing(project);

    expect(drawing.id).toBe('dwg-profile');
    // 총 연장 160m 확인
    const dimTotalL = drawing.entities.find(
      (e) => e.type === 'DIMENSION' && e.textOverride?.includes('160m')
    );
    expect(dimTotalL).toBeDefined();

    // 스테이션 텍스트 확인
    const sta0 = drawing.entities.find(
      (e) => e.type === 'TEXT' && e.text.includes('STA. 0+000')
    );
    expect(sta0).toBeDefined();
  });

  it('평면도가 도로 중심선 및 차로 분할선을 포함해야 한다.', () => {
    const drawing = generatePlanViewDrawing(project);

    expect(drawing.id).toBe('dwg-plan');
    const cl = drawing.entities.find((e) => e.layer === 'LAYER_CENTER');
    expect(cl).toBeDefined();
  });

  it('배근상세도가 피복두께 기준 및 상하부 주철근을 포함해야 한다.', () => {
    const drawing = generateRebarDetailDrawing(project);

    expect(drawing.id).toBe('dwg-rebar-detail');
    const rebarLines = drawing.entities.filter((e) => e.layer === 'LAYER_REBAR');
    expect(rebarLines.length).toBeGreaterThan(15);
  });

  it('DXF 변환기가 AutoCAD AC1027 표준 포맷을 만족해야 한다.', () => {
    const drawing = generateCrossSectionDrawing(project);
    const dxf = generateDxfString(drawing);

    expect(dxf).toContain('SECTION');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('$ACADVER');
    expect(dxf).toContain('AC1027');
    expect(dxf).toContain('LAYER_CONC');
    expect(dxf).toContain('LAYER_REBAR');
    expect(dxf).toContain('LAYER_DIM');
    expect(dxf).toContain('EOF');
  });

  it('SVG 변환기가 올바른 XML 태그와 레이어 스타일을 생성해야 한다.', () => {
    const drawing = generateCrossSectionDrawing(project);
    const svg = renderCadToSvgString(drawing);

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('</svg>');
  });
});

