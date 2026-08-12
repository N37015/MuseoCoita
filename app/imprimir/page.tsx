'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getPlaces } from '../../lib/actions';
import { CATEGORY_NAMES } from '../../lib/definitions';
import type { Place } from '../../lib/definitions';
import { Printer, Loader2, Database, CheckSquare, Square } from 'lucide-react';

export default function ImprimirPage() {
  const { data: places, isLoading, error } = useSWR<Place[]>('places', getPlaces);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);

  const groupedPlaces = (places || []).reduce((acc, place) => {
    const category = place.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(place);
    return acc;
  }, {} as Record<string, Place[]>);

  const handleTogglePlace = (placeId: string) => {
    setSelectedPlaces(prev =>
      prev.includes(placeId) ? prev.filter(id => id !== placeId) : [...prev, placeId]
    );
  };

  const handleSelectCategory = (categoryId: string, select: boolean) => {
    const categoryPlaceIds = (groupedPlaces[categoryId] || []).map(p => p.id);
    if (select) {
      setSelectedPlaces(prev => Array.from(new Set([...prev, ...categoryPlaceIds])));
    } else {
      setSelectedPlaces(prev => prev.filter(id => !categoryPlaceIds.includes(id)));
    }
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedPlaces(places?.map(p => p.id) || []);
    } else {
      setSelectedPlaces([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const placesToPrint = (places || []).filter(p => selectedPlaces.includes(p.id));

  // --- Contenido de Impresión Original Intacto ---
  const PrintContent = () => {
    const printGroups = placesToPrint.reduce((acc, place) => {
      if (!acc[place.category]) acc[place.category] = [];
      acc[place.category].push(place);
      return acc;
    }, {} as Record<string, Place[]>);

    const orderedCategories = Object.keys(CATEGORY_NAMES).filter(
      categoryId => printGroups[categoryId] && printGroups[categoryId].length > 0
    );

    return (
      <div className="print-only">
        <div className="print-top-banner">
          <div className="print-logo-container">
            <img
              src="/logo-izquierdo.png"
              alt="Logo de Ocozocoautla"
              className="print-logo"
            />
          </div>
          <div className="print-header-text">
            <span className="print-header-explora">EXPLORA</span>
            <span className="print-header-oco">OCOZOCOAUTLA</span>
          </div>
        </div>

        {orderedCategories.map((categoryId) => (
          <div key={`print-cat-${categoryId}`} style={{ marginBottom: '20px' }}>
            <h2 className="print-category-title">
              {CATEGORY_NAMES[categoryId]}
            </h2>

            <div className="print-grid">
              {printGroups[categoryId].map((place) => {
                const allSections = Object.entries(place.sections || {})
                  .map(([key, section]: [string, any]) => ({ label: key, value: section?.value }))
                  .filter(info => info.value && typeof info.value === 'string');

                const hasSteps = place.category === 'route' || place.category === 'attraction';
                const routePasos = place.sections?.pasos?.value as any[] | undefined;

                return (
                  <div key={`print-place-${place.id}`} className="print-card">
                    {place.images && place.images.length > 0 && (
                      <img
                        src={place.images[0]}
                        alt={place.name}
                        className="print-image"
                      />
                    )}

                    <h3 className="print-card-title">{place.name}</h3>
                    <p className="print-card-address">{place.address || 'Sin dirección'}</p>

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
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <span className="print-section-label" style={{ display: 'block', marginBottom: '4px' }}>
                          {place.category === 'attraction' ? 'Ruta de acceso:' : 'Itinerario:'}
                        </span>
                        {routePasos.map((paso: any) => (
                          <div key={paso.id} style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', lineHeight: '1.2' }}>
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
        ))}
      </div>
    );
  };

  // ESTADO DE CARGA 
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-800 w-full flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="animate-spin mb-4 text-sky-400" size={44} />
        <p className="text-lg font-medium">Cargando lugares...</p>
      </div>
    );
  }

  // ESTADO DE ERROR 
  if (error) {
    return (
      <div className="min-h-screen bg-slate-800 w-full py-20 px-4">
        <div className="container mx-auto max-w-2xl p-6 text-center bg-white/80 backdrop-blur-md border border-red-200 text-red-600 rounded-3xl shadow-lg">
          <p className="font-semibold text-lg">Error al cargar los datos.</p>
        </div>
      </div>
    );
  }

  // ESTADO VACÍO 
  if (!places || places.length === 0) {
    return (
      <div className="min-h-screen bg-slate-800 w-full py-20 px-4">
        <div className="container mx-auto max-w-2xl p-6 bg-white/10 backdrop-blur-md border border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center py-24 text-white shadow-xl">
          <Database size={64} className="mb-6 opacity-40 text-white" />
          <h3 className="text-xl font-semibold text-white mb-2">No hay lugares en el directorio</h3>
          <p className="text-sm text-white/60">Agrega lugares desde el panel de administración primero.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* VISTA DE PANTALLA (Aislada del Print para no afectar la impresora) */}
      <div className="screen-only min-h-screen bg-slate-800 w-full pb-16">
        <div className="container mx-auto py-8 px-4 sm:px-6">

          {/* PANEL PRINCIPAL SUPERIOR — Estilo Glassmorphism Blanco */}
          <div className="p-6 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 mb-10 sticky top-20 z-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900">Crea tu Guía Personalizada</h1>
                <p className="text-slate-600 mt-1 font-medium">Selecciona los lugares específicos que deseas imprimir.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-1.5 rounded-xl flex gap-1 w-full sm:w-auto shadow-sm">
                  <button 
                    onClick={() => handleSelectAll(true)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-700 rounded-lg text-sm font-bold transition-all border border-slate-200 hover:text-sky-600 shadow-sm"
                  >
                    Seleccionar Todo
                  </button>
                  <button 
                    onClick={() => handleSelectAll(false)} 
                    className="flex-1 sm:flex-none px-4 py-2 bg-transparent hover:bg-white/50 text-slate-600 rounded-lg text-sm font-bold transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  disabled={selectedPlaces.length === 0}
                  className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2 justify-center font-bold transition-all w-full md:w-auto shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Printer size={20} />
                  <span>Imprimir ({selectedPlaces.length}) Lugares</span>
                </button>
              </div>
            </div>
          </div>

          {/* LISTADO DE LUGARES POR CATEGORÍAS */}
          <div className="space-y-12">
            {Object.entries(groupedPlaces).map(([categoryId, categoryPlaces]) => {
              if (!categoryPlaces || categoryPlaces.length === 0) return null;

              return (
                <div key={categoryId} className="animate-fade-in">
                  
                  {/* TÍTULO DE LA CATEGORÍA EN BLANCO */}
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/20">
                    <h2 className="text-2xl font-bold text-white tracking-wide uppercase">
                      {CATEGORY_NAMES[categoryId] || categoryId}
                    </h2>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSelectCategory(categoryId, true)} className="text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors">
                        Seleccionar todos
                      </button>
                      <span className="text-white/30">|</span>
                      <button onClick={() => handleSelectCategory(categoryId, false)} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {categoryPlaces.map(place => {
                      const isSelected = selectedPlaces.includes(place.id);
                      return (
                        <div
                          key={place.id}
                          onClick={() => handleTogglePlace(place.id)}
                          // TARJETAS ESTILO GLASSMORPHISM BLANCO
                          className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col backdrop-blur-xl ${
                            isSelected
                              ? 'border-sky-400 bg-white shadow-xl scale-[1.02] ring-2 ring-sky-500/20'
                              : 'bg-white/70 border-white/60 hover:bg-white/90 hover:border-sky-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 leading-tight">{place.name}</h4>
                              <p className="text-xs text-slate-500 font-medium mt-1.5 line-clamp-2">{place.address}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VISTA DE IMPRESIÓN (Totalmente separada) */}
      <PrintContent />
    </>
  );
}