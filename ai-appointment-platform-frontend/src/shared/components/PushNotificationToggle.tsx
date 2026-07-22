import { usePushNotifications } from '../hooks/usePushNotifications';
import { Toggle } from './Toggle';

export function PushNotificationToggle() {
  const { supported, pushEnabled, error, toggle } = usePushNotifications();

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-txt">Notificaciones push</p>
        <p className="text-xs text-txt-secondary">
          Recibe alertas de citas y novedades en tu navegador
        </p>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-danger">{error}</span>}
        <Toggle checked={pushEnabled} onChange={toggle} id="push-notifications" />
      </div>
    </div>
  );
}
