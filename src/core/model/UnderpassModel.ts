import {
  UnderpassProject,
  DerivedUnderpassGeometry,
  Meter,
} from '../types/domain';
import { UnderpassProjectSchema } from '../schema/validation';

/**
 * 기본 표준 지하차도 프로젝트 제원 생성 (편도 2차로, 100m 암거 박스, 양측 30m U-Type 접속부)
 */
export function getDefaultUnderpassProject(): UnderpassProject {
  return {
    id: 'underpass-sample-01',
    name: '표준 지하차도 BIM 설계 (2차로)',
    alignment: {
      laneCount: 2,
      laneWidth: 3.5,
      shoulderLeft: 1.0,
      shoulderRight: 1.0,
      medianWidth: 0.0,
      designSpeed: 60,
      crossSlope: 2.0,
      longitudinalSlope: 1.5,
    },
    boxSection: {
      cellType: 'SINGLE',
      clearanceHeight: 4.5,
      topSlabThickness: 0.9,
      bottomSlabThickness: 1.0,
      outerWallThickness: 0.8,
      haunchWidth: 0.5,
      haunchHeight: 0.5,
      soilCover: 2.5,
    },
    approachStart: {
      startWallHeight: 1.5,
      endWallHeight: 5.5,
      baseSlabThickness: 0.8,
      wallThickness: 0.6,
      length: 30.0,
    },
    approachEnd: {
      startWallHeight: 5.5,
      endWallHeight: 1.5,
      baseSlabThickness: 0.8,
      wallThickness: 0.6,
      length: 30.0,
    },
    material: {
      concreteStrengthFck: 30,
      rebarYieldStrengthFy: 400,
      concreteDensityTonM3: 2.45,
      rebarRatioKgM3: 110,
      soilSlopeRatio: 0.5,
      excavationMargin: 1.0,
    },
    boxLength: 100.0,
  };
}

/**
 * 파라메트릭 제원으로부터 정밀 파생 기하 계산 (단일 진실 공급원 - SSOT)
 */
export function computeDerivedGeometry(project: UnderpassProject): DerivedUnderpassGeometry {
  const { alignment, boxSection, approachStart, approachEnd, boxLength } = project;

  // 차로 및 길어깨에 따른 내부 순폭 계산
  const roadSurfaceWidth: Meter =
    alignment.laneCount * alignment.laneWidth +
    alignment.shoulderLeft +
    alignment.shoulderRight +
    alignment.medianWidth;

  const innerWidth: Meter = roadSurfaceWidth;
  const innerHeight: Meter = boxSection.clearanceHeight;

  // 외곽 전폭 및 전고 계산
  let totalWidth: Meter = innerWidth + 2 * boxSection.outerWallThickness;
  if (boxSection.cellType === 'DOUBLE' && boxSection.centerWallThickness) {
    totalWidth += boxSection.centerWallThickness;
  }

  const totalHeight: Meter =
    innerHeight + boxSection.topSlabThickness + boxSection.bottomSlabThickness;

  const totalProjectLength: Meter =
    approachStart.length + boxLength + approachEnd.length;

  // 단면적 계산 (m²)
  // 전체 외곽 직사각형 면적 - 내부 순중공 면적 + 4개 모서리 헌치 면적
  const outerArea = totalWidth * totalHeight;
  let innerArea = innerWidth * innerHeight;
  if (boxSection.cellType === 'DOUBLE' && boxSection.centerWallThickness) {
    // 2개 개구부 면적
    const singleCellWidth = (innerWidth - boxSection.centerWallThickness) / 2;
    innerArea = 2 * (singleCellWidth * innerHeight);
  }

  // 헌치 면적 (직각삼각형 4개: 4 * 0.5 * W * H = 2 * W * H)
  const haunchArea = 2 * (boxSection.haunchWidth * boxSection.haunchHeight);

  // 콘크리트 순단면적 = (외곽 면적 - 내부 면적) + 헌치 면적
  const crossSectionAreaConcrete = Number((outerArea - innerArea + haunchArea).toFixed(4));
  const crossSectionAreaInner = Number((innerArea - haunchArea).toFixed(4));

  return {
    totalWidth: Number(totalWidth.toFixed(4)),
    totalHeight: Number(totalHeight.toFixed(4)),
    innerWidth: Number(innerWidth.toFixed(4)),
    innerHeight: Number(innerHeight.toFixed(4)),
    totalProjectLength: Number(totalProjectLength.toFixed(4)),
    crossSectionAreaConcrete,
    crossSectionAreaInner,
  };
}

/**
 * 파라메터 유효성 검증 함수
 */
export function validateUnderpassProject(input: unknown): {
  success: boolean;
  data?: UnderpassProject;
  errors?: string[];
} {
  const result = UnderpassProjectSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(
        (err) => `[${err.path.join('.')}] ${err.message}`
      ),
    };
  }
  return {
    success: true,
    data: result.data as UnderpassProject,
  };
}

