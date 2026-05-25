"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield, ArrowRight, AlertCircle, LockKeyhole, Mail, UserPlus, UserRound } from "lucide-react";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Google rejected the client secret. In Google Cloud Console open your OAuth client, copy the full Client secret (or reset it), paste it into apps/buyer-store/.env as GOOGLE_CLIENT_SECRET, then restart the dev server.",
  OAuthCallback:
    "Google sign-in callback failed. Confirm GOOGLE_CLIENT_SECRET matches client ID 452266730003-... and add redirect URI http://localhost:3000/api/auth/callback/google.",
  OAuthSignin: "Could not start Google sign-in. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  AccessDenied: "Google sign-in was cancelled or denied.",
  Callback: "Sign-in callback failed. Please try again.",
  Default: "Google sign-in failed. Verify OAuth credentials in Google Cloud Console.",
};

export default function LoginForm({ googleOAuthConfigured }: { googleOAuthConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const oauthErrorCode = searchParams.get("error");
  const [mode, setMode] = useState<"login" | "register">(oauthErrorCode ? "login" : "register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    if (!oauthErrorCode) {
      return null;
    }

    return OAUTH_ERROR_MESSAGES[oauthErrorCode] || OAUTH_ERROR_MESSAGES.Default;
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        mode,
        email: email.trim(),
        password,
        name: name.trim(),
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(result?.url || callbackUrl);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn("google", { callbackUrl });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not connect to Google OAuth.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-16 bg-gradient-to-tr from-slate-50 via-indigo-50/30 to-violet-50/40 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-300/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-violet-300/20 rounded-full blur-[90px]" />

      <div className="relative w-full max-w-lg">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-indigo-100/40">
          <div className="p-8 sm:p-10 border-b border-gray-100/80 bg-gradient-to-b from-indigo-50/10 to-transparent">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full flex items-center gap-1 shadow-sm">
                <Shield className="w-3.5 h-3.5" /> Portal Secure
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-slate-500 font-medium">
              Access your Aurenza workspace and shop settings.
            </p>
          </div>

          <div className="p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Authentication issue</p>
                  <p className="text-xs text-rose-600/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  mode === "login"
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                  mode === "register"
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account
              </button>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                  {mode === "login" ? <LockKeyhole className="w-4 h-4 text-indigo-600" /> : <UserPlus className="w-4 h-4 text-indigo-600" />}
                  {mode === "login" ? "Secure account access" : "Create your buyer account"}
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {mode === "login"
                    ? "Sign in with your email and password to manage your profile, orders, and checkout details."
                    : "Register with your email to save your profile and speed up future purchases."}
                </p>
              </div>

              <div className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={mode === "register"}
                          autoComplete="name"
                          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-base rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-100"
                          placeholder="Aurenza Shopper"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-base rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-100"
                      placeholder="you@aurenzashop.in"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-base rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-100"
                      placeholder={mode === "login" ? "Enter your password" : "Create a strong password"}
                    />
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={mode === "register"}
                        autoComplete="new-password"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-base rounded-2xl outline-none transition-all focus:ring-4 focus:ring-indigo-100"
                        placeholder="Re-enter your password"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-600/20 active:translate-y-0 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  Or continue with
                </span>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || !googleOAuthConfigured}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 font-bold rounded-2xl transition-all hover:-translate-y-0.5 shadow-sm active:translate-y-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 15.02 1 12 1 7.24 1 3.2 3.74 1.25 7.72l3.88 3.01C6.07 7.42 8.81 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z" />
                    <path fill="#FBBC05" d="M5.13 14.73A7.16 7.16 0 0 1 4.75 12c0-.97.16-1.92.47-2.82L1.25 6.17A11.96 11.96 0 0 0 0 12c0 2.16.57 4.19 1.59 5.96l3.54-3.23z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.52 1.18-4.2 1.18-3.19 0-5.93-2.38-6.87-5.69l-3.88 3.01C3.2 20.26 7.24 23 12 23z" />
                  </svg>
                  Continue with Google
                </button>
                {!googleOAuthConfigured && (
                  <p className="text-xs text-center text-slate-500">
                    Google sign-in is unavailable until OAuth credentials are configured.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400/80 font-medium">
          Aurenza eCommerce Platform. Secure session bridge enabled for buyer auth and checkout.
        </p>
      </div>
    </div>
  );
}
