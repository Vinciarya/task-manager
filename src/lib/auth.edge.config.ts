import type { NextAuthConfig } from "next-auth";
import { Role } from "@/types";

export const authEdgeConfig = {
  providers: [],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role === Role.ADMIN ? Role.ADMIN : Role.MEMBER;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
