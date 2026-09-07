import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

export interface UpgradeView {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  effectLabel: string;
  purchased: boolean;
  affordable: boolean;
  locked?: boolean;
  tier?: string;
  icon?: IconName;
}

export interface UpgradeModalProps {
  open: boolean;
  upgrades: UpgradeView[];
  onPurchase: (id: string) => void;
  onClose: () => void;
  currencyLabel?: string;
}

export function UpgradeModal({ open, upgrades, onPurchase, onClose, currencyLabel }: UpgradeModalProps) {
  const purchased = upgrades.filter((upgrade) => upgrade.purchased).length;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Warren Innovations"
      subtitle="Permanent improvements for this brood cycle."
      icon={<Icon name="sparkles" />}
      size="lg"
      footer={<span className="modal-summary">{purchased} / {upgrades.length} researched{currencyLabel ? ` · ${currencyLabel}` : ''}</span>}
    >
      <div className="upgrade-grid">
        {upgrades.map((upgrade) => (
          <article
            key={upgrade.id}
            className={`upgrade-tile${upgrade.purchased ? ' upgrade-tile--purchased' : ''}${upgrade.locked ? ' upgrade-tile--locked' : ''}`}
          >
            <div className="upgrade-tile__icon"><Icon name={upgrade.locked ? 'lock' : (upgrade.icon ?? 'sparkles')} size={26} /></div>
            <div className="upgrade-tile__body">
              <div className="upgrade-tile__title-row">
                <h3>{upgrade.name}</h3>
                {upgrade.tier && <span className="tier-badge">{upgrade.tier}</span>}
              </div>
              <p>{upgrade.description}</p>
              <strong className="upgrade-tile__effect">{upgrade.effectLabel}</strong>
            </div>
            <button
              type="button"
              className="upgrade-tile__buy"
              onClick={() => onPurchase(upgrade.id)}
              disabled={upgrade.purchased || upgrade.locked || !upgrade.affordable}
            >
              {upgrade.purchased ? 'Researched' : upgrade.locked ? 'Unknown' : <><Icon name="coin" size={14} /> {upgrade.priceLabel}</>}
            </button>
          </article>
        ))}
      </div>
    </Modal>
  );
}
