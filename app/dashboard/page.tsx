'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { ProcessedClient, AppConfig } from '@/lib/types';
import { loadProcessedClients, loadCompany, loadConfig } from '@/lib/store';
import MetricCard from '@/components/MetricCard';
import PriorityBadge from '@/components/PriorityBadge';
import MixPowerBar from '@/components/MixPowerBar';
import DashboardNav from '@/components/DashboardNav';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC' };

// Color por segmento — consistente con el resto del sistema
const SEG_COLORS: Record<string, string> = {
  'Generalista':                  '#2563EB',
  'Especialista Rehabilitación':  '#2D7A4F',
  'Obra Nueva':                   '#D97706',
};
const SEG_COLOR_FALLBACKS = ['#6B6B67', '#C94040', '#9B9B97'];

function segColor(seg: string, idx: number): string {
  return SEG_COLORS[seg] ?? SEG_COLOR_FALLBACKS[idx % SEG_COLOR_FALLBACKS.length];
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmt(n: number, d = 1) { return n.toFixed(d); }

interface BubblePoint {
  volumen: number;
  actualMargin: number;
  opportunityEuros: number;
  cliente: string;
  mixPower: number;
  priority: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as BubblePoint;
  return (
    <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '8px', padding: '12px 16px', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <p style={{ fontWeight: 600, color: D.dark, margin: '0 0 6px 0', fontSize: '13px' }}>{d.cliente}</p>
      <p style={{ color: D.sec, margin: '0 0 2px 0', fontSize: '12px' }}>Mix Power: <strong style={{ color: D.dark }}>{d.mixPower.toFixed(2)}</strong></p>
      <p style={{ color: D.sec, margin: '0 0 2px 0', fontSize: '12px' }}>Margen: <strong style={{ color: D.dark }}>{fmt(d.actualMargin)}%</strong></p>
      <p style={{ color: D.sec, margin: '0 0 2px 0', fontSize: '12px' }}>Volumen: <strong style={{ color: D.dark }}>{d.volumen.toLocaleString('es-ES')} t</strong></p>
      <p style={{ color: D.sec, margin: 0, fontSize: '12px' }}>Oportunidad: <strong style={{ color: D.dark }}>{fmtEur(d.opportunityEuros)}</strong></p>
    </div>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const [clients, setClients] = useState<ProcessedClient[]>([]);
  const [config,  setConfig]  = useState<AppConfig | null>(null);
  const [company, setCompany] = useState('');

  useEffect(() => {
    const loaded = loadProcessedClients();
    if (loaded.length === 0) { router.push('/onboarding'); return; }
    setClients(loaded);
    setCompany(loadCompany());
    setConfig(loadConfig());
  }, [router]);

  const avgMargin      = clients.length ? clients.reduce((s, c) => s + c.actualMargin, 0) / clients.length : 0;
  const totalOpportunity = clients.reduce((s, c) => s + c.opportunityEuros, 0);
  const avgMixPower    = clients.length ? clients.reduce((s, c) => s + c.mixPower, 0) / clients.length : 0;
  const urgentCount    = clients.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length;

  const now      = new Date();
  const subtitle = `${company || 'Tu cartera'} · ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

  // Agrupar clientes por segmento para el scatter chart
  const scatterGroups = useMemo(() => {
    const map = new Map<string, BubblePoint[]>();
    for (const c of clients) {
      if (!map.has(c.segmento)) map.set(c.segmento, []);
      map.get(c.segmento)!.push({
        volumen: c.volumen,
        actualMargin: c.actualMargin,
        opportunityEuros: Math.max(c.opportunityEuros, 1), // evitar tamaño 0
        cliente: c.cliente,
        mixPower: c.mixPower,
        priority: c.priority,
      });
    }
    return Array.from(map.entries());
  }, [clients]);

  // Líneas de referencia por segmento (benchmark margins únicos)
  const benchmarkLines = useMemo(() => {
    if (!config) return [];
    const seen = new Set<number>();
    return config.segments
      .filter(s => { if (seen.has(s.benchmarkMargin)) return false; seen.add(s.benchmarkMargin); return true; })
      .map(s => ({ margin: s.benchmarkMargin, name: s.name }));
  }, [config]);

  // Top 5 por oportunidad
  const top5 = useMemo(() =>
    [...clients].sort((a, b) => b.opportunityEuros - a.opportunityEuros).slice(0, 5),
    [clients]
  );

  if (clients.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: D.muted, fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
            Resumen de cartera
          </h1>
          <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0, textTransform: 'capitalize' }}>
            {subtitle}
          </p>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          <MetricCard label="Margen medio de cartera" value={`${fmt(avgMargin)}%`}       subtitle="Media ponderada de clientes" />
          <MetricCard label="Oportunidad total"        value={fmtEur(totalOpportunity)}  subtitle="Recuperable en 6 meses" />
          <MetricCard label="Mix Power medio"          value={fmt(avgMixPower, 2)}        subtitle="vs. benchmark de segmento" />
          <MetricCard label="Clientes prioritarios"    value={String(urgentCount)}        subtitle="Prioridad Muy Alta o Alta" />
        </div>

        {/* Bubble chart + Top 5 — grid 3+2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start', marginBottom: '32px' }}>

          {/* Bubble chart */}
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '28px' }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
              Posicionamiento de cartera
            </p>
            <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 24px 0' }}>
              Eje X: volumen (t) · Eje Y: margen actual (%) · Tamaño: oportunidad (€)
            </p>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={D.border} />
                <XAxis
                  dataKey="volumen" type="number" name="Volumen"
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: D.muted }}
                  tickLine={false} axisLine={{ stroke: D.border }}
                  label={{ value: 'Volumen (t)', position: 'insideBottom', offset: -12, fontSize: 11, fill: D.muted, fontFamily: 'Inter, sans-serif' }}
                />
                <YAxis
                  dataKey="actualMargin" type="number" name="Margen"
                  tick={{ fontSize: 11, fontFamily: 'Inter, sans-serif', fill: D.muted }}
                  tickLine={false} axisLine={{ stroke: D.border }}
                  tickFormatter={v => `${v}%`}
                  label={{ value: 'Margen (%)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: D.muted, fontFamily: 'Inter, sans-serif' }}
                />
                <ZAxis dataKey="opportunityEuros" range={[40, 800]} name="Oportunidad" />
                <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3', stroke: D.border }} />
                <Legend
                  wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', paddingTop: '16px' }}
                  formatter={(value) => <span style={{ color: D.sec }}>{value}</span>}
                />
                {/* Líneas benchmark por segmento */}
                {benchmarkLines.map(b => (
                  <ReferenceLine
                    key={b.name}
                    y={b.margin}
                    stroke={D.muted}
                    strokeDasharray="5 4"
                    label={{ value: `${b.name} ${fmt(b.margin)}%`, position: 'insideTopRight', fontSize: 10, fill: D.muted, fontFamily: 'Inter, sans-serif' }}
                  />
                ))}
                {/* Un Scatter por segmento */}
                {scatterGroups.map(([seg, data], idx) => (
                  <Scatter
                    key={seg}
                    name={seg}
                    data={data}
                    fill={segColor(seg, idx)}
                    fillOpacity={0.75}
                    stroke={segColor(seg, idx)}
                    strokeWidth={1}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 */}
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                Top 5 oportunidades
              </p>
              <Link href="/dashboard/tabla" style={{ fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
                Ver todos →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {top5.map((c, i) => (
                <div key={c.cliente} style={{
                  padding: '16px 20px',
                  borderBottom: i < top5.length - 1 ? `1px solid ${D.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.cliente}
                      </p>
                      <p style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        {c.ciudad}{c.region ? ` · ${c.region}` : ''}
                      </p>
                    </div>
                    <PriorityBadge priority={c.priority} color={c.priorityColor} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <MixPowerBar value={c.mixPower} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: D.dark, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {fmtEur(c.opportunityEuros)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
