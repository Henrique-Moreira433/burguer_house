import { createClient } from '@supabase/supabase-js'

// Essas variáveis buscam os valores que você vai colocar no .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {  auth: {
    // ESTA É A MUDANÇA CRUCIAL:
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined, 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})