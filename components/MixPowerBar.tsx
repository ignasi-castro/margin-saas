'use client';

interface Props {
  value: number; // 0-1+
}

export default function MixPowerBar({ value }: Props) {
  const pct = Math.min(value * 100, 100);
  const color =
    value < 0.65 ? '#dc2626' :
    value < 0.80 ? '#ea580c' :
    value < 0.90 ? '#2563eb' : '#16a34a';

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}
