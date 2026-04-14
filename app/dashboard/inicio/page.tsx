'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ProcessedClient, AppConfig } from '@/lib/types';
import { loadConfig, loadProcessedClients } from '@/lib/store';
import DashboardNav from '@/components/DashboardNav';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC' };

const CONCEPTS = [
  {
    title: 'Mix Power Score',
    body: 'Ratio entre el margen actual del cliente y el margen benchmark de su segmento. Un Mix Power de 0,81 significa que el cliente está al 81% de su potencial de margen.',
  },
  {
    title: 'Gap de margen',
    body: 'Diferencia en puntos porcentuales entre el margen actual del cliente y el benchmark de su segmento. Un gap de 5,3 pp sobre 2.000 toneladas son €84.800 de margen recuperable.',
  },
  {
    title: 'Margen Potencial 6M',
    body: 'Proyección del margen alcanzable en 6 meses aplicando el factor de captura configurado. Fórmula: Margen actual + (Gap × Factor de captura)',
  },
  {
    title: 'Oportunidad en €',
    body: 'Margen adicional recuperable en euros si se alcanza el Margen Potencial 6M con el volumen actual del cliente.',
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '22px', fontWeight: 400, color: D.dark, margin: '0 0 16px 0' }}>
      {children}
    </h2>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: D.muted,
  backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`,
};
const tdStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark,
  borderBottom: `1px solid ${D.border}`,
};

export default function InicioPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [clients, setClients] = useState<ProcessedClient[]>([]);

  useEffect(() => {
    setConfig(loadConfig());
    setClients(loadProcessedClients());
  }, []);

  // Benchmark dinámico por segmento: el cliente con mayor margen actual
  const segmentBenchmarks = useMemo(() => {
    if (!config || !clients.length) return [];
    return config.segments.map(seg => {
      const segClients = clients.filter(c =>
        c.segmento.toLowerCase().trim() === seg.name.toLowerCase().trim()
      );
      if (!segClients.length) return { seg, client: null };
      const best = segClients.reduce((a, b) => (a.actualMargin > b.actualMargin ? a : b));
      return { seg, client: best };
    });
  }, [config, clients]);

  if (!config) return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <DashboardNav />
    </div>
  );

  const captureRate = config.captureRate ?? 0.40;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>
      <DashboardNav />

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
            Guía del modelo
          </h1>
          <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Definiciones, parámetros y configuración activa
          </p>
        </div>

        {/* Section A — Conceptos clave */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Conceptos clave</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {CONCEPTS.map(c => (
              <div key={c.title} style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '22px 24px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: D.dark, margin: '0 0 8px 0' }}>
                  {c.title}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: D.sec, margin: 0, lineHeight: 1.65 }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section B — Familias y segmentos */}
        <div style={{ marginBottom: '48px' }}>
          <SectionTitle>Familias y segmentos configurados</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

            {/* Familias */}
            <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Familias de producto
                </p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nombre</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {config.families.map((f, i) => (
                    <tr key={f.id} style={{ backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                      <td style={tdStyle}>{f.name}</td>
                      <td style={{ ...tdStyle, color: D.sec }}>{f.type}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: '"Instrument Serif", Georgia, serif', borderBottom: `1px solid ${D.border}` }}>
                        {f.margin}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Segmentos */}
            <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Segmentos de cliente
                </p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Segmento</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {config.segments.map((s, i) => (
                    <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                      <td style={tdStyle}>{s.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: '"Instrument Serif", Georgia, serif', borderBottom: `1px solid ${D.border}` }}>
                        {s.benchmarkMargin}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
          {/* Tabla benchmarks dinámicos */}
          {segmentBenchmarks.some(sb => sb.client !== null) && (
            <div style={{ marginTop: '16px', backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Clientes benchmark por segmento
                </p>
                <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '4px 0 0 0' }}>
                  El cliente con mayor margen actual de cada segmento — referencia dinámica calculada sobre los datos cargados
                </p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Segmento</th>
                      <th style={thStyle}>Cliente benchmark</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Margen %</th>
                      {config!.families.map(f => (
                        <th key={f.id} style={{ ...thStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segmentBenchmarks.map(({ seg, client: bm }, i) => (
                      <tr key={seg.id} style={{ backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                        <td style={tdStyle}>{seg.name}</td>
                        <td style={{ ...tdStyle, color: bm ? D.dark : D.muted }}>
                          {bm ? bm.cliente : '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: '"Instrument Serif", Georgia, serif', color: '#2D7A4F', fontWeight: 600 }}>
                          {bm ? `${bm.actualMargin.toFixed(1)}%` : '—'}
                        </td>
                        {config!.families.map(f => (
                          <td key={f.id} style={{ ...tdStyle, textAlign: 'right', color: D.sec }}>
                            {bm ? `${(bm.mix[f.id] ?? 0).toFixed(0)}%` : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <Link href="/configuracion"
              style={{ display: 'inline-block', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, textDecoration: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '8px 16px', backgroundColor: D.white }}>
              Editar configuración →
            </Link>
          </div>
        </div>

        {/* Section C — Factor de captura */}
        <div>
          <SectionTitle>Factor de captura actual</SectionTitle>
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '80px' }}>
              <p style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '56px', color: D.dark, margin: 0, lineHeight: 1 }}>
                {Math.round(captureRate * 100)}%
              </p>
              <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '4px 0 0 0' }}>
                Factor de captura
              </p>
            </div>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <p style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: '0 0 8px 0', lineHeight: 1.65 }}>
                Porcentaje del gap de margen que se estima recuperable en 6 meses. Se aplica para calcular el Margen Potencial 6M y la oportunidad por familia.
              </p>
              <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                35% = conservador · 40% = estándar · 60% = ambicioso
              </p>
            </div>
            <Link href="/configuracion"
              style={{ display: 'inline-block', fontSize: '13px', fontFamily: 'Inter, sans-serif', color: D.dark, textDecoration: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '8px 16px', backgroundColor: D.white, whiteSpace: 'nowrap' }}>
              Modificar →
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
