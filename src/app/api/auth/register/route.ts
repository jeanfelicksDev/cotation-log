import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST /api/auth/register — Inscription Admin avec clé de licence
export async function POST(req: NextRequest) {
  try {
    const { licenseKey, companyName, name, email, password } = await req.json();

    if (!licenseKey || !name || !email || !password) {
      return NextResponse.json({ error: "Tous les champs sont requis." }, { status: 400 });
    }

    // 1. Vérifier la clé de licence
    const license = await prisma.license.findUnique({ where: { key: licenseKey } });

    if (!license) {
      return NextResponse.json({ error: "Clé de licence invalide." }, { status: 403 });
    }
    if (license.isActive) {
      return NextResponse.json({ error: "Cette clé de licence est déjà utilisée." }, { status: 403 });
    }
    if (license.expiresAt && license.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cette clé de licence a expiré." }, { status: 403 });
    }

    // 2. Vérifier que l'email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 400 });
    }

    // 3. Créer l'organisation + activer la licence + créer l'admin
    const hashedPassword = await bcrypt.hash(password, 12);

    const org = await prisma.organization.create({
      data: {
        name: companyName || license.companyName,
        licenseId: license.id,
        users: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: "ADMIN",
          },
        },
      },
    });

    // 4. Marquer la licence comme activée
    await prisma.license.update({
      where: { id: license.id },
      data: { isActive: true, activatedAt: new Date() },
    });

    return NextResponse.json({ success: true, orgId: org.id }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
