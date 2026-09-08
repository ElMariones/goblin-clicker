import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';
import { Modal } from './Modal';

export interface PrestigePerkView {
  id: string;
  name: string;
  description: string;
  levelLabel: string;
  priceLabel: string;
  affordable: boolean;
  maxed?: boolean;
  /** Optional richer view data. Existing callers can continue to provide levelLabel only. */
  rank?: number;
  maxRank?: number;
  icon?: IconName;
  effectLabel?: string;
}
export interface PrestigeModalProps { open: boolean; currentCurrencyLabel: string; gainLabel: string; requirementLabel?: string; canPrestige: boolean; perks: PrestigePerkView[]; onPrestige: () => void; onBuyPerk: (id: string) => void; onOpenCosmetics?: () => void; frontiers?: ReactNode; onClose: () => void }

function perkIcon(perk: PrestigePerkView): IconName {
  if (perk.icon) return perk.icon;
  const id = perk.id.toLowerCase();
  if (/(moon|luck|totem|omen)/.test(id)) return 'totem';
  if (/(time|idle|away|tireless|offline)/.test(id)) return 'hourglass';
  if (/(matron|heirloom|clutch|starter|egg|brood)/.test(id)) return 'clutch';
  if (/(founder|memory|scavenge|remember|lore)/.test(id)) return 'memory';
  if (/(fertility|blood|ancestor|lineage|momentum)/.test(id)) return 'bloodline';
  if (/(spawn|click|strong|hand)/.test(id)) return 'muscle';
  if (/(deep|burrow|warren|tunnel)/.test(id)) return 'burrow';
  if (/(cost|cheap|bargain|frugal|discount)/.test(id)) return 'bargain';
  if (/(forge|industry|build|production|cps)/.test(id)) return 'hammer';
  return 'crown';
}

function perkProgress(perk: PrestigePerkView) {
  if (typeof perk.rank === 'number' && typeof perk.maxRank === 'number' && perk.maxRank > 0) {
    return { rank: Math.max(0, perk.rank), maxRank: perk.maxRank };
  }
  const match = perk.levelLabel.match(/(\d+)\s*[/／]\s*(\d+)/);
  if (!match) return undefined;
  const rank = Number(match[1]);
  const maxRank = Number(match[2]);
  return Number.isFinite(rank) && Number.isFinite(maxRank) && maxRank > 0 ? { rank, maxRank } : undefined;
}

export function PrestigeModal({ open, currentCurrencyLabel, gainLabel, requirementLabel, canPrestige, perks, onPrestige, onBuyPerk, onOpenCosmetics, frontiers, onClose }: PrestigeModalProps) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const confirmTitleId = useId();
  const confirmDescriptionId = useId();
  const beginButtonRef = useRef<HTMLButtonElement>(null);

  const confirmPrestige = () => {
    setConfirming(false);
    onPrestige();
  };

  const closeModal = () => {
    setConfirming(false);
    onClose();
  };

  const cancelConfirmation = () => {
    setConfirming(false);
    window.setTimeout(() => beginButtonRef.current?.focus(), 0);
  };

  return (
    <Modal open={open} onClose={closeModal} title={t('prestige.title')} subtitle={t('prestige.subtitle')} icon={<Icon name="crown" />} size="lg" className={`prestige-modal${confirming ? ' prestige-modal--confirming' : ''}`}>
      {confirming ? (
        <section className="prestige-confirm" role="group" aria-labelledby={confirmTitleId} aria-describedby={confirmDescriptionId} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelConfirmation(); } }}>
          <span className="prestige-confirm__scan" aria-hidden="true" />
          <div className="prestige-confirm__sigil" aria-hidden="true"><Icon name="crown" size={38} /></div>
          <span className="prestige-confirm__eyebrow">{t('prestige.confirmEyebrow')}</span>
          <h3 id={confirmTitleId}>{t('prestige.confirmTitle')}</h3>
          <p id={confirmDescriptionId}>{t('prestige.confirm', { gain: gainLabel })}</p>
          <div className="prestige-confirm__gain" aria-label={t('prestige.confirmGainAria', { gain: gainLabel })}>
            <span>+{gainLabel}</span>
            <small>{t('prestige.cunning')}</small>
          </div>
          <div className="prestige-confirm__actions">
            <button className="secondary-button prestige-confirm__cancel" type="button" autoFocus onClick={cancelConfirmation}>{t('prestige.cancel')}</button>
            <button className="prestige-confirm__accept" type="button" onClick={confirmPrestige}><Icon name="crown" size={17} /> {t('prestige.confirmAccept')}</button>
          </div>
        </section>
      ) : (
        <>
          <section className="prestige-hero">
            <div className="prestige-hero__sigil" aria-hidden="true">
              <span className="prestige-hero__sigil-ring" />
              <Icon name="bloodline" size={34} />
            </div>
            <div className="prestige-hero__copy"><span>{t('prestige.cunning')}</span><strong>{currentCurrencyLabel}</strong><small>{t('prestige.permanentCurrency')}</small></div>
            <span className="prestige-hero__line" aria-hidden="true"><i /><i /><i /></span>
            <div className="prestige-hero__gain"><span>{t('prestige.resetNow')}</span><strong>+{gainLabel}</strong>{requirementLabel && <small>{requirementLabel}</small>}</div>
            <button ref={beginButtonRef} className="prestige-button" type="button" disabled={!canPrestige} onClick={() => setConfirming(true)}><Icon name="crown" size={18} /> {t('prestige.begin')}</button>
          </section>
          <div className="prestige-warning"><strong>{t('prestige.whatResets')}</strong><span>{t('prestige.resetInfo')}</span></div>
          {frontiers}
          {onOpenCosmetics && <button className="prestige-cosmetics-link" type="button" onClick={onOpenCosmetics}><span className="prestige-cosmetics-link__icon"><Icon name="shop" size={21} /></span><span><strong>{t('prestige.cosmeticsShop')}</strong><small>{t('prestige.cosmeticsHint')}</small></span><Icon name="chevron" size={16} /></button>}
          <section className="prestige-perks" aria-labelledby="prestige-perks-title">
            <div className="modal-section-heading prestige-perks__heading">
              <div><span>{t('prestige.bloodline')}</span><h3 id="prestige-perks-title">{t('prestige.perks')}</h3></div>
              <span className="prestige-perks__crest" aria-hidden="true"><Icon name="bloodline" /></span>
            </div>
            <div className="prestige-perk-grid" role="list">
              {perks.map((perk, index) => {
                const progress = perkProgress(perk);
                const progressPercent = progress ? Math.min(100, Math.max(0, (progress.rank / progress.maxRank) * 100)) : 0;
                const state = perk.maxed ? 'maxed' : perk.affordable ? 'affordable' : 'unaffordable';
                const showPips = progress && progress.maxRank <= 12;
                return (
                  <article className={`prestige-perk prestige-perk--${state}`} key={perk.id} role="listitem" style={{ '--perk-delay': `${Math.min(index, 8) * 22}ms` } as CSSProperties}>
                    <span className="prestige-perk__trace" aria-hidden="true" />
                    <header className="prestige-perk__header">
                      <span className="prestige-perk__icon" aria-hidden="true"><Icon name={perkIcon(perk)} size={23} /></span>
                      <div className="prestige-perk__title">
                        <span className="tier-badge">{perk.levelLabel}</span>
                        <h4>{perk.name}</h4>
                      </div>
                    </header>
                    <p className="prestige-perk__description">{perk.description}</p>
                    {perk.effectLabel && <strong className="prestige-perk__effect">{perk.effectLabel}</strong>}
                    {progress && (
                      <div className="prestige-perk__progress" aria-label={`${perk.name}: ${perk.levelLabel}`}>
                        <span className="prestige-perk__progress-track" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></span>
                        {showPips && <span className="prestige-perk__pips" aria-hidden="true">{Array.from({ length: progress.maxRank }, (_, rank) => <i className={rank < progress.rank ? 'is-filled' : ''} key={rank} />)}</span>}
                      </div>
                    )}
                    <button className="prestige-perk__buy" type="button" onClick={() => onBuyPerk(perk.id)} disabled={perk.maxed || !perk.affordable} aria-label={`${perk.name}: ${perk.maxed ? t('prestige.maxed') : perk.priceLabel}`}>
                      {perk.maxed ? <><Icon name="sparkles" size={14} /> {t('prestige.maxed')}</> : <><Icon name="crown" size={14} /> <span>{perk.priceLabel}</span></>}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </Modal>
  );
}
