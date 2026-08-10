"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { apiFetch, setAccessToken } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";
import { decodeAccessToken } from "@/lib/jwt";

interface AuthUser {
  id: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  function applyToken(token: string) {
    setAccessToken(token);
    const payload = decodeAccessToken(token);
    setUser(payload ? { id: payload.sub, role: payload.role } : null);
  }

  useEffect(() => {
    async function trySilentRefresh() {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": getCsrfToken() || "" },
        });
        if (res.ok) {
          const data = await res.json();
          applyToken(data.access_token);
        }
      } catch {
        // belum login, biarkan
      } finally {
        setLoading(false);
      }
    }
    trySilentRefresh();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }
    const data = await res.json();
    applyToken(data.access_token);
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
