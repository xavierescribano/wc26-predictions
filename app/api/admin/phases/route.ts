import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { PhaseType } from "@prisma/client";

export async function GET(_req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const phases = await prisma.phase.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });

  const result = phases.map((phase) => ({
    id: phase.id,
    type: phase.type,
    isOpen: phase.isOpen,
    order: phase.order,
    openedAt: phase.openedAt,
    closedAt: phase.closedAt,
    matchCount: phase._count.matches,
  }));

  return NextResponse.json(result, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { phaseType?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phaseType, action } = body;

  if (!phaseType || !action) {
    return NextResponse.json(
      { error: "phaseType and action are required" },
      { status: 400 }
    );
  }

  const validPhaseTypes = Object.values(PhaseType) as string[];
  if (!validPhaseTypes.includes(phaseType)) {
    return NextResponse.json(
      { error: `Invalid phaseType. Must be one of: ${validPhaseTypes.join(", ")}` },
      { status: 400 }
    );
  }

  if (action !== "open" && action !== "close") {
    return NextResponse.json(
      { error: 'action must be "open" or "close"' },
      { status: 400 }
    );
  }

  const phase = await prisma.phase.findUnique({
    where: { type: phaseType as PhaseType },
  });
  if (!phase) {
    return NextResponse.json({ error: "Phase not found" }, { status: 404 });
  }

  const now = new Date();
  const updateData =
    action === "open"
      ? { isOpen: true, openedAt: now, closedAt: null }
      : { isOpen: false, closedAt: now };

  const updated = await prisma.phase.update({
    where: { type: phaseType as PhaseType },
    data: updateData,
  });

  return NextResponse.json(updated, { status: 200 });
}
