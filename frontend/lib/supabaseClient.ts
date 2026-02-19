import { createClient } from '@supabase/supabase-js';

// NOTE: In the real application, these are loaded from secure environment variables.
// For this portfolio sample, we use placeholders.

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
