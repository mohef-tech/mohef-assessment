"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Participant {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface Credential {
  email: string;
  password: string;
}

interface ImportRow {
  row: number;
  email: string;
  success: boolean;
  password?: string;
  error?: string;
}

// ---------- Kredensial (initial_password hanya muncul sekali) ----------

function CredentialsPanel({
  credentials,
  onClear,
}: {
  credentials: Credential[];
  onClear: () => void;
}) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function handleCopy(idx: number, email: string, password: string) {
    navigator.clipboard.writeText(`${email} / ${password}`).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
  }

  if (credentials.length === 0) return null;

  return (
    <div
      className="mb-6 rounded-xl border p-4"
      style={{ borderColor: "#C97A2B", backgroundColor: "#FBF1E6" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium" style={{ color: "#14182B" }}>
            Password awal peserta
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8D97" }}>
            Password ini hanya ditampilkan sekali. Salin dan sampaikan ke
            peserta sebelum menutup panel ini.
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-xs font-medium shrink-0 ml-3"
          style={{ color: "#5B5F6B" }}
        >
          Tutup semua
        </button>
      </div>
      <div className="space-y-1.5 mt-3">
        {credentials.map((c, idx) => (
          <div
            key={`${c.email}-${idx}`}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "#FFFFFF" }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: "#14182B" }}>{c.email}</span>
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  backgroundColor: "#F5F6F8",
                  color: "#14182B",
                }}
              >
                {c.password}
              </span>
            </div>
            <button
              onClick={() => handleCopy(idx, c.email, c.password)}
              className="text-xs font-medium shrink-0"
              style={{ color: "#2F5D9C" }}
            >
              {copiedIdx === idx ? "Tersalin" : "Salin"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Form tambah manual ----------

function AddParticipantForm({
  onDone,
  onCreated,
}: {
  onDone: () => void;
  onCreated: (credential: Credential) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await apiFetch("/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: fullName }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      onCreated({
        email: data.participant.email,
        password: data.initial_password,
      });
      setEmail("");
      setFullName("");
      onDone();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Gagal menambahkan peserta");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border p-4 space-y-3"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email peserta"
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      />
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Nama lengkap"
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      />
      {error && (
        <p className="text-xs" style={{ color: "#B23A3A" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-4 py-2 text-sm"
          style={{ color: "#5B5F6B" }}
        >
          Batal
        </button>
      </div>
    </form>
  );
}

// ---------- Import CSV ----------

function ImportCsvPanel({
  onDone,
  onImported,
}: {
  onDone: () => void;
  onImported: (credentials: Credential[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch("/participants/import", {
      method: "POST",
      body: formData,
    });
    setImporting(false);
    if (res.ok) {
      const data: ImportRow[] = await res.json();
      setResults(data);
      const credentials = data
        .filter((r) => r.success && r.password)
        .map((r) => ({ email: r.email, password: r.password as string }));
      if (credentials.length > 0) onImported(credentials);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Gagal mengimpor CSV");
    }
  }

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failCount = results ? results.length - successCount : 0;

  return (
    <div
      className="mb-6 rounded-xl border p-4"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      {!results ? (
        <>
          <p className="text-sm mb-1" style={{ color: "#14182B" }}>
            Import peserta dari CSV
          </p>
          <p className="text-xs mb-3" style={{ color: "#8A8D97" }}>
            Kolom yang dibutuhkan: <code>email</code>, <code>full_name</code>.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#F5F6F8", color: "#14182B" }}
            >
              Pilih file
            </button>
            <span className="text-sm" style={{ color: "#5B5F6B" }}>
              {fileName ?? "Belum ada file dipilih"}
            </span>
          </div>
          {error && (
            <p className="text-xs mt-3" style={{ color: "#B23A3A" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              disabled={!fileName || importing}
              onClick={handleImport}
              className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
            >
              {importing ? "Mengimpor..." : "Import"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-full px-4 py-2 text-sm"
              style={{ color: "#5B5F6B" }}
            >
              Batal
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm" style={{ color: "#14182B" }}>
              Hasil import —{" "}
              <span style={{ color: "#2E7D5B" }}>{successCount} berhasil</span>
              {failCount > 0 && (
                <>
                  {", "}
                  <span style={{ color: "#B23A3A" }}>{failCount} gagal</span>
                </>
              )}
            </p>
            <button
              onClick={() => {
                setResults(null);
                setFileName(null);
                onDone();
              }}
              className="text-xs font-medium"
              style={{ color: "#5B5F6B" }}
            >
              Tutup
            </button>
          </div>
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "#E2E4E9" }}
          >
            <table className="w-full border-collapse text-left">
              <thead style={{ backgroundColor: "#F5F6F8" }}>
                <tr>
                  <th
                    className="p-2 text-xs font-medium"
                    style={{ color: "#5B5F6B" }}
                  >
                    Baris
                  </th>
                  <th
                    className="p-2 text-xs font-medium"
                    style={{ color: "#5B5F6B" }}
                  >
                    Email
                  </th>
                  <th
                    className="p-2 text-xs font-medium"
                    style={{ color: "#5B5F6B" }}
                  >
                    Status
                  </th>
                  <th
                    className="p-2 text-xs font-medium"
                    style={{ color: "#5B5F6B" }}
                  >
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.row}
                    className="border-t text-xs"
                    style={{ borderColor: "#E2E4E9" }}
                  >
                    <td
                      className="p-2"
                      style={{
                        fontFamily: "var(--font-plex-mono)",
                        color: "#8A8D97",
                      }}
                    >
                      {r.row}
                    </td>
                    <td className="p-2" style={{ color: "#14182B" }}>
                      {r.email}
                    </td>
                    <td className="p-2">
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={
                          r.success
                            ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
                            : { backgroundColor: "#F1E4E4", color: "#B23A3A" }
                        }
                      >
                        {r.success ? "Berhasil" : "Gagal"}
                      </span>
                    </td>
                    <td className="p-2" style={{ color: "#8A8D97" }}>
                      {r.success ? "Password tersedia di panel atas" : r.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Baris tabel peserta ----------

function ParticipantRow({
  participant,
  onChanged,
}: {
  participant: Participant;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(participant.full_name);
  const [busy, setBusy] = useState(false);

  async function handleUpdate() {
    setBusy(true);
    await apiFetch(`/participants/${participant.id}`, {
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
      `/participants/${participant.id}/${participant.is_active ? "deactivate" : "activate"}`,
      { method: "PATCH" },
    );
    setBusy(false);
    onChanged();
  }

  return (
    <tr className="border-b" style={{ borderColor: "#E2E4E9" }}>
      <td className="p-3 text-sm">{participant.email}</td>
      <td className="p-3 text-sm">
        {editing ? (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="border rounded px-2 py-1"
            style={{ borderColor: "#D8DAE0" }}
          />
        ) : (
          participant.full_name
        )}
      </td>
      <td className="p-3 text-sm">
        <span
          className="rounded-full px-2 py-0.5 text-xs"
          style={
            participant.is_active
              ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
              : { backgroundColor: "#F1E4E4", color: "#B23A3A" }
          }
        >
          {participant.is_active ? "Aktif" : "Nonaktif"}
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
          {participant.is_active ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </td>
    </tr>
  );
}

// ---------- Halaman utama ----------

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  async function loadParticipants() {
    setLoading(true);
    const res = await apiFetch("/participants");
    if (res.ok) setParticipants(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  function handleCreated(credential: Credential) {
    setCredentials((prev) => [...prev, credential]);
    loadParticipants();
  }

  function handleImported(newCredentials: Credential[]) {
    setCredentials((prev) => [...prev, ...newCredentials]);
    loadParticipants();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
        >
          Participant Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowImport(false);
              setShowForm((s) => !s);
            }}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#2F5D9C", color: "#FFFFFF" }}
          >
            {showForm ? "Batal" : "+ Peserta Baru"}
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setShowImport((s) => !s);
            }}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#F5F6F8", color: "#14182B" }}
          >
            {showImport ? "Batal" : "Import CSV"}
          </button>
        </div>
      </div>

      <CredentialsPanel
        credentials={credentials}
        onClear={() => setCredentials([])}
      />

      {showForm && (
        <AddParticipantForm
          onDone={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}

      {showImport && (
        <ImportCsvPanel
          onDone={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}

      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : participants.length === 0 ? (
        <p style={{ color: "#8A8D97" }}>Belum ada peserta.</p>
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
              {participants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  onChanged={loadParticipants}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
