"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/acesso-cozinha");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)] transition-colors hover:bg-white"
    >
      Sair
    </button>
  );
}
