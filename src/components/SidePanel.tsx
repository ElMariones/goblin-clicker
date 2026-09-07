import type { ReactNode } from 'react';

export interface SidePanelProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SidePanel({ title, eyebrow, children, action, className = '' }: SidePanelProps) {
  return (
    <section className={`side-panel ${className}`.trim()}>
      <header className="side-panel__header">
        <div>
          {eyebrow && <span className="side-panel__eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      <div className="side-panel__content">{children}</div>
    </section>
  );
}
