"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Assessment {
  id: string;
  title: string;
}

interface ParticipantResult {
  user_id: string;
  email: string;
  full_name: string;
  status: string;
  score?: number;
  passed?: boolean;
  submitted_at?: string;
}

interface Report {
  assessment_id: string;
  summary: {
    total_participants: number;
    submitted_count: number;
    average_score: number;
    pass_count: number;
    pass_rate: number;
  };
  ranking: ParticipantResult[];
}

function statusLabel(status: string) {
  if (status === "submitted") return "Sudah submit";
  if (status === "in_progress") return "Sedang mengerjakan";
  return "Belum mulai";
}

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    apiFetch("/assessments")
      .then((res) => res.json())
      .then(setAssessments);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setReport(null);
      return;
    }
    setLoadingReport(true);
    apiFetch(`/assessments/${selectedId}/report`)
      .then((res) => res.json())
      .then(setReport)
      .finally(() => setLoadingReport(false));
  }, [selectedId]);

  return (
    <div>
      <h1
        className="text-xl font-semibold mb-5"
        style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
      >
        Reporting
      </h1>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm mb-6"
        style={{ borderColor: "#D8DAE0", color: "#14182B" }}
      >
        <option value="">Pilih assessment...</option>
        {assessments.map((a) => (
          <option key={a.id} value={a.id}>
            {a.title}
          </option>
        ))}
      </select>

      {loadingReport && <p style={{ color: "#8A8D97" }}>Loading report...</p>}

      {report && !loadingReport && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="text-xs" style={{ color: "#8A8D97" }}>
                Total Peserta
              </div>
              <div
                className="text-2xl mt-1"
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  color: "#14182B",
                }}
              >
                {report.summary.total_participants}
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="text-xs" style={{ color: "#8A8D97" }}>
                Sudah Submit
              </div>
              <div
                className="text-2xl mt-1"
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  color: "#14182B",
                }}
              >
                {report.summary.submitted_count}
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="text-xs" style={{ color: "#8A8D97" }}>
                Rata-rata Nilai
              </div>
              <div
                className="text-2xl mt-1"
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  color: "#2F5D9C",
                }}
              >
                {report.summary.average_score.toFixed(1)}
              </div>
            </div>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
            >
              <div className="text-xs" style={{ color: "#8A8D97" }}>
                Tingkat Kelulusan
              </div>
              <div
                className="text-2xl mt-1"
                style={{
                  fontFamily: "var(--font-plex-mono)",
                  color: "#2E7D5B",
                }}
              >
                {report.summary.pass_rate.toFixed(1)}%
              </div>
            </div>
          </div>

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
                    Peringkat
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
                    Email
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
                    Nilai
                  </th>
                  <th
                    className="p-3 text-xs font-medium"
                    style={{ color: "#5B5F6B" }}
                  >
                    Lulus
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.ranking.map((r, i) => (
                  <tr
                    key={r.user_id}
                    className="border-b"
                    style={{ borderColor: "#E2E4E9" }}
                  >
                    <td
                      className="p-3 text-sm"
                      style={{
                        fontFamily: "var(--font-plex-mono)",
                        color: "#8A8D97",
                      }}
                    >
                      {r.status === "submitted" ? i + 1 : "—"}
                    </td>
                    <td className="p-3 text-sm" style={{ color: "#14182B" }}>
                      {r.full_name}
                    </td>
                    <td className="p-3 text-sm" style={{ color: "#8A8D97" }}>
                      {r.email}
                    </td>
                    <td className="p-3 text-sm" style={{ color: "#8A8D97" }}>
                      {statusLabel(r.status)}
                    </td>
                    <td
                      className="p-3 text-sm"
                      style={{
                        fontFamily: "var(--font-plex-mono)",
                        color: "#14182B",
                      }}
                    >
                      {r.score !== undefined ? r.score.toFixed(1) : "—"}
                    </td>
                    <td className="p-3 text-sm">
                      {r.passed === undefined ? (
                        "—"
                      ) : (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs"
                          style={
                            r.passed
                              ? { backgroundColor: "#E4F1EA", color: "#2E7D5B" }
                              : { backgroundColor: "#F1E4E4", color: "#B23A3A" }
                          }
                        >
                          {r.passed ? "Lulus" : "Tidak lulus"}
                        </span>
                      )}
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
