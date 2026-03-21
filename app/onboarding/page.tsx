'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import Link from 'next/link';
import { Upload, Download, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { ClientRow } from '@/lib/types';
import { validateRow } from '@/lib/calculations';
import { saveRawClients, loadProcessedClients } from '@/lib/store';
import { SAMPLE_CSV } from '@/lib/defaults';
import { createClient } from '@/lib/supabase';
import { saveSnapshot } from '@/lib/snapshots';

const D = { bg: '#F7F6F2', white: '#FFFFFF', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC', green: '#2D7A4F', red: '#C94040' };

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="10" y="10" width="11" height="12" rx="0"   fill={D.bg} />
    </svg>
  );
}

function defaultSnapshotName() {
  const now = new Date();
  const mes = now.toLocaleDateString('es-ES', { month: 'long' });
  return `Análisis ${mes} ${now.getFullYear()}`;
}

interface ParsedResult { rows: ClientRow[]; errors: string[]; }

export default function OnboardingPage() {
  const router = useRouter();
  const [company, setCompany]       = useState('');
  const [greeting, setGreeting]     = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult]         = useState<ParsedResult | null>(null);
  const [fileName, setFileName]     = useState('');

  // Modal de guardar snapshot
  const [showModal, setShowModal]       = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState('');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.company_name as string | undefined;
      if (name) { setGreeting(name); setCompany(name); }
    });
  }, []);

  const processFile = (file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
      complete: (parsed) => {
        const rows: ClientRow[] = []; const errors: string[] = [];
        parsed.data.forEach((raw: unknown, i: number) => {
          const row = raw as Record<string, unknown>;
          const ventasRaw = row['ventas'];
          const clientRow: ClientRow = {
            cliente: String(row['cliente'] ?? '').trim(), ciudad: String(row['ciudad'] ?? '').trim(),
            segmento: String(row['segmento'] ?? '').trim(),
            region: String(row['region'] ?? '').trim() || undefined,
            comercial: String(row['comercial'] ?? '').trim() || undefined,
            F1: Number(row['F1'] ?? 0), F2: Number(row['F2'] ?? 0), F3: Number(row['F3'] ?? 0),
            F4: Number(row['F4'] ?? 0), F5: Number(row['F5'] ?? 0), F6: Number(row['F6'] ?? 0),
            F7: Number(row['F7'] ?? 0), F8: Number(row['F8'] ?? 0), F9: Number(row['F9'] ?? 0),
            F10: Number(row['F10'] ?? 0), volumen: Number(row['volumen'] ?? 0),
            ...(ventasRaw != null && ventasRaw !== '' ? { ventas: Number(ventasRaw) } : {}),
          };
          const error = validateRow(clientRow, i);
          if (error) errors.push(error);
          rows.push(clientRow);
        });
        setResult({ rows, errors });
      },
      error: (err) => setResult({ rows: [], errors: [`Error leyendo el archivo: ${err.message}`] }),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
  }, []);

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mixpower_ejemplo.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  // Al hacer clic en "Ver dashboard" guardamos los datos localmente y mostramos el modal
  const handleContinue = () => {
    if (!result || result.rows.length === 0 || result.errors.length > 0) return;
    saveRawClients(result.rows, company || 'Mi empresa');
    setSnapshotName(defaultSnapshotName());
    setSaveError('');
    setShowModal(true);
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const processed = loadProcessedClients();
      await saveSnapshot(snapshotName || defaultSnapshotName(), processed);
    } catch {
      setSaveError('No se pudo guardar el histórico. Continuando sin guardar.');
      await new Promise(r => setTimeout(r, 1500));
    } finally {
      setSaving(false);
      router.push('/dashboard');
    }
  };

  const handleSkipSave = () => {
    setShowModal(false);
    router.push('/dashboard');
  };

  const canContinue = result && result.rows.length > 0 && result.errors.length === 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: D.bg, display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', position: 'sticky', top: 0, zIndex: 40 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Logo />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', color: D.dark }}>MixPower</span>
        </Link>
        <span style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>Importar cartera</span>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '600px' }}>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            {greeting && (
              <p style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '0 0 8px 0' }}>
                Hola, <span style={{ color: D.dark, fontWeight: 500 }}>{greeting}</span>
              </p>
            )}
            <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '40px', fontWeight: 400, color: D.dark, margin: '0 0 10px 0', lineHeight: 1.1 }}>
              Importa tu cartera.
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 300, color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.6 }}>
              Sube un CSV con el mix de producto de cada cliente y calcularemos el Mix Power automáticamente.
            </p>
          </div>

          {/* Company */}
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '24px', marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Nombre de empresa
            </label>
            <input
              type="text" value={company} onChange={e => setCompany(e.target.value)}
              placeholder="Morteros García S.A."
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '10px 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.bg, outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = D.dark)}
              onBlur={e  => (e.target.style.borderColor = D.border)}
            />
          </div>

          {/* Upload zone */}
          <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '24px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Archivo CSV
              </span>
              <button
                onClick={handleDownloadSample}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', background: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
              >
                <Download size={12} />
                Descargar ejemplo
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => document.getElementById('csv-input')?.click()}
              style={{
                border: `1px dashed ${dragActive ? D.dark : D.border}`,
                borderRadius: '10px', padding: '48px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                cursor: 'pointer', backgroundColor: dragActive ? 'rgba(26,26,24,0.02)' : D.bg,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: D.white, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={18} color={D.muted} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: fileName ? D.dark : D.sec, fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0', fontWeight: fileName ? 500 : 400 }}>
                  {fileName || 'Arrastra tu CSV aquí o haz clic'}
                </p>
                <p style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: 0 }}>Solo archivos .csv</p>
              </div>
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Column hint */}
            <div style={{ marginTop: '16px', backgroundColor: D.bg, borderRadius: '6px', padding: '12px 14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: D.muted, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0' }}>
                Columnas requeridas
              </p>
              <p style={{ fontSize: '12px', color: D.sec, fontFamily: 'monospace', margin: 0, lineHeight: 1.6 }}>
                cliente, ciudad, segmento, F1–F10, volumen
              </p>
              <p style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', margin: '6px 0 0 0' }}>
                F1–F10 deben sumar 100 por cliente. Volumen en toneladas. Columnas opcionales: region, comercial, ventas.
              </p>
            </div>
          </div>

          {/* Validation */}
          {result && (
            <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
              {result.errors.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={18} color={D.green} />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>Archivo válido</p>
                    <p style={{ fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: '2px 0 0 0' }}>{result.rows.length} clientes cargados correctamente</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <AlertCircle size={18} color={D.red} />
                    <p style={{ fontSize: '13px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', margin: 0 }}>Errores de validación</p>
                  </div>
                  <div style={{ border: `1px solid ${D.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', borderBottom: i < result.errors.length - 1 ? `1px solid ${D.border}` : 'none', backgroundColor: i % 2 === 0 ? D.white : D.bg }}>
                        <X size={12} color={D.red} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '12px', color: D.red, fontFamily: 'Inter, sans-serif' }}>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue} disabled={!canContinue}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '13px', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed',
              backgroundColor: canContinue ? D.dark : D.border,
              color: canContinue ? '#fff' : D.muted,
              transition: 'opacity 0.15s',
            }}
          >
            Ver dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </main>

      {/* Modal guardar snapshot */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,24,0.4)' }} />

          {/* Card */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '480px', backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '12px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '24px', fontWeight: 400, color: D.dark, margin: '0 0 8px 0' }}>
              ¿Guardar como histórico?
            </h2>
            <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Guarda este análisis en Supabase para poder comparar la evolución de tu cartera en el futuro.
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: D.dark, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Nombre del análisis
            </label>
            <input
              type="text"
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '10px 14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', color: D.dark, backgroundColor: D.bg, outline: 'none', marginBottom: '8px' }}
              onFocus={e => (e.target.style.borderColor = D.dark)}
              onBlur={e  => (e.target.style.borderColor = D.border)}
            />

            {saveError && (
              <p style={{ fontSize: '12px', color: D.red, fontFamily: 'Inter, sans-serif', margin: '0 0 12px 0' }}>{saveError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSaveAndContinue}
                disabled={saving}
                style={{ flex: 1, padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', backgroundColor: D.dark, color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Guardando...' : 'Guardar y continuar'}
              </button>
              <button
                onClick={handleSkipSave}
                disabled={saving}
                style={{ flex: 1, padding: '12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, border: `1px solid ${D.border}`, cursor: 'pointer', backgroundColor: D.white, color: D.sec }}
              >
                Continuar sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
