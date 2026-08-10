import { getCsrfToken } from "./csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRF-Token": getCsrfToken() || "" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  setAccessToken(data.access_token);
  return data.access_token;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-CSRF-Token": getCsrfToken() || "",
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  return res;
}
