import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "Your url";
const SUPABASE_ANON_KEY = "Your Anon key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
