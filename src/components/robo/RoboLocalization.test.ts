import { describe, expect, it } from 'vitest';
import type { LanguageCode } from '../../i18n';
import { formatRobo, getRoboCopy } from '../../i18n/robogoblins';

const LANGUAGES = ['en', 'es', 'zh', 'fr', 'de', 'ar', 'tr'] as const satisfies readonly LanguageCode[];
const LINE_IDS = [
  'tin_cradle', 'windup_workbench', 'cutlery_press', 'magnet_nursery',
  'boiler_brood', 'punchcard_den', 'servo_scriptorium', 'walking_foundry',
  'thunderhead_coil', 'moonwire_loom', 'clockwyrm_assembly', 'paradox_nest',
] as const;
const ACHIEVEMENT_IDS = [
  'rg_first_spark', 'rg_unattended', 'rg_bolted', 'rg_scrap_circuit',
  'rg_first_million', 'rg_overclock', 'rg_firmware', 'rg_recompile',
  'rg_steam_circuit', 'rg_three_circuits', 'rg_paradox', 'rg_kernel_complete',
] as const;
const KERNEL_IDS = [
  'better_bolts', 'boot_cache', 'night_shift', 'deep_battery',
  'copper_memory', 'warm_start', 'finger_servos', 'family_adapter',
] as const;

describe('RoboGoblins localization', () => {
  it('provides complete launch content for every supported language', () => {
    for (const language of LANGUAGES) {
      const copy = getRoboCopy(language);
      for (const id of LINE_IDS) {
        expect(copy.lines[id]?.name, `${language}:${id}:name`).toBeTruthy();
        expect(copy.lines[id]?.description, `${language}:${id}:description`).toBeTruthy();
      }
      for (const id of ACHIEVEMENT_IDS) {
        expect(copy.achievementsCopy[id]?.name, `${language}:${id}:name`).toBeTruthy();
        expect(copy.achievementsCopy[id]?.description, `${language}:${id}:description`).toBeTruthy();
      }
      for (const id of KERNEL_IDS) {
        expect(copy.kernelPerks[id]?.name, `${language}:${id}:name`).toBeTruthy();
        expect(copy.kernelPerks[id]?.description, `${language}:${id}:description`).toBeTruthy();
      }
      expect(Object.keys(copy.globalBlueprints)).toHaveLength(6);
      expect(Object.keys(copy.firmwareOptions)).toHaveLength(4);
      expect(Object.keys(copy.appearancesCopy)).toHaveLength(6);
    }
  });

  it('does not fall back to English action copy in non-English locales', () => {
    const english = getRoboCopy('en');
    for (const language of LANGUAGES.slice(1)) {
      const copy = getRoboCopy(language);
      expect(copy.assemble).not.toBe(english.assemble);
      expect(copy.recompile).not.toBe(english.recompile);
      expect(copy.lines.tin_cradle.name).not.toBe(english.lines.tin_cradle.name);
      expect(copy.achievementsCopy.rg_first_spark.name).not.toBe(english.achievementsCopy.rg_first_spark.name);
    }
  });

  it('interpolates localized Robo templates without changing numeric values', () => {
    expect(formatRobo(getRoboCopy('es').objectiveRecompile, { amount: 8 })).toContain('+8');
    expect(formatRobo(getRoboCopy('ar').circuitNeeded, { name: 'X', amount: 25 })).toContain('25');
    expect(formatRobo(getRoboCopy('zh').assembleAria, { amount: '1.5' })).toContain('1.5');
  });
});
