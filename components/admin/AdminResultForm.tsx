"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  flagEmoji: string | null;
}

interface MatchForResult {
  id: string;
  matchNumber: number;
  description: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
}

interface AdminResultFormProps {
  matches: MatchForResult[];
}

export function AdminResultForm({ matches }: AdminResultFormProps) {
  const router = useRouter();
  const [results, setResults] = useState<
    Record<string, { homeScore: string; awayScore: string; winnerId: string; saving: boolean; error: string | null; saved: boolean }>
  >(
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          homeScore: m.homeScore?.toString() ?? "",
          awayScore: m.awayScore?.toString() ?? "",
          winnerId: m.winnerId ?? "",
          saving: false,
          error: null,
          saved: false,
        },
      ])
    )
  );

  function update(matchId: string, field: string, value: string) {
    setResults((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value, error: null, saved: false },
    }));
  }

  async function handleSave(match: MatchForResult) {
    const r = results[match.id];
    if (r.homeScore === "" || r.awayScore === "") {
      setResults((prev) => ({
        ...prev,
        [match.id]: { ...prev[match.id], error: "Home and away scores are required." },
      }));
      return;
    }

    setResults((prev) => ({
      ...prev,
      [match.id]: { ...prev[match.id], saving: true, error: null, saved: false },
    }));

    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: parseInt(r.homeScore, 10),
          awayScore: parseInt(r.awayScore, 10),
          winnerId: r.winnerId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save result");
      setResults((prev) => ({
        ...prev,
        [match.id]: { ...prev[match.id], saving: false, saved: true },
      }));
      router.refresh();
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [match.id]: { ...prev[match.id], saving: false, error: err.message },
      }));
    }
  }

  if (matches.length === 0) {
    return (
      <p className="text-slate-400 text-sm py-4">
        No matches available for the current phase. Open a knockout phase to see matches here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const r = results[match.id];
        const homeTeamOptions = [match.homeTeam, match.awayTeam].filter(Boolean) as Team[];

        return (
          <div key={match.id} className="bg-slate-700/50 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-white font-semibold">
                  Match #{match.matchNumber}
                  {match.description && (
                    <span className="text-slate-400 font-normal ml-2 text-sm">({match.description})</span>
                  )}
                </p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {match.homeTeam?.flagEmoji} {match.homeTeam?.name ?? "TBD"}
                  {" vs "}
                  {match.awayTeam?.flagEmoji} {match.awayTeam?.name ?? "TBD"}
                </p>
              </div>
              {r.saved && (
                <span className="text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-500/20 rounded-full flex-shrink-0">
                  Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Home Score */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {match.homeTeam?.name ?? "Home"} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={r.homeScore}
                  onChange={(e) => update(match.id, "homeScore", e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Away Score */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  {match.awayTeam?.name ?? "Away"} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={r.awayScore}
                  onChange={(e) => update(match.id, "awayScore", e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Winner (for draws / extra time) */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-slate-400 mb-1.5">Winner (if KO)</label>
                <select
                  value={r.winnerId}
                  onChange={(e) => update(match.id, "winnerId", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">— None / Draw —</option>
                  {homeTeamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.flagEmoji} {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {r.error && (
              <p className="text-red-400 text-xs mt-3 bg-red-900/20 border border-red-800/50 rounded px-3 py-2">
                {r.error}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(match)}
                disabled={r.saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {r.saving ? "Saving…" : "Save Result"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
