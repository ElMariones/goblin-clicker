import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';

export interface ToastView { id: string; title: string; message?: string; icon?: IconName; tone?: 'neutral' | 'success' | 'prestige' }
export interface ToastStackProps { toasts: ToastView[]; onDismiss?: (id: string) => void }

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  const { t } = useI18n();
  return (
    <div className="toast-stack" role="region" aria-label={t('aria.notifications')} aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast toast--${toast.tone ?? 'neutral'}`} key={toast.id} role="status">
          <span className="toast__icon"><Icon name={toast.icon ?? 'brood'} size={19} /></span>
          <div className="toast__copy"><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>
          {onDismiss && <button type="button" className="toast__dismiss" onClick={() => onDismiss(toast.id)} aria-label={t('aria.dismiss', { title: toast.title })}><Icon name="close" size={16} /></button>}
        </div>
      ))}
    </div>
  );
}
