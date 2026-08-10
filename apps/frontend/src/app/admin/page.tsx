"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
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
    <tr className="border-b">
      <td className="p-2">{user.email}</td>
      <td className="p-2">
        {editing ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border px-2 py-1"
          />
        ) : (
          user.full_name
        )}
      </td>
      <td className="p-2">{user.role}</td>
      <td className="p-2">{user.is_active ? "Aktif" : "Nonaktif"}</td>
      <td className="p-2 space-x-2">
        {editing ? (
          <>
            <button
              disabled={busy}
              onClick={handleUpdate}
              className="text-blue-600"
            >
              Simpan
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-500">
              Batal
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-blue-600">
            Edit
          </button>
        )}
        <button
          disabled={busy}
          onClick={handleToggleActive}
          className="text-orange-600"
        >
          {user.is_active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button
          disabled={busy}
          onClick={handleResetPassword}
          className="text-red-600"
        >
          Reset Password
        </button>
      </td>
    </tr>
  );
}

function AdminContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    setLoading(true);
    const res = await apiFetch("/users");
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Admin Dashboard — User Management
      </h1>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b font-medium">
            <th className="p-2">Email</th>
            <th className="p-2">Nama</th>
            <th className="p-2">Role</th>
            <th className="p-2">Status</th>
            <th className="p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} onChanged={loadUsers} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <RequireRole roles={["administrator"]}>
        <AdminContent />
      </RequireRole>
    </RequireAuth>
  );
}
