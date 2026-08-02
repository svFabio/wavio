import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ChatFlowEditor } from '../ChatFlowEditor';
import { DEFAULT_CHAT_FLOW } from '../../types/domain';
import type { ChatFlowStep } from '../../types/domain';

describe('ChatFlowEditor', () => {
  it('renders default steps when chatFlow is empty', () => {
    render(<ChatFlowEditor chatFlow={[]} onChange={vi.fn()} />);
    expect(screen.getByText('1. Bienvenida')).toBeInTheDocument();
    expect(screen.getByText('7. Pago')).toBeInTheDocument();
  });

  it('renders provided steps', () => {
    const steps: ChatFlowStep[] = [
      { id: 'custom', titulo: 'Custom Step', mensaje: 'Hi', tipoInput: 'texto', activo: true },
    ];
    render(<ChatFlowEditor chatFlow={steps} onChange={vi.fn()} />);
    expect(screen.getByText('Custom Step')).toBeInTheDocument();
  });

  it('calls onChange with updated step when toggle is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChatFlowEditor chatFlow={DEFAULT_CHAT_FLOW} onChange={onChange} />);
    const toggles = screen.getAllByRole('switch');
    await user.click(toggles[0]);
    expect(onChange).toHaveBeenCalledOnce();
    const updated = onChange.mock.calls[0][0] as ChatFlowStep[];
    expect(updated[0].activo).toBe(false);
  });

  it('expands and collapses step on click', async () => {
    const user = userEvent.setup();
    render(<ChatFlowEditor chatFlow={DEFAULT_CHAT_FLOW} onChange={vi.fn()} />);
    expect(screen.queryByDisplayValue(DEFAULT_CHAT_FLOW[0].mensaje)).not.toBeInTheDocument();
    await user.click(screen.getByText('1. Bienvenida'));
    expect(screen.getByDisplayValue(DEFAULT_CHAT_FLOW[0].mensaje)).toBeInTheDocument();
    await user.click(screen.getByText('1. Bienvenida'));
    expect(screen.queryByDisplayValue(DEFAULT_CHAT_FLOW[0].mensaje)).not.toBeInTheDocument();
  });

  it('calls updateStep when edit is done in step editor', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChatFlowEditor chatFlow={DEFAULT_CHAT_FLOW} onChange={onChange} />);
    await user.click(screen.getByText('1. Bienvenida'));
    const textarea = screen.getByDisplayValue(DEFAULT_CHAT_FLOW[0].mensaje);
    await user.type(textarea, '!');
    expect(onChange).toHaveBeenCalled();
  });
});
