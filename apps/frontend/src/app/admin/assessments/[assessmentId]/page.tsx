"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

interface Participant {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface AssignedParticipant {
  id: string;
  assessment_id: string;
  user_id: string;
  email: string;
  full_name: string;
  created_at: string;
}

function toInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// ---------- Form edit (hanya aktif kalau status masih draft) ----------

function EditAssessmentForm({
  assessment,
  banks,
  onSaved,
}: {
  assessment: Assessment;
  banks: Bank[];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(assessment.title);
  const [bankId, setBankId] = useState(assessment.question_bank_id);
  const [questionCount, setQuestionCount] = useState(assessment.question_count);
  const [durationMinutes, setDurationMinutes] = useState(assessment.duration_minutes);
  const [passingGrade, setPassingGrade] = useState(assessment.passing_grade);
  const [startTime, setStartTime] = useState(toInputValue(assessment.start_time));
  const [endTime, setEndTime] = useState(toInputValue(assessment.end_time));
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/question-banks/${bankId}/questions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((qs) => setAvailableCount(Array.isArray(qs) ? qs.length : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (availableCount !== null && questionCount > availableCount) {
      setError(
        `Jumlah soal (${questionCount}) melebihi soal tersedia di bank ini (${availableCount})`,
      );
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError("Waktu mulai harus sebelum waktu selesai");
      return;
    }

    setSaving(true);
    const res = await apiFetch(`/assessments/${assessment.id}`, {
      method: "PUT",
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
      onSaved();
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Gagal menyimpan perubahan");
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
        onChange={(e) => setBankId(e.target.value)}
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      >
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
            style={{ borderColor: "#D8DAE0", fontFamily: "var(--font-plex-mono)" }}
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
            style={{ borderColor: "#D8DAE0", fontFamily: "var(--font-plex-mono)" }}
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
            style={{ borderColor: "#D8DAE0", fontFamily: "var(--font-plex-mono)" }}
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
            style={{ borderColor: "#D8DAE0", fontFamily: "var(--font-plex-mono)" }}
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
            style={{ borderColor: "#D8DAE0", fontFamily: "var(--font-plex-mono)" }}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#B23A3A" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
      >
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}

// ---------- Assign peserta ----------

function AssignParticipants({
  assessmentId,
  assignedParticipants,
  onAssigned,
}: {
  assessmentId: string;
  assignedParticipants: AssignedParticipant[];
  onAssigned: () => void;
}) {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const assignedIds = new Set(assignedParticipants.map((p) => p.user_id));

  useEffect(() => {
    apiFetch("/participants")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setAllParticipants(data);
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setSaving(true);
    const res = await apiFetch(`/assessments/${assessmentId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: Array.from(selected) }),
    });
    setSaving(false);
    if (res.ok) {
      setSelected(new Set());
      onAssigned();
    }
  }

  if (loading) return <p style={{ color: "#8A8D97" }}>Loading peserta...</p>;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: "#14182B" }}>
        Assign Peserta
      </p>
      <p className="text-xs mb-3" style={{ color: "#8A8D97" }}>
        Peserta yang sudah ter-assign ditandai dan tidak bisa dilepas dari
        sini.
      </p>

      {allParticipants.length === 0 ? (
        <p className="text-sm" style={{ color: "#8A8D97" }}>
          Belum ada peserta terdaftar.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {allParticipants.map((p) => {
            const isAssigned = assignedIds.has(p.id);
            return (
              <label
                key={p.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: isAssigned ? "#F5F6F8" : "#FFFFFF",
                  border: "1px solid #E2E4E9",
                }}
              >
                <input
                  type="checkbox"
                  checked={isAssigned || selected.has(p.id)}
                  disabled={isAssigned}
                  onChange={() => toggle(p.id)}
                  style={{ accentColor: "#2F5D9C" }}
                />
                <span style={{ color: "#14182B" }}>{p.full_name}</span>
                <span style={{ color: "#8A8D97" }}>{p.email}</span>
                {isAssigned && (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: "#E4F1EA", color: "#2E7D5B" }}
                  >
                    Sudah ditambahkan
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      <button
        onClick={handleAssign}
        disabled={selected.size === 0 || saving}
        className="mt-4 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
        style={{ backgroundColor: "#2F5D9C", color: "#FFFFFF" }}
      >
        {saving
          ? "Menambahkan..."
          : `Assign ${selected.size > 0 ? selected.size : ""} Peserta Terpilih`}
      </button>
    </div>
  );
}

// ---------- Halaman utama ----------

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = use(params);
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [assignedParticipants, setAssignedParticipants] = useState
    AssignedParticipant[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [assessmentRes, banksRes, participantsRes] = await Promise.all([
      apiFetch(`/assessments/${assessmentId}`),
      apiFetch("/question-banks"),
      apiFetch(`/assessments/${assessmentId}/participants`),
    ]);
    if (assessmentRes.ok) setAssessment(await assessmentRes.json());
    if (banksRes.ok) setBanks(await banksRes.json());
    if (participantsRes.ok) setAssignedParticipants(await participantsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  async function handlePublish() {
    setPublishError(null);
    if (assignedParticipants.length === 0) {
      setPublishError("Assign minimal 1 peserta sebelum publish");
      return;
    }
    setPublishing(true);
    const res = await apiFetch(`/assessments/${assessmentId}/publish`, {
      method: "POST",
    });
    setPublishing(false);
    if (res.ok) {
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setPublishError(err.error || err.message || "Gagal publish assessment");
    }
  }

  function bankName(id: string) {
    return banks.find((b) => b.id === id)?.name ?? "-";
  }

  if (loading) return <p style={{ color: "#8A8D97" }}>Loading...</p>;
  if (!assessment) return <p style={{ color: "#B23A3A" }}>Assessment tidak ditemukan.</p>;

  const isDraft = assessment.status === "draft";
  const canPublish = user?.role === "administrator";

  return (
    <div>
      <Link
        href="/admin/assessments"
        className="text-sm"
        style={{ color: "#2F5D9C" }}
      >
        &larr; Kembali ke daftar assessment
      </Link>

      <div className="flex items-start justify-between mt-2 mb-5">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
          >
            {assessment.title}
          </h1>
          <span
            className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs"
            style={
              assessment.status === "published"
                ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
                : { backgroundColor: "#FBF1E6", color: "#C97A2B" }
            }
          >
            {assessment.status === "published" ? "Published" : "Draft"}
          </span>
        </div>

        {isDraft && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#F5F6F8", color: "#14182B" }}
          >
            Edit
          </button>
        )}
      </div>

      {isDraft && editing ? (
        <EditAssessmentForm
          assessment={assessment}
          banks={banks}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      ) : (
        <div
          className="mb-6 rounded-xl border p-4 grid grid-cols-2 gap-y-3 gap-x-6"
          style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
        >
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Bank Soal
            </p>
            <p className="text-sm" style={{ color: "#14182B" }}>
              {bankName(assessment.question_bank_id)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Jumlah Soal
            </p>
            <p
              className="text-sm"
              style={{ color: "#14182B", fontFamily: "var(--font-plex-mono)" }}
            >
              {assessment.question_count}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Durasi
            </p>
            <p
              className="text-sm"
              style={{ color: "#14182B", fontFamily: "var(--font-plex-mono)" }}
            >
              {assessment.duration_minutes} menit
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Passing Grade
            </p>
            <p
              className="text-sm"
              style={{ color: "#14182B", fontFamily: "var(--font-plex-mono)" }}
            >
              {assessment.passing_grade}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Mulai
            </p>
            <p
              className="text-sm"
              style={{ color: "#14182B", fontFamily: "var(--font-plex-mono)" }}
            >
              {new Date(assessment.start_time).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8D97" }}>
              Selesai
            </p>
            <p
              className="text-sm"
              style={{ color: "#14182B", fontFamily: "var(--font-plex-mono)" }}
            >
              {new Date(assessment.end_time).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="mb-6">
          <AssignParticipants
            assessmentId={assessmentId}
            assignedParticipants={assignedParticipants}
            onAssigned={load}
          />
        </div>
      )}

      {!isDraft && (
        <div
          className="mb-6 rounded-xl border p-4"
          style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "#14182B" }}>
            Peserta Ter-assign ({assignedParticipants.length})
          </p>
          <div className="space-y-1.5">
            {assignedParticipants.map((p) => (
              <div key={p.id} className="text-sm" style={{ color: "#5B5F6B" }}>
                {p.full_name} — {p.email}
              </div>
            ))}
          </div>
        </div>
      )}

      {isDraft && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#14182B" }}>
                Publish Assessment
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#8A8D97" }}>
                {assignedParticipants.length} peserta ter-assign. Setelah
                publish, assessment tidak bisa diedit lagi.
                {!canPublish && " Hanya administrator yang bisa publish."}
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={
                !canPublish || publishing || assignedParticipants.length === 0
              }
              className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50 shrink-0 ml-4"
              style={{ backgroundColor: "#2E7D5B", color: "#FFFFFF" }}
            >
              {publishing ? "Mempublish..." : "Publish"}
            </button>
          </div>
          {publishError && (
            <p className="text-xs mt-2" style={{ color: "#B23A3A" }}>
              {publishError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}