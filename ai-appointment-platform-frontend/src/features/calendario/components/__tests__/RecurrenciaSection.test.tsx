import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurrenciaSection, calcularFechaFinPorDefecto } from '../RecurrenciaSection';

const defaultProps = {
  esRecurrente: false,
  recurrence: undefined as 'weekly' | 'biweekly' | 'monthly' | undefined,
  recurrenceEnd: undefined as string | undefined,
  fechaBase: '2026-01-10',
  onToggle: vi.fn(),
  onFrequencyChange: vi.fn(),
  onEndDateChange: vi.fn(),
};

describe('RecurrenciaSection', () => {
  it('renders the "Repetir cita" checkbox', () => {
    render(<RecurrenciaSection {...defaultProps} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Repetir cita')).toBeInTheDocument();
  });

  it('does not show frequency/end-date controls when esRecurrente is false', () => {
    render(<RecurrenciaSection {...defaultProps} esRecurrente={false} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows frequency select and end-date input when esRecurrente is true', () => {
    render(
      <RecurrenciaSection
        {...defaultProps}
        esRecurrente={true}
        recurrence="weekly"
        recurrenceEnd="2026-02-10"
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-02-10')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<RecurrenciaSection {...defaultProps} onToggle={onToggle} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('calls onFrequencyChange when a different frequency is selected', async () => {
    const user = userEvent.setup();
    const onFrequencyChange = vi.fn();
    render(
      <RecurrenciaSection
        {...defaultProps}
        esRecurrente={true}
        recurrence="weekly"
        onFrequencyChange={onFrequencyChange}
      />,
    );
    await user.selectOptions(screen.getByRole('combobox'), 'monthly');
    expect(onFrequencyChange).toHaveBeenCalledWith('monthly');
  });

  it('calls onEndDateChange when end date input changes', async () => {
    const user = userEvent.setup();
    const onEndDateChange = vi.fn();
    render(
      <RecurrenciaSection
        {...defaultProps}
        esRecurrente={true}
        recurrence="weekly"
        recurrenceEnd="2026-02-10"
        onEndDateChange={onEndDateChange}
      />,
    );
    const dateInput = screen.getByDisplayValue('2026-02-10');
    await user.clear(dateInput);
    await user.type(dateInput, '2026-03-01');
    expect(onEndDateChange).toHaveBeenCalled();
  });
});

describe('calcularFechaFinPorDefecto', () => {
  it('returns a date one month after fechaBase', () => {
    const result = calcularFechaFinPorDefecto('2026-01-10');
    expect(result).toBe('2026-02-10');
  });

  it('handles end-of-month correctly', () => {
    const result = calcularFechaFinPorDefecto('2026-01-31');
    // One month after Jan 31 = Feb 31, which rolls to March 3
    expect(result).toMatch(/^2026-03/);
  });
});
