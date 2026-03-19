'use client';

import { ProcessedClient } from '@/lib/types';

interface Props {
  priority: ProcessedClient['priority'];
  color: ProcessedClient['priorityColor'];
}

const styles: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border border-red-300',
  orange: 'bg-orange-100 text-orange-700 border border-orange-300',
  blue: 'bg-blue-100 text-blue-700 border border-blue-300',
  green: 'bg-green-100 text-green-700 border border-green-300',
};

export default function PriorityBadge({ priority, color }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[color]}`}>
      {priority}
    </span>
  );
}
