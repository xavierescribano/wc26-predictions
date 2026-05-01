import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PhaseType } from "@prisma/client";

export async function GET(_req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all players with their earned points, including enough data to split by category
  const users = await prisma.user.findMany({
    where: { role: "PLAYER" },
    select: {
      id: true,
      name: true,
      email: true,
      groupPredictions: {
        select: { pointsEarned: true },
      },
      knockoutPicks: {
        select: {
          pointsEarned: true,
          match: {
            select: {
              phase: { select: { type: true } },
            },
          },
        },
      },
      goldenPick: {
        select: { pointsEarned: true },
      },
    },
  });

  const leaderboard = users
    .map((user) => {
      const groupPoints = user.groupPredictions.reduce(
        (sum, gp) => sum + (gp.pointsEarned ?? 0),
        0
      );

      // Separate final picks from other knockout picks
      let finalPoints = 0;
      let knockoutPoints = 0;
      for (const kp of user.knockoutPicks) {
        const pts = kp.pointsEarned ?? 0;
        if (kp.match.phase.type === PhaseType.FINAL) {
          finalPoints += pts;
        } else {
          knockoutPoints += pts;
        }
      }

      const goldenPoints = user.goldenPick?.pointsEarned ?? 0;
      const total = groupPoints + knockoutPoints + finalPoints + goldenPoints;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        groupPoints,
        knockoutPoints,
        finalPoints,
        goldenPoints,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);

  return NextResponse.json(leaderboard, { status: 200 });
}
