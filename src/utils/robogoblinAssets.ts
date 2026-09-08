import boilerBaron from '../images/robogoblins/runtime/boiler_baron.webp';
import boilerBrood from '../images/robogoblins/runtime/boiler_brood.webp';
import clockworkAncestor from '../images/robogoblins/runtime/clockwork_ancestor.webp';
import clockwyrmAssembly from '../images/robogoblins/runtime/clockwyrm_assembly.webp';
import cutleryPress from '../images/robogoblins/runtime/cutlery_press.webp';
import tinRascal from '../images/robogoblins/runtime/tin_rascal.webp';
import magnetNursery from '../images/robogoblins/runtime/magnet_nursery.webp';
import moonwireLoom from '../images/robogoblins/runtime/moonwire_loom.webp';
import paradoxNest from '../images/robogoblins/runtime/paradox_nest.webp';
import punchcardDen from '../images/robogoblins/runtime/punchcard_den.webp';
import servoScriptorium from '../images/robogoblins/runtime/servo_scriptorium.webp';
import thunderheadCoil from '../images/robogoblins/runtime/thunderhead_coil.webp';
import tinCradle from '../images/robogoblins/runtime/tin_cradle.webp';
import walkingFoundry from '../images/robogoblins/runtime/walking_foundry.webp';
import windupWorkbench from '../images/robogoblins/runtime/windup_workbench.webp';

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

export type RoboAppearanceAssetId = 'tin_rascal' | 'boiler_baron' | 'clockwork_ancestor';

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
  tin_rascal: tinRascal,
  boiler_baron: boilerBaron,
  clockwork_ancestor: clockworkAncestor,
};

