import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoldenPickCard } from "@/components/GoldenPickCard";

export const dynamic = "force-dynamic";

export default async function GoldenPickPage() {
  const session = await getServerSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [goldenPick, allTeams] = await Promise.all([
    prisma.goldenPick.findUnique({
      where: { userId },
      include: { team: true },
    }),
    prisma.team.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Golden Pick</h1>
        <p className="text-blue-200/60 text-sm mt-1">
          Pick the team you think will win the World Cup. Worth up to{" "}
          <span className="text-emerald-400 font-semibold">50 points</span> — but changing your
          pick costs 10 points each time.
        </p>
      </div>

      <GoldenPickCard goldenPick={goldenPick} allTeams={allTeams} />
    </div>
  );
}
