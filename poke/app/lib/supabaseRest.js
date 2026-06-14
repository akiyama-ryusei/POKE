const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    key: SUPABASE_KEY,
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
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = text && isJson ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      data: null,
      error: new Error(data?.message || text || "Supabase request failed."),
    };
  }

  if (text && !isJson) {
    return {
      data: null,
      error: new Error("Supabase returned a non-JSON response. Check NEXT_PUBLIC_SUPABASE_URL."),
    };
  }

  return { data, error: null };
}
