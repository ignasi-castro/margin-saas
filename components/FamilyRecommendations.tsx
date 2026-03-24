'use client';

import { ProcessedClient, AppConfig } from '@/lib/types';

const D = { bg: '#F7F6F2', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC', red: '#C94040' };

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmt(n: number, d = 1) { return n.toFixed(d); }

export interface FamilyRec {
  id: string;
  name: string;
  actual: number;    // % mix actual
  benchmark: number; // % mix benchmark
  gap: number;       // actual - benchmark (negativo = infradesarrollada)
  opp: number;       // volumen × (|gap|/100) × 800 × captureRate
  pct: number;       // % de la oportunidad total del cliente
}

export function getTopFamilies(
  client: ProcessedClient,
  config: AppConfig,
  n = 2
): FamilyRec[] {
  const segment =
    config.segments.find(
      s => s.name.toLowerCase().trim() === client.segmento.toLowerCase().trim()
    ) ?? config.segments[0];
  if (!segment) return [];

  const captureRate = config.captureRate ?? 0.40;

  return config.families
    .map(f => {
      const actual    = client.mix[f.id] ?? 0;
      const benchmark = segment[f.id as keyof typeof segment] as number;
      const gap       = actual - benchmark; // negativo = por debajo del benchmark
      const opp       = gap < 0 ? client.volumen * (Math.abs(gap) / 100) * 800 * captureRate : 0;
      const pct       = client.opportunityEuros > 0 ? (opp / client.opportunityEuros) * 100 : 0;
      return { id: f.id, name: f.name, actual, benchmark, gap, opp, pct };
    })
    .filter(f => f.gap < 0)
    .sort((a, b) => a.gap - b.gap) // más negativo primero
    .slice(0, n);
}

interface Props {
  client: ProcessedClient;
  config: AppConfig;
}

export default function FamilyRecommendations({ client, config }: Props) {
  const top2 = getTopFamilies(client, config);
  if (top2.length === 0) return null;

  const combinedPct = top2.reduce((s, f) => s + f.pct, 0);

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
        Dónde actuar primero
      </p>
      <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 10px 0' }}>
        Estas {top2.length} familias representan{' '}
        <strong style={{ color: D.dark }}>{fmt(combinedPct)}%</strong>{' '}
        de tu oportunidad total
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {top2.map((f, i) => (
          <div key={f.id} style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: D.dark, fontFamily: 'Inter, sans-serif' }}>
                {i + 1}. {f.name}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: '100px', padding: '2px 7px', fontFamily: 'Inter, sans-serif' }}>
                {fmt(f.pct)}% oport.
              </span>
            </div>
            <p style={{ fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
              Mix: <strong style={{ color: D.dark }}>{fmt(f.actual)}%</strong>
              {' → '}
              <strong style={{ color: D.dark }}>{fmt(f.benchmark)}%</strong>
            </p>
            <p style={{ fontSize: '12px', color: D.red, fontFamily: 'Inter, sans-serif', fontWeight: 600, margin: '0 0 6px 0' }}>
              {fmt(f.gap)} pp de gap
            </p>
            <p style={{ fontSize: '13px', fontFamily: '"Instrument Serif", Georgia, serif', color: D.dark, margin: 0 }}>
              {fmtEur(f.opp)}
            </p>
            <p style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '2px 0 0 0' }}>
              recuperables en 6M
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
