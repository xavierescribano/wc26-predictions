import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { calcGroupPoints } from "@/lib/scoring";

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export async function GET() {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await prisma.groupResult.findMany({
    include: { position1: true, position2: true, position3: true, position4: true },
    orderBy: { groupLetter: "asc" },
  });

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: { groupLetter: string; position1Id: string; position2Id: string; position3Id: string; position4Id: string } = await req.json();
  const { groupLetter, position1Id, position2Id, position3Id, position4Id } = body;

  if (!groupLetter || !GROUP_LETTERS.includes(groupLetter.toUpperCase())) {
    return NextResponse.json({ error: "Invalid group letter" }, { status: 400 });
  }

  const posIds = [position1Id, position2Id, position3Id, position4Id];
  if (posIds.some((id) => !id)) {
    return NextResponse.json({ error: "All 4 position IDs required" }, { status: 400 });
  }
  if (new Set(posIds).size !== 4) {
    return NextResponse.json({ error: "Duplicate team IDs" }, { status: 400 });
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: posIds }, group: groupLetter.toUpperCase() },
  });
  if (teams.length !== 4) {
    return NextResponse.json({ error: "Teams don't all belong to this group" }, { status: 400 });
  }

  // Upsert the official result
  const result = await prisma.groupResult.upsert({
    where: { groupLetter: groupLetter.toUpperCase() },
    create: { groupLetter: groupLetter.toUpperCase(), position1Id, position2Id, position3Id, position4Id },
    update: { position1Id, position2Id, position3Id, position4Id },
  });

  // Recalculate points for all GroupPredictions for this group
  const predictions = await prisma.groupPrediction.findMany({
    where: { groupLetter: groupLetter.toUpperCase() },
  });

  const actual = [position1Id, position2Id, position3Id, position4Id];
  for (const pred of predictions) {
    const predicted = [pred.position1Id, pred.position2Id, pred.position3Id, pred.position4Id];
    const pts = calcGroupPoints(predicted, actual);
    await prisma.groupPrediction.update({
      where: { id: pred.id },
      data: { pointsEarned: pts },
    });
  }

  return NextResponse.json({ result, recalculated: predictions.length });
}
