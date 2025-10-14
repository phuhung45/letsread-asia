import { createClient } from "@supabase/supabase-js";

// 👉 Hỗ trợ cả Expo và Next.js
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase environment variables! Hãy thêm EXPO_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY vào .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
