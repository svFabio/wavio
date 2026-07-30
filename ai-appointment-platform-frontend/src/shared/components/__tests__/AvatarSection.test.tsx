import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { AvatarSection } from '../AvatarSection';

describe('AvatarSection', () => {
  const baseProps = {
    nombre: 'Test User',
    avatarLoading: false,
    fileInputRef: createRef<HTMLInputElement>(),
    onFileChange: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders user initial when no fotoPerfil and not loading', () => {
    render(<AvatarSection {...baseProps} />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders image when fotoPerfil is provided', () => {
    render(<AvatarSection {...baseProps} fotoPerfil="https://example.com/avatar.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Test User');
  });

  it('renders loading spinner when avatarLoading is true', () => {
    render(<AvatarSection {...baseProps} avatarLoading={true} />);
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });

  it('renders upload button', () => {
    render(<AvatarSection {...baseProps} />);
    expect(screen.getByLabelText('Cambiar foto')).toBeInTheDocument();
  });

  it('does not render delete button when no fotoPerfil', () => {
    render(<AvatarSection {...baseProps} />);
    expect(screen.queryByLabelText('Eliminar foto')).not.toBeInTheDocument();
  });

  it('renders delete button when fotoPerfil is provided', () => {
    render(<AvatarSection {...baseProps} fotoPerfil="https://example.com/avatar.jpg" />);
    expect(screen.getByLabelText('Eliminar foto')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <AvatarSection
        {...baseProps}
        fotoPerfil="https://example.com/avatar.jpg"
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByLabelText('Eliminar foto'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not show overlay buttons when avatarLoading', () => {
    render(<AvatarSection {...baseProps} avatarLoading={true} />);
    expect(screen.queryByLabelText('Cambiar foto')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Eliminar foto')).not.toBeInTheDocument();
  });

  it('renders hidden file input', () => {
    const { container } = render(<AvatarSection {...baseProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
    expect(fileInput).toHaveAttribute('accept', 'image/png, image/jpeg, image/webp');
  });
});
