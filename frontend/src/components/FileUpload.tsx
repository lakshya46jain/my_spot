import * as React from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  accept?: string;
  preview?: string | null;
  onFileSelect?: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  label,
  accept = "image/*",
  preview,
  onFileSelect,
  className,
  disabled = false,
}: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(preview || null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreviewUrl(preview || null);
  }, [preview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    onFileSelect?.(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect?.(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}
      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-border shadow-sm" />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:bg-destructive/90 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-warm-300 bg-warm-50 text-warm-400 hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-6 w-6" />
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" disabled={disabled} />
        {!previewUrl && (
          <p className="text-sm text-muted-foreground">Click to upload a photo</p>
        )}
      </div>
    </div>
  );
}
