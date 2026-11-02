import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { UnderpassProject } from '../../../core/types/domain';
import { buildCompleteUnderpassBim, CompleteBimModel } from '../geometry/UnderpassModelBuilder';
import { ClippingController, ClippingMode } from './ClippingController';
import { generateIfc4x3, downloadIfcFile, IfcExportResult } from '../ifc/Ifc4x3Exporter';
import { Box, Download, Scissors } from 'lucide-react';

interface BimViewerProps {
  project: UnderpassProject;
}

export const BimViewer: React.FC<BimViewerProps> = ({ project }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clippingRef = useRef<ClippingController | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [clipMode, setClipMode] = useState<ClippingMode>('NONE');
  const [clipOffset, setClipOffset] = useState<number>(0);
  const [modelMeta, setModelMeta] = useState<CompleteBimModel | null>(null);
  const [ifcMeta, setIfcMeta] = useState<IfcExportResult | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 30, 60);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Clipping Controller
    const clipping = new ClippingController(renderer);
    clippingRef.current = clipping;

    // 5. Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.8);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);

    // 6. Grid Helper (Ground Plane)
    const grid = new THREE.GridHelper(200, 40, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    // 7. Simple Orbit Controls (Drag to rotate)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let phi = Math.PI / 4;
    let theta = Math.PI / 4;
    let radius = 80;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 2, 0);
    };
    updateCamera();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      theta -= deltaX * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.008));
      updateCamera();
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      radius = Math.max(15, Math.min(250, radius + e.deltaY * 0.05));
      updateCamera();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: true });

    // 8. Render Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      clipping.dispose();
    };
  }, []);

  // 프로젝트 제원 변경 시 3D 모델 재생성
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // 기존 모델 제거
    if (modelRef.current) {
      scene.remove(modelRef.current);
    }

    // 신규 모델 빌드
    const completeBim = buildCompleteUnderpassBim(project);
    scene.add(completeBim.rootGroup);
    modelRef.current = completeBim.rootGroup;
    setModelMeta(completeBim);

    // IFC 4.3 미리 생성
    const ifc = generateIfc4x3(project);
    setIfcMeta(ifc);
  }, [project]);

  // 클리핑 변경 반영
  useEffect(() => {
    if (!clippingRef.current) return;
    clippingRef.current.setMode(clipMode, clipOffset);
  }, [clipMode, clipOffset]);

  const handleDownloadIfc = () => {
    if (ifcMeta) {
      downloadIfcFile(ifcMeta);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 select-none shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Info Overlay (Top Left) */}
      <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-lg pointer-events-auto text-xs space-y-1.5 text-slate-200">
        <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
          <Box className="w-4 h-4" />
          <span>3D BIM 실시간 뷰어 (WebGL)</span>
        </div>
        <div className="text-slate-400">
          프로젝트: <span className="text-slate-200 font-medium">{project.name}</span>
        </div>
        <div className="text-slate-400">
          암거 형식: <span className="text-emerald-400 font-semibold">{project.boxSection.cellType === 'SINGLE' ? '1련 박스' : '2련 박스'}</span>
        </div>
        {modelMeta && (
          <div className="pt-2 border-t border-slate-700 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">외곽 제원 (폭×고):</span>
              <span className="font-mono text-slate-100">{modelMeta.derived.totalWidth}m × {modelMeta.derived.totalHeight}m</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">본선 암거 연장:</span>
              <span className="font-mono text-slate-100">{project.boxLength}m</span>
            </div>
            <div className="flex justify-between gap-4 text-sky-400 font-medium">
              <span>콘크리트 3D 총체적:</span>
              <span className="font-mono font-bold text-sky-300">{modelMeta.totalConcreteVolumeM3.toLocaleString()} m³</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Slicer & View Controls (Bottom Left) */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-md border border-slate-700 px-4 py-3 rounded-xl shadow-lg text-xs space-y-2 pointer-events-auto">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Scissors className="w-4 h-4 text-amber-400" />
          <span>동적 단면 슬라이서 (Clipping Planes)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setClipMode('NONE')}
            className={`px-2.5 py-1 rounded font-medium transition ${clipMode === 'NONE' ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            전체 3D
          </button>
          <button
            onClick={() => { setClipMode('CROSS_SECTION'); setClipOffset(0); }}
            className={`px-2.5 py-1 rounded font-medium transition ${clipMode === 'CROSS_SECTION' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            횡단면 (Z-Cut)
          </button>
          <button
            onClick={() => { setClipMode('LONGITUDINAL'); setClipOffset(0); }}
            className={`px-2.5 py-1 rounded font-medium transition ${clipMode === 'LONGITUDINAL' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            종단면 (X-Cut)
          </button>
          <button
            onClick={() => { setClipMode('TOP_DOWN'); setClipOffset(4); }}
            className={`px-2.5 py-1 rounded font-medium transition ${clipMode === 'TOP_DOWN' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            평면절단 (Y-Cut)
          </button>
        </div>

        {clipMode !== 'NONE' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-400 text-[11px] w-12">절단위치:</span>
            <input
              type="range"
              min={-50}
              max={50}
              step={0.5}
              value={clipOffset}
              onChange={(e) => setClipOffset(parseFloat(e.target.value))}
              className="w-40 accent-amber-400 cursor-pointer"
            />
            <span className="text-slate-200 font-mono w-10 text-right">{clipOffset}m</span>
          </div>
        )}
      </div>

      {/* IFC 4.3 Export Button (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={handleDownloadIfc}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium text-xs shadow-lg hover:from-sky-400 hover:to-blue-500 active:scale-95 transition"
        >
          <Download className="w-4 h-4" />
          <span>IFC 4.3 파일 내보내기 (.ifc)</span>
        </button>
        {ifcMeta && (
          <div className="bg-slate-800/80 backdrop-blur px-2.5 py-1 rounded text-[11px] text-slate-400 border border-slate-700">
            IFC4X3 표준 준수 • {ifcMeta.entityCount}개 엔티티 ({ifcMeta.fileSizeKb} KB)
          </div>
        )}
      </div>
    </div>
  );
};
