import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase 공유 클라이언트 (2026-11-20)
 * - VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 있으면 클라우드 모드
 * - 없으면 앱 전체가 localStorage 데모 모드로 동작합니다.
 * 브라우저에는 anon(public) 키만 넣습니다. service_role 키는 절대 프론트엔드에 넣지 않습니다.
 */
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const supabaseReady = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(url as string, key as string, { auth: { persistSession: true } })
  : null;
