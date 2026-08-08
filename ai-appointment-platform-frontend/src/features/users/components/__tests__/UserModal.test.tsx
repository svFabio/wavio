import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UserModal } from '../UserModal';
import type { User, UserFormData } from '../../types';

const formData: UserFormData = { nombre: '', email: '', password: '', rol: 'STAFF' };

describe('UserModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <UserModal
        isOpen={false}
        editingUser={null}
        formData={formData}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders create form when open', () => {
    render(
      <UserModal
        isOpen={true}
        editingUser={null}
        formData={formData}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('New User')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders edit form when editing user', () => {
    const editingUser: User = {
      id: 1,
      nombre: 'Admin',
      email: 'admin@test.com',
      rol: 'ADMIN',
      creadoEn: '2026-01-01T00:00:00Z',
    };
    render(
      <UserModal
        isOpen={true}
        editingUser={editingUser}
        formData={{ nombre: 'Admin', email: 'admin@test.com', password: '', rol: 'ADMIN' }}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('calls onFormDataChange when typing', async () => {
    const onFormDataChange = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UserModal
        isOpen={true}
        editingUser={null}
        formData={formData}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={onFormDataChange}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const nameInput = screen.getAllByRole('textbox')[0];
    await userEvt.type(nameInput, 'A');
    expect(onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'A' }));
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UserModal
        isOpen={true}
        editingUser={null}
        formData={{ nombre: 'Test', email: 'test@test.com', password: '123', rol: 'STAFF' }}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );
    await userEvt.click(screen.getByText('Create'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <UserModal
        isOpen={true}
        editingUser={null}
        formData={formData}
        isSaving={false}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );
    await userEvt.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables submit when isSaving', () => {
    const { container } = render(
      <UserModal
        isOpen={true}
        editingUser={null}
        formData={formData}
        isSaving={true}
        viewerRole="OWNER"
        adminCount={2}
        onFormDataChange={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(submitBtn).toBeDisabled();
  });
});
