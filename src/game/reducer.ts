import { claimMooncap, hatchGoblin, performPrestigeReset, purchaseBuilding, purchasePermanentUpgrade, purchaseUpgrade, sellBuilding, tickGame } from './engine';
import type { UpgradeId } from './content';
import type { BuildingId, GameState, PermanentUpgradeId } from './types';

export type GameAction =
  | { type: 'tick'; now: number }
  | { type: 'hatch'; now: number }
  | { type: 'buyBuilding'; buildingId: BuildingId; count?: number; now: number }
  | { type: 'sellBuilding'; buildingId: BuildingId; count?: number; now: number }
  | { type: 'buyUpgrade'; upgradeId: UpgradeId; now: number }
  | { type: 'claimMooncap'; now: number }
  | { type: 'prestige'; now: number }
  | { type: 'buyPermanentUpgrade'; upgradeId: PermanentUpgradeId; now: number }
  | { type: 'replaceState'; state: GameState };

/** React/useReducer-friendly adapter over the richer engine action functions. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick': return tickGame(state, action.now);
    case 'hatch': return hatchGoblin(state, action.now).state;
    case 'buyBuilding': return purchaseBuilding(state, action.buildingId, action.count ?? 1, action.now).state;
    case 'sellBuilding': return sellBuilding(state, action.buildingId, action.count ?? 1, action.now).state;
    case 'buyUpgrade': return purchaseUpgrade(state, action.upgradeId, action.now).state;
    case 'claimMooncap': return claimMooncap(state, action.now).state;
    case 'prestige': return performPrestigeReset(state, action.now).state;
    case 'buyPermanentUpgrade': return purchasePermanentUpgrade(state, action.upgradeId, action.now).state;
    case 'replaceState': return action.state;
  }
}
