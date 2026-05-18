import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PhaseType } from "@prisma/client";
import { GroupPickGrid } from "@/components/GroupPickGrid";

export const dynamic = "force-dynamic";

export default async function GroupPicksPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  // Fetch GROUP_STAGE phase
  const phase = await prisma.phase.findUnique({
    where: { type: PhaseType.GROUP_STAGE },
  });

  // Fetch all teams grouped by their group letter
  const allTeams = await prisma.team.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  // Group teams by their group letter
  const teamsByGroup: Record<string, typeof allTeams> = {};
  for (const team of allTeams) {
    if (!teamsByGroup[team.group]) {
      teamsByGroup[team.group] = [];
    }
    teamsByGroup[team.group].push(team);
  }

  // Fetch current user's group predictions
  const predictions = await prisma.groupPrediction.findMany({
    where: { userId },
    include: {
      position1: true,
      position2: true,
      position3: true,
      position4: true,
    },
    orderBy: { groupLetter: "asc" },
  });

  const isOpen = phase?.isOpen ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Group Stage Picks</h1>
          <p className="text-blue-200/60 text-sm mt-1">
            Predict the final standings for all 12 groups
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
          Group stage picks are closed. Results and points are shown below.
        </div>
      )}

      <GroupPickGrid
        teamsByGroup={teamsByGroup}
        existingPredictions={predictions}
        isOpen={isOpen}
      />
    </div>
  );
}
