import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhaseType } from "@prisma/client";
import { KnockoutPickGrid } from "@/components/KnockoutPickGrid";

export const dynamic = "force-dynamic";

const PHASE_URL_MAP: Record<string, PhaseType> = {
  "round-of-32": PhaseType.ROUND_OF_32,
  "round-of-16": PhaseType.ROUND_OF_16,
  quarterfinals: PhaseType.QUARTERFINALS,
  semifinals: PhaseType.SEMIFINALS,
  final: PhaseType.FINAL,
};

const PHASE_LABELS: Record<PhaseType, string> = {
  [PhaseType.GROUP_STAGE]: "Group Stage",
  [PhaseType.ROUND_OF_32]: "Round of 32",
  [PhaseType.ROUND_OF_16]: "Round of 16",
  [PhaseType.QUARTERFINALS]: "Quarter Finals",
  [PhaseType.SEMIFINALS]: "Semi Finals",
  [PhaseType.FINAL]: "Final",
};

interface PageProps {
  params: { phase: string };
}

export default async function KnockoutPicksPage({ params }: PageProps) {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const phaseType = PHASE_URL_MAP[params.phase.toLowerCase()];
  if (!phaseType) redirect("/dashboard");

  // Fetch phase with matches and teams
  const phase = await prisma.phase.findUnique({
    where: { type: phaseType },
    include: {
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          winner: true,
        },
        orderBy: { matchNumber: "asc" },
      },
    },
  });

  if (!phase) redirect("/dashboard");

  // Fetch user's picks for this phase
  const userPicks = await prisma.knockoutPick.findMany({
    where: {
      userId,
      match: { phaseId: phase.id },
    },
    include: {
      pickedTeam: true,
    },
  });

  const isOpen = phase.isOpen;
  const label = PHASE_LABELS[phaseType];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{label} Picks</h1>
          <p className="text-blue-200/60 text-sm mt-1">
            Pick the winner for each match
            {phaseType === PhaseType.FINAL && " and predict the score"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isOpen
                ? "bg-blue-500/20 text-blue-400 border border-emerald-500/30"
                : "bg-[#0f1e3d] text-blue-200/60 border border-blue-800/40"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-slate-500"}`}
            />
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {!isOpen && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-300 text-sm">
          {label} picks are closed. Results and points are shown below.
        </div>
      )}

      {phase.matches.length === 0 ? (
        <div className="rounded-lg bg-[#0c1630] border border-blue-900/40 p-8 text-center text-blue-200/60">
          No matches have been scheduled for this phase yet.
        </div>
      ) : (
        <KnockoutPickGrid
          matches={phase.matches}
          userPicks={userPicks}
          isOpen={isOpen}
          isFinal={phaseType === PhaseType.FINAL}
        />
      )}
    </div>
  );
}
