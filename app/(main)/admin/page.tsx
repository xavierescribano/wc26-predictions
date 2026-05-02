import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPhaseToggle } from "@/components/admin/AdminPhaseToggle";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminResultForm } from "@/components/admin/AdminResultForm";
import { AdminGroupResultForm } from "@/components/admin/AdminGroupResultForm";
import { AdminResetButton } from "@/components/admin/AdminResetButton";

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTERFINALS: "Quarterfinals",
  SEMIFINALS: "Semifinals",
  FINAL: "Final",
};

export default async function AdminPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");
  if ((session.user as any).role !== "ADMIN") redirect("/dashboard");

  const [phases, users, openPhaseWithMatches, allTeams, existingGroupResults] = await Promise.all([
    prisma.phase.findMany({ orderBy: { order: "asc" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        groupPredictions: { select: { pointsEarned: true } },
        knockoutPicks: { select: { pointsEarned: true } },
        goldenPick: { include: { team: { select: { name: true, flagEmoji: true } } } },
      },
    }),
    prisma.phase.findFirst({
      where: {
        isOpen: true,
        type: { not: "GROUP_STAGE" },
      },
      include: {
        matches: {
          orderBy: { matchNumber: "asc" },
          include: {
            homeTeam: { select: { id: true, name: true, flagEmoji: true } },
            awayTeam: { select: { id: true, name: true, flagEmoji: true } },
          },
        },
      },
    }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.groupResult.findMany({ orderBy: { groupLetter: "asc" } }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usersWithTotals = (users as any[]).map((u: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groupPoints: number = (u.groupPredictions as any[]).reduce((s: number, g: any) => s + (g.pointsEarned ?? 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const knockoutPoints: number = (u.knockoutPicks as any[]).reduce((s: number, k: any) => s + (k.pointsEarned ?? 0), 0);
    const goldenPoints: number = u.goldenPick?.pointsEarned ?? 0;
    return {
      id: u.id as string,
      name: (u.name ?? "—") as string,
      email: u.email as string,
      role: u.role as string,
      totalPoints: groupPoints + knockoutPoints + goldenPoints,
      goldenPick: u.goldenPick ?? null,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchesForResults: any[] = (openPhaseWithMatches as any)?.matches ?? [];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 mt-1">Manage phases, invite players, enter results</p>
        </div>
        <AdminResetButton />
      </div>

      {/* ── Section 1: Phase Management ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Phase Management
        </h2>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden divide-y divide-slate-700">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(phases as any[]).map((phase: any) => (
            <div key={phase.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    phase.isOpen
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {phase.isOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {phase.isOpen ? "OPEN" : "CLOSED"}
                </span>
                <div>
                  <p className="text-white font-medium">{PHASE_LABELS[phase.type] ?? phase.type}</p>
                  <p className="text-slate-500 text-xs">Order #{phase.order}</p>
                </div>
              </div>
              <AdminPhaseToggle phaseId={phase.id} phaseType={phase.type} isOpen={phase.isOpen} />
            </div>
          ))}
          {phases.length === 0 && (
            <p className="px-5 py-8 text-slate-500 text-sm text-center">No phases found. Run the seed script.</p>
          )}
        </div>
      </section>

      {/* ── Section 2: Invite Players ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Invite Players
        </h2>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <p className="text-slate-400 text-sm mb-4">
            Enter an email address to generate an invite link. The player can use the link to create their account.
          </p>
          <AdminInviteForm />
        </div>
      </section>

      {/* ── Section 3: All Players & Picks ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          All Players
        </h2>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-slate-700">
            {usersWithTotals.map((u) => (
              <div key={u.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold">{u.name}</p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                    {u.goldenPick && (
                      <p className="text-amber-400 text-xs mt-1">
                        Golden: {u.goldenPick.team.flagEmoji} {u.goldenPick.team.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-emerald-400 font-bold">{u.totalPoints} pts</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {u.role}
                    </span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {usersWithTotals.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-4 text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {u.role}
                      </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usersWithTotals.length === 0 && (
            <p className="px-5 py-8 text-slate-500 text-sm text-center">No players yet.</p>
          )}
        </div>
      </section>

      {/* ── Section 4: Group Stage Results ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Group Stage Results
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Enter the official final standings for each group. This will automatically score all player predictions.
        </p>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <AdminGroupResultForm teams={allTeams} existingResults={existingGroupResults} />
        </div>
      </section>

      {/* ── Section 5: Enter Match Results ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Enter Match Results
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {openPhaseWithMatches
            ? `Showing matches for the open phase: ${PHASE_LABELS[openPhaseWithMatches.type] ?? openPhaseWithMatches.type}`
            : "Open a knockout phase to enter results here."}
        </p>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <AdminResultForm matches={matchesForResults} />
        </div>
      </section>
    </div>
  );
}
