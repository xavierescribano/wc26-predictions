import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PhaseType } from "@prisma/client";

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export async function GET(_req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const predictions = await prisma.groupPrediction.findMany({
    where: { userId },
    include: {
      position1: true,
      position2: true,
      position3: true,
      position4: true,
    },
    orderBy: { groupLetter: "asc" },
  });

  return NextResponse.json(predictions, { status: 200 });
}

interface GroupPredictionInput {
  groupLetter: string;
  position1Id: string;
  position2Id: string;
  position3Id: string;
  position4Id: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  // Check GROUP_STAGE phase is open
  const groupStagePhase = await prisma.phase.findUnique({
    where: { type: PhaseType.GROUP_STAGE },
  });
  if (!groupStagePhase || !groupStagePhase.isOpen) {
    return NextResponse.json(
      { error: "Group stage predictions are currently closed" },
      { status: 403 }
    );
  }

  let body: GroupPredictionInput[];
  try {
    const raw = await req.json();
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { error: "Body must be an array of group predictions" },
        { status: 400 }
      );
    }
    body = raw;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.length === 0) {
    return NextResponse.json({ error: "No predictions provided" }, { status: 400 });
  }

  // Validate each entry
  for (const entry of body) {
    const { groupLetter, position1Id, position2Id, position3Id, position4Id } = entry;

    if (!groupLetter || !GROUP_LETTERS.includes(groupLetter.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid groupLetter: ${groupLetter}. Must be one of ${GROUP_LETTERS.join(", ")}` },
        { status: 400 }
      );
    }

    const positionIds = [position1Id, position2Id, position3Id, position4Id];
    if (positionIds.some((id) => !id || typeof id !== "string")) {
      return NextResponse.json(
        { error: `All four position IDs are required for group ${groupLetter}` },
        { status: 400 }
      );
    }

    // Ensure no duplicates within positions
    const uniqueIds = new Set(positionIds);
    if (uniqueIds.size !== 4) {
      return NextResponse.json(
        { error: `Duplicate team IDs found in group ${groupLetter} prediction` },
        { status: 400 }
      );
    }

    // Validate all 4 teams belong to the correct group
    const teams = await prisma.team.findMany({
      where: {
        id: { in: positionIds },
        group: groupLetter.toUpperCase(),
      },
    });

    if (teams.length !== 4) {
      return NextResponse.json(
        {
          error: `One or more teams do not belong to group ${groupLetter}. Found ${teams.length} valid teams, expected 4.`,
        },
        { status: 400 }
      );
    }
  }

  // Upsert all predictions
  const upserted = await Promise.all(
    body.map((entry) => {
      const { groupLetter, position1Id, position2Id, position3Id, position4Id } = entry;
      return prisma.groupPrediction.upsert({
        where: { userId_groupLetter: { userId, groupLetter: groupLetter.toUpperCase() } },
        create: {
          userId,
          groupLetter: groupLetter.toUpperCase(),
          position1Id,
          position2Id,
          position3Id,
          position4Id,
        },
        update: {
          position1Id,
          position2Id,
          position3Id,
          position4Id,
        },
        include: {
          position1: true,
          position2: true,
          position3: true,
          position4: true,
        },
      });
    })
  );

  return NextResponse.json(
    { message: "Group predictions saved", predictions: upserted },
    { status: 200 }
  );
}
