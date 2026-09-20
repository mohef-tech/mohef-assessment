"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  created_at: string;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceFilter, setResourceFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch("/audit-logs?limit=100")
      .then((res) => res.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const resources = Array.from(new Set(logs.map((l) => l.resource))).sort();
  const filtered = resourceFilter
    ? logs.filter((l) => l.resource === resourceFilter)
    : logs;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#14182B" }}
        >
          Audit Log
        </h1>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "#D8DAE0", color: "#14182B" }}
        >
          <option value="">Semua resource</option>
          {resources.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#8A8D97" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#8A8D97" }}>Belum ada aktivitas tercatat.</p>
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
                  Waktu
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Aksi
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Resource
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  Resource ID
                </th>
                <th
                  className="p-3 text-xs font-medium"
                  style={{ color: "#5B5F6B" }}
                >
                  User
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
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
                    {formatTimestamp(log.created_at)}
                  </td>
                  <td className="p-3 text-sm" style={{ color: "#14182B" }}>
                    {log.action}
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: "#F5F6F8", color: "#5B5F6B" }}
                    >
                      {log.resource}
                    </span>
                  </td>
                  <td
                    className="p-3 text-xs"
                    style={{
                      fontFamily: "var(--font-plex-mono)",
                      color: "#8A8D97",
                    }}
                  >
                    {log.resource_id ?? "—"}
                  </td>
                  <td
                    className="p-3 text-xs"
                    style={{
                      fontFamily: "var(--font-plex-mono)",
                      color: "#8A8D97",
                    }}
                  >
                    {log.user_id ?? "anonim"}
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
