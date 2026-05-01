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

interface GroupPrediction {
  groupLetter: string;
  position1Id: string;
  position2Id: string;
  position3Id: string;
  position4Id: string;
  pointsEarned: number | null;
  position1: Team;
  position2: Team;
  position3: Team;
  position4: Team;
}

interface GroupPickGridProps {
  teamsByGroup: Record<string, Team[]>;
  existingPredictions: GroupPrediction[];
  isOpen: boolean;
}

type GroupDraft = {
  [pos: number]: string; // position (1-4) → teamId
};

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const POSITION_LABELS = ["1st", "2nd", "3rd", "4th"];
const MAX_POINTS_PER_GROUP = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDraftFromPrediction(pred: GroupPrediction): GroupDraft {
  return {
    1: pred.position1Id,
    2: pred.position2Id,
    3: pred.position3Id,
    4: pred.position4Id,
  };
}

function isDraftComplete(draft: GroupDraft): boolean {
  return [1, 2, 3, 4].every((pos) => !!draft[pos]);
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

interface GroupCardProps {
  groupLetter: string;
  teams: Team[];
  draft: GroupDraft;
  prediction: GroupPrediction | undefined;
  isOpen: boolean;
  onChange: (groupLetter: string, pos: number, teamId: string) => void;
}

function GroupCard({ groupLetter, teams, draft, prediction, isOpen, onChange }: GroupCardProps) {
  const getUsedIds = (excludePos: number) =>
    [1, 2, 3, 4].filter((p) => p !== excludePos).map((p) => draft[p]).filter(Boolean);

  const hasPoints = prediction?.pointsEarned != null;
  const isComplete = isDraftComplete(draft);

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
        <h2 className="text-sm font-bold text-white tracking-widest uppercase">
          Group {groupLetter}
        </h2>
        {hasPoints && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {prediction!.pointsEarned}/{MAX_POINTS_PER_GROUP} pts
          </span>
        )}
        {!hasPoints && isComplete && !isOpen && (
          <span className="text-xs text-slate-500">Awaiting results</span>
        )}
      </div>

      {/* Position slots */}
      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((pos) => {
          const usedIds = getUsedIds(pos);
          const selectedId = draft[pos] ?? "";
          const selectedTeam = teams.find((t) => t.id === selectedId);

          if (!isOpen) {
            // Read-only view
            const team = selectedTeam;
            return (
              <div
                key={pos}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50"
              >
                <span className="text-xs font-bold text-slate-500 w-6 shrink-0">
                  {POSITION_LABELS[pos - 1]}
                </span>
                {team ? (
                  <>
                    <span className="text-lg leading-none">{team.flagEmoji ?? "🏳️"}</span>
                    <span className="text-sm text-white font-medium">{team.name}</span>
                    <span className="ml-auto text-xs text-slate-500 font-mono">{team.shortCode}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-600 italic">Not picked</span>
                )}
              </div>
            );
          }

          return (
            <div key={pos} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-6 shrink-0 text-right">
                {pos}
              </span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">
                  {selectedTeam?.flagEmoji ?? ""}
                </span>
                <select
                  value={selectedId}
                  onChange={(e) => onChange(groupLetter, pos, e.target.value)}
                  className={`w-full appearance-none rounded-lg border bg-slate-700 text-white text-sm py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    selectedId
                      ? "border-slate-600 pl-9"
                      : "border-slate-600 pl-3 text-slate-400"
                  }`}
                >
                  <option value="" disabled>
                    {POSITION_LABELS[pos - 1]} place…
                  </option>
                  {teams.map((team) => (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={usedIds.includes(team.id)}
                    >
                      {team.flagEmoji} {team.name}
                    </option>
                  ))}
                </select>
                {/* Chevron */}
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion indicator */}
      {isOpen && (
        <div
          className={`mx-3 mb-3 h-1 rounded-full transition-all ${
            isComplete ? "bg-emerald-500" : "bg-slate-700"
          }`}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GroupPickGrid({ teamsByGroup, existingPredictions, isOpen }: GroupPickGridProps) {
  // Build initial draft state from existing predictions
  const initDrafts = () => {
    const drafts: Record<string, GroupDraft> = {};
    for (const letter of GROUP_LETTERS) {
      const pred = existingPredictions.find((p) => p.groupLetter === letter);
      drafts[letter] = pred ? buildDraftFromPrediction(pred) : {};
    }
    return drafts;
  };

  const [drafts, setDrafts] = useState<Record<string, GroupDraft>>(initDrafts);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = useCallback(
    (groupLetter: string, pos: number, teamId: string) => {
      setDrafts((prev) => ({
        ...prev,
        [groupLetter]: { ...prev[groupLetter], [pos]: teamId },
      }));
      setSaveStatus("idle");
    },
    []
  );

  const completedCount = GROUP_LETTERS.filter((letter) =>
    isDraftComplete(drafts[letter] ?? {})
  ).length;

  const handleSave = async () => {
    const toSave = GROUP_LETTERS.filter((letter) => isDraftComplete(drafts[letter] ?? {})).map(
      (letter) => ({
        groupLetter: letter,
        position1Id: drafts[letter][1],
        position2Id: drafts[letter][2],
        position3Id: drafts[letter][3],
        position4Id: drafts[letter][4],
      })
    );

    if (toSave.length === 0) {
      setErrorMsg("Complete at least one group before saving.");
      setSaveStatus("error");
      return;
    }

    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/picks/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save picks");
      }

      setSaveStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Something went wrong");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Group grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUP_LETTERS.map((letter) => {
          const teams = teamsByGroup[letter] ?? [];
          const pred = existingPredictions.find((p) => p.groupLetter === letter);
          return (
            <GroupCard
              key={letter}
              groupLetter={letter}
              teams={teams}
              draft={drafts[letter] ?? {}}
              prediction={pred}
              isOpen={isOpen}
              onChange={handleChange}
            />
          );
        })}
      </div>

      {/* Save section */}
      {isOpen && (
        <div className="sticky bottom-4 z-10">
          <div className="rounded-xl bg-slate-800/90 backdrop-blur border border-slate-700 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl">
            <div className="text-sm text-slate-400">
              <span className="text-white font-semibold">{completedCount}</span>
              <span>/12 groups complete</span>
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
                disabled={saving || completedCount === 0}
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
                  "Save All Picks"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
