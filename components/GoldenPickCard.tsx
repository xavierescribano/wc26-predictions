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

interface GoldenPick {
  id: string;
  teamId: string;
  changes: number;
  pointsEarned: number | null;
  isCorrect: boolean | null;
  team: Team;
}

interface GoldenPickCardProps {
  goldenPick: GoldenPick | null;
  allTeams: Team[];
}

const MAX_POINTS = 50;
const PENALTY = 10;

function calcPotential(changes: number): number {
  return Math.max(0, MAX_POINTS - changes * PENALTY);
}

// ─── Points badge ─────────────────────────────────────────────────────────────

function PointsBadge({ points, label }: { points: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-700/50 border border-slate-600 px-5 py-3 min-w-[80px]">
      <span className="text-2xl font-black text-emerald-400">{points}</span>
      <span className="text-xs text-slate-400 mt-0.5 text-center">{label}</span>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ChangeModalProps {
  currentPick: GoldenPick | null;
  allTeams: Team[];
  onConfirm: (teamId: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

function ChangeModal({
  currentPick,
  allTeams,
  onConfirm,
  onCancel,
  loading,
  error,
}: ChangeModalProps) {
  const [selectedId, setSelectedId] = useState(currentPick?.teamId ?? "");

  const isFirstPick = !currentPick;
  const currentChanges = currentPick?.changes ?? 0;
  const currentPotential = calcPotential(currentChanges);
  const afterChangePotential = calcPotential(currentChanges + 1);

  const selectedTeam = allTeams.find((t) => t.id === selectedId);
  const isSameTeam = currentPick && selectedId === currentPick.teamId;

  // Group teams for the dropdown
  const teamsByGroup = allTeams.reduce<Record<string, Team[]>>((acc, team) => {
    (acc[team.group] ??= []).push(team);
    return acc;
  }, {});
  const sortedGroups = Object.keys(teamsByGroup).sort();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">
            {isFirstPick ? "Make Your Golden Pick" : "Change Your Golden Pick"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isFirstPick
              ? "Choose the team you think will win the World Cup 2026."
              : "Select a new team to champion."}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Penalty warning (only on subsequent changes) */}
          {!isFirstPick && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-amber-400 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <div>
                  <p className="text-amber-300 text-sm font-semibold">Penalty applies</p>
                  <p className="text-amber-300/80 text-xs mt-1">
                    Changing your Golden Pick will reduce your potential reward by{" "}
                    <strong>{PENALTY} points</strong>:
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-white bg-slate-700 px-2 py-0.5 rounded">
                      {currentPotential} pts
                    </span>
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded ${
                        afterChangePotential > 0
                          ? "text-amber-300 bg-amber-500/10"
                          : "text-red-400 bg-red-500/10"
                      }`}
                    >
                      {afterChangePotential} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Select team</label>
            <div className="relative">
              {selectedTeam && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl leading-none pointer-events-none">
                  {selectedTeam.flagEmoji ?? "🏳️"}
                </span>
              )}
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className={`w-full appearance-none rounded-xl border border-slate-600 bg-slate-700 text-white text-sm py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                  selectedTeam ? "pl-10" : "pl-4"
                }`}
              >
                <option value="" disabled>
                  Choose a team…
                </option>
                {sortedGroups.map((group) => (
                  <optgroup key={group} label={`Group ${group}`}>
                    {teamsByGroup[group].map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.flagEmoji} {team.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedId && onConfirm(selectedId)}
            disabled={loading || !selectedId || isSameTeam === true}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            ) : isSameTeam ? (
              "Already picked"
            ) : (
              "Confirm Pick"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoldenPickCard({ goldenPick: initialPick, allTeams }: GoldenPickCardProps) {
  const [goldenPick, setGoldenPick] = useState(initialPick);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = useCallback(
    async (teamId: string) => {
      setSaving(true);
      setError("");

      try {
        const res = await fetch("/api/picks/golden", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save pick");
        }

        const data = await res.json();
        setGoldenPick(data.goldenPick);
        setShowModal(false);
      } catch (err: any) {
        setError(err.message ?? "Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const potential = goldenPick ? calcPotential(goldenPick.changes) : MAX_POINTS;
  const changes = goldenPick?.changes ?? 0;

  return (
    <>
      {/* ─── No pick yet ────────────────────────────────────── */}
      {!goldenPick && (
        <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">No Golden Pick yet</h2>
              <p className="text-slate-400 text-sm mt-1">
                Pick a team to win the World Cup. Your first pick is free — worth up to{" "}
                <span className="text-emerald-400 font-semibold">{MAX_POINTS} points</span>.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Make Your Pick
            </button>
          </div>
        </div>
      )}

      {/* ─── Existing pick ───────────────────────────────────── */}
      {goldenPick && (
        <div className="rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
          {/* Team banner */}
          <div className="px-6 py-6 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <span className="text-5xl leading-none">{goldenPick.team.flagEmoji ?? "🏳️"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
                  Your Golden Pick
                </p>
                <h2 className="text-2xl font-black text-white truncate">{goldenPick.team.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  Group {goldenPick.team.group} ·{" "}
                  <span className="font-mono text-slate-300">{goldenPick.team.shortCode}</span>
                </p>
              </div>
              {/* Result badge */}
              {goldenPick.isCorrect != null && (
                <span
                  className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${
                    goldenPick.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {goldenPick.isCorrect ? "Champion!" : "Eliminated"}
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="px-6 py-4 flex gap-3 border-b border-slate-700">
            <PointsBadge points={potential} label="Potential pts" />
            {goldenPick.pointsEarned != null && (
              <PointsBadge points={goldenPick.pointsEarned} label="Points earned" />
            )}
            <div className="flex flex-col justify-center ml-2">
              <p className="text-xs text-slate-400 mb-1">Changes made</p>
              <div className="flex items-center gap-1">
                {changes === 0 ? (
                  <span className="text-slate-300 text-sm font-semibold">None (free first pick)</span>
                ) : (
                  <>
                    {Array.from({ length: Math.min(changes, 5) }).map((_, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-amber-400"
                      />
                    ))}
                    {changes > 5 && (
                      <span className="text-xs text-amber-400 ml-1">+{changes - 5}</span>
                    )}
                    <span className="text-xs text-slate-400 ml-1.5">
                      {changes} {changes === 1 ? "change" : "changes"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Points breakdown */}
          {changes > 0 && (
            <div className="px-6 py-3 bg-slate-700/20 border-b border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Max points ({MAX_POINTS}) − {changes} change{changes !== 1 ? "s" : ""} × {PENALTY} pts each</span>
                <span className="font-semibold text-slate-200">= {potential} pts max</span>
              </div>
            </div>
          )}

          {/* Change pick button */}
          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {changes === 0
                ? "First change: −10 pts potential"
                : `Next change: ${potential} → ${calcPotential(changes + 1)} pts`}
            </p>
            <button
              onClick={() => setShowModal(true)}
              disabled={potential === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Change Pick
            </button>
          </div>

          {potential === 0 && (
            <div className="px-6 pb-4">
              <p className="text-xs text-red-400/80">
                You have reached the maximum number of changes — no more points available.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal ───────────────────────────────────────────── */}
      {showModal && (
        <ChangeModal
          currentPick={goldenPick}
          allTeams={allTeams}
          onConfirm={handleConfirm}
          onCancel={() => {
            setShowModal(false);
            setError("");
          }}
          loading={saving}
          error={error}
        />
      )}
    </>
  );
}
