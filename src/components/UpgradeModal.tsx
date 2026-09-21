import { useState } from 'react';
import { WARREN_INNOVATIONS } from '../game/content';
import { WARREN_PROGRESSION } from '../i18n/warrenProgression';
import { DeepInnovations } from './DeepInnovations';
import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';
import { ResearchTree } from './ResearchTree';

export interface UpgradeView {
  id: string;
  name: string;
  description: string;
  requirementLabel?: string;
  priceLabel: string;
  effectLabel: string;
  purchased: boolean;
  affordable: boolean;
  locked?: boolean;
  choiceLocked?: boolean;
  specialization?: boolean;
  exclusiveGroupLabel?: string;
  siblingName?: string;
  choiceBlockerName?: string;
  tradeoffLabel?: string;
  tier?: string;
  icon?: IconName;
}
export interface UpgradeModalProps { open: boolean; upgrades: UpgradeView[]; onPurchase: (id: string) => void; onClose: () => void; currencyLabel?: string }

export function UpgradeModal({ open, upgrades, onPurchase, onClose, currencyLabel }: UpgradeModalProps) {
  const { t, language } = useI18n();
  const [showDeep, setShowDeep] = useState(false);
  const copy = WARREN_PROGRESSION[language];
  const deepIds = new Set(WARREN_INNOVATIONS.map((upgrade) => upgrade.id));
  const deepReady = upgrades.filter((upgrade) => deepIds.has(upgrade.id) && !upgrade.purchased && upgrade.affordable).length;
  const purchased = upgrades.filter((upgrade) => upgrade.purchased).length;
  return (
    <Modal open={open} onClose={onClose} title={t('upgrade.title')} subtitle={t('upgrade.subtitle')} icon={<Icon name="sparkles" />} size="lg" className={`research-modal${showDeep ? ' research-modal--deep' : ''}`} footer={<span className="modal-summary">{t('upgrade.researchedSummary', { done: purchased, total: upgrades.length })}{currencyLabel ? ` · ${currencyLabel}` : ''}</span>}>
      <div className="innovation-tabs" role="group" aria-label={t('upgrade.title')}>
        <button type="button" aria-pressed={!showDeep} onClick={() => setShowDeep(false)}>{copy.tree}</button>
        <button type="button" aria-pressed={showDeep} onClick={() => setShowDeep(true)}>{copy.innovations}{deepReady > 0 ? ` (${deepReady})` : ''}</button>
      </div>
      {showDeep ? <DeepInnovations upgrades={upgrades} onPurchase={onPurchase} /> : <ResearchTree upgrades={upgrades.filter((upgrade) => !deepIds.has(upgrade.id))} onPurchase={onPurchase} />}
    </Modal>
  );
}
