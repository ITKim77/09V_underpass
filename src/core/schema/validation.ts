import { z } from 'zod';

export const RoadAlignmentSchema = z.object({
  laneCount: z.number().int().min(1, '최소 1차로 이상이어야 합니다.').max(8, '최대 8차로 이하이어야 합니다.'),
  laneWidth: z.number().min(3.0, '차로 폭은 최소 3.0m 이상이어야 합니다.').max(4.0, '차로 폭은 최대 4.0m 이하이어야 합니다.'),
  shoulderLeft: z.number().min(0.5, '좌측 길어깨는 최소 0.5m 이상이어야 합니다.').max(3.0),
  shoulderRight: z.number().min(0.5, '우측 길어깨는 최소 0.5m 이상이어야 합니다.').max(3.0),
  medianWidth: z.number().min(0.0).max(5.0),
  designSpeed: z.number().min(30).max(120),
  crossSlope: z.number().min(-6.0).max(6.0),
  longitudinalSlope: z.number().min(-10.0).max(10.0),
});

export const BoxCulvertSectionSchema = z.object({
  cellType: z.enum(['SINGLE', 'DOUBLE']),
  clearanceHeight: z.number().min(4.5, '도로 시설한계 유효높이는 법적 기준인 최소 4.5m 이상이어야 합니다.'),
  topSlabThickness: z.number().min(0.5, '상부 슬래브 두께는 최소 0.5m 이상이어야 합니다.').max(2.5),
  bottomSlabThickness: z.number().min(0.5, '하부 슬래브 두께는 최소 0.5m 이상이어야 합니다.').max(2.5),
  outerWallThickness: z.number().min(0.4, '외측 벽체 두께는 최소 0.4m 이상이어야 합니다.').max(2.0),
  centerWallThickness: z.number().min(0.3).max(2.0).optional(),
  haunchWidth: z.number().min(0.1).max(1.5),
  haunchHeight: z.number().min(0.1).max(1.5),
  soilCover: z.number().min(0.5, '토피고는 최소 0.5m 이상이어야 합니다.').max(20.0),
}).refine((data) => {
  if (data.cellType === 'DOUBLE' && (!data.centerWallThickness || data.centerWallThickness < 0.3)) {
    return false;
  }
  return true;
}, {
  message: '2련 박스(DOUBLE)의 경우 중앙 벽체 두께가 0.3m 이상이어야 합니다.',
  path: ['centerWallThickness'],
});

export const UTypeSectionSchema = z.object({
  startWallHeight: z.number().min(1.0).max(12.0),
  endWallHeight: z.number().min(1.0).max(12.0),
  baseSlabThickness: z.number().min(0.5).max(2.0),
  wallThickness: z.number().min(0.4).max(1.5),
  length: z.number().min(5.0).max(200.0),
});

export const MaterialSpecSchema = z.object({
  concreteStrengthFck: z.number().min(21).max(60),
  rebarYieldStrengthFy: z.number().min(300).max(600),
  concreteDensityTonM3: z.number().min(2.0).max(2.8),
  rebarRatioKgM3: z.number().min(60).max(250),
  soilSlopeRatio: z.number().min(0.2).max(1.5),
  excavationMargin: z.number().min(0.5).max(2.0),
});

export const UnderpassProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '프로젝트 명을 입력해 주세요.'),
  alignment: RoadAlignmentSchema,
  boxSection: BoxCulvertSectionSchema,
  approachStart: UTypeSectionSchema,
  approachEnd: UTypeSectionSchema,
  material: MaterialSpecSchema,
  boxLength: z.number().min(10.0, '박스 암거 구간 연장은 최소 10m 이상이어야 합니다.'),
});

