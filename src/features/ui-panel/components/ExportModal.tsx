import React from 'react';
import { UnderpassProject } from '../../../core/types/domain';
import { generateIfc4x3, downloadIfcFile } from '../../bim-3d';
import { generateCrossSectionDrawing, generateProfileViewDrawing, generatePlanViewDrawing, generateRebarDetailDrawing, downloadDxfFile } from '../../drawing-2d';
import { calculateUnderpassBoQ, downloadBoqExcel, downloadBoqCsv } from '../../quantity';
import { X, Box, FileText, FileSpreadsheet, Download, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: UnderpassProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  if (!isOpen) return null;

  const handleExportAll = () => {
    // 1. IFC 4.3 다운로드
    const ifc = generateIfc4x3(project);
    downloadIfcFile(ifc);

    // 2. DXF 도면 4종 다운로드
    const dwg1 = generateCrossSectionDrawing(project);
    const dwg2 = generateProfileViewDrawing(project);
    const dwg3 = generatePlanViewDrawing(project);
    const dwg4 = generateRebarDetailDrawing(project);
    setTimeout(() => downloadDxfFile(dwg1), 300);
    setTimeout(() => downloadDxfFile(dwg2), 600);
    setTimeout(() => downloadDxfFile(dwg3), 900);
    setTimeout(() => downloadDxfFile(dwg4), 1200);

    // 3. BoQ Excel 다운로드
    const boq = calculateUnderpassBoQ(project);
    setTimeout(() => downloadBoqExcel(boq), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">설계 산출물 통합 내보내기</h3>
              <p className="text-[11px] text-slate-400">3대 핵심 산출물 (3D BIM, 2D CAD, 수량산출서) 패키지</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Card 1: 3D BIM */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-sky-400" />
              <div>
                <div className="font-semibold text-slate-100">3D BIM 모델 (.ifc)</div>
                <div className="text-[11px] text-slate-400">IFC 4.3 토목 인프라 표준 STEP 파일</div>
              </div>
            </div>
            <button
              onClick={() => downloadIfcFile(generateIfc4x3(project))}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-slate-200 transition"
            >
              다운로드
            </button>
          </div>

          {/* Card 2: 2D CAD */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-slate-100">2D 공학 도면 4종 (.dxf)</div>
                <div className="text-[11px] text-slate-400">AutoCAD 2018 호환 (횡단/종단/평면/배근도)</div>
              </div>
            </div>
            <button
              onClick={() => downloadDxfFile(generateCrossSectionDrawing(project))}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-slate-200 transition"
            >
              다운로드
            </button>
          </div>

          {/* Card 3: BoQ */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <div>
                <div className="font-semibold text-slate-100">공사 수량산출서 (.xlsx / .csv)</div>
                <div className="text-[11px] text-slate-400">총괄표 및 세부집계표 2시트 Excel 통합본</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => downloadBoqCsv(calculateUnderpassBoQ(project))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-slate-300 transition"
              >
                CSV
              </button>
              <button
                onClick={() => downloadBoqExcel(calculateUnderpassBoQ(project))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium text-slate-200 transition"
              >
                Excel
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>모든 산출물은 단일 파라메터 모델(SSOT)로부터 100% 동기화되어 생성됩니다.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">구조계산서 배제 원칙 준수</span>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>전체 산출물 일괄 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};

