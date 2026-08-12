'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { getPlaceById } from '../../../lib/actions';
import { CATEGORY_NAMES } from '../../../lib/definitions';
import type { Place } from '../../../lib/definitions';
import { Loader2, ArrowLeft, MapPin, DollarSign, Compass, Footprints, Sparkles, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Modal from '../../components/modal'; // Ajusta la ruta si es necesario

export default function AtractivoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // Estado para el modal de fotos en grande (Lightbox)
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const { data: place, error, isLoading } = useSWR<Place | null>(
    id ? `place-${id}` : null,
    () => getPlaceById(id)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white text-slate-400">
        <Loader2 className="animate-spin mb-4 text-sky-500" size={52} />
        <p className="text-xl font-bold tracking-tight text-slate-600">Cargando experiencia turística...</p>
      </div>
    );
  }

  if (error || !place || place.category !== 'attraction') {
    return (
      <div className="container mx-auto py-32 text-center px-4">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Atractivo no encontrado</h1>
        <p className="text-slate-500 mb-8 text-lg">El lugar que buscas no existe o fue eliminado.</p>
        <Link href="/" className="bg-sky-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-sky-700 transition-colors shadow-lg">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Extraemos datos de la base de datos
  const costo = place.sections?.['Costo de entrada']?.value;
  const descripcion = place.sections?.['Descripción']?.value;
  const actividades = place.sections?.['Actividades a realizar']?.value;
  const routePasos = place.sections?.pasos?.value as any[] | undefined;
  
  // Todas las fotos disponibles
  const allImages = place.images || [];
  const portada = allImages[0] || '/backgrounds/default.jpg';
  const restOfImages = allImages.slice(1);

  return (
    <div className="min-h-screen bg-white text-slate-800 selection:bg-sky-200 selection:text-sky-900 pb-32">
      
      {/* 1. BOTÓN FLOTANTE DE REGRESO */}
      <div className="fixed top-6 left-6 z-40">
        <Link 
          href="/" 
          className="bg-white/90 hover:bg-white text-slate-700 backdrop-blur-md px-5 py-3 rounded-full font-bold text-sm shadow-2xl transition-all flex items-center gap-2 border border-slate-200 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Explorar más lugares</span>
        </Link>
      </div>

      {/* 2. HERO / PORTADA GIGANTE INMERSIVA */}
      <div className="relative h-[75vh] md:h-[85vh] w-full overflow-hidden bg-slate-100">
        <img 
          src={portada} 
          alt={place.name} 
          className="w-full h-full object-cover brightness-[0.85] scale-105 animate-in fade-in duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-slate-900/20"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12 md:p-20">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-sky-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 w-fit">
                <Sparkles size={14} /> Atractivo Turístico
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl leading-none">
              {place.name}
            </h1>
            <p className="text-slate-100 text-lg sm:text-2xl font-medium flex items-center gap-2.5 drop-shadow-md">
              <MapPin size={24} className="text-sky-300 shrink-0" />
              {place.address || 'Ocozocoautla de Espinosa, Chiapas'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. CONTENIDO PRINCIPAL */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 -mt-10 relative z-20 space-y-12">
        
        {/* TARJETA DE DATOS RÁPIDOS (Costo y Mapa) */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center border border-sky-200 shrink-0">
              <DollarSign size={28} />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Costo de acceso</span>
              <span className="text-2xl font-black text-slate-900">{costo ? `$${costo} MXN` : 'Acceso Libre / Gratuito'}</span>
            </div>
          </div>

          {place.map_url && (
            <a 
              href={place.map_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl hover:shadow-sky-500/20 text-center flex items-center justify-center gap-2"
            >
              <ExternalLink size={18} />
              <span>Cómo llegar en Google Maps</span>
            </a>
          )}
        </div>

        {/* HISTORIA / DESCRIPCIÓN */}
        {descripcion && (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-3">
              <Compass className="text-sky-500" size={36} />
              <span>Historia y descripción</span>
            </h2>
            <div className="text-slate-600 text-lg sm:text-xl leading-relaxed whitespace-pre-line font-normal">
              {descripcion}
            </div>
          </div>
        )}

        {/* ACTIVIDADES RECOMENDADAS */}
        {actividades && (
          <div className="bg-gradient-to-br from-sky-500 via-sky-400 to-sky-300 text-white rounded-3xl shadow-2xl p-8 sm:p-12 border border-sky-200 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-15 translate-x-12 translate-y-12 pointer-events-none text-white">
              <Footprints size={300} />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-6 relative z-10 text-white">
              Actividades que puedes realizar
            </h2>
            <div className="text-sky-50 text-lg sm:text-xl leading-relaxed whitespace-pre-line font-medium relative z-10">
              {actividades}
            </div>
          </div>
        )}

        {/* NUEVO APARTADO: GALERÍA FOTOGRÁFICA DE ALTO IMPACTO */}
        {allImages.length > 0 && (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <ImageIcon className="text-sky-500" size={36} />
                  <span>Galería Fotográfica</span>
                </h2>
                <p className="text-slate-500 text-sm mt-1">Haz clic en cualquier imagen para verla en pantalla completa</p>
              </div>
              <span className="bg-white text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200">
                {allImages.length} fotos
              </span>
            </div>

            {/* Grid de Fotos Hermoso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {allImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActivePhoto(img)}
                  className="group relative aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-md"
                >
                  <img 
                    src={img} 
                    alt={`${place.name} foto ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-95 group-hover:brightness-100" 
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-4 py-2 rounded-full border border-white shadow-lg">
                      Ampliar imagen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RUTA DE ACCESO PASO A PASO */}
        {routePasos && routePasos.length > 0 && (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-8 flex items-center gap-3">
              <Footprints className="text-sky-500" size={36} />
              <span>Ruta de acceso (Paso a paso)</span>
            </h2>

            <div className="space-y-10">
              {routePasos.map((paso: any, index: number, array: any[]) => (
                <div key={paso.id} className="relative pl-10 sm:pl-14">
                  {index !== array.length - 1 && (
                    <div className="absolute left-[17px] top-12 bottom-[-40px] w-0.5 bg-sky-300" />
                  )}
                  
                  <div className="absolute left-0 top-0 w-9 h-9 bg-sky-500 text-white font-black rounded-full flex items-center justify-center text-sm shadow-lg ring-4 ring-white">
                    {paso.numero}
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <p className="text-slate-700 text-lg font-medium mb-6 whitespace-pre-wrap leading-relaxed">
                      {paso.descripcion}
                    </p>
                    {paso.imagen && (
                      <div 
                        onClick={() => setActivePhoto(paso.imagen)}
                        className="rounded-xl overflow-hidden shadow-lg max-w-lg border border-slate-200 cursor-pointer group relative"
                      >
                        <img 
                          src={paso.imagen} 
                          alt={`Paso ${paso.numero}`} 
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm">
                            Ver foto del paso
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL PARA VER FOTOS EN GRANDE */}
      <Modal isOpen={!!activePhoto} onClose={() => setActivePhoto(null)} transparentBg={true} maxWidth="max-w-5xl">
        {activePhoto && (
          <div className="relative w-full flex items-center justify-center p-2 sm:p-6">
            <img 
              src={activePhoto} 
              alt="Foto ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-200"
            />
          </div>
        )}
      </Modal>

    </div>
  );
}