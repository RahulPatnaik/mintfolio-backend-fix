'use client';
import { useRef, useState, type DragEvent, type ChangeEvent, type MouseEvent } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Button } from './button';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  file: File | null;
  accept?: string;
  title: string;
}

export function FileUploader({ onFileChange, file, accept, title }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  const removeFile = (e: MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if(inputRef.current) {
        inputRef.current.value = "";
    }
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
      />
      {file ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <FileIcon className="w-12 h-12 text-primary" />
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          <Button variant="ghost" size="sm" onClick={removeFile} className="mt-2 text-destructive hover:text-destructive">
            <X className="w-4 h-4 mr-2" /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadCloud className="w-12 h-12 text-muted-foreground" />
          <p className="font-medium">
            {isDragActive ? 'Drop the file here ...' : `Drag & drop your ${title} here, or click to select`}
          </p>
          <p className="text-sm text-muted-foreground">PDF file up to 10MB</p>
        </div>
      )}
    </div>
  );
}
