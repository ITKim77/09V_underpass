---
name: cad-dxf-standards
description: 토목 2D CAD 도면 표준 레이어링 규칙, 치수선 스타일, 배근도 표기법 및 DXF ASCII 규격 가이드
---

# 토목 2D CAD 도면 및 DXF 표준

## 1. 표준 CAD 레이어 체계
| 레이어 명 | 용도 | 색상 (AutoCAD Index) | 선종 (Linetype) |
| :--- | :--- | :---: | :--- |
| `LAYER_CONC` | 콘크리트 외곽선 및 구조체 단면선 | 7 (White/Black) | CONTINUOUS |
| `LAYER_REBAR` | 주철근 및 배력근 배근선 | 1 (Red) | CONTINUOUS |
| `LAYER_DIM` | 치수선 및 치수 보조선 | 3 (Green) | CONTINUOUS |
| `LAYER_TEXT` | 단면 명칭, 주기, 범례 텍스트 | 2 (Yellow) | CONTINUOUS |
| `LAYER_CENTER`| 도로 중심선, 차로 분할 중심선 | 4 (Cyan) | CENTER |
| `LAYER_HIDDEN`| 보이지 않는 모서리 및 매립 배관선 | 8 (Gray) | HIDDEN |

## 2. 치수선 및 텍스트 표준
- 화살표 스타일: Closed Filled (크기: 도면 축척에 맞춤)
- 치수 단위: mm (소수점 미표기 원칙, 필요 시 1자리)
- 폰트: ISO/굴림/Arial 표준 호환

## 3. DXF 파일 호환성
- 포맷 버전: AutoCAD 2013/2018 DXF (AC1027/AC1032)
- 필수 섹션: HEADER, TABLES (LAYERS, LTYPES), BLOCKS, ENTITIES, EOF

