'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { getGalleries } from '../../lib/actions';
import Modal from '../components/modal'; 
import { Loader2, Image as ImageIcon, ZoomIn, Calendar } from 'lucide-react';

type Gallery = {
  id: string;
  title: string;
  images: string[];
  created_at: string;
};

export default function GaleriaPublica() {
  const { data: galleries, error, isLoading } = useSWR<Gallery[]>('galleries', getGalleries);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    // FONDO GRIS OSCURO GENERAL
    <div className="min-h-screen bg-slate-800 w-full pb-20">

      {/* CABECERA */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-20 overflow-hidden border-b border-white/10">
        {/* Acentos suaves en azul celeste (efecto de luz) */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="bg-white/10 text-white inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-md border border-white/20 shadow-sm">
            <ImageIcon size={18} />
            Galería Fotográfica
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 tracking-tight drop-shadow-md">
            Explora Ocozocoautla
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Descubre la magia, las tradiciones y los paisajes de nuestro Pueblo Mágico a través de estas colecciones.
          </p>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">

        {/* Carga */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <Loader2 className="animate-spin mb-4 text-sky-400" size={44} />
            <p className="text-lg font-medium">Cargando fotografías...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 px-6 text-red-600 font-semibold bg-white/90 backdrop-blur-md rounded-3xl border border-red-200 max-w-xl mx-auto shadow-lg">
            Error al cargar la galería. Por favor, intenta nuevamente.
          </div>
        )}

        {/* Sin datos */}
        {!isLoading && galleries && galleries.length === 0 && (
          <div className="text-center py-28 px-4 flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl border border-dashed border-white/20 rounded-3xl shadow-xl max-w-2xl mx-auto">
            <div className="bg-white/10 p-6 rounded-full mb-5 border border-white/20 shadow-sm">
              <ImageIcon size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Aún no hay fotos</h3>
            <p className="text-white/60 text-base font-medium">Pronto subiremos colecciones increíbles.</p>
          </div>
        )}

        {/* Listado de Galerías */}
        {!isLoading && galleries && galleries.length > 0 && (
          <div className="space-y-16 sm:space-y-20">
            {galleries.map((gallery) => (
              
              // TARJETAS ESTILO GLASSMORPHISM BLANCO
              <section key={gallery.id} className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/50 shadow-xl">

                {/* Título de la colección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
                      {gallery.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-500 text-sm font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={15} className="text-sky-600" />
                        {new Date(gallery.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {gallery.images.length} fotos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid de Fotos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {gallery.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-sky-300 transition-all duration-300"
                      onClick={() => setSelectedImage(imgUrl)}
                    >
                      <img
                        src={imgUrl}
                        alt={`Foto de ${gallery.title}`}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Overlay al pasar el mouse */}
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <ZoomIn className="text-white transform scale-50 group-hover:scale-100 transition-transform duration-300 drop-shadow-lg" size={40} strokeWidth={2.5} />
                      </div>
                    </div>
                  ))}
                </div>

              </section>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE FOTO EN GRANDE (Usa el Modal transparente) */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        transparentBg={true}
        maxWidth="max-w-5xl"
      >
        {selectedImage && (
          <div className="relative w-full flex items-center justify-center p-2 sm:p-4">
            <img
              src={selectedImage}
              alt="Foto en pantalla completa"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        )}
      </Modal>

    </div>
  );
}