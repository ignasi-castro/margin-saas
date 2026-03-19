'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="4"  y="2"  width="11" height="20" rx="2.5" fill="#1A1A18" />
      <rect x="10" y="10" width="11" height="20" rx="2.5" fill="#F7F6F2" />
      <rect x="10" y="10" width="11" height="20" rx="2.5" fill="#1A1A18" fillOpacity="0.15" />
      <rect x="17" y="10" width="11" height="20" rx="2.5" fill="#1A1A18" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Email o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #E2E2DC',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    color: '#1A1A18',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    color: '#1A1A18',
    marginBottom: '6px',
    fontWeight: 500,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '10px' }}>
          <Logo />
          <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '18px', color: '#1A1A18' }}>
            MixPower
          </span>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #E2E2DC', borderRadius: '12px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '32px', fontWeight: 400, color: '#1A1A18', margin: '0 0 6px 0', lineHeight: '1.1' }}>
            Bienvenido de nuevo.
          </h1>
          <p style={{ fontSize: '14px', color: '#6B6B67', fontFamily: 'Inter, sans-serif', margin: '0 0 28px 0' }}>
            Accede a tu cuenta para continuar.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#dc2626', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#1A1A18', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s', marginTop: '4px' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#6B6B67', fontFamily: 'Inter, sans-serif' }}>
          ¿Primera vez?{' '}
          <a
            href="mailto:ignasi@procredis.cc?subject=Solicitud%20de%20acceso%20MixPower"
            style={{ color: '#1A1A18', fontWeight: 500, textDecoration: 'none' }}
          >
            Solicitar acceso
          </a>
        </p>
      </div>
    </div>
  );
}
