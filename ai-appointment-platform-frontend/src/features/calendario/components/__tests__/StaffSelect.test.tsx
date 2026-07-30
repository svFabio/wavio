import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffSelect } from '../StaffSelect';
import type { Usuario } from '../../../../types';

const staffList: Usuario[] = [
  { id: 1, nombre: 'Alice', email: 'alice@test.com', rol: 'STAFF' },
  { id: 2, nombre: 'Bob', email: 'bob@test.com', rol: 'ADMIN' },
];

describe('StaffSelect', () => {
  it('renders nothing when staffList has 0 members', () => {
    const { container } = render(<StaffSelect staffList={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when staffList has exactly 1 member', () => {
    const { container } = render(<StaffSelect staffList={[staffList[0]]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a select when staffList has more than 1 member', () => {
    render(<StaffSelect staffList={staffList} onSelect={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Asignar Staff')).toBeInTheDocument();
  });

  it('shows all staff options plus the "Sin asignar" option', () => {
    render(<StaffSelect staffList={staffList} onSelect={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Sin asignar' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alice (STAFF)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bob (ADMIN)' })).toBeInTheDocument();
  });

  it('selects the given selectedStaffId', () => {
    render(<StaffSelect staffList={staffList} selectedStaffId={2} onSelect={vi.fn()} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2');
  });

  it('calls onSelect with numeric id when a staff is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StaffSelect staffList={staffList} onSelect={onSelect} />);
    await user.selectOptions(screen.getByRole('combobox'), '1');
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('calls onSelect with undefined when "Sin asignar" is selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StaffSelect staffList={staffList} selectedStaffId={1} onSelect={onSelect} />);
    await user.selectOptions(screen.getByRole('combobox'), '');
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });
});
