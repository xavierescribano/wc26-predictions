import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") return null;
  return session;
}

// GET all fights
export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fights = await prisma.countriesFight.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { picks: true } } },
  });
  return NextResponse.json(fights);
}

// POST create fight
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, teamAName, teamBName } = await req.json();
  if (!title?.trim() || !teamAName?.trim() || !teamBName?.trim()) {
    return NextResponse.json({ error: "title, teamAName, teamBName are required" }, { status: 400 });
  }
  const fight = await prisma.countriesFight.create({
    data: { title: title.trim(), teamAName: teamAName.trim(), teamBName: teamBName.trim() },
  });
  return NextResponse.json(fight, { status: 201 });
}

// PATCH update fight (toggle open/close or set result)
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { fightId, isOpen, result } = await req.json();
  if (!fightId) return NextResponse.json({ error: "fightId required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof isOpen === "boolean") data.isOpen = isOpen;
  if (result !== undefined) {
    if (!["A", "B", "draw"].includes(result)) {
      return NextResponse.json({ error: "result must be A, B, or draw" }, { status: 400 });
    }
    data.result = result;
    data.isOpen = false;
    // Score picks
    const fight = await prisma.countriesFight.findUnique({ where: { id: fightId }, include: { picks: true } });
    if (fight) {
      await Promise.all(fight.picks.map((pick) =>
        prisma.countriesFightPick.update({
          where: { id: pick.id },
          data: { isCorrect: pick.prediction === result, pointsEarned: pick.prediction === result ? 10 : 0 },
        })
      ));
    }
  }

  const updated = await prisma.countriesFight.update({ where: { id: fightId }, data });
  return NextResponse.json(updated);
}

// DELETE fight
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { fightId } = await req.json();
  if (!fightId) return NextResponse.json({ error: "fightId required" }, { status: 400 });
  await prisma.countriesFightPick.deleteMany({ where: { fightId } });
  await prisma.countriesFight.delete({ where: { id: fightId } });
  return NextResponse.json({ ok: true });
}
