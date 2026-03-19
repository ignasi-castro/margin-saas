'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill="#1A1A18" />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill="#1A1A18" />
      <rect x="10" y="10" width="11" height="12" rx="0"   fill="#F7F6F2" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  const input: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid #E2E2DC', borderRadius: '6px',
    padding: '10px 14px', fontSize: '14px',
    fontFamily: 'Inter, sans-serif', color: '#1A1A18',
    backgroundColor: '#fff', outline: 'none',
  };

  const label: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    fontFamily: 'Inter, sans-serif', color: '#1A1A18', marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <Logo />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '16px', color: '#1A1A18' }}>MixPower</span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E2E2DC', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: '#1A1A18', margin: '0 0 6px 0', lineHeight: 1.1 }}>
            Bienvenido de nuevo.
          </h1>
          <p style={{ fontSize: '14px', color: '#6B6B67', fontFamily: 'Inter, sans-serif', fontWeight: 300, margin: '0 0 28px 0' }}>
            Accede a tu cuenta para continuar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={label}>Email</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com" style={input}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>
            <div>
              <label style={label}>Contraseña</label>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={input}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#C94040', fontFamily: 'Inter, sans-serif', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: '#1A1A18', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, marginTop: '4px' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B6B67', fontFamily: 'Inter, sans-serif' }}>
          ¿Primera vez?{' '}
          <a href="mailto:ignasi@procredis.cc?subject=Solicitud%20de%20acceso%20MixPower"
            style={{ color: '#1A1A18', fontWeight: 500, textDecoration: 'none' }}>
            Solicitar acceso
          </a>
        </p>
      </div>
    </div>
  );
}
