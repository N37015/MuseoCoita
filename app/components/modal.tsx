'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string; // Ejemplo: 'max-w-4xl', 'max-w-md'
  transparentBg?: boolean; // Útil para galerías de fotos
}

export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-4xl', transparentBg = false }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    
    document.body.style.overflow = 'hidden'; // Bloquea el scroll
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`${
          transparentBg 
            ? 'bg-transparent' 
            : 'bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl'
        } w-full ${maxWidth} h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] sm:rounded-3xl relative flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()} // Evita que se cierre al clickear adentro
      >
        {/* Botón de cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[110] bg-white/60 hover:bg-white text-slate-700 hover:text-red-500 p-2.5 rounded-full transition-all backdrop-blur-md shadow-sm border border-white/50"
          title="Cerrar (Esc)"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        
        {/* Contenido dinámico */}
        {children}
      </div>
    </div>
  );
}