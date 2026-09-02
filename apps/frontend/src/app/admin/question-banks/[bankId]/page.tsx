"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Bank {
  id: string;
  name: string;
}

interface Question {
  id: string;
  version_number: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  weight: number;
}

interface Version {
  id: string;
  version_number: number;
  question_text: string;
  options: string[];
  correct_option_index: number;
  weight: number;
  created_at: string;
}

function QuestionForm({
  bankId,
  editing,
  onDone,
}: {
  bankId: string;
  editing: Question | null;
  onDone: () => void;
}) {
  const [text, setText] = useState(editing?.question_text ?? "");
  const [options, setOptions] = useState<string[]>(
    editing?.options ?? ["", ""],
  );
  const [correctIdx, setCorrectIdx] = useState(
    editing?.correct_option_index ?? 0,
  );
  const [weight, setWeight] = useState(editing?.weight ?? 10);
  const [saving, setSaving] = useState(false);

  function updateOption(i: number, value: string) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((opts) => [...opts, ""]);
  }

  function removeOption(i: number) {
    if (options.length <= 2) return;
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
    if (correctIdx >= i && correctIdx > 0) setCorrectIdx((c) => c - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      question_text: text,
      options,
      correct_option_index: correctIdx,
      weight: Number(weight),
    };
    const res = editing
      ? await apiFetch(`/questions/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await apiFetch(`/question-banks/${bankId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
    setSaving(false);
    if (res.ok) onDone();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 space-y-3 mb-6"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Teks soal"
        required
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "#D8DAE0" }}
      />
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={correctIdx === i}
              onChange={() => setCorrectIdx(i)}
              style={{ accentColor: "#2F5D9C" }}
            />
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Opsi ${i + 1}`}
              required
              className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
              style={{ borderColor: "#D8DAE0" }}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-xs"
                style={{ color: "#B23A3A" }}
              >
                Hapus
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-xs font-medium"
          style={{ color: "#2F5D9C" }}
        >
          + Tambah opsi
        </button>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm" style={{ color: "#5B5F6B" }}>
          Bobot nilai
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          required
          className="w-20 rounded-lg border px-3 py-1.5 text-sm"
          style={{
            borderColor: "#D8DAE0",
            fontFamily: "var(--font-plex-mono)",
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: "#14182B", color: "#FFFFFF" }}
        >
          {saving
            ? "Menyimpan..."
            : editing
              ? "Simpan sebagai versi baru"
              : "Tambah Soal"}
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

function VersionHistory({ questionId }: { questionId: string }) {
  const [versions, setVersions] = useState<Version[] | null>(null);

  useEffect(() => {
    apiFetch(`/questions/${questionId}/versions`)
      .then((res) => res.json())
      .then(setVersions);
  }, [questionId]);

  if (!versions)
    return (
      <p className="text-xs" style={{ color: "#8A8D97" }}>
        Loading riwayat...
      </p>
    );

  return (
    <div className="mt-3 space-y-2">
      {versions.map((v) => (
        <div
          key={v.id}
          className="text-xs rounded-lg p-2"
          style={{ backgroundColor: "#F5F6F8" }}
        >
          <span
            style={{ fontFamily: "var(--font-plex-mono)", color: "#2F5D9C" }}
          >
            v{v.version_number}
          </span>{" "}
          <span style={{ color: "#14182B" }}>{v.question_text}</span>
        </div>
      ))}
    </div>
  );
}

export default function BankDetailPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = use(params);
  const [bank, setBank] = useState<Bank | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [historyOpenId, setHistoryOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [banksRes, questionsRes] = await Promise.all([
      apiFetch("/question-banks"),
      apiFetch(`/question-banks/${bankId}/questions`),
    ]);
    if (banksRes.ok) {
      const banks: Bank[] = await banksRes.json();
      setBank(banks.find((b) => b.id === bankId) ?? null);
    }
    if (questionsRes.ok) setQuestions(await questionsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [bankId]);

  function handleFormDone() {
    setShowForm(false);
    setEditing(null);
    load();
  }

  return (
    <div>
      <Link
        href="/admin/question-banks"
        className="text-sm"
        style={{ color: "#2F5D9C" }}
      >
        &larr; Kembali ke daftar bank
      </Link>

      <div className="flex items-center justify-between mt-2 mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
        >
          {bank?.name ?? "Bank Soal"}
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#2F5D9C", color: "#FFFFFF" }}
          >
            + Tambah Soal
          </button>
        )}
      </div>

      {showForm && (
        <QuestionForm
          bankId={bankId}
          editing={editing}
          onDone={handleFormDone}
        />
      )}

      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : questions.length === 0 ? (
        <p style={{ color: "#8A8D97" }}>Belum ada soal di bank ini.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border p-4"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm" style={{ color: "#14182B" }}>
                  {q.question_text}
                </p>
                <span
                  className="text-xs rounded-full px-2 py-0.5 shrink-0 ml-3"
                  style={{
                    backgroundColor: "#F5F6F8",
                    color: "#5B5F6B",
                    fontFamily: "var(--font-plex-mono)",
                  }}
                >
                  v{q.version_number}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-center gap-2"
                    style={{
                      color:
                        i === q.correct_option_index ? "#2E7D5B" : "#8A8D97",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          i === q.correct_option_index ? "#2E7D5B" : "#D8DAE0",
                      }}
                    />
                    {opt}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4 mt-3">
                <span
                  className="text-xs"
                  style={{
                    fontFamily: "var(--font-plex-mono)",
                    color: "#8A8D97",
                  }}
                >
                  bobot {q.weight}
                </span>
                <button
                  onClick={() => {
                    setEditing(q);
                    setShowForm(true);
                  }}
                  className="text-xs font-medium"
                  style={{ color: "#2F5D9C" }}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    setHistoryOpenId(historyOpenId === q.id ? null : q.id)
                  }
                  className="text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  {historyOpenId === q.id
                    ? "Sembunyikan riwayat"
                    : "Riwayat versi"}
                </button>
              </div>
              {historyOpenId === q.id && <VersionHistory questionId={q.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
