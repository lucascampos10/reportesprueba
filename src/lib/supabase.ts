import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Faltan las variables de entorno de Supabase. Asegurate de configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,       // Save the session in localStorage
            autoRefreshToken: true,     // Automatically renew the token before it expires
            detectSessionInUrl: true,   // Handle magic-link / OAuth callbacks
        }
    }
);
