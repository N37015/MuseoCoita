'use client';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { getPlaceById } from '../../lib/actions'; // Asegúrate de la ruta
import PlaceForm from '../components/PlaceForm';
import { Loader2 } from 'lucide-react';
import type { Place } from '../../lib/definitions';

export default function EditPlacePage() {
  const { id } = useParams();
  const placeId = id as string;

  const { data: place, error, isLoading } = useSWR<Place | null>(
    placeId ? `places/${placeId}` : null, 
    () => getPlaceById(placeId)
  );

  // ESTADO DE CARGA (Estilo Dark)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-300">
        <Loader2 className="animate-spin mb-4 text-sky-400" size={44} />
        <p className="font-medium text-lg">Cargando información del registro...</p>
      </div>
    );
  }

  // ESTADO DE ERROR (Estilo Glassmorphism Rojo)
  if (error || !place) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center mt-20 py-12 px-6 text-red-400 font-bold bg-red-900/30 backdrop-blur-md rounded-3xl border border-red-500/20 max-w-xl mx-auto shadow-2xl">
          <p className="text-xl">No se encontró el registro o hubo un error.</p>
        </div>
      </div>
    );
  }

  // Si todo está bien, pasamos los datos al formulario
  return <PlaceForm initialData={place} />;
}