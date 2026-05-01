"use client";

import { useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
  shortCode: string;
  group: string;
  flagEmoji: string | null;
}

interface Match {
  id: string;
  matchNumber: number;
  description: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  winner: Team | null;
}

interface Phase {
  id: string;
  type: string;
  isOpen: boolean;
}

interface KnockoutPick {
  matchId: string;
  pickedTeamId: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  pickedTeam: Team;
}

interface KnockoutPickGridProps {
  phase: Phase;
  matches: Match[];
  userPicks: KnockoutPick[];
  isOpen: boolean;
  isFinal: boolean;
}

// ─── Draft state per match ────────────────────────────────────────────────────

interface MatchDraft {
  pickedTeamId: string;
  homeScore: string;
  awayScore: string;
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: Match;
  draft: MatchDraft | undefined;
  existingPick: KnockoutPick | undefined;
  isOpen: boolean;
  isFinal: boolean;
  onPick: (matchId: string, teamId: string) => void;
  onScore: (matchId: string, field: "home" | "away", value: string) => void;
}

function MatchCard({
  match,
  draft,
  existingPick,
  isOpen,
  isFinal,
  onPick,
  onScore,
}: MatchCardProps) {
  const hasTeams = match.homeTeam && match.awayTeam;
  const resultKnown = match.winnerId != null;
  const pickedTeamId = draft?.pickedTeamId ?? "";

  const label = match.description ?? `Match ${match.matchNumber}`;

  // Read-only card (phase closed)
  if (!isOpen) {
    const pick = existingPick;
    const isCorrect = pick?.isCorrect;
    const pts = pick?.pointsEarned;

    return (
      <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
        {/* Match header */}
        <div className="px-4 py-2.5 bg-slate-700/40 border-b border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{label}</span>
          {pts != null && (
            <span className="text-xs font-semibold text-emerald-400">{pts} pts</span>
          )}
        </div>

        <div className="p-4 space-y-3">
          {hasTeams ? (
            <>
              {[match.homeTeam!, match.awayTeam!].map((team, idx) => {
                const isWinner = team.id === match.winnerId;
                const isUserPick = team.id === pick?.pickedTeamId;
                const userPickedWrong = isUserPick && resultKnown && !isWinner;

                return (
                  <div
                    key={team.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors ${
                      isWinner
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : userPickedWrong
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-slate-700/30 border-transparent"
                    }`}
                  >
                    <span className="text-xl leading-none">{team.flagEmoji ?? "🏳️"}</span>
                    <span
                      className={`text-sm font-medium flex-1 ${
                        isWinner
                          ? "text-emerald-300"
                          : userPickedWrong
                          ? "text-red-400"
                          : "text-slate-300"
                      }`}
                    >
                      {team.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isUserPick && (
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            resultKnown
                              ? isWinner
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                              : "bg-slate-600 text-slate-400"
                          }`}
                        >
                          Your pick
                        </span>
                      )}
                      {isWinner && (
                        <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    {idx === 0 && match.homeScore != null && (
                      <span className="text-sm font-mono font-bold text-white ml-auto">
                        {match.homeScore}–{match.awayScore}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Final score prediction read-only */}
              {isFinal && pick && (
                <div className="pt-1 text-xs text-slate-500 text-center">
                  Your predicted score:{" "}
                  <span className="text-slate-300 font-mono">
                    {pick.predictedHomeScore ?? "–"} – {pick.predictedAwayScore ?? "–"}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-slate-600 text-sm py-2">Teams TBD</div>
          )}

          {!pick && (
            <p className="text-center text-xs text-slate-600 italic pt-1">No pick made</p>
          )}
        </div>
      </div>
    );
  }

  // Editable card
  return (
    <div
      className={`rounded-xl bg-slate-800 border overflow-hidden transition-colors ${
        pickedTeamId ? "border-emerald-500/40" : "border-slate-700"
      }`}
    >
      {/* Match header */}
      <div className="px-4 py-2.5 bg-slate-700/40 border-b border-slate-700">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">{label}</span>
      </div>

      <div className="p-4 space-y-3">
        {hasTeams ? (
          <>
            {[match.homeTeam!, match.awayTeam!].map((team) => {
              const isPicked = pickedTeamId === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => onPick(match.id, team.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 border text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isPicked
                      ? "bg-emerald-600/20 border-emerald-500 shadow-emerald-500/10 shadow-md"
                      : "bg-slate-700/30 border-slate-600 hover:border-slate-500 hover:bg-slate-700/50"
                  }`}
                >
                  <span className="text-xl leading-none">{team.flagEmoji ?? "🏳️"}</span>
                  <span
                    className={`text-sm font-medium flex-1 ${
                      isPicked ? "text-emerald-300" : "text-slate-200"
                    }`}
                  >
                    {team.name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{team.shortCode}</span>
                  {/* Radio indicator */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isPicked ? "border-emerald-500 bg-emerald-500" : "border-slate-500"
                    }`}
                  >
                    {isPicked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              );
            })}

            {/* Final score inputs */}
            {isFinal && pickedTeamId && (
              <div className="pt-1 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Predict final score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">
                      {match.homeTeam!.shortCode}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={draft?.homeScore ?? ""}
                      onChange={(e) => onScore(match.id, "home", e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <span className="text-slate-500 text-lg font-bold pt-5">–</span>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">
                      {match.awayTeam!.shortCode}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="0"
                      value={draft?.awayScore ?? ""}
                      onChange={(e) => onScore(match.id, "away", e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-slate-600 text-sm py-4">
            Teams not yet determined
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function KnockoutPickGrid({
  phase,
  matches,
  userPicks,
  isOpen,
  isFinal,
}: KnockoutPickGridProps) {
  // Initialise drafts from existing picks
  const initDrafts = (): Record<string, MatchDraft> => {
    const map: Record<string, MatchDraft> = {};
    for (const pick of userPicks) {
      map[pick.matchId] = {
        pickedTeamId: pick.pickedTeamId,
        homeScore: pick.predictedHomeScore != null ? String(pick.predictedHomeScore) : "",
        awayScore: pick.predictedAwayScore != null ? String(pick.predictedAwayScore) : "",
      };
    }
    return map;
  };

  const [drafts, setDrafts] = useState<Record<string, MatchDraft>>(initDrafts);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handlePick = useCallback((matchId: string, teamId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] ?? { homeScore: "", awayScore: "" }),
        pickedTeamId: teamId,
      },
    }));
    setSaveStatus("idle");
  }, []);

  const handleScore = useCallback(
    (matchId: string, field: "home" | "away", value: string) => {
      setDrafts((prev) => ({
        ...prev,
        [matchId]: {
          ...(prev[matchId] ?? { pickedTeamId: "" }),
          homeScore: field === "home" ? value : (prev[matchId]?.homeScore ?? ""),
          awayScore: field === "away" ? value : (prev[matchId]?.awayScore ?? ""),
        },
      }));
      setSaveStatus("idle");
    },
    []
  );

  const pickedCount = matches.filter((m) => drafts[m.id]?.pickedTeamId).length;

  const handleSave = async () => {
    const toPick = matches
      .filter((m) => drafts[m.id]?.pickedTeamId)
      .map((m) => {
        const d = drafts[m.id];
        const body: Record<string, any> = {
          matchId: m.id,
          pickedTeamId: d.pickedTeamId,
        };
        if (isFinal) {
          if (d.homeScore !== "") body.predictedHomeScore = parseInt(d.homeScore, 10);
          if (d.awayScore !== "") body.predictedAwayScore = parseInt(d.awayScore, 10);
        }
        return body;
      });

    if (toPick.length === 0) {
      setErrorMsg("Pick at least one match before saving.");
      setSaveStatus("error");
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg("");

    try {
      // POST each pick individually (API accepts one at a time)
      const results = await Promise.all(
        toPick.map((body) =>
          fetch("/api/picks/knockout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error ?? `Failed for match ${body.matchId}`);
            }
            return res.json();
          })
        )
      );

      void results; // consumed
      setSaveStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Determine grid columns based on match count
  const gridCols =
    matches.length === 1
      ? "grid-cols-1 max-w-sm mx-auto"
      : matches.length <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-6">
      <div className={`grid ${gridCols} gap-4`}>
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            draft={drafts[match.id]}
            existingPick={userPicks.find((p) => p.matchId === match.id)}
            isOpen={isOpen}
            isFinal={isFinal}
            onPick={handlePick}
            onScore={handleScore}
          />
        ))}
      </div>

      {isOpen && (
        <div className="sticky bottom-4 z-10">
          <div className="rounded-xl bg-slate-800/90 backdrop-blur border border-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
            <div className="text-sm text-slate-400">
              <span className="text-white font-semibold">{pickedCount}</span>
              <span>/{matches.filter((m) => m.homeTeam && m.awayTeam).length} matches picked</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {saveStatus === "success" && (
                <span className="text-emerald-400 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Saved!
                </span>
              )}
              {saveStatus === "error" && (
                <span className="text-red-400 text-sm">{errorMsg}</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || pickedCount === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  "Save Picks"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
