import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fights = await prisma.countriesFight.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { picks: true } } },
  });
  return NextResponse.json(fights);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, teamAName, teamBName } = await req.json();
  if (!title?.trim() || !teamAName?.trim() || !teamBName?.trim()) {
    return NextResponse.json({ error: "title, teamAName and teamBName are required" }, { status: 400 });
  }
  const fight = await prisma.countriesFight.create({
    data: { title: title.trim(), teamAName: teamAName.trim(), teamBName: teamBName.trim() },
    include: { _count: { select: { picks: true } } },
  });
  return NextResponse.json(fight, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { fightId, isOpen, resultA, resultB } = await req.json();
  if (!fightId) return NextResponse.json({ error: "fightId required" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if (typeof isOpen === "boolean") data.isOpen = isOpen;

  if (resultA !== undefined && resultB !== undefined) {
    if (!Number.isInteger(resultA) || !Number.isInteger(resultB) || resultA < 0 || resultB < 0) {
      return NextResponse.json({ error: "Results must be non-negative integers" }, { status: 400 });
    }
    data.resultA = resultA;
    data.resultB = resultB;
    data.isOpen = false;

    // Score all picks: exact score = +10 pts
    const fight = await prisma.countriesFight.findUnique({ where: { id: fightId }, include: { picks: true } });
    if (fight) {
      await Promise.all(fight.picks.map((pick) => {
        const correct = pick.goalsA === resultA && pick.goalsB === resultB;
        return prisma.countriesFightPick.update({
          where: { id: pick.id },
          data: { isCorrect: correct, pointsEarned: correct ? 10 : 0 },
        });
      }));
    }
  }

  const updated = await prisma.countriesFight.update({ where: { id: fightId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { fightId } = await req.json();
  if (!fightId) return NextResponse.json({ error: "fightId required" }, { status: 400 });
  await prisma.countriesFightPick.deleteMany({ where: { fightId } });
  await prisma.countriesFight.delete({ where: { id: fightId } });
  return NextResponse.json({ ok: true });
}
