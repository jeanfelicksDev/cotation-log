import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addHours } from "date-fns";
import bcrypt from "bcryptjs";

// POST /api/auth/invite — Créer un lien d'invitation (ADMIN only)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

  const orgId = (session.user as any).orgId;

  // Vérifier la limite d'utilisateurs
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { users: true, license: true },
  });

  if (!org) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });

  if (org.users.length >= org.license.maxUsers) {
    return NextResponse.json(
      { error: `Limite de ${org.license.maxUsers} comptes atteinte pour votre licence.` },
      { status: 403 }
    );
  }

  // Supprimer les invitations précédentes pour cet email
  await prisma.inviteToken.deleteMany({ where: { email, orgId } });

  const invite = await prisma.inviteToken.create({
    data: {
      email,
      orgId,
      expiresAt: addHours(new Date(), 48),
    },
  });

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register/invite/${invite.token}`;
  return NextResponse.json({ inviteUrl, token: invite.token });
}

// GET /api/auth/invite?token=xxx — Vérifier la validité d'un token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 400 });

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    email: invite.email,
    orgName: invite.organization.name,
  });
}

// PUT /api/auth/invite — Accepter une invitation et créer le compte
export async function PUT(req: NextRequest) {
  const { token, name, password } = await req.json();

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { organization: { include: { license: true } } },
  });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) return NextResponse.json({ error: "Ce compte existe déjà." }, { status: 400 });

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: invite.email,
      password: hashedPassword,
      role: "EMPLOYEE",
      orgId: invite.orgId,
    },
  });

  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
