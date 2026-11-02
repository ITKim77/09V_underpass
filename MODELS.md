# MODELS.md — 지하차도 BIM 에이전트별 적용 모델 분석 및 확정

본 문서는 지하차도 BIM 웹 기반 설계 소프트웨어 개발 및 운영에 최적화된 **역할별 LLM 파운데이션 모델 배치 전략**을 정의합니다.

---

## 1. 모델 티어링 전략 (Model Tiering Strategy)

에이전트의 인지 부하(Cognitive Load), 수학적/공간적 추론 요구 수준, 토큰 비용 및 응답 속도를 종합적으로 고려하여 다음과 같이 3계층 모델 배치를 확정합니다.

| 계층 | 대상 모델 | 핵심 강점 | 할당 에이전트 |
| :--- | :--- | :--- | :--- |
| **Tier 1 (High Reasoning)** | **Claude 3.7 Sonnet**<br>*(Extended Thinking 활성화)* | 복합 기하 추론, 다차원 제약조건 해석, 깊은 무결성 감사 능력 | • `domain-architect` (Planner)<br>• `evaluator-qa` (Evaluator) |
| **Tier 2 (Code Generation)** | **Claude 3.5 Sonnet** | 복잡한 WebGL 렌더링 파이프라인, IFC 표준 엔티티 빌드, 2D 벡터 CAD 알고리즘 구현력 | • `bim-3d-modeler` (Generator)<br>• `drawing-generator` (Generator) |
| **Tier 3 (Fast Numerical)** | **Claude 3.5 Haiku** | 초고속 레이턴시, 높은 정밀성, 정형 테이블(Excel/CSV) 및 적산 공식 처리 비용 효율성 | • `quantity-estimator` (Generator)<br>• 시스템 커맨드 (`/sync-state`) |

---

## 2. 에이전트별 상세 선정 사유

### 2.1 Planner: `domain-architect` ➔ **Claude 3.7 Sonnet (Thinking)**
- **선정 사유**: 지하차도의 평면·종단 선형과 시설한계(4.5m), 슬래브/벽체 두께 간의 기하학적 종속성을 파악하고 모순 없는 단일 진실 공급원(SSOT) 스키마를 설계하기 위해 **확장 사고(Extended Thinking)** 기반의 고난도 추론이 필수적임.

### 2.2 Evaluator: `evaluator-qa` ➔ **Claude 3.7 Sonnet (Thinking)**
- **선정 사유**: Anthropic 하네스의 핵심인 **자기 평가 편향(Self-Evaluation Bias)을 배제**하고, 3D 체적 적분치와 BoQ 산출서 간의 $0.1\%$ 미만 오차율을 엄격히 검증하기 위해 가장 비판적이고 엄밀한 감사를 수행할 수 있는 최상위 모델 배치가 필수적임.

### 2.3 Generator: `bim-3d-modeler` & `drawing-generator` ➔ **Claude 3.5 Sonnet**
- **선정 사유**: Three.js WebGL `BufferGeometry` 생성, IFC 4.3 STEP 직렬화, DXF ASCII 블록 인코딩 등 방대하고 복잡한 엔지니어링 코드 생성에서 최고 수준의 안정성과 벤치마크 성능을 제공함.

### 2.4 Generator: `quantity-estimator` ➔ **Claude 3.5 Haiku**
- **선정 사유**: 기하 적산 공식(양단면 평균법, 각주공식, 철근 규격별 환산)과 Excel/CSV 내역서 생성은 명확한 수식 규칙을 따르므로, 불필요한 고비용 모델 대신 지연 시간이 가장 짧고 경제적인 Haiku 모델이 최적임.

