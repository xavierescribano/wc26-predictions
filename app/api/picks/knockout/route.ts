import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PhaseType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const phaseParam = searchParams.get("phase");

  if (!phaseParam) {
    return NextResponse.json({ error: "Query parameter 'phase' is required" }, { status: 400 });
  }

  const validPhaseTypes = Object.values(PhaseType) as string[];
  if (!validPhaseTypes.includes(phaseParam)) {
    return NextResponse.json(
      { error: `Invalid phase. Must be one of: ${validPhaseTypes.join(", ")}` },
      { status: 400 }
    );
  }

  if (phaseParam === PhaseType.GROUP_STAGE) {
    return NextResponse.json(
      { error: "Use /api/picks/groups for GROUP_STAGE predictions" },
      { status: 400 }
    );
  }

  const phase = await prisma.phase.findUnique({
    where: { type: phaseParam as PhaseType },
  });
  if (!phase) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  const picks = await prisma.knockoutPick.findMany({
    where: {
      userId,
      match: { phaseId: phase.id },
    },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
          winner: true,
          phase: true,
        },
      },
      pickedTeam: true,
    },
    orderBy: { match: { matchNumber: "asc" } },
  });

  return NextResponse.json({ phase, picks }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  let body: {
    matchId?: string;
    pickedTeamId?: string;
    predictedHomeScore?: number;
    predictedAwayScore?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { matchId, pickedTeamId, predictedHomeScore, predictedAwayScore } = body;

  if (!matchId || !pickedTeamId) {
    return NextResponse.json(
      { error: "matchId and pickedTeamId are required" },
      { status: 400 }
    );
  }

  // Fetch the match with its phase
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { phase: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.phase.type === PhaseType.GROUP_STAGE) {
    return NextResponse.json(
      { error: "Use /api/picks/groups for GROUP_STAGE predictions" },
      { status: 400 }
    );
  }

  // Check the phase is open
  if (!match.phase.isOpen) {
    return NextResponse.json(
      { error: `Phase ${match.phase.type} is currently closed for picks` },
      { status: 403 }
    );
  }

  // Validate pickedTeamId: if teams are set, it must be homeTeam or awayTeam
  if (match.homeTeamId && match.awayTeamId) {
    if (pickedTeamId !== match.homeTeamId && pickedTeamId !== match.awayTeamId) {
      return NextResponse.json(
        { error: "pickedTeamId must be one of the match's home or away team" },
        { status: 400 }
      );
    }
  } else {
    // Teams not set yet — validate the team exists at minimum
    const team = await prisma.team.findUnique({ where: { id: pickedTeamId } });
    if (!team) {
      return NextResponse.json({ error: "Picked team not found" }, { status: 404 });
    }
  }

  // Validate optional score fields
  if (
    predictedHomeScore !== undefined &&
    (typeof predictedHomeScore !== "number" || predictedHomeScore < 0)
  ) {
    return NextResponse.json(
      { error: "predictedHomeScore must be a non-negative number" },
      { status: 400 }
    );
  }
  if (
    predictedAwayScore !== undefined &&
    (typeof predictedAwayScore !== "number" || predictedAwayScore < 0)
  ) {
    return NextResponse.json(
      { error: "predictedAwayScore must be a non-negative number" },
      { status: 400 }
    );
  }

  const pick = await prisma.knockoutPick.upsert({
    where: { userId_matchId: { userId, matchId } },
    create: {
      userId,
      matchId,
      pickedTeamId,
      predictedHomeScore: predictedHomeScore ?? null,
      predictedAwayScore: predictedAwayScore ?? null,
    },
    update: {
      pickedTeamId,
      predictedHomeScore: predictedHomeScore ?? null,
      predictedAwayScore: predictedAwayScore ?? null,
    },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true, phase: true },
      },
      pickedTeam: true,
    },
  });

  return NextResponse.json({ message: "Pick saved", pick }, { status: 200 });
}
