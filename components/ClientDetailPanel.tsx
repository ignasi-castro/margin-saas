'use client';

import { ProcessedClient, AppConfig } from '@/lib/types';
import PriorityBadge from './PriorityBadge';
import MixPowerBar from './MixPowerBar';
import { X, Download } from 'lucide-react';

interface Props {
  client: ProcessedClient;
  config: AppConfig;
  onClose: () => void;
}

function fmt(n: number, decimals = 1) {
  return n.toFixed(decimals);
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function ClientDetailPanel({ client, config, onClose }: Props) {
  const families = config.families;

  // Find segment benchmark
  const segment = config.segments.find(s =>
    s.name.toLowerCase().trim() === client.segmento.toLowerCase().trim()
  ) ?? config.segments[0];

  const familyRows = families.map(f => {
    const actual = client.mix[f.id] ?? 0;
    const benchmark = segment[f.id as keyof typeof segment] as number;
    const gap = actual - benchmark;
    return { ...f, actual, benchmark, gap };
  });

  // Top 3 opportunity families (most negative gap = most underdev)
  const top3 = [...familyRows]
    .filter(f => f.gap < 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 3);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MixPower', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Informe de cliente', 14, 20);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('es-ES'), 180, 12, { align: 'right' });

    // Client title
    doc.setTextColor(30, 58, 95);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(client.cliente, 14, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${client.ciudad} · ${client.segmento} · ${client.volumen} t`, 14, 47);

    // Metrics row
    const metrics = [
      { label: 'Margen actual', value: `${fmt(client.actualMargin)}%` },
      { label: 'Mix Power', value: fmt(client.mixPower, 2) },
      { label: 'Gap vs benchmark', value: `${fmt(client.gap)} pp` },
      { label: 'Oportunidad', value: fmtEur(client.opportunityEuros) },
    ];
    let x = 14;
    metrics.forEach(m => {
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(x, 54, 43, 18, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(m.label, x + 3, 61);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 95);
      doc.text(m.value, x + 3, 68);
      doc.setFont('helvetica', 'normal');
      x += 47;
    });

    // Family table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Mix de producto por familia', 14, 82);

    const headers = ['Familia', 'Mix actual %', 'Benchmark %', 'Gap pp'];
    const colX = [14, 90, 130, 165];
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 85, 182, 7, 'F');
    headers.forEach((h, i) => doc.text(h, colX[i] + 2, 90));

    doc.setFont('helvetica', 'normal');
    familyRows.forEach((row, idx) => {
      const y = 97 + idx * 8;
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(14, y - 4, 182, 8, 'F');
      }
      doc.setTextColor(30, 58, 95);
      doc.text(row.name, colX[0] + 2, y);
      doc.text(`${fmt(row.actual)}%`, colX[1] + 2, y);
      doc.text(`${fmt(row.benchmark)}%`, colX[2] + 2, y);
      const gapStr = (row.gap >= 0 ? '+' : '') + fmt(row.gap);
      doc.setTextColor(row.gap < -2 ? 220 : row.gap > 0 ? 22 : 100, row.gap < -2 ? 38 : row.gap > 0 ? 163 : 100, row.gap < -2 ? 38 : row.gap > 0 ? 74 : 100);
      doc.text(gapStr, colX[3] + 2, y);
    });

    // Recommendations
    const recY = 97 + familyRows.length * 8 + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('Oportunidades de mejora', 14, recY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    top3.forEach((f, i) => {
      const y = recY + 8 + i * 8;
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, y - 5, 182, 7, 1, 1, 'F');
      doc.text(`${i + 1}. ${f.name}: mix actual ${fmt(f.actual)}% vs benchmark ${fmt(f.benchmark)}% (gap ${fmt(f.gap)} pp)`, 18, y);
    });

    doc.save(`MixPower_${client.cliente.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{client.cliente}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{client.ciudad} · {client.segmento} · {client.volumen} t</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors mt-0.5">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Priority + export */}
          <div className="flex items-center justify-between">
            <PriorityBadge priority={client.priority} color={client.priorityColor} />
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16325a] transition-colors"
            >
              <Download size={15} />
              Exportar informe PDF
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Margen actual', value: `${fmt(client.actualMargin)}%`, accent: 'text-[#1e3a5f]' },
              { label: 'Mix Power', value: <MixPowerBar value={client.mixPower} />, accent: '' },
              { label: 'Gap vs benchmark', value: `${fmt(client.gap)} pp`, accent: client.gap > 0 ? 'text-red-600' : 'text-green-600' },
              { label: 'Oportunidad (€)', value: fmtEur(client.opportunityEuros), accent: 'text-[#1e3a5f]' },
            ].map((m, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-1">{m.label}</p>
                <div className={`text-lg font-bold ${m.accent}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Family table */}
          <div>
            <h3 className="text-sm font-semibold text-[#1e3a5f] mb-3">Mix por familia de producto</h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                    <th className="text-left px-4 py-3">Familia</th>
                    <th className="text-right px-4 py-3">Actual %</th>
                    <th className="text-right px-4 py-3">Benchmark %</th>
                    <th className="text-right px-4 py-3">Gap pp</th>
                    <th className="px-4 py-3 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {familyRows.map((row, i) => {
                    const isUnderdev = row.gap < -2;
                    const isAbove = row.gap > 0;
                    const barPct = Math.min(Math.abs(row.gap) * 5, 100);
                    return (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{fmt(row.actual)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{fmt(row.benchmark)}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${isUnderdev ? 'text-red-600' : isAbove ? 'text-green-600' : 'text-gray-500'}`}>
                          {(row.gap >= 0 ? '+' : '') + fmt(row.gap)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${barPct}%`,
                                backgroundColor: isUnderdev ? '#dc2626' : isAbove ? '#16a34a' : '#9ca3af',
                              }}
                            />
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
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Oportunidades de mejora detectadas</h3>
              <p className="text-xs text-amber-700 mb-3">
                Las 3 familias con mayor potencial de recuperación de margen para este cliente son:
              </p>
              <ul className="space-y-2">
                {top3.map((f, i) => (
                  <li key={f.id} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-amber-900">
                      <strong>{f.name}</strong>: mix actual {fmt(f.actual)}% vs benchmark {fmt(f.benchmark)}%
                      — gap de <strong className="text-red-600">{fmt(Math.abs(f.gap))} pp</strong> a desarrollar
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {top3.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              Este cliente tiene un mix excelente. Está por encima del benchmark en todas las familias clave.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
