const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    anonKey: SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export async function supabaseRestRequest(path, options = {}) {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      data: null,
      error: new Error("Supabase environment variables are not configured."),
    };
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      data: null,
      error: new Error(data?.message || "Supabase request failed."),
    };
  }

  return { data, error: null };
}
