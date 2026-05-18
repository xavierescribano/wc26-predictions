import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

const PLAYER_PTS = 25;
const TEAM_PTS   = 25;

// GET — return all submissions so the admin can review them
export async function GET() {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [playerPicks, teamPicks] = await Promise.all([
    prisma.topScorerPlayerPick.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.topScorerTeamPick.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true, flagEmoji: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ playerPicks, teamPicks });
}

// POST — score picks
// type="player": admin provides correctUserIds[]  → those get 25 pts, rest 0
// type="team":   admin provides correctTeamId     → auto-scores everyone
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { type, correctUserIds, correctTeamId } = body;

  if (type === "player") {
    if (!Array.isArray(correctUserIds))
      return NextResponse.json({ error: "correctUserIds must be an array" }, { status: 400 });

    const all = await prisma.topScorerPlayerPick.findMany();
    await Promise.all(
      all.map((pick) => {
        const isCorrect = correctUserIds.includes(pick.userId);
        return prisma.topScorerPlayerPick.update({
          where: { id: pick.id },
          data: { isCorrect, pointsEarned: isCorrect ? PLAYER_PTS : 0 },
        });
      })
    );
    return NextResponse.json({ ok: true, scored: all.length });
  }

  if (type === "team") {
    if (!correctTeamId)
      return NextResponse.json({ error: "correctTeamId is required" }, { status: 400 });

    const all = await prisma.topScorerTeamPick.findMany();
    await Promise.all(
      all.map((pick) => {
        const isCorrect = pick.teamId === correctTeamId;
        return prisma.topScorerTeamPick.update({
          where: { id: pick.id },
          data: { isCorrect, pointsEarned: isCorrect ? TEAM_PTS : 0 },
        });
      })
    );
    return NextResponse.json({ ok: true, scored: all.length });
  }

  return NextResponse.json({ error: "type must be 'player' or 'team'" }, { status: 400 });
}
