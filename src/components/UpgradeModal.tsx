import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';
import { ResearchTree } from './ResearchTree';

export interface UpgradeView {
  id: string;
  name: string;
  description: string;
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
  const { t } = useI18n();
  const purchased = upgrades.filter((upgrade) => upgrade.purchased).length;
  return (
    <Modal open={open} onClose={onClose} title={t('upgrade.title')} subtitle={t('upgrade.subtitle')} icon={<Icon name="sparkles" />} size="lg" className="research-modal" footer={<span className="modal-summary">{t('upgrade.researchedSummary', { done: purchased, total: upgrades.length })}{currencyLabel ? ` · ${currencyLabel}` : ''}</span>}>
      <ResearchTree upgrades={upgrades} onPurchase={onPurchase} />
    </Modal>
  );
}
