import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase 설정 여부(.env 누락 시 로그인 비활성). */
export const supabaseConfigured = Boolean(url && anon);

/** RN 용 Supabase 클라이언트. 세션은 AsyncStorage 에 영속. URL 자동 감지는 끔. */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : null;
