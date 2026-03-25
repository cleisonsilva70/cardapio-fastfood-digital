"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDateLabel, formatTimeLabel } from "@/lib/format";
import { LogoutButton } from "@/components/cozinha/logout-button";

function getNow() {
  const now = new Date();

  return {
    date: formatDateLabel(now),
    time: formatTimeLabel(now),
  };
}

export function GlobalDateTime() {
  const pathname = usePathname();
  const [current, setCurrent] = useState(getNow);
  const showLogout = pathname === "/atendimento" || pathname === "/cozinha";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent(getNow());
    }, 1000 * 30);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="inline-flex">
        <div className="flex items-center gap-3 rounded-[18px] border border-white/45 bg-white/88 px-3 py-2 shadow-[0_16px_40px_rgba(35,21,15,0.16)] backdrop-blur md:px-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-strong)] sm:text-[11px]">
            {current.date}
          </p>
          <span className="h-4 w-px bg-[var(--line)]" />
          <p className="text-sm font-black tracking-[0.08em] text-[var(--foreground)] sm:text-base">
            {current.time}
          </p>
        </div>
      </div>
      {showLogout ? <LogoutButton /> : <div />}
    </div>
  );
}
