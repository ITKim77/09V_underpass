export type QuantityCategory = 'CONCRETE' | 'FORMWORK' | 'EARTHWORK' | 'REBAR';

export interface QuantityItem {
  id: string;
  category: QuantityCategory;
  categoryName: string;
  itemCode: string;
  name: string;
  specification: string;
  unit: 'm³' | 'm²' | 'ton' | 'm';
  quantity: number;
  unitWeightKgM?: number;
  notes?: string;
}

export interface UnderpassBoQ {
  projectId: string;
  projectName: string;
  calculatedAt: string;
  summary: {
    concreteTotalM3: number;
    boxConcreteM3: number;
    approachConcreteM3: number;
    formworkTotalM2: number;
    excavationM3: number;
    backfillM3: number;
    rebarTotalTon: number;
  };
  items: QuantityItem[];
}

