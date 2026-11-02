import { useState, useMemo } from 'react';
import { getDefaultUnderpassProject, computeDerivedGeometry } from './core';
import { UnderpassProject } from './core/types/domain';
import { BimViewer } from './features/bim-3d';
import { DrawingViewer } from './features/drawing-2d';
import { QuantityViewer } from './features/quantity';
import { ParameterSidebar, ExportModal } from './features/ui-panel';
import { Box, FileText, Calculator, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

type ActiveTab = 'BIM_3D' | 'DRAWING_2D' | 'BOQ_QUANTITY';

export function App() {
  const [project, setProject] = useState<UnderpassProject>(getDefaultUnderpassProject());
  const [activeTab, setActiveTab] = useState<ActiveTab>('BIM_3D');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const derived = useMemo(() => computeDerivedGeometry(project), [project]);

  const handleResetProject = () => {
    setProject(getDefaultUnderpassProject());
  };

  return (
    <div className="flex flex-col w-full h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. Global Header Bar */}
      <header className="h-14 border-b border-slate-800 px-5 flex items-center justify-between bg-slate-900/90 backdrop-blur z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-black text-white shadow-md text-xs">
              09
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                지하차도 BIM 웹 설계 소프트웨어
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                  IFC 4.3 • DXF • BoQ
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center Quick Derived Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs bg-slate-800/60 border border-slate-700/80 px-4 py-1.5 rounded-full">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">외곽 전폭:</span>
            <span className="font-mono font-bold text-sky-300">{derived.totalWidth}m</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">외곽 전고:</span>
            <span className="font-mono font-bold text-sky-300">{derived.totalHeight}m</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">총 연장:</span>
            <span className="font-mono font-bold text-sky-300">{derived.totalProjectLength}m</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-400 hidden lg:block">
            구조계산서 배제 • SSOT 파라메트릭 모델
          </div>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>산출물 통합 내보내기</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left Collapsible Parameter Sidebar */}
        {isSidebarOpen && (
          <ParameterSidebar
            project={project}
            onChange={setProject}
            onReset={handleResetProject}
          />
        )}

        {/* Main View Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* View Mode Tab Switcher Bar */}
          <div className="h-11 px-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('BIM_3D')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'BIM_3D'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>1. 3D BIM 모델 뷰어 (WebGL)</span>
              </button>

              <button
                onClick={() => setActiveTab('DRAWING_2D')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'DRAWING_2D'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. 2D CAD 설계 도면 (SVG / DXF)</span>
              </button>

              <button
                onClick={() => setActiveTab('BOQ_QUANTITY')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'BOQ_QUANTITY'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>3. 공사 수량산출서 (BoQ Excel)</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {activeTab === 'BIM_3D' && 'Three.js 3D 실시간 뷰어 • 동적 단면 절단 • IFC 4.3'}
              {activeTab === 'DRAWING_2D' && '횡단면도 • 종단면도 • 평면도 • 배근상세도'}
              {activeTab === 'BOQ_QUANTITY' && '콘크리트 • 거푸집 • 토공 • 철근 정밀 적산'}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 p-3 overflow-hidden">
            {activeTab === 'BIM_3D' && <BimViewer project={project} />}
            {activeTab === 'DRAWING_2D' && <DrawingViewer project={project} />}
            {activeTab === 'BOQ_QUANTITY' && <QuantityViewer project={project} />}
          </div>
        </div>
      </div>

      {/* Global Export Package Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />
    </div>
  );
}

export default App;
