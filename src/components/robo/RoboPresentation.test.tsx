import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider, SUPPORTED_LANGUAGES } from '../../i18n';
import { ROBO_GUIDE } from '../../i18n/roboGuide';
import { getRoboCopy } from '../../i18n/robogoblins';
import { RoboAssemblyShop } from './RoboAssemblyShop';
import { RoboBlueprintFirmwareModal } from './RoboBlueprintFirmwareModal';
import { RoboKernelModal } from './RoboKernelModal';
import { RoboProjectsModal } from './RoboProjectsModal';
import { createInitialRoboState } from '../../game/robo/state';
import { ROBO_ENDGAME } from '../../i18n/roboEndgame';
import type { RoboAssemblyLineView } from './types';

const noop = () => undefined;
const line: RoboAssemblyLineView = {
  id: 'tin_cradle', name: 'Tin Cradle', description: 'A tiny assembly line.', circuit: 'scrap',
  ownedLabel: '10', averageRateLabel: '22', batchProgress: .5, nextBatchLabel: 'Next batch in 1s',
  pendingLabel: '11 assembled', priceLabel: '100', buyQuantityLabel: 'Buy 1', canAfford: true,
  masteryLabel: 'Bolted', masteryFactorLabel: '×2', nextMilestoneLabel: 'Calibrated · 25',
  nextMilestoneCostLabel: '400', canBuyNextMilestone: true,
};

describe('Robogoblin presentation', () => {
  it('shows project costs, persistence and unmet requirements before allowing a purchase', () => {
    const html = renderToStaticMarkup(<I18nProvider language="en"><RoboProjectsModal open robo={createInitialRoboState()} formatNumber={String} onBuild={noop} onClose={noop} /></I18nProvider>);
    expect(html).toContain(ROBO_ENDGAME.en.help);
    expect(html).toContain(ROBO_ENDGAME.en.fabrication);
    expect(html).toContain('0/20');
    expect(html).toContain('Global blueprints: 0 / 6');
    expect(html).toContain('256 cores');
    expect(html.match(/disabled=""/g)).toHaveLength(4);
    expect(html.match(/<progress /g)).toHaveLength(4);
  });
  it.each(SUPPORTED_LANGUAGES)('provides complete system guidance in %s', (language) => {
    for (const key of Object.keys(ROBO_GUIDE.en) as (keyof typeof ROBO_GUIDE.en)[]) {
      expect(ROBO_GUIDE[language][key], `${language}:${key}`).toBeTruthy();
      if (language !== 'en' && key.endsWith('Help')) expect(ROBO_GUIDE[language][key]).not.toBe(ROBO_GUIDE.en[key]);
    }
  });

  it('uses the regular expansion card with keyboard details and no extra info button', () => {
    const html = renderToStaticMarkup(<I18nProvider language="en"><RoboAssemblyShop lines={[line]} buyAmount={1} onBuyAmountChange={noop} onBuy={noop} onBuyNextMilestone={noop} /></I18nProvider>);
    expect(html).toContain('shop-card shop-card--affordable shop-card--has-details');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('Calibrated · 25 · 400 RG');
    expect(html).not.toContain('robo-line-card__info');
  });

  it('keeps locked lines unpurchasable and hides their detailed production', () => {
    const html = renderToStaticMarkup(<I18nProvider language="en"><RoboAssemblyShop lines={[{ ...line, locked: true, canAfford: false }]} buyAmount={1} onBuyAmountChange={noop} onBuy={noop} onBuyNextMilestone={noop} /></I18nProvider>);
    expect(html).toContain('shop-card--locked');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('tabindex="0"');
    expect(html).not.toContain('role="progressbar"');
  });

  it('separates firmware decisions from the blueprint catalog and explains empty results', () => {
    const render = (mode: 'blueprints' | 'firmware') => renderToStaticMarkup(<I18nProvider language="en"><RoboBlueprintFirmwareModal open mode={mode} readyLabel="20" blueprints={[]} firmwareGroups={[]} onPurchaseBlueprint={noop} onChooseFirmware={noop} onClose={noop} /></I18nProvider>);
    expect(render('blueprints')).toContain(ROBO_GUIDE.en.empty);
    expect(render('blueprints')).not.toContain('robo-firmware__groups');
    expect(render('firmware')).toContain(ROBO_GUIDE.en.firmwareHelp);
    expect(render('firmware')).not.toContain('robo-catalog-tabs');
  });

  it('shows reset scope and the next perk effect before spending any Cores', () => {
    const copy = getRoboCopy('en');
    const html = renderToStaticMarkup(<I18nProvider language="en"><RoboKernelModal open coresLabel="3" totalEarnedLabel="3" claimableCoresLabel="0" canRecompile={false} nextCoreLabel="Grow the factory first" preview={{ gainLabel: '0', currentMultiplierLabel: '×1.3', nextMultiplierLabel: '×1.3', resetItems: copy.resetItems, preservedItems: copy.preservedItems }} perks={[{ id: 'better_bolts', name: 'Better Bolts', description: 'Boost assembly.', rank: 0, maxRank: 10, effectLabel: '×1.00', nextEffectLabel: '×1.05', costLabel: '1', affordable: true }]} onBuyPerk={noop} onRecompile={noop} onClose={noop} /></I18nProvider>);
    expect(html).toContain(copy.recompileWarning);
    expect(html).toContain(ROBO_GUIDE.en.nextEffect);
    expect(html).toContain('×1.05');
    expect(html).toContain('disabled="">Grow the factory first');
  });
});
