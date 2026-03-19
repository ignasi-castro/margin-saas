import { ClientRow, ProcessedClient, AppConfig, SegmentBenchmark } from './types';

const PRICE_PER_TON = 800; // €/t default

function normalizeSegmentName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');
}

export function findSegment(segmentName: string, segments: SegmentBenchmark[]): SegmentBenchmark | undefined {
  const normalized = normalizeSegmentName(segmentName);
  return segments.find(s => normalizeSegmentName(s.name) === normalized) ?? segments[0];
}

export function computeActualMargin(row: ClientRow, config: AppConfig): number {
  let margin = 0;
  for (const family of config.families) {
    const weight = (row[family.id as keyof ClientRow] as number) / 100;
    margin += weight * family.margin;
  }
  return margin;
}

export function getPriority(mixPower: number): ProcessedClient['priority'] {
  if (mixPower < 0.65) return 'Muy Alta';
  if (mixPower < 0.80) return 'Alta';
  if (mixPower < 0.90) return 'Media';
  return 'Mantener';
}

export function getPriorityColor(mixPower: number): ProcessedClient['priorityColor'] {
  if (mixPower < 0.65) return 'red';
  if (mixPower < 0.80) return 'orange';
  if (mixPower < 0.90) return 'blue';
  return 'green';
}

export function processClients(rows: ClientRow[], config: AppConfig): ProcessedClient[] {
  return rows.map(row => {
    const segment = findSegment(row.segmento, config.segments);
    const benchmarkMargin = segment?.benchmarkMargin ?? 18.5;

    const mix: Record<string, number> = {};
    for (const f of config.families) {
      mix[f.id] = row[f.id as keyof ClientRow] as number;
    }

    const actualMargin = computeActualMargin(row, config);
    const mixPower = benchmarkMargin > 0 ? actualMargin / benchmarkMargin : 0;
    const gap = benchmarkMargin - actualMargin;
    const potentialMargin6M = actualMargin + gap * 0.4;
    const opportunityEuros = row.volumen * (gap / 100) * PRICE_PER_TON;
    const opportunityPtTon = row.volumen * gap;

    return {
      cliente: row.cliente,
      ciudad: row.ciudad,
      segmento: row.segmento,
      volumen: row.volumen,
      mix,
      actualMargin,
      benchmarkMargin,
      mixPower,
      gap,
      potentialMargin6M,
      opportunityEuros,
      opportunityPtTon,
      priority: getPriority(mixPower),
      priorityColor: getPriorityColor(mixPower),
    };
  });
}

export function validateRow(row: ClientRow, rowIndex: number): string | null {
  const families = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10'];
  const sum = families.reduce((acc, f) => acc + (Number(row[f as keyof ClientRow]) || 0), 0);
  if (Math.abs(sum - 100) > 0.5) {
    return `Fila ${rowIndex + 1} (${row.cliente}): los porcentajes suman ${sum.toFixed(1)}% en lugar de 100%`;
  }
  return null;
}
