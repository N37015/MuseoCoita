'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import Link from 'next/link';
import { savePlace, updatePlace, uploadImages } from '../../lib/actions';
import { CATEGORY_NAMES, CATEGORY_FIELDS } from '../../lib/definitions'; 
import type { Place } from '../../lib/definitions';
import { Save, X, MapPin, Loader2, ArrowLeft, CheckCircle, Plus, Image as ImageIcon } from 'lucide-react';
import ImageUploader from './ImageUploader';

// --- TIPOS Y CONSTANTES PARA RUTAS ---
type Transport = 'pie' | 'auto' | 'publico' | 'bici' | 'taxi' | 'otro';

interface Step {
  id: string;
  numero: number;
  descripcion: string;
  imagen: string; // Base64
}

const TRANSPORT_ICONS: Record<Transport, string> = {
  pie: '🚶 A pie',
  auto: '🚗 Auto',
  publico: '🚌 Transp. Público',
  bici: '🚲 Bicicleta',
  taxi: '🚕 Taxi/App',
  otro: '🛸 Otro',
};

// --- UTILIDAD PARA COMPRIMIR IMÁGENES DE LOS PASOS ---
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
  });
};

interface PlaceFormProps {
  initialData?: Place;
}

export default function PlaceForm({ initialData }: PlaceFormProps) {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const isEditing = !!initialData;

  // --- ESTADOS PRINCIPALES ---
  const [category, setCategory] = useState(initialData?.category || 'hotel');
  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [mapUrl, setMapUrl] = useState(initialData?.map_url || '');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  
  // --- ESTADOS EXCLUSIVOS PARA RUTAS Y PASOS ---
  const [routeHora, setRouteHora] = useState('');
  const [routeTransporte, setRouteTransporte] = useState<Transport>('publico');
  const [routeCosto, setRouteCosto] = useState('');
  const [routePasos, setRoutePasos] = useState<Step[]>([
    { id: crypto.randomUUID(), numero: 1, descripcion: '', imagen: '' }
  ]);
  const [dragActiveStepId, setDragActiveStepId] = useState<string | null>(null);

  // --- ESTADOS DE IMÁGENES PRINCIPALES ---
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (initialData?.sections) {
      if (initialData.category === 'route') {
        setRouteHora(initialData.sections.hora?.value || '');
        setRouteTransporte((initialData.sections.transporte?.value as Transport) || 'publico');
        setRouteCosto(initialData.sections.costo?.value || '');
        if (initialData.sections.pasos?.value) {
          setRoutePasos(initialData.sections.pasos.value);
        }
      } else if (initialData.category === 'attraction') {
        const loadedFields: Record<string, string> = {};
        Object.entries(initialData.sections).forEach(([key, section]: any) => {
          if (key !== 'pasos') loadedFields[key] = section?.value || '';
        });
        setFieldValues(loadedFields);
        if (initialData.sections.pasos?.value) {
          setRoutePasos(initialData.sections.pasos.value);
        }
      } else {
        const loadedFields: Record<string, string> = {};
        Object.entries(initialData.sections).forEach(([key, section]: any) => {
          loadedFields[key] = section?.value || '';
        });
        setFieldValues(loadedFields);
      }
    }
  }, [initialData]);

  // --- LÓGICA DE DRAG & DROP PASOS ---
  const handleStepDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (dragActiveStepId !== id) setDragActiveStepId(id);
  };
  const handleStepDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActiveStepId(null);
  };
  const handleStepDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); setDragActiveStepId(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file);
        setRoutePasos(prev => prev.map(p => p.id === id ? { ...p, imagen: base64 } : p));
      }
    }
  };
  const handleStepImageChange = async (id: string, file: File | null) => {
    if (!file) return;
    const base64 = await compressImage(file);
    setRoutePasos(prev => prev.map(p => p.id === id ? { ...p, imagen: base64 } : p));
  };
  const handleAddStep = () => {
    setRoutePasos(prev => [...prev, { id: crypto.randomUUID(), numero: prev.length + 1, descripcion: '', imagen: '' }]);
  };
  const handleRemoveStep = (idToRemove: string) => {
    setRoutePasos(prev => {
      const filtered = prev.filter(p => p.id !== idToRemove);
      return filtered.map((p, idx) => ({ ...p, numero: idx + 1 }));
    });
  };

  // --- GUARDAR / ACTUALIZAR ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSuccess) return;
    setIsSubmitting(true);

    try {
      let uploadedPaths: string[] = []; 
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        uploadedPaths = await uploadImages(formData);
      }

      const finalImages = [...existingImages, ...uploadedPaths];
      const structuredSections: Record<string, any> = {};
      
      if (category === 'route') {
        structuredSections['hora'] = { type: 'route_meta', value: routeHora };
        structuredSections['transporte'] = { type: 'route_meta', value: routeTransporte };
        structuredSections['costo'] = { type: 'route_meta', value: routeCosto };
        structuredSections['pasos'] = { type: 'route_steps', value: routePasos };
      } else if (category === 'attraction') {
        const currentFields = CATEGORY_FIELDS[category] || [];
        currentFields.forEach(field => {
          if (fieldValues[field]) structuredSections[field] = { type: 'predefined', value: fieldValues[field] };
        });
        structuredSections['pasos'] = { type: 'route_steps', value: routePasos };
      } else {
        const currentFields = CATEGORY_FIELDS[category] || [];
        currentFields.forEach(field => {
          if (fieldValues[field]) structuredSections[field] = { type: 'predefined', value: fieldValues[field] };
        });
      }

      const payload = {
        name,
        category,
        address,
        map_url: mapUrl,
        images: finalImages,
        sections: structuredSections
      };

      if (isEditing && initialData) {
        await updatePlace(initialData.id, payload);
      } else {
        await savePlace(payload);
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      globalMutate('places');
      
      setTimeout(() => {
        router.push('/museo');
        router.refresh();
      }, 1500);

    } catch (error) {
      console.error("Error al procesar el registro:", error);
      alert("Hubo un error al procesar el registro.");
      setIsSubmitting(false);
    }
  };

  return (
    // CONTENEDOR PRINCIPAL GRIS (Para que combine con MuseoDashboard)
    <div className="min-h-screen bg-slate-800 w-full py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* CABECERA (Modo Dark) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/museo" className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all shadow-sm border border-white/10">
              <ArrowLeft size={24} />
            </Link>
            <div className="bg-sky-500/20 p-3 rounded-2xl text-sky-400 border border-sky-500/30 hidden sm:flex shadow-inner">
              <Save size={24} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight m-0">
              {isEditing ? 'Editar Registro' : 'Añadir Nuevo Registro'}
            </h1>
          </div>
          {isEditing && (
            <span className="bg-white/10 border border-white/20 text-white text-sm font-bold uppercase px-4 py-2 rounded-full shadow-sm">
              {CATEGORY_NAMES[category] || category}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
          
          {/* INFO PRINCIPAL (Tarjeta Glassmorphism) */}
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/60 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Información Principal</h2>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Categoría del Lugar</label>
              <select 
                disabled={isEditing} 
                className="w-full bg-white/60 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white/90 block p-3.5 outline-none disabled:opacity-60 font-medium shadow-sm transition-all" 
                value={category} 
                onChange={e => { setCategory(e.target.value); setFieldValues({}); }}
              >
                <option value="hotel">Hotel</option>
                <option value="restaurant">Restaurante</option>
                <option value="cafeteria">Cafetería</option>
                <option value="medical">Servicio Médico</option>
                <option value="church">Iglesia</option>
                <option value="route">Ruta</option> 
                <option value="attraction">Atractivo Turístico</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/60 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white/90 block p-3.5 outline-none font-medium shadow-sm transition-all placeholder:text-slate-400" placeholder={category === 'route' ? "Ej. Excursión a la Sima" : "Ej. Sima de las Cotorras"} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {category === 'route' ? 'Punto de partida *' : 'Dirección *'}
                </label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white/60 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white/90 block p-3.5 outline-none font-medium shadow-sm transition-all placeholder:text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Enlace de Google Maps</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400"><MapPin size={18} /></div>
                <input type="url" value={mapUrl} onChange={e => setMapUrl(e.target.value)} className="w-full bg-white/60 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white/90 block p-3.5 pl-10 outline-none font-medium shadow-sm transition-all placeholder:text-slate-400" placeholder="https://maps.google.com/..." />
              </div>
            </div>
          </div>

          {/* =========================================
              UI DINÁMICA
              ========================================= */}

          {/* 1. CAMPOS GENÉRICOS */}
          {category !== 'route' && (
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/60">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Detalles Adicionales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(CATEGORY_FIELDS[category] || []).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{field}</label>
                    <input type="text" value={fieldValues[field] || ''} onChange={e => setFieldValues({...fieldValues, [field]: e.target.value})} className="w-full bg-white/60 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white/90 block p-3 outline-none font-medium shadow-sm transition-all placeholder:text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. CAMPOS EXCLUSIVOS DE RUTAS */}
          {category === 'route' && (
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/60">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Detalles de la Ruta</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Hora de salida</label>
                  <input type="time" value={routeHora} onChange={e => setRouteHora(e.target.value)} className="w-full bg-white/60 border border-slate-200 text-slate-900 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white/90 font-medium shadow-sm transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Costo (MXN)</label>
                  <input type="number" placeholder="Ej. 150" value={routeCosto} onChange={e => setRouteCosto(e.target.value)} className="w-full bg-white/60 border border-slate-200 text-slate-900 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white/90 font-medium shadow-sm transition-all placeholder:text-slate-400" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Transporte</label>
                  <select value={routeTransporte} onChange={e => setRouteTransporte(e.target.value as Transport)} className="w-full bg-white/60 border border-slate-200 text-slate-900 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white/90 font-medium shadow-sm transition-all">
                    {Object.entries(TRANSPORT_ICONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 3. CONSTRUCTOR DE PASOS */}
          {(category === 'route' || category === 'attraction') && (
            <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/60">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                {category === 'attraction' ? '📍 Ruta de acceso (Paso a paso)' : '📍 Pasos del recorrido'}
              </h3>
              <div className="space-y-4">
                {routePasos.map((paso) => (
                  <div key={paso.id} className="relative pl-6 border-l-2 border-dashed border-sky-300 ml-3">
                    <div className="absolute -left-3.5 top-0 w-7 h-7 bg-sky-100 text-sky-700 font-bold rounded-full flex items-center justify-center text-xs border-4 border-white">
                      {paso.numero}
                    </div>
                    
                    <div 
                      className={`p-5 rounded-2xl border ml-2 transition-all duration-200 ${
                        dragActiveStepId === paso.id 
                          ? 'bg-sky-50 border-sky-400 border-dashed scale-[1.01]' 
                          : 'bg-white/60 border-slate-200 border-solid'
                      }`}
                      onDragOver={(e) => handleStepDragOver(e, paso.id)}
                      onDragLeave={handleStepDragLeave}
                      onDrop={(e) => handleStepDrop(e, paso.id)}
                    >
                      <textarea required value={paso.descripcion} onChange={(e) => {
                          const newPasos = routePasos.map(p => p.id === paso.id ? { ...p, descripcion: e.target.value } : p);
                          setRoutePasos(newPasos);
                        }}
                        placeholder="Describe qué se hace en este paso..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm resize-none mb-3 outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white/90 font-medium shadow-sm placeholder:text-slate-400" rows={2}
                      />
                      <div className="flex justify-between items-center">
                        <label className={`flex items-center gap-2 text-xs cursor-pointer transition-colors ${dragActiveStepId === paso.id ? 'text-sky-600 font-semibold' : 'text-slate-500 hover:text-sky-600'}`}>
                          <ImageIcon size={16} />
                          <span>{paso.imagen ? 'Cambiar foto (o arrastrar)' : 'Añadir foto (o arrastrar)'}</span>
                          <input type="file" accept="image/*" onChange={(e) => handleStepImageChange(paso.id, e.target.files?.[0] || null)} className="hidden" />
                        </label>
                        
                        {routePasos.length > 1 && (
                          <button type="button" onClick={() => handleRemoveStep(paso.id)} className="text-red-500 hover:underline text-xs font-bold">
                            Quitar paso
                          </button>
                        )}
                      </div>
                      {paso.imagen && (
                        <div className="mt-3 relative w-32 h-20">
                           <img src={paso.imagen} alt={`Paso ${paso.numero}`} className="h-full w-full rounded-lg object-cover shadow-sm border border-slate-200" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={handleAddStep} className="mt-6 ml-5 text-sky-600 font-bold text-sm flex items-center gap-1 hover:underline">
                <Plus size={16}/> Agregar otro paso
              </button>
            </div>
          )}

          {/* FOTOGRAFÍAS GENERALES */}
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-lg border border-white/60">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Fotografías Principales</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              {category === 'route' ? 'Estas fotos aparecerán como portada de la ruta.' : 'Fotos del establecimiento o lugar.'}
            </p>
            
            {existingImages.length > 0 && (
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Imágenes actuales</label>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((src, idx) => (
                    <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm group bg-white">
                      <img src={src} alt="Existente" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <ImageUploader 
                onFilesSelected={(newFiles) => setSelectedFiles(prev => [...prev, ...newFiles])}
                disabled={isSubmitting || isSuccess}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Nuevas imágenes a subir:</h3>
                <div className="flex flex-wrap gap-4">
                  {selectedFiles.map((file, idx) => (
                    <div key={`file-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm group bg-white">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTÓN SUBMIT */}
          <div className="pt-4 pb-12">
            <button 
              type="submit" 
              disabled={isSubmitting || isSuccess} 
              className={`w-full flex items-center justify-center gap-2 py-4 px-8 rounded-2xl text-lg font-black shadow-lg transition-all duration-300 focus:ring-4 focus:ring-sky-500/50 
                ${isSuccess 
                  ? 'bg-green-500 text-white shadow-green-500/30 border border-green-400 cursor-default' 
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/20 border border-sky-500/50 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1'
                }`}
            >
              {isSuccess ? <CheckCircle size={28} /> : isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              <span>
                {isSuccess 
                  ? '¡Guardado con éxito!' 
                  : isSubmitting 
                    ? 'Procesando...' 
                    : isEditing ? 'Actualizar Registro' : 'Guardar Nuevo Registro'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}