import { Icon } from './Icon';
import { Modal } from './Modal';

export interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
}

export interface SettingsModalProps {
  open: boolean;
  toggles: ToggleSetting[];
  onToggle: (id: string, checked: boolean) => void;
  onExportSave?: () => void;
  onImportSave?: () => void;
  onHardReset?: () => void;
  onClose: () => void;
  saveStatus?: string;
  versionLabel?: string;
}

export function SettingsModal({
  open,
  toggles,
  onToggle,
  onExportSave,
  onImportSave,
  onHardReset,
  onClose,
  saveStatus = 'Autosave enabled',
  versionLabel,
}: SettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Warren Settings" subtitle="Tune the den to your liking." icon={<Icon name="settings" />}>
      <div className="settings-list">
        {toggles.map((setting) => (
          <label className={`setting-row${setting.disabled ? ' setting-row--disabled' : ''}`} key={setting.id}>
            <span>
              <strong>{setting.label}</strong>
              <small>{setting.description}</small>
            </span>
            <span className="switch">
              <input
                type="checkbox"
                checked={setting.checked}
                disabled={setting.disabled}
                onChange={(event) => onToggle(setting.id, event.target.checked)}
              />
              <span className="switch__track" aria-hidden="true"><span /></span>
            </span>
          </label>
        ))}
      </div>

      {(onExportSave || onImportSave) && (
        <section className="settings-section">
          <div className="modal-section-heading"><div><span>Persistence</span><h3>Save Data</h3></div><small>{saveStatus}</small></div>
          <div className="settings-actions">
            {onExportSave && <button type="button" className="secondary-button" onClick={onExportSave}>Export save</button>}
            {onImportSave && <button type="button" className="secondary-button" onClick={onImportSave}>Import save</button>}
          </div>
        </section>
      )}

      {onHardReset && (
        <section className="settings-section settings-section--danger">
          <div><strong>Erase this warren</strong><p>Deletes local progress and starts from the beginning.</p></div>
          <button type="button" className="danger-button" onClick={onHardReset}>Hard reset</button>
        </section>
      )}
      {versionLabel && <p className="settings-version">Brood & Burrow · {versionLabel}</p>}
    </Modal>
  );
}
