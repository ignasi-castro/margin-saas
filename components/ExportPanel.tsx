'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Table2, ClipboardList, Clock } from 'lucide-react';
import { ProcessedClient } from '@/lib/types';
import { loadProcessedClients, loadCompany } from '@/lib/store';
import { loadSnapshots, loadSnapshotClientes, SnapshotMeta } from '@/lib/snapshots';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC', green: '#2D7A4F' };

function fmt(n: number, d = 1) { return n.toFixed(d); }
function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function safeFilename(s: string) { return (s || 'cartera').replace(/[^a-z0-9]/gi, '_'); }

interface Props { onClose: () => void; }

export default function ExportPanel({ onClose }: Props) {
  const [clients, setClients]     = useState<ProcessedClient[]>([]);
  const [company, setCompany]     = useState('');
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [busy, setBusy]           = useState<string | null>(null);

  useEffect(() => {
    setClients(loadProcessedClients());
    setCompany(loadCompany());
    loadSnapshots().then(setSnapshots).catch(() => {});
  }, []);

  // ── A) Resumen PDF ──────────────────────────────────────────────────────────
  const exportResumenPDF = async () => {
    setBusy('resumen');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.setFillColor(26, 26, 24);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('MixPower', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Resumen de cartera', 14, 20);
      doc.text(fecha, 196, 12, { align: 'right' });

      doc.setTextColor(26, 26, 24);
      doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text(company || 'Mi empresa', 14, 42);

      const avgMargin   = clients.length ? clients.reduce((s, c) => s + c.actualMargin, 0) / clients.length : 0;
      const totalOpp    = clients.reduce((s, c) => s + c.opportunityEuros, 0);
      const avgMixPower = clients.length ? clients.reduce((s, c) => s + c.mixPower, 0) / clients.length : 0;
      const urgentCount = clients.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta').length;

      const metrics = [
        { label: 'Margen medio',        value: `${fmt(avgMargin)}%` },
        { label: 'Oportunidad total',   value: fmtEur(totalOpp) },
        { label: 'Mix Power medio',     value: fmt(avgMixPower, 2) },
        { label: 'Clientes prioritarios', value: String(urgentCount) },
      ];
      let mx = 14;
      metrics.forEach(m => {
        doc.setFillColor(247, 246, 242);
        doc.roundedRect(mx, 50, 44, 18, 2, 2, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(155, 155, 151);
        doc.text(m.label, mx + 3, 57);
        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
        doc.text(m.value, mx + 3, 65);
        doc.setFont('helvetica', 'normal');
        mx += 47;
      });

      const top10 = [...clients].sort((a, b) => b.opportunityEuros - a.opportunityEuros).slice(0, 10);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
      doc.text('Top 10 oportunidades', 14, 82);

      const cols = [14, 68, 98, 126, 153, 178];
      doc.setFillColor(247, 246, 242);
      doc.rect(14, 85, 182, 6, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(155, 155, 151);
      ['Cliente', 'Segmento', 'Margen', 'Mix Power', 'Oport. €', 'Prioridad'].forEach((h, i) => doc.text(h, cols[i] + 1, 89));

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(26, 26, 24);
      top10.forEach((c, i) => {
        const y = 98 + i * 8;
        if (i % 2 === 0) { doc.setFillColor(252, 252, 251); doc.rect(14, y - 4, 182, 8, 'F'); }
        doc.text(c.cliente.slice(0, 26), cols[0] + 1, y);
        doc.text(c.segmento.slice(0, 15), cols[1] + 1, y);
        doc.text(`${fmt(c.actualMargin)}%`, cols[2] + 1, y);
        doc.text(fmt(c.mixPower, 2), cols[3] + 1, y);
        doc.text(fmtEur(c.opportunityEuros), cols[4] + 1, y);
        doc.text(c.priority, cols[5] + 1, y);
      });

      doc.save(`Resumen_${safeFilename(company)}_${todayStr()}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  // ── B) Clientes CSV ─────────────────────────────────────────────────────────
  const exportClientesCSV = () => {
    const headers = ['cliente','ciudad','region','comercial','segmento','ventas','volumen','margen_actual','mix_power','gap','margen_6m','oportunidad_eur','prioridad'];
    const rows = clients.map(c => [
      c.cliente, c.ciudad, c.region, c.comercial, c.segmento,
      c.ventas.toFixed(0), c.volumen.toString(),
      fmt(c.actualMargin), fmt(c.mixPower, 2),
      fmt(c.gap), fmt(c.potentialMargin6M),
      c.opportunityEuros.toFixed(0), c.priority,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${safeFilename(company)}_${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── C) Plan de acción PDF ───────────────────────────────────────────────────
  const exportPlanPDF = async () => {
    const priorityClients = clients.filter(c => c.priority === 'Muy Alta' || c.priority === 'Alta');
    const clientsWithPlans = priorityClients.filter(c => {
      try {
        const stored = localStorage.getItem(`mixpower_plan_${c.cliente.replace(/\s+/g, '_')}`);
        if (!stored) return false;
        const plan = JSON.parse(stored) as Array<Record<string, string>>;
        return plan.some(r => r.accion || r.responsable || r.objetivo || r.fecha);
      } catch { return false; }
    });

    if (clientsWithPlans.length === 0) {
      alert('No hay clientes prioritarios con planes de acción rellenados.');
      return;
    }

    setBusy('plan');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.setFillColor(26, 26, 24);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('MixPower', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Plan de acción — clientes prioritarios', 14, 20);
      doc.text(fecha, 196, 12, { align: 'right' });

      let y = 42;
      clientsWithPlans.forEach((c, ci) => {
        if (ci > 0) { y += 6; }
        if (y > 240) { doc.addPage(); y = 20; }

        doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
        doc.text(c.cliente, 14, y);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 107, 103);
        doc.text(`Mix Power: ${fmt(c.mixPower, 2)} · Oportunidad: ${fmtEur(c.opportunityEuros)} · ${c.segmento}`, 14, y + 6);
        y += 14;

        const plan: Array<Record<string, string>> = (() => {
          try {
            const stored = localStorage.getItem(`mixpower_plan_${c.cliente.replace(/\s+/g, '_')}`);
            return stored ? JSON.parse(stored) : [];
          } catch { return []; }
        })();
        const filled = plan.filter(r => r.accion || r.responsable || r.objetivo || r.fecha);

        const pcols = [14, 72, 122, 158];
        doc.setFillColor(247, 246, 242); doc.rect(14, y, 182, 6, 'F');
        doc.setFontSize(7); doc.setTextColor(155, 155, 151);
        ['Acción', 'Responsable', 'Objetivo', 'Fecha'].forEach((h, i) => doc.text(h, pcols[i] + 1, y + 4));
        y += 8;

        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(26, 26, 24);
        filled.forEach((r, ri) => {
          if (y > 270) { doc.addPage(); y = 20; }
          if (ri % 2 === 0) { doc.setFillColor(252, 252, 251); doc.rect(14, y - 2, 182, 7, 'F'); }
          doc.text((r.accion || '').slice(0, 32), pcols[0] + 1, y + 3);
          doc.text((r.responsable || '').slice(0, 20), pcols[1] + 1, y + 3);
          doc.text((r.objetivo || '').slice(0, 18), pcols[2] + 1, y + 3);
          doc.text((r.fecha || ''), pcols[3] + 1, y + 3);
          y += 7;
        });
      });

      doc.save(`Plan_accion_${safeFilename(company)}_${todayStr()}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  // ── D) Histórico PDF ────────────────────────────────────────────────────────
  const exportHistoricoPDF = async () => {
    if (snapshots.length < 2) {
      alert('Necesitas al menos 2 análisis guardados para exportar el histórico.');
      return;
    }
    setBusy('historico');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.setFillColor(26, 26, 24);
      doc.rect(0, 0, 297, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('MixPower', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Evolución histórica', 14, 20);
      doc.text(fecha, 283, 12, { align: 'right' });

      const snapshotsData = await Promise.all(
        snapshots.map(s => loadSnapshotClientes(s.id).catch(() => [] as ProcessedClient[]))
      );

      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 24);
      doc.text('Resumen por análisis', 14, 40);

      const sumCols = [14, 82, 112, 148, 188, 232];
      doc.setFillColor(247, 246, 242);
      doc.rect(14, 43, 269, 6, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(155, 155, 151);
      ['Análisis', 'Fecha', 'Clientes', 'Margen medio', 'Oportunidad total', 'Mix Power medio'].forEach((h, i) => {
        doc.text(h, sumCols[i] + 1, 47);
      });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(26, 26, 24);
      snapshots.forEach((s, i) => {
        const data = snapshotsData[i];
        const avgM  = data.length ? data.reduce((a, c) => a + c.actualMargin, 0) / data.length : 0;
        const totalO = data.reduce((a, c) => a + c.opportunityEuros, 0);
        const avgMP = data.length ? data.reduce((a, c) => a + c.mixPower, 0) / data.length : 0;
        const y = 56 + i * 8;
        if (i % 2 === 0) { doc.setFillColor(252, 252, 251); doc.rect(14, y - 4, 269, 8, 'F'); }
        doc.text(s.nombre.slice(0, 32), sumCols[0] + 1, y);
        doc.text(new Date(s.fecha + 'T12:00:00').toLocaleDateString('es-ES'), sumCols[1] + 1, y);
        doc.text(String(s.count), sumCols[2] + 1, y);
        doc.text(`${fmt(avgM)}%`, sumCols[3] + 1, y);
        doc.text(fmtEur(totalO), sumCols[4] + 1, y);
        doc.text(fmt(avgMP, 2), sumCols[5] + 1, y);
      });

      doc.save(`Historico_${safeFilename(company)}_${todayStr()}.pdf`);
    } finally {
      setBusy(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const options = [
    {
      key: 'resumen',
      icon: <FileText size={20} />,
      title: 'Resumen',
      desc: 'PDF de una página con métricas principales y top 10 clientes por oportunidad.',
      label: 'Exportar PDF',
      action: exportResumenPDF,
      disabled: clients.length === 0,
    },
    {
      key: 'clientes',
      icon: <Table2 size={20} />,
      title: 'Clientes',
      desc: 'CSV con todas las columnas: margen, Mix Power, gap, oportunidad y prioridad.',
      label: 'Exportar CSV',
      action: exportClientesCSV,
      disabled: clients.length === 0,
    },
    {
      key: 'plan',
      icon: <ClipboardList size={20} />,
      title: 'Plan de acción',
      desc: 'PDF con los clientes prioritarios que tienen acciones rellenadas.',
      label: 'Exportar PDF',
      action: exportPlanPDF,
      disabled: clients.length === 0,
    },
    {
      key: 'historico',
      icon: <Clock size={20} />,
      title: 'Histórico',
      desc: 'PDF comparativo de todos los análisis guardados.',
      label: 'Exportar PDF',
      action: exportHistoricoPDF,
      disabled: snapshots.length < 2,
      disabledReason: snapshots.length < 2 ? 'Necesitas al menos 2 análisis guardados' : undefined,
    },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '72px 16px 16px' }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '380px',
        backgroundColor: D.white, border: `1px solid ${D.border}`,
        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Exportar
          </p>
          <button onClick={onClose} style={{ color: D.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Options */}
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {options.map(opt => (
            <div key={opt.key} style={{
              padding: '16px',
              border: `1px solid ${D.border}`,
              borderRadius: '8px',
              backgroundColor: opt.disabled ? D.bg : D.white,
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              opacity: opt.disabled ? 0.6 : 1,
            }}>
              <div style={{ color: D.muted, flexShrink: 0, marginTop: '2px' }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: D.dark, fontFamily: 'Inter, sans-serif', margin: '0 0 3px 0' }}>
                  {opt.title}
                </p>
                <p style={{ fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {opt.disabledReason ?? opt.desc}
                </p>
                <button
                  onClick={opt.action}
                  disabled={opt.disabled || busy === opt.key}
                  style={{
                    fontSize: '12px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    backgroundColor: opt.disabled ? D.border : D.dark,
                    color: opt.disabled ? D.muted : '#fff',
                    border: 'none', borderRadius: '6px',
                    padding: '6px 14px', cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: busy === opt.key ? 0.6 : 1,
                  }}
                >
                  {busy === opt.key ? 'Generando...' : opt.label}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
