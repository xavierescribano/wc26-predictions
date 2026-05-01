import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  let body: { token?: string; name?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token, name, email, password } = body;

  // Validate required fields
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Validate invite token
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }
  if (invite.usedAt !== null) {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  // Verify the email matches the invite (case-insensitive)
  if (invite.email.toLowerCase() !== normalizedEmail) {
    return NextResponse.json(
      { error: "Email does not match the invited email address" },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "PLAYER",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Mark invite as used
  await prisma.invite.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json(
    { message: "Account created successfully", user },
    { status: 201 }
  );
}
