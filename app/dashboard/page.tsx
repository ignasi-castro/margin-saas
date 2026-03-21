'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronsUpDown, LogOut, Upload, Settings } from 'lucide-react';
import { ProcessedClient, AppConfig } from '@/lib/types';
import { loadProcessedClients, loadCompany, loadConfig } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import MetricCard from '@/components/MetricCard';
import PriorityBadge from '@/components/PriorityBadge';
import MixPowerBar from '@/components/MixPowerBar';
import ClientDetailPanel from '@/components/ClientDetailPanel';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC' };

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="10" y="10" width="11" height="12" rx="0"   fill={D.bg} />
    </svg>
  );
}

type SortKey = keyof ProcessedClient;
type SortDir = 'asc' | 'desc';

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmtVentas(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M€`;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function fmt(n: number, d = 1) { return n.toFixed(d); }

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients]   = useState<ProcessedClient[]>([]);
  const [config, setConfig]     = useState<AppConfig | null>(null);
  const [company, setCompany]   = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [selected, setSelected] = useState<ProcessedClient | null>(null);
  const [segFilter, setSegFilter]     = useState('');
  const [priFilter, setPriFilter]     = useState('');
  const [regFilter, setRegFilter]     = useState('');
  const [comFilter, setComFilter]     = useState('');
  const [sortKey, setSortKey]         = useState<SortKey>('opportunityEuros');
  const [sortDir, setSortDir]   = useState<SortDir>('desc');

  useEffect(() => {
    const loaded = loadProcessedClients();
    if (loaded.length === 0) { router.push('/onboarding'); return; }
    setClients(loaded);
    setCompany(loadCompany());
    setConfig(loadConfig());
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [router]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const segments    = useMemo(() => Array.from(new Set(clients.map(c => c.segmento))).filter(Boolean), [clients]);
  const regions     = useMemo(() => Array.from(new Set(clients.map(c => c.region))).filter(Boolean).sort(), [clients]);
  const comerciales = useMemo(() => Array.from(new Set(clients.map(c => c.comercial))).filter(Boolean).sort(), [clients]);
  const priorities  = ['Muy Alta', 'Alta', 'Media', 'Mantener'];

  const filtered = useMemo(() => {
    let list = [...clients];
    if (segFilter) list = list.filter(c => c.segmento  === segFilter);
    if (priFilter) list = list.filter(c => c.priority  === priFilter);
    if (regFilter) list = list.filter(c => c.region    === regFilter);
    if (comFilter) list = list.filter(c => c.comercial === comFilter);
    list.sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return list;
  }, [clients, segFilter, priFilter, regFilter, comFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const avgMargin      = clients.length ? clients.reduce((s, c) => s + c.actualMargin, 0) / clients.length : 0;
  const totalOpportunity = clients.reduce((s, c) => s + c.opportunityEuros, 0);
  const avgMixPower    = clients.length ? clients.reduce((s, c) => s + c.mixPower, 0) / clients.length : 0;
  const urgentCount    = clients.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length;

  const now = new Date();
  const subtitle = `Cartera de clientes · ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={12} style={{ color: D.border, display: 'inline', marginLeft: '4px' }} />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} style={{ color: D.dark, display: 'inline', marginLeft: '4px' }} />
      : <ChevronDown size={12} style={{ color: D.dark, display: 'inline', marginLeft: '4px' }} />;
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left',
    fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.06em', color: D.muted,
    backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`,
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
  };

  if (clients.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: D.muted, fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Logo />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', color: D.dark }}>MixPower</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link href="/onboarding" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
            <Upload size={13} /> Subir datos
          </Link>
          <Link href="/configuracion" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
            <Settings size={13} /> Configuración
          </Link>
          {userEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: `1px solid ${D.border}` }}>
              <span style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </span>
              <button onClick={handleSignOut} title="Cerrar sesión"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
            {company || 'Tu cartera'}
          </h1>
          <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0, textTransform: 'capitalize' }}>
            {subtitle}
          </p>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          <MetricCard label="Margen medio de cartera"    value={`${fmt(avgMargin)}%`}        subtitle="Media ponderada de clientes" />
          <MetricCard label="Oportunidad total"          value={fmtEur(totalOpportunity)}    subtitle="Recuperable en 6 meses" />
          <MetricCard label="Mix Power medio"            value={fmt(avgMixPower, 2)}         subtitle="vs. benchmark de segmento" />
          <MetricCard label="Clientes prioritarios"      value={String(urgentCount)}         subtitle="Prioridad Muy Alta o Alta" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { value: segFilter, setter: setSegFilter, options: segments,    placeholder: 'Todos los segmentos' },
            { value: priFilter, setter: setPriFilter, options: priorities,  placeholder: 'Todas las prioridades' },
            { value: regFilter, setter: setRegFilter, options: regions,     placeholder: 'Todas las regiones' },
            { value: comFilter, setter: setComFilter, options: comerciales, placeholder: 'Todos los comerciales' },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={e => f.setter(e.target.value)}
              style={{ border: `1px solid ${D.border}`, borderRadius: '6px', padding: '7px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.white, outline: 'none', cursor: 'pointer' }}>
              <option value="">{f.placeholder}</option>
              {f.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          {(segFilter || priFilter || regFilter || comFilter) && (
            <button onClick={() => { setSegFilter(''); setPriFilter(''); setRegFilter(''); setComFilter(''); }}
              style={{ fontSize: '13px', color: D.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
              Limpiar
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} clientes
          </span>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
              <thead>
                <tr>
                  {([
                    ['cliente', 'Cliente'], ['ciudad', 'Ciudad'], ['region', 'Región'], ['comercial', 'Comercial'], ['segmento', 'Segmento'],
                    ['ventas', 'Ventas (€)'], ['volumen', 'Volumen (t)'], ['actualMargin', 'Margen actual'],
                    [null, 'Mix Power'],
                    ['gap', 'Gap (pp)'], ['potentialMargin6M', 'Margen 6M'],
                    ['opportunityEuros', 'Oportunidad (€)'], ['priority', 'Prioridad'],
                  ] as [SortKey | null, string][]).map(([key, label]) => (
                    <th key={label} style={thStyle} onClick={key ? () => handleSort(key) : undefined}>
                      {label}{key && <SortIcon k={key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={`${c.cliente}-${i}`}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom: `1px solid ${D.border}`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = D.bg)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = D.white)}>
                    <td style={{ padding: '14px 16px', color: D.dark, fontWeight: 500 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.cliente}
                        {c.mixPower >= 1.0 && (
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#065F46', backgroundColor: '#D1FAE5', borderRadius: '100px', padding: '2px 7px', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', flexShrink: 0 }}>
                            Benchmark
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: D.sec }}>{c.ciudad}</td>
                    <td style={{ padding: '14px 16px', color: D.sec }}>{c.region || '—'}</td>
                    <td style={{ padding: '14px 16px', color: D.sec }}>{c.comercial || '—'}</td>
                    <td style={{ padding: '14px 16px', color: D.sec }}>{c.segmento}</td>
                    <td style={{ padding: '14px 16px', color: D.dark, fontVariantNumeric: 'tabular-nums' }}>{fmtVentas(c.ventas)}</td>
                    <td style={{ padding: '14px 16px', color: D.dark, fontVariantNumeric: 'tabular-nums' }}>{c.volumen.toLocaleString('es-ES')}</td>
                    <td style={{ padding: '14px 16px', color: D.dark, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.actualMargin)}%</td>
                    <td style={{ padding: '14px 16px' }}><MixPowerBar value={c.mixPower} /></td>
                    <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: c.gap > 0 ? '#C94040' : '#2D7A4F' }}>
                      {c.gap > 0 ? `+${fmt(c.gap)}` : fmt(c.gap)}
                    </td>
                    <td style={{ padding: '14px 16px', color: D.sec, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.potentialMargin6M)}%</td>
                    <td style={{ padding: '14px 16px', color: D.dark, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{fmtEur(c.opportunityEuros)}</td>
                    <td style={{ padding: '14px 16px' }}><PriorityBadge priority={c.priority} color={c.priorityColor} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '64px', textAlign: 'center', color: D.muted, fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
              No hay clientes que coincidan con los filtros
            </div>
          )}
        </div>
      </main>

      {selected && config && (
        <ClientDetailPanel client={selected} config={config} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
