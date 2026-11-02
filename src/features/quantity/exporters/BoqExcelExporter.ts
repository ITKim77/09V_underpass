import * as XLSX from 'xlsx';
import { UnderpassBoQ } from '../types/quantity';

/**
 * BoQ 수량산출서를 실무 표준 Excel (.xlsx) 바이너리 워크북으로 변환
 */
export function generateBoqExcelWorkbook(boq: UnderpassBoQ): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. 총괄표 (Summary Sheet)
  const summaryRows = [
    ['지하차도 인프라 BIM 공사 수량산출 총괄표 (Summary BoQ)'],
    [`프로젝트명: ${boq.projectName}`, '', `산출일시: ${boq.calculatedAt.slice(0, 10)}`],
    [],
    ['순번', '주요 공종', '산출 수량', '단위', '비고'],
    [1, '콘크리트공 (본선 박스암거)', boq.summary.boxConcreteM3, 'm³', 'fck=30MPa 기준'],
    [2, '콘크리트공 (U-Type 접속부)', boq.summary.approachConcreteM3, 'm³', '진입/진출 가변 옹벽'],
    [3, '콘크리트공 (총계)', boq.summary.concreteTotalM3, 'm³', '전체 구조물 타설 체적'],
    [4, '거푸집공 (총계)', boq.summary.formworkTotalM2, 'm²', '내·외측 및 헌치 특수거푸집'],
    [5, '토공사 (구조물 터파기)', boq.summary.excavationM3, 'm³', 'Open Cut, 배면경사 1:0.5'],
    [6, '토공사 (되메우기 및 다짐)', boq.summary.backfillM3, 'm³', '양질토사 다짐'],
    [7, '철근공 (총계)', boq.summary.rebarTotalTon, 'ton', 'SD400 규격 (할증 3% 반영)'],
    [],
    ['* 본 수량산출서는 구조계산서 항목이 배제된 BIM 파라메트릭 기하 적산 결과입니다.'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, '수량총괄표');

  // 2. 세부 내역표 (Detailed Items Sheet)
  const detailHeaders = [
    '공종코드',
    '공종구분',
    '품명',
    '규격 및 산출식',
    '단위',
    '수량',
    '단위중량(kg/m)',
    '비고/산출근거',
  ];

  const detailRows = boq.items.map((item) => [
    item.itemCode,
    item.categoryName,
    item.name,
    item.specification,
    item.unit,
    item.quantity,
    item.unitWeightKgM || '-',
    item.notes || '-',
  ]);

  const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
  XLSX.utils.book_append_sheet(wb, wsDetail, '세부수량집계표');

  // Excel 바이너리 반환
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbOut);
}

/**
 * BoQ 수량산출서를 CSV 텍스트 문자열로 변환 (UTF-8 with BOM)
 */
export function generateBoqCsvString(boq: UnderpassBoQ): string {
  const rows: string[] = [];

  // UTF-8 BOM
  const bom = '\uFEFF';
  rows.push('공종코드,공종구분,품명,규격,단위,수량,단위중량(kg/m),산출근거');

  boq.items.forEach((item) => {
    const spec = `"${item.specification.replace(/"/g, '""')}"`;
    const notes = `"${(item.notes || '').replace(/"/g, '""')}"`;
    rows.push(
      `${item.itemCode},${item.categoryName},${item.name},${spec},${item.unit},${item.quantity},${item.unitWeightKgM || ''},${notes}`
    );
  });

  return bom + rows.join('\r\n');
}

/**
 * 브라우저 환경에서 Excel 파일 다운로드 트리거
 */
export function downloadBoqExcel(boq: UnderpassBoQ) {
  if (typeof window === 'undefined' || !window.document) return;
  const data = generateBoqExcelWorkbook(boq);
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BoQ_Underpass_${boq.projectId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 브라우저 환경에서 CSV 파일 다운로드 트리거
 */
export function downloadBoqCsv(boq: UnderpassBoQ) {
  if (typeof window === 'undefined' || !window.document) return;
  const csv = generateBoqCsvString(boq);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BoQ_Underpass_${boq.projectId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
