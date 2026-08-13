'use server';

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// ----------------.--------------------------------------------------
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