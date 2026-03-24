export interface ClientRow {
  cliente: string;
  ciudad: string;
  segmento: string;
  F1: number;
  F2: number;
  F3: number;
  F4: number;
  F5: number;
  F6: number;
  F7: number;
  F8: number;
  F9: number;
  F10: number;
  volumen: number;
  ventas?: number; // ventas totales en €; si no viene en CSV se calcula como volumen * 800
  region?: string;
  comercial?: string;
}

export interface ProductFamily {
  id: string;
  name: string;
  type: 'Volumen' | 'Técnico' | 'Sistema';
  margin: number; // percentage, e.g. 10 = 10%
}

export interface SegmentBenchmark {
  id: string;
  name: string;
  F1: number;
  F2: number;
  F3: number;
  F4: number;
  F5: number;
  F6: number;
  F7: number;
  F8: number;
  F9: number;
  F10: number;
  benchmarkMargin: number;
}

export interface ProcessedClient {
  cliente: string;
  ciudad: string;
  region: string;
  comercial: string;
  segmento: string;
  volumen: number;
  ventas: number; // ventas totales en €
  mix: Record<string, number>;
  actualMargin: number;
  benchmarkMargin: number;
  mixPower: number;
  gap: number; // siempre >= 0
  potentialMargin6M: number;
  opportunityEuros: number; // siempre >= 0
  opportunityPtTon: number;
  ventasReales: boolean; // true si opportunityEuros usa ventas reales del CSV
  priority: 'Muy Alta' | 'Alta' | 'Media' | 'Mantener';
  priorityColor: 'red' | 'orange' | 'blue' | 'green';
}

export interface AppConfig {
  families: ProductFamily[];
  segments: SegmentBenchmark[];
  captureRate: number; // 0.0–1.0, porcentaje del gap que se compromete recuperar en 6M
}
