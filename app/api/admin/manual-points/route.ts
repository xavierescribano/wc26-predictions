import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

function isAdmin(session: any) {
  return session?.user && (session.user as any).role === "ADMIN";
}

// GET — all adjustments with user info
export async function GET() {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const adjustments = await prisma.manualPointsAdjustment.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(adjustments);
}

// POST — add an adjustment
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { userId, points, reason } = body;

  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  if (typeof points !== "number" || !Number.isInteger(points) || points === 0)
    return NextResponse.json({ error: "points debe ser un entero distinto de 0" }, { status: 400 });
  if (Math.abs(points) > 9999)
    return NextResponse.json({ error: "Máximo ±9999 puntos por ajuste" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const adj = await prisma.manualPointsAdjustment.create({
    data: { userId, points, reason: reason?.toString().trim() || null },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(adj, { status: 201 });
}

// DELETE — remove an adjustment by id
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  await prisma.manualPointsAdjustment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
