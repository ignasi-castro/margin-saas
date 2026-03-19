'use client';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'default' | 'green' | 'red' | 'blue';
}

const accents = {
  default: 'text-[#1e3a5f]',
  green: 'text-green-600',
  red: 'text-red-600',
  blue: 'text-blue-600',
};

export default function MetricCard({ title, value, subtitle, accent = 'default' }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accents[accent]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
