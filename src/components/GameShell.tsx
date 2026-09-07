import type { ReactNode } from 'react';

export interface GameShellProps {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  overlay?: ReactNode;
  className?: string;
}

export function GameShell({ header, left, center, right, overlay, className = '' }: GameShellProps) {
  return (
    <div className={`game-frame ${className}`.trim()}>
      <div className="game-frame__ambient" aria-hidden="true" />
      <header className="game-frame__header">{header}</header>
      <main className="game-shell">
        <aside className="game-shell__rail game-shell__rail--left" aria-label="Goblin operations">
          {left}
        </aside>
        <section className="game-shell__stage" aria-label="Brood pit">
          {center}
        </section>
        <aside className="game-shell__rail game-shell__rail--right" aria-label="Den shop">
          {right}
        </aside>
      </main>
      <div className="game-overlay-root">{overlay}</div>
    </div>
  );
}
