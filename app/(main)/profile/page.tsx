import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTERFINALS: "Quarterfinals",
  SEMIFINALS: "Semifinals",
  FINAL: "Final",
};

const PHASE_ORDER = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTERFINALS",
  "SEMIFINALS",
  "FINAL",
];

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string; // eslint-disable-line @typescript-eslint/no-explicit-any

  const [userRaw, allUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupPredictions: {
          orderBy: { groupLetter: "asc" },
          include: {
            position1: { select: { name: true, flagEmoji: true } },
            position2: { select: { name: true, flagEmoji: true } },
            position3: { select: { name: true, flagEmoji: true } },
            position4: { select: { name: true, flagEmoji: true } },
          },
        },
        knockoutPicks: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            match: {
              include: {
                phase: { select: { type: true } },
                homeTeam: { select: { name: true, flagEmoji: true } },
                awayTeam: { select: { name: true, flagEmoji: true } },
              },
            },
            pickedTeam: { select: { name: true, flagEmoji: true } },
          },
        },
        goldenPick: {
          include: { team: { select: { name: true, flagEmoji: true } } },
        },
      },
    }),
    prisma.user.findMany({
      include: {
        groupPredictions: { select: { pointsEarned: true } },
        knockoutPicks: { select: { pointsEarned: true } },
        goldenPick: { select: { pointsEarned: true } },
      },
    }),
  ]);

  if (!userRaw) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = userRaw as any;

  // Compute totals for ranking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ranked = (allUsers as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ru: any) => ({
      id: ru.id as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      total: (ru.groupPredictions as any[]).reduce((s: number, g: any) => s + (g.pointsEarned ?? 0), 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        + (ru.knockoutPicks as any[]).reduce((s: number, k: any) => s + (k.pointsEarned ?? 0), 0)
        + ((ru.goldenPick?.pointsEarned as number) ?? 0),
    }))
    .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

  const rank = ranked.findIndex((r: { id: string }) => r.id === userId) + 1;
  const myEntry = ranked.find((r: { id: string }) => r.id === userId) as { id: string; total: number } | undefined;
  const totalPoints = myEntry?.total ?? 0;

  // Points by phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupTotal: number = (u.groupPredictions as any[]).reduce((s: number, g: any) => s + (g.pointsEarned ?? 0), 0);

  const pointsByPhase: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const kp of u.knockoutPicks as any[]) {
    const phaseType: string = kp.match.phase.type;
    pointsByPhase[phaseType] = (pointsByPhase[phaseType] ?? 0) + (kp.pointsEarned ?? 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupPredictions: any[] = u.groupPredictions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const knockoutPicks: any[] = u.knockoutPicks;
  const goldenPick = u.goldenPick;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-blue-900/40 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
            <span className="text-emerald-400 text-2xl font-black">
              {((u.name ?? u.email ?? "?") as string)[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{u.name ?? "Unnamed Player"}</h1>
            <p className="text-blue-200/60 text-sm">{u.email}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-emerald-400">{totalPoints}</p>
              <p className="text-xs text-blue-200/60 uppercase tracking-wider">Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">#{rank}</p>
              <p className="text-xs text-blue-200/60 uppercase tracking-wider">Rank</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-blue-900/40">
          <h2 className="text-white font-semibold text-lg">Points Breakdown</h2>
        </div>
        <div className="divide-y divide-blue-900/30">
          {/* Group Stage */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-white font-medium">Group Stage</p>
              <p className="text-blue-200/60 text-xs">{groupPredictions.length} groups predicted</p>
            </div>
            <span className="font-bold text-emerald-400 text-lg">{groupTotal} pts</span>
          </div>

          {/* Knockout phases */}
          {PHASE_ORDER.filter((p) => p !== "GROUP_STAGE").map((phaseType) => {
            const pts = pointsByPhase[phaseType] ?? 0;
            const picksForPhase = knockoutPicks.filter((kp: any) => kp.match.phase.type === phaseType); // eslint-disable-line @typescript-eslint/no-explicit-any
            return (
              <div key={phaseType} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-white font-medium">{PHASE_LABELS[phaseType]}</p>
                  <p className="text-blue-200/60 text-xs">{picksForPhase.length} pick{picksForPhase.length !== 1 ? "s" : ""}</p>
                </div>
                <span className={`font-bold text-lg ${pts > 0 ? "text-emerald-400" : "text-blue-300/50"}`}>{pts} pts</span>
              </div>
            );
          })}

          {/* Golden Pick */}
          <div className="flex items-center justify-between px-5 py-4 bg-amber-900/10">
            <div>
              <p className="text-white font-medium">Golden Pick</p>
              {goldenPick ? (
                <p className="text-blue-200/60 text-xs">
                  {goldenPick.team.flagEmoji} {goldenPick.team.name} · {goldenPick.changes} change{goldenPick.changes !== 1 ? "s" : ""} used
                </p>
              ) : (
                <p className="text-blue-200/60 text-xs">No pick yet</p>
              )}
            </div>
            <span className={`font-bold text-lg ${(goldenPick?.pointsEarned ?? 0) > 0 ? "text-amber-400" : "text-blue-300/50"}`}>
              {goldenPick?.pointsEarned ?? 0} pts
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#0f1e3d]/60">
            <p className="text-white font-bold text-lg">Total</p>
            <span className="font-black text-xl text-emerald-400">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* Group Predictions */}
      {groupPredictions.length > 0 && (
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-900/40">
            <h2 className="text-white font-semibold text-lg">Group Predictions</h2>
            <p className="text-blue-200/60 text-sm mt-0.5">Final standings you predicted for each group</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {groupPredictions.map((gp: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={gp.id} className="bg-[#0f1e3d]/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                    Group {gp.groupLetter}
                  </span>
                  {gp.pointsEarned != null && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {gp.pointsEarned} pts
                    </span>
                  )}
                </div>
                <ol className="space-y-1.5">
                  {[gp.position1, gp.position2, gp.position3, gp.position4].map((team: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs text-blue-200/60 font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      {team.flagEmoji && <span>{team.flagEmoji}</span>}
                      <span className="text-white font-medium truncate">{team.name}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Knockout Picks */}
      {knockoutPicks.length > 0 && (
        <div className="bg-[#0c1630] rounded-2xl border border-blue-900/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-900/40">
            <h2 className="text-white font-semibold text-lg">Knockout Picks</h2>
          </div>
          <div className="divide-y divide-blue-900/30">
            {knockoutPicks.map((kp: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={kp.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0f1e3d] text-blue-200/60">
                      {PHASE_LABELS[kp.match.phase.type as string] ?? kp.match.phase.type}
                    </span>
                  </div>
                  <p className="text-blue-200/60 text-sm">
                    {kp.match.homeTeam?.flagEmoji} {kp.match.homeTeam?.name ?? "TBD"}
                    {" vs "}
                    {kp.match.awayTeam?.flagEmoji} {kp.match.awayTeam?.name ?? "TBD"}
                  </p>
                  <p className="text-white font-medium text-sm mt-0.5">
                    Pick: {kp.pickedTeam.flagEmoji} {kp.pickedTeam.name}
                    {kp.predictedHomeScore != null && kp.predictedAwayScore != null && (
                      <span className="text-blue-200/60 ml-2">({kp.predictedHomeScore}–{kp.predictedAwayScore})</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {kp.isCorrect === true && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 block mb-1">
                      CORRECT
                    </span>
                  )}
                  {kp.isCorrect === false && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/20 text-red-400 block mb-1">
                      WRONG
                    </span>
                  )}
                  {kp.pointsEarned != null ? (
                    <span className="font-bold text-white">{kp.pointsEarned} pts</span>
                  ) : (
                    <span className="text-blue-300/50 text-sm">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groupPredictions.length === 0 && knockoutPicks.length === 0 && (
        <div className="text-center py-16 text-blue-300/50">
          <p className="text-lg">No picks yet.</p>
          <p className="text-sm mt-2">Come back when betting phases open.</p>
        </div>
      )}
    </div>
  );
}
