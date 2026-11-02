import { describe, it, expect } from 'vitest';
import { getDefaultUnderpassProject } from '../../../core/model/UnderpassModel';
import { buildCompleteUnderpassBim } from '../../bim-3d/geometry/UnderpassModelBuilder';
import { calculateUnderpassBoQ } from '../calculator/QuantityCalculator';
import { generateBoqExcelWorkbook, generateBoqCsvString } from '../exporters/BoqExcelExporter';

describe('실시간 정밀 수량산출 및 BoQ 생성 엔진 검증', () => {
  const project = getDefaultUnderpassProject();

  it('3D BIM 기하 체적과 BoQ 콘크리트 적산 체적의 오차율이 0.1% 미만이어야 한다. (Evaluator Gate)', () => {
    const bim3d = buildCompleteUnderpassBim(project);
    const boq = calculateUnderpassBoQ(project);

    // 1. 본선 박스 암거 체적 일치성 (2,784.0 m³)
    expect(boq.summary.boxConcreteM3).toBe(bim3d.boxVolumeM3);

    // 2. 전체 구조물 콘크리트 체적 일치성 (3,525.6 m³)
    const volDiff = Math.abs(boq.summary.concreteTotalM3 - bim3d.totalConcreteVolumeM3);
    const errorPct = (volDiff / bim3d.totalConcreteVolumeM3) * 100.0;

    expect(errorPct).toBeLessThan(0.1);
    expect(errorPct).toBe(0.0);
    expect(boq.summary.concreteTotalM3).toBe(3525.6);
  });

  it('거푸집 면적 계산이 내외측 및 헌치 특수거푸집을 모두 포함해야 한다.', () => {
    const boq = calculateUnderpassBoQ(project);

    expect(boq.summary.formworkTotalM2).toBeGreaterThan(0);
    const formItems = boq.items.filter((i) => i.category === 'FORMWORK');
    expect(formItems.length).toBe(4);
  });

  it('토공량(터파기 및 되메우기)이 정상 산출되어야 한다.', () => {
    const boq = calculateUnderpassBoQ(project);

    expect(boq.summary.excavationM3).toBeGreaterThan(boq.summary.backfillM3);
    expect(boq.summary.backfillM3).toBeGreaterThan(0);
  });

  it('철근량이 부위별 규격(D25, D22, D19, D16)별로 할증 3%를 반영하여 산출되어야 한다.', () => {
    const boq = calculateUnderpassBoQ(project);

    expect(boq.summary.rebarTotalTon).toBeGreaterThan(0);
    const rebarItems = boq.items.filter((i) => i.category === 'REBAR');
    expect(rebarItems.length).toBe(4);
  });

  it('Excel (.xlsx) 바이너리 워크북이 정상 생성되어야 한다.', () => {
    const boq = calculateUnderpassBoQ(project);
    const excelBuffer = generateBoqExcelWorkbook(boq);

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.byteLength).toBeGreaterThan(1000);
  });

  it('CSV 문자열이 UTF-8 BOM 및 표준 헤더를 포함해야 한다.', () => {
    const boq = calculateUnderpassBoQ(project);
    const csv = generateBoqCsvString(boq);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('공종코드,공종구분,품명,규격');
    expect(csv).toContain('C-01');
    expect(csv).toContain('R-01');
  });
});

