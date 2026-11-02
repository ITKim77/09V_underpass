# /gen-drawings

지하차도 3D 모델로부터 2D 공학 도면 4종(평면도, 종단면도, 표준횡단면도, 배근도)을 벡터 투영하고 SVG/DXF 파일을 생성합니다.

## 실행 절차
1. 3D 단면 절단선 B-Rep 투영을 수행합니다.
2. CAD 표준 레이어(`LAYER_CONC`, `LAYER_REBAR`, `LAYER_DIM`, `LAYER_TEXT`) 분리 여부를 확인합니다.
3. SVG 미리보기 생성 및 AutoCAD 호환 DXF 파일 직렬화 테스트를 실행합니다.

