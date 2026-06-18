"use client";

import { useState, useEffect, useCallback } from "react";

interface User { id: string; name: string; email: string }
interface Adjustment {
  id: string;
  userId: string;
  points: number;
  reason: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

export function AdminManualPoints({ users }: { users: User[] }) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [removing, setRemoving]       = useState<string | null>(null);
  const [msg, setMsg]                 = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [userId,  setUserId]  = useState("");
  const [points,  setPoints]  = useState("");
  const [reason,  setReason]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/manual-points");
    if (res.ok) setAdjustments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Net points per user for the summary
  const netByUser: Record<string, number> = {};
  for (const a of adjustments) {
    netByUser[a.userId] = (netByUser[a.userId] ?? 0) + a.points;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const pts = parseInt(points, 10);
    if (!userId || isNaN(pts) || pts === 0) return;
    setSaving(true); setMsg(null);
    const res = await fetch("/api/admin/manual-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, points: pts, reason: reason.trim() || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: `Ajuste de ${pts > 0 ? "+" : ""}${pts} pts aplicado a ${data.user.name ?? data.user.email}.` });
      setPoints(""); setReason("");
      load();
    } else {
      setMsg({ type: "err", text: data.error ?? "Error al guardar" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setRemoving(id);
    await fetch("/api/admin/manual-points", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAdjustments((prev) => prev.filter((a) => a.id !== id));
    setRemoving(null);
  }

  const playersWithAdjustments = users.filter((u) => netByUser[u.id] !== undefined);

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          msg.type === "ok"
            ? "bg-emerald-900/20 text-emerald-400 border border-emerald-700/30"
            : "bg-red-900/20 text-red-400 border border-red-700/30"
        }`}>
          {msg.text}
        </div>
      )}

      {/* ── Add form ── */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_1fr_auto] gap-3 items-end">
        {/* Player */}
        <div>
          <label className="block text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-1.5">Jugador</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required className="input-wc26">
            <option value="">— Selecciona jugador —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>

        {/* Points */}
        <div>
          <label className="block text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-1.5">Puntos</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="+10 / -5"
            min={-9999} max={9999}
            required
            className="input-wc26 text-center font-bold"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-1.5">Motivo <span className="font-normal opacity-60">(opcional)</span></label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Corrección fase de grupos"
            maxLength={100}
            className="input-wc26"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !userId || !points || parseInt(points) === 0}
          className="px-5 py-2.5 rounded-lg text-sm font-bold bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white transition-colors shrink-0"
        >
          {saving ? "…" : "Aplicar"}
        </button>
      </form>

      {/* ── Net summary per player ── */}
      {playersWithAdjustments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-2">Resumen neto por jugador</p>
          <div className="flex flex-wrap gap-2">
            {playersWithAdjustments.map((u) => {
              const net = netByUser[u.id];
              return (
                <span key={u.id} className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  net > 0
                    ? "bg-emerald-900/20 text-emerald-400 border-emerald-700/30"
                    : "bg-red-900/20 text-red-400 border-red-700/30"
                }`}>
                  {u.name || u.email}: {net > 0 ? "+" : ""}{net} pts
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── History ── */}
      <div>
        <p className="text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-2">
          Historial de ajustes {!loading && adjustments.length > 0 && <span className="font-normal opacity-60">({adjustments.length})</span>}
        </p>

        {loading && <p className="text-blue-200/60 text-sm">Cargando…</p>}

        {!loading && adjustments.length === 0 && (
          <p className="text-blue-300/40 text-sm italic">Sin ajustes manuales todavía.</p>
        )}

        {!loading && adjustments.length > 0 && (
          <div className="bg-[#080e1f] rounded-xl border border-blue-900/40 divide-y divide-blue-900/30">
            {adjustments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                {/* Points badge */}
                <span className={`shrink-0 w-16 text-center font-black text-sm rounded-lg py-1 ${
                  a.points > 0
                    ? "bg-emerald-900/20 text-emerald-400"
                    : "bg-red-900/20 text-red-400"
                }`}>
                  {a.points > 0 ? "+" : ""}{a.points}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {a.user.name ?? a.user.email}
                  </p>
                  <p className="text-blue-200/50 text-xs truncate">
                    {a.reason ?? <span className="italic">Sin motivo</span>}
                    {" · "}
                    {new Date(a.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={removing === a.id}
                  title="Eliminar ajuste"
                  className="shrink-0 p-1.5 rounded-lg text-blue-300/40 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {removing === a.id
                    ? <span className="text-xs">…</span>
                    : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
