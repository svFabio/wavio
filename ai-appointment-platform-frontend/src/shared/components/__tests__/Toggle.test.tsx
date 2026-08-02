import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders with checked state', () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('renders with unchecked state', () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);
    const button = screen.getByRole('switch');
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with true when toggled from off', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when toggled from on', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange on Enter key', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange on Space key', () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { key: ' ' });
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('renders with custom id', () => {
    render(<Toggle checked={false} onChange={vi.fn()} id="custom-toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'custom-toggle');
  });

  it('renders with custom className', () => {
    render(<Toggle checked={false} onChange={vi.fn()} className="custom-class" />);
    const button = screen.getByRole('switch');
    expect(button.className).toContain('custom-class');
  });
});
