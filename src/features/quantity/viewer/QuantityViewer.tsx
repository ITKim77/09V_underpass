import React, { useState, useMemo } from 'react';
import { UnderpassProject } from '../../../core/types/domain';
import { QuantityCategory } from '../types/quantity';
import { calculateUnderpassBoQ } from '../calculator/QuantityCalculator';
import { downloadBoqExcel, downloadBoqCsv } from '../exporters/BoqExcelExporter';
import { Calculator, Download, Table, FileSpreadsheet, Layers, Pickaxe } from 'lucide-react';

interface QuantityViewerProps {
  project: UnderpassProject;
}

export const QuantityViewer: React.FC<QuantityViewerProps> = ({ project }) => {
  const [selectedCat, setSelectedCat] = useState<QuantityCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const boq = useMemo(() => calculateUnderpassBoQ(project), [project]);

  const filteredItems = useMemo(() => {
    return boq.items.filter((item) => {
      const matchCat = selectedCat === 'ALL' || item.category === selectedCat;
      const matchSearch =
        searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specification.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [boq, selectedCat, searchTerm]);

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl text-slate-200">
      {/* Top Header & Export Actions */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-800/90 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              실시간 적산 및 공사 수량산출서 (Bill of Quantities)
            </h2>
            <p className="text-[11px] text-slate-400">
              단면 적분식 기반 물량 집계 • 구조계산서 항목 제외
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadBoqCsv(boq)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 내보내기</span>
          </button>
          <button
            onClick={() => downloadBoqExcel(boq)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel 내역서 다운로드 (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/50 border-b border-slate-800">
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>총 콘크리트 체적</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-300">
            {boq.summary.concreteTotalM3.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
          <div className="text-[11px] text-slate-400">
            본선 {boq.summary.boxConcreteM3.toLocaleString()} m³ • U형 {boq.summary.approachConcreteM3.toLocaleString()} m³
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>총 거푸집 전개면적</span>
            <Table className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {boq.summary.formworkTotalM2.toLocaleString()} <span className="text-xs font-normal text-slate-400">m²</span>
          </div>
          <div className="text-[11px] text-slate-400">
            내측/외측 및 헌치 특수거푸집
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>토공량 (터파기 / 되메우기)</span>
            <Pickaxe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {boq.summary.excavationM3.toLocaleString()} <span className="text-xs font-normal text-slate-400">m³</span>
          </div>
          <div className="text-[11px] text-slate-400">
            되메우기: {boq.summary.backfillM3.toLocaleString()} m³
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>총 소요 철근량</span>
            <span className="text-[11px] font-mono text-rose-400">SD400</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">
            {boq.summary.rebarTotalTon.toLocaleString()} <span className="text-xs font-normal text-slate-400">ton</span>
          </div>
          <div className="text-[11px] text-slate-400">
            D16/D19/D22/D25 (할증 3% 포함)
          </div>
        </div>
      </div>

      {/* Category Filter & Search Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/40 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${selectedCat === 'ALL' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            전체 내역 ({boq.items.length})
          </button>
          <button
            onClick={() => setSelectedCat('CONCRETE')}
            className={`px-3 py-1 rounded-lg font-medium transition ${selectedCat === 'CONCRETE' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            콘크리트공
          </button>
          <button
            onClick={() => setSelectedCat('FORMWORK')}
            className={`px-3 py-1 rounded-lg font-medium transition ${selectedCat === 'FORMWORK' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            거푸집공
          </button>
          <button
            onClick={() => setSelectedCat('EARTHWORK')}
            className={`px-3 py-1 rounded-lg font-medium transition ${selectedCat === 'EARTHWORK' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            토공사
          </button>
          <button
            onClick={() => setSelectedCat('REBAR')}
            className={`px-3 py-1 rounded-lg font-medium transition ${selectedCat === 'REBAR' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            철근공
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="품명, 코드, 규격 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-56"
          />
        </div>
      </div>

      {/* Itemized Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-800/80 sticky top-0 border-b border-slate-700 text-slate-300 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-16">코드</th>
              <th className="py-2.5 px-3 w-24">공종</th>
              <th className="py-2.5 px-4">품명</th>
              <th className="py-2.5 px-4">규격 및 산출식</th>
              <th className="py-2.5 px-3 w-16 text-center">단위</th>
              <th className="py-2.5 px-4 text-right font-mono">수량</th>
              <th className="py-2.5 px-4 text-slate-400">산출근거/비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-normal">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/40 transition">
                <td className="py-2.5 px-3 font-mono text-slate-400">{item.itemCode}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      item.category === 'CONCRETE'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : item.category === 'FORMWORK'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : item.category === 'EARTHWORK'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {item.categoryName}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-medium text-slate-100">{item.name}</td>
                <td className="py-2.5 px-4 text-slate-300">{item.specification}</td>
                <td className="py-2.5 px-3 text-center text-slate-400">{item.unit}</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">
                  {item.quantity.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
                </td>
                <td className="py-2.5 px-4 text-slate-400 text-[11px]">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

