import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CountriesFightGrid } from "@/components/CountriesFightGrid";

export default async function CountriesFightPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const [fights, picks] = await Promise.all([
    prisma.countriesFight.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.countriesFightPick.findMany({ where: { userId } }),
  ]);

  const totalPoints = picks.reduce((s, p) => s + (p.pointsEarned ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">⚔️ Countries Fight</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pick the winner of each matchup — +10 pts for each correct prediction</p>
        </div>
        {totalPoints > 0 && (
          <span className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            +{totalPoints} pts earned
          </span>
        )}
      </div>

      {fights.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-10 text-center text-slate-400">
          No Countries Fight matchups yet — check back soon!
        </div>
      ) : (
        <CountriesFightGrid
          fights={fights.map((f) => ({
            id: f.id,
            title: f.title,
            teamAName: f.teamAName,
            teamBName: f.teamBName,
            isOpen: f.isOpen,
            result: f.result,
          }))}
          picks={picks.map((p) => ({
            fightId: p.fightId,
            prediction: p.prediction,
            isCorrect: p.isCorrect,
            pointsEarned: p.pointsEarned,
          }))}
        />
      )}
    </div>
  );
}
