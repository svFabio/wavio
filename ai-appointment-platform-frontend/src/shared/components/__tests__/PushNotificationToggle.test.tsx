import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PushNotificationToggle } from '../PushNotificationToggle';
import { usePushNotifications } from '../../hooks/usePushNotifications';

// Mock the hook
vi.mock('../../hooks/usePushNotifications');

describe('PushNotificationToggle', () => {
  const mockUsePushNotifications = usePushNotifications as any;

  it('renders nothing if not supported', () => {
    mockUsePushNotifications.mockReturnValue({
      supported: false,
      pushEnabled: false,
      error: null,
      toggle: vi.fn(),
    });

    const { container } = render(<PushNotificationToggle />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders toggle and texts when supported', () => {
    mockUsePushNotifications.mockReturnValue({
      supported: true,
      pushEnabled: true,
      error: null,
      toggle: vi.fn(),
    });

    render(<PushNotificationToggle />);
    expect(screen.getByText('Notificaciones push')).toBeInTheDocument();
    expect(
      screen.getByText('Recibe alertas de citas y novedades en tu navegador'),
    ).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('renders error message when error is present', () => {
    mockUsePushNotifications.mockReturnValue({
      supported: true,
      pushEnabled: false,
      error: 'Permiso denegado',
      toggle: vi.fn(),
    });

    render(<PushNotificationToggle />);
    expect(screen.getByText('Permiso denegado')).toBeInTheDocument();
  });

  it('calls toggle function when switch is clicked', async () => {
    const toggleMock = vi.fn();
    mockUsePushNotifications.mockReturnValue({
      supported: true,
      pushEnabled: false,
      error: null,
      toggle: toggleMock,
    });

    render(<PushNotificationToggle />);
    await userEvent.click(screen.getByRole('switch'));
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });
});
