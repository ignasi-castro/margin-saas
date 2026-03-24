'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { ProcessedClient, AppConfig } from '@/lib/types';
import { loadProcessedClients, loadConfig } from '@/lib/store';
import PriorityBadge from '@/components/PriorityBadge';
import MixPowerBar from '@/components/MixPowerBar';
import DashboardNav from '@/components/DashboardNav';
import FamilyRecommendations from '@/components/FamilyRecommendations';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC' };

interface ActionRow {
  accion: string;
  responsable: string;
  objetivo: string;
  fecha: string;
}

const EMPTY_ROW: ActionRow = { accion: '', responsable: '', objetivo: '', fecha: '' };

function planKey(cliente: string) {
  return `mixpower_plan_${cliente.replace(/\s+/g, '_')}`;
}

function loadPlan(cliente: string): ActionRow[] {
  try {
    const stored = localStorage.getItem(planKey(cliente));
    if (stored) return JSON.parse(stored);
  } catch {}
  return [{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }];
}

function savePlan(cliente: string, rows: ActionRow[]) {
  try {
    localStorage.setItem(planKey(cliente), JSON.stringify(rows));
  } catch {}
}

function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

// Card de plan por cliente — componente propio para gestionar su estado independiente
function ClientPlanCard({ client, config }: { client: ProcessedClient; config: AppConfig }) {
  const [plan, setPlan] = useState<ActionRow[]>(() => loadPlan(client.cliente));

  const updateRow = (idx: number, field: keyof ActionRow, value: string) => {
    const updated = plan.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    setPlan(updated);
    savePlan(client.cliente, updated);
  };

  const addRow = () => {
    const updated = [...plan, { ...EMPTY_ROW }];
    setPlan(updated);
    savePlan(client.cliente, updated);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${D.border}`, borderRadius: '4px',
    padding: '5px 8px', fontSize: '12px', fontFamily: 'Inter, sans-serif',
    color: D.dark, backgroundColor: D.white, outline: 'none', boxSizing: 'border-box',
  };

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '8px 10px',
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
    color: D.muted, fontFamily: 'Inter, sans-serif', fontWeight: 500,
    backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`,
  };

  return (
    <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '20px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0' }}>
              {client.cliente}
            </h3>
            <p style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {client.ciudad}{client.region ? ` · ${client.region}` : ''}{client.comercial ? ` · ${client.comercial}` : ''} · {client.segmento}
            </p>
          </div>
          <PriorityBadge priority={client.priority} color={client.priorityColor} />
        </div>
        {/* Métricas rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '10px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px 0' }}>Mix Power</p>
            <MixPowerBar value={client.mixPower} />
          </div>
          <div>
            <p style={{ fontSize: '10px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>Margen actual</p>
            <p style={{ fontSize: '14px', fontFamily: '"Instrument Serif", Georgia, serif', color: D.dark, margin: 0 }}>{fmt(client.actualMargin)}%</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>Oportunidad</p>
            <p style={{ fontSize: '14px', fontFamily: '"Instrument Serif", Georgia, serif', color: D.dark, margin: 0 }}>{fmtEur(client.opportunityEuros)}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>Margen objetivo 6M</p>
            <p style={{ fontSize: '14px', fontFamily: '"Instrument Serif", Georgia, serif', color: D.dark, margin: 0 }}>{fmt(client.potentialMargin6M)}%</p>
          </div>
        </div>
      </div>

      {/* Plan table */}
      <div style={{ padding: '20px 24px' }}>
        <FamilyRecommendations client={client} config={config} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Plan de acción
          </p>
          <button
            onClick={addRow}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', background: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}
          >
            <Plus size={12} /> Añadir acción
          </button>
        </div>
        <div style={{ border: `1px solid ${D.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Inter, sans-serif', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '32%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '24%' }} />
            </colgroup>
            <thead>
              <tr>
                {(['Acción', 'Responsable', 'Objetivo', 'Fecha'] as const).map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.map((row, i) => (
                <tr key={i} style={{ borderBottom: i < plan.length - 1 ? `1px solid ${D.border}` : 'none', backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      value={row.accion}
                      onChange={e => updateRow(i, 'accion', e.target.value)}
                      placeholder="Acción..."
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = D.dark)}
                      onBlur={e  => (e.target.style.borderColor = D.border)}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      value={row.responsable}
                      onChange={e => updateRow(i, 'responsable', e.target.value)}
                      placeholder="Nombre..."
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = D.dark)}
                      onBlur={e  => (e.target.style.borderColor = D.border)}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      value={row.objetivo}
                      onChange={e => updateRow(i, 'objetivo', e.target.value)}
                      placeholder="Ej: +5pp"
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = D.dark)}
                      onBlur={e  => (e.target.style.borderColor = D.border)}
                    />
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <input
                      type="date"
                      value={row.fecha}
                      onChange={e => updateRow(i, 'fecha', e.target.value)}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = D.dark)}
                      onBlur={e  => (e.target.style.borderColor = D.border)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ProcessedClient[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [segFilter, setSegFilter] = useState('');
  const [regFilter, setRegFilter] = useState('');
  const [comFilter, setComFilter] = useState('');

  useEffect(() => {
    const loaded = loadProcessedClients();
    if (loaded.length === 0) { router.push('/onboarding'); return; }
    const priority = loaded
      .filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta')
      .sort((a, b) => b.opportunityEuros - a.opportunityEuros);
    setClients(priority);
    setConfig(loadConfig());
  }, [router]);

  const segments    = useMemo(() => Array.from(new Set(clients.map(c => c.segmento))).filter(Boolean), [clients]);
  const regions     = useMemo(() => Array.from(new Set(clients.map(c => c.region))).filter(Boolean).sort(), [clients]);
  const comerciales = useMemo(() => Array.from(new Set(clients.map(c => c.comercial))).filter(Boolean).sort(), [clients]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (segFilter) list = list.filter(c => c.segmento  === segFilter);
    if (regFilter) list = list.filter(c => c.region    === regFilter);
    if (comFilter) list = list.filter(c => c.comercial === comFilter);
    return list;
  }, [clients, segFilter, regFilter, comFilter]);

  if (clients.length === 0 || !config) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
        <DashboardNav />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: D.muted, fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
            No hay clientes con prioridad Muy Alta o Alta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
            Plan de acción
          </h1>
          <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            {clients.length} clientes con prioridad Muy Alta o Alta · ordenados por oportunidad
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { value: segFilter, setter: setSegFilter, options: segments,    placeholder: 'Todos los segmentos' },
            { value: regFilter, setter: setRegFilter, options: regions,     placeholder: 'Todas las regiones' },
            { value: comFilter, setter: setComFilter, options: comerciales, placeholder: 'Todos los comerciales' },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={e => f.setter(e.target.value)}
              style={{ border: `1px solid ${D.border}`, borderRadius: '6px', padding: '7px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.white, outline: 'none', cursor: 'pointer' }}>
              <option value="">{f.placeholder}</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {(segFilter || regFilter || comFilter) && (
            <button onClick={() => { setSegFilter(''); setRegFilter(''); setComFilter(''); }}
              style={{ fontSize: '13px', color: D.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
              Limpiar
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} clientes
          </span>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(c => (
            <ClientPlanCard key={c.cliente} client={c} config={config} />
          ))}
        </div>

      </main>
    </div>
  );
}
