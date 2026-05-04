import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const [playerPick, teamPick] = await Promise.all([
    prisma.topScorerPlayerPick.findUnique({ where: { userId } }),
    prisma.topScorerTeamPick.findUnique({ where: { userId }, include: { team: true } }),
  ]);

  return NextResponse.json({ playerPick, teamPick });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  // Must be submitted during group stage
  const groupPhase = await prisma.phase.findUnique({ where: { type: "GROUP_STAGE" } });
  if (!groupPhase?.isOpen) {
    return NextResponse.json({ error: "Special picks can only be set during the Group Stage" }, { status: 400 });
  }

  const body = await req.json();
  const { type, playerName, teamId } = body;

  if (type === "player") {
    if (!playerName?.trim()) return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    // Locked once submitted — check if already exists
    const existing = await prisma.topScorerPlayerPick.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Top Scorer Player pick is locked and cannot be changed" }, { status: 400 });
    const pick = await prisma.topScorerPlayerPick.create({ data: { userId, playerName: playerName.trim() } });
    return NextResponse.json(pick);
  }

  if (type === "team") {
    if (!teamId) return NextResponse.json({ error: "Team is required" }, { status: 400 });
    const existing = await prisma.topScorerTeamPick.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Top Scorer Team pick is locked and cannot be changed" }, { status: 400 });
    const pick = await prisma.topScorerTeamPick.create({ data: { userId, teamId }, include: { team: true } });
    return NextResponse.json(pick);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
