import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n';
import { ResearchTree } from './ResearchTree';
import type { UpgradeView } from './UpgradeModal';

const baseDoctrine: UpgradeView = {
  id: 'doctrine_matron_dynasty',
  name: 'Matron Dynasty',
  description: 'Mastery compounds the old warrens.',
  priceLabel: '400M',
  effectLabel: 'Each mastery tier ×1.12',
  purchased: false,
  affordable: true,
  locked: false,
  specialization: true,
  exclusiveGroupLabel: 'Broodcraft',
  siblingName: 'Fungal Symbiosis',
  tier: 'Doctrine',
};

describe('ResearchTree doctrine presentation', () => {
  it('renders the doctrine zone, explicit rival lock preview, and a distinct choice-locked state', () => {
    const upgrades: UpgradeView[] = [
      baseDoctrine,
      {
        ...baseDoctrine,
        id: 'doctrine_fungal_symbiosis',
        name: 'Fungal Symbiosis',
        siblingName: 'Matron Dynasty',
        affordable: false,
        choiceLocked: true,
        choiceBlockerName: 'Matron Dynasty',
      },
    ];

    const html = renderToStaticMarkup(
      <I18nProvider language="en">
        <ResearchTree upgrades={upgrades} onPurchase={() => undefined} />
      </I18nProvider>,
    );

    expect(html).toContain('Migration Doctrines');
    expect(html).toContain('Choosing this locks Fungal Symbiosis for this migration.');
    expect(html).toContain('Locked by your choice: Matron Dynasty.');
    expect(html).toContain('research-node--doctrine');
    expect(html).toContain('research-node--choice-locked');
    expect(html).toContain('Doctrine locked');
  });
});
