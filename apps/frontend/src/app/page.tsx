"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

function RedirectContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "administrator" || user?.role === "operator") {
      router.replace("/admin/users");
    }
    // role "peserta" belum ada landing page-nya — nanti diarahkan ke sini juga
  }, [user, router]);

  return (
    <p className="p-6" style={{ color: "#8A8D97" }}>
      Mengarahkan...
    </p>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <RedirectContent />
    </RequireAuth>
  );
}
