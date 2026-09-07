import { Icon } from './Icon';
import { Modal } from './Modal';

export interface PrestigePerkView {
  id: string;
  name: string;
  description: string;
  levelLabel: string;
  priceLabel: string;
  affordable: boolean;
  maxed?: boolean;
}

export interface PrestigeModalProps {
  open: boolean;
  currentCurrencyLabel: string;
  gainLabel: string;
  requirementLabel?: string;
  canPrestige: boolean;
  perks: PrestigePerkView[];
  onPrestige: () => void;
  onBuyPerk: (id: string) => void;
  onClose: () => void;
}

export function PrestigeModal({
  open,
  currentCurrencyLabel,
  gainLabel,
  requirementLabel,
  canPrestige,
  perks,
  onPrestige,
  onBuyPerk,
  onClose,
}: PrestigeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Found a New Warren"
      subtitle="Abandon this den. Carry ancestral cunning into the next brood."
      icon={<Icon name="crown" />}
      size="lg"
    >
      <section className="prestige-hero">
        <div className="prestige-hero__sigil"><Icon name="crown" size={34} /></div>
        <div className="prestige-hero__copy">
          <span>Ancestral cunning</span>
          <strong>{currentCurrencyLabel}</strong>
          <small>Permanent currency</small>
        </div>
        <div className="prestige-hero__gain">
          <span>Reset now for</span>
          <strong>+{gainLabel}</strong>
          {requirementLabel && <small>{requirementLabel}</small>}
        </div>
        <button className="prestige-button" type="button" disabled={!canPrestige} onClick={onPrestige}>
          <Icon name="crown" size={18} /> Begin New Warren
        </button>
      </section>

      <div className="prestige-warning">
        <strong>What resets?</strong>
        <span>Your current goblins, buildings, and cycle upgrades. Permanent ancestral perks and achievements remain.</span>
      </div>

      <section className="prestige-perks" aria-labelledby="prestige-perks-title">
        <div className="modal-section-heading">
          <div><span>Bloodline</span><h3 id="prestige-perks-title">Ancestral Perks</h3></div>
          <Icon name="sparkles" />
        </div>
        <div className="prestige-perk-grid">
          {perks.map((perk) => (
            <article className="prestige-perk" key={perk.id}>
              <div>
                <span className="tier-badge">{perk.levelLabel}</span>
                <h4>{perk.name}</h4>
                <p>{perk.description}</p>
              </div>
              <button type="button" onClick={() => onBuyPerk(perk.id)} disabled={perk.maxed || !perk.affordable}>
                {perk.maxed ? 'Maxed' : <><Icon name="crown" size={14} /> {perk.priceLabel}</>}
              </button>
            </article>
          ))}
        </div>
      </section>
    </Modal>
  );
}
