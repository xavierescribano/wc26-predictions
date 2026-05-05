import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const [fights, picks] = await Promise.all([
    prisma.countriesFight.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.countriesFightPick.findMany({ where: { userId } }),
  ]);

  return NextResponse.json({ fights, picks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { fightId, goalsA, goalsB } = await req.json();

  if (!fightId || goalsA === undefined || goalsB === undefined) {
    return NextResponse.json({ error: "fightId, goalsA and goalsB are required" }, { status: 400 });
  }
  if (!Number.isInteger(goalsA) || !Number.isInteger(goalsB) || goalsA < 0 || goalsB < 0) {
    return NextResponse.json({ error: "Goals must be non-negative integers" }, { status: 400 });
  }

  const fight = await prisma.countriesFight.findUnique({ where: { id: fightId } });
  if (!fight) return NextResponse.json({ error: "Fight not found" }, { status: 404 });
  if (!fight.isOpen) return NextResponse.json({ error: "This fight is closed for betting" }, { status: 400 });

  const pick = await prisma.countriesFightPick.upsert({
    where: { userId_fightId: { userId, fightId } },
    update: { goalsA, goalsB },
    create: { userId, fightId, goalsA, goalsB },
  });

  return NextResponse.json(pick);
}
