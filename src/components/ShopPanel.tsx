import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

export interface ShopPanelProps { title?: string; subtitle?: string; controls?: ReactNode; children: ReactNode; footer?: ReactNode }

export function ShopPanel({ title, subtitle, controls, children, footer }: ShopPanelProps) {
  const { t } = useI18n();
  return (
    <section className="shop-panel" aria-labelledby="shop-panel-title">
      <div className="panel-heading">
        <div>
          <span className="panel-heading__eyebrow">{t('shop.eyebrow')}</span>
          <h2 id="shop-panel-title">{title ?? t('shop.title')}</h2>
          <p>{subtitle ?? t('shop.subtitle')}</p>
        </div>
        {controls && <div className="panel-heading__controls">{controls}</div>}
      </div>
      <div className="shop-panel__list">{children}</div>
      {footer && <footer className="shop-panel__footer">{footer}</footer>}
    </section>
  );
}
