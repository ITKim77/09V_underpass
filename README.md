# 지하차도 BIM 웹 기반 설계 소프트웨어 (Underpass Web BIM CAD)

지하차도 인프라 설계 과정에서 파라메트릭 제원 입력을 기반으로 **3대 핵심 산출물(3D BIM 모델, 2D 공학 도면, 공사 수량산출서)**을 실시간 생성·시각화·다운로드하는 웹 기반 CAD/BIM 소프트웨어입니다.

> [!NOTE]
> 본 프로젝트는 사용자 지침에 따라 **구조계산서(하중/단면력 해석) 관련 로직을 배제**하고, 기하 모델링·도면화·적산 자동화에 집중하여 구축되었습니다.

---

## 🚀 3대 핵심 산출물

1. **3D BIM 모델 (WebGL & OpenBIM)**
   - Three.js 기반 실시간 3D 뷰어 (박스 암거, U-Type 가변 옹벽, 헌치, 포장면)
   - 횡단면(Z-Cut), 종단면(X-Cut), 평면절단(Y-Cut) 동적 슬라이서(Clipping Planes)
   - buildingSMART **IFC 4.3 토목 인프라 국제 표준 STEP 파일(`.ifc`)** 내보내기

2. **2D CAD 설계 도면 (SVG & AutoCAD DXF)**
   - 표준횡단면도 (Standard Cross Section): 차로폭, 길어깨, 유효고(4.5m), 슬래브/벽체 두께 치수선
   - 종단면도 (Profile View): 계획고, 원지반선(GL), 구간 분절선, 체이닝 스테이션(STA. 0+000 ~ 0+160)
   - 평면도 (Plan View): 도로 중심선, 차로 분할선, 옹벽 전면선
   - 배근상세도 (Rebar Detail): 주철근, 헌치 대각 보강근, 종방향 배력근, 피복두께(80mm) 반영
   - **AutoCAD 2013/2018 (`AC1027`) 호환 ASCII DXF(`.dxf`)** 및 반응형 SVG 다운로드

3. **공사 수량산출서 (Real-time BoQ)**
   - 콘크리트 체적($m^3$): 3D 메시 적분 체적과 BoQ 적산 체적 간 **오차율 0.0000%** 달성
   - 거푸집 면적($m^2$): 내측, 외측, 헌치 특수 거푸집 전개면적 자동 적산
   - 토공량($m^3$): 원지반선(GL) 대비 Open Cut 터파기량 및 되메우기량 산출
   - 철근 물량($ton$): D16/D19/D22/D25 규격별 단위중량 및 토목 표준 할증률($3\%$) 반영
   - **SheetJS 기반 2개 시트(총괄표, 세부내역서) Excel(`.xlsx`)** 및 UTF-8 BOM CSV 익스포트

---

## 🛠 기술 스택 및 아키텍처

- **Core**: React 18, TypeScript 5 (Strict Mode), Vite, Tailwind CSS
- **3D Graphics**: Three.js, WebGL, Dynamic Clipping Planes
- **2D CAD & Vectors**: Custom CAD Geometry Projection Engine, DXF Serializer, SVG Renderer
- **Data Validation & SSOT**: Zod Schema (도로 시설한계 4.5m 이상 등 법적 기준 강제)
- **Spreadsheet Engine**: SheetJS (`xlsx`)
- **Testing**: Vitest (26/26 Unit Tests 100% Pass)
- **Multi-Agent Architecture**: Anthropic 장기 하네스 (Planner - Generator - Evaluator Triad)

---

## 📁 프로젝트 구조

```text
09V_underpass/
├── CLAUDE.md                   # 에이전트 개발 지침 및 하네스 프로토콜
├── PLAN.md                     # 마일스톤 1~6 세부 실행 계획서
├── PROGRESS.md                 # 실시간 진행 상태 원장 (100% 완료)
├── WORKFLOW.md                 # 다이나믹 에이전트 병렬 분기/동기화(DAG) 명세서
├── MODELS.md                   # 에이전트별 Claude 3.7 / 3.5 모델 티어링 확정서
├── FINAL_QA_AUDIT.md           # Evaluator 전수 감사 보고서 (오차율 0.0000%, ALL PASS)
├── .claude/                    # Claude Code 에이전트, 커맨드, 스킬, 훅 정의
├── scripts/                    # 다이나믹 병렬 오케스트레이션 실행 엔진
├── contracts/                  # 불변 기하 계약 (model_spec.json)
├── src/
│   ├── core/                   # 단일 진실 공급원(SSOT) 코어, Zod 스키마, 도메인 타입
│   ├── features/
│   │   ├── bim-3d/             # Three.js 3D 지오메트리, 동적 슬라이서, IFC 4.3 빌더
│   │   ├── drawing-2d/         # 4종 2D 공학 도면 투영, SVG 뷰어, DXF 익스포터
│   │   ├── quantity/           # 콘크리트/거푸집/토공/철근 정밀 적산, 2시트 Excel/CSV BoQ
│   │   ├── ui-panel/           # 파라메터 폼 사이드바, 3대 탭 뷰어, 통합 다운로드 모달
│   │   └── qa-validator/       # 독립 Evaluator 감사 엔진 (SystemAuditor)
│   ├── App.tsx                 # 전체 웹 CAD 통합 레이아웃
│   └── main.tsx
└── dist/                       # 프로덕션 번들 빌드 아티팩트
```

---

## 💻 실행 및 빌드

### 의존성 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 프로덕션 빌드
```bash
npm run build
```

### 단위 테스트 실행
```bash
npm test
```
