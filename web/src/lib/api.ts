export const API = process.env.NEXT_PUBLIC_API || "http://localhost:3001";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }
}

export function getToken() {
  if (token) return token;
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("token");
    if (t) token = t;
  }
  return token;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = getToken();
  const headers: any = { "Content-Type": "application/json", ...(init.headers || {}) };
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const res = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
