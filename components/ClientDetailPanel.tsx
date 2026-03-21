'use client';

import { useState, useEffect } from 'react';
import { ProcessedClient, AppConfig } from '@/lib/types';
import PriorityBadge from './PriorityBadge';
import MixPowerBar from './MixPowerBar';
import { X, Download, Plus } from 'lucide-react';

interface Props {
  client: ProcessedClient;
  config: AppConfig;
  onClose: () => void;
}

interface ActionRow {
  accion: string;
  responsable: string;
  objetivo: string;
  fecha: string;
}

const D = {
  bg:     '#F7F6F2',
  white:  '#FFFFFF',
  dark:   '#1A1A18',
  sec:    '#6B6B67',
  muted:  '#9B9B97',
  border: '#E2E2DC',
  red:    '#C94040',
  green:  '#2D7A4F',
};

function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const EMPTY_ROW: ActionRow = { accion: '', responsable: '', objetivo: '', fecha: '' };

function planKey(cliente: string) {
  return `mixpower_plan_${cliente.replace(/\s+/g, '_')}`;
}

export default function ClientDetailPanel({ client, config, onClose }: Props) {
  const segment = config.segments.find(s =>
    s.name.toLowerCase().trim() === client.segmento.toLowerCase().trim()
  ) ?? config.segments[0];

  const familyRows = config.families.map(f => {
    const actual    = client.mix[f.id] ?? 0;
    const benchmark = segment[f.id as keyof typeof segment] as number;
    return { ...f, actual, benchmark, gap: actual - benchmark };
  });

  const top3 = [...familyRows].filter(f => f.gap < 0).sort((a, b) => a.gap - b.gap).slice(0, 3);

  // Action plan state
  const [plan, setPlan] = useState<ActionRow[]>([EMPTY_ROW, EMPTY_ROW, EMPTY_ROW]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(planKey(client.cliente));
      if (stored) setPlan(JSON.parse(stored));
    } catch {}
  }, [client.cliente]);

  const savePlan = (rows: ActionRow[]) => {
    setPlan(rows);
    try {
      localStorage.setItem(planKey(client.cliente), JSON.stringify(rows));
    } catch {}
  };

  const updatePlanRow = (idx: number, field: keyof ActionRow, value: string) => {
    const updated = plan.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    savePlan(updated);
  };

  const addPlanRow = () => savePlan([...plan, { ...EMPTY_ROW }]);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(26, 26, 24);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MixPower', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de cliente', 14, 19);
    doc.text(new Date().toLocaleDateString('es-ES'), 196, 11, { align: 'right' });

    doc.setTextColor(26, 26, 24);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(client.cliente, 14, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 107, 103);
    const meta = [client.ciudad, client.region, client.segmento, client.comercial, `${client.volumen} t`].filter(Boolean).join(' · ');
    doc.text(meta, 14, 45);

    const metrics = [
      { label: 'Margen actual', value: `${fmt(client.actualMargin)}%` },
      { label: 'Mix Power',     value: fmt(client.mixPower, 2) },
      { label: 'Gap',           value: client.gap > 0 ? `+${fmt(client.gap)} pp` : `${fmt(client.gap)} pp` },
      { label: 'Oportunidad',   value: fmtEur(client.opportunityEuros) },
    ];
    let mx = 14;
    metrics.forEach(m => {
      doc.setFillColor(247, 246, 242);
      doc.roundedRect(mx, 52, 43, 17, 2, 2, 'F');
      doc.setFontSize(7); doc.setTextColor(155, 155, 151);
      doc.text(m.label, mx + 3, 59);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
      doc.text(m.value, mx + 3, 66);
      doc.setFont('helvetica', 'normal');
      mx += 46;
    });

    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
    doc.text('Mix por familia', 14, 80);
    const colX = [14, 90, 130, 165];
    doc.setFontSize(7); doc.setTextColor(155, 155, 151);
    doc.setFillColor(247, 246, 242);
    doc.rect(14, 83, 182, 6, 'F');
    ['Familia', 'Mix actual %', 'Benchmark %', 'Gap pp'].forEach((h, i) => doc.text(h, colX[i] + 2, 87));

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    familyRows.forEach((row, idx) => {
      const y = 95 + idx * 7;
      if (idx % 2 === 0) { doc.setFillColor(252, 252, 251); doc.rect(14, y - 4, 182, 7, 'F'); }
      doc.setTextColor(26, 26, 24); doc.text(row.name, colX[0] + 2, y);
      doc.text(`${fmt(row.actual)}%`, colX[1] + 2, y);
      doc.text(`${fmt(row.benchmark)}%`, colX[2] + 2, y);
      const gs = (row.gap >= 0 ? '+' : '') + fmt(row.gap);
      doc.setTextColor(row.gap < -2 ? 201 : row.gap > 0 ? 45 : 107, row.gap < -2 ? 64 : row.gap > 0 ? 122 : 107, row.gap < -2 ? 64 : row.gap > 0 ? 79 : 103);
      doc.text(gs, colX[3] + 2, y);
    });

    const ry = 95 + familyRows.length * 7 + 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
    doc.text('Oportunidades de mejora', 14, ry);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    top3.forEach((f, i) => {
      const y = ry + 7 + i * 7;
      doc.setFillColor(254, 242, 242); doc.roundedRect(14, y - 4, 182, 6, 1, 1, 'F');
      doc.setTextColor(60, 60, 60);
      doc.text(`${i + 1}. ${f.name}: actual ${fmt(f.actual)}% vs benchmark ${fmt(f.benchmark)}% (gap ${fmt(f.gap)} pp)`, 17, y);
    });

    // Plan de acción
    const filledRows = plan.filter(r => r.accion || r.responsable || r.objetivo || r.fecha);
    if (filledRows.length > 0) {
      const py = ry + top3.length * 7 + 20;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
      doc.text('Plan de acción', 14, py);
      const pcols = [14, 70, 120, 155];
      doc.setFontSize(7); doc.setTextColor(155, 155, 151);
      doc.setFillColor(247, 246, 242);
      doc.rect(14, py + 3, 182, 6, 'F');
      ['Acción', 'Responsable', 'Objetivo', 'Fecha'].forEach((h, i) => doc.text(h, pcols[i] + 2, py + 7));
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      filledRows.forEach((r, idx) => {
        const y = py + 15 + idx * 7;
        if (idx % 2 === 0) { doc.setFillColor(252, 252, 251); doc.rect(14, y - 4, 182, 7, 'F'); }
        doc.setTextColor(26, 26, 24);
        doc.text(r.accion.slice(0, 30), pcols[0] + 2, y);
        doc.text(r.responsable.slice(0, 20), pcols[1] + 2, y);
        doc.text(r.objetivo.slice(0, 18), pcols[2] + 2, y);
        doc.text(r.fecha.slice(0, 12), pcols[3] + 2, y);
      });
    }

    doc.save(`MixPower_${client.cliente.replace(/\s/g, '_')}.pdf`);
  };

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px',
    fontSize: '11px', textTransform: 'uppercase',
    letterSpacing: '0.06em', color: D.muted,
    fontFamily: 'Inter, sans-serif', fontWeight: 500,
    backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`,
  };

  const planInputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${D.border}`, borderRadius: '4px',
    padding: '5px 8px', fontSize: '12px', fontFamily: 'Inter, sans-serif',
    color: D.dark, backgroundColor: D.white, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,24,0.25)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '480px', maxWidth: '100vw',
        backgroundColor: D.white, borderLeft: `1px solid ${D.border}`,
        display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '24px', color: D.dark, fontWeight: 400, margin: '0 0 4px 0' }}>
              {client.cliente}
            </h2>
            <p style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              {client.ciudad}{client.region ? ` · ${client.region}` : ''} · {client.segmento}{client.comercial ? ` · ${client.comercial}` : ''} · {client.volumen.toLocaleString('es-ES')} t
            </p>
          </div>
          <button onClick={onClose} style={{ color: D.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Priority + export */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PriorityBadge priority={client.priority} color={client.priorityColor} />
            <button
              onClick={handleExportPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: D.dark, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: 'pointer' }}
            >
              <Download size={13} />
              Exportar PDF
            </button>
          </div>

          {/* Metrics 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Margen actual',   value: `${fmt(client.actualMargin)}%` },
              { label: 'Mix Power',       value: null, custom: <MixPowerBar value={client.mixPower} /> },
              { label: 'Gap vs benchmark', value: client.gap > 0 ? `+${fmt(client.gap)} pp` : `${fmt(client.gap)} pp`, color: client.gap > 0 ? D.red : D.green },
              { label: 'Oportunidad',     value: fmtEur(client.opportunityEuros) },
            ].map((m, i) => (
              <div key={i} style={{ backgroundColor: D.bg, borderRadius: '8px', padding: '16px' }}>
                <p style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {m.label}
                </p>
                {m.custom
                  ? m.custom
                  : <p style={{ fontSize: '18px', fontFamily: '"Instrument Serif", Georgia, serif', color: m.color ?? D.dark, margin: 0, lineHeight: 1 }}>
                      {m.value}
                    </p>
                }
              </div>
            ))}
          </div>

          {/* Family table */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 10px 0' }}>
              Mix por familia de producto
            </p>
            <div style={{ border: `1px solid ${D.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, textAlign: 'left' }}>Familia</th>
                    <th style={{ ...th, textAlign: 'right' }}>Actual</th>
                    <th style={{ ...th, textAlign: 'right' }}>Bench.</th>
                    <th style={{ ...th, textAlign: 'right' }}>Gap</th>
                    <th style={{ ...th, width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {familyRows.map((row, i) => {
                    const isUnder = row.gap < -2;
                    const isAbove = row.gap > 0;
                    const barPct  = Math.min(Math.abs(row.gap) * 5, 100);
                    const gapColor = isUnder ? D.red : isAbove ? D.green : D.muted;
                    return (
                      <tr key={row.id} style={{ borderBottom: i < familyRows.length - 1 ? `1px solid ${D.border}` : 'none', backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                        <td style={{ padding: '10px 14px', color: D.dark, fontFamily: 'Inter, sans-serif' }}>{row.name}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: D.sec, fontFamily: 'Inter, sans-serif' }}>{fmt(row.actual)}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: D.muted, fontFamily: 'Inter, sans-serif' }}>{fmt(row.benchmark)}%</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: gapColor, fontFamily: 'Inter, sans-serif' }}>
                          {(row.gap >= 0 ? '+' : '') + fmt(row.gap)}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ height: '3px', backgroundColor: D.border, borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '3px', width: `${barPct}%`, backgroundColor: gapColor, borderRadius: '2px' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {top3.length > 0 && (
            <div style={{ border: `1px solid ${D.border}`, borderRadius: '8px', padding: '20px', backgroundColor: D.bg }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 12px 0' }}>
                Oportunidades de mejora
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {top3.map((f, i) => (
                  <li key={f.id} style={{ display: 'flex', gap: '10px', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>
                    <span style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', backgroundColor: D.dark, color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {i + 1}
                    </span>
                    <span style={{ color: D.sec, lineHeight: '1.5' }}>
                      <strong style={{ color: D.dark }}>{f.name}</strong>{' '}
                      — actual {fmt(f.actual)}% vs benchmark {fmt(f.benchmark)}%{' '}
                      (<strong style={{ color: D.red }}>{fmt(Math.abs(f.gap))} pp</strong> de gap)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {top3.length === 0 && (
            <div style={{ border: `1px solid #A7F3D0`, borderRadius: '8px', padding: '16px', backgroundColor: '#F0FDF4', fontSize: '13px', color: '#065F46', fontFamily: 'Inter, sans-serif' }}>
              Mix excelente. Este cliente está por encima del benchmark en todas las familias clave.
            </div>
          )}

          {/* Plan de acción */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                Plan de acción
              </p>
              <button
                onClick={addPlanRow}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', background: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer' }}
              >
                <Plus size={12} />
                Añadir acción
              </button>
            </div>
            <div style={{ border: `1px solid ${D.border}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
                <thead>
                  <tr>
                    {(['Acción', 'Responsable', 'Objetivo', 'Fecha'] as const).map(h => (
                      <th key={h} style={{ ...th, fontSize: '10px', padding: '8px 10px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < plan.length - 1 ? `1px solid ${D.border}` : 'none', backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={row.accion}
                          onChange={e => updatePlanRow(i, 'accion', e.target.value)}
                          placeholder="Acción..."
                          style={planInputStyle}
                          onFocus={e => (e.target.style.borderColor = D.dark)}
                          onBlur={e  => (e.target.style.borderColor = D.border)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={row.responsable}
                          onChange={e => updatePlanRow(i, 'responsable', e.target.value)}
                          placeholder="Nombre..."
                          style={planInputStyle}
                          onFocus={e => (e.target.style.borderColor = D.dark)}
                          onBlur={e  => (e.target.style.borderColor = D.border)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={row.objetivo}
                          onChange={e => updatePlanRow(i, 'objetivo', e.target.value)}
                          placeholder="Ej: +5pp"
                          style={planInputStyle}
                          onFocus={e => (e.target.style.borderColor = D.dark)}
                          onBlur={e  => (e.target.style.borderColor = D.border)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="date"
                          value={row.fecha}
                          onChange={e => updatePlanRow(i, 'fecha', e.target.value)}
                          style={planInputStyle}
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
      </div>
    </div>
  );
}
