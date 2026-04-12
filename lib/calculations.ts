import { ClientRow, ProcessedClient, AppConfig, SegmentBenchmark } from './types';

const PRICE_PER_TON = 800; // €/t default

export function normalizeSegmentName(name: string): string {
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

export function processClients(rows: ClientRow[], config: AppConfig): ProcessedClient[] {
  // Pre-pass: calcular márgenes y encontrar el mejor cliente por segmento (benchmark)
  const rowData = rows.map(row => ({
    normalizedSegmento: normalizeSegmentName(row.segmento),
    margin: computeActualMargin(row, config),
    cliente: row.cliente,
  }));

  const segmentBest = new Map<string, { margin: number; cliente: string }>();
  for (const { normalizedSegmento, margin, cliente } of rowData) {
    const current = segmentBest.get(normalizedSegmento);
    if (!current || margin > current.margin) {
      segmentBest.set(normalizedSegmento, { margin, cliente });
    }
  }

  // Primer paso: calcular todos los datos, prioridad por defecto Mantener
  const results: ProcessedClient[] = rows.map((row, idx) => {
    const normalizedSeg = normalizeSegmentName(row.segmento);
    const best = segmentBest.get(normalizedSeg);
    const segment = config.segments.find(s => normalizeSegmentName(s.name) === normalizedSeg);

    const benchmarkMargin = best?.margin ?? (segment?.benchmarkMargin ?? 18.5);
    const benchmarkClientName = best?.cliente ?? '';
    const benchmarkSource: 'dynamic' | 'config' = best ? 'dynamic' : 'config';

    const mix: Record<string, number> = {};
    for (const f of config.families) {
      mix[f.id] = row[f.id as keyof ClientRow] as number;
    }

    const actualMargin = rowData[idx].margin;
    const ventasReales = row.ventas != null && row.ventas > 0;
    const ventasBase = ventasReales ? row.ventas! : row.volumen * PRICE_PER_TON;

    // El cliente benchmark: Mix Power = 1.0, gap = 0, oportunidad = 0
    if (row.cliente === benchmarkClientName) {
      return {
        cliente: row.cliente, ciudad: row.ciudad,
        region: row.region ?? '', comercial: row.comercial ?? '',
        segmento: row.segmento, volumen: row.volumen, ventas: ventasBase, mix,
        actualMargin, benchmarkMargin, benchmarkClientName, benchmarkSource,
        mixPower: 1.0, gap: 0, potentialMargin6M: actualMargin,
        opportunityEuros: 0, opportunityPtTon: 0, ventasReales,
        priority: 'Mantener' as ProcessedClient['priority'],
        priorityColor: 'green' as ProcessedClient['priorityColor'],
      };
    }

    const mixPower = benchmarkMargin > 0 ? actualMargin / benchmarkMargin : 0;
    const gap = Math.max(benchmarkMargin - actualMargin, 0);
    const captureRate = config.captureRate ?? 0.40;
    const potentialMargin6M = actualMargin + gap * captureRate;
    const opportunityEuros = ventasBase * (gap * captureRate) / 100;
    const opportunityPtTon = row.volumen * (gap / 100);

    return {
      cliente: row.cliente, ciudad: row.ciudad,
      region: row.region ?? '', comercial: row.comercial ?? '',
      segmento: row.segmento, volumen: row.volumen, ventas: ventasBase, mix,
      actualMargin, benchmarkMargin, benchmarkClientName, benchmarkSource,
      mixPower, gap, potentialMargin6M,
      opportunityEuros, opportunityPtTon, ventasReales,
      priority: 'Mantener' as ProcessedClient['priority'],
      priorityColor: 'green' as ProcessedClient['priorityColor'],
    };
  });

  // Segundo paso: asignar prioridades por percentil relativo (mutación por referencia)
  const sorted = [...results].sort((a, b) => b.opportunityEuros - a.opportunityEuros);

  const total = sorted.length;
  const muyAltaCount = Math.max(15, Math.ceil(total * 0.015));
  const altaCount    = Math.max(35, Math.ceil(total * 0.035));
  const mediaCount   = Math.ceil(total * 0.15);

  sorted.forEach((client, index) => {
    if (index < muyAltaCount) {
      client.priority = 'Muy Alta';
      client.priorityColor = 'red';
    } else if (index < muyAltaCount + altaCount) {
      client.priority = 'Alta';
      client.priorityColor = 'orange';
    } else if (index < muyAltaCount + altaCount + mediaCount) {
      client.priority = 'Media';
      client.priorityColor = 'blue';
    }
    // else: ya es 'Mantener' / 'green' por defecto
  });

  return results;
}

export function validateRow(row: ClientRow, rowIndex: number, familyIds?: string[]): string | null {
  const ids = familyIds ?? ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10'];
  const sum = ids.reduce((acc, f) => acc + (Number(row[f as keyof ClientRow]) || 0), 0);
  if (Math.abs(sum - 100) > 0.5) {
    return `Fila ${rowIndex + 1} (${row.cliente}): los porcentajes suman ${sum.toFixed(1)}% en lugar de 100%`;
  }
  return null;
}
