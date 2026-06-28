"use client";

import { useState, useEffect, useCallback } from "react";

interface Team { id: string; name: string; flagEmoji: string | null; group?: string }
interface MatchRow {
  id: string;
  matchNumber: number;
  description: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeam: { id: string; name: string; flagEmoji: string | null } | null;
  awayTeam: { id: string; name: string; flagEmoji: string | null } | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
}

const KNOCKOUT_PHASES = [
  { type: "ROUND_OF_32",   label: "Round of 32",  expected: 16 },
  { type: "ROUND_OF_16",   label: "Round of 16",  expected: 8  },
  { type: "QUARTERFINALS", label: "Cuartos",       expected: 4  },
  { type: "SEMIFINALS",    label: "Semifinales",   expected: 2  },
  { type: "FINAL",         label: "Final",         expected: 1  },
] as const;

function TeamSelect({
  label, value, onChange, teams, exclude,
}: {
  label: string; value: string; onChange: (v: string) => void; teams: Team[]; exclude?: string;
}) {
  return (
    <div>
      <label className="text-xs text-blue-200/50 mb-1.5 block font-semibold uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-wc26 w-full text-sm"
      >
        <option value="">— Seleccionar equipo —</option>
        {teams.filter((t) => t.id !== exclude).map((t) => (
          <option key={t.id} value={t.id}>
            {t.flagEmoji} {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AdminMatchSetup({ teams }: { teams: Team[] }) {
  const [selectedPhase, setSelectedPhase] = useState<string>("ROUND_OF_32");
  const [matches, setMatches]             = useState<MatchRow[]>([]);
  const [phaseIsOpen, setPhaseIsOpen]     = useState(false);
  const [loading, setLoading]             = useState(true);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editDraft, setEditDraft]         = useState({ homeTeamId: "", awayTeamId: "", description: "" });
  const [newForm, setNewForm]             = useState<{ homeTeamId: string; awayTeamId: string; description: string } | null>(null);
  const [saving, setSaving]               = useState(false);
  const [removing, setRemoving]           = useState<string | null>(null);
  const [msg, setMsg]                     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/matches?phaseType=${selectedPhase}`);
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches ?? []);
      setPhaseIsOpen(data.isOpen ?? false);
    }
    setLoading(false);
  }, [selectedPhase]);

  useEffect(() => {
    setEditingId(null);
    setNewForm(null);
    setMsg(null);
    load();
  }, [load]);

  function startEdit(match: MatchRow) {
    setEditingId(match.id);
    setEditDraft({
      homeTeamId:  match.homeTeamId  ?? "",
      awayTeamId:  match.awayTeamId  ?? "",
      description: match.description ?? "",
    });
  }

  async function saveEdit(matchId: string) {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, ...editDraft }),
    });
    if (res.ok) {
      setMsg({ type: "ok", text: "Partido actualizado." });
      setEditingId(null);
      load();
    } else {
      const d = await res.json();
      setMsg({ type: "err", text: d.error ?? "Error al guardar" });
    }
    setSaving(false);
  }

  async function deleteMatch(matchId: string) {
    setRemoving(matchId);
    const res = await fetch("/api/admin/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setMsg({ type: "err", text: d.error ?? "Error al eliminar" });
    } else {
      load();
    }
    setRemoving(null);
  }

  async function addMatch() {
    if (!newForm) return;
    setSaving(true); setMsg(null);
    const nextNumber = matches.length > 0 ? Math.max(...matches.map((m) => m.matchNumber)) + 1 : 1;
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseType: selectedPhase, matchNumber: nextNumber, ...newForm }),
    });
    if (res.ok) {
      setMsg({ type: "ok", text: "Partido añadido." });
      setNewForm(null);
      load();
    } else {
      const d = await res.json();
      setMsg({ type: "err", text: d.error ?? "Error al añadir" });
    }
    setSaving(false);
  }

  const phaseInfo = KNOCKOUT_PHASES.find((p) => p.type === selectedPhase);

  return (
    <div className="space-y-5">
      {/* Phase tabs */}
      <div className="flex flex-wrap gap-2">
        {KNOCKOUT_PHASES.map((p) => (
          <button
            key={p.type}
            onClick={() => setSelectedPhase(p.type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedPhase === p.type
                ? "bg-blue-700 text-white"
                : "bg-[#0f1e3d] text-blue-200/60 hover:text-blue-200 hover:bg-blue-900/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "ok"
            ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700/30"
            : "bg-red-900/20 text-red-400 border border-red-700/30"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Info row */}
      {phaseInfo && !loading && (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-blue-200/50">
            {matches.length}/{phaseInfo.expected} partidos configurados
          </span>
          {matches.length === phaseInfo.expected
            ? <span className="text-emerald-400 font-semibold">✓ Completo</span>
            : <span className="text-amber-400 font-semibold">⚠ Incompleto</span>
          }
          {phaseIsOpen && (
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Fase abierta
            </span>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-blue-200/60 text-sm">Cargando…</p>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div key={match.id} className="bg-[#080e1f] rounded-xl border border-blue-900/40 p-4">
              {editingId === match.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_40px_1fr] gap-3 items-end">
                    <TeamSelect
                      label="Equipo Local"
                      value={editDraft.homeTeamId}
                      onChange={(v) => setEditDraft((d) => ({ ...d, homeTeamId: v }))}
                      teams={teams}
                      exclude={editDraft.awayTeamId}
                    />
                    <div className="text-center text-blue-300/30 font-bold text-lg pb-2.5">vs</div>
                    <TeamSelect
                      label="Equipo Visitante"
                      value={editDraft.awayTeamId}
                      onChange={(v) => setEditDraft((d) => ({ ...d, awayTeamId: v }))}
                      teams={teams}
                      exclude={editDraft.homeTeamId}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-blue-200/50 mb-1 block">Descripción (opcional, ej: 1A vs 2B)</label>
                    <input
                      type="text"
                      value={editDraft.description}
                      onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Ej: 1A vs 2B"
                      maxLength={50}
                      className="input-wc26 text-sm w-full sm:w-72"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(match.id)}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
                    >
                      {saving ? "Guardando…" : "Guardar"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0f1e3d] text-blue-200/60 hover:text-blue-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-300/30 w-7 shrink-0 text-center">
                    #{match.matchNumber}
                  </span>
                  <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
                    {match.homeTeam ? (
                      <span className="text-sm text-white font-medium">
                        {match.homeTeam.flagEmoji} {match.homeTeam.name}
                      </span>
                    ) : (
                      <span className="text-sm text-blue-300/30 italic">TBD</span>
                    )}
                    <span className="text-blue-300/20 text-xs font-bold shrink-0">vs</span>
                    {match.awayTeam ? (
                      <span className="text-sm text-white font-medium">
                        {match.awayTeam.flagEmoji} {match.awayTeam.name}
                      </span>
                    ) : (
                      <span className="text-sm text-blue-300/30 italic">TBD</span>
                    )}
                    {match.description && (
                      <span className="text-xs text-blue-300/30 ml-1">({match.description})</span>
                    )}
                  </div>
                  {match.winnerId && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                      Finalizado
                    </span>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(match)}
                      title="Editar equipos"
                      className="p-1.5 rounded-lg text-blue-300/30 hover:text-blue-300 hover:bg-blue-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {!match.winnerId && (
                      <button
                        onClick={() => deleteMatch(match.id)}
                        disabled={removing === match.id}
                        title="Eliminar partido"
                        className="p-1.5 rounded-lg text-blue-300/30 hover:text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                      >
                        {removing === match.id
                          ? <span className="text-xs">…</span>
                          : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )
                        }
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* New match form */}
          {newForm !== null ? (
            <div className="bg-[#080e1f] rounded-xl border border-blue-700/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-300/60 uppercase tracking-wider">
                Nuevo Partido #{matches.length + 1}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_40px_1fr] gap-3 items-end">
                <TeamSelect
                  label="Equipo Local"
                  value={newForm.homeTeamId}
                  onChange={(v) => setNewForm((f) => f ? { ...f, homeTeamId: v } : null)}
                  teams={teams}
                  exclude={newForm.awayTeamId}
                />
                <div className="text-center text-blue-300/30 font-bold text-lg pb-2.5">vs</div>
                <TeamSelect
                  label="Equipo Visitante"
                  value={newForm.awayTeamId}
                  onChange={(v) => setNewForm((f) => f ? { ...f, awayTeamId: v } : null)}
                  teams={teams}
                  exclude={newForm.homeTeamId}
                />
              </div>
              <div>
                <label className="text-xs text-blue-200/50 mb-1 block">Descripción (opcional, ej: 1A vs 2B)</label>
                <input
                  type="text"
                  value={newForm.description}
                  onChange={(e) => setNewForm((f) => f ? { ...f, description: e.target.value } : null)}
                  placeholder="Ej: 1A vs 2B"
                  maxLength={50}
                  className="input-wc26 text-sm w-full sm:w-72"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addMatch}
                  disabled={saving || !newForm.homeTeamId || !newForm.awayTeamId}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
                >
                  {saving ? "Añadiendo…" : "Añadir Partido"}
                </button>
                <button
                  onClick={() => setNewForm(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0f1e3d] text-blue-200/60 hover:text-blue-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNewForm({ homeTeamId: "", awayTeamId: "", description: "" })}
              className="w-full py-3 rounded-xl border border-dashed border-blue-800/50 text-sm text-blue-300/40 hover:text-blue-300 hover:border-blue-700/60 hover:bg-blue-900/10 transition-colors"
            >
              + Añadir partido
            </button>
          )}
        </div>
      )}
    </div>
  );
}
