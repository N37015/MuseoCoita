'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { getPlaces, getGalleries } from '../lib/actions';
import { CATEGORY_NAMES } from '../lib/definitions';
import type { Place } from '../lib/definitions';
import { Loader2, MapPin, ArrowRight, Clock, Car, DollarSign, Map } from 'lucide-react'; 
import Modal from './components/modal'; 

type Gallery = {
  id: string;
  title: string;
  images: string[];
  created_at: string;
};

// --- Componente de Carrusel de Imágenes ---
const ImageCarousel = ({ images = [], alt }: { images: string[] | undefined; alt: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (images.length > 1 && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % (images?.length || 1));
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, images.length]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full relative overflow-hidden bg-slate-100" 
    >
      {images.length > 0 ? (
        <img 
          src={images[currentIndex]} 
          alt={alt} 
          loading="lazy" 
          className="w-full h-full object-cover absolute inset-0 transition-opacity duration-500" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium absolute inset-0 bg-slate-100/50">
          Sin imagen
        </div>
      )}
    </div>
  );
};

// --- Componente: Modal de Pantalla Completa (DISEÑO BLANCO TRANSPARENTE) ---
const PlaceModal = ({ place, onClose }: { place: Place; onClose: () => void; }) => {
  const allSections = Object.entries(place.sections || {})
    .map(([key, section]: [string, any]) => ({ label: key, value: section?.value }))
    .filter(info => info.value && typeof info.value === 'string');
    
  const isRoute = place.category === 'route';
  const hasSteps = place.category === 'route' || place.category === 'attraction';
  const routePasos = place.sections?.pasos?.value as any[] | undefined;

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-4xl">
      {/* Fondo blanco transparente */}
      <div className="overflow-y-auto w-full h-full flex flex-col bg-white/95 backdrop-blur-xl text-slate-900 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        
        {place.images && place.images.length > 0 ? (
          <div className="h-64 sm:h-80 md:h-[26rem] w-full relative shrink-0">
            <ImageCarousel images={place.images} alt={place.name} />
          </div>
        ) : (
          <div className="h-20 bg-slate-100 w-full shrink-0 border-b border-slate-200"></div>
        )}

        <div className="p-6 sm:px-10 sm:pb-10 sm:pt-8 flex flex-col flex-grow">
          
          <div className="flex flex-col mb-6">
            <div className="mb-4">
              <span className="bg-sky-50 border border-sky-100 text-sky-600 text-[11px] font-black uppercase px-4 py-1.5 rounded-full inline-block tracking-widest shadow-sm">
                {CATEGORY_NAMES[place.category] || place.category}
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">
              {place.name}
            </h2>
            
            <p className="text-slate-600 text-sm sm:text-base font-medium flex items-center gap-2">
              <MapPin className="shrink-0 text-sky-500" size={18} />
              {place.address || 'Sin dirección registrada'}
            </p>
          </div>

          {/* Línea separadora gris clarito */}
          <div className="w-full h-px bg-slate-200 mb-8"></div>

          {place.map_url && (
            <div className="mb-8">
              <a
                href={place.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold text-center rounded-xl transition-all shadow-md hover:shadow-lg w-full md:w-auto justify-center items-center gap-2"
              >
                Abrir en Google Maps
              </a>
            </div>
          )}

          {/* TARJETAS BLANCAS TRANSPARENTES DE INFORMACIÓN */}
          {!isRoute && allSections.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-slate-500 mb-5 px-1">Información Adicional</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allSections.map((info, idx) => {
                  const isLongText = info.value && info.value.length > 60;
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col p-4 bg-white/80 border border-slate-200 rounded-2xl shadow-sm hover:bg-white transition-colors ${isLongText ? 'sm:col-span-2 md:col-span-3' : ''}`}
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {info.label}
                      </span>
                      <span className="text-slate-800 font-semibold text-sm whitespace-pre-line leading-relaxed">
                        {info.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Secciones de Ruta */}
          {isRoute && (
            <div className="mb-8">
              <h3 className="text-[15px] font-bold text-slate-500 mb-5 px-1">Detalles de la Ruta</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {place.sections?.hora?.value && (
                  <div className="flex flex-col p-4 bg-white/80 border border-slate-200 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Clock size={12} /> Salida
                    </span>
                    <span className="text-slate-800 font-semibold text-sm">{place.sections.hora.value}</span>
                  </div>
                )}
                {place.sections?.transporte?.value && (
                  <div className="flex flex-col p-4 bg-white/80 border border-slate-200 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Car size={12} /> Transporte
                    </span>
                    <span className="text-slate-800 font-semibold text-sm capitalize">{place.sections.transporte.value}</span>
                  </div>
                )}
                {place.sections?.costo?.value && (
                  <div className="flex flex-col p-4 bg-white/80 border border-slate-200 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <DollarSign size={12} /> Costo
                    </span>
                    <span className="text-slate-800 font-semibold text-sm">${place.sections.costo.value} MXN</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pasos */}
          {hasSteps && routePasos && routePasos.length > 0 && (
            <div>
              <h3 className="text-[15px] font-bold text-slate-500 mb-5 px-1">
                {place.category === 'attraction' ? 'Ruta de acceso paso a paso' : 'Itinerario de la ruta'}
              </h3>
              
              <div className="space-y-4">
                {routePasos.map((paso: any, index: number, array: any[]) => (
                  <div key={paso.id} className="relative pl-10">
                    {index !== array.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-sky-200" />
                    )}
                    
                    <div className="absolute left-0 top-1 w-8 h-8 bg-sky-600 text-white font-bold rounded-full flex items-center justify-center text-xs shadow-sm">
                      {paso.numero}
                    </div>
                    
                    <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 shadow-sm ml-2">
                      <p className="text-slate-800 font-semibold text-sm mb-3 whitespace-pre-wrap">
                        {paso.descripcion}
                      </p>
                      {paso.imagen && (
                        <img 
                          src={paso.imagen} 
                          alt={`Paso ${paso.numero}`} 
                          className="w-full sm:w-64 h-40 object-cover rounded-xl shadow-sm border border-slate-100"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Modal>
  );
};
// --- Componente: Tarjeta de Lugar (Web) ---
const PlaceCard = ({ place, onOpenModal }: { place: Place; onOpenModal: () => void; }) => {
  const isAttraction = place.category === 'attraction';

  const cardInner = (
    // 👇 Fondo celeste sutil (hover:bg-sky-50) y borde (hover:border-sky-300)
    <div className="place-card flex flex-col h-full overflow-hidden bg-white/70 hover:bg-sky-50 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-white/60 hover:border-sky-300 group cursor-pointer text-slate-800">
      
      <div className="h-48 w-full relative shrink-0 overflow-hidden">
        <ImageCarousel images={place.images} alt={place.name} />
      </div>
      <div className="flex flex-col flex-grow p-6">
        
        {/* 👇 Título que cambia a celeste brillante al pasar el mouse */}
        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight line-clamp-2 group-hover:text-sky-500 transition-colors">
          {place.name}
        </h3>
        
        {/* Etiqueta de categoría en tonos celestes */}
        <span className="bg-white/90 text-sky-700 border border-sky-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full self-start mb-4 tracking-wider shadow-sm">
          {CATEGORY_NAMES[place.category] || place.category}
        </span>
        
        <p className="text-slate-600 flex-grow text-sm leading-relaxed line-clamp-2 mb-5 flex items-start gap-1.5">
          <MapPin size={16} className="shrink-0 mt-0.5 text-sky-500" />
          {place.address || 'Sin dirección registrada'}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          {/* 👇 Enlace celeste que se oscurece un poquito al hover para no perderse en el fondo */}
          <span className="flex items-center gap-1.5 text-sky-500 font-bold text-sm transition-colors group-hover:text-sky-600 group-hover:underline">
            {isAttraction ? 'Explorar atractivo' : 'Ver detalles'} <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </div>
  );

  if (isAttraction) {
    return <Link href={`/atractivos/${place.id}`} className="h-full block">{cardInner}</Link>;
  }

  return <div onClick={onOpenModal} className="h-full">{cardInner}</div>;
};
// --- CONTENIDO DE LA PÁGINA PRINCIPAL ---
function HomePageContent() {
  const { data: places, isLoading, error } = useSWR<Place[]>('places', getPlaces);
  const { data: galleries } = useSWR<Gallery[]>('galleries', getGalleries); 
  
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || ''; 

  const allGalleryImages = galleries ? galleries.flatMap(g => g.images) : [];

  useEffect(() => {
    if (allGalleryImages.length > 1) {
      const interval = setInterval(() => {
        setBgIndex(prev => (prev + 1) % allGalleryImages.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [allGalleryImages.length]);

  const filteredPlaces = (places || []).filter(place => 
    place.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPlaces = filteredPlaces.reduce((acc, place) => {
    const category = place.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(place);
    return acc;
  }, {} as Record<string, Place[]>);

  if (error) {
    return <div className="container text-center py-12 text-red-500 font-bold">Error al cargar los datos.</div>;
  }

  const currentBgImage = allGalleryImages.length > 0 
    ? allGalleryImages[bgIndex]
    : '/backgrounds/default.jpg'; 

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out pointer-events-none print:hidden"
        style={{ 
          // 👇 AQUÍ ES DONDE TÚ ELIGES EL COLOR 👇
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgb(11, 11, 11)), url(${currentBgImage})`,
          zIndex: 0 
        }}
      />

      {/* VISTA WEB */}
      <div className="w-full screen-only relative z-10">
        
        {isLoading ? (
          <div className="flex justify-center items-center py-32 text-slate-600">
            <Loader2 className="animate-spin mr-3 text-sky-500" size={40} />
            <span className="text-2xl font-medium">Cargando lugares...</span>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-32 px-4 flex flex-col items-center justify-center">
            <div className="bg-white/60 backdrop-blur-md p-6 rounded-full mb-4 border border-white/50 shadow-sm">
              <Map size={48} className="text-sky-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No encontramos resultados</h3>
            <p className="text-slate-600 text-lg">No hay lugares que coincidan con "{searchTerm}".</p>
          </div>
        ) : (
          Object.entries(CATEGORY_NAMES).map(([categoryId, categoryName]) => {
            const placesForCategory = groupedPlaces[categoryId];
            if (!placesForCategory || placesForCategory.length === 0) return null;

            return (
              <section 
                key={categoryId} 
                id={categoryId} 
                className="relative py-20" 
              >
                <div className="container mx-auto px-4 sm:px-6 relative z-10">
             <h2 className=" text-4xl sm:text-5xl font-black text-white uppercase tracking-wider mb-12 drop-shadow-lg">
             {categoryName}
             </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 items-stretch">
                    {placesForCategory.map(place => (
                      <PlaceCard
                        key={place.id}
                        place={place}
                        onOpenModal={() => setSelectedPlace(place)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* RENDERIZADO CONDICIONAL DEL MODAL */}
      {selectedPlace && (
        <div className="screen-only">
          <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
        </div>
      )}

      {/* VISTA DE IMPRESIÓN */}
      <div className="print-only bg-white text-stone-900">
        <div className="print-top-banner">
          <div className="print-logo-container">
            <img src="/logo-izquierdo.png" className="print-logo" alt="Logo" />
          </div>
          <div className="print-header-text">
            <span className="print-header-explora">EXPLORA</span>
            <span className="print-header-oco">OCOZOCOAUTLA</span>
          </div>
        </div>

        {Object.entries(CATEGORY_NAMES).map(([categoryId, categoryName]) => {
          const placesForCategory = groupedPlaces[categoryId];
          if (!placesForCategory || placesForCategory.length === 0) return null;

          return (
            <div key={`print-${categoryId}`}>
              <h2 className="print-category-title">{categoryName}</h2>
              <div className="print-grid">
                {placesForCategory.map(place => {
                   const allSections = Object.entries(place.sections || {})
                    .map(([key, section]: [string, any]) => ({ label: key, value: section?.value }))
                    .filter(info => info.value && typeof info.value === 'string');
                   
                   const hasSteps = place.category === 'route' || place.category === 'attraction';
                   const routePasos = place.sections?.pasos?.value as any[] | undefined;

                   return (
                    <div key={`print-${place.id}`} className="print-card">
                      {place.images && place.images.length > 0 && (
                        <img src={place.images[0]} className="print-image" alt={place.name} />
                      )}
                      <h3 className="print-card-title">{place.name}</h3>
                      <p className="print-card-address">{place.address}</p>
                      
                      {allSections.length > 0 && (
                        <div className="print-sections-grid">
                          {allSections.map((info, idx) => (
                            <div key={idx} className="print-section-item">
                              <span className="print-section-label">{info.label}</span>
                              <span className="print-section-value">{info.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {hasSteps && routePasos && routePasos.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="print-section-label block mb-1">
                            {place.category === 'attraction' ? 'Ruta de acceso:' : 'Itinerario:'}
                          </span>
                          {routePasos.map((paso: any) => (
                            <div key={paso.id} className="text-[10px] text-gray-700 mb-1 leading-tight">
                              <strong>{paso.numero}.</strong> {paso.descripcion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 bg-slate-50"><Loader2 className="animate-spin text-sky-500" size={40} /></div>}>
      <HomePageContent />
    </Suspense>
  );
}