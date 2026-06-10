import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Dashboard novo usa PUBLISHABLE_KEY; manter suporte ao nome antigo ANON_KEY
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
         ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) throw new Error(
  "Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local"
);

export const supabase = createClient(url, key);
