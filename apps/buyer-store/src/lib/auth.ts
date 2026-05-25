import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "aurenza-local-development-secret-change-before-production",
  basePath: "/api/auth",
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "aurenza-local-google-client",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "aurenza-local-google-secret",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
});
