import type { NextAuthConfig, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AppError } from "@/lib/errors";
import { authService } from "@/lib/container";
import { Role } from "@/types";

// =============================================================================
// TypeScript Extensions
// =============================================================================
// Note: Session and JWT types are already extended in `src/types/index.ts`.
// They ensure `id` and `role` are strongly typed on `session.user` and `token`.

// =============================================================================
// Auth Configuration
// =============================================================================

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await authService.validateCredentials(
            String(credentials.email),
            String(credentials.password)
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role === Role.ADMIN ? Role.ADMIN : Role.MEMBER,
          };
        } catch (error: unknown) {
          // Return null (not throw) on invalid credentials in authorize()
          if (error instanceof AppError && error.statusCode === 401) {
            return null;
          }
          // Rethrow other errors (e.g., database connection issues) 
          // so they can be logged or handled appropriately.
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only available on the first sign-in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
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
