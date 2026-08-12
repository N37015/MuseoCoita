'use client';

import { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  subLabel?: string;
}

export default function ImageUploader({ 
  onFilesSelected, 
  disabled = false,
  label = "Arrastra tus fotos aquí o haz clic",
  subLabel = "Soporta JPG, PNG y WEBP (Múltiples archivos)"
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filtramos para asegurar que solo sean imágenes
      const validFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      if (validFiles.length > 0) onFilesSelected(validFiles);
      // Limpiamos el input para que permita volver a seleccionar el mismo archivo si se borró por error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
        disabled ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' :
        isDragging ? 'border-sky-500 bg-sky-50/80 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <input
        type="file"
        multiple
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleChange}
        disabled={disabled}
      />
      <UploadCloud 
        className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-sky-500 animate-bounce' : 'text-slate-400'}`} 
        size={44} 
        strokeWidth={1.5} 
      />
      <p className="text-slate-700 font-bold mb-1 text-sm">{label}</p>
      <p className="text-slate-400 text-xs mb-2">{subLabel}</p>
      
      {/* Botón visual (el click real lo maneja el div contenedor) */}
      <button
        type="button"
        disabled={disabled}
        className="mt-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-colors pointer-events-none"
      >
        Seleccionar Fotos
      </button>
    </div>
  );
}