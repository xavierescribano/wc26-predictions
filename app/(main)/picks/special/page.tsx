import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SpecialPicksClient } from "@/components/SpecialPicksClient";

export default async function SpecialPicksPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const [groupPhase, teams, playerPick, teamPick, goldenPick] = await Promise.all([
    prisma.phase.findUnique({ where: { type: "GROUP_STAGE" } }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.topScorerPlayerPick.findUnique({ where: { userId } }),
    prisma.topScorerTeamPick.findUnique({ where: { userId }, include: { team: true } }),
    prisma.goldenPick.findUnique({ where: { userId }, include: { team: true } }),
  ]);

  const groupStageOpen = groupPhase?.isOpen ?? false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">⭐ Special Picks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {groupStageOpen
            ? "Place your special bets — available while the Group Stage is open."
            : "Special picks are locked. The Group Stage is closed."}
        </p>
      </div>

      {!groupStageOpen && !playerPick && !teamPick && !goldenPick && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-amber-600 dark:text-amber-400 text-sm">
          ⚠️ The Group Stage is not open yet. Special picks will be available once the admin opens the Group Stage.
        </div>
      )}

      <SpecialPicksClient
        groupStageOpen={groupStageOpen}
        teams={teams}
        initialPlayerPick={playerPick ? { playerName: playerPick.playerName } : null}
        initialTeamPick={teamPick ? { teamId: teamPick.teamId, teamName: teamPick.team.name, teamFlag: teamPick.team.flagEmoji } : null}
        initialGoldenPick={goldenPick ? { teamId: goldenPick.teamId, teamName: goldenPick.team.name, teamFlag: goldenPick.team.flagEmoji, changes: goldenPick.changes } : null}
      />
    </div>
  );
}
