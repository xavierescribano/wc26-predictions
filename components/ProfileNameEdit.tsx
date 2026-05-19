"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function ProfileNameEdit({ initialName }: { initialName: string }) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) { setEditing(false); setDraft(name); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    if (res.ok) {
      setName(data.name);
      setDraft(data.name);
      setEditing(false);
      await updateSession({ name: data.name });
      router.refresh();
    } else {
      setError(data.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setDraft(name); setError(null); }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={30}
            className="text-xl font-bold bg-[#080e1f] border border-blue-600/60 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <button
            onClick={handleSave}
            disabled={saving || !draft.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? "…" : "Guardar"}
          </button>
          <button
            onClick={() => { setEditing(false); setDraft(name); setError(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0f1e3d] hover:bg-[#162040] text-blue-200/60 transition-colors"
          >
            Cancelar
          </button>
        </div>
        <div className="flex items-center justify-between pl-1">
          {error
            ? <p className="text-xs text-red-400">{error}</p>
            : <p className="text-xs text-blue-300/40">Máx. 30 caracteres · Enter para guardar · Esc para cancelar</p>
          }
          <p className="text-xs text-blue-300/40">{draft.length}/30</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-white">{name}</h1>
      <button
        onClick={() => setEditing(true)}
        title="Editar nombre"
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-blue-300/50 hover:text-blue-300 hover:bg-blue-900/30 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}
