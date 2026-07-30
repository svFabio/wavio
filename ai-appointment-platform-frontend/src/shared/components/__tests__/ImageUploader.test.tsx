import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploader } from '../ImageUploader';

describe('ImageUploader', () => {
  const defaultProps = {
    currentImage: null,
    onUpload: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area when no image is present', () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByText('Subir imagen')).toBeInTheDocument();
  });

  it('renders default label text', () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByText('Subir imagen')).toBeInTheDocument();
  });

  it('renders custom label text', () => {
    render(<ImageUploader {...defaultProps} label="Custom Upload" />);
    expect(screen.getByText('Custom Upload')).toBeInTheDocument();
  });

  it('renders file size hint', () => {
    render(<ImageUploader {...defaultProps} />);
    expect(screen.getByText('PNG, JPG hasta 5MB')).toBeInTheDocument();
  });

  it('renders preview when currentImage is provided', () => {
    render(<ImageUploader {...defaultProps} currentImage="https://example.com/img.jpg" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
    expect(img).toHaveAttribute('alt', 'Preview');
  });

  it('does not show remove button when onRemove is not provided', () => {
    render(<ImageUploader currentImage="https://example.com/img.jpg" onUpload={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows remove button when onRemove is provided and image is present', () => {
    render(
      <ImageUploader
        {...defaultProps}
        currentImage="https://example.com/img.jpg"
        onRemove={vi.fn()}
      />,
    );
    const removeBtn = screen.getByRole('button');
    expect(removeBtn).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <ImageUploader
        {...defaultProps}
        currentImage="https://example.com/img.jpg"
        onRemove={onRemove}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('applies drag-active styles on drag over', () => {
    const { container } = render(<ImageUploader {...defaultProps} />);
    const dropZone = container.querySelector('[class*="border-dashed"]');
    expect(dropZone).toBeInTheDocument();
    fireEvent.dragOver(dropZone!);
    expect(dropZone!.className).toContain('border-primary');
  });

  it('removes drag-active styles on drag leave', () => {
    const { container } = render(<ImageUploader {...defaultProps} />);
    const dropZone = container.querySelector('[class*="border-dashed"]');
    fireEvent.dragOver(dropZone!);
    fireEvent.dragLeave(dropZone!);
    expect(dropZone!.className).toContain('border-border');
  });

  it('renders hidden file input', () => {
    const { container } = render(<ImageUploader {...defaultProps} />);
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });
});
