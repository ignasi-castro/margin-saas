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

// BUG 2 fix: prioridad basada en oportunidad en euros
export function getPriority(opportunityEuros: number): ProcessedClient['priority'] {
  if (opportunityEuros > 200_000) return 'Muy Alta';
  if (opportunityEuros > 100_000) return 'Alta';
  if (opportunityEuros > 50_000)  return 'Media';
  return 'Mantener';
}

export function getPriorityColor(opportunityEuros: number): ProcessedClient['priorityColor'] {
  if (opportunityEuros > 200_000) return 'red';
  if (opportunityEuros > 100_000) return 'orange';
  if (opportunityEuros > 50_000)  return 'blue';
  return 'green';
}

export function processClients(rows: ClientRow[], config: AppConfig): ProcessedClient[] {
  // Pre-pass: calcular márgenes actuales para determinar benchmarks dinámicos
  const rowMargins = rows.map(row => ({
    normalizedSegmento: normalizeSegmentName(row.segmento),
    margin: computeActualMargin(row, config),
  }));

  // Agrupar márgenes por segmento normalizado
  const segmentMarginGroups = new Map<string, number[]>();
  for (const { normalizedSegmento, margin } of rowMargins) {
    if (!segmentMarginGroups.has(normalizedSegmento)) segmentMarginGroups.set(normalizedSegmento, []);
    segmentMarginGroups.get(normalizedSegmento)!.push(margin);
  }

  // Calcular benchmark dinámico por segmento:
  // Si >= 4 clientes: media del TOP 25% (los mejor desarrollados)
  // Si < 4 clientes: usa benchmarkMargin de la configuración
  const dynamicBenchmarks = new Map<string, { benchmark: number; topCount: number; source: 'dynamic' | 'config' }>();
  Array.from(segmentMarginGroups.entries()).forEach(([normalizedSeg, margins]) => {
    const segment = config.segments.find(s => normalizeSegmentName(s.name) === normalizedSeg);
    const configBenchmark = segment?.benchmarkMargin ?? 18.5;
    if (margins.length >= 4) {
      const sorted = [...margins].sort((a, b) => b - a);
      const topCount = Math.max(1, Math.floor(sorted.length * 0.25));
      const top25 = sorted.slice(0, topCount);
      const dynamicBenchmark = top25.reduce((sum, m) => sum + m, 0) / top25.length;
      dynamicBenchmarks.set(normalizedSeg, { benchmark: dynamicBenchmark, topCount, source: 'dynamic' });
    } else {
      dynamicBenchmarks.set(normalizedSeg, { benchmark: configBenchmark, topCount: 0, source: 'config' });
    }
  });

  return rows.map(row => {
    const normalizedSeg = normalizeSegmentName(row.segmento);
    const dynBenchmark = dynamicBenchmarks.get(normalizedSeg);
    const benchmarkMargin = dynBenchmark?.benchmark ?? (findSegment(row.segmento, config.segments)?.benchmarkMargin ?? 18.5);
    const benchmarkSource: 'dynamic' | 'config' = dynBenchmark?.source ?? 'config';
    const benchmarkTopCount = dynBenchmark?.topCount ?? 0;

    const mix: Record<string, number> = {};
    for (const f of config.families) {
      mix[f.id] = row[f.id as keyof ClientRow] as number;
    }

    const actualMargin = computeActualMargin(row, config);
    const mixPower = benchmarkMargin > 0 ? actualMargin / benchmarkMargin : 0;

    // BUG 1 fix: gap y oportunidad nunca negativos
    const gap = Math.max(benchmarkMargin - actualMargin, 0);
    const captureRate = config.captureRate ?? 0.40;
    const potentialMargin6M = actualMargin + gap * captureRate;
    // opportunityEuros: usa ventas reales si están disponibles, sino volumen × 800€/t
    const ventasReales = row.ventas != null && row.ventas > 0;
    const ventasBase   = ventasReales ? row.ventas! : row.volumen * PRICE_PER_TON;
    const opportunityEuros = ventasBase * (gap * captureRate) / 100;
    const opportunityPtTon = row.volumen * (gap / 100);

    // ventas totales para mostrar en tabla
    const ventas = ventasBase;

    return {
      cliente: row.cliente,
      ciudad: row.ciudad,
      region: row.region ?? '',
      comercial: row.comercial ?? '',
      segmento: row.segmento,
      volumen: row.volumen,
      ventas,
      mix,
      actualMargin,
      benchmarkMargin,
      benchmarkSource,
      benchmarkTopCount,
      mixPower,
      gap,
      potentialMargin6M,
      opportunityEuros,
      opportunityPtTon,
      ventasReales,
      priority: getPriority(opportunityEuros),
      priorityColor: getPriorityColor(opportunityEuros),
    };
  });
}

export function validateRow(row: ClientRow, rowIndex: number, familyIds?: string[]): string | null {
  const ids = familyIds ?? ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10'];
  const sum = ids.reduce((acc, f) => acc + (Number(row[f as keyof ClientRow]) || 0), 0);
  if (Math.abs(sum - 100) > 0.5) {
    return `Fila ${rowIndex + 1} (${row.cliente}): los porcentajes suman ${sum.toFixed(1)}% en lugar de 100%`;
  }
  return null;
}
