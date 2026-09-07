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
    <div className="floating-number-layer" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className={`floating-number floating-number--${item.variant ?? 'spawn'}`}
          style={{ '--float-x': `${item.x}%`, '--float-y': `${item.y}%` } as CSSProperties}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
