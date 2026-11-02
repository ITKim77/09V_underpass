import React, { useState, useMemo } from 'react';
import { UnderpassProject } from '../../../core/types/domain';
import { DrawingType, CadLayer, CadDrawing } from '../types/drawing';
import { generateCrossSectionDrawing } from '../generators/CrossSectionGenerator';
import { generateProfileViewDrawing } from '../generators/ProfileViewGenerator';
import { generatePlanViewDrawing } from '../generators/PlanViewGenerator';
import { generateRebarDetailDrawing } from '../generators/RebarDetailGenerator';
import { renderCadToSvgString, CAD_LAYER_COLORS } from '../exporters/SvgRenderer';
import { downloadDxfFile } from '../exporters/DxfExporter';
import { FileText, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface DrawingViewerProps {
  project: UnderpassProject;
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({ project }) => {
  const [activeTab, setActiveTab] = useState<DrawingType>('CROSS_SECTION');
  const [zoom, setZoom] = useState<number>(1);
  const [layers, setLayers] = useState<Record<CadLayer, boolean>>({
    LAYER_CONC: true,
    LAYER_REBAR: true,
    LAYER_DIM: true,
    LAYER_TEXT: true,
    LAYER_CENTER: true,
    LAYER_HATCH: true,
  });

  // 4종 도면 생성
  const currentDrawing: CadDrawing = useMemo(() => {
    switch (activeTab) {
      case 'CROSS_SECTION':
        return generateCrossSectionDrawing(project);
      case 'PROFILE':
        return generateProfileViewDrawing(project);
      case 'PLAN':
        return generatePlanViewDrawing(project);
      case 'REBAR_DETAIL':
        return generateRebarDetailDrawing(project);
    }
  }, [project, activeTab]);

  const svgXml = useMemo(() => {
    return renderCadToSvgString(currentDrawing, { activeLayers: layers });
  }, [currentDrawing, layers]);

  const toggleLayer = (layer: CadLayer) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleDownloadDxf = () => {
    downloadDxfFile(currentDrawing);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgXml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDrawing.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Drawing Selector Tabs & Actions */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/90 border-b border-slate-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('CROSS_SECTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'CROSS_SECTION' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            표준횡단면도
          </button>
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'PROFILE' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            종단면도
          </button>
          <button
            onClick={() => setActiveTab('PLAN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'PLAN' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            평면도
          </button>
          <button
            onClick={() => setActiveTab('REBAR_DETAIL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === 'REBAR_DETAIL' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
          >
            배근상세도
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG 다운로드</span>
          </button>
          <button
            onClick={handleDownloadDxf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>AutoCAD DXF 다운로드</span>
          </button>
        </div>
      </div>

      {/* Layer Toggle Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">CAD 레이어:</span>
          {(Object.keys(layers) as CadLayer[]).map((layer) => {
            const active = layers[layer];
            const color = CAD_LAYER_COLORS[layer].color;
            return (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition text-[11px] ${active ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-transparent border-transparent text-slate-500 line-through'}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{layer.replace('LAYER_', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
            title="축소"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center font-mono text-slate-300 text-[11px]">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}
            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
            title="확대"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 ml-1"
            title="원위치"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full h-full overflow-auto bg-[#090d16] p-4 flex items-center justify-center">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-100 max-w-full max-h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgXml }}
        />

        {/* Drawing Badge (Bottom Left) */}
        <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center gap-2 pointer-events-none">
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-slate-100">{currentDrawing.title}</span>
          <span className="text-slate-400">|</span>
          <span className="text-amber-400 font-mono">축척 {currentDrawing.scale}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400">{currentDrawing.entities.length}개 CAD 엔티티</span>
        </div>
      </div>
    </div>
  );
};

