"use client";

import { useState } from "react";

interface Fight {
  id: string;
  title: string;
  teamAName: string;
  teamBName: string;
  isOpen: boolean;
  result: string | null;
}

interface Pick {
  fightId: string;
  prediction: string;
  isCorrect: boolean | null;
  pointsEarned: number | null;
}

interface Props { fights: Fight[]; picks: Pick[]; }

type SaveState = "idle" | "saving" | "saved" | "error";

const OPTION_LABELS: Record<string, string> = { A: "Team A wins", B: "Team B wins", draw: "Draw" };

function FightCard({ fight, pick }: { fight: Fight; pick: Pick | undefined }) {
  const [prediction, setPrediction] = useState<string>(pick?.prediction ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  async function handlePick(value: string) {
    if (!fight.isOpen) return;
    setPrediction(value);
    setSaveState("saving");
    setError("");
    const res = await fetch("/api/picks/countries-fight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fightId: fight.id, prediction: value }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setSaveState("error"); }
    else setSaveState("saved");
  }

  const options = [
    { value: "A", label: fight.teamAName },
    { value: "draw", label: "Draw" },
    { value: "B", label: fight.teamBName },
  ];

  const resultLabel = fight.result
    ? fight.result === "A" ? fight.teamAName
    : fight.result === "B" ? fight.teamBName
    : "Draw"
    : null;

  return (
    <div className={`rounded-xl border overflow-hidden bg-[var(--card-bg)] transition-colors ${
      pick?.isCorrect === true ? "border-emerald-500/40"
      : pick?.isCorrect === false ? "border-red-500/30"
      : "border-[var(--card-border)]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{fight.title}</h3>
        <div className="flex items-center gap-2">
          {saveState === "saving" && (
            <svg className="animate-spin w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saveState === "saved" && <span className="text-xs text-emerald-500">✓ Saved</span>}
          {pick?.pointsEarned != null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pick.pointsEarned > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}>{pick.pointsEarned > 0 ? `+${pick.pointsEarned} pts` : "0 pts"}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            fight.isOpen
              ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-slate-100 dark:bg-slate-700 text-slate-500"
          }`}>
            {fight.isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Match title row */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-center gap-3 text-sm">
        <span className="font-semibold text-slate-900 dark:text-white truncate text-right flex-1">{fight.teamAName}</span>
        <span className="text-slate-400 font-bold text-xs shrink-0">vs</span>
        <span className="font-semibold text-slate-900 dark:text-white truncate text-left flex-1">{fight.teamBName}</span>
      </div>

      {/* Pick buttons */}
      <div className="p-4 grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isPicked = prediction === opt.value;
          const isResult = fight.result === opt.value;
          const isWrongPick = isPicked && fight.result !== null && !isResult;

          return (
            <button
              key={opt.value}
              disabled={!fight.isOpen}
              onClick={() => handlePick(opt.value)}
              className={`py-2.5 px-2 rounded-lg text-xs font-semibold text-center transition-all border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isResult && isPicked
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                  : isResult
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : isWrongPick
                  ? "bg-red-500/10 border-red-500/40 text-red-500"
                  : isPicked
                  ? "bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300"
                  : fight.isOpen
                  ? "bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  : "bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              {opt.label}
              {isPicked && <span className="block text-[10px] opacity-70 mt-0.5">Your pick</span>}
              {isResult && !isPicked && <span className="block text-[10px] opacity-70 mt-0.5">Result</span>}
            </button>
          );
        })}
      </div>

      {/* Result row */}
      {resultLabel && (
        <div className="px-4 pb-3 text-xs text-center text-slate-500 dark:text-slate-400">
          Result: <span className="font-semibold text-slate-700 dark:text-slate-200">{resultLabel}</span>
          {pick?.isCorrect === true && <span className="ml-2 text-emerald-500">✓ Correct!</span>}
          {pick?.isCorrect === false && <span className="ml-2 text-red-400">✗ Wrong</span>}
        </div>
      )}

      {error && <p className="px-4 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function CountriesFightGrid({ fights, picks }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {fights.map((fight) => (
        <FightCard key={fight.id} fight={fight} pick={picks.find((p) => p.fightId === fight.id)} />
      ))}
    </div>
  );
}
