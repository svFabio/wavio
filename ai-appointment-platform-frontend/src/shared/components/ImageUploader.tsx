import { useState, useRef } from 'react';
import { X, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentImage: string | null;
  onUpload: (base64: string) => void;
  onRemove?: () => void;
  label?: string;
  accept?: string;
}

export const ImageUploader = ({
  currentImage,
  onUpload,
  onRemove,
  label = 'Subir imagen',
  accept = 'image/*',
}: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove?.();
    if (inputRef.current) inputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="relative group">
        <img
          src={preview}
          alt="Preview"
          className="w-full max-w-xs rounded-xl border border-border object-contain"
        />
        {onRemove && (
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-surface/80 hover:bg-danger-light text-txt-muted hover:text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-surface-elevated rounded-xl">
          <ImageIcon className="w-6 h-6 text-txt-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-txt-secondary">{label}</p>
          <p className="text-xs text-txt-muted mt-0.5">PNG, JPG hasta 5MB</p>
        </div>
      </div>
    </div>
  );
};
