import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PhaseType } from "@prisma/client";

export const dynamic = "force-dynamic";

const KNOCKOUT_PHASES = [
  { type: PhaseType.ROUND_OF_32,   urlSlug: "round-of-32",   label: "Round of 32",  icon: "🏆", matchCount: 16 },
  { type: PhaseType.ROUND_OF_16,   urlSlug: "round-of-16",   label: "Round of 16",  icon: "⚽", matchCount: 8  },
  { type: PhaseType.QUARTERFINALS, urlSlug: "quarterfinals",  label: "Cuartos de Final", icon: "🎯", matchCount: 4 },
  { type: PhaseType.SEMIFINALS,    urlSlug: "semifinals",     label: "Semifinales",  icon: "🔥", matchCount: 2  },
  { type: PhaseType.FINAL,         urlSlug: "final",          label: "Gran Final",   icon: "🥇", matchCount: 1  },
];

export default async function KnockoutHubPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const phases = await prisma.phase.findMany({
    where: { type: { not: PhaseType.GROUP_STAGE } },
    include: {
      matches: {
        select: {
          id: true,
          homeTeamId: true,
          awayTeamId: true,
          winnerId: true,
          knockoutPicks: {
            where: { userId },
            select: { id: true, isCorrect: true, pointsEarned: true },
          },
        },
      },
    },
  });

  const phaseMap = Object.fromEntries(phases.map((p) => [p.type, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Knock<span className="text-red-500">out</span>
        </h1>
        <p className="text-blue-300/50 mt-1 text-sm">
          Selecciona el ganador de cada partido en cada ronda eliminatoria
        </p>
      </div>

      <div className="space-y-3">
        {KNOCKOUT_PHASES.map((kp) => {
          const phase = phaseMap[kp.type];
          const isOpen = phase?.isOpen ?? false;
          const matchesWithTeams = phase?.matches.filter((m) => m.homeTeamId && m.awayTeamId) ?? [];
          const totalMatches = matchesWithTeams.length;
          const pickedCount  = matchesWithTeams.filter((m) =>
            m.knockoutPicks.length > 0
          ).length;
          const pointsEarned = phase?.matches.reduce((sum, m) =>
            sum + (m.knockoutPicks[0]?.pointsEarned ?? 0), 0
          ) ?? 0;
          const hasMatches = totalMatches > 0;
          const allDone    = phase?.matches.every((m) => m.winnerId != null) ?? false;

          return (
            <Link
              key={kp.type}
              href={`/picks/${kp.urlSlug}`}
              className={`block rounded-2xl border transition-all ${
                isOpen
                  ? "bg-[#0c1630] border-blue-600/40 hover:border-blue-500/60 hover:bg-[#0f1e3d]"
                  : "bg-[#0c1630] border-blue-900/40 hover:border-blue-800/50"
              }`}
            >
              <div className="px-5 py-4 flex items-center gap-4">
                <span className="text-2xl shrink-0">{kp.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">{kp.label}</span>
                    {isOpen && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        ABIERTO
                      </span>
                    )}
                    {allDone && !isOpen && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        FINALIZADO
                      </span>
                    )}
                    {!hasMatches && !isOpen && (
                      <span className="px-2 py-0.5 rounded-full bg-[#0f1e3d] text-blue-300/40 text-xs">
                        Por configurar
                      </span>
                    )}
                  </div>
                  <p className="text-blue-200/50 text-xs mt-0.5">
                    {hasMatches
                      ? isOpen
                        ? `${pickedCount}/${totalMatches} apuestas realizadas`
                        : allDone
                          ? `${pointsEarned} pts ganados`
                          : `${totalMatches} partidos — cerrado`
                      : "Sin partidos configurados todavía"}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {allDone && pointsEarned > 0 && (
                    <span className="text-sm font-bold text-emerald-400">+{pointsEarned} pts</span>
                  )}
                  <svg className="w-4 h-4 text-blue-300/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-blue-300/30 text-xs">
        Las apuestas se guardan automáticamente al seleccionar un equipo
      </p>
    </div>
  );
}
