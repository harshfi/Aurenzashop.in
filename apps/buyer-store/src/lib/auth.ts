import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SignJWT } from "jose";
import { buildApiUrl } from "@/lib/api";
import { getGoogleOAuthCredentials, isGoogleOAuthConfigured } from "@/lib/oauth-config";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";

async function signBuyerToken(payload: Record<string, unknown>, secret = authSecret) {
  if (!secret) {
    return null;
  }

  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));
}

async function syncBuyerProfile(user: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  authProvider?: "google" | "local";
}) {
  if (!user.email) {
    return;
  }

  try {
    const backendToken = await signBuyerToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.image,
      authProvider: user.authProvider || "local",
    });

    if (!backendToken) {
      return;
    }

    const response = await fetch(buildApiUrl("/api/auth/buyer/me"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${backendToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Buyer profile sync failed with status", response.status);
    }
  } catch (error) {
    console.warn("Buyer profile sync failed", error);
  }
}

type BuyerAuthMode = "login" | "register";

type BuyerAuthResponse = {
  success?: boolean;
  message?: string;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
};

async function authenticateBuyerWithBackend({
  mode,
  email,
  password,
  name,
}: {
  mode: BuyerAuthMode;
  email: string;
  password: string;
  name?: string;
}) {
  const endpoint = mode === "register" ? "/api/auth/buyer/register" : "/api/auth/buyer/login";
  const response = await fetch(buildApiUrl(endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      ...(mode === "register" ? { name } : {}),
    }),
  });

  const payload = (await response.json().catch(() => null)) as BuyerAuthResponse | null;

  if (!response.ok || !payload?.user) {
    throw new Error(payload?.message || "Authentication failed. Please try again.");
  }

  return payload.user;
}

const providers = [];

if (isGoogleOAuthConfigured()) {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  providers.push(
    Google({
      clientId,
      clientSecret,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: authSecret || undefined,
  providers: [
    ...providers,
    Credentials({
      name: "Email and Password",
      credentials: {
        mode: { label: "Mode", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = String(credentials.email).trim().toLowerCase();
        const mode = credentials.mode === "register" ? "register" : "login";
        const user = await authenticateBuyerWithBackend({
          mode,
          email: normalizedEmail,
          password: String(credentials.password),
          name: credentials.name ? String(credentials.name).trim() : undefined,
        });

        return {
          id: user.id || normalizedEmail,
          name: user.name || (credentials.name as string) || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          image: user.avatarUrl || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      await syncBuyerProfile({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        authProvider: account?.provider === "google" ? "google" : "local",
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.authProvider = account?.provider === "google" ? "google" : "local";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) || null;
      }

      session.backendToken = await signBuyerToken({
        sub: token.sub,
        email: token.email,
        name: token.name,
        picture: token.picture,
        authProvider: token.authProvider || "local",
      });

      return session;
    },
  },
});
