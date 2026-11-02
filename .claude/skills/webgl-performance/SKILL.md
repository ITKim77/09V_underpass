---
name: webgl-performance
description: Three.js 기반 대규모 토목 인프라 지오메트리 최적화, Web Worker 연산, 가비지 컬렉션 방지 전문 스킬
---

# WebGL 및 Three.js 브라우저 최적화 기법

## 1. 메모리 및 지오메트리 최적화
- **`BufferGeometry` 직접 생성**: 불필요한 추상화 레이어를 줄이고 `Float32Array` 버퍼로 정점(Position, Normal, UV) 및 인덱스 직접 구성.
- **`mergeGeometries` 및 드로우콜 축소**: 동일 재질의 구조체 세그먼트는 단일 메시로 병합하여 드로우 콜을 50개 이하로 유지.
- **반복 부재 `InstancedMesh` 활용**: 가드레일 지주, 배수구 덮개, 지수판 등 반복 객체는 인스턴싱 처리.

## 2. Web Worker 기반 비동기 파이프라인
- 대규모 선형 스윕(Sweep) 연산 및 IFC STEP 텍스트 파싱/생성은 메인 UI 스레드가 아닌 Web Worker에서 처리.
- `postMessage` 전달 시 `ArrayBuffer`의 Transferable Objects를 사용하여 메모리 복사 비용(0ms) 제거.

## 3. 동적 단면 뷰 (Dynamic Clipping)
- Three.js `renderer.clippingPlanes`를 활용하여 지오메트리를 재생성하지 않고 셰이더 레벨에서 실시간 3D 단면을 시각화.

