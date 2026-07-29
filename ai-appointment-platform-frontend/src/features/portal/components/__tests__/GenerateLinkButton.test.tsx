import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GenerateLinkButton } from '../GenerateLinkButton';

vi.mock('../../api/usePortal', () => ({
  useGenerateLinkMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue({ token: 'abc' }),
  }),
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('GenerateLinkButton', () => {
  it('renders generate button', () => {
    render(<GenerateLinkButton clienteId={1} />);
    expect(screen.getByText('Generar enlace')).toBeInTheDocument();
  });

  it('shows regenerate after generating', async () => {
    const user = userEvent.setup();
    render(<GenerateLinkButton clienteId={1} />);
    await user.click(screen.getByText('Generar enlace'));
    expect(await screen.findByText('Regenerar enlace')).toBeInTheDocument();
  });
});
