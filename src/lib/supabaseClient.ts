import { createClient } from '@supabase/supabase-js';

// Centralized Supabase client configuration
// Reads from environment variables for both local and deployed environments.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://efygepsnvejtyrbhjtpk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeWdlcHNudmVqdHlyYmhqdHBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODM4NTAsImV4cCI6MjA2OTg1OTg1MH0.gQKwCzJu9auOSZgDolHOenWHNiDmO57fmSx4KNfxoio';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are not provided! Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const calculatePrice = (durationHours: number): number => {
  const totalMinutes = Math.round(durationHours * 60);
  if (totalMinutes < 10) return 0; // لا يتم احتساب أي سعر إذا كانت أقل من 10 دقائق
  let price = 0;
  let minutesLeft = totalMinutes;

  // شريحة الساعة (40-60 دقيقة = 25 جنيه)
  while (minutesLeft >= 40) {
    price += 25;
    minutesLeft -= 60;
  }

  // شريحة النصف ساعة (20-30 دقيقة = 15 جنيه)
  if (minutesLeft >= 20 && minutesLeft <= 30) {
    price += 15;
    minutesLeft -= 30;
  }

  // شريحة الربع ساعة (10-15 دقيقة = 10 جنيه)
  if (minutesLeft >= 10 && minutesLeft <= 15) {
    price += 10;
    minutesLeft -= 15;
  }

  // تجاهل الدقائق الأقل من 10 (لا تُحسب)
  return price;
};