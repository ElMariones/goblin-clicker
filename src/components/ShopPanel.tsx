import type { ReactNode } from 'react';

export interface ShopPanelProps {
  title?: string;
  subtitle?: string;
  controls?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function ShopPanel({ title = 'Warren Expansion', subtitle = 'Spend brood to automate the horde.', controls, children, footer }: ShopPanelProps) {
  return (
    <section className="shop-panel" aria-labelledby="shop-panel-title">
      <div className="panel-heading">
        <div>
          <span className="panel-heading__eyebrow">Den Quartermaster</span>
          <h2 id="shop-panel-title">{title}</h2>
          <p>{subtitle}</p>
        </div>
        {controls && <div className="panel-heading__controls">{controls}</div>}
      </div>
      <div className="shop-panel__list">{children}</div>
      {footer && <footer className="shop-panel__footer">{footer}</footer>}
    </section>
  );
}
