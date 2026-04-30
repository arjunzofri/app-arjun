import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LoginSchema } from "./validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { username, password } = validatedFields.data;

          const user = await db.query.usuarios.findFirst({
            where: eq(usuarios.nombre, username),
          });

          if (!user) return null;

          if (typeof password === "string") {
            return {
              id: user.id,
              name: user.nombre,
              email: user.email,
              role: user.rol,
            };
          }
        }

        return null;
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
