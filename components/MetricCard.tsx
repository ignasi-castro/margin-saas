'use client';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
}

export default function MetricCard({ label, value, subtitle }: Props) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #E2E2DC', borderRadius: '10px', padding: '24px' }}>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9B9B97', fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: '0 0 8px 0' }}>
        {label}
      </p>
      <p style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: '36px', color: '#1A1A18', lineHeight: 1, margin: '0 0 6px 0' }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#6B6B67', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
