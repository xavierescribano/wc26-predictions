"use client";

import { useState, useEffect, useCallback } from "react";

interface UserMeta { id: string; name: string | null; email: string }

interface PlayerPick {
  id: string;
  userId: string;
  playerName: string;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  user: UserMeta;
}

interface TeamPick {
  id: string;
  userId: string;
  teamId: string;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  user: UserMeta;
  team: { id: string; name: string; flagEmoji: string | null };
}

interface Team { id: string; name: string; flagEmoji: string | null }

export function AdminSpecialPicks({ teams }: { teams: Team[] }) {
  const [playerPicks, setPlayerPicks]     = useState<PlayerPick[]>([]);
  const [teamPicks, setTeamPicks]         = useState<TeamPick[]>([]);
  const [correctUserIds, setCorrectUserIds] = useState<Set<string>>(new Set());
  const [correctTeamId, setCorrectTeamId] = useState<string>("");
  const [saving, setSaving]               = useState<"player" | "team" | null>(null);
  const [msg, setMsg]                     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/special-picks");
    if (res.ok) {
      const data = await res.json();
      setPlayerPicks(data.playerPicks ?? []);
      setTeamPicks(data.teamPicks ?? []);

      // Pre-fill checkboxes from already-scored data
      const alreadyCorrect = (data.playerPicks ?? [])
        .filter((p: PlayerPick) => p.isCorrect === true)
        .map((p: PlayerPick) => p.userId);
      setCorrectUserIds(new Set(alreadyCorrect));

      // Pre-fill team selector
      const correctTeamPick = (data.teamPicks ?? []).find((p: TeamPick) => p.isCorrect === true);
      if (correctTeamPick) setCorrectTeamId(correctTeamPick.teamId);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function togglePlayer(userId: string) {
    setCorrectUserIds((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  }

  async function savePlayer() {
    setSaving("player"); setMsg(null);
    const res = await fetch("/api/admin/special-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "player", correctUserIds: Array.from(correctUserIds) }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: `Puntuación guardada — ${data.scored} apuesta(s) actualizadas.` });
      load();
    } else {
      setMsg({ type: "err", text: data.error ?? "Error al guardar" });
    }
    setSaving(null);
  }

  async function saveTeam() {
    if (!correctTeamId) return;
    setSaving("team"); setMsg(null);
    const res = await fetch("/api/admin/special-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "team", correctTeamId }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: `Equipo goleador guardado — ${data.scored} apuesta(s) puntuadas.` });
      load();
    } else {
      setMsg({ type: "err", text: data.error ?? "Error al guardar" });
    }
    setSaving(null);
  }

  if (loading) return <p className="text-blue-200/60 text-sm">Cargando…</p>;

  return (
    <div className="space-y-8">
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "ok"
            ? "bg-red-600/8 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/10 text-red-400 border border-red-500/30"
        }`}>
          {msg.text}
        </div>
      )}

      {/* ── Player top scorer ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">⭐ Máximo Goleador (Jugador) — 25 pts</p>
            <p className="text-blue-200/60 text-xs mt-0.5">
              Marca las apuestas que consideres correctas (pueden ser varias si el nombre coincide).
            </p>
          </div>
          <button
            onClick={savePlayer}
            disabled={saving === "player"}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors shrink-0"
          >
            {saving === "player" ? "Guardando…" : "Guardar puntuación"}
          </button>
        </div>

        {playerPicks.length === 0 ? (
          <p className="text-blue-300/50 text-sm italic">Ningún jugador ha registrado esta apuesta todavía.</p>
        ) : (
          <div className="bg-[#080e1f] rounded-xl border border-blue-900/40 divide-y divide-blue-900/30">
            {playerPicks.map((pick) => {
              const checked = correctUserIds.has(pick.userId);
              return (
                <label
                  key={pick.id}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                    checked ? "bg-red-600/8" : "hover:bg-[#0c1630]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePlayer(pick.userId)}
                    className="w-4 h-4 accent-emerald-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{pick.user.name ?? pick.user.email}</p>
                    <p className="text-blue-200/60 text-xs truncate">
                      Apuesta: <span className="text-amber-400 font-semibold">"{pick.playerName}"</span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {pick.isCorrect === true && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">✓ 25 pts</span>
                    )}
                    {pick.isCorrect === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f1e3d] text-blue-200/60 font-semibold">0 pts</span>
                    )}
                    {pick.isCorrect === null && (
                      <span className="text-xs text-blue-300/50 italic">Sin puntuar</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Team top scorer ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">⭐ Equipo Más Goleador — 25 pts</p>
            <p className="text-blue-200/60 text-xs mt-0.5">
              Selecciona el equipo que más goles marcó en el torneo. El sistema puntuará automáticamente.
            </p>
          </div>
          <button
            onClick={saveTeam}
            disabled={saving === "team" || !correctTeamId}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors shrink-0"
          >
            {saving === "team" ? "Guardando…" : "Guardar puntuación"}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Team selector */}
          <select
            value={correctTeamId}
            onChange={(e) => setCorrectTeamId(e.target.value)}
            className="input-wc26 flex-1"
          >
            <option value="">— Selecciona el equipo goleador real —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.flagEmoji ? `${t.flagEmoji} ` : ""}{t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show who picked what */}
        {teamPicks.length > 0 && (
          <div className="mt-4 bg-[#080e1f] rounded-xl border border-blue-900/40 divide-y divide-blue-900/30">
            {teamPicks.map((pick) => {
              const isWinner = pick.teamId === correctTeamId;
              return (
                <div key={pick.id} className={`flex items-center gap-4 px-4 py-3 ${isWinner ? "bg-red-600/8" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{pick.user.name ?? pick.user.email}</p>
                    <p className="text-blue-200/60 text-xs">
                      Apuesta:{" "}
                      <span className="font-semibold text-slate-200">
                        {pick.team.flagEmoji} {pick.team.name}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isWinner && correctTeamId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">✓ 25 pts</span>
                    )}
                    {!isWinner && correctTeamId && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f1e3d] text-blue-200/60">0 pts</span>
                    )}
                    {!correctTeamId && pick.isCorrect === true && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">✓ 25 pts</span>
                    )}
                    {!correctTeamId && pick.isCorrect === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f1e3d] text-blue-200/60">0 pts</span>
                    )}
                    {!correctTeamId && pick.isCorrect === null && (
                      <span className="text-xs text-blue-300/50 italic">Sin puntuar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {teamPicks.length === 0 && (
          <p className="text-blue-300/50 text-sm italic mt-3">Ningún jugador ha registrado esta apuesta todavía.</p>
        )}
      </div>
    </div>
  );
}
