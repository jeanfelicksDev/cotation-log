import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { organization: { include: { license: true } } },
        });

        if (!user) return null;

        // Vérifier la licence de l'organisation
        const license = user.organization?.license;
        if (!license || !license.isActive) return null;
        if (license.expiresAt && license.expiresAt < new Date()) return null;

        const validPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          orgName: user.organization.name,
        };
      },
    }),
  ],
});
