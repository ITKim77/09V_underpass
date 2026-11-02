# PLAN.md — 지하차도 BIM 웹 기반 설계 소프트웨어 계획서

## 1. 프로젝트 로드맵 및 마일스톤

본 문서는 다중 전문 에이전트가 지하차도 BIM 웹 기반 설계 소프트웨어를 구축하기 위한 전체 실행 계획(Plan)과 역할별 작업 명세를 정의합니다.

---

### 마일스톤 1: 도메인 데이터 코어 및 파라메트릭 스키마 구축
- **담당**: `domain-architect-agent`
- **목표**: 지하차도 3D/2D/수량 산출을 위한 통합 파라메트릭 데이터 모델 및 Zod 유효성 스키마 정의 (완료)
- **세부 작업**:
  - [x] 도로 및 선형 제원 인터페이스 (`RoadAlignment`: 차로폭, 길어깨, 편경사, 종단경사)
  - [x] 박스 암거 구간 제원 인터페이스 (`BoxCulvertSection`: 상·하부 슬래브, 외벽, 중간벽, 헌치 치수)
  - [x] U-Type 접속부 옹벽 제원 인터페이스 (`UTypeRetainingWall`: 가변 높이 및 단면)
  - [x] 재료 및 단위 적산 상수 정의 (`MaterialSpec`: 콘크리트 강도, 철근 단위중량 등)
  - [x] 입력값 유효성 검증 규칙 (시설한계 4.5m 이상 등 KS/국토부 기준)
  - [x] 단위 테스트 구축 및 전수 통과 (`UnderpassModel.test.ts` 4/4 통과)

---

### 마일스톤 2: 3D BIM 기하 모델러 및 IFC 4.3 내보내기 엔진
- **담당**: `bim-3d-agent`
- **목표**: 파라메트릭 모델로부터 Three.js 3D 형상 실시간 렌더링 및 IFC 4.3 파일 빌드 (완료)
- **세부 작업**:
  - [x] Three.js 기반 박스 암거(Box Culvert) 지오메트리 생성기 (`BoxCulvertGeometry.ts`)
  - [x] 가변 U-Type 옹벽 구간 절곡 및 스윕(Sweep) 지오메트리 생성기 (`UTypeGeometry.ts`)
  - [x] 헌치(Haunch) 및 공동구 트렌치 세부 형상 결합
  - [x] WebGL 뷰어 뷰포트 및 동적 클리핑 플레인 단면 슬라이서 (`ClippingController.ts`, `BimViewer.tsx`)
  - [x] IFC 4.3 Civil Entity 매핑 (`IfcRoad`, `IfcFacilityPart`, `IfcSlab`, `IfcWall`) 및 STEP 파일 익스포터 (`Ifc4x3Exporter.ts`)
  - [x] 3D BIM 단위 테스트 구축 및 전수 통과 (`Bim3d.test.ts` 4/4 통과)

---

### 마일스톤 3: 2D CAD 도면 생성 및 DXF/SVG 엔진
- **담당**: `drawing-agent`
- **목표**: 3D 파라메트릭 모델로부터 2D 공학 도면 벡터 자동 추출 및 CAD 파일 내보내기 (완료)
- **세부 작업**:
  - [x] 3D 형상 기반 표준 횡단면(Cross Section) 2D 폴리라인 투영 (`CrossSectionGenerator.ts`)
  - [x] 평면도(Plan View) 및 종단면도(Profile View) 선형/기하 추출 (`PlanViewGenerator.ts`, `ProfileViewGenerator.ts`)
  - [x] 주철근/배력근 배근 상세 단면도 생성기 (`RebarDetailGenerator.ts`)
  - [x] CAD 레이어 분리 (`LAYER_CONC`, `LAYER_REBAR`, `LAYER_DIM`, `LAYER_TEXT`, `LAYER_CENTER`)
  - [x] 인터랙티브 브라우저 SVG 렌더러 및 AutoCAD 호환 DXF 파일 익스포터 (`SvgRenderer.ts`, `DxfExporter.ts`, `DrawingViewer.tsx`)
  - [x] 2D 도면 단위 테스트 구축 및 전수 통과 (`Drawing2d.test.ts` 6/6 통과)

---

### 마일스톤 4: 실시간 정밀 수량산출 및 BoQ 생성 엔진
- **담당**: `quantity-agent`
- **목표**: 기하 모델로부터 콘크리트, 거푸집, 토공, 철근 수량 자동 집계 및 Excel/CSV 생성 (완료)
- **세부 작업**:
  - [x] 부위별(상부슬래브, 하부슬래브, 외벽, 중간벽, 헌치, U-Type 접속부) 콘크리트 타설 체적($m^3$) 정밀 적산 (`QuantityCalculator.ts`)
  - [x] 접수면/외면 및 헌치 특수거푸집 면적($m^2$) 자동 적산
  - [x] 원지반선(GL) 및 배면 경사(1:0.5) 기준 터파기/되메우기 토공량($m^3$) 산출
  - [x] 부위별 철근 직경별(D25, D22, D19, D16) 표준 수량($ton$) 산출 (할증 3% 반영)
  - [x] 표준 내역서(BoQ) 양식의 Excel(`.xlsx`) 및 CSV 파일 익스포터 (`BoqExcelExporter.ts`, `QuantityViewer.tsx`)
  - [x] 3D 체적 vs BoQ 체적 오차율 0.0000% (< 0.1% 통과) 및 단위 테스트 전수 통과 (`Quantity.test.ts` 6/6 통과)

---

### 마일스톤 5: 웹 플랫폼 UI 및 통합 파이프라인
- **담당**: `web-platform-agent`
- **목표**: 3D/2D/수량산출 탭 뷰 통합 및 파라메트릭 폼 실시간 데이터 바인딩 (완료)
- **세부 작업**:
  - [x] 파라메트릭 입력 제어 사이드바 및 Zod 실시간 유효성 피드백 (`ParameterSidebar.tsx`)
  - [x] 3D 뷰어, 2D 도면 뷰어, 수량 테이블 탭 인터페이스 통합 (`App.tsx`)
  - [x] 산출물 통합 다운로드 모달 매니저 (`ExportModal.tsx`: IFC, DXF, XLSX, SVG 일괄 다운로드)
  - [x] 웹 플랫폼 UI 통합 테스트 및 전수 통과 (`UiIntegration.test.ts` 4/4 통과, 총 24/24 통과)

---

### 마일스톤 6: 품질 보증 및 정합성 검증 (QA & Consistency)
- **담당**: `qa-validator-agent`
- **목표**: 3D 체적, 2D 도면 치수, 수량산출서 간의 데이터 일치성 자동 검증 (완료)
- **세부 작업**:
  - [x] 3D 메시 지오메트리 체적 vs 수량산출서 콘크리트 체적 오차율 검증 (오차율 0.0000% < 0.1% 합격)
  - [x] 2D 도면 표기 치수선과 실제 파라메트릭 수치 100% 정합성 자동 테스트
  - [x] IFC 4.3 파일 구문 및 토목 인프라 엔티티 유효성 검사 (IFC4X3 준수 통과)
  - [x] 독립 감사 엔진 (`SystemAuditor.ts`, `SystemAuditor.test.ts` 전수 통과) 및 최종 품질 감사 보고서 발행 (`FINAL_QA_AUDIT.md`)

