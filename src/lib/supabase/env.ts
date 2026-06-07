function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function deriveUrlFromPostgres(connectionString: string) {
  const poolerMatch = connectionString.match(/postgres\.([a-z0-9]+)@/i);
  if (poolerMatch) {
    return `https://${poolerMatch[1]}.supabase.co`;
  }

  const directMatch = connectionString.match(/db\.([a-z0-9]+)\.supabase\.co/i);
  if (directMatch) {
    return `https://${directMatch[1]}.supabase.co`;
  }

  return "";
}

function resolveRawSupabaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.SUPABASE_DATABASE_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (candidate.startsWith("https://")) {
      return normalizeSupabaseUrl(candidate);
    }

    if (
      candidate.startsWith("postgresql://") ||
      candidate.startsWith("postgres://")
    ) {
      const derived = deriveUrlFromPostgres(candidate);
      if (derived) return derived;
    }
  }

  return "";
}

export function getSupabaseUrl() {
  return resolveRawSupabaseUrl();
}

export function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  );
}
