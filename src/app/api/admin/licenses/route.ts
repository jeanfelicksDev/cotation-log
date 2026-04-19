import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Mot de passe super admin — en production, mettre dans les variables d'env
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || "cotalog-admin-2026";

function generateLicenseKey(companyName: string): string {
  // Format: COTA-XXXX-YYYY-ZZZZ
  const part = () => randomBytes(2).toString("hex").toUpperCase();
  return `COTA-${part()}-${part()}-${part()}`;
}

// GET /api/admin/licenses — Liste toutes les licences
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== SUPER_ADMIN_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const licenses = await prisma.license.findMany({
    include: { organization: { include: { users: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(licenses);
}

// POST /api/admin/licenses — Générer une nouvelle licence
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== SUPER_ADMIN_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { companyName, contactEmail, maxUsers, expiresAt, notes } = await req.json();

  if (!companyName || !contactEmail) {
    return NextResponse.json({ error: "Nom et email requis." }, { status: 400 });
  }

  const key = generateLicenseKey(companyName);

  const license = await prisma.license.create({
    data: {
      key,
      companyName,
      contactEmail,
      maxUsers: maxUsers || 10,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
    },
  });

  return NextResponse.json(license, { status: 201 });
}

// DELETE /api/admin/licenses?id=xxx — Révoquer une licence
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== SUPER_ADMIN_SECRET) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

  // Désactiver la licence plutôt que la supprimer
  await prisma.license.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
