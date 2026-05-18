"use client";

import { useState } from "react";

interface Fight {
  id: string;
  title: string;
  teamAName: string;
  teamBName: string;
  isOpen: boolean;
  resultA: number | null;
  resultB: number | null;
}

interface Pick {
  fightId: string;
  goalsA: number;
  goalsB: number;
  isCorrect: boolean | null;
  pointsEarned: number | null;
}

interface Props { fights: Fight[]; picks: Pick[]; }
type SaveState = "idle" | "saving" | "saved" | "error";

function FightCard({ fight, pick }: { fight: Fight; pick: Pick | undefined }) {
  const [goalsA, setGoalsA] = useState<string>(pick?.goalsA?.toString() ?? "");
  const [goalsB, setGoalsB] = useState<string>(pick?.goalsB?.toString() ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  const hasResult = fight.resultA !== null && fight.resultB !== null;
  const hasPick = pick !== undefined;

  async function handleSave() {
    const a = parseInt(goalsA, 10);
    const b = parseInt(goalsB, 10);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      setError("Enter valid scores (0 or more) for both teams"); return;
    }
    setSaveState("saving"); setError("");
    const res = await fetch("/api/picks/countries-fight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId: fight.id, goalsA: a, goalsB: b }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setSaveState("error"); }
    else setSaveState("saved");
  }

  // Outcome labels derived from score
  function outcomeLabel(a: number, b: number) {
    if (a > b) return fight.teamAName;
    if (b > a) return fight.teamBName;
    return "Draw";
  }

  const borderClass = pick?.isCorrect === true
    ? "border-emerald-500/50"
    : pick?.isCorrect === false
    ? "border-red-500/30"
    : "border-[var(--card-border)]";

  return (
    <div className={`rounded-xl border bg-[var(--card-bg)] overflow-hidden transition-colors ${borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate pr-2">{fight.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {saveState === "saving" && (
            <svg className="animate-spin w-3.5 h-3.5 text-blue-200/60" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saveState === "saved" && <span className="text-xs text-emerald-500 font-medium">✓ Saved</span>}
          {pick?.pointsEarned != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pick.pointsEarned > 0
                ? "bg-red-600/8 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-[#0f1e3d] text-blue-300/50"
            }`}>{pick.pointsEarned > 0 ? `+${pick.pointsEarned} pts` : "0 pts"}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            fight.isOpen
              ? "bg-green-100 dark:bg-green-500/10 text-blue-400"
              : "bg-slate-100 dark:bg-[#0f1e3d] text-blue-300/50"
          }`}>{fight.isOpen ? "Open" : "Closed"}</span>
        </div>
      </div>

      {/* Score input */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Team A */}
          <div className="flex-1 text-center space-y-1.5">
            <p className="text-xs font-semibold text-blue-300/70 dark:text-slate-200 truncate">{fight.teamAName}</p>
            {fight.isOpen ? (
              <input
                type="number" min="0" max="99"
                value={goalsA}
                onChange={(e) => { setGoalsA(e.target.value); setSaveState("idle"); setError(""); }}
                placeholder="0"
                className="w-full text-center text-2xl font-bold py-3 rounded-xl border bg-slate-50 dark:bg-[#0c1630] border-slate-200 dark:border-blue-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            ) : (
              <div className={`py-3 rounded-xl text-2xl font-bold text-center ${
                hasPick ? "bg-slate-100 dark:bg-[#0c1630] text-slate-900 dark:text-white" : "bg-slate-50 dark:bg-[#0c1630]/80 text-blue-200/60"
              }`}>
                {hasPick ? pick!.goalsA : "–"}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="text-center shrink-0 pt-5">
            <span className="text-blue-200/60 font-bold text-xl">–</span>
            {hasResult && (
              <p className="text-xs text-blue-200/60 mt-1">Result</p>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 text-center space-y-1.5">
            <p className="text-xs font-semibold text-blue-300/70 dark:text-slate-200 truncate">{fight.teamBName}</p>
            {fight.isOpen ? (
              <input
                type="number" min="0" max="99"
                value={goalsB}
                onChange={(e) => { setGoalsB(e.target.value); setSaveState("idle"); setError(""); }}
                placeholder="0"
                className="w-full text-center text-2xl font-bold py-3 rounded-xl border bg-slate-50 dark:bg-[#0c1630] border-slate-200 dark:border-blue-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            ) : (
              <div className={`py-3 rounded-xl text-2xl font-bold text-center ${
                hasPick ? "bg-slate-100 dark:bg-[#0c1630] text-slate-900 dark:text-white" : "bg-slate-50 dark:bg-[#0c1630]/80 text-blue-200/60"
              }`}>
                {hasPick ? pick!.goalsB : "–"}
              </div>
            )}
          </div>
        </div>

        {/* Result row */}
        {hasResult && (
          <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-[#0c1630]/80">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {fight.teamAName} {fight.resultA} – {fight.resultB} {fight.teamBName}
            </span>
            <span className="text-xs text-blue-300/50">({outcomeLabel(fight.resultA!, fight.resultB!)})</span>
          </div>
        )}

        {/* User prediction summary when closed */}
        {!fight.isOpen && hasPick && (
          <div className={`mt-2 text-center text-xs py-1.5 rounded-lg ${
            pick!.isCorrect === true
              ? "bg-red-600/8 text-emerald-600 dark:text-emerald-400"
              : pick!.isCorrect === false
              ? "bg-red-500/10 text-red-500"
              : "text-blue-300/50"
          }`}>
            {pick!.isCorrect === true && "✅ Exact score! +10 pts"}
            {pick!.isCorrect === false && `✗ You predicted ${pick!.goalsA}–${pick!.goalsB}`}
            {pick!.isCorrect === null && `Your prediction: ${pick!.goalsA}–${pick!.goalsB}`}
          </div>
        )}

        {/* Save button */}
        {fight.isOpen && (
          <div className="mt-3 space-y-2">
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saveState === "saving" || goalsA === "" || goalsB === ""}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-colors bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-[#0f1e3d] disabled:text-blue-200/60 disabled:cursor-not-allowed text-white"
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Prediction saved" : "Save prediction"}
            </button>
            <p className="text-center text-xs text-blue-200/60">
              +10 pts for exact score · You can change until the fight closes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CountriesFightGrid({ fights, picks }: Props) {
  const open = fights.filter((f) => f.isOpen);
  const closed = fights.filter((f) => !f.isOpen);

  return (
    <div className="space-y-8">
      {open.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-blue-300/50 dark:text-blue-200/60 uppercase tracking-wider">Open for betting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {open.map((fight) => (
              <FightCard key={fight.id} fight={fight} pick={picks.find((p) => p.fightId === fight.id)} />
            ))}
          </div>
        </div>
      )}
      {closed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-blue-300/50 dark:text-blue-200/60 uppercase tracking-wider">Closed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {closed.map((fight) => (
              <FightCard key={fight.id} fight={fight} pick={picks.find((p) => p.fightId === fight.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
