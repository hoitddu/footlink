export type AppDataSource = "demo" | "supabase";

function readConfiguredSource() {
  const configured = process.env.NEXT_PUBLIC_APP_DATA_SOURCE ?? process.env.APP_DATA_SOURCE;
  return configured === "supabase" ? "supabase" : "demo";
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getAppDataSource(): AppDataSource {
  const configured = readConfiguredSource();

  if (configured === "supabase" && isSupabaseConfigured()) {
    return "supabase";
  }

  return "demo";
}

export function isDemoDataSource() {
  return getAppDataSource() === "demo";
}
