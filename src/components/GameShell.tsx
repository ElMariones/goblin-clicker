import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

export interface GameShellProps {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  background?: ReactNode;
  overlay?: ReactNode;
  className?: string;
  ariaLabels?: Partial<{ left: string; center: string; right: string }>;
}

export function GameShell({ header, left, center, right, background, overlay, className = '', ariaLabels }: GameShellProps) {
  const { t } = useI18n();
  return (
    <div className={`game-frame ${className}`.trim()}>
      {background && <div className="game-frame__crt">{background}</div>}
      <div className="game-frame__ambient" aria-hidden="true" />
      <header className="game-frame__header">{header}</header>
      <main className="game-shell">
        <aside className="game-shell__rail game-shell__rail--left" aria-label={ariaLabels?.left ?? t('aria.goblinOperations')}>{left}</aside>
        <section className="game-shell__stage" aria-label={ariaLabels?.center ?? t('aria.broodPit')}>{center}</section>
        <aside className="game-shell__rail game-shell__rail--right" aria-label={ariaLabels?.right ?? t('aria.denShop')}>{right}</aside>
      </main>
      <div className="game-overlay-root">{overlay}</div>
    </div>
  );
}
