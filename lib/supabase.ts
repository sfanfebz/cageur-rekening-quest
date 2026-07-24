const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured() { return Boolean(url && key); }

export async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!url || !key) throw new Error("Supabase belum dikonfigurasi di environment server.");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase request gagal: ${response.status} ${await response.text()}`);
  return response.json() as Promise<T>;
}
