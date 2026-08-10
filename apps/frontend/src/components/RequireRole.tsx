"use client";

import { useAuth } from "@/context/AuthContext";

export function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <p className="p-6">Akses ditolak — khusus untuk: {roles.join(", ")}</p>;
  }

  return <>{children}</>;
}
