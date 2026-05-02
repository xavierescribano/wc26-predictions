import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST() {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete all picks and results in dependency order
  await prisma.groupResult.deleteMany();
  await prisma.groupPrediction.deleteMany();
  await prisma.knockoutPick.deleteMany();
  await prisma.goldenPick.deleteMany();

  // Reset all match results (keep stubs, just clear scores/winner)
  await prisma.match.updateMany({
    data: { homeScore: null, awayScore: null, winnerId: null, homeTeamId: null, awayTeamId: null },
  });

  // Close all phases and clear timestamps
  await prisma.phase.updateMany({
    data: { isOpen: false, openedAt: null, closedAt: null },
  });

  return NextResponse.json({ message: "Competition reset successfully" });
}
