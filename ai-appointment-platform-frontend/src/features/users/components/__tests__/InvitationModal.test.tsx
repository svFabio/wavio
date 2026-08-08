import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { InvitationModal } from '../InvitationModal';
import type { InvitationFormData } from '../../types';

const formData: InvitationFormData = { email: '', rol: 'STAFF' };

describe('InvitationModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <InvitationModal
        isOpen={false}
        formData={formData}
        isSending={false}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the invite form when open', () => {
    render(
      <InvitationModal
        isOpen={true}
        formData={formData}
        isSending={false}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
    expect(screen.getByText('Send Invitation')).toBeInTheDocument();
  });

  it('calls onFormDataChange when typing the email', async () => {
    const onFormDataChange = vi.fn();
    render(
      <InvitationModal
        isOpen={true}
        formData={formData}
        isSending={false}
        onFormDataChange={onFormDataChange}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'a@b.com' } });
    expect(onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
  });

  it('calls onFormDataChange when selecting a role', async () => {
    const onFormDataChange = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <InvitationModal
        isOpen={true}
        formData={formData}
        isSending={false}
        onFormDataChange={onFormDataChange}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await userEvt.selectOptions(screen.getByLabelText('Role'), 'ADMIN');
    expect(onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ rol: 'ADMIN' }));
  });

  it('calls onSubmit when the form is submitted', async () => {
    const onSubmit = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <InvitationModal
        isOpen={true}
        formData={{ email: 'a@b.com', rol: 'STAFF' }}
        isSending={false}
        onFormDataChange={vi.fn()}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    await userEvt.click(screen.getByText('Send Invitation'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit while sending', () => {
    const { container } = render(
      <InvitationModal
        isOpen={true}
        formData={formData}
        isSending={true}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(submitBtn).toBeDisabled();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <InvitationModal
        isOpen={true}
        formData={formData}
        isSending={false}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvt.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
