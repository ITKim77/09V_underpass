import React from 'react';
import { UnderpassProject } from '../../../core/types/domain';
import { validateUnderpassProject } from '../../../core/model/UnderpassModel';
import { Settings2, AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';

interface ParameterSidebarProps {
  project: UnderpassProject;
  onChange: (updated: UnderpassProject) => void;
  onReset: () => void;
}

export const ParameterSidebar: React.FC<ParameterSidebarProps> = ({
  project,
  onChange,
  onReset,
}) => {
  const validation = validateUnderpassProject(project);

  const updateAlignment = (field: keyof UnderpassProject['alignment'], value: number) => {
    onChange({
      ...project,
      alignment: {
        ...project.alignment,
        [field]: value,
      },
    });
  };

  const updateBox = (field: keyof UnderpassProject['boxSection'], value: string | number | undefined) => {
    onChange({
      ...project,
      boxSection: {
        ...project.boxSection,
        [field]: value,
      },
    });
  };

  const updateApproach = (
    type: 'approachStart' | 'approachEnd',
    field: keyof UnderpassProject['approachStart'],
    value: number
  ) => {
    onChange({
      ...project,
      [type]: {
        ...project[type],
        [field]: value,
      },
    });
  };

  return (
    <aside className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col text-xs text-slate-200 select-none shadow-xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Settings2 className="w-4 h-4 text-sky-400" />
          <span>설계 파라메터 설정 (SSOT)</span>
        </div>
        <button
          onClick={onReset}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="초기값 복원"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Validation Status Banner */}
      <div className={`px-4 py-2 border-b flex items-center gap-2 text-[11px] ${
        validation.success
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
      }`}>
        {validation.success ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>설계 기준 및 기하 제약 적합 (KS 표준)</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{validation.errors?.[0] || '파라메터 유효성 오류'}</span>
          </>
        )}
      </div>

      {/* Form Fields Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* 1. 기본 정보 및 본선 연장 */}
        <section className="space-y-2.5">
          <h3 className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
            1. 프로젝트 기본 정보
          </h3>
          <div className="space-y-1">
            <label className="text-slate-400">프로젝트명</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => onChange({ ...project, name: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-slate-400">본선 박스 암거 연장 (L)</label>
              <span className="font-mono text-sky-400">{project.boxLength}m</span>
            </div>
            <input
              type="range"
              min={20}
              max={300}
              step={5}
              value={project.boxLength}
              onChange={(e) => onChange({ ...project, boxLength: parseFloat(e.target.value) })}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>
        </section>

        {/* 2. 도로 및 선형 제원 */}
        <section className="space-y-2.5 pt-3 border-t border-slate-800">
          <h3 className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
            2. 도로 및 차로 제원
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">차로 수</label>
              <select
                value={project.alignment.laneCount}
                onChange={(e) => updateAlignment('laneCount', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value={1}>1차로</option>
                <option value={2}>2차로</option>
                <option value={3}>3차로</option>
                <option value={4}>4차로</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-slate-400">차로 폭</label>
                <span className="font-mono text-sky-400">{project.alignment.laneWidth}m</span>
              </div>
              <input
                type="number"
                min={3.0}
                max={3.75}
                step={0.25}
                value={project.alignment.laneWidth}
                onChange={(e) => updateAlignment('laneWidth', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">좌측 길어깨</label>
              <input
                type="number"
                min={0.5}
                max={2.0}
                step={0.25}
                value={project.alignment.shoulderLeft}
                onChange={(e) => updateAlignment('shoulderLeft', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">우측 길어깨</label>
              <input
                type="number"
                min={0.5}
                max={2.0}
                step={0.25}
                value={project.alignment.shoulderRight}
                onChange={(e) => updateAlignment('shoulderRight', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        </section>

        {/* 3. 암거 박스 구조 단면 */}
        <section className="space-y-2.5 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              3. 암거 박스 구조 단면
            </h3>
            <span className="text-[10px] text-amber-400 font-medium">유효고 ≥ 4.5m</span>
          </div>

          {/* 형식 선택 (1련 vs 2련) */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => updateBox('cellType', 'SINGLE')}
              className={`py-1 text-center rounded font-medium transition ${
                project.boxSection.cellType === 'SINGLE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1련 박스 (Single)
            </button>
            <button
              onClick={() => {
                updateBox('cellType', 'DOUBLE');
                if (!project.boxSection.centerWallThickness) {
                  updateBox('centerWallThickness', 0.6);
                }
              }}
              className={`py-1 text-center rounded font-medium transition ${
                project.boxSection.cellType === 'DOUBLE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2련 박스 (Double)
            </button>
          </div>

          {/* 시설한계 높이 */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-slate-400 flex items-center gap-1">
                <span>시설한계 유효높이 (H)</span>
                {project.boxSection.clearanceHeight < 4.5 && (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
              </label>
              <span className={`font-mono font-bold ${project.boxSection.clearanceHeight < 4.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {project.boxSection.clearanceHeight}m
              </span>
            </div>
            <input
              type="range"
              min={4.0}
              max={6.5}
              step={0.1}
              value={project.boxSection.clearanceHeight}
              onChange={(e) => updateBox('clearanceHeight', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* 두께 제원 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">상부 슬래브 두께</label>
              <input
                type="number"
                min={0.6}
                max={2.0}
                step={0.1}
                value={project.boxSection.topSlabThickness}
                onChange={(e) => updateBox('topSlabThickness', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">하부 슬래브 두께</label>
              <input
                type="number"
                min={0.6}
                max={2.0}
                step={0.1}
                value={project.boxSection.bottomSlabThickness}
                onChange={(e) => updateBox('bottomSlabThickness', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">외측 벽체 두께</label>
              <input
                type="number"
                min={0.5}
                max={1.5}
                step={0.1}
                value={project.boxSection.outerWallThickness}
                onChange={(e) => updateBox('outerWallThickness', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
            {project.boxSection.cellType === 'DOUBLE' && (
              <div className="space-y-1">
                <label className="text-slate-400">중앙 벽체 두께</label>
                <input
                  type="number"
                  min={0.3}
                  max={1.5}
                  step={0.1}
                  value={project.boxSection.centerWallThickness || 0.6}
                  onChange={(e) => updateBox('centerWallThickness', parseFloat(e.target.value))}
                  className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            )}
          </div>

          {/* 헌치 치수 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">헌치 가로 (W)</label>
              <input
                type="number"
                min={0.2}
                max={1.0}
                step={0.1}
                value={project.boxSection.haunchWidth}
                onChange={(e) => updateBox('haunchWidth', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">헌치 세로 (H)</label>
              <input
                type="number"
                min={0.2}
                max={1.0}
                step={0.1}
                value={project.boxSection.haunchHeight}
                onChange={(e) => updateBox('haunchHeight', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        </section>

        {/* 4. U-Type 옹벽 접속부 */}
        <section className="space-y-2.5 pt-3 border-t border-slate-800">
          <h3 className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
            4. U-Type 가변 옹벽 접속부
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400">진입부 연장</label>
              <input
                type="number"
                min={10}
                max={100}
                step={5}
                value={project.approachStart.length}
                onChange={(e) => updateApproach('approachStart', 'length', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">진출부 연장</label>
              <input
                type="number"
                min={10}
                max={100}
                step={5}
                value={project.approachEnd.length}
                onChange={(e) => updateApproach('approachEnd', 'length', parseFloat(e.target.value))}
                className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
};

