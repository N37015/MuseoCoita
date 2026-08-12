import { createClient } from '@supabase/supabase-js';

// No subas estas claves a tu repositorio de Git.
// Utiliza variables de entorno en su lugar.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
