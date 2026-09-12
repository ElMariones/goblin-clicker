import { BUILDING_BY_ID, WARREN_INNOVATIONS } from '../game/content';
import type { BuildingId } from '../game/types';
import { useI18n } from '../i18n';
import { WARREN_PROGRESSION } from '../i18n/warrenProgression';
import { buildingArtAsset } from '../utils/assets';
import { Icon } from './Icon';
import type { UpgradeView } from './UpgradeModal';

export function DeepInnovations({ upgrades, onPurchase }: { upgrades: UpgradeView[]; onPurchase: (id: string) => void }) {
  const { language, t } = useI18n();
  return <section className="deep-innovations" aria-label={WARREN_PROGRESSION[language].innovations}>
    <p className="warren-projects-help">{WARREN_PROGRESSION[language].innovationHelp}</p>
    <div className="deep-innovation-grid">{WARREN_INNOVATIONS.map((definition) => {
      const upgrade = upgrades.find((entry) => entry.id === definition.id);
      if (!upgrade) return null;
      const buildingId = definition.id.slice('innovation_'.length) as BuildingId;
      const art = BUILDING_BY_ID[buildingId] ? buildingArtAsset(buildingId) : null;
      return <article key={upgrade.id} className={`deep-innovation${upgrade.purchased ? ' is-complete' : upgrade.affordable ? ' is-affordable' : ''}`}>
        <header>{art ? <img src={art} alt="" /> : <Icon name="sparkles" size={28} />}<h3>{upgrade.name}</h3></header>
        <p>{upgrade.effectLabel}</p>
        <small>{upgrade.requirementLabel}</small>
        <button type="button" onClick={() => onPurchase(upgrade.id)} disabled={upgrade.purchased || !upgrade.affordable || upgrade.locked} aria-label={`${upgrade.name}. ${upgrade.effectLabel}. ${upgrade.requirementLabel}. ${upgrade.priceLabel}`}>
          <span>{upgrade.purchased ? t('upgrade.researched') : upgrade.locked ? <Icon name="lock" size={13} /> : <Icon name="sparkles" size={13} />}</span>
          <strong>{upgrade.purchased ? '✓' : upgrade.priceLabel}</strong>
        </button>
      </article>;
    })}</div>
  </section>;
}
