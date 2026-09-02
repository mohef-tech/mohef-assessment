"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { href: "/admin/users", label: "User" },
  { href: "/admin/question-banks", label: "Question Bank" },
  { href: "/admin/participants", label: "Participant" },
  { href: "/admin/assessments", label: "Assessment" },
  { href: "/admin/reports", label: "Report" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside
      className="w-60 shrink-0 flex flex-col justify-between border-r"
      style={{ borderColor: "#E2E4E9", backgroundColor: "#FFFFFF" }}
    >
      <div>
        <div className="px-5 py-6">
          <span
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: "#14182B",
            }}
          >
            Mohef Assessment
          </span>
        </div>
        <nav className="px-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors"
                style={
                  active
                    ? { backgroundColor: "#2F5D9C", color: "#FFFFFF" }
                    : { color: "#5B5F6B" }
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: active ? "#FFFFFF" : "#D8DAE0" }}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-5 py-5 border-t" style={{ borderColor: "#E2E4E9" }}>
        <p className="text-xs mb-2" style={{ color: "#8A8D97" }}>
          {user?.role}
        </p>
        <button
          onClick={handleLogout}
          className="text-sm font-medium"
          style={{ color: "#B23A3A" }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
