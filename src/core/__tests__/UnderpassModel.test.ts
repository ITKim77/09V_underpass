import { describe, it, expect } from 'vitest';
import {
  getDefaultUnderpassProject,
  computeDerivedGeometry,
  validateUnderpassProject,
} from '../model/UnderpassModel';

describe('지하차도 도메인 코어 및 파라메트릭 스키마 검증', () => {
  it('기본 표준 프로젝트는 Zod 유효성 검증을 정상 통과해야 한다.', () => {
    const project = getDefaultUnderpassProject();
    const result = validateUnderpassProject(project);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('시설한계 유효고가 4.5m 미만일 경우 유효성 검증에서 거부되어야 한다.', () => {
    const project = getDefaultUnderpassProject();
    project.boxSection.clearanceHeight = 4.2; // 4.5m 미만 위반

    const result = validateUnderpassProject(project);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('4.5m'))).toBe(true);
  });

  it('2련 박스(DOUBLE) 선택 시 중앙 벽체 두께가 누락되면 거부되어야 한다.', () => {
    const project = getDefaultUnderpassProject();
    project.boxSection.cellType = 'DOUBLE';
    delete project.boxSection.centerWallThickness;

    const result = validateUnderpassProject(project);
    expect(result.success).toBe(false);
    expect(result.errors?.some((e) => e.includes('중앙 벽체'))).toBe(true);
  });

  it('단일 진실 공급원(SSOT) 기하 계산이 수학적으로 정확해야 한다.', () => {
    const project = getDefaultUnderpassProject();
    const derived = computeDerivedGeometry(project);

    // 내부 순폭 = 2차로(2 * 3.5 = 7.0) + 좌(1.0) + 우(1.0) = 9.0m
    expect(derived.innerWidth).toBe(9.0);
    // 외곽 전폭 = 9.0 + 2 * 외벽(0.8) = 10.6m
    expect(derived.totalWidth).toBe(10.6);
    // 내부 순고 = 4.5m
    expect(derived.innerHeight).toBe(4.5);
    // 외곽 전고 = 4.5 + 상부슬래브(0.9) + 하부슬래브(1.0) = 6.4m
    expect(derived.totalHeight).toBe(6.4);
    // 총 연장 = 진입(30) + 본선암거(100) + 진출(30) = 160m
    expect(derived.totalProjectLength).toBe(160.0);

    // 외곽면적 = 10.6 * 6.4 = 67.84 m²
    // 내부면적 = 9.0 * 4.5 = 40.5 m²
    // 헌치 4개(각 0.5 * 0.5 * 0.5 = 0.125m² * 4 = 0.5m²)
    // 콘크리트 순단면적 = (67.84 - 40.5) + 0.5 = 27.84 m²
    expect(derived.crossSectionAreaConcrete).toBe(27.84);
  });
});

