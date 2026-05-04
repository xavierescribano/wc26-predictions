"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Fight {
  id: string;
  title: string;
  teamAName: string;
  teamBName: string;
  isOpen: boolean;
  result: string | null;
  _count: { picks: number };
}

interface Props { fights: Fight[]; }

export function AdminCountriesFight({ fights: initial }: Props) {
  const router = useRouter();
  const [fights, setFights] = useState<Fight[]>(initial);
  const [title, setTitle] = useState("");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function handleCreate() {
    if (!title.trim() || !teamA.trim() || !teamB.trim()) {
      setCreateError("All fields are required"); return;
    }
    setCreating(true); setCreateError("");
    const res = await fetch("/api/admin/countries-fight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, teamAName: teamA, teamBName: teamB }),
    });
    const data = await res.json();
    if (!res.ok) { setCreateError(data.error ?? "Error"); }
    else {
      setFights((prev) => [{ ...data, _count: { picks: 0 } }, ...prev]);
      setTitle(""); setTeamA(""); setTeamB("");
    }
    setCreating(false);
  }

  async function handleToggle(fightId: string, isOpen: boolean) {
    const res = await fetch("/api/admin/countries-fight", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId, isOpen: !isOpen }),
    });
    if (res.ok) {
      setFights((prev) => prev.map((f) => f.id === fightId ? { ...f, isOpen: !isOpen } : f));
    }
  }

  async function handleResult(fightId: string, result: string) {
    const res = await fetch("/api/admin/countries-fight", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId, result }),
    });
    if (res.ok) {
      setFights((prev) => prev.map((f) => f.id === fightId ? { ...f, result, isOpen: false } : f));
      router.refresh();
    }
  }

  async function handleDelete(fightId: string) {
    if (!confirm("Delete this fight and all picks? This cannot be undone.")) return;
    const res = await fetch("/api/admin/countries-fight", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId }),
    });
    if (res.ok) setFights((prev) => prev.filter((f) => f.id !== fightId));
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">➕ Create a new fight</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fight title (e.g. Group A opener)" className="input-wc26 sm:col-span-3" />
          <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="Team A name" className="input-wc26" />
          <div className="flex items-center justify-center text-slate-400 text-sm font-bold">vs</div>
          <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="Team B name" className="input-wc26" />
        </div>
        {createError && <p className="text-red-500 text-sm">{createError}</p>}
        <button onClick={handleCreate} disabled={creating} className="btn-primary">
          {creating ? "Creating…" : "Create Fight"}
        </button>
      </div>

      {/* Fights list */}
      {fights.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">No fights created yet.</p>
      ) : (
        <div className="space-y-3">
          {fights.map((fight) => (
            <div key={fight.id} className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{fight.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    {fight.teamAName} vs {fight.teamBName} · {fight._count.picks} picks
                    {fight.result && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      · Result: {fight.result === "A" ? fight.teamAName : fight.result === "B" ? fight.teamBName : "Draw"}
                    </span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Open/close toggle */}
                  {!fight.result && (
                    <button onClick={() => handleToggle(fight.id, fight.isOpen)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        fight.isOpen
                          ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}>
                      {fight.isOpen ? "Close betting" : "Open betting"}
                    </button>
                  )}

                  {/* Set result */}
                  {!fight.result && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">Result:</span>
                      {[
                        { v: "A", label: fight.teamAName.split(" ")[0] },
                        { v: "draw", label: "Draw" },
                        { v: "B", label: fight.teamBName.split(" ")[0] },
                      ].map((opt) => (
                        <button key={opt.v} onClick={() => handleResult(fight.id, opt.v)}
                          className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-600">
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Delete */}
                  <button onClick={() => handleDelete(fight.id)}
                    className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
