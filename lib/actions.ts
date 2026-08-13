'use server';

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// 1. PRIMERO: Inicializar el cliente de Supabase de manera segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
// FUNCIONES PARA LUGARES (PLACES)
// ------------------------------------------------------------------

export async function getPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching places:', error);
    return [];
  }
  return data;
}

export async function getPlaceById(id: string) {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching place with id ${id}:`, error);
    return null;
  }
  return data;
}

export async function savePlace(data: any) {
  const { data: placeData, error } = await supabase
    .from('places')
    .insert([
      {
        category: data.category,
        name: data.name,
        address: data.address,
        map_url: data.map_url,
        images: data.images || [],
        sections: data.sections || {},
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving place:', error);
    throw new Error('Could not save place.');
  }

  return placeData.id;
}

export async function updatePlace(id: string, data: any) {
  const { error } = await supabase
    .from('places')
    .update({
      name: data.name,
      address: data.address,
      map_url: data.map_url,
      images: data.images,
      sections: data.sections,
    })
    .eq('id', id);

  if (error) {
    console.error(`Error updating place with id ${id}:`, error);
    throw new Error('Could not update place.');
  }
}

export async function deletePlace(id: string) {
  const { error } = await supabase.from('places').delete().eq('id', id);

  if (error) {
    console.error(`Error deleting place with id ${id}:`, error);
    throw new Error('Could not delete place.');
  }
}

// ------------------------------------------------------------------
// FUNCIONES PARA GALERÍAS (GALLERIES)
// ------------------------------------------------------------------

export async function getGalleries() {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }
  return data;
}

export async function saveGallery(title: string, images: string[]) {
  const { data: galleryData, error } = await supabase
    .from('galleries')
    .insert([{ title, images }])
    .select()
    .single();

  if (error) {
    console.error('Error saving gallery:', error);
    throw new Error('Could not save gallery.');
  }
  return galleryData.id;
}

export async function deleteGallery(id: string) {
  const { error } = await supabase.from('galleries').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting gallery with id ${id}:`, error);
    throw new Error('Could not delete gallery.');
  }
}

export async function updateGallery(id: string, data: { title: string; images: string[] }) {
    const { error } = await supabase
        .from('galleries')
        .update({
            title: data.title,
            images: data.images,
        })
        .eq('id', id);

    if (error) {
        console.error(`Error updating gallery with id ${id}:`, error);
        throw new Error('Could not update gallery.');
    }
}

// ------------------------------------------------------------------
// SISTEMA DE ARCHIVOS (UPLOAD A SUPABASE STORAGE)
// ------------------------------------------------------------------

export async function uploadImages(formData: FormData) {
  const files = formData.getAll('files') as File[];
  if (!files.length) return [];

  const paths = [];

  for (const file of files) {
    // Obtenemos la extensión de forma segura sin usar el módulo 'path'
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    const fileName = `${uuidv4()}${extension}`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);
      
    paths.push(publicUrl);
  }

  return paths;
}

// ------------------------------------------------------------------
// INTERFACES Y DICCIONARIOS
// ------------------------------------------------------------------

export interface RouteStep {
  description: string;
  imageUrl: string | null;
}

export interface PlaceSection {
  type: string;
  value: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  category: string;
  map_url?: string;
  images?: string[];
  sections: Record<string, any>;
  created_at: string;
}

export const CATEGORY_NAMES: Record<string, string> = {
  restaurant: 'Restaurantes',
  cafeteria: 'Cafeterías',
  hotel: 'Hoteles',
  medical: 'Servicios Médicos',
  route: 'Rutas', 
  church: 'Iglesias / Templos',
  attraction: 'Atractivos Turísticos'
};

export const CATEGORY_FIELDS: Record<string, string[]> = {
  restaurant: ['Correo electrónico', 'Teléfono', 'Horario de servicios', 'Servicios', 'Página web', 'Facturan', 'Tipo de comida', 'Cafetería y postres', 'Bebidas', 'Espacios e instalaciones', 'Entretenimiento', 'Formas de pago', 'Costos'],
  hotel: ['Correo electrónico', 'Teléfono', 'Horario de recepción', 'Servicios', 'Página web', 'Facturan', 'Formas de pago', 'Costos', 'Número de habitaciones', 'Tipos de habitación', 'Categoría / estrellas'],
  cafeteria: ['Correo electrónico', 'Teléfono', 'Horario de atención', 'Servicios', 'Página web', 'Facturan', 'Formas de pago', 'Costos', 'Especialidades de café', 'Postres', 'Wi-Fi', 'Área de trabajo'],
  medical: ['Correo electrónico', 'Teléfono', 'Horario de atención', 'Especialidad', 'Servicios', 'Página web', 'Facturan', 'Formas de pago', 'Costos / rango', 'Urgencias 24h', 'Seguros médicos', 'Médico responsable'],
  church: ['Denominación / religión', 'Correo electrónico', 'Teléfono', 'Horario de misas', 'Servicios', 'Página web', 'Párroco / líder', 'Capacidad', 'Costos'],
  attraction: ['Costo de entrada', 'Descripción', 'Actividades a realizar'] 
};