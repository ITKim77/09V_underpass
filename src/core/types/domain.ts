/**
 * 지하차도 BIM 도메인 모델 핵심 타입 정의
 * 단일 진실 공급원(SSOT) 원칙 준수
 * 구조계산서 관련 항목 배제
 */

export type Meter = number;
export type Millimeter = number;
export type Percent = number;
export type Megapascal = number;

/** 도로 선형 및 차로 제원 */
export interface RoadAlignment {
  laneCount: number;             // 차로 수 (편도/양방향 구분 기준, 보통 2~4차로)
  laneWidth: Meter;              // 차로 폭 (m, 표준 3.0 ~ 3.5m)
  shoulderLeft: Meter;           // 좌측 길어깨 폭 (m, 보통 0.75 ~ 1.5m)
  shoulderRight: Meter;          // 우측 길어깨 폭 (m, 보통 1.0 ~ 2.0m)
  medianWidth: Meter;            // 중앙분리대 폭 (m, 0일 경우 미적용)
  designSpeed: number;           // 설계속도 (km/h)
  crossSlope: Percent;           // 편경사 (%)
  longitudinalSlope: Percent;    // 종단경사 (%)
}

/** 암거 박스(Box Culvert) 단면 제원 */
export interface BoxCulvertSection {
  cellType: 'SINGLE' | 'DOUBLE'; // 1련 또는 2련 박스
  clearanceHeight: Meter;        // 시설한계 유효높이 (m, 최소 4.5m 이상)
  topSlabThickness: Meter;       // 상부 슬래브 두께 (m)
  bottomSlabThickness: Meter;    // 하부 슬래브 두께 (m)
  outerWallThickness: Meter;     // 외측 벽체 두께 (m)
  centerWallThickness?: Meter;   // 중앙 기둥/벽체 두께 (2련일 때 필수, m)
  haunchWidth: Meter;            // 헌치 가로 치수 (m)
  haunchHeight: Meter;           // 헌치 세로 치수 (m)
  soilCover: Meter;              // 상부 토피고 (m)
}

/** U-Type 옹벽 접속부 구간 제원 */
export interface UTypeSection {
  startWallHeight: Meter;        // 시점부 옹벽 높이 (m)
  endWallHeight: Meter;          // 종점부 옹벽 높이 (박스 결합부 높이, m)
  baseSlabThickness: Meter;      // 저판 슬래브 두께 (m)
  wallThickness: Meter;          // 옹벽 벽체 두께 (m)
  length: Meter;                 // 접속부 연장 (m)
}

/** 재료 및 적산 물성 규격 */
export interface MaterialSpec {
  concreteStrengthFck: Megapascal;  // 콘크리트 설계기준강도 (MPa, e.g. 30)
  rebarYieldStrengthFy: Megapascal; // 철근 항복강도 (MPa, e.g. 400)
  concreteDensityTonM3: number;     // 콘크리트 단위중량 (ton/m³, 통상 2.45)
  rebarRatioKgM3: number;           // 구조물 평균 배근율 (kg/m³, 통상 100~130)
  soilSlopeRatio: number;           // 터파기 배면 경사비 (1:H, e.g. 0.5)
  excavationMargin: Meter;          // 양측 작업 여유폭 (m, e.g. 1.0)
}

/** 지하차도 통합 설계 프로젝트 모델 */
export interface UnderpassProject {
  id: string;
  name: string;
  alignment: RoadAlignment;
  boxSection: BoxCulvertSection;
  approachStart: UTypeSection;
  approachEnd: UTypeSection;
  material: MaterialSpec;
  boxLength: Meter;                 // 박스 암거 구간 연장 (m)
}

/** 파생 기하 계산 결과 (Derived Geometry) */
export interface DerivedUnderpassGeometry {
  totalWidth: Meter;                // 외곽 전폭 (m)
  totalHeight: Meter;               // 외곽 전고 (m)
  innerWidth: Meter;                // 내부 순폭 (단련 기준, 2련의 경우 개별 폭, m)
  innerHeight: Meter;               // 내부 순고 (m)
  totalProjectLength: Meter;        // 진입 U-Type + 박스 + 진출 U-Type 총 연장 (m)
  crossSectionAreaConcrete: number; // 박스 단면 콘크리트 순면적 (m²)
  crossSectionAreaInner: number;    // 박스 내부 중공 면적 (m²)
}

