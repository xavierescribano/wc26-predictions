import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { randomUUID } from "crypto";

function requireAdmin(session: ReturnType<typeof Object.create>) {
  if (!session?.user) return false;
  return (session.user as { role?: string }).role === "ADMIN";
}

// GET — list all pending (unused) invites
export async function GET() {
  const session = await getServerSession();
  if (!session?.user || !requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.invite.findMany({
    where: { usedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, token: true, createdAt: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json(invites.map((i) => ({
    ...i,
    inviteUrl: `${baseUrl}/register?token=${i.token}`,
  })));
}

// POST — create a new invite (email optional — used as a label only)
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || !requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const label: string = (body.email ?? body.label ?? "").toString().toLowerCase().trim();

  // If a real email was given, check it's not already registered
  if (label.includes("@")) {
    const existingUser = await prisma.user.findUnique({ where: { email: label } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email is already registered" }, { status: 409 });
    }
    // Reuse an existing unused invite for the same email
    const existing = await prisma.invite.findFirst({ where: { email: label, usedAt: null } });
    if (existing) {
      const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${existing.token}`;
      return NextResponse.json({ inviteUrl, token: existing.token, email: existing.email });
    }
  }

  const token = randomUUID();
  const senderId = (session.user as { id: string }).id;

  const invite = await prisma.invite.create({
    data: { email: label || `invite-${token.slice(0, 8)}`, token, senderId },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${invite.token}`;
  return NextResponse.json({ inviteUrl, token: invite.token, email: invite.email }, { status: 201 });
}

// DELETE — revoke a pending invite
export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user || !requireAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.invite.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
