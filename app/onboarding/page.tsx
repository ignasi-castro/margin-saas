'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import Link from 'next/link';
import { TrendingUp, Upload, Download, CheckCircle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { ClientRow } from '@/lib/types';
import { validateRow } from '@/lib/calculations';
import { saveRawClients } from '@/lib/store';
import { SAMPLE_CSV } from '@/lib/defaults';
import { createClient } from '@/lib/supabase';

interface ParsedResult {
  rows: ClientRow[];
  errors: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.company_name as string | undefined;
      if (name) {
        setGreeting(name);
        setCompany(name);
      }
    });
  }, []);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [fileName, setFileName] = useState('');

  const processFile = (file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (parsed) => {
        const rows: ClientRow[] = [];
        const errors: string[] = [];

        parsed.data.forEach((raw: unknown, i: number) => {
          const row = raw as Record<string, unknown>;
          const clientRow: ClientRow = {
            cliente: String(row['cliente'] ?? '').trim(),
            ciudad: String(row['ciudad'] ?? '').trim(),
            segmento: String(row['segmento'] ?? '').trim(),
            F1: Number(row['F1'] ?? 0),
            F2: Number(row['F2'] ?? 0),
            F3: Number(row['F3'] ?? 0),
            F4: Number(row['F4'] ?? 0),
            F5: Number(row['F5'] ?? 0),
            F6: Number(row['F6'] ?? 0),
            F7: Number(row['F7'] ?? 0),
            F8: Number(row['F8'] ?? 0),
            F9: Number(row['F9'] ?? 0),
            F10: Number(row['F10'] ?? 0),
            volumen: Number(row['volumen'] ?? 0),
          };
          const error = validateRow(clientRow, i);
          if (error) errors.push(error);
          rows.push(clientRow);
        });

        setResult({ rows, errors });
      },
      error: (err) => {
        setResult({ rows: [], errors: [`Error leyendo el archivo: ${err.message}`] });
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mixpower_ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinue = () => {
    if (!result || result.rows.length === 0 || result.errors.length > 0) return;
    saveRawClients(result.rows, company || 'Mi empresa');
    router.push('/dashboard');
  };

  const canContinue = result && result.rows.length > 0 && result.errors.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#1e3a5f]">MixPower</span>
        </Link>
        <span className="text-gray-300 mx-1">/</span>
        <span className="text-gray-500 text-sm">Subida de datos</span>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            {greeting && (
              <p className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Hola, <span className="font-medium text-[#1e3a5f]">{greeting}</span>
              </p>
            )}
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Importa tu cartera de clientes</h1>
            <p className="text-gray-500 text-sm">
              Sube un CSV con el mix de producto de cada cliente. Calcularemos el Mix Power y la oportunidad de margen automáticamente.
            </p>
          </div>

          {/* Company name */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de tu empresa (opcional)
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Ej: Morteros García S.A."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
          </div>

          {/* Upload zone */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Archivo CSV</h2>
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-1.5 text-xs text-[#1e3a5f] font-medium hover:underline"
              >
                <Download size={13} />
                Descargar CSV de ejemplo
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer ${
                dragActive ? 'border-[#1e3a5f] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload size={22} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  {fileName ? fileName : 'Arrastra tu CSV aquí o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Solo archivos .csv</p>
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Column reference */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Columnas requeridas en el CSV:</p>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                cliente, ciudad, segmento, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, volumen
              </p>
              <p className="text-xs text-gray-400 mt-2">
                F1–F10 son los % del mix de cada familia (deben sumar 100 por cliente).
                Volumen en toneladas.
              </p>
            </div>
          </div>

          {/* Validation results */}
          {result && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
              {result.errors.length === 0 ? (
                <div className="flex items-start gap-3 text-green-700">
                  <CheckCircle size={20} className="flex-shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Archivo válido</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {result.rows.length} clientes cargados correctamente
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3 text-red-700 mb-3">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Errores de validación</p>
                      <p className="text-xs text-red-500 mt-0.5">Corrige los errores antes de continuar</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {result.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        <X size={12} className="flex-shrink-0 mt-0.5" />
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold transition-all ${
              canContinue
                ? 'bg-[#1e3a5f] text-white hover:bg-[#16325a] shadow-lg shadow-blue-900/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Ver dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
