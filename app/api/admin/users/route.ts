import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      groupPredictions: { select: { pointsEarned: true } },
      knockoutPicks: { select: { pointsEarned: true } },
      goldenPick: { select: { pointsEarned: true } },
    },
  });

  const result = users.map((user) => {
    const groupPoints = user.groupPredictions.reduce(
      (sum, gp) => sum + (gp.pointsEarned ?? 0),
      0
    );
    const knockoutPoints = user.knockoutPicks.reduce(
      (sum, kp) => sum + (kp.pointsEarned ?? 0),
      0
    );
    const goldenPoints = user.goldenPick?.pointsEarned ?? 0;
    const total = groupPoints + knockoutPoints + goldenPoints;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      groupPoints,
      knockoutPoints,
      goldenPoints,
      total,
    };
  });

  return NextResponse.json(result, { status: 200 });
}
