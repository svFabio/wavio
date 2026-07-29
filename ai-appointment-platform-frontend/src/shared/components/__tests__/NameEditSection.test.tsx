import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { NameEditSection } from '../NameEditSection';

describe('NameEditSection', () => {
  const defaultProps = {
    nombre: 'Test User',
    editingNombre: false,
    setEditingNombre: vi.fn(),
    nombreValue: 'Test User',
    setNombreValue: vi.fn(),
    nombreLoading: false,
    onSave: vi.fn(),
    nombreInputRef: createRef<HTMLInputElement>(),
    onKeyDown: vi.fn(),
  };

  it('renders the current name in display mode', () => {
    render(<NameEditSection {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<NameEditSection {...defaultProps} />);
    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('shows edit button in display mode', () => {
    render(<NameEditSection {...defaultProps} />);
    expect(screen.getByLabelText('Editar nombre')).toBeInTheDocument();
  });

  it('does not show save button in display mode', () => {
    render(<NameEditSection {...defaultProps} />);
    expect(screen.queryByLabelText('Guardar nombre')).not.toBeInTheDocument();
  });

  it('calls setEditingNombre with true when edit button is clicked', () => {
    const setEditingNombre = vi.fn();
    render(<NameEditSection {...defaultProps} setEditingNombre={setEditingNombre} />);
    fireEvent.click(screen.getByLabelText('Editar nombre'));
    expect(setEditingNombre).toHaveBeenCalledWith(true);
  });

  it('shows input in edit mode', () => {
    render(<NameEditSection {...defaultProps} editingNombre={true} />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Guardar nombre')).toBeInTheDocument();
  });

  it('does not show edit button or display text in edit mode', () => {
    render(<NameEditSection {...defaultProps} editingNombre={true} />);
    expect(screen.queryByLabelText('Editar nombre')).not.toBeInTheDocument();
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  it('calls setNombreValue on input change', () => {
    const setNombreValue = vi.fn();
    render(
      <NameEditSection {...defaultProps} editingNombre={true} setNombreValue={setNombreValue} />,
    );
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'New Name' } });
    expect(setNombreValue).toHaveBeenCalledWith('New Name');
  });

  it('calls onSave when save button is clicked', () => {
    const onSave = vi.fn();
    render(<NameEditSection {...defaultProps} editingNombre={true} onSave={onSave} />);
    fireEvent.click(screen.getByLabelText('Guardar nombre'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('disables input and save button when nombreLoading is true', () => {
    render(<NameEditSection {...defaultProps} editingNombre={true} nombreLoading={true} />);
    expect(screen.getByLabelText('Nombre')).toBeDisabled();
    expect(screen.getByLabelText('Guardar nombre')).toBeDisabled();
  });

  it('calls onKeyDown on input key event', () => {
    const onKeyDown = vi.fn();
    render(<NameEditSection {...defaultProps} editingNombre={true} onKeyDown={onKeyDown} />);
    fireEvent.keyDown(screen.getByLabelText('Nombre'), { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('renders input with correct id', () => {
    render(<NameEditSection {...defaultProps} editingNombre={true} />);
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('id', 'profile-name');
  });
});
