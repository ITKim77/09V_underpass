export type CadLayer =
  | 'LAYER_CONC'
  | 'LAYER_REBAR'
  | 'LAYER_DIM'
  | 'LAYER_TEXT'
  | 'LAYER_CENTER'
  | 'LAYER_HATCH';

export type DrawingType = 'CROSS_SECTION' | 'PROFILE' | 'PLAN' | 'REBAR_DETAIL';

export interface Point2D {
  x: number;
  y: number;
}

export interface CadLine {
  type: 'LINE';
  layer: CadLayer;
  start: Point2D;
  end: Point2D;
  strokeDash?: string;
}

export interface CadPolyline {
  type: 'POLYLINE';
  layer: CadLayer;
  points: Point2D[];
  closed: boolean;
}

export interface CadCircle {
  type: 'CIRCLE';
  layer: CadLayer;
  center: Point2D;
  radius: number;
  filled?: boolean;
}

export interface CadText {
  type: 'TEXT';
  layer: CadLayer;
  position: Point2D;
  text: string;
  fontSize: number;
  rotation?: number;
  anchor?: 'start' | 'middle' | 'end';
}

export interface CadDimension {
  type: 'DIMENSION';
  layer: CadLayer;
  start: Point2D;
  end: Point2D;
  offset: number; // 치수선 이격 거리
  orientation: 'HORIZONTAL' | 'VERTICAL';
  textOverride?: string;
  measurement: number;
}

export type CadEntity = CadLine | CadPolyline | CadCircle | CadText | CadDimension;

export interface CadDrawing {
  id: string;
  title: string;
  type: DrawingType;
  scale: string;
  entities: CadEntity[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

