import { CadDrawing } from '../types/drawing';

/**
 * AutoCAD 호환 ASCII DXF 파일 생성기 (AC1027 표준)
 */
export function generateDxfString(drawing: CadDrawing): string {
  const lines: string[] = [];

  // DXF 코드/값 추가 헬퍼
  const emit = (code: number, val: string | number) => {
    lines.push(code.toString());
    lines.push(val.toString());
  };

  // 1. HEADER SECTION
  emit(0, 'SECTION');
  emit(2, 'HEADER');
  emit(9, '$ACADVER');
  emit(1, 'AC1027'); // AutoCAD 2013/2018 호환
  emit(9, '$INSUNITS');
  emit(70, 4); // Millimeters (mm)
  emit(9, '$EXTMIN');
  emit(10, drawing.bounds.minX);
  emit(20, drawing.bounds.minY);
  emit(30, 0.0);
  emit(9, '$EXTMAX');
  emit(10, drawing.bounds.maxX);
  emit(20, drawing.bounds.maxY);
  emit(30, 0.0);
  emit(0, 'ENDSEC');

  // 2. TABLES SECTION (LAYERS)
  emit(0, 'SECTION');
  emit(2, 'TABLES');
  emit(0, 'TABLE');
  emit(2, 'LAYER');
  emit(70, 6);

  const layerColors: Record<string, number> = {
    LAYER_CONC: 7,   // White / Black
    LAYER_REBAR: 1,  // Red
    LAYER_DIM: 3,    // Green
    LAYER_TEXT: 2,   // Yellow
    LAYER_CENTER: 4, // Cyan
    LAYER_HATCH: 8,  // Gray
  };

  Object.entries(layerColors).forEach(([layerName, colorNum]) => {
    emit(0, 'LAYER');
    emit(2, layerName);
    emit(70, 0);
    emit(62, colorNum);
    emit(6, 'CONTINUOUS');
  });

  emit(0, 'ENDTAB');
  emit(0, 'ENDSEC');

  // 3. BLOCKS SECTION
  emit(0, 'SECTION');
  emit(2, 'BLOCKS');
  emit(0, 'ENDSEC');

  // 4. ENTITIES SECTION
  emit(0, 'SECTION');
  emit(2, 'ENTITIES');

  drawing.entities.forEach((entity) => {
    switch (entity.type) {
      case 'LINE':
        emit(0, 'LINE');
        emit(8, entity.layer);
        emit(10, entity.start.x);
        emit(20, entity.start.y);
        emit(30, 0.0);
        emit(11, entity.end.x);
        emit(21, entity.end.y);
        emit(31, 0.0);
        break;

      case 'POLYLINE':
        emit(0, 'LWPOLYLINE');
        emit(8, entity.layer);
        emit(90, entity.points.length);
        emit(70, entity.closed ? 1 : 0);
        entity.points.forEach((p) => {
          emit(10, p.x);
          emit(20, p.y);
        });
        break;

      case 'CIRCLE':
        emit(0, 'CIRCLE');
        emit(8, entity.layer);
        emit(10, entity.center.x);
        emit(20, entity.center.y);
        emit(30, 0.0);
        emit(40, entity.radius);
        break;

      case 'TEXT':
        emit(0, 'TEXT');
        emit(8, entity.layer);
        emit(10, entity.position.x);
        emit(20, entity.position.y);
        emit(30, 0.0);
        emit(40, entity.fontSize);
        emit(1, entity.text);
        if (entity.rotation) {
          emit(50, entity.rotation);
        }
        break;

      case 'DIMENSION': {
        const isHoriz = entity.orientation === 'HORIZONTAL';
        let x1 = entity.start.x;
        let y1 = entity.start.y;
        let x2 = entity.end.x;
        let y2 = entity.end.y;

        if (isHoriz) {
          y1 += entity.offset;
          y2 += entity.offset;
        } else {
          x1 += entity.offset;
          x2 += entity.offset;
        }

        // 치수선 및 지시선
        emit(0, 'LINE');
        emit(8, entity.layer);
        emit(10, x1);
        emit(20, y1);
        emit(30, 0.0);
        emit(11, x2);
        emit(21, y2);
        emit(31, 0.0);

        // 치수 문자
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 + 60;
        emit(0, 'TEXT');
        emit(8, 'LAYER_TEXT');
        emit(10, midX);
        emit(20, midY);
        emit(30, 0.0);
        emit(40, 180);
        emit(1, entity.textOverride || `${Math.round(entity.measurement * 1000)}`);
        break;
      }
    }
  });

  emit(0, 'ENDSEC');
  emit(0, 'EOF');

  return lines.join('\r\n');
}

/**
 * 브라우저 환경에서 DXF 파일 다운로드 트리거
 */
export function downloadDxfFile(drawing: CadDrawing) {
  if (typeof window === 'undefined' || !window.document) return;
  const dxfString = generateDxfString(drawing);
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${drawing.id}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

