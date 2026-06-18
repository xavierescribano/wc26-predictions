import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminPhaseToggle } from "@/components/admin/AdminPhaseToggle";
import { AdminInviteForm } from "@/components/admin/AdminInviteForm";
import { AdminResultForm } from "@/components/admin/AdminResultForm";
import { AdminGroupResultForm } from "@/components/admin/AdminGroupResultForm";
import { AdminResetButton } from "@/components/admin/AdminResetButton";
import { AdminUserList } from "@/components/admin/AdminUserList";
import { AdminCountriesFight } from "@/components/admin/AdminCountriesFight";
import { AdminSpecialPicks } from "@/components/admin/AdminSpecialPicks";
import { AdminManualPoints } from "@/components/admin/AdminManualPoints";

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

  const [phases, users, openPhaseWithMatches, allTeams, existingGroupResults, countriesFights] = await Promise.all([
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
    prisma.countriesFight.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { picks: true } } } }),
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
          <p className="text-blue-200/60 mt-1">Manage phases, invite players, enter results</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/admin/export"
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 hover:bg-blue-600 text-white transition-colors border border-blue-600/50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Excel
          </a>
          <AdminResetButton />
        </div>
      </div>

      {/* ── Section 1: Phase Management ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Phase Management
        </h2>
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 overflow-hidden divide-y divide-blue-900/30">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(phases as any[]).map((phase: any) => (
            <div key={phase.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    phase.isOpen
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-[#0f1e3d] text-blue-200/60"
                  }`}
                >
                  {phase.isOpen && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                  {phase.isOpen ? "OPEN" : "CLOSED"}
                </span>
                <div>
                  <p className="text-white font-medium">{PHASE_LABELS[phase.type] ?? phase.type}</p>
                  <p className="text-blue-300/50 text-xs">Order #{phase.order}</p>
                </div>
              </div>
              <AdminPhaseToggle phaseId={phase.id} phaseType={phase.type} isOpen={phase.isOpen} />
            </div>
          ))}
          {phases.length === 0 && (
            <p className="px-5 py-8 text-blue-300/50 text-sm text-center">No phases found. Run the seed script.</p>
          )}
        </div>
      </section>

      {/* ── Section 2: Invite Players ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Invite Players
        </h2>
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 p-5">
          <p className="text-blue-200/60 text-sm mb-4">
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
        <AdminUserList users={usersWithTotals} />
      </section>

      {/* ── Section 4: Group Stage Results ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Group Stage Results
        </h2>
        <p className="text-blue-200/60 text-sm mb-4">
          Enter the official final standings for each group. This will automatically score all player predictions.
        </p>
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 p-5">
          <AdminGroupResultForm teams={allTeams} existingResults={existingGroupResults} />
        </div>
      </section>

      {/* ── Section 5: Enter Match Results ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Enter Match Results
        </h2>
        <p className="text-blue-200/60 text-sm mb-4">
          {openPhaseWithMatches
            ? `Showing matches for the open phase: ${PHASE_LABELS[openPhaseWithMatches.type] ?? openPhaseWithMatches.type}`
            : "Open a knockout phase to enter results here."}
        </p>
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 p-5">
          <AdminResultForm matches={matchesForResults} />
        </div>
      </section>

      {/* ── Special Picks Scoring ── */}
      <section className="bg-[#0c1630]/80 rounded-2xl border border-blue-900/40 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">⭐ Apuestas Especiales — Puntuación</h2>
          <p className="text-blue-200/60 text-sm mt-1">
            Marca qué jugadores acertaron el máximo goleador y selecciona el equipo más goleador real.
          </p>
        </div>
        <AdminSpecialPicks teams={allTeams} />
      </section>

      {/* ── Manual Points ── */}
      <section className="bg-[#0c1630]/80 rounded-2xl border border-blue-900/40 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">🎯 Ajuste Manual de Puntos</h2>
          <p className="text-blue-200/60 text-sm mt-1">
            Añade o resta puntos a cualquier jugador. Cada ajuste queda registrado con su motivo.
          </p>
        </div>
        <AdminManualPoints users={usersWithTotals.filter((u) => u.role !== "ADMIN").map((u) => ({ id: u.id, name: u.name, email: u.email }))} />
      </section>

      {/* Countries Fight */}
      <section className="bg-[#0c1630]/80 rounded-2xl border border-blue-900/40 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">⚔️ Countries Fight</h2>
          <p className="text-blue-200/60 text-sm mt-1">Create matchup bets — users pick the winner, +10 pts if correct</p>
        </div>
        <AdminCountriesFight fights={countriesFights} />
      </section>

    </div>
  );
}
