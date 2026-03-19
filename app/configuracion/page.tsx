'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Save, RotateCcw, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { AppConfig, SegmentBenchmark } from '@/lib/types';
import { loadConfig, saveConfig } from '@/lib/store';
import { DEFAULT_CONFIG } from '@/lib/defaults';

function generateId(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('¿Restaurar la configuración por defecto? Se perderán los cambios.')) {
      setConfig(DEFAULT_CONFIG);
      saveConfig(DEFAULT_CONFIG);
    }
  };

  const updateFamilyMargin = (id: string, margin: number) => {
    setConfig(prev => ({
      ...prev,
      families: prev.families.map(f => f.id === id ? { ...f, margin } : f),
    }));
  };

  const updateSegmentBenchmark = (segId: string, field: string, value: number | string) => {
    setConfig(prev => ({
      ...prev,
      segments: prev.segments.map(s =>
        s.id === segId ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addSegment = () => {
    if (!newSegmentName.trim()) return;
    const newSeg: SegmentBenchmark = {
      id: generateId(newSegmentName),
      name: newSegmentName.trim(),
      F1: 0, F2: 0, F3: 0, F4: 0, F5: 0,
      F6: 0, F7: 0, F8: 0, F9: 0, F10: 0,
      benchmarkMargin: 0,
    };
    setConfig(prev => ({ ...prev, segments: [...prev.segments, newSeg] }));
    setNewSegmentName('');
  };

  const deleteSegment = (id: string) => {
    setConfig(prev => ({ ...prev, segments: prev.segments.filter(s => s.id !== id) }));
  };

  const inputCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] w-full bg-white";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#1e3a5f]">MixPower</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500 font-medium">Configuración</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            <RotateCcw size={14} />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-[#1e3a5f] text-white hover:bg-[#16325a]'
            }`}
          >
            <Save size={14} />
            {saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </nav>

      <main className="flex-1 px-6 py-6 max-w-4xl mx-auto w-full">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1e3a5f] mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al dashboard
        </Link>

        {/* Families section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#1e3a5f]">Márgenes por familia de producto</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Edita el margen de contribución (%) de cada familia. Se usa para calcular el margen actual de cada cliente.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.families.map(f => (
              <div key={f.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400 w-7">{f.id}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{f.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                      {f.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={f.margin}
                    onChange={e => updateFamilyMargin(f.id, parseFloat(e.target.value) || 0)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segments section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-[#1e3a5f]">Benchmarks por segmento</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Define el mix ideal (%) y el margen benchmark de cada segmento de distribuidor.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {config.segments.map(seg => (
              <div key={seg.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1e3a5f]">{seg.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>Margen benchmark:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={seg.benchmarkMargin}
                        onChange={e => updateSegmentBenchmark(seg.id, 'benchmarkMargin', parseFloat(e.target.value) || 0)}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  {config.segments.length > 1 && (
                    <button
                      onClick={() => deleteSegment(seg.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {config.families.map(f => (
                    <div key={f.id} className="flex flex-col gap-1">
                      <label className="text-xs text-gray-400 font-medium">{f.id}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          value={seg[f.id as keyof SegmentBenchmark] as number}
                          onChange={e => updateSegmentBenchmark(seg.id, f.id, parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] bg-white"
                        />
                        <span className="text-xs text-gray-300">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add segment */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                value={newSegmentName}
                onChange={e => setNewSegmentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSegment()}
                placeholder="Nombre del nuevo segmento..."
                className={inputCls}
              />
              <button
                onClick={addSegment}
                disabled={!newSegmentName.trim()}
                className="flex items-center gap-1.5 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16325a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Plus size={15} />
                Añadir segmento
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
