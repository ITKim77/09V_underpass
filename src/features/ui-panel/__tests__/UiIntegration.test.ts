import { describe, it, expect } from 'vitest';
import { getDefaultUnderpassProject, computeDerivedGeometry, validateUnderpassProject } from '../../../core';

describe('웹 플랫폼 UI 및 통합 파이프라인 정합성 검증', () => {
  it('기본 프로젝트 제원이 초기 로드 시 정상 유효성을 만족해야 한다.', () => {
    const project = getDefaultUnderpassProject();
    const validation = validateUnderpassProject(project);

    expect(validation.success).toBe(true);
    expect(validation.errors).toBeUndefined();
  });

  it('사용자가 사이드바에서 차로 수를 2차로 -> 4차로로 변경하면 외곽 전폭이 동적으로 재계산되어야 한다.', () => {
    const project = getDefaultUnderpassProject();
    const initialDerived = computeDerivedGeometry(project);
    expect(initialDerived.totalWidth).toBe(10.6); // 2차로(7m) + 길어깨(2m) + 외벽(1.6m) = 10.6m

    // 4차로로 변경
    const updated = {
      ...project,
      alignment: {
        ...project.alignment,
        laneCount: 4,
      },
    };
    const updatedDerived = computeDerivedGeometry(updated);
    // 4차로(14m) + 길어깨(2m) + 외벽(1.6m) = 17.6m
    expect(updatedDerived.totalWidth).toBe(17.6);
    expect(updatedDerived.crossSectionAreaConcrete).toBeGreaterThan(initialDerived.crossSectionAreaConcrete);
  });

  it('사용자가 유효높이를 법적 최소치(4.5m) 미만으로 설정하면 유효성 오류를 감지해야 한다.', () => {
    const project = getDefaultUnderpassProject();
    project.boxSection.clearanceHeight = 4.0;

    const validation = validateUnderpassProject(project);
    expect(validation.success).toBe(false);
    expect(validation.errors?.length).toBeGreaterThan(0);
    expect(validation.errors?.[0]).toContain('4.5m');
  });

  it('1련 박스에서 2련 박스로 변경 시 중앙벽체가 정상 적용되어야 한다.', () => {
    const project = getDefaultUnderpassProject();
    project.boxSection.cellType = 'DOUBLE';
    project.boxSection.centerWallThickness = 0.6;

    const validation = validateUnderpassProject(project);
    expect(validation.success).toBe(true);

    const derived = computeDerivedGeometry(project);
    // 중앙벽체(0.6m) 추가로 전폭이 10.6 + 0.6 = 11.2m
    expect(derived.totalWidth).toBe(11.2);
  });
});

