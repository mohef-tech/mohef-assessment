"use client";

import { useEffect, useState } from "react";
import { RequireRole } from "@/components/RequireRole";
import { apiFetch } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

function UserRow({ user, onChanged }: { user: User; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [busy, setBusy] = useState(false);

  async function handleUpdate() {
    setBusy(true);
    await apiFetch(`/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName }),
    });
    setBusy(false);
    setEditing(false);
    onChanged();
  }

  async function handleToggleActive() {
    setBusy(true);
    await apiFetch(
      `/users/${user.id}/${user.is_active ? "deactivate" : "activate"}`,
      {
        method: "PATCH",
      },
    );
    setBusy(false);
    onChanged();
  }

  async function handleResetPassword() {
    const newPassword = prompt("Password baru (min 8 karakter):");
    if (!newPassword) return;
    setBusy(true);
    await apiFetch(`/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });
    setBusy(false);
    alert("Password berhasil direset");
  }

  return (
    <tr className="border-b" style={{ borderColor: "#E2E4E9" }}>
      <td className="p-3 text-sm">{user.email}</td>
      <td className="p-3 text-sm">
        {editing ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded px-2 py-1"
            style={{ borderColor: "#D8DAE0" }}
          />
        ) : (
          user.full_name
        )}
      </td>
      <td className="p-3 text-sm">{user.role}</td>
      <td className="p-3 text-sm">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={
            user.is_active
              ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
              : { backgroundColor: "#F1E4E4", color: "#B23A3A" }
          }
        >
          {user.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </td>
      <td className="p-3 text-sm space-x-3">
        {editing ? (
          <>
            <button
              disabled={busy}
              onClick={handleUpdate}
              style={{ color: "#2F5D9C" }}
            >
              Simpan
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ color: "#8A8D97" }}
            >
              Batal
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={{ color: "#2F5D9C" }}>
            Edit
          </button>
        )}
        <button
          disabled={busy}
          onClick={handleToggleActive}
          style={{ color: "#C97A2B" }}
        >
          {user.is_active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button
          disabled={busy}
          onClick={handleResetPassword}
          style={{ color: "#B23A3A" }}
        >
          Reset Password
        </button>
      </td>
    </tr>
  );
}

function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    const res = await apiFetch("/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div>
      <h1
        className="text-xl font-semibold mb-5"
        style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
      >
        User Management
      </h1>
      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "#E2E4E9" }}
        >
          <table className="w-full border-collapse text-left">
            <thead style={{ backgroundColor: "#F5F6F8" }}>
              <tr>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Email
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Nama
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Role
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Status
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} onChanged={loadUsers} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequireRole roles={["administrator"]}>
      <UsersContent />
    </RequireRole>
  );
}
