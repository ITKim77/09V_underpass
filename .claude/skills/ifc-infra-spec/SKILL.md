---
name: ifc-infra-spec
description: IFC 4.3 토목 인프라(Civil Infrastructure) 엔티티 계층 구조, 도로 선형, 속성셋(Pset) 작성 전문 스킬
---

# IFC 4.3 인프라 표준 규격 가이드

## 1. 공간 구조 체계 (Spatial Structure)
- `IfcProject`
  - `IfcSite`
    - `IfcFacility` (PredefinedType: `ROAD`)
      - `IfcFacilityPart` (지하차도 본체 구간: `ROADWAY_STRUCTURE`, U-Type 접속부: `APPROACH`)

## 2. 부재 엔티티 매핑
- 상·하부 슬래브: `IfcSlab` (PredefinedType: `BASESLAB`, `FLOOR`)
- 외벽 및 중간벽: `IfcWall` (PredefinedType: `SOLIDWALL`, `RETAININGWALL`)
- 헌치 및 모서리 보강: `IfcMember` 또는 통합 Solid B-Rep
- 기초부: `IfcFooting`

## 3. 필수 속성셋 (Pset) 정의
- `Pset_ConcreteElementGeneral`: 강도 등급($f_{ck}$), 타설 일자, 양생 기준
- `Pset_CivilElementCommon`: 설계 속도, 도로 등급, 차로 번호
- `Pset_QuantityTakeOff`: 공학적 체적, 단면적, 표면적

