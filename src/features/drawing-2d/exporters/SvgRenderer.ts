import { CadDrawing, CadLayer } from '../types/drawing';

export interface SvgRenderOptions {
  activeLayers?: Record<CadLayer, boolean>;
  padding?: number;
}

export const CAD_LAYER_COLORS: Record<CadLayer, { color: string; width: number; dash?: string }> = {
  LAYER_CONC: { color: '#e2e8f0', width: 2 },
  LAYER_REBAR: { color: '#ef4444', width: 2.2 },
  LAYER_DIM: { color: '#10b981', width: 1.2 },
  LAYER_TEXT: { color: '#fbbf24', width: 1 },
  LAYER_CENTER: { color: '#38bdf8', width: 1.2, dash: '8,4,2,4' },
  LAYER_HATCH: { color: '#64748b', width: 1 },
};

/**
 * CadDrawing을 표준 SVG XML 문자열로 변환
 */
export function renderCadToSvgString(drawing: CadDrawing, options?: SvgRenderOptions): string {
  const { minX, minY, width, height } = drawing.bounds;
  const activeLayers = options?.activeLayers;

  const filteredEntities = drawing.entities.filter((entity) => {
    if (activeLayers && activeLayers[entity.layer] === false) return false;
    return true;
  });

  const svgElements: string[] = [];

  // Y축 반전: CAD는 Y축 위쪽이 양수, SVG는 아래쪽이 양수
  // transform="scale(1, -1)" 또는 직접 좌표 변환 (svgY = maxY - (y - minY))
  const transformY = (y: number) => -(y);

  filteredEntities.forEach((entity, idx) => {
    const style = CAD_LAYER_COLORS[entity.layer];
    const stroke = style.color;
    const strokeWidth = style.width;
    const strokeDash = entity.type === 'LINE' && entity.strokeDash ? entity.strokeDash : (style.dash || 'none');

    switch (entity.type) {
      case 'LINE':
        svgElements.push(
          `<line key="${idx}" x1="${entity.start.x}" y1="${transformY(entity.start.y)}" x2="${entity.end.x}" y2="${transformY(entity.end.y)}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" />`
        );
        break;

      case 'POLYLINE': {
        const pts = entity.points.map((p) => `${p.x},${transformY(p.y)}`).join(' ');
        if (entity.closed) {
          svgElements.push(
            `<polygon key="${idx}" points="${pts}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />`
          );
        } else {
          svgElements.push(
            `<polyline key="${idx}" points="${pts}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" />`
          );
        }
        break;
      }

      case 'CIRCLE':
        svgElements.push(
          `<circle key="${idx}" cx="${entity.center.x}" cy="${transformY(entity.center.y)}" r="${entity.radius}" fill="${entity.filled ? stroke : 'none'}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
        );
        break;

      case 'TEXT': {
        const anchor = entity.anchor || 'start';
        const rot = entity.rotation || 0;
        const x = entity.position.x;
        const y = transformY(entity.position.y);
        const transform = rot !== 0 ? `transform="rotate(${rot}, ${x}, ${y})"` : '';
        svgElements.push(
          `<text key="${idx}" x="${x}" y="${y}" fill="${stroke}" font-size="${entity.fontSize}" text-anchor="${anchor}" font-family="monospace, sans-serif" ${transform}>${entity.text}</text>`
        );
        break;
      }

      case 'DIMENSION': {
        // 치수선 및 치수 보조선
        const isHoriz = entity.orientation === 'HORIZONTAL';
        let x1 = entity.start.x;
        let y1 = transformY(entity.start.y);
        let x2 = entity.end.x;
        let y2 = transformY(entity.end.y);

        if (isHoriz) {
          y1 += -entity.offset;
          y2 += -entity.offset;
        } else {
          x1 += entity.offset;
          x2 += entity.offset;
        }

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 80;
        const label = entity.textOverride || `${Math.round(entity.measurement * 1000)}`;

        svgElements.push(
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
        );
        svgElements.push(
          `<circle cx="${x1}" cy="${y1}" r="30" fill="${stroke}" />`
        );
        svgElements.push(
          `<circle cx="${x2}" cy="${y2}" r="30" fill="${stroke}" />`
        );
        svgElements.push(
          `<text x="${midX}" y="${midY}" fill="${stroke}" font-size="200" text-anchor="middle" font-family="monospace">${label}</text>`
        );
        break;
      }
    }
  });

  const viewBoxY = -(minY + height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${viewBoxY} ${width} ${height}" width="100%" height="100%" style="background-color: #090d16;">\n${svgElements.join('\n')}\n</svg>`;
}
