import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

const MAX_GOLDEN_POINTS = 50;
const PENALTY_PER_CHANGE = 10;

function calcPotentialPoints(changes: number): number {
  return Math.max(0, MAX_GOLDEN_POINTS - changes * PENALTY_PER_CHANGE);
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const goldenPick = await prisma.goldenPick.findUnique({
    where: { userId },
    include: { team: true },
  });

  if (!goldenPick) {
    return NextResponse.json({ goldenPick: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      goldenPick,
      changes: goldenPick.changes,
      potentialPoints: calcPotentialPoints(goldenPick.changes),
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  let body: { teamId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { teamId } = body;
  if (!teamId || typeof teamId !== "string") {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  // Validate team exists
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const existing = await prisma.goldenPick.findUnique({ where: { userId } });

  let goldenPick;

  if (!existing) {
    // First pick — no change penalty yet
    goldenPick = await prisma.goldenPick.create({
      data: { userId, teamId, changes: 0 },
      include: { team: true },
    });
  } else {
    if (existing.teamId === teamId) {
      // No change, return current state
      return NextResponse.json(
        {
          message: "Team unchanged",
          goldenPick: existing,
          changes: existing.changes,
          potentialPoints: calcPotentialPoints(existing.changes),
        },
        { status: 200 }
      );
    }

    // Update teamId and increment changes
    goldenPick = await prisma.goldenPick.update({
      where: { userId },
      data: {
        teamId,
        changes: { increment: 1 },
      },
      include: { team: true },
    });
  }

  const potentialPoints = calcPotentialPoints(goldenPick.changes);
  const penaltyWarning =
    goldenPick.changes > 0
      ? `Each change reduces your potential points by ${PENALTY_PER_CHANGE}. Current potential: ${potentialPoints} points.`
      : undefined;

  return NextResponse.json(
    {
      message: existing ? "Golden pick updated" : "Golden pick created",
      goldenPick,
      changes: goldenPick.changes,
      potentialPoints,
      penaltyWarning,
    },
    { status: 200 }
  );
}
