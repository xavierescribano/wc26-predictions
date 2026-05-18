"use client";

import { useState, useEffect, useCallback } from "react";

interface PendingInvite {
  id: string;
  email: string;
  inviteUrl: string;
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy}
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-slate-100 dark:bg-[#0f1e3d] hover:bg-slate-200 dark:hover:bg-[#162040] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-blue-800/40">
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

function WhatsAppButton({ url, label }: { url: string; label: string }) {
  const msg = encodeURIComponent(`You've been invited to the WC26 Prediction League! 🏆⚽\n\nJoin here: ${url}`);
  return (
    <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noopener noreferrer"
      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-green-100 dark:bg-green-500/10 hover:bg-green-200 dark:hover:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 flex items-center gap-1">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.127 1.528 5.857L0 24l6.335-1.658A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.012-1.374l-.36-.214-3.732.978.995-3.645-.235-.374A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
      WhatsApp
    </a>
  );
}

export function AdminInviteForm() {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [newInvite, setNewInvite] = useState<PendingInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    const res = await fetch("/api/admin/invite");
    if (res.ok) setPending(await res.json());
    setLoadingPending(false);
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setNewInvite(null);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: label }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); }
    else {
      setNewInvite({ id: "", email: label || "generic", inviteUrl: data.inviteUrl, createdAt: new Date().toISOString() });
      setLabel("");
      loadPending();
    }
    setLoading(false);
  }

  async function handleRevoke(id: string) {
    await fetch("/api/admin/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPending((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* Generator */}
      <form onSubmit={handleGenerate} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Friend's name or email (optional label)"
            className="input-wc26 flex-1"
          />
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors shrink-0">
            {loading ? "Generating…" : "Generate invite link"}
          </button>
        </div>
        <p className="text-xs text-blue-300/50 dark:text-blue-200/60">
          No email service needed — share the link via WhatsApp, Telegram, iMessage or any chat app.
        </p>
      </form>

      {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3">{error}</p>}

      {/* Newly generated link */}
      {newInvite && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
          <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">✅ Link ready — share it now</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-[#0c1630] border border-slate-200 dark:border-blue-900/40 rounded-lg px-3 py-2 break-all font-mono">
              {newInvite.inviteUrl}
            </code>
            <CopyButton text={newInvite.inviteUrl} />
            <WhatsAppButton url={newInvite.inviteUrl} label={newInvite.email} />
          </div>
        </div>
      )}

      {/* Pending invites */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Pending invites {!loadingPending && pending.length > 0 && <span className="text-blue-200/60">({pending.length})</span>}
          </p>
          {!loadingPending && pending.length > 0 && (
            <button onClick={loadPending} className="text-xs text-blue-200/60 hover:text-blue-300/70 dark:hover:text-slate-200 transition-colors">Refresh</button>
          )}
        </div>

        {loadingPending && <p className="text-blue-200/60 text-xs">Loading…</p>}

        {!loadingPending && pending.length === 0 && (
          <p className="text-blue-200/60 text-xs italic">No pending invites.</p>
        )}

        {!loadingPending && pending.map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--card-inner)] border border-[var(--card-border)]">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{inv.email}</p>
              <p className="text-[10px] text-blue-200/60 truncate font-mono mt-0.5">{inv.inviteUrl}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CopyButton text={inv.inviteUrl} />
              <WhatsAppButton url={inv.inviteUrl} label={inv.email} />
              <button onClick={() => handleRevoke(inv.id)}
                className="px-2 py-1.5 rounded-lg text-xs text-blue-200/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
