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

export default function RegistroPage() {
  const router = useRouter();
  const [empresa, setEmpresa]     = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { company_name: empresa.trim() },
      },
    });

    if (authError) {
      setError(
        authError.message === 'User already registered'
          ? 'Este email ya tiene una cuenta. Ve al login.'
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push('/onboarding');
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
            Crear cuenta
          </h1>
          <p style={{ fontSize: '14px', color: '#6B6B67', fontFamily: 'Inter, sans-serif', margin: '0 0 28px 0' }}>
            Configura el acceso para tu empresa.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre de empresa</label>
              <input
                type="text"
                required
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
                placeholder="Morteros García S.A."
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#1A1A18')}
                onBlur={e  => (e.target.style.borderColor = '#E2E2DC')}
              />
            </div>

            <div>
              <label style={labelStyle}>Repetir contraseña</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                placeholder="Repite la contraseña"
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
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
