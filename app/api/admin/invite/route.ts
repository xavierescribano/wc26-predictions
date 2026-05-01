import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user is already registered
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email is already registered" },
      { status: 409 }
    );
  }

  // Check for an existing unused invite for this email
  const existingInvite = await prisma.invite.findFirst({
    where: { email: normalizedEmail, usedAt: null },
  });
  if (existingInvite) {
    const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${existingInvite.token}`;
    return NextResponse.json(
      { message: "Invite already exists for this email", inviteUrl, token: existingInvite.token },
      { status: 200 }
    );
  }

  const token = randomUUID();
  const senderId = (session.user as any).id as string;

  const invite = await prisma.invite.create({
    data: {
      email: normalizedEmail,
      token,
      senderId,
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${invite.token}`;

  return NextResponse.json({ inviteUrl, token: invite.token, email: invite.email }, { status: 201 });
}
