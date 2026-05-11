import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { LoginSchema } from "./validations";

export async function authorize(credentials: Record<string, unknown>) {
  const validatedFields = LoginSchema.safeParse(credentials);

  if (!validatedFields.success) return null;

  const { username, password } = validatedFields.data;

  const user = await db.query.usuarios.findFirst({
    where: eq(usuarios.username, username),
  });

  if (!user || !user.passwordHash) return null;

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordsMatch) return null;

  return {
    id: user.id,
    name: user.nombre,
    email: user.email,
    role: user.rol,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        return authorize(credentials);
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.includes("/dashboard")) return baseUrl + "/";
      if (url.startsWith("/")) return baseUrl + url;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + "/";
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});

export const { GET, POST } = handlers;
