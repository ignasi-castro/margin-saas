'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { ProcessedClient } from '@/lib/types';
import { loadSnapshots, loadSnapshotClientes, deleteSnapshot, SnapshotMeta } from '@/lib/snapshots';
import DashboardNav from '@/components/DashboardNav';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC', green: '#2D7A4F', red: '#C94040' };

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtSnapshotLabel(s: SnapshotMeta): string {
  const d    = new Date(s.fecha + 'T12:00:00');
  const mes  = d.toLocaleDateString('es-ES', { month: 'long' });
  const año  = d.getFullYear();
  const mesC = mes.charAt(0).toUpperCase() + mes.slice(1);
  return `${mesC} ${año} — ${s.nombre} (${s.count} clientes)`;
}

// ---- Metric comparison card ----
interface CompareCardProps {
  label: string;
  base: string;
  compare: string;
  delta: number;
  higherIsBetter: boolean;
}
function CompareCard({ label, base, compare, delta, higherIsBetter }: CompareCardProps) {
  const positive = higherIsBetter ? delta > 0 : delta < 0;
  const negative = higherIsBetter ? delta < 0 : delta > 0;
  const deltaColor = positive ? D.green : negative ? D.red : D.muted;
  const deltaPrefix = delta > 0 ? '+' : '';
  const deltaStr = typeof delta === 'number' && !isNaN(delta) ? `${deltaPrefix}${fmt(delta)}` : '—';
  return (
    <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '20px 24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 500, color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px 0' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '22px', fontFamily: '"Instrument Serif", Georgia, serif', color: D.dark }}>{compare}</span>
        <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: deltaColor }}>{deltaStr}</span>
      </div>
      <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: 0 }}>
        Base: <span style={{ color: D.sec }}>{base}</span>
      </p>
    </div>
  );
}

// ---- Trend icon ----
function Trend({ delta }: { delta: number }) {
  if (delta > 0.02)  return <span style={{ color: D.green,  fontWeight: 700, fontSize: '16px' }}>↑</span>;
  if (delta < -0.02) return <span style={{ color: D.red,    fontWeight: 700, fontSize: '16px' }}>↓</span>;
  return               <span style={{ color: D.muted, fontWeight: 700, fontSize: '16px' }}>→</span>;
}

// ---- Delta cell ----
function Delta({ value, higherIsBetter, suffix = '' }: { value: number; higherIsBetter: boolean; suffix?: string }) {
  const positive = higherIsBetter ? value > 0 : value < 0;
  const negative = higherIsBetter ? value < 0 : value > 0;
  const color = positive ? D.green : negative ? D.red : D.muted;
  const str = value === 0 ? '—' : `${value > 0 ? '+' : ''}${fmt(value)}${suffix}`;
  return <span style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, sans-serif' }}>{str}</span>;
}

interface ClientRow {
  cliente: string;
  base: ProcessedClient | null;
  compare: ProcessedClient | null;
}

export default function HistoricoPage() {
  const [snapshots,  setSnapshots]  = useState<SnapshotMeta[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [baseId,     setBaseId]     = useState('');
  const [compareId,  setCompareId]  = useState('');
  const [baseData,   setBaseData]   = useState<ProcessedClient[]>([]);
  const [compareData,setCompareData]= useState<ProcessedClient[]>([]);
  const [comparing,  setComparing]  = useState(false);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  useEffect(() => {
    loadSnapshots().then(s => { setSnapshots(s); setLoading(false); });
  }, []);

  const handleCompare = async () => {
    if (!baseId || !compareId || baseId === compareId) return;
    setComparing(true);
    const [b, c] = await Promise.all([
      loadSnapshotClientes(baseId),
      loadSnapshotClientes(compareId),
    ]);
    setBaseData(b);
    setCompareData(c);
    setComparing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este snapshot? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      await deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      if (baseId    === id) setBaseId('');
      if (compareId === id) setCompareId('');
      if (baseId === id || compareId === id) { setBaseData([]); setCompareData([]); }
    } finally {
      setDeleting(null);
    }
  };

  // --- Métricas agregadas ---
  const baseMetrics = useMemo(() => {
    if (!baseData.length) return null;
    return {
      avgMargin:    baseData.reduce((s, c) => s + c.actualMargin, 0) / baseData.length,
      totalOpp:     baseData.reduce((s, c) => s + c.opportunityEuros, 0),
      avgMixPower:  baseData.reduce((s, c) => s + c.mixPower, 0) / baseData.length,
      urgentCount:  baseData.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length,
    };
  }, [baseData]);

  const compareMetrics = useMemo(() => {
    if (!compareData.length) return null;
    return {
      avgMargin:    compareData.reduce((s, c) => s + c.actualMargin, 0) / compareData.length,
      totalOpp:     compareData.reduce((s, c) => s + c.opportunityEuros, 0),
      avgMixPower:  compareData.reduce((s, c) => s + c.mixPower, 0) / compareData.length,
      urgentCount:  compareData.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length,
    };
  }, [compareData]);

  // --- Tabla de evolución por cliente ---
  const evolutionRows = useMemo((): ClientRow[] => {
    if (!baseData.length && !compareData.length) return [];
    const allNames = Array.from(new Set([
      ...baseData.map(c => c.cliente),
      ...compareData.map(c => c.cliente),
    ]));
    const baseMap    = new Map(baseData.map(c => [c.cliente, c]));
    const compareMap = new Map(compareData.map(c => [c.cliente, c]));
    return allNames.map(name => ({
      cliente: name,
      base:    baseMap.get(name)    ?? null,
      compare: compareMap.get(name) ?? null,
    })).sort((a, b) => {
      // Ordenar por mayor oportunidad (del período de comparación o base)
      const oppA = (a.compare ?? a.base)?.opportunityEuros ?? 0;
      const oppB = (b.compare ?? b.base)?.opportunityEuros ?? 0;
      return oppB - oppA;
    });
  }, [baseData, compareData]);

  const hasComparison = baseData.length > 0 && compareData.length > 0;
  const baseMeta    = snapshots.find(s => s.id === baseId);
  const compareMeta = snapshots.find(s => s.id === compareId);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px', textAlign: 'left',
    fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.06em', color: D.muted,
    backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`, whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
            Evolución histórica
          </h1>
          <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Compara dos períodos para medir la evolución de tu cartera
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ fontSize: '14px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>Cargando históricos...</p>
        )}

        {/* Empty state */}
        {!loading && snapshots.length === 0 && (
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '64px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: D.dark, fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: '0 0 8px 0' }}>
              No hay históricos guardados
            </p>
            <p style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 20px 0' }}>
              Sube un CSV y guárdalo como histórico para empezar a medir la evolución.
            </p>
            <a href="/onboarding" style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
              Subir datos →
            </a>
          </div>
        )}

        {!loading && snapshots.length > 0 && (
          <>
            {/* Snapshots list */}
            <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${D.border}` }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Análisis guardados
                </p>
              </div>
              <div>
                {snapshots.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: i < snapshots.length - 1 ? `1px solid ${D.border}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 2px 0' }}>{s.nombre}</p>
                      <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        {fmtDate(s.fecha)} · {s.count} clientes
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      style={{ display: 'flex', alignItems: 'center', color: D.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '6px', opacity: deleting === s.id ? 0.4 : 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = D.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = D.muted)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparator */}
            {snapshots.length >= 2 && (
              <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 16px 0' }}>
                  Comparar dos períodos
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Período base</label>
                    <select
                      value={baseId}
                      onChange={e => setBaseId(e.target.value)}
                      style={{ border: `1px solid ${D.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.bg, outline: 'none', cursor: 'pointer', minWidth: '220px' }}
                    >
                      <option value="">Seleccionar período base...</option>
                      {snapshots.map(s => (
                        <option key={s.id} value={s.id}>{fmtSnapshotLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Período a comparar</label>
                    <select
                      value={compareId}
                      onChange={e => setCompareId(e.target.value)}
                      style={{ border: `1px solid ${D.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.bg, outline: 'none', cursor: 'pointer', minWidth: '220px' }}
                    >
                      <option value="">Seleccionar período a comparar...</option>
                      {snapshots.filter(s => s.id !== baseId).map(s => (
                        <option key={s.id} value={s.id}>{fmtSnapshotLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'transparent', fontFamily: 'Inter, sans-serif' }}>·</label>
                    <button
                      onClick={handleCompare}
                      disabled={!baseId || !compareId || comparing || baseId === compareId}
                      style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 500, border: 'none', cursor: (baseId && compareId && !comparing && baseId !== compareId) ? 'pointer' : 'not-allowed', backgroundColor: (baseId && compareId && baseId !== compareId) ? D.dark : D.border, color: (baseId && compareId && baseId !== compareId) ? '#fff' : D.muted }}
                    >
                      {comparing ? 'Cargando...' : 'Comparar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {snapshots.length === 1 && (
              <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px', fontSize: '13px', color: '#92400E', fontFamily: 'Inter, sans-serif' }}>
                Necesitas al menos 2 análisis guardados para hacer una comparativa. Sube otro CSV y guárdalo como histórico.
              </div>
            )}

            {/* Comparison results */}
            {hasComparison && baseMetrics && compareMetrics && (
              <>
                {/* Context bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif' }}>
                    <strong style={{ color: D.dark }}>{baseMeta?.nombre}</strong>
                    {' '}→{' '}
                    <strong style={{ color: D.dark }}>{compareMeta?.nombre}</strong>
                  </span>
                </div>

                {/* 4 metric comparison cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  <CompareCard
                    label="Margen medio"
                    base={`${fmt(baseMetrics.avgMargin)}%`}
                    compare={`${fmt(compareMetrics.avgMargin)}%`}
                    delta={compareMetrics.avgMargin - baseMetrics.avgMargin}
                    higherIsBetter
                  />
                  <CompareCard
                    label="Oportunidad total"
                    base={fmtEur(baseMetrics.totalOpp)}
                    compare={fmtEur(compareMetrics.totalOpp)}
                    delta={compareMetrics.totalOpp - baseMetrics.totalOpp}
                    higherIsBetter={false}
                  />
                  <CompareCard
                    label="Mix Power medio"
                    base={fmt(baseMetrics.avgMixPower, 2)}
                    compare={fmt(compareMetrics.avgMixPower, 2)}
                    delta={compareMetrics.avgMixPower - baseMetrics.avgMixPower}
                    higherIsBetter
                  />
                  <CompareCard
                    label="Clientes prioritarios"
                    base={String(baseMetrics.urgentCount)}
                    compare={String(compareMetrics.urgentCount)}
                    delta={compareMetrics.urgentCount - baseMetrics.urgentCount}
                    higherIsBetter={false}
                  />
                </div>

                {/* Evolution table */}
                <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 24px', borderBottom: `1px solid ${D.border}` }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                      Evolución por cliente
                    </p>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Cliente</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Mix Power base</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Mix Power actual</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Δ Mix Power</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Oport. base</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Oport. actual</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Δ Oport.</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Tendencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evolutionRows.map((row, i) => {
                          const mpBase    = row.base?.mixPower    ?? null;
                          const mpCompare = row.compare?.mixPower ?? null;
                          const oppBase    = row.base?.opportunityEuros    ?? null;
                          const oppCompare = row.compare?.opportunityEuros ?? null;
                          const deltaMp  = mpBase    != null && mpCompare  != null ? mpCompare  - mpBase    : null;
                          const deltaOpp = oppBase   != null && oppCompare != null ? oppCompare - oppBase   : null;
                          const isNew  = !row.base;
                          const isLost = !row.compare;
                          return (
                            <tr key={row.cliente} style={{ borderBottom: i < evolutionRows.length - 1 ? `1px solid ${D.border}` : 'none', backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                              <td style={{ padding: '12px 14px', fontWeight: 500, color: D.dark }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {row.cliente}
                                  {isNew  && <span style={{ fontSize: '10px', fontWeight: 600, color: '#065F46', backgroundColor: '#D1FAE5', borderRadius: '100px', padding: '2px 7px' }}>Nuevo</span>}
                                  {isLost && <span style={{ fontSize: '10px', fontWeight: 600, color: '#92400E', backgroundColor: '#FEF3C7', borderRadius: '100px', padding: '2px 7px' }}>Sin datos</span>}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: D.sec, fontVariantNumeric: 'tabular-nums' }}>
                                {mpBase != null ? fmt(mpBase, 2) : '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: D.dark, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                                {mpCompare != null ? fmt(mpCompare, 2) : '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                {deltaMp != null ? <Delta value={deltaMp} higherIsBetter suffix="" /> : <span style={{ color: D.muted }}>—</span>}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: D.sec, fontVariantNumeric: 'tabular-nums' }}>
                                {oppBase != null ? fmtEur(oppBase) : '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', color: D.dark, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                                {oppCompare != null ? fmtEur(oppCompare) : '—'}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                {deltaOpp != null ? <Delta value={deltaOpp} higherIsBetter={false} suffix="€" /> : <span style={{ color: D.muted }}>—</span>}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                {deltaMp != null ? <Trend delta={deltaMp} /> : <span style={{ color: D.muted }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
