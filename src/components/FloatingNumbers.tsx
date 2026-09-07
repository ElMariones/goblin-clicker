import type { CSSProperties } from 'react';

export interface FloatingNumberView {
  id: string;
  text: string;
  x: number;
  y: number;
  variant?: 'spawn' | 'bonus' | 'critical';
}

export interface FloatingNumbersProps {
  items: FloatingNumberView[];
}

export function FloatingNumbers({ items }: FloatingNumbersProps) {
  return (
    <div className={`floating-number-layer${items.length > 0 ? ' floating-number-layer--active' : ''}`} aria-hidden="true">
      {items.map((item, index) => (
        <span
          key={item.id}
          className={`floating-number floating-number--${item.variant ?? 'spawn'} floating-number--lane-${index % 3}`}
          data-variant={item.variant ?? 'spawn'}
          style={{ '--float-x': `${item.x}%`, '--float-y': `${item.y}%`, '--float-order': index } as CSSProperties}
        >
          <span className="floating-number__value">{item.text}</span>
        </span>
      ))}
    </div>
  );
}
