import { LANGUAGE_OPTIONS, type LanguageCode, useI18n } from '../i18n';
import { Icon } from './Icon';
import { Modal } from './Modal';

export interface ToggleSetting { id: string; label: string; description: string; checked: boolean; disabled?: boolean }
export interface SettingsModalProps {
  open: boolean; toggles: ToggleSetting[]; onToggle: (id: string, checked: boolean) => void;
  language: LanguageCode; onLanguageChange: (language: LanguageCode) => void;
  onExportSave?: () => void; onImportSave?: () => void; onHardReset?: () => void; onClose: () => void; saveStatus?: string; versionLabel?: string;
}

export function SettingsModal({ open, toggles, onToggle, language, onLanguageChange, onExportSave, onImportSave, onHardReset, onClose, saveStatus, versionLabel }: SettingsModalProps) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')} subtitle={t('settings.subtitle')} icon={<Icon name="settings" />}>
      <div className="settings-list">
        <label className="setting-row setting-row--language">
          <span><strong>{t('settings.language')}</strong><small>{t('settings.languageDescription')}</small></span>
          <select className="language-select" value={language} onChange={(event) => onLanguageChange(event.target.value as LanguageCode)} aria-label={t('settings.language')}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
          </select>
        </label>
        {toggles.map((setting) => (
          <label className={`setting-row${setting.disabled ? ' setting-row--disabled' : ''}`} key={setting.id}>
            <span><strong>{setting.label}</strong><small>{setting.description}</small></span>
            <span className="switch"><input type="checkbox" checked={setting.checked} disabled={setting.disabled} onChange={(event) => onToggle(setting.id, event.target.checked)} /><span className="switch__track" aria-hidden="true"><span /></span></span>
          </label>
        ))}
      </div>

      {(onExportSave || onImportSave) && <section className="settings-section"><div className="modal-section-heading"><div><span>{t('settings.persistence')}</span><h3>{t('settings.saveData')}</h3></div><small>{saveStatus ?? t('settings.autosaveReady')}</small></div><div className="settings-actions">{onExportSave && <button type="button" className="secondary-button" onClick={onExportSave}>{t('settings.export')}</button>}{onImportSave && <button type="button" className="secondary-button" onClick={onImportSave}>{t('settings.import')}</button>}</div></section>}

      {onHardReset && <section className="settings-section settings-section--danger"><div><strong>{t('settings.erase')}</strong><p>{t('settings.eraseDescription')}</p></div><button type="button" className="danger-button" onClick={onHardReset}>{t('settings.hardReset')}</button></section>}
      {versionLabel && <p className="settings-version">Brood & Burrow · {versionLabel}</p>}
    </Modal>
  );
}
