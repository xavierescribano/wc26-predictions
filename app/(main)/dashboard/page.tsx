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

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const [openPhase, users] = await Promise.all([
    prisma.phase.findFirst({ where: { isOpen: true }, orderBy: { order: "asc" } }),
    prisma.user.findMany({
      where: { role: "PLAYER" },
      include: {
        groupPredictions:    { select: { pointsEarned: true } },
        knockoutPicks:       { select: { pointsEarned: true } },
        goldenPick:          { include: { team: { select: { name: true, flagEmoji: true } } } },
        topScorerPlayerPick: { select: { pointsEarned: true } },
        topScorerTeamPick:   { select: { pointsEarned: true } },
        countriesFightPicks: { select: { pointsEarned: true } },
      },
    }),
  ]);

  const leaderboard = users
    .map((u) => {
      const groupPoints    = u.groupPredictions.reduce((s, g) => s + (g.pointsEarned ?? 0), 0);
      const knockoutPoints = u.knockoutPicks.reduce((s, k) => s + (k.pointsEarned ?? 0), 0);
      const goldenPoints   = u.goldenPick?.pointsEarned ?? 0;
      const specialPoints  = (u.topScorerPlayerPick?.pointsEarned ?? 0)
                           + (u.topScorerTeamPick?.pointsEarned ?? 0);
      const fightPoints    = u.countriesFightPicks.reduce((s, f) => s + (f.pointsEarned ?? 0), 0);
      const total          = groupPoints + knockoutPoints + goldenPoints + specialPoints + fightPoints;
      return {
        id: u.id,
        name: (u.name ?? u.email) as string,
        groupPoints,
        knockoutPoints,
        goldenPoints,
        specialPoints,
        fightPoints,
        total,
        goldenPick: u.goldenPick ?? null,
      };
    })
    .sort((a, b) => b.total - a.total);

  const myId = (session.user as { id: string }).id;
  const currentUser = leaderboard.find((u) => u.id === myId);
  const userRank = currentUser ? leaderboard.indexOf(currentUser) + 1 : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {(session.user as { name?: string }).name ?? (session.user as { email?: string }).email}
        </p>
      </div>

      {/* Phase Status + User Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Current Phase</p>
          {openPhase ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                OPEN
              </span>
              <span className="text-white font-semibold text-lg">{PHASE_LABELS[openPhase.type] ?? openPhase.type}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-700 text-slate-400 text-xs font-semibold">CLOSED</span>
              <span className="text-slate-400 font-medium">No phase currently open</span>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Ranking</p>
          {currentUser ? (
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-emerald-400">#{userRank}</span>
              <div className="mb-1">
                <span className="text-white font-bold text-lg">{currentUser.total}</span>
                <span className="text-slate-400 text-sm ml-1">pts</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">No picks yet</p>
          )}
        </div>
      </div>

      {/* Golden Pick banner */}
      {currentUser?.goldenPick && (
        <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-700/50 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Your Golden Pick</p>
          <div className="flex items-center gap-3">
            {currentUser.goldenPick.team.flagEmoji && (
              <span className="text-3xl">{currentUser.goldenPick.team.flagEmoji}</span>
            )}
            <div>
              <p className="text-white font-bold text-lg">{currentUser.goldenPick.team.name}</p>
              <p className="text-slate-400 text-sm">
                {currentUser.goldenPick.pointsEarned != null
                  ? `${currentUser.goldenPick.pointsEarned} pts earned`
                  : "Points pending"}
                {" · "}
                {currentUser.goldenPick.changes} change{currentUser.goldenPick.changes !== 1 ? "s" : ""} used
              </p>
            </div>
            {currentUser.goldenPick.isCorrect === true && (
              <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">CORRECT</span>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="text-white font-semibold text-lg">Leaderboard</h2>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-slate-700">
          {leaderboard.map((player, i) => {
            const isMe = player.id === myId;
            return (
              <div key={player.id} className={`px-5 py-4 flex items-center gap-4 ${isMe ? "bg-emerald-500/10" : ""}`}>
                <span className={`w-7 text-center font-bold shrink-0 ${
                  i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-500"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isMe ? "text-emerald-400" : "text-white"}`}>
                    {player.name} {isMe && <span className="text-xs opacity-60">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Groups: {player.groupPoints} · KO: {player.knockoutPoints} · Golden: {player.goldenPoints}
                    {player.specialPoints > 0 && ` · Specials: ${player.specialPoints}`}
                    {player.fightPoints > 0 && ` · Fight: ${player.fightPoints}`}
                  </p>
                </div>
                <span className="font-bold text-white shrink-0">{player.total}</span>
              </div>
            );
          })}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">Groups</th>
                <th className="px-4 py-3 text-right">Knockout</th>
                <th className="px-4 py-3 text-right">Golden</th>
                <th className="px-4 py-3 text-right">⭐ Specials</th>
                <th className="px-4 py-3 text-right">⚔️ Fight</th>
                <th className="px-4 py-3 text-right font-bold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {leaderboard.map((player, i) => {
                const isMe = player.id === myId;
                return (
                  <tr key={player.id} className={`transition-colors ${isMe ? "bg-emerald-500/10" : "hover:bg-slate-700/50"}`}>
                    <td className="px-4 py-4">
                      <span className={`font-bold ${
                        i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-500"
                      }`}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${isMe ? "text-emerald-400" : "text-white"}`}>
                        {player.name}
                      </span>
                      {isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-4 text-right text-slate-300">{player.groupPoints}</td>
                    <td className="px-4 py-4 text-right text-slate-300">{player.knockoutPoints}</td>
                    <td className="px-4 py-4 text-right text-slate-300">{player.goldenPoints}</td>
                    <td className="px-4 py-4 text-right text-slate-300">{player.specialPoints}</td>
                    <td className="px-4 py-4 text-right text-slate-300">{player.fightPoints}</td>
                    <td className="px-4 py-4 text-right font-bold text-white text-base">{player.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-500">No players yet.</div>
        )}
      </div>
    </div>
  );
}
