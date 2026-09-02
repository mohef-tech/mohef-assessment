"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Bank {
  id: string;
  name: string;
  description: string;
}

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadBanks() {
    setLoading(true);
    const res = await apiFetch("/question-banks");
    if (res.ok) setBanks(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadBanks();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/question-banks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setDescription("");
      setShowForm(false);
      loadBanks();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
        >
          Question Bank
        </h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#2F5D9C", color: "#FFFFFF" }}
        >
          {showForm ? "Batal" : "+ Bank Baru"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border p-4 space-y-3"
          style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama bank soal"
            required
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#D8DAE0" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi (opsional)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#D8DAE0" }}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : banks.length === 0 ? (
        <p style={{ color: "#8A8D97" }}>Belum ada bank soal.</p>
      ) : (
        <div className="grid gap-3">
          {banks.map((b) => (
            <Link
              key={b.id}
              href={`/admin/question-banks/${b.id}`}
              className="rounded-xl border p-4 block hover:opacity-80 transition-opacity"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="font-medium text-sm" style={{ color: "#14182B" }}>
                {b.name}
              </div>
              {b.description && (
                <div className="text-sm mt-1" style={{ color: "#8A8D97" }}>
                  {b.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
