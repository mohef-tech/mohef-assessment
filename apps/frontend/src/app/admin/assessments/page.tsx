"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Bank {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  title: string;
  question_bank_id: string;
  question_count: number;
  duration_minutes: number;
  passing_grade: number;
  start_time: string;
  end_time: string;
  status: "draft" | "published";
}

function formatDateTime(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function AssessmentForm({
  banks,
  onDone,
}: {
  banks: Bank[];
  onDone: (createdId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [bankId, setBankId] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingGrade, setPassingGrade] = useState(70);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBankChange(id: string) {
    setBankId(id);
    setAvailableCount(null);
    if (!id) return;
    const res = await apiFetch(`/question-banks/${id}/questions`);
    if (res.ok) {
      const questions = await res.json();
      setAvailableCount(Array.isArray(questions) ? questions.length : null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!bankId) {
      setError("Pilih bank soal terlebih dahulu");
      return;
    }
    if (availableCount !== null && questionCount > availableCount) {
      setError(
        `Jumlah soal (${questionCount}) melebihi soal tersedia di bank ini (${availableCount})`,
      );
      return;
    }
    if (!startTime || !endTime) {
      setError("Waktu mulai dan selesai wajib diisi");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError("Waktu mulai harus sebelum waktu selesai");
      return;
    }

    setSaving(true);
    const res = await apiFetch("/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        question_bank_id: bankId,
        question_count: Number(questionCount),
        duration_minutes: Number(durationMinutes),
        passing_grade: Number(passingGrade),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const created: Assessment = await res.json();
      onDone(created.id);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Gagal membuat assessment");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border p-4 space-y-3"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul assessment"
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      />

      <select
        value={bankId}
        onChange={(e) => handleBankChange(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      >
        <option value="">Pilih bank soal</option>
        {banks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {availableCount !== null && (
        <p className="text-xs" style={{ color: "#8A8D97" }}>
          Tersedia {availableCount} soal di bank ini
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs" style={{ color: "#5B5F6B" }}>
            Jumlah soal
          </label>
          <input
            type="number"
            min={1}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
            style={{
              borderColor: "#D8DAE0",
              fontFamily: "var(--font-plex-mono)",
            }}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: "#5B5F6B" }}>
            Durasi (menit)
          </label>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
            style={{
              borderColor: "#D8DAE0",
              fontFamily: "var(--font-plex-mono)",
            }}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: "#5B5F6B" }}>
            Passing grade
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={passingGrade}
            onChange={(e) => setPassingGrade(Number(e.target.value))}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
            style={{
              borderColor: "#D8DAE0",
              fontFamily: "var(--font-plex-mono)",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs" style={{ color: "#5B5F6B" }}>
            Mulai
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
            style={{
              borderColor: "#D8DAE0",
              fontFamily: "var(--font-plex-mono)",
            }}
          />
        </div>
        <div>
          <label className="text-xs" style={{ color: "#5B5F6B" }}>
            Selesai
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
            style={{
              borderColor: "#D8DAE0",
              fontFamily: "var(--font-plex-mono)",
            }}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#B23A3A" }}>
          {error}
        </p>
      )}

      <p className="text-xs" style={{ color: "#8A8D97" }}>
        Assessment dibuat sebagai draft. Assign peserta dan publish dilakukan di
        halaman detail.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
      >
        {saving ? "Menyimpan..." : "Buat Assessment"}
      </button>
    </form>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const [assessmentsRes, banksRes] = await Promise.all([
      apiFetch("/assessments"),
      apiFetch("/question-banks"),
    ]);
    if (assessmentsRes.ok) setAssessments(await assessmentsRes.json());
    if (banksRes.ok) setBanks(await banksRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function bankName(id: string) {
    return banks.find((b) => b.id === id)?.name ?? "-";
  }

  function handleCreated(createdId: string) {
    setShowForm(false);
    router.push(`/admin/assessments/${createdId}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
        >
          Assessment Management
        </h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#2F5D9C", color: "#FFFFFF" }}
        >
          {showForm ? "Batal" : "+ Assessment Baru"}
        </button>
      </div>

      {showForm && <AssessmentForm banks={banks} onDone={handleCreated} />}

      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : assessments.length === 0 ? (
        <p style={{ color: "#8A8D97" }}>Belum ada assessment.</p>
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
                  Judul
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Bank Soal
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Jadwal
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Passing Grade
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
              {assessments.map((a) => (
                <tr
                  key={a.id}
                  className="border-b"
                  style={{ borderColor: "#E2E4E9" }}
                >
                  <td className="p-3 text-sm" style={{ color: "#14182B" }}>
                    {a.title}
                  </td>
                  <td className="p-3 text-sm" style={{ color: "#5B5F6B" }}>
                    {bankName(a.question_bank_id)}
                  </td>
                  <td
                    className="p-3 text-xs"
                    style={{
                      color: "#8A8D97",
                      fontFamily: "var(--font-plex-mono)",
                    }}
                  >
                    {formatDateTime(a.start_time)} &rarr;{" "}
                    {formatDateTime(a.end_time)}
                  </td>
                  <td
                    className="p-3 text-sm"
                    style={{
                      color: "#14182B",
                      fontFamily: "var(--font-plex-mono)",
                    }}
                  >
                    {a.passing_grade}
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={
                        a.status === "published"
                          ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
                          : { backgroundColor: "#FBF1E6", color: "#C97A2B" }
                      }
                    >
                      {a.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <Link
                      href={`/admin/assessments/${a.id}`}
                      className="text-sm font-medium"
                      style={{ color: "#2F5D9C" }}
                    >
                      Kelola
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
