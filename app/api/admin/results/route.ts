import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { calcFinalPoints, calcKnockoutPoints } from "@/lib/scoring";
import { PhaseType } from "@prisma/client";

const KNOCKOUT_ROUND_BONUS = 5;

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { matchId?: string; homeScore?: number; awayScore?: number; winnerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { matchId, homeScore, awayScore, winnerId } = body;

  if (!matchId) {
    return NextResponse.json({ error: "matchId is required" }, { status: 400 });
  }
  if (homeScore === undefined || homeScore === null || awayScore === undefined || awayScore === null) {
    return NextResponse.json({ error: "homeScore and awayScore are required" }, { status: 400 });
  }
  if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "homeScore and awayScore must be non-negative numbers" }, { status: 400 });
  }

  // Fetch the match with its phase
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { phase: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Validate winnerId if provided: must be homeTeam or awayTeam
  if (winnerId) {
    if (winnerId !== match.homeTeamId && winnerId !== match.awayTeamId) {
      return NextResponse.json(
        { error: "winnerId must be homeTeamId or awayTeamId of this match" },
        { status: 400 }
      );
    }
  }

  // Save the result
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore,
      awayScore,
      winnerId: winnerId ?? null,
    },
  });

  const isFinal = match.phase.type === PhaseType.FINAL;

  // Recalculate all KnockoutPicks for this match
  const picks = await prisma.knockoutPick.findMany({
    where: { matchId },
  });

  for (const pick of picks) {
    const isCorrect = winnerId ? pick.pickedTeamId === winnerId : false;
    const pointsEarned = isFinal
      ? calcFinalPoints(pick.pickedTeamId, winnerId ?? null)
      : calcKnockoutPoints(pick.pickedTeamId, winnerId ?? null);

    await prisma.knockoutPick.update({
      where: { id: pick.id },
      data: { isCorrect, pointsEarned },
    });
  }

  // Check if all matches in this phase now have a winner (round complete)
  if (!isFinal) {
    const allMatchesInPhase = await prisma.match.findMany({
      where: { phaseId: match.phaseId },
      select: { id: true, winnerId: true },
    });

    const allHaveWinners = allMatchesInPhase.every((m) => m.winnerId !== null);

    if (allHaveWinners) {
      // Find all users who got ALL picks in this phase correct and apply +5 bonus
      const phaseMatchIds = allMatchesInPhase.map((m) => m.id);

      // Get every user who has picks in this phase
      const userPickGroups = await prisma.knockoutPick.groupBy({
        by: ["userId"],
        where: { matchId: { in: phaseMatchIds } },
      });

      for (const { userId } of userPickGroups) {
        const userPicks = await prisma.knockoutPick.findMany({
          where: { matchId: { in: phaseMatchIds }, userId },
          select: { id: true, isCorrect: true, pointsEarned: true },
        });

        // User must have picks for every match in the phase and all must be correct
        const hasAllPicks = userPicks.length === phaseMatchIds.length;
        const allCorrect = userPicks.every((p) => p.isCorrect === true);

        if (hasAllPicks && allCorrect) {
          // Add +5 bonus to each pick in this phase for this user
          for (const pick of userPicks) {
            await prisma.knockoutPick.update({
              where: { id: pick.id },
              data: { pointsEarned: (pick.pointsEarned ?? 0) + KNOCKOUT_ROUND_BONUS },
            });
          }
        }
      }
    }
  }

  const updatedMatch = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true, winner: true, phase: true },
  });

  return NextResponse.json(
    { message: "Result saved and picks recalculated", match: updatedMatch },
    { status: 200 }
  );
}
