import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zdaweyukywitilkezfrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXdleXVreXdpdGlsa2V6ZnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTY3ODUsImV4cCI6MjA1NDEzMjc4NX0.tbX3mLLygGDbjuzjP6cacxHezXDkzt3TL76L7dkA8F0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
