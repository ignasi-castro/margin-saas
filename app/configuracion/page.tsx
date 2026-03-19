'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, RotateCcw, Plus, Trash2, Upload, Settings, LogOut } from 'lucide-react';
import { AppConfig, SegmentBenchmark } from '@/lib/types';
import { loadConfig, saveConfig } from '@/lib/store';
import { DEFAULT_CONFIG } from '@/lib/defaults';
import { createClient } from '@/lib/supabase';

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

function generateId(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
}

export default function ConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    setConfig(loadConfig());
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

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

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${D.border}`, borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px',
    fontFamily: 'Inter, sans-serif', color: D.dark,
    backgroundColor: D.white, outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const numInputStyle: React.CSSProperties = {
    border: `1px solid ${D.border}`, borderRadius: '6px',
    padding: '6px 8px', fontSize: '13px', textAlign: 'right',
    fontFamily: 'Inter, sans-serif', color: D.dark,
    backgroundColor: D.white, outline: 'none', width: '72px',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: D.muted,
    fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
    letterSpacing: '0.06em', margin: '0 0 4px 0',
  };

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
          <Link href="/configuracion" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.dark, fontFamily: 'Inter, sans-serif', textDecoration: 'none', fontWeight: 500 }}>
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

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: D.dark, margin: '0 0 4px 0', lineHeight: 1.1 }}>
              Configuración
            </h1>
            <p style={{ fontSize: '14px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              <Link href="/dashboard" style={{ color: D.sec, textDecoration: 'none' }}>Dashboard</Link>
              {' · '}Configuración
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', background: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}
            >
              <RotateCcw size={13} />
              Restablecer
            </button>
            <button
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', backgroundColor: saved ? D.green : D.dark, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              <Save size={13} />
              {saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Families card */}
        <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${D.border}` }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: D.dark, margin: '0 0 4px 0' }}>
              Márgenes por familia de producto
            </h2>
            <p style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              Margen de contribución (%) de cada familia. Se usa para calcular el margen actual de cada cliente.
            </p>
          </div>
          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {config.families.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: D.dark, fontFamily: 'Inter, sans-serif', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ color: D.muted, fontWeight: 400, marginRight: '6px' }}>{f.id}</span>
                    {f.name}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>{f.type}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    value={f.margin}
                    onChange={e => updateFamilyMargin(f.id, parseFloat(e.target.value) || 0)}
                    style={numInputStyle}
                    onFocus={e => (e.target.style.borderColor = D.dark)}
                    onBlur={e  => (e.target.style.borderColor = D.border)}
                  />
                  <span style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segments card */}
        <div style={{ backgroundColor: D.white, border: `1px solid ${D.border}`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${D.border}` }}>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: D.dark, margin: '0 0 4px 0' }}>
              Benchmarks por segmento
            </h2>
            <p style={{ fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', margin: 0 }}>
              Mix ideal (%) y margen benchmark de cada segmento de distribuidor.
            </p>
          </div>

          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {config.segments.map(seg => (
              <div key={seg.id} style={{ border: `1px solid ${D.border}`, borderRadius: '8px', padding: '20px', backgroundColor: D.bg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: D.dark, fontFamily: 'Inter, sans-serif' }}>{seg.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: D.sec, fontFamily: 'Inter, sans-serif' }}>Margen benchmark:</span>
                      <input
                        type="number" min={0} max={100} step={0.1}
                        value={seg.benchmarkMargin}
                        onChange={e => updateSegmentBenchmark(seg.id, 'benchmarkMargin', parseFloat(e.target.value) || 0)}
                        style={{ ...numInputStyle, width: '60px', fontSize: '12px', padding: '4px 8px' }}
                        onFocus={e => (e.target.style.borderColor = D.dark)}
                        onBlur={e  => (e.target.style.borderColor = D.border)}
                      />
                      <span style={{ fontSize: '12px', color: D.muted, fontFamily: 'Inter, sans-serif' }}>%</span>
                    </div>
                  </div>
                  {config.segments.length > 1 && (
                    <button
                      onClick={() => deleteSegment(seg.id)}
                      style={{ color: D.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = D.red)}
                      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = D.muted)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {config.families.map(f => (
                    <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={sectionLabelStyle}>{f.id}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number" min={0} max={100} step={0.5}
                          value={seg[f.id as keyof SegmentBenchmark] as number}
                          onChange={e => updateSegmentBenchmark(seg.id, f.id, parseFloat(e.target.value) || 0)}
                          style={{ ...numInputStyle, width: '100%', fontSize: '12px', padding: '5px 8px' }}
                          onFocus={e => (e.target.style.borderColor = D.dark)}
                          onBlur={e  => (e.target.style.borderColor = D.border)}
                        />
                        <span style={{ fontSize: '11px', color: D.muted, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Add segment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
              <input
                type="text"
                value={newSegmentName}
                onChange={e => setNewSegmentName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSegment()}
                placeholder="Nombre del nuevo segmento..."
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = D.dark)}
                onBlur={e  => (e.target.style.borderColor = D.border)}
              />
              <button
                onClick={addSegment}
                disabled={!newSegmentName.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, fontFamily: 'Inter, sans-serif', backgroundColor: newSegmentName.trim() ? D.dark : D.border, color: newSegmentName.trim() ? '#fff' : D.muted, border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: newSegmentName.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                <Plus size={14} />
                Añadir segmento
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
