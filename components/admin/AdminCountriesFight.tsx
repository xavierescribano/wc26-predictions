"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Fight {
  id: string;
  title: string;
  teamAName: string;
  teamBName: string;
  isOpen: boolean;
  resultA: number | null;
  resultB: number | null;
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
  // Per-fight result inputs
  const [resultInputs, setResultInputs] = useState<Record<string, { a: string; b: string }>>({});

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
      setFights((prev) => [data, ...prev]);
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
    if (res.ok) setFights((prev) => prev.map((f) => f.id === fightId ? { ...f, isOpen: !isOpen } : f));
  }

  async function handleResult(fightId: string) {
    const inp = resultInputs[fightId];
    const a = parseInt(inp?.a ?? "", 10);
    const b = parseInt(inp?.b ?? "", 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return;

    const res = await fetch("/api/admin/countries-fight", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId, resultA: a, resultB: b }),
    });
    if (res.ok) {
      setFights((prev) => prev.map((f) => f.id === fightId ? { ...f, resultA: a, resultB: b, isOpen: false } : f));
      router.refresh();
    }
  }

  async function handleDelete(fightId: string) {
    if (!confirm("Delete this fight and all picks? Cannot be undone.")) return;
    const res = await fetch("/api/admin/countries-fight", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId }),
    });
    if (res.ok) setFights((prev) => prev.filter((f) => f.id !== fightId));
  }

  function setInput(fightId: string, side: "a" | "b", value: string) {
    setResultInputs((prev) => ({ ...prev, [fightId]: { ...prev[fightId], [side]: value } }));
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">➕ Create a new fight</h3>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Match title (e.g. Brazil vs Morocco – Group C)" className="input-wc26" />
          <div className="grid grid-cols-2 gap-3">
            <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="Team A name" className="input-wc26" />
            <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="Team B name" className="input-wc26" />
          </div>
        </div>
        {createError && <p className="text-red-500 text-sm">{createError}</p>}
        <button onClick={handleCreate} disabled={creating} className="btn-primary">
          {creating ? "Creating…" : "Create Fight"}
        </button>
      </div>

      {/* Fights list */}
      {fights.length === 0 ? (
        <p className="text-blue-200/60 text-sm text-center py-4">No fights created yet.</p>
      ) : (
        <div className="space-y-3">
          {fights.map((fight) => {
            const inp = resultInputs[fight.id] ?? { a: "", b: "" };
            const hasResult = fight.resultA !== null && fight.resultB !== null;
            return (
              <div key={fight.id} className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{fight.title}</p>
                    <p className="text-blue-300/50 dark:text-blue-200/60 text-xs mt-0.5">
                      {fight.teamAName} vs {fight.teamBName} · {fight._count.picks} pick{fight._count.picks !== 1 ? "s" : ""}
                      {hasResult && (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                          · Result: {fight.teamAName} {fight.resultA}–{fight.resultB} {fight.teamBName}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      fight.isOpen
                        ? "bg-green-100 dark:bg-green-500/10 text-blue-400"
                        : "bg-slate-100 dark:bg-[#0f1e3d] text-blue-300/50"
                    }`}>{fight.isOpen ? "Open" : "Closed"}</span>
                    <button onClick={() => handleDelete(fight.id)}
                      className="text-blue-200/60 hover:text-red-500 transition-colors text-xs px-1.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10">
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Open/close toggle */}
                  {!hasResult && (
                    <button onClick={() => handleToggle(fight.id, fight.isOpen)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        fight.isOpen
                          ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                          : "bg-red-600/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                      }`}>
                      {fight.isOpen ? "Close betting" : "Reopen betting"}
                    </button>
                  )}

                  {/* Set exact result */}
                  {!hasResult && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-300/50 dark:text-blue-200/60 shrink-0">Enter result:</span>
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="0" max="99" value={inp.a}
                          onChange={(e) => setInput(fight.id, "a", e.target.value)}
                          placeholder="0"
                          className="w-14 text-center text-sm font-bold py-1.5 rounded-lg border bg-slate-50 dark:bg-[#0c1630] border-slate-200 dark:border-blue-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <span className="text-blue-200/60 font-bold">–</span>
                        <input type="number" min="0" max="99" value={inp.b}
                          onChange={(e) => setInput(fight.id, "b", e.target.value)}
                          placeholder="0"
                          className="w-14 text-center text-sm font-bold py-1.5 rounded-lg border bg-slate-50 dark:bg-[#0c1630] border-slate-200 dark:border-blue-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={() => handleResult(fight.id)}
                          disabled={inp.a === "" || inp.b === ""}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-[#0f1e3d] disabled:text-blue-200/60 disabled:cursor-not-allowed text-white transition-colors">
                          Set & score
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
