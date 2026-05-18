"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminResetButton() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        setStep("confirm");
      } else {
        setStep("done");
        router.refresh();
      }
    } catch {
      setError("Network error");
      setStep("confirm");
    }
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg font-semibold transition-colors text-sm"
      >
        🔄 Reset Competition
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="bg-red-950/40 border border-red-600/50 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-red-400 text-sm">This will permanently delete:</p>
            <ul className="text-slate-200 text-sm mt-2 space-y-1 list-disc list-inside">
              <li>All group predictions</li>
              <li>All knockout picks</li>
              <li>All golden picks</li>
              <li>All entered match results</li>
              <li>All group stage results</li>
            </ul>
            <p className="text-blue-200/60 text-sm mt-2">
              Users and teams are <span className="text-white font-semibold">kept</span>. All phases will be closed.
            </p>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors"
          >
            Yes, reset everything
          </button>
          <button
            onClick={() => { setStep("idle"); setError(null); }}
            className="px-4 py-2 bg-[#0f1e3d] hover:bg-[#162040] text-slate-200 rounded-lg font-semibold text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex items-center gap-2 text-blue-200/60 text-sm">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Resetting…
      </div>
    );
  }

  // done
  return (
    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
      ✅ Competition reset. All picks cleared, all phases closed.
      <button
        onClick={() => setStep("idle")}
        className="text-blue-200/60 hover:text-slate-200 underline text-xs ml-1"
      >
        dismiss
      </button>
    </div>
  );
}
