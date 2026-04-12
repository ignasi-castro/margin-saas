'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Upload, Download, Settings, LogOut, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { loadCompany } from '@/lib/store';
import ExportPanel from './ExportPanel';

const D = { bg: '#F7F6F2', dark: '#1A1A18', sec: '#6B6B67', muted: '#9B9B97', border: '#E2E2DC' };

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill={D.dark} />
      <rect x="10" y="10" width="11" height="12" rx="0"   fill={D.bg} />
    </svg>
  );
}

const TABS = [
  { label: 'Inicio',         href: '/dashboard/inicio' },
  { label: 'Resumen',        href: '/dashboard' },
  { label: 'Clientes',       href: '/dashboard/tabla' },
  { label: 'Histórico',      href: '/dashboard/historico' },
  { label: 'Plan de acción', href: '/dashboard/plan' },
];

export default function DashboardNav() {
  const router      = useRouter();
  const pathname    = usePathname();
  const [userEmail,    setUserEmail]    = useState('');
  const [company,      setCompany]      = useState('');
  const [showExport,   setShowExport]   = useState(false);

  useEffect(() => {
    setCompany(loadCompany());
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname === href;

  return (
    <>
      <nav style={{ backgroundColor: D.bg, borderBottom: `1px solid ${D.border}`, position: 'sticky', top: 0, zIndex: 40 }}>

        {/* Top bar */}
        <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Logo />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', color: D.dark }}>MixPower</span>
            {company && (
              <span style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', marginLeft: '4px' }}>
                · {company}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
              <BarChart2 size={13} /> Dashboard
            </Link>
            <Link href="/onboarding" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none', border: `1px solid ${D.border}`, borderRadius: '6px', padding: '5px 10px' }}>
              <Upload size={13} /> Subir CSV
            </Link>
            <button
              onClick={() => setShowExport(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', color: showExport ? D.dark : D.sec,
                fontFamily: 'Inter, sans-serif', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
                fontWeight: showExport ? 500 : 400,
              }}
            >
              <Download size={13} /> Exportar
            </button>
            <Link href="/configuracion" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: D.sec, fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
              <Settings size={13} /> Configuración
            </Link>
            {userEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: `1px solid ${D.border}` }}>
                <span style={{ fontSize: '13px', color: D.muted, fontFamily: 'Inter, sans-serif', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </span>
                <button onClick={handleSignOut} title="Cerrar sesión"
                  style={{ display: 'flex', alignItems: 'center', color: D.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 48px' }}>
          {TABS.map(tab => (
            <Link key={tab.href} href={tab.href} style={{
              display: 'block',
              padding: '10px 16px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: isActive(tab.href) ? 500 : 400,
              color: isActive(tab.href) ? D.dark : D.sec,
              textDecoration: 'none',
              borderBottom: isActive(tab.href) ? `2px solid ${D.dark}` : '2px solid transparent',
              marginBottom: '-1px',
            }}>
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Export panel */}
      {showExport && <ExportPanel onClose={() => setShowExport(false)} />}
    </>
  );
}
