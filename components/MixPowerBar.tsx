'use client';

interface Props {
  value: number; // 0–1+
}

export default function MixPowerBar({ value }: Props) {
  const pct = Math.min(value * 100, 100);
  const color =
    value < 0.65 ? '#C94040' :
    value < 0.80 ? '#D97706' :
    value < 0.90 ? '#2563EB' : '#2D7A4F';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '110px' }}>
      <div style={{ flex: 1, backgroundColor: '#E2E2DC', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
        <div style={{ height: '4px', borderRadius: '2px', width: `${pct}%`, backgroundColor: color, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color, fontFamily: 'Inter, sans-serif', tabularNums: true } as React.CSSProperties}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
