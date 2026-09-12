import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider, localizedName, SUPPORTED_LANGUAGES } from '../i18n';
import { WARREN_PROGRESSION } from '../i18n/warrenProgression';
import { BUILDING_BY_ID, WARREN_INNOVATIONS } from '../game/content';
import { createInitialGameState } from '../game/state';
import { WARREN_PROJECTS } from '../game/projects';
import { WarrenProjectsModal } from './WarrenProjectsModal';
import { DeepInnovations } from './DeepInnovations';

const noop = () => undefined;
describe('Warren progression presentation', () => {
  it.each(SUPPORTED_LANGUAGES)('shows translated project costs, requirements and persistence in %s', (language) => {
    const state = createInitialGameState(1000, 7);
    const html = renderToStaticMarkup(<I18nProvider language={language}><WarrenProjectsModal open state={state} formatNumber={String} onBuild={noop} onClose={noop} /></I18nProvider>);
    expect(html).toContain(WARREN_PROGRESSION[language].help);
    expect(html).toContain(WARREN_PROGRESSION[language].entry);
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html).not.toContain('{rank}');
    for (const name of WARREN_PROGRESSION[language].projects) expect(html).toContain(name);
    for (const project of WARREN_PROJECTS) expect(html).toContain(String(project.baseCunning));
    if (language !== 'en') expect(WARREN_PROGRESSION[language].help).not.toBe(WARREN_PROGRESSION.en.help);
  });

  it('renders every innovation and its requirement even before unlocking it', () => {
    const upgrades = WARREN_INNOVATIONS.map((upgrade) => ({ id: upgrade.id, name: upgrade.name, description: upgrade.description, priceLabel: String(upgrade.cost), effectLabel: '×3', purchased: false, affordable: false, locked: true, requirementLabel: 'Requires 150 buildings' }));
    const html = renderToStaticMarkup(<I18nProvider language="en"><DeepInnovations upgrades={upgrades} onPurchase={noop} /></I18nProvider>);
    expect(html.match(/<article/g)).toHaveLength(18);
    expect(html.match(/disabled=""/g)).toHaveLength(18);
    expect(html).toContain('Requires 150 buildings');
  });

  it.each(SUPPORTED_LANGUAGES)('localizes every innovation name in %s', (language) => {
    for (const upgrade of WARREN_INNOVATIONS) {
      const name = localizedName(language, 'upgrade', upgrade.id, upgrade.name);
      expect(name).not.toContain('innovation_');
      if (language !== 'en') expect(name).not.toBe(upgrade.name);
    }
    expect(localizedName(language, 'upgrade', 'innovation_brood_matron', `${BUILDING_BY_ID.brood_matron.name}: Living Architecture`)).toContain(WARREN_PROGRESSION[language].living);
  });
});
