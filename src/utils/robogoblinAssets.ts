import boilerBrood from '../images/robogoblins/runtime/boiler_brood.webp';
import clockwyrmAssembly from '../images/robogoblins/runtime/clockwyrm_assembly.webp';
import cutleryPress from '../images/robogoblins/runtime/cutlery_press.webp';
import magnetNursery from '../images/robogoblins/runtime/magnet_nursery.webp';
import moonwireLoom from '../images/robogoblins/runtime/moonwire_loom.webp';
import paradoxNest from '../images/robogoblins/runtime/paradox_nest.webp';
import punchcardDen from '../images/robogoblins/runtime/punchcard_den.webp';
import servoScriptorium from '../images/robogoblins/runtime/servo_scriptorium.webp';
import thunderheadCoil from '../images/robogoblins/runtime/thunderhead_coil.webp';
import tinCradle from '../images/robogoblins/runtime/tin_cradle.webp';
import walkingFoundry from '../images/robogoblins/runtime/walking_foundry.webp';
import windupWorkbench from '../images/robogoblins/runtime/windup_workbench.webp';
import goblinCap from '../images/robogoblins/goblin_cap.png';
import goblinDark from '../images/robogoblins/goblin_dark.png';
import goblinGlass from '../images/robogoblins/goblin_glass.png';
import goblinGold from '../images/robogoblins/goblin_gold.png';
import goblinSuit from '../images/robogoblins/goblin_suit.png';

export type RoboLineAssetId =
  | 'tin_cradle'
  | 'windup_workbench'
  | 'cutlery_press'
  | 'magnet_nursery'
  | 'boiler_brood'
  | 'punchcard_den'
  | 'servo_scriptorium'
  | 'walking_foundry'
  | 'thunderhead_coil'
  | 'moonwire_loom'
  | 'clockwyrm_assembly'
  | 'paradox_nest';

export type RoboAppearanceAssetId = 'goblin_cap' | 'goblin_dark' | 'goblin_glass' | 'goblin_gold' | 'goblin_suit';

export const robogoblinLineArt: Readonly<Record<RoboLineAssetId, string>> = {
  tin_cradle: tinCradle,
  windup_workbench: windupWorkbench,
  cutlery_press: cutleryPress,
  magnet_nursery: magnetNursery,
  boiler_brood: boilerBrood,
  punchcard_den: punchcardDen,
  servo_scriptorium: servoScriptorium,
  walking_foundry: walkingFoundry,
  thunderhead_coil: thunderheadCoil,
  moonwire_loom: moonwireLoom,
  clockwyrm_assembly: clockwyrmAssembly,
  paradox_nest: paradoxNest,
};

export const robogoblinAppearanceArt: Readonly<Record<RoboAppearanceAssetId, string>> = {
  goblin_cap: goblinCap,
  goblin_dark: goblinDark,
  goblin_glass: goblinGlass,
  goblin_gold: goblinGold,
  goblin_suit: goblinSuit,
};

