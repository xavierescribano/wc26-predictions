"use client";

import { useState, useCallback } from "react";

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

type GroupDraft = { [pos: number]: string };
type SaveState = "idle" | "saving" | "saved" | "error";

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const POSITION_LABELS = ["1st", "2nd", "3rd", "4th"];
const MAX_POINTS_PER_GROUP = 5;

function buildDraftFromPrediction(pred: GroupPrediction): GroupDraft {
  return { 1: pred.position1Id, 2: pred.position2Id, 3: pred.position3Id, 4: pred.position4Id };
}

function isDraftComplete(draft: GroupDraft): boolean {
  return [1, 2, 3, 4].every((pos) => !!draft[pos]);
}

interface GroupCardProps {
  groupLetter: string;
  teams: Team[];
  draft: GroupDraft;
  prediction: GroupPrediction | undefined;
  isOpen: boolean;
  saveState: SaveState;
  errorMsg: string;
  onChange: (groupLetter: string, pos: number, teamId: string) => void;
}

function GroupCard({ groupLetter, teams, draft, prediction, isOpen, saveState, errorMsg, onChange }: GroupCardProps) {
  const getUsedIds = (excludePos: number) =>
    [1, 2, 3, 4].filter((p) => p !== excludePos).map((p) => draft[p]).filter(Boolean);

  const hasPoints = prediction?.pointsEarned != null;
  const isComplete = isDraftComplete(draft);

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
        <h2 className="text-sm font-bold text-white tracking-widest uppercase">Group {groupLetter}</h2>
        <div className="flex items-center gap-2">
          {isOpen && saveState === "saving" && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </span>
          )}
          {isOpen && saveState === "saved" && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved
            </span>
          )}
          {isOpen && saveState === "error" && (
            <span className="text-xs text-red-400" title={errorMsg}>Error</span>
          )}
          {hasPoints && (
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {prediction!.pointsEarned}/{MAX_POINTS_PER_GROUP} pts
            </span>
          )}
          {!hasPoints && isComplete && !isOpen && (
            <span className="text-xs text-slate-500">Awaiting results</span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-2">
        {[1, 2, 3, 4].map((pos) => {
          const usedIds = getUsedIds(pos);
          const selectedId = draft[pos] ?? "";
          const selectedTeam = teams.find((t) => t.id === selectedId);

          if (!isOpen) {
            return (
              <div key={pos} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-700/50">
                <span className="text-xs font-bold text-slate-500 w-6 shrink-0">{POSITION_LABELS[pos - 1]}</span>
                {selectedTeam ? (
                  <>
                    <span className="text-lg leading-none">{selectedTeam.flagEmoji ?? "🏳️"}</span>
                    <span className="text-sm text-white font-medium">{selectedTeam.name}</span>
                    <span className="ml-auto text-xs text-slate-500 font-mono">{selectedTeam.shortCode}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-600 italic">Not picked</span>
                )}
              </div>
            );
          }

          return (
            <div key={pos} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 w-6 shrink-0 text-right">{pos}</span>
              <div className="relative flex-1">
                {selectedTeam && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base leading-none pointer-events-none">
                    {selectedTeam.flagEmoji}
                  </span>
                )}
                <select
                  value={selectedId}
                  onChange={(e) => onChange(groupLetter, pos, e.target.value)}
                  className={`w-full appearance-none rounded-lg border bg-slate-700 text-white text-sm py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    selectedId ? "border-slate-600 pl-9" : "border-slate-600 pl-3 text-slate-400"
                  }`}
                >
                  <option value="" disabled>{POSITION_LABELS[pos - 1]} place…</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} disabled={usedIds.includes(team.id)}>
                      {team.flagEmoji} {team.name}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {isOpen && (
        <div className={`mx-3 mb-3 h-1 rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-slate-700"}`} />
      )}
    </div>
  );
}

export function GroupPickGrid({ teamsByGroup, existingPredictions, isOpen }: GroupPickGridProps) {
  const initDrafts = () => {
    const drafts: Record<string, GroupDraft> = {};
    for (const letter of GROUP_LETTERS) {
      const pred = existingPredictions.find((p) => p.groupLetter === letter);
      drafts[letter] = pred ? buildDraftFromPrediction(pred) : {};
    }
    return drafts;
  };

  const [drafts, setDrafts] = useState<Record<string, GroupDraft>>(initDrafts);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [errorMsgs, setErrorMsgs] = useState<Record<string, string>>({});

  const saveGroup = useCallback(async (groupLetter: string, draft: GroupDraft) => {
    setSaveStates((prev) => ({ ...prev, [groupLetter]: "saving" }));
    try {
      const res = await fetch("/api/picks/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          groupLetter,
          position1Id: draft[1],
          position2Id: draft[2],
          position3Id: draft[3],
          position4Id: draft[4],
        }]),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      setSaveStates((prev) => ({ ...prev, [groupLetter]: "saved" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setSaveStates((prev) => ({ ...prev, [groupLetter]: "error" }));
      setErrorMsgs((prev) => ({ ...prev, [groupLetter]: msg }));
    }
  }, []);

  const handleChange = useCallback(
    (groupLetter: string, pos: number, teamId: string) => {
      setDrafts((prev) => {
        const updated = { ...prev[groupLetter], [pos]: teamId };
        // Auto-save as soon as all 4 positions are filled
        if (isDraftComplete(updated)) {
          saveGroup(groupLetter, updated);
        } else {
          setSaveStates((s) => ({ ...s, [groupLetter]: "idle" }));
        }
        return { ...prev, [groupLetter]: updated };
      });
    },
    [saveGroup]
  );

  const completedCount = GROUP_LETTERS.filter((l) => isDraftComplete(drafts[l] ?? {})).length;

  return (
    <div className="space-y-6">
      {isOpen && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Picks save automatically when all 4 positions in a group are filled. You can change them anytime while the phase is open.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GROUP_LETTERS.map((letter) => {
          const pred = existingPredictions.find((p) => p.groupLetter === letter);
          return (
            <GroupCard
              key={letter}
              groupLetter={letter}
              teams={teamsByGroup[letter] ?? []}
              draft={drafts[letter] ?? {}}
              prediction={pred}
              isOpen={isOpen}
              saveState={saveStates[letter] ?? "idle"}
              errorMsg={errorMsgs[letter] ?? ""}
              onChange={handleChange}
            />
          );
        })}
      </div>

      {isOpen && (
        <p className="text-center text-slate-500 text-sm">
          {completedCount}/12 groups complete
        </p>
      )}
    </div>
  );
}
