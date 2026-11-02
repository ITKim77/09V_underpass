import { describe, it, expect } from 'vitest';
import { runSystemAudit } from '../auditor/SystemAuditor';
import { getDefaultUnderpassProject } from '../../../core/model/UnderpassModel';

describe('품질 보증(QA) 및 정합성 검증 독립 감사 엔진', () => {
  it('기본 표준 지하차도 모델에 대해 Evaluator 전수 감사가 100% PASS되어야 한다.', () => {
    const report = runSystemAudit(getDefaultUnderpassProject());

    expect(report.overallPassed).toBe(true);
    expect(report.passCount).toBe(report.totalCount);
    expect(report.metrics.errorRatePct).toBeLessThan(0.1);
    expect(report.metrics.errorRatePct).toBe(0.0);
    expect(report.metrics.drawingDimensionMatchRate).toBe(100.0);
    expect(report.metrics.vol3dM3).toBe(3525.6);
    expect(report.metrics.volBoqM3).toBe(3525.6);
  });

  it('시설한계(4.5m) 미달 시 감사에서 FAIL 처리되어야 한다.', () => {
    const invalidProject = getDefaultUnderpassProject();
    invalidProject.boxSection.clearanceHeight = 4.1;

    const report = runSystemAudit(invalidProject);
    const clearanceCheck = report.checks.find((c) => c.category === 'GEOMETRY');

    expect(clearanceCheck?.passed).toBe(false);
    expect(report.overallPassed).toBe(false);
  });
});

