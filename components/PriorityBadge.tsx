'use client';

import { ProcessedClient } from '@/lib/types';

interface Props {
  priority: ProcessedClient['priority'];
  color: ProcessedClient['priorityColor'];
}

const styles: Record<string, React.CSSProperties> = {
  red:    { backgroundColor: '#FEE2E2', color: '#991B1B' },
  orange: { backgroundColor: '#FEF3C7', color: '#92400E' },
  blue:   { backgroundColor: '#E0F2FE', color: '#075985' },
  green:  { backgroundColor: '#D1FAE5', color: '#065F46' },
};

export default function PriorityBadge({ priority, color }: Props) {
  return (
    <span style={{
      ...styles[color],
      borderRadius: '100px',
      padding: '3px 10px',
      fontSize: '11px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      display: 'inline-block',
      whiteSpace: 'nowrap',
    }}>
      {priority}
    </span>
  );
}
