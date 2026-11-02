import { UnderpassProject } from '../../../core/types/domain';
import { computeDerivedGeometry } from '../../../core/model/UnderpassModel';

export interface IfcExportResult {
  ifcString: string;
  fileName: string;
  entityCount: number;
  fileSizeKb: number;
}

/**
 * 토목 인프라 국제 표준인 IFC 4.3 (IFC4X3) STEP 물리 파일 직렬화 엔진
 */
export function generateIfc4x3(project: UnderpassProject): IfcExportResult {
  const derived = computeDerivedGeometry(project);
  const now = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const guid = () => '2' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 10);

  let id = 1;
  const nextId = () => `#${id++}`;

  const idProject = nextId();       // #1
  const idSite = nextId();          // #2
  const idRoad = nextId();          // #3
  const idFacPartBox = nextId();    // #4
  const idFacPartUStart = nextId(); // #5
  const idFacPartUEnd = nextId();   // #6
  const idTopSlab = nextId();       // #7
  const idBotSlab = nextId();       // #8
  const idLeftWall = nextId();      // #9
  const idRightWall = nextId();     // #10

  const lines: string[] = [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition[CivilInfrastructure]'),'2;1');",
    `FILE_NAME('underpass_${project.id}.ifc','${now}',('Underpass Web BIM CAD'),('Civil Infra Team'),'Three.js IFC 4.3 Generator','Underpass BIM Engine','Approved');`,
    "FILE_SCHEMA(('IFC4X3'));",
    'ENDSEC;',
    'DATA;',
    // 1. Root & Spatial Structure
    `${idProject}=IFCPROJECT('${guid()}',$,'${project.name}',$,$,$,$,(#100),#200);`,
    `${idSite}=IFCSITE('${guid()}',$,'Site_Underpass',$,$,#301,$,$,.ELEMENT.,$,$,$,$,$);`,
    `${idRoad}=IFCROAD('${guid()}',$,'Main_Underpass_Road',$,$,#302,$,$,.USERDEFINED.,$);`,
    `${idFacPartBox}=IFCFACILITYPART('${guid()}',$,'Box_Culvert_Section',$,$,#303,$,$,.ROADWAY_STRUCTURE.);`,
    `${idFacPartUStart}=IFCFACILITYPART('${guid()}',$,'Approach_Ramp_Start',$,$,#304,$,$,.APPROACH.);`,
    `${idFacPartUEnd}=IFCFACILITYPART('${guid()}',$,'Approach_Ramp_End',$,$,#305,$,$,.APPROACH.);`,

    // 2. Structural Elements (Box Culvert)
    `${idTopSlab}=IFCSLAB('${guid()}',$,'Upper_Slab_Top',$,'Box Roof Slab',#310,#410,$,.ROOF.);`,
    `${idBotSlab}=IFCSLAB('${guid()}',$,'Lower_Slab_Foundation',$,'Box Base Slab',#311,#411,$,.BASESLAB.);`,
    `${idLeftWall}=IFCWALL('${guid()}',$,'Wall_Outer_Left',$,'Left Box Wall',#312,#412,$,.SOLIDWALL.);`,
    `${idRightWall}=IFCWALL('${guid()}',$,'Wall_Outer_Right',$,'Right Box Wall',#313,#413,$,.SOLIDWALL.);`,

    // 3. Geometric Coordinates & Context Setup
    '#100=IFCGEOMETRICREPRESENTATIONCONTEXT($,\'Model\',3,0.001,#300,$);',
    '#200=IFCUNITASSIGNMENT((#201,#202));',
    '#201=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);',
    '#202=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);',
    '#300=IFCAXIS2PLACEMENT3D(#3000,$,$);',
    '#3000=IFCCARTESIANPOINT((0.,0.,0.));',
    '#301=IFCLOCALPLACEMENT($,#300);',
    '#302=IFCLOCALPLACEMENT(#301,#300);',
    '#303=IFCLOCALPLACEMENT(#302,#300);',
    '#304=IFCLOCALPLACEMENT(#302,#300);',
    '#305=IFCLOCALPLACEMENT(#302,#300);',
    '#310=IFCLOCALPLACEMENT(#303,#300);',
    '#311=IFCLOCALPLACEMENT(#303,#300);',
    '#312=IFCLOCALPLACEMENT(#303,#300);',
    '#313=IFCLOCALPLACEMENT(#303,#300);',

    // 4. Property Sets (Psets)
    `#501=IFCPROPERTYSET('${guid()}',$,'Pset_UnderpassCommon',$,(#502,#503,#504));`,
    `#502=IFCPROPERTYSINGLEVALUE('ClearanceHeight',$,IFCLENGTHMEASURE(${project.boxSection.clearanceHeight}),$);`,
    `#503=IFCPROPERTYSINGLEVALUE('ConcreteStrengthFck',$,IFCPRESSUREMEASURE(${project.material.concreteStrengthFck}),$);`,
    `#504=IFCPROPERTYSINGLEVALUE('ConcreteVolumeM3',$,IFCVOLUMEMEASURE(${Number((derived.crossSectionAreaConcrete * project.boxLength).toFixed(2))}),$);`,

    // RelDefinesByProperties
    `#601=IFCRELDEFINESBYPROPERTIES('${guid()}',$,$,$,(#${idProject},#${idFacPartBox}),#501);`,
    // RelAggregates
    `#701=IFCRELAGGREGATES('${guid()}',$,'ProjectToSite',$,#${idProject},(#${idSite}));`,
    `#702=IFCRELAGGREGATES('${guid()}',$,'SiteToRoad',$,#${idSite},(#${idRoad}));`,
    `#703=IFCRELAGGREGATES('${guid()}',$,'RoadToParts',$,#${idRoad},(#${idFacPartBox},#${idFacPartUStart},#${idFacPartUEnd}));`,
    `#704=IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',$,'BoxElements',$,(#${idTopSlab},#${idBotSlab},#${idLeftWall},#${idRightWall}),#${idFacPartBox});`,

    'ENDSEC;',
    'END-ISO-10303-21;',
  ];

  const ifcString = lines.join('\r\n');
  const fileName = `underpass_${project.id}_ifc4x3.ifc`;
  const fileSizeKb = Number((new TextEncoder().encode(ifcString).length / 1024).toFixed(2));

  return {
    ifcString,
    fileName,
    entityCount: id,
    fileSizeKb,
  };
}

/**
 * 브라우저 환경에서 IFC 파일 다운로드 트리거
 */
export function downloadIfcFile(result: IfcExportResult) {
  if (typeof window === 'undefined' || !window.document) return;
  const blob = new Blob([result.ifcString], { type: 'application/x-step' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

