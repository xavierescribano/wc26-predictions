"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  totalPoints: number;
  goldenPick: { team: { name: string; flagEmoji: string | null }; changes: number } | null;
}

export function AdminUserList({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initial);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    setRemoving(userId);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    }
    setRemoving(null);
    setConfirmId(null);
  }

  if (users.length === 0) {
    return <p className="px-5 py-8 text-slate-500 text-sm text-center">No players yet.</p>;
  }

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Mobile list */}
      <div className="sm:hidden divide-y divide-slate-700">
        {users.map((u) => (
          <div key={u.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{u.name}</p>
                <p className="text-slate-400 text-xs truncate">{u.email}</p>
                {u.goldenPick && (
                  <p className="text-amber-400 text-xs mt-1">
                    Golden: {u.goldenPick.team.flagEmoji} {u.goldenPick.team.name}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-emerald-400 font-bold">{u.totalPoints} pts</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  u.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-400"
                }`}>{u.role}</span>
                {u.role !== "ADMIN" && (
                  confirmId === u.id ? (
                    <div className="flex gap-1 justify-end mt-1">
                      <button
                        onClick={() => handleRemove(u.id)}
                        disabled={removing === u.id}
                        className="px-2 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                      >
                        {removing === u.id ? "…" : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(u.id)}
                      className="block text-xs text-red-400 hover:text-red-300 transition-colors mt-1"
                    >
                      Remove
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 text-right">Total Pts</th>
              <th className="px-5 py-3">Golden Pick</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                <td className="px-5 py-4 font-medium text-white">{u.name}</td>
                <td className="px-5 py-4 text-slate-400">{u.email}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    u.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-400"
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-4 text-right font-bold text-emerald-400">{u.totalPoints}</td>
                <td className="px-5 py-4 text-slate-300">
                  {u.goldenPick ? (
                    <span>
                      {u.goldenPick.team.flagEmoji} {u.goldenPick.team.name}
                      <span className="text-slate-500 ml-2 text-xs">
                        ({u.goldenPick.changes} change{u.goldenPick.changes !== 1 ? "s" : ""})
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  {u.role !== "ADMIN" && (
                    confirmId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-400">Remove {u.name}?</span>
                        <button
                          onClick={() => handleRemove(u.id)}
                          disabled={removing === u.id}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                        >
                          {removing === u.id ? "Removing…" : "Yes, remove"}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-3 py-1 rounded-lg text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(u.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-600 transition-colors border border-transparent hover:border-red-500"
                      >
                        Remove
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
