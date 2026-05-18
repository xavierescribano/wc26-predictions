"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  shortCode: string;
  flagEmoji: string | null;
  group: string;
}

interface GroupResult {
  groupLetter: string;
  position1Id: string;
  position2Id: string;
  position3Id: string;
  position4Id: string;
}

interface AdminGroupResultFormProps {
  teams: Team[];
  existingResults: GroupResult[];
}

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export function AdminGroupResultForm({ teams, existingResults }: AdminGroupResultFormProps) {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<string>("A");
  const [positions, setPositions] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of GROUP_LETTERS) {
      const existing = existingResults.find((r) => r.groupLetter === g);
      if (existing) {
        init[g] = [existing.position1Id, existing.position2Id, existing.position3Id, existing.position4Id];
      } else {
        init[g] = ["", "", "", ""];
      }
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupTeams = teams.filter((t) => t.group === activeGroup);
  const current = positions[activeGroup] || ["", "", "", ""];

  function handlePositionChange(posIndex: number, teamId: string) {
    setPositions((prev) => {
      const next = [...(prev[activeGroup] || ["", "", "", ""])];
      // Remove this team from any other position
      for (let i = 0; i < next.length; i++) {
        if (i !== posIndex && next[i] === teamId) next[i] = "";
      }
      next[posIndex] = teamId;
      return { ...prev, [activeGroup]: next };
    });
    setMessage(null);
    setError(null);
  }

  async function handleSave() {
    const [p1, p2, p3, p4] = current;
    if (!p1 || !p2 || !p3 || !p4) {
      setError("Please fill all 4 positions.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/group-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupLetter: activeGroup,
          position1Id: p1,
          position2Id: p2,
          position3Id: p3,
          position4Id: p4,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
      } else {
        setMessage(`Group ${activeGroup} results saved. ${data.recalculated} predictions recalculated.`);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  const hasResult = (g: string) => existingResults.some((r) => r.groupLetter === g);

  return (
    <div className="space-y-4">
      {/* Group selector */}
      <div className="flex flex-wrap gap-2">
        {GROUP_LETTERS.map((g) => (
          <button
            key={g}
            onClick={() => { setActiveGroup(g); setMessage(null); setError(null); }}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
              activeGroup === g
                ? "bg-emerald-600 text-white"
                : hasResult(g)
                ? "bg-slate-600 text-emerald-400 border border-emerald-600"
                : "bg-[#0f1e3d] text-slate-200 hover:bg-[#162040]"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Position selectors */}
      <div className="bg-[#0f1e3d] rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-slate-200">Group {activeGroup} Final Standings</h3>
        {[1, 2, 3, 4].map((pos) => (
          <div key={pos} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-200">
              {pos}
            </span>
            <select
              value={current[pos - 1]}
              onChange={(e) => handlePositionChange(pos - 1, e.target.value)}
              className="flex-1 bg-[#0c1630] border border-blue-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">— Select team —</option>
              {groupTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flagEmoji} {t.name}
                </option>
              ))}
            </select>
          </div>
        ))}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {message && <p className="text-emerald-400 text-sm">{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
        >
          {saving ? "Saving…" : `Save Group ${activeGroup} Results`}
        </button>
      </div>
    </div>
  );
}
