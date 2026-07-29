import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { StepEditor } from '../StepEditor';
import type { ChatFlowStep } from '../../types/domain';

const step: ChatFlowStep = {
  id: 'test-id',
  titulo: 'Test Step',
  mensaje: 'Hello world',
  tipoInput: 'texto',
  activo: true,
};

describe('StepEditor', () => {
  it('renders mensaje textarea', () => {
    render(
      <StepEditor
        step={step}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    const textarea = screen.getByDisplayValue('Hello world');
    expect(textarea).toBeInTheDocument();
  });

  it('renders tipoInput select with correct value', () => {
    render(
      <StepEditor
        step={step}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('texto');
  });

  it('calls updateStep when mensaje changes', async () => {
    const user = userEvent.setup();
    const updateStep = vi.fn();
    render(
      <StepEditor
        step={step}
        updateStep={updateStep}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    const textarea = screen.getByDisplayValue('Hello world');
    await user.type(textarea, '!');
    expect(updateStep).toHaveBeenCalledWith('test-id', { mensaje: 'Hello world!' });
  });

  it('calls updateStep when tipoInput changes', async () => {
    const user = userEvent.setup();
    const updateStep = vi.fn();
    render(
      <StepEditor
        step={step}
        updateStep={updateStep}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'lista');
    expect(updateStep).toHaveBeenCalledWith('test-id', { tipoInput: 'lista' });
  });

  it('shows opciones section when tipoInput is lista', () => {
    const listaStep = { ...step, tipoInput: 'lista' as const, opciones: ['Op1'] };
    render(
      <StepEditor
        step={listaStep}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Op1')).toBeInTheDocument();
    expect(screen.getByText('Agregar opción')).toBeInTheDocument();
  });

  it('shows opciones section when tipoInput is boton', () => {
    const botonStep = { ...step, tipoInput: 'boton' as const, opciones: ['Sí', 'No'] };
    render(
      <StepEditor
        step={botonStep}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue('Sí')).toBeInTheDocument();
    expect(screen.getByDisplayValue('No')).toBeInTheDocument();
  });

  it('does not show opciones when tipoInput is texto', () => {
    render(
      <StepEditor
        step={step}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    expect(screen.queryByText('Agregar opción')).not.toBeInTheDocument();
    expect(screen.queryByText('Opciones disponibles')).not.toBeInTheDocument();
  });

  it('calls updateOption when option changes', async () => {
    const user = userEvent.setup();
    const updateOption = vi.fn();
    const listaStep = { ...step, tipoInput: 'lista' as const, opciones: ['Op1'] };
    render(
      <StepEditor
        step={listaStep}
        updateStep={vi.fn()}
        updateOption={updateOption}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    const optInput = screen.getByDisplayValue('Op1');
    await user.type(optInput, 'x');
    expect(updateOption).toHaveBeenCalledWith('test-id', 0, 'Op1x');
  });

  it('calls addOption when add option button is clicked', async () => {
    const user = userEvent.setup();
    const addOption = vi.fn();
    const listaStep = { ...step, tipoInput: 'lista' as const, opciones: ['Op1'] };
    render(
      <StepEditor
        step={listaStep}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={addOption}
        addOption={addOption}
      />,
    );
    await user.click(screen.getByText('Agregar opción'));
    expect(addOption).toHaveBeenCalledWith('test-id');
  });

  it('disables inputs when step is not active', () => {
    const inactiveStep = { ...step, activo: false };
    render(
      <StepEditor
        step={inactiveStep}
        updateStep={vi.fn()}
        updateOption={vi.fn()}
        removeOption={vi.fn()}
        addOption={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
