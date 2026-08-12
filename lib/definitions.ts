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

// 1. Diccionario Global de Nombres de Categorías
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
  // NUEVO: Agregamos el Atractivo Turístico
  attraction: ['Costo de entrada', 'Descripción', 'Actividades a realizar'] 
};