import { describe, it, expect } from 'vitest';
import { getDefaultUnderpassProject } from '../../../core/model/UnderpassModel';
import { buildBoxCulvertGeometry } from '../geometry/BoxCulvertGeometry';
import { buildUTypeGeometry } from '../geometry/UTypeGeometry';
import { buildCompleteUnderpassBim } from '../geometry/UnderpassModelBuilder';
import { generateIfc4x3 } from '../ifc/Ifc4x3Exporter';

describe('3D BIM 기하 모델러 및 IFC 4.3 생성 엔진 검증', () => {
  const project = getDefaultUnderpassProject();

  it('박스 암거 Three.js 지오메트리가 정확한 부재 메시와 체적을 생성해야 한다.', () => {
    const boxMeshGroup = buildBoxCulvertGeometry(project);

    expect(boxMeshGroup.group).toBeDefined();
    expect(boxMeshGroup.parts.topSlab).toBeDefined();
    expect(boxMeshGroup.parts.bottomSlab).toBeDefined();
    expect(boxMeshGroup.parts.leftWall).toBeDefined();
    expect(boxMeshGroup.parts.rightWall).toBeDefined();
    expect(boxMeshGroup.parts.haunches.length).toBe(4);

    // 단면적(27.84 m²) * 연장(100m) = 2784.0 m³
    expect(boxMeshGroup.concreteVolumeM3).toBe(2784.0);
  });

  it('U-Type 접속부 옹벽 지오메트리가 정확히 사다리꼴 측벽과 저판을 빌드해야 한다.', () => {
    const uType = buildUTypeGeometry(project.approachStart, 9.0, 0);

    expect(uType.group).toBeDefined();
    expect(uType.concreteVolumeM3).toBeGreaterThan(0);
    // 저판: 10.2 * 0.8 * 30 = 244.8 m³
    // 벽체 2개: 2 * ((1.5 + 5.5) / 2) * 0.6 * 30 = 126.0 m³
    // 총 체적 = 244.8 + 126.0 = 370.8 m³
    expect(uType.concreteVolumeM3).toBe(370.8);
  });

  it('전체 지하차도 BIM 통합 모델이 3개 세그먼트를 원활하게 조립해야 한다.', () => {
    const completeBim = buildCompleteUnderpassBim(project);

    expect(completeBim.rootGroup.children.length).toBe(3);
    // 전체 체적: 시작 U형(370.8) + 본선 박스(2784.0) + 종점 U형(370.8) = 3525.6 m³
    expect(completeBim.totalConcreteVolumeM3).toBe(3525.6);
  });

  it('IFC 4.3 STEP 파일이 ISO 표준 헤더 및 토목 인프라 엔티티를 포함해야 한다.', () => {
    const ifc = generateIfc4x3(project);

    expect(ifc.ifcString).toContain('ISO-10303-21;');
    expect(ifc.ifcString).toContain("FILE_SCHEMA(('IFC4X3'));");
    expect(ifc.ifcString).toContain('IFCROAD');
    expect(ifc.ifcString).toContain('.ROADWAY_STRUCTURE.');
    expect(ifc.ifcString).toContain('.APPROACH.');
    expect(ifc.ifcString).toContain('IFCSLAB');
    expect(ifc.ifcString).toContain('IFCWALL');
    expect(ifc.ifcString).toContain('ClearanceHeight');
    expect(ifc.entityCount).toBeGreaterThan(10);
    expect(ifc.fileSizeKb).toBeGreaterThan(1);
  });
});

