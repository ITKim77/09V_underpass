# CLAUDE.md — 지하차도 BIM 웹 기반 설계 소프트웨어 개발 지침

## 1. 프로젝트 개요 (Project Overview)
- **프로젝트 명**: 지하차도 BIM 웹 기반 설계 소프트웨어 (Underpass Web BIM CAD)
- **목표**: 도로 인프라(지하차도)의 파라메트릭 제원 입력을 바탕으로 **3대 핵심 산출물**을 실시간 생성·시각화·다운로드하는 웹 애플리케이션 구축
- **3대 핵심 산출물**:
  1. **3D BIM 모델**: Three.js WebGL 실시간 시각화 + IFC 4.3 인프라 표준 파일(.ifc) 내보내기
  2. **2D 설계 도면**: 평면도, 종단면도, 표준횡단면도, 배근/단면상세도 (웹 SVG 렌더링 + AutoCAD 호환 .dxf 내보내기)
  3. **수량산출서**: 콘크리트($m^3$), 거푸집($m^2$), 터파기/되메우기($m^3$), 부위별 철근 산출량($ton$) 집계 및 Excel/CSV(.xlsx/.csv) 내보내기
- **절대적 제외 사항**: **구조계산서(Structural Calculation Report) 관련 로직 및 항목은 개발 대상에서 배제한다.**

---

## 2. 기술 스택 및 아키텍처 원칙 (Tech Stack & Architecture)
- **Core Framework**: React 18+ / TypeScript 5+ / Vite
- **3D Graphics Engine**: Three.js, `@thatopen/ui`, `web-ifc` (IFC 4.3 표준 준수)
- **2D CAD & Vector Engine**: `Maker.js`, `dxf-writer`, SVG DOM 렌더러
- **수량산출 & 데이터 처리**: 자체 기하 적분식(B-Rep 기반), `xlsx`, Papaparse
- **동시성 및 성능**: 기하 연산 및 IFC 파일 빌드는 **Web Worker**를 통해 백그라운드 처리하여 메인 스레드 UI 블로킹 방지
- **단일 진실 공급원 (SSOT)**: 모든 3D 렌더링, 2D 도면 투영, 수량 적산은 중앙의 `UnderpassParametricModel` 상태 객체로부터 파생되어야 함

---

## 3. 예정 프로젝트 구조 (Target Directory Structure)
> *주의: 실제 패키지 설치 및 디렉터리 생성은 추후 지정된 단계에서 진행함.*

```text
09V_underpass/
├── docs/                       # 도메인 참고 자료 및 기술 문서
├── MEMORY.md                   # 프로젝트 핵심 요구사항 및 진행 이력
├── CLAUDE.md                   # 에이전트 지침 및 개발 가이드라인
├── package.json                # (설치 예정)
├── src/
│   ├── core/
│   │   ├── types/              # 파라메트릭 도메인 타입 (Box, U-Type, Rebar, Station 등)
│   │   ├── schema/             # Zod 파라미터 유효성 검증 스키마
│   │   └── model/              # 지하차도 파라메트릭 코어 모델 (SSOT)
│   ├── features/
│   │   ├── bim-3d/             # Three.js 뷰어, 절단면(Clipping), IFC 4.3 빌더
│   │   ├── drawing-2d/         # 2D 단면 투영 엔진, SVG 렌더러, DXF 익스포터
│   │   ├── quantity/           # 체적/면적/토공/철근 산출 공식 및 Excel/CSV 생성
│   │   └── ui-panel/           # 파라미터 입력 폼, 탭 뷰어(3D/2D/수량)
│   ├── workers/                # 기하 연산 및 대용량 파일 내보내기용 Web Workers
│   └── shared/                 # 공통 유틸리티 (수학 연산, 벡터, 단위 변환)
```

---

## 4. 코딩 규칙 및 개발 표준 (Coding Standards)
1. **타입 안전성 (Strict Type Safety)**:
   - TypeScript `strict: true` 모드를 준수하며, `any` 타입의 사용을 절대 금지한다.
   - 모든 제원(길이, 각도, 두께 등)은 기본 단위를 **mm**(밀리미터) 또는 **m**(미터)로 명시적인 주석과 타입 별칭(`type Meter = number;`, `type Millimeter = number;`)을 부여한다.
2. **도메인 격리 원칙 (Domain Isolation)**:
   - 형상 계산 로직(`core/model`)은 Three.js 등 UI/렌더링 라이브러리에 직접 의존하지 않고 순수 수학/기하 함수로 작성한다.
3. **오차 검증 (Validation & QA)**:
   - 3D 형상 체적과 수량산출서의 콘크리트 체적 간 허용 오차는 **0.1% 미만**이어야 한다.
   - 입력 파라미터가 도로/구조 설계 기준(시설한계 4.5m 등)에 미달할 경우 경고/오류를 반환해야 한다.
4. **구조계산서 배제 원칙**:
   - 하중 계산(풍하중, 토압, 활하중, 지진하중 등) 및 단면 내하력 검토 관련 코드는 일체 작성하지 않는다.

---

## 5. 표준 개발 명령어 (Standard Commands - 예정)
- 개발 서버 실행: `npm run dev`
- 프로덕션 빌드: `npm run build`
- 단위/도메인 테스트: `npm run test`
- 린트 및 포맷팅: `npm run lint`

---

## 6. 에이전트 협업 및 작업 상태 관리 지침 (Agent Workflow & Task State)

본 프로젝트는 복수의 전문 에이전트가 역할을 나누어 병렬/순차 협업하므로, 작업 인수인계와 상태 정합성을 위해 다음 규칙을 엄격히 준수한다.

### 6.1 작업 시작 시 필수 동작 (Session Initialization)
- **모든 에이전트는 작업을 시작할 때 반드시 다음 두 파일을 가장 먼저 읽어야 한다:**
  1. [`PROGRESS.md`](file:///d:/Obsidian%20Vault/09V_underpass/PROGRESS.md): 현재 전체 프로젝트가 어디까지 진행되었는지, 이전 에이전트가 무엇을 완료했는지, 현재 차례가 누구인지 확인.
  2. [`PLAN.md`](file:///d:/Obsidian%20Vault/09V_underpass/PLAN.md): 본인 에이전트가 담당할 마일스톤과 세부 작업 명세, 입출력 규격, 선행 의존성 확인.
- 위 두 파일을 읽은 후, 현재 수행할 구체적인 작업 범위와 목표를 명확히 선언하고 작업을 착수한다.

### 6.2 작업 종료 시 필수 동작 (Session Completion)
- 작업을 완료하거나 상태가 변경된 경우, **반드시 [`PROGRESS.md`](file:///d:/Obsidian%20Vault/09V_underpass/PROGRESS.md)를 즉시 업데이트**하여 다음 작업자/에이전트가 이어서 작업할 수 있도록 기록한다.
  - 마일스톤/세부 항목 체크박스 갱신 (`[x]`)
  - 최근 작업 내용 및 다음 착수 작업 명시
  - 로드맵 또는 세부 계획에 수정이 필요한 경우 [`PLAN.md`](file:///d:/Obsidian%20Vault/09V_underpass/PLAN.md)도 함께 동기화
- 절차 준수: 사용자의 명시적 승인 없이 다음 단계로 임의 진행하지 않으며, 각 단계 전후로 리마인드 및 승인을 받는다.

---

## 7. Anthropic 하네스 3자 아키텍처 (Planner - Generator - Evaluator) 프로토콜

장기 실행 애플리케이션 개발의 품질 붕괴를 방지하기 위해 [Anthropic Engineering Guide](https://www.anthropic.com/engineering/harness-design-long-running-apps)의 3자 하네스 아키텍처를 강제한다.

```text
       ┌────────────────────────┐
       │ Planner (Domain Arch)  │ ──> 기하 계약 및 스키마 수립 (PLAN.md)
       └───────────┬────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ Generator (3D, 2D, Quantity Engine)  │ ──> 구현 및 산출물 파일 생성
└──────────────────┬───────────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │ Evaluator (QA Agent)   │ ──> 독립 검증 및 평가서 (EVALUATION_REPORT.md)
       └───────────┬────────────┘
                   │
         [Pass] ───┴───> [Fail: 구체적 오차 피드백 ➔ Generator 재작업]
```

### 7.1 자기 평가 편향 차단 (Anti-Self-Evaluation Rule)
- **금지 원칙**: 코드를 작성한 `Generator` 에이전트(`bim-3d-modeler`, `drawing-generator`, `quantity-estimator`)는 본인의 작업 결과를 스스로 "완벽하다"고 판단하거나 마일스톤 완료 처리를 할 수 없다.
- **의무 절차**: 모든 구현 산출물은 반드시 독립 에이전트인 `evaluator-qa`에 의해 객관적인 검증을 거쳐야 한다.

### 7.2 독립 Evaluator 채점 프로토콜 (Strict Evaluation Gate)
- `evaluator-qa` 에이전트는 다음 3대 합격 기준을 전수 검사하여 `EVALUATION_REPORT.md`를 디스크에 생성한다:
  1. **체적 일치율**: 3D 메시 지오메트리 체적 적분치와 수량산출서의 콘크리트 체적 간 허용 오차는 **0.1% 미만**이어야 한다.
  2. **치수 정합성**: 2D SVG/DXF 도면에 표기된 치수선 텍스트는 원본 파라메트릭 입력값과 100% 일치해야 한다.
  3. **IFC 표준 준수**: IFC 4.3 STEP 구문 검사 시 파싱 에러나 결손 엔티티가 없어야 한다.
- 위 3대 기준 중 하나라도 미달 시 즉시 `FAIL` 처리하고 구체적인 수치 오차와 원인을 명시하여 Generator에 재작업을 지시한다.

### 7.3 파일 기반 상태 원장 (File-based Ledger & Context Compaction)
- 컨텍스트 윈도우의 비대화 및 환각을 방지하기 위해, 에이전트 간의 모든 소통과 상태 인수인계는 메모리 대화가 아닌 **디스크의 정형 파일(`PLAN.md`, `PROGRESS.md`, `EVALUATION_REPORT.md`)**을 통해 전달한다.



