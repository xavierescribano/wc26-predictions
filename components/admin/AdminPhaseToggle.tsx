"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminPhaseToggleProps {
  phaseId: string;
  phaseType: string;
  isOpen: boolean;
}

export function AdminPhaseToggle({ phaseId, phaseType, isOpen }: AdminPhaseToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/phases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phaseType, action: isOpen ? "close" : "open" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update phase");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-red-400 text-xs">{error}</span>}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`
          px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen
            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
          }
        `}
      >
        {loading ? "Saving…" : isOpen ? "Close Phase" : "Open Phase"}
      </button>
    </div>
  );
}
