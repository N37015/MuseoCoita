'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { 
  Plus, Edit2, Trash2, MapPin, LayoutDashboard, Loader2, 
  Database, AlertTriangle, Images, X, Image as ImageIcon, Save, Edit3 
} from 'lucide-react';
import { 
  getPlaces, deletePlace, getGalleries, saveGallery, uploadImages, deleteGallery, updateGallery 
} from '../../lib/actions';
import { CATEGORY_NAMES } from '../../lib/definitions';
import type { Place } from '../../lib/definitions';
import ImageUploader from '../components/ImageUploader'; 
import Modal from '../components/modal'; 

// Definición básica del tipo de dato para las galerías
type Gallery = {
  id: string;
  title: string;
  images: string[];
  created_at: string;
};

export default function MuseoDashboard() {
  const [activeTab, setActiveTab] = useState<'places' | 'galleries'>('places');

  // Datos y SWR para Lugares
  const { data: places, error: placesError, mutate: mutatePlaces, isLoading: placesLoading } = useSWR<Place[]>('places', getPlaces);
  
  // Datos y SWR para Galerías
  const { data: galleries, error: galleriesError, mutate: mutateGalleries, isLoading: galleriesLoading } = useSWR<Gallery[]>('galleries', getGalleries);

  // Estados para Modal de Eliminación de Lugares
  const [placeToDelete, setPlaceToDelete] = useState<string | null>(null);
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);

  // Estados para Formulario de Galerías (Creación)
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmittingGallery, setIsSubmittingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string>(''); // <-- NUEVO ESTADO DE ERROR

  // Estados para Modal de Eliminación de Galerías
  const [galleryToDelete, setGalleryToDelete] = useState<string | null>(null);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);

  // --- ESTADOS PARA EDICIÓN DE GALERÍAS ---
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]); 
  const [newFiles, setNewFiles] = useState<File[]>([]);       
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string>(''); // <-- NUEVO ESTADO DE ERROR EDICIÓN

  // --- LÓGICA DE LUGARES ---
  const confirmDeletePlace = async () => {
    if (!placeToDelete) return;
    setIsDeletingPlace(true);
    try {
      await deletePlace(placeToDelete);
      mutatePlaces();
    } catch (error) {
      console.error("Error al eliminar lugar:", error);
      // Aquí también podríamos usar un toast, pero por ahora lo dejamos simple
    } finally {
      setIsDeletingPlace(false);
      setPlaceToDelete(null);
    }
  };

  const groupedPlaces = (places || []).reduce((acc, place) => {
    const cat = place.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(place);
    return acc;
  }, {} as Record<string, Place[]>);

  // --- LÓGICA DE CREACIÓN DE GALERÍAS ---
  const handleFilesAdded = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setGalleryError(''); // Limpiar error al agregar archivos
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalleryError(''); // Limpiamos errores previos

    if (!title.trim()) {
      setGalleryError('Por favor, ingresa un título para la galería.');
      return;
    }
    if (files.length === 0) {
      setGalleryError('Debes seleccionar al menos una fotografía.');
      return;
    }

    setIsSubmittingGallery(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const uploadedPaths = await uploadImages(formData);
      
      await saveGallery(title, uploadedPaths);
      
      setTitle('');
      setFiles([]);
      setPreviewUrls([]);
      mutateGalleries();
    } catch (error) {
      console.error('Error al guardar galería:', error);
      setGalleryError('Hubo un error al publicar la galería. Intenta de nuevo.');
    } finally {
      setIsSubmittingGallery(false);
    }
  };

  const confirmDeleteGallery = async () => {
    if (!galleryToDelete) return;
    setIsDeletingGallery(true);
    try {
      await deleteGallery(galleryToDelete);
      mutateGalleries();
    } catch (error) {
      console.error('Error al eliminar galería:', error);
    } finally {
      setIsDeletingGallery(false);
      setGalleryToDelete(null);
    }
  };

  // --- LÓGICA DE EDICIÓN DE GALERÍAS ---
  const handleOpenEdit = (gallery: Gallery) => {
    setEditingGalleryId(gallery.id);
    setEditTitle(gallery.title);
    setEditImages([...gallery.images]);
    setNewFiles([]);
    setNewPreviewUrls([]);
    setEditError('');
  };

  const handleCloseEdit = () => {
    setEditingGalleryId(null);
    setEditTitle('');
    setEditImages([]);
    setNewFiles([]);
    newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setNewPreviewUrls([]);
    setEditError('');
  };

  const handleRemoveExistingImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleNewFilesSelected = (selectedFiles: File[]) => {
    setNewFiles(prev => [...prev, ...selectedFiles]);
    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setNewPreviewUrls(prev => [...prev, ...previews]);
    setEditError('');
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setNewPreviewUrls(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editingGalleryId) return;
    if (!editTitle.trim()) {
      setEditError('El título no puede estar vacío.');
      return;
    }
    if (editImages.length === 0 && newFiles.length === 0) {
      setEditError('La galería debe tener al menos una fotografía.');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      let uploadedPaths: string[] = [];
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach(file => formData.append('files', file));
        uploadedPaths = await uploadImages(formData);
      }

      const finalImages = [...editImages, ...uploadedPaths];

      await updateGallery(editingGalleryId, {
        title: editTitle,
        images: finalImages
      });

      mutateGalleries();
      handleCloseEdit();
    } catch (error) {
      console.error('Error al actualizar galería:', error);
      setEditError('Hubo un error al actualizar la galería.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative text-slate-900">
      
      {/* CABECERA GENERAL Y PESTAÑAS */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl text-sky-600 shadow-sm border border-slate-100">
            <LayoutDashboard size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight m-0">
              Panel de Administración
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Gestiona el directorio y galerías de Ocozocoautla</p>
          </div>
        </div>
        
        {/* Sistema de Pestañas y Botones de Acción */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white/60 backdrop-blur-md border border-slate-200 p-1.5 rounded-xl flex gap-1 w-full sm:w-auto shadow-sm">
            <button
              onClick={() => setActiveTab('places')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'places' 
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Database size={16} />
              <span>Lugares</span>
            </button>
            <button
              onClick={() => setActiveTab('galleries')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'galleries' 
                  ? 'bg-white text-sky-700 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <Images size={16} />
              <span>Galerías</span>
            </button>
          </div>

          {activeTab === 'places' && (
            <Link href="/crear" className="bg-sky-600 hover:bg-sky-700 text-white shadow-md transition-all flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold w-full sm:w-auto">
              <Plus size={20} />
              <span>Añadir Lugar</span>
            </Link>
          )}
        </div>
      </div>

      {/* =========================================
          CONTENIDO DE LA PESTAÑA: LUGARES
          ========================================= */}
      {activeTab === 'places' && (
        <>
          {placesLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="animate-spin mb-4 text-sky-500" size={40} />
              <p className="text-lg font-medium">Cargando registros...</p>
            </div>
          )}

          {placesError && (
            <div className="bg-white/80 backdrop-blur-md border border-red-200 text-red-600 rounded-3xl p-6 text-center shadow-lg">
              <p className="font-semibold text-lg">Error al cargar los datos.</p>
              <p className="text-sm mt-1">Por favor, comprueba tu conexión a la base de datos.</p>
            </div>
          )}

          {!placesLoading && places && places.length === 0 && (
            <div className="bg-white/60 backdrop-blur-md border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center py-24 text-slate-500 shadow-sm">
              <Database size={64} className="mb-6 opacity-30 text-sky-500" />
              <h3 className="text-xl font-semibold text-slate-800">No hay registros aún</h3>
              <p className="mt-2 text-sm">Comienza añadiendo el primer lugar al directorio.</p>
            </div>
          )}

          {!placesLoading && places && places.length > 0 && (
            <div className="space-y-12 tex-white-500">
              {Object.entries(CATEGORY_NAMES).map(([catId, catName]) => {
                const currentPlaces = groupedPlaces[catId];
                if (!currentPlaces || currentPlaces.length === 0) return null; 

                return (
                  <div key={catId} className="animate-fade-in">
                   <div className="flex items-center gap-3 mb-6">
                    {/* text-white hace que el título resalte perfectamente */}
                    <h2 className="text-xl font-black text-white m-0 uppercase tracking-wide">
                      {catName}
                    </h2>
                    <span className="bg-white/80 border border-white/60 text-slate-800 text-sm font-bold px-3 py-1 rounded-full shadow-sm">
                      {currentPlaces.length}
                    </span>
                    {/* bg-white/30 hace que la línea divisoria sea sutil y visible sobre el fondo gris */}
                    <div className="flex-grow h-px bg-white/30 ml-4"></div>
                  </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentPlaces.map((place) => (
                        <div 
                          key={place.id} 
                          className="group bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 hover:bg-white transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                        >
                          <div className="flex-grow">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
                              {place.name}
                            </h3>
                            <div className="flex items-start text-sm text-slate-500 mt-2">
                              <MapPin size={16} className="mr-1.5 flex-shrink-0 mt-0.5 text-sky-500" />
                              <span className="line-clamp-2">{place.address}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                            <Link 
                              href={`/${place.id}`} 
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 hover:border-sky-600 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm"
                            >
                              <Edit2 size={16} strokeWidth={2.5} />
                              <span>Editar</span>
                            </Link>
                            
                            <button 
                              onClick={() => setPlaceToDelete(place.id)} 
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 py-2.5 px-5 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm"
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================
          CONTENIDO DE LA PESTAÑA: GALERÍAS
          ========================================= */}
      {activeTab === 'galleries' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulario de creación de galería */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 lg:sticky lg:top-28">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Crear Nueva Galería</h2>
            
            <form onSubmit={handleGallerySubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de la Galería</label>
                <input
                  type="text"
                  placeholder="Ej. Carnaval Zoque Coiteco 2024"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium shadow-sm"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (galleryError) setGalleryError(''); 
                  }}
                  disabled={isSubmittingGallery}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Fotografías</label>
                
                <ImageUploader 
                  onFilesSelected={handleFilesAdded}
                  disabled={isSubmittingGallery}
                />

                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square shadow-sm">
                        <img src={url} alt="Previa" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute inset-0 bg-red-500/80 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MENSAJE DE ERROR INLINE */}
              {galleryError && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{galleryError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingGallery}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingGallery ? <Loader2 className="animate-spin" size={20} /> : 'Publicar Galería'}
              </button>
            </form>
          </div>

          {/* Listado de galerías creadas */}
          <div className="lg:col-span-7">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 min-h-[400px]">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-between">
                Galerías Publicadas
                <span className="bg-white border border-slate-200 text-slate-600 text-sm px-3 py-1 rounded-full shadow-sm">
                  {galleries?.length || 0}
                </span>
              </h2>

              {galleriesLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <Loader2 className="animate-spin mb-4 text-sky-500" size={40} />
                  <p>Cargando galerías...</p>
                </div>
              )}

              {galleriesError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-center text-sm font-semibold">
                  Error al cargar las galerías.
                </div>
              )}

              {!galleriesLoading && galleries && galleries.length === 0 && (
                <div className="border border-dashed border-slate-300 bg-white/50 rounded-2xl flex flex-col items-center justify-center py-16 text-slate-500">
                  <ImageIcon size={54} className="mb-3 opacity-30 text-sky-500" />
                  <h3 className="text-lg font-semibold text-slate-800">Aún no hay galerías</h3>
                  <p className="text-sm mt-1">Usa el formulario para crear tu primera colección.</p>
                </div>
              )}

              {!galleriesLoading && galleries && galleries.length > 0 && (
                <div className="space-y-4">
                  {galleries.map(gallery => (
                    <div key={gallery.id} className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-sky-300 hover:shadow-md transition-all flex gap-4">
                      <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
                        {gallery.images.length > 0 ? (
                          <img src={gallery.images[0]} alt={gallery.title} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="absolute inset-0 m-auto text-slate-400" size={24} />
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {gallery.images.length} fotos
                        </div>
                      </div>

                      <div className="flex flex-col flex-grow justify-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{gallery.title}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-3">
                          Subida el {new Date(gallery.created_at).toLocaleDateString('es-MX')}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenEdit(gallery)}
                            className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Edit3 size={14} /> Editar
                          </button>
                          
                          <button 
                            onClick={() => setGalleryToDelete(gallery.id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL DE EDICIÓN DE GALERÍA
          ========================================= */}
      <Modal
        isOpen={!!editingGalleryId}
        onClose={handleCloseEdit}
        maxWidth="max-w-2xl"
      >
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto text-slate-900 bg-white/95 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <h3 className="text-2xl font-black text-slate-900">Editar Galería</h3>
            <button 
              onClick={handleCloseEdit}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Título de la Colección</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => {
                  setEditTitle(e.target.value);
                  if (editError) setEditError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fotografías actuales ({editImages.length})
              </label>
              <p className="text-xs text-slate-500 mb-3">Haz clic en la "X" roja para eliminar una foto existente.</p>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {editImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={imgUrl} alt="Foto actual" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 backdrop-blur-md text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Eliminar foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {editImages.length === 0 && (
                  <div className="col-span-full py-6 text-center text-xs text-slate-500 italic">
                    Has quitado todas las fotos actuales. Sube nuevas abajo.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Añadir más fotografías</label>
              <ImageUploader 
                onFilesSelected={handleNewFilesSelected}
                disabled={isSubmittingEdit}
                label="Arrastra más fotos aquí"
              />

              {newPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Nuevas a subir:</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {newPreviewUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square shadow-sm">
                        <img src={url} alt="Nueva previa" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(idx)}
                          className="absolute inset-0 bg-red-500/80 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* MENSAJE DE ERROR INLINE PARA EDICIÓN */}
            {editError && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSubmittingEdit}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingEdit ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                <span>{isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* =========================================
          MODAL DE ELIMINACIÓN DE LUGARES
          ========================================= */}
      {placeToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border-8 border-red-100">
              <AlertTriangle size={36} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Esta acción no se puede deshacer. El lugar y toda su información serán eliminados permanentemente.
            </p>
            
            <div className="flex flex-col-reverse sm:flex-row w-full gap-3">
              <button
                onClick={() => setPlaceToDelete(null)}
                disabled={isDeletingPlace}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePlace}
                disabled={isDeletingPlace}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-md"
              >
                {isDeletingPlace ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                <span>{isDeletingPlace ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL DE ELIMINACIÓN DE GALERÍAS
          ========================================= */}
      {galleryToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-100">
              <AlertTriangle size={32} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 mb-2">¿Eliminar Galería?</h3>
            <p className="text-slate-500 text-sm mb-8">
              Esta acción no se puede deshacer y se borrará la galería permanentemente.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setGalleryToDelete(null)}
                disabled={isDeletingGallery}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteGallery}
                disabled={isDeletingGallery}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
              >
                {isDeletingGallery ? <Loader2 className="animate-spin" size={18} /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}