"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

function HomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Mohef Assessment</h1>
      <p>Login sebagai: {user?.role}</p>
      {user?.role === "administrator" && (
        <Link href="/admin" className="text-blue-600 underline">
          Ke Admin Dashboard
        </Link>
      )}
      <button
        onClick={handleLogout}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Logout
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
