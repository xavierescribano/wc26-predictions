import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PhaseType } from "@prisma/client";

function isAdmin(session: unknown) {
  return (session as { user?: { role?: string } })?.user?.role === "ADMIN";
}

// GET — list matches for a phase
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const phaseType = new URL(req.url).searchParams.get("phaseType") as PhaseType | null;
  if (!phaseType) return NextResponse.json({ error: "phaseType required" }, { status: 400 });

  const phase = await prisma.phase.findUnique({
    where: { type: phaseType },
    include: {
      matches: {
        orderBy: { matchNumber: "asc" },
        include: {
          homeTeam: { select: { id: true, name: true, flagEmoji: true } },
          awayTeam: { select: { id: true, name: true, flagEmoji: true } },
        },
      },
    },
  });

  if (!phase) return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  return NextResponse.json({ phaseId: phase.id, isOpen: phase.isOpen, matches: phase.matches });
}

// POST — create new match OR update teams on existing match
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { phaseType, matchId, matchNumber, homeTeamId, awayTeamId, description } = body;

  if (matchId) {
    // Update existing match teams
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeTeamId: homeTeamId || null,
        awayTeamId: awayTeamId || null,
        description: description?.trim() || null,
      },
      include: {
        homeTeam: { select: { id: true, name: true, flagEmoji: true } },
        awayTeam: { select: { id: true, name: true, flagEmoji: true } },
      },
    });
    return NextResponse.json(match);
  }

  // Create new match
  if (!phaseType) return NextResponse.json({ error: "phaseType required" }, { status: 400 });
  if (!matchNumber) return NextResponse.json({ error: "matchNumber required" }, { status: 400 });

  const phase = await prisma.phase.findUnique({ where: { type: phaseType as PhaseType } });
  if (!phase) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

  const match = await prisma.match.create({
    data: {
      phaseId: phase.id,
      matchNumber: Number(matchNumber),
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      description: description?.trim() || null,
    },
    include: {
      homeTeam: { select: { id: true, name: true, flagEmoji: true } },
      awayTeam: { select: { id: true, name: true, flagEmoji: true } },
    },
  });
  return NextResponse.json(match, { status: 201 });
}

// DELETE — remove a match (only if no result entered)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { matchId } = await req.json().catch(() => ({}));
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.winnerId) return NextResponse.json({ error: "Cannot delete a match with a result" }, { status: 400 });

  await prisma.knockoutPick.deleteMany({ where: { matchId } });
  await prisma.match.delete({ where: { id: matchId } });
  return NextResponse.json({ ok: true });
}
