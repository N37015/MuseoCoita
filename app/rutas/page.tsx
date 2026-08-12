'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Map, Loader2, ArrowRight, X, Clock, Car, DollarSign, MapPin } from 'lucide-react';
import { getPlaces } from '../../lib/actions'; 
import type { Place } from '../../lib/definitions';

// Tipos auxiliares basados en tu PlaceForm
interface Step {
  id: string;
  numero: number;
  descripcion: string;
  imagen: string;
}

export default function RutasPublicasPage() {
  const { data: places, error, isLoading } = useSWR<Place[]>('places', getPlaces);
  
  // Estado para controlar qué ruta está abierta en el modal
  const [selectedRuta, setSelectedRuta] = useState<Place | null>(null);

  const rutas = places?.filter(place => place.category === 'route') || [];

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-200px)] py-12">
      <div className="container mx-auto px-4">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-sky-950 uppercase tracking-tighter mb-4">
            Rutas y Excursiones
          </h1>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            Descubre los mejores recorridos, excursiones y opciones de transporte para explorar Ocozocoautla.
          </p>
        </div>

        {/* ESTADOS DE CARGA Y ERROR */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="text-lg font-medium">Cargando rutas disponibles...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl p-6 text-center max-w-md mx-auto shadow-sm">
            <p className="font-semibold text-lg">Error al cargar las rutas.</p>
          </div>
        )}

        {!isLoading && rutas.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 max-w-2xl mx-auto">
            <Map size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Aún no hay rutas publicadas</h3>
            <p className="text-slate-500">
              Las rutas que crees desde el panel de administración aparecerán aquí.
            </p>
          </div>
        )}

        {/* LISTA DE RUTAS */}
        {!isLoading && rutas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {rutas.map((ruta) => {
              const hora = ruta.sections?.hora?.value;
              const transporte = ruta.sections?.transporte?.value;
              const costo = ruta.sections?.costo?.value;
              const imagenPortada = ruta.images?.[0] || '/placeholder.jpg';

              return (
                <div 
                  key={ruta.id}
                  onClick={() => setSelectedRuta(ruta)} // Al hacer click, abrimos el modal
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group flex flex-col cursor-pointer"
                >
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <img 
                      src={imagenPortada} 
                      alt={ruta.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {costo && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-sky-900 font-black px-3 py-1 rounded-lg text-sm shadow-sm">
                        ${costo} MXN
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
                      {ruta.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4 text-xs font-bold text-slate-500">
                      {hora && (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">🕒 {hora}</span>
                      )}
                      {transporte && (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md capitalize">🚙 {transporte}</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600 line-clamp-2 mb-6">
                      {ruta.address}
                    </p>

                    <div className="mt-auto flex items-center justify-between text-sky-600 font-bold text-sm">
                      <span>Ver itinerario completo</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL DE DETALLES DE LA RUTA
          ========================================== */}
      {selectedRuta && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedRuta(null)} // Cierra al hacer click afuera
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Evita que se cierre al clickear adentro
          >
            {/* CABECERA DEL MODAL (Imagen de portada) */}
            <div className="relative h-48 sm:h-64 bg-slate-100 shrink-0">
              <img 
                src={selectedRuta.images?.[0] || '/placeholder.jpg'} 
                alt={selectedRuta.name}
                className="w-full h-full object-cover"
              />
              {/* Botón Cerrar */}
              <button 
                onClick={() => setSelectedRuta(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENIDO SCROLLEABLE */}
            <div className="p-6 sm:p-8 overflow-y-auto">
              <h2 className="text-3xl font-black text-slate-800 mb-2">
                {selectedRuta.name}
              </h2>
              <div className="flex items-start gap-2 text-slate-600 mb-6">
                <MapPin size={18} className="mt-0.5 shrink-0 text-sky-500" />
                <p>{selectedRuta.address}</p>
              </div>

              {/* Badges de Información General */}
              <div className="flex flex-wrap gap-4 mb-8 pb-8 border-b border-slate-100">
                {selectedRuta.sections?.hora?.value && (
                  <div className="flex items-center gap-2 bg-sky-50 text-sky-800 px-4 py-2 rounded-xl font-semibold text-sm">
                    <Clock size={18} />
                    <span>Salida: {selectedRuta.sections.hora.value}</span>
                  </div>
                )}
                {selectedRuta.sections?.transporte?.value && (
                  <div className="flex items-center gap-2 bg-sky-50 text-sky-800 px-4 py-2 rounded-xl font-semibold text-sm capitalize">
                    <Car size={18} />
                    <span>Transporte: {selectedRuta.sections.transporte.value}</span>
                  </div>
                )}
                {selectedRuta.sections?.costo?.value && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-xl font-semibold text-sm">
                    <DollarSign size={18} />
                    <span>Costo: ${selectedRuta.sections.costo.value} MXN</span>
                  </div>
                )}
              </div>

              {/* PASOS DEL ITINERARIO */}
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Itinerario de la ruta</h3>
                
                {selectedRuta.sections?.pasos?.value && selectedRuta.sections.pasos.value.length > 0 ? (
                  <div className="space-y-6">
                    {(selectedRuta.sections.pasos.value as Step[]).map((paso, index, array) => (
                      <div key={paso.id} className="relative pl-8 sm:pl-10">
                        {/* Línea conectora (se oculta en el último elemento) */}
                        {index !== array.length - 1 && (
                          <div className="absolute left-[13px] top-8 bottom-[-24px] w-0.5 bg-sky-200" />
                        )}
                        
                        {/* Círculo del número */}
                        <div className="absolute left-0 top-0 w-7 h-7 bg-sky-100 text-sky-600 font-bold rounded-full flex items-center justify-center text-xs border-2 border-white shadow-sm">
                          {paso.numero}
                        </div>
                        
                        {/* Contenido del paso */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 sm:p-5">
                          <p className="text-slate-700 mb-3 whitespace-pre-wrap">
                            {paso.descripcion}
                          </p>
                          {paso.imagen && (
                            <img 
                              src={paso.imagen} 
                              alt={`Paso ${paso.numero}`} 
                              className="w-full sm:w-64 h-40 object-cover rounded-lg shadow-sm border border-slate-200"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No hay detalles de itinerario registrados para esta ruta.</p>
                )}
              </div>

              {selectedRuta.map_url && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <a 
                    href={selectedRuta.map_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                  >
                    <MapPin size={18} />
                    Ver ubicación en Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}