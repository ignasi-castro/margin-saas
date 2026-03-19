'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Settings, Upload, ChevronUp, ChevronDown, ChevronsUpDown, LogOut } from 'lucide-react';
import { ProcessedClient, AppConfig } from '@/lib/types';
import { loadProcessedClients, loadCompany, loadConfig } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import MetricCard from '@/components/MetricCard';
import PriorityBadge from '@/components/PriorityBadge';
import MixPowerBar from '@/components/MixPowerBar';
import ClientDetailPanel from '@/components/ClientDetailPanel';

type SortKey = keyof ProcessedClient;
type SortDir = 'asc' | 'desc';

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmt(n: number, d = 1) {
  return n.toFixed(d);
}

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ProcessedClient[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [company, setCompany] = useState('');
  const [selected, setSelected] = useState<ProcessedClient | null>(null);
  const [segmentFilter, setSegmentFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('opportunityEuros');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loaded = loadProcessedClients();
    if (loaded.length === 0) {
      router.push('/onboarding');
      return;
    }
    setClients(loaded);
    setCompany(loadCompany());
    setConfig(loadConfig());

    // Get current user email
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, [router]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const segments = useMemo(() => Array.from(new Set(clients.map(c => c.segmento))), [clients]);
  const priorities = ['Muy Alta', 'Alta', 'Media', 'Mantener'];

  const filtered = useMemo(() => {
    let list = [...clients];
    if (segmentFilter) list = list.filter(c => c.segmento === segmentFilter);
    if (priorityFilter) list = list.filter(c => c.priority === priorityFilter);
    list.sort((a, b) => {
      const va = a[sortKey] as number | string;
      const vb = b[sortKey] as number | string;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return list;
  }, [clients, segmentFilter, priorityFilter, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const avgMargin = clients.length ? clients.reduce((s, c) => s + c.actualMargin, 0) / clients.length : 0;
  const totalOpportunity = clients.reduce((s, c) => s + c.opportunityEuros, 0);
  const avgMixPower = clients.length ? clients.reduce((s, c) => s + c.mixPower, 0) / clients.length : 0;
  const urgentCount = clients.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length;

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-gray-300 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-[#1e3a5f] ml-1 inline" />
      : <ChevronDown size={13} className="text-[#1e3a5f] ml-1 inline" />;
  };

  const thClass = (k: SortKey) =>
    `px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 cursor-pointer select-none whitespace-nowrap hover:text-[#1e3a5f] transition-colors ${sortKey === k ? 'text-[#1e3a5f]' : ''}`;

  if (clients.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#1e3a5f]">MixPower</span>
          {company && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500 font-medium">{company}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] font-medium transition-colors"
          >
            <Upload size={15} />
            Nueva carga
          </Link>
          <Link
            href="/configuracion"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] font-medium transition-colors"
          >
            <Settings size={15} />
            Configuración
          </Link>
          {userEmail && (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
              <span className="text-xs text-gray-400 hidden sm:block" style={{ fontFamily: 'Inter, sans-serif' }}>
                {userEmail}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 px-6 py-6 max-w-screen-xl mx-auto w-full">
        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Margen medio de cartera"
            value={`${fmt(avgMargin)}%`}
            subtitle="Media ponderada de todos los clientes"
          />
          <MetricCard
            title="Oportunidad total de margen"
            value={fmtEur(totalOpportunity)}
            subtitle="Margen recuperable en 6 meses"
            accent="green"
          />
          <MetricCard
            title="Mix Power medio"
            value={fmt(avgMixPower, 2)}
            subtitle="vs. benchmark de cada segmento"
            accent={avgMixPower < 0.65 ? 'red' : avgMixPower < 0.80 ? 'default' : 'blue'}
          />
          <MetricCard
            title="Clientes prioritarios"
            value={String(urgentCount)}
            subtitle="Con prioridad Muy Alta o Alta"
            accent="red"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <select
            value={segmentFilter}
            onChange={e => setSegmentFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todos los segmentos</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">Todas las prioridades</option>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(segmentFilter || priorityFilter) && (
            <button
              onClick={() => { setSegmentFilter(''); setPriorityFilter(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400">{filtered.length} clientes</span>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={thClass('cliente')} onClick={() => handleSort('cliente')}>
                    Cliente <SortIcon k="cliente" />
                  </th>
                  <th className={thClass('ciudad')} onClick={() => handleSort('ciudad')}>
                    Ciudad <SortIcon k="ciudad" />
                  </th>
                  <th className={thClass('segmento')} onClick={() => handleSort('segmento')}>
                    Segmento <SortIcon k="segmento" />
                  </th>
                  <th className={thClass('volumen')} onClick={() => handleSort('volumen')}>
                    Volumen (t) <SortIcon k="volumen" />
                  </th>
                  <th className={thClass('actualMargin')} onClick={() => handleSort('actualMargin')}>
                    Margen actual <SortIcon k="actualMargin" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 min-w-[160px]">
                    Mix Power
                  </th>
                  <th className={thClass('gap')} onClick={() => handleSort('gap')}>
                    Gap (pp) <SortIcon k="gap" />
                  </th>
                  <th className={thClass('potentialMargin6M')} onClick={() => handleSort('potentialMargin6M')}>
                    Margen 6M <SortIcon k="potentialMargin6M" />
                  </th>
                  <th className={thClass('opportunityEuros')} onClick={() => handleSort('opportunityEuros')}>
                    Oportunidad (€) <SortIcon k="opportunityEuros" />
                  </th>
                  <th className={thClass('priority')} onClick={() => handleSort('priority')}>
                    Prioridad <SortIcon k="priority" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr
                    key={`${client.cliente}-${i}`}
                    className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                    onClick={() => setSelected(client)}
                  >
                    <td className="px-4 py-3 font-semibold text-[#1e3a5f]">{client.cliente}</td>
                    <td className="px-4 py-3 text-gray-600">{client.ciudad}</td>
                    <td className="px-4 py-3 text-gray-600">{client.segmento}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {client.volumen.toLocaleString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums font-medium">
                      {fmt(client.actualMargin)}%
                    </td>
                    <td className="px-4 py-3">
                      <MixPowerBar value={client.mixPower} />
                    </td>
                    <td className={`px-4 py-3 tabular-nums font-semibold ${client.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {client.gap > 0 ? '+' : ''}{fmt(client.gap)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {fmt(client.potentialMargin6M)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-[#1e3a5f]">
                      {fmtEur(client.opportunityEuros)}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={client.priority} color={client.priorityColor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400 text-sm">
              No hay clientes que coincidan con los filtros seleccionados
            </div>
          )}
        </div>
      </main>

      {selected && config && (
        <ClientDetailPanel
          client={selected}
          config={config}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
