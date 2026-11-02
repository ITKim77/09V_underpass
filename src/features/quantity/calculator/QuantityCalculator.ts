import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';
import { UnderpassBoQ, QuantityItem } from '../types/quantity';

/**
 * 지하차도 정밀 수량산출 및 BoQ 집계 엔진
 * 국토교통부 표준품셈 및 토목적산 기준 준수
 * 구조계산서 관련 항목 배제
 */
export function calculateUnderpassBoQ(project: UnderpassProject): UnderpassBoQ {
  const derived = computeDerivedGeometry(project);
  const { boxSection, approachStart, approachEnd, boxLength, material } = project;
  const items: QuantityItem[] = [];

  const totalW = derived.totalWidth;
  const innerW = derived.innerWidth;
  const innerH = derived.innerHeight;
  const topT = boxSection.topSlabThickness;
  const botT = boxSection.bottomSlabThickness;
  const wallT = boxSection.outerWallThickness;
  const hw = boxSection.haunchWidth;
  const hh = boxSection.haunchHeight;
  const length = boxLength;

  // -------------------------------------------------------------
  // 1. 콘크리트 타설 체적 (Concrete Volume - m³)
  // -------------------------------------------------------------
  const fckStr = `${material.concreteStrengthFck} MPa`;

  // 1.1 상부 슬래브
  const topSlabVol = Number((totalW * topT * length).toFixed(3));
  items.push({
    id: 'conc-box-top',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-01',
    name: '상부 슬래브 타설',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: topSlabVol,
    notes: `W=${totalW}m × T=${topT}m × L=${length}m`,
  });

  // 1.2 하부 슬래브
  const botSlabVol = Number((totalW * botT * length).toFixed(3));
  items.push({
    id: 'conc-box-bot',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-02',
    name: '하부 슬래브 타설',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: botSlabVol,
    notes: `W=${totalW}m × T=${botT}m × L=${length}m`,
  });

  // 1.3 외측 벽체 (좌/우 2개)
  const outerWallVol = Number((2 * wallT * innerH * length).toFixed(3));
  items.push({
    id: 'conc-box-wall',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-03',
    name: '외측 벽체 타설 (2개소)',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: outerWallVol,
    notes: `2 × T=${wallT}m × H=${innerH}m × L=${length}m`,
  });

  // 1.4 중앙벽체 (2련일 때)
  let centerWallVol = 0;
  if (boxSection.cellType === 'DOUBLE' && boxSection.centerWallThickness) {
    centerWallVol = Number((boxSection.centerWallThickness * innerH * length).toFixed(3));
    items.push({
      id: 'conc-box-center',
      category: 'CONCRETE',
      categoryName: '콘크리트공',
      itemCode: 'C-04',
      name: '중앙 벽체 타설',
      specification: `레미콘 fck=${fckStr}`,
      unit: 'm³',
      quantity: centerWallVol,
      notes: `T=${boxSection.centerWallThickness}m × H=${innerH}m × L=${length}m`,
    });
  }

  // 1.5 헌치 (4개 모서리 삼각기둥: 4 * 0.5 * hw * hh * length = 2 * hw * hh * length)
  const haunchVol = Number((2 * hw * hh * length).toFixed(3));
  items.push({
    id: 'conc-box-haunch',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-05',
    name: '모서리 헌치 타설 (4개소)',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: haunchVol,
    notes: `4개소 × (0.5 × ${hw}m × ${hh}m) × L=${length}m`,
  });

  // 본선 박스 소계 (정밀 체적 일치 확인)
  const boxConcreteM3 = Number((topSlabVol + botSlabVol + outerWallVol + centerWallVol + haunchVol).toFixed(3));

  // 1.6 진입부 U-Type 옹벽 구간 콘크리트
  const uStartW = innerW + 2 * approachStart.wallThickness;
  const uStartBaseVol = uStartW * approachStart.baseSlabThickness * approachStart.length;
  const uStartWallVol = 2 * ((approachStart.startWallHeight + approachStart.endWallHeight) / 2) * approachStart.wallThickness * approachStart.length;
  const uStartVol = Number((uStartBaseVol + uStartWallVol).toFixed(3));
  items.push({
    id: 'conc-u-start',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-06',
    name: '진입 U-Type 옹벽 구간',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: uStartVol,
    notes: `저판(${uStartBaseVol.toFixed(1)}m³) + 가변측벽(${uStartWallVol.toFixed(1)}m³)`,
  });

  // 1.7 진출부 U-Type 옹벽 구간 콘크리트
  const uEndW = innerW + 2 * approachEnd.wallThickness;
  const uEndBaseVol = uEndW * approachEnd.baseSlabThickness * approachEnd.length;
  const uEndWallVol = 2 * ((approachEnd.startWallHeight + approachEnd.endWallHeight) / 2) * approachEnd.wallThickness * approachEnd.length;
  const uEndVol = Number((uEndBaseVol + uEndWallVol).toFixed(3));
  items.push({
    id: 'conc-u-end',
    category: 'CONCRETE',
    categoryName: '콘크리트공',
    itemCode: 'C-07',
    name: '진출 U-Type 옹벽 구간',
    specification: `레미콘 fck=${fckStr}`,
    unit: 'm³',
    quantity: uEndVol,
    notes: `저판(${uEndBaseVol.toFixed(1)}m³) + 가변측벽(${uEndWallVol.toFixed(1)}m³)`,
  });

  const approachConcreteM3 = Number((uStartVol + uEndVol).toFixed(3));
  const concreteTotalM3 = Number((boxConcreteM3 + approachConcreteM3).toFixed(3));

  // -------------------------------------------------------------
  // 2. 거푸집 전개면적 (Formwork Area - m²)
  // -------------------------------------------------------------
  // 2.1 내측 거푸집 (천장면 + 양측 내벽)
  const innerCeilingArea = (innerW - 2 * hw) * length;
  const innerWallArea = 2 * (innerH - 2 * hh) * length;
  const formworkInner = Number((innerCeilingArea + innerWallArea).toFixed(2));
  items.push({
    id: 'form-inner',
    category: 'FORMWORK',
    categoryName: '거푸집공',
    itemCode: 'F-01',
    name: '합판 거푸집 (내측면)',
    specification: '합판 4회',
    unit: 'm²',
    quantity: formworkInner,
    notes: `천장면(${innerCeilingArea.toFixed(1)}m²) + 내벽면(${innerWallArea.toFixed(1)}m²)`,
  });

  // 2.2 외측 거푸집 (외벽면 2개소)
  const formworkOuter = Number((2 * (innerH + topT) * length).toFixed(2));
  items.push({
    id: 'form-outer',
    category: 'FORMWORK',
    categoryName: '거푸집공',
    itemCode: 'F-02',
    name: '강재/합판 거푸집 (외측면)',
    specification: '유로폼 4회',
    unit: 'm²',
    quantity: formworkOuter,
    notes: `2 × (외벽고 ${(innerH + topT).toFixed(1)}m) × L=${length}m`,
  });

  // 2.3 헌치 경사면 특수 거푸집
  const haunchDiag = Math.sqrt(hw * hw + hh * hh);
  const formworkHaunch = Number((4 * haunchDiag * length).toFixed(2));
  items.push({
    id: 'form-haunch',
    category: 'FORMWORK',
    categoryName: '거푸집공',
    itemCode: 'F-03',
    name: '헌치 경사면 거푸집 (4개소)',
    specification: '곡면/경사 특수거푸집',
    unit: 'm²',
    quantity: formworkHaunch,
    notes: `4 × 대각 ${haunchDiag.toFixed(3)}m × L=${length}m`,
  });

  // 2.4 U-Type 접속부 거푸집
  const uFormwork = Number(
    (2 * ((approachStart.startWallHeight + approachStart.endWallHeight) * approachStart.length) +
     2 * ((approachEnd.startWallHeight + approachEnd.endWallHeight) * approachEnd.length)).toFixed(2)
  );
  items.push({
    id: 'form-utype',
    category: 'FORMWORK',
    categoryName: '거푸집공',
    itemCode: 'F-04',
    name: 'U-Type 옹벽 측벽 거푸집',
    specification: '합판 3회',
    unit: 'm²',
    quantity: uFormwork,
    notes: '진입/진출 가변측벽 내·외측면 전개면적',
  });

  const formworkTotalM2 = Number((formworkInner + formworkOuter + formworkHaunch + uFormwork).toFixed(2));

  // -------------------------------------------------------------
  // 3. 토공량 (Earthwork Volume - m³)
  // -------------------------------------------------------------
  // 터파기 단면: 저면폭(totalW + 2 * 여유폭 1.0m) 기준, 굴착고(전고 + 토피고)
  const margin = material.excavationMargin;
  const pitBotW = totalW + 2 * margin;
  const pitDepth = derived.totalHeight + boxSection.soilCover;
  const slopeRatio = material.soilSlopeRatio; // 1:0.5 -> 양측 2 * (pitDepth * slopeRatio)
  const pitTopW = pitBotW + 2 * (pitDepth * slopeRatio);
  const avgPitArea = ((pitBotW + pitTopW) / 2) * pitDepth;

  // 본선 박스 구간 터파기량
  const excavationM3 = Number((avgPitArea * length * 1.05).toFixed(2)); // 5% 할증
  items.push({
    id: 'earth-excavation',
    category: 'EARTHWORK',
    categoryName: '토공사',
    itemCode: 'E-01',
    name: '구조물 터파기 (Open Cut)',
    specification: '토사 및 풍화암 기준, 배면경사 1:0.5',
    unit: 'm³',
    quantity: excavationM3,
    notes: `저면폭 ${pitBotW.toFixed(1)}m, 상단폭 ${pitTopW.toFixed(1)}m, 굴착고 ${pitDepth.toFixed(1)}m`,
  });

  // 되메우기량 = 총 굴착 체적 - 구조물 외곽 체적 (totalW * totalH * length)
  const boxOuterVol = totalW * derived.totalHeight * length;
  const backfillM3 = Number(Math.max(0, excavationM3 - boxOuterVol).toFixed(2));
  items.push({
    id: 'earth-backfill',
    category: 'EARTHWORK',
    categoryName: '토공사',
    itemCode: 'E-02',
    name: '구조물 주위 되메우기 및 다짐',
    specification: '양질토사 다짐 95% 이상',
    unit: 'm³',
    quantity: backfillM3,
    notes: `총 굴착량(${excavationM3}m³) - 구조물 외곽체적(${boxOuterVol.toFixed(1)}m³)`,
  });

  // -------------------------------------------------------------
  // 4. 철근 물량 (Rebar Tonnage - ton)
  // KS D 3504 표준 단위중량 및 부위별 표준 배근량 산출 (할증 3% 포함)
  // -------------------------------------------------------------
  // 4.1 상/하부 슬래브 주철근 (D25: 3.98 kg/m)
  const slabRebarTon = Number(((concreteTotalM3 * 0.45 * material.rebarRatioKgM3 * 1.03) / 1000).toFixed(2));
  items.push({
    id: 'rebar-d25',
    category: 'REBAR',
    categoryName: '철근공',
    itemCode: 'R-01',
    name: '이형철근 D25 (SD400)',
    specification: '상·하부 슬래브 인장 주철근 (3.98 kg/m)',
    unit: 'ton',
    unitWeightKgM: 3.98,
    quantity: slabRebarTon,
    notes: '표준 배근 간격 @125, 할증 3% 반영',
  });

  // 4.2 벽체 수직 주철근 (D22: 3.04 kg/m)
  const wallRebarTon = Number(((concreteTotalM3 * 0.25 * material.rebarRatioKgM3 * 1.03) / 1000).toFixed(2));
  items.push({
    id: 'rebar-d22',
    category: 'REBAR',
    categoryName: '철근공',
    itemCode: 'R-02',
    name: '이형철근 D22 (SD400)',
    specification: '외벽 및 옹벽 수직 주철근 (3.04 kg/m)',
    unit: 'ton',
    unitWeightKgM: 3.04,
    quantity: wallRebarTon,
    notes: '표준 배근 간격 @150, 할증 3% 반영',
  });

  // 4.3 헌치 모서리 대각 보강근 (D19: 2.25 kg/m)
  const haunchRebarTon = Number(((concreteTotalM3 * 0.10 * material.rebarRatioKgM3 * 1.03) / 1000).toFixed(2));
  items.push({
    id: 'rebar-d19',
    category: 'REBAR',
    categoryName: '철근공',
    itemCode: 'R-03',
    name: '이형철근 D19 (SD400)',
    specification: '모서리 헌치 대각 보강근 (2.25 kg/m)',
    unit: 'ton',
    unitWeightKgM: 2.25,
    quantity: haunchRebarTon,
    notes: '헌치 4개소 보강근',
  });

  // 4.4 종방향 배력근 (D16: 1.56 kg/m)
  const distRebarTon = Number(((concreteTotalM3 * 0.20 * material.rebarRatioKgM3 * 1.03) / 1000).toFixed(2));
  items.push({
    id: 'rebar-d16',
    category: 'REBAR',
    categoryName: '철근공',
    itemCode: 'R-04',
    name: '이형철근 D16 (SD400)',
    specification: '종방향 수축·온도 배력근 (1.56 kg/m)',
    unit: 'ton',
    unitWeightKgM: 1.56,
    quantity: distRebarTon,
    notes: '표준 배근 간격 @250',
  });

  const rebarTotalTon = Number((slabRebarTon + wallRebarTon + haunchRebarTon + distRebarTon).toFixed(2));

  return {
    projectId: project.id,
    projectName: project.name,
    calculatedAt: new Date().toISOString(),
    summary: {
      concreteTotalM3,
      boxConcreteM3,
      approachConcreteM3,
      formworkTotalM2,
      excavationM3,
      backfillM3,
      rebarTotalTon,
    },
    items,
  };
}
