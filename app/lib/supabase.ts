import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
export const SUPABASE_KEY_VAR = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export type SupabaseConfig =
  | { kind: "missing"; settings: string[] }
  | { kind: "ready"; url: string; key: string };

function isUsable(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  // An unfilled template value like "<your-key>" or "[project]" is not a setting.
  if (trimmed.includes("[") || trimmed.includes("]")) return false;
  if (trimmed.startsWith("<") || trimmed.endsWith(">")) return false;
  return true;
}

export function readSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const settings: string[] = [];
  if (!isUsable(url)) settings.push(SUPABASE_URL_VAR);
  if (!isUsable(key)) settings.push(SUPABASE_KEY_VAR);

  if (settings.length > 0 || !url || !key) {
    return { kind: "missing", settings };
  }

  return { kind: "ready", url: url.trim(), key: key.trim() };
}

let client: SupabaseClient | null = null;

export function getSupabase(url: string, key: string): SupabaseClient {
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
