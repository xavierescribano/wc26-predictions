import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));
  const name: string = (body.name ?? "").toString().trim();

  if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  if (name.length > 30) return NextResponse.json({ error: "Name must be 30 characters or fewer" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { name: true },
  });

  return NextResponse.json({ name: updated.name });
}
