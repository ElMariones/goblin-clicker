import type { CSSProperties } from 'react';

export interface WarrenBuildingVisual {
  id: string;
  name: string;
  owned: number;
  artSrc: string;
}

export interface WarrenBuildingFieldProps {
  buildings: WarrenBuildingVisual[];
}

type TokenStyle = CSSProperties & {
  '--token-x': string;
  '--token-y': string;
  '--token-delay': string;
  '--token-scale': string;
};

const MAX_TOKENS_PER_BUILDING = 9;

function positionFor(typeIndex: number, tokenIndex: number, typeCount: number): TokenStyle {
  const sector = 360 / Math.max(typeCount, 1);
  const baseAngle = -90 + sector * typeIndex;
  const spread = tokenIndex === 0 ? 0 : ((tokenIndex % 2 === 0 ? 1 : -1) * (5 + Math.ceil(tokenIndex / 2) * 3.5));
  const angle = (baseAngle + spread) * (Math.PI / 180);
  const radius = 41 - (tokenIndex % 3) * 4.6;
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius;
  const scale = Math.max(0.72, 1 - tokenIndex * 0.025);
  return {
    '--token-x': `${x.toFixed(2)}%`,
    '--token-y': `${y.toFixed(2)}%`,
    '--token-delay': `${((typeIndex * 41 + tokenIndex * 67) % 700) - 350}ms`,
    '--token-scale': scale.toFixed(2),
  };
}

export function WarrenBuildingField({ buildings }: WarrenBuildingFieldProps) {
  const active = buildings
    .map((building, index) => ({ building, index }))
    .filter(({ building }) => building.owned > 0);
  if (active.length === 0) {
    return (
      <div className="warren-field warren-field--empty" aria-hidden="true">
        <span>YOUR WARREN WILL GROW HERE</span>
      </div>
    );
  }

  return (
    <div className="warren-field" aria-hidden="true">
      {active.map(({ building, index: typeIndex }) => {
        const visible = Math.min(building.owned, MAX_TOKENS_PER_BUILDING);
        return Array.from({ length: visible }, (_, tokenIndex) => {
          const showCount = tokenIndex === visible - 1 && building.owned > MAX_TOKENS_PER_BUILDING;
          return (
            <div
              className="warren-field__token"
              key={`${building.id}-${tokenIndex}`}
              style={positionFor(typeIndex, tokenIndex, buildings.length)}
              title={tokenIndex === 0 ? `${building.name} ×${building.owned}` : undefined}
            >
              <img src={building.artSrc} alt="" draggable={false} />
              {showCount && <span className="warren-field__count">×{building.owned}</span>}
            </div>
          );
        });
      })}
    </div>
  );
}
