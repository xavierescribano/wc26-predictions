"use client";

import { useState } from "react";

interface Team { id: string; name: string; shortCode: string; group: string; flagEmoji: string | null; }

interface Props {
  groupStageOpen: boolean;
  teams: Team[];
  initialPlayerPick: { playerName: string } | null;
  initialTeamPick: { teamId: string; teamName: string; teamFlag: string | null } | null;
  initialGoldenPick: { teamId: string; teamName: string; teamFlag: string | null; changes: number } | null;
}

type Status = "idle" | "saving" | "saved" | "error";

// ── Top Scorer Player ──────────────────────────────────────────────────────

function TopScorerPlayerCard({ groupStageOpen, initial }: { groupStageOpen: boolean; initial: { playerName: string } | null }) {
  const [name, setName] = useState(initial?.playerName ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const locked = initial !== null;

  async function handleSubmit() {
    if (!name.trim()) { setError("Please enter a player name"); return; }
    setStatus("saving"); setError("");
    const res = await fetch("/api/picks/top-scorer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "player", playerName: name }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setStatus("error"); }
    else setStatus("saved");
  }

  return (
    <div className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">🥇 Top Scorer Player</h2>
          <p className="text-xs text-blue-300/50 dark:text-blue-200/60 mt-0.5">+50 pts if correct · Locked once submitted</p>
        </div>
        {locked && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            🔒 Locked
          </span>
        )}
      </div>
      <div className="p-5">
        {locked ? (
          <div className="flex items-center gap-3 py-2">
            <span className="text-2xl">⚽</span>
            <span className="text-slate-900 dark:text-white font-semibold">{initial!.playerName}</span>
            <span className="ml-auto text-xs text-blue-200/60">Your pick is final</span>
          </div>
        ) : groupStageOpen ? (
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setStatus("idle"); setError(""); }}
              placeholder="e.g. Kylian Mbappé"
              className="input-wc26"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSubmit} disabled={status === "saving"}
              className="btn-primary w-full">
              {status === "saving" ? "Saving…" : status === "saved" ? "✅ Submitted!" : "Lock in my pick"}
            </button>
            <p className="text-xs text-blue-200/60 text-center">⚠️ This cannot be changed once submitted</p>
          </div>
        ) : (
          <p className="text-blue-200/60 text-sm italic">Not submitted — Group Stage is closed.</p>
        )}
      </div>
    </div>
  );
}

// ── Top Scorer Team ────────────────────────────────────────────────────────

function TopScorerTeamCard({ groupStageOpen, teams, initial }: { groupStageOpen: boolean; teams: Team[]; initial: { teamId: string; teamName: string; teamFlag: string | null } | null }) {
  const [teamId, setTeamId] = useState(initial?.teamId ?? "");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const locked = initial !== null;

  async function handleSubmit() {
    if (!teamId) { setError("Please select a team"); return; }
    setStatus("saving"); setError("");
    const res = await fetch("/api/picks/top-scorer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "team", teamId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setStatus("error"); }
    else setStatus("saved");
  }

  const selectedTeam = teams.find((t) => t.id === teamId);

  return (
    <div className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">🏆 Top Scoring Team</h2>
          <p className="text-xs text-blue-300/50 dark:text-blue-200/60 mt-0.5">+25 pts if correct · Locked once submitted</p>
        </div>
        {locked && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            🔒 Locked
          </span>
        )}
      </div>
      <div className="p-5">
        {locked ? (
          <div className="flex items-center gap-3 py-2">
            <span className="text-2xl">{initial!.teamFlag ?? "🏳️"}</span>
            <span className="text-slate-900 dark:text-white font-semibold">{initial!.teamName}</span>
            <span className="ml-auto text-xs text-blue-200/60">Your pick is final</span>
          </div>
        ) : groupStageOpen ? (
          <div className="space-y-3">
            <div className="relative">
              {selectedTeam && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">{selectedTeam.flagEmoji}</span>
              )}
              <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setStatus("idle"); setError(""); }}
                className={`input-wc26 ${selectedTeam ? "pl-9" : ""}`}>
                <option value="">Select a team…</option>
                {["A","B","C","D","E","F","G","H","I","J","K","L"].map((g) => (
                  <optgroup key={g} label={`Group ${g}`}>
                    {teams.filter((t) => t.group === g).map((t) => (
                      <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSubmit} disabled={status === "saving"}
              className="btn-primary w-full">
              {status === "saving" ? "Saving…" : status === "saved" ? "✅ Submitted!" : "Lock in my pick"}
            </button>
            <p className="text-xs text-blue-200/60 text-center">⚠️ This cannot be changed once submitted</p>
          </div>
        ) : (
          <p className="text-blue-200/60 text-sm italic">Not submitted — Group Stage is closed.</p>
        )}
      </div>
    </div>
  );
}

// ── Golden Pick ────────────────────────────────────────────────────────────

function GoldenPickCard({ teams, initial }: { teams: Team[]; initial: { teamId: string; teamName: string; teamFlag: string | null; changes: number } | null }) {
  const [teamId, setTeamId] = useState(initial?.teamId ?? "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [currentPick, setCurrentPick] = useState(initial);

  const changes = currentPick?.changes ?? 0;
  const reward = Math.max(0, 50 - changes * 10);
  const nextReward = Math.max(0, 50 - (changes + 1) * 10);
  const isChange = currentPick !== null;
  const selectedTeam = teams.find((t) => t.id === teamId);

  async function doSave() {
    setStatus("saving"); setError(""); setShowConfirm(false);
    const res = await fetch("/api/picks/golden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setStatus("error"); return; }
    const newChanges = isChange ? changes + 1 : 0;
    setCurrentPick({ teamId, teamName: selectedTeam?.name ?? "", teamFlag: selectedTeam?.flagEmoji ?? null, changes: newChanges });
    setStatus("saved");
  }

  function handleSave() {
    if (!teamId) { setError("Please select a team"); return; }
    if (isChange && teamId !== currentPick?.teamId) { setShowConfirm(true); return; }
    doSave();
  }

  return (
    <div className="rounded-xl border bg-[var(--card-bg)] border-[var(--card-border)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">🌟 Golden Pick — World Cup Winner</h2>
          <p className="text-xs text-blue-300/50 dark:text-blue-200/60 mt-0.5">
            Currently worth <span className="text-emerald-500 font-bold">+{reward} pts</span> · Changes cost −10 pts
          </p>
        </div>
        {changes > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
            {changes} change{changes > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {currentPick && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-600/8 border border-emerald-500/20">
            <span className="text-xl">{currentPick.teamFlag ?? "🏳️"}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{currentPick.teamName}</span>
            <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">Current pick</span>
          </div>
        )}

        <div className="relative">
          {selectedTeam && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">{selectedTeam.flagEmoji}</span>
          )}
          <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setStatus("idle"); setError(""); }}
            className={`input-wc26 ${selectedTeam ? "pl-9" : ""}`}>
            <option value="">Select World Cup winner…</option>
            {["A","B","C","D","E","F","G","H","I","J","K","L"].map((g) => (
              <optgroup key={g} label={`Group ${g}`}>
                {teams.filter((t) => t.group === g).map((t) => (
                  <option key={t.id} value={t.id}>{t.flagEmoji} {t.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Confirmation modal */}
        {showConfirm && (
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4 space-y-3">
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">⚠️ Confirm change</p>
            <p className="text-sm text-blue-300/70 dark:text-slate-200">
              Changing your Golden Pick will reduce your potential reward from <strong>+{reward} pts</strong> to <strong>+{nextReward} pts</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={doSave} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-orange-500 hover:bg-orange-400 text-white transition-colors">Yes, change it</button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-slate-200 dark:bg-[#0f1e3d] text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-[#162040] transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {!showConfirm && (
          <button onClick={handleSave} disabled={status === "saving"}
            className="btn-primary w-full">
            {status === "saving" ? "Saving…" : currentPick ? "Update Golden Pick" : "Set Golden Pick"}
          </button>
        )}

        {status === "saved" && !showConfirm && (
          <p className="text-center text-emerald-500 text-sm">✅ Saved! Current reward: +{Math.max(0, 50 - (currentPick?.changes ?? 0) * 10)} pts</p>
        )}

        <p className="text-xs text-blue-200/60 text-center">
          You can change this at any time — but each change costs −10 pts from the potential reward.
        </p>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export function SpecialPicksClient({ groupStageOpen, teams, initialPlayerPick, initialTeamPick, initialGoldenPick }: Props) {
  return (
    <div className="space-y-5">
      <TopScorerPlayerCard groupStageOpen={groupStageOpen} initial={initialPlayerPick} />
      <TopScorerTeamCard groupStageOpen={groupStageOpen} teams={teams} initial={initialTeamPick} />
      <GoldenPickCard teams={teams} initial={initialGoldenPick} />
    </div>
  );
}
