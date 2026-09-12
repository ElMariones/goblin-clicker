import { buildWarrenProject, purchaseBuildingMilestone } from './engine';
import type { WarrenProjectId } from './types';
import { startExpedition, cancelExpedition, claimExpedition } from './engine';
import type { ExpeditionPlan } from './types';
import { claimContract, claimMooncap, hatchGoblin, performPrestigeReset, purchaseBuilding, purchasePermanentUpgrade, purchaseUpgrade, sellBuilding, spendLunarCharge, tickGame } from './engine';
import type { MoonDialAction } from './events';
import type { UpgradeId } from './content';
import type { BuildingId, ContractKind, GameState, PermanentUpgradeId } from './types';

export type GameAction =
  | { type: 'buildWarrenProject'; id: WarrenProjectId; now: number }
  | { type: 'buyBuildingMilestone'; buildingId: BuildingId; now: number }
  | { type: 'startExpedition'; plan: ExpeditionPlan; now: number }
  | { type: 'cancelExpedition'; now: number }
  | { type: 'claimExpedition'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'hatch'; now: number }
  | { type: 'buyBuilding'; buildingId: BuildingId; count?: number; now: number }
  | { type: 'sellBuilding'; buildingId: BuildingId; count?: number; now: number }
  | { type: 'buyUpgrade'; upgradeId: UpgradeId; now: number }
  | { type: 'claimMooncap'; now: number }
  | { type: 'claimContract'; kind: ContractKind; now: number }
  | { type: 'moonDial'; action: MoonDialAction; now: number }
  | { type: 'prestige'; now: number }
  | { type: 'buyPermanentUpgrade'; upgradeId: PermanentUpgradeId; now: number }
  | { type: 'replaceState'; state: GameState };

/** React/useReducer-friendly adapter over the richer engine action functions. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'buildWarrenProject': return buildWarrenProject(state, action.id, action.now).state;
    case 'buyBuildingMilestone': return purchaseBuildingMilestone(state, action.buildingId, action.now).state;
    case 'startExpedition': return startExpedition(state, action.plan, action.now);
    case 'cancelExpedition': return cancelExpedition(state, action.now);
    case 'claimExpedition': return claimExpedition(state, action.now).state;
    case 'tick': return tickGame(state, action.now);
    case 'hatch': return hatchGoblin(state, action.now).state;
    case 'buyBuilding': return purchaseBuilding(state, action.buildingId, action.count ?? 1, action.now).state;
    case 'sellBuilding': return sellBuilding(state, action.buildingId, action.count ?? 1, action.now).state;
    case 'buyUpgrade': return purchaseUpgrade(state, action.upgradeId, action.now).state;
    case 'claimMooncap': return claimMooncap(state, action.now).state;
    case 'claimContract': return claimContract(state, action.kind, action.now).state;
    case 'moonDial': return spendLunarCharge(state, action.action, action.now).state;
    case 'prestige': return performPrestigeReset(state, action.now).state;
    case 'buyPermanentUpgrade': return purchasePermanentUpgrade(state, action.upgradeId, action.now).state;
    case 'replaceState': return action.state;
  }
}
