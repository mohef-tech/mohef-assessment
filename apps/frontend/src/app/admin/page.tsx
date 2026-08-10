"use client";

import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";

export default function AdminPage() {
  return (
    <RequireAuth>
      <RequireRole roles={["administrator"]}>
        <div className="p-6">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p>Halaman ini khusus administrator.</p>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
