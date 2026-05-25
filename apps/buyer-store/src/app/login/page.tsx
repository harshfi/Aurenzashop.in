import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { isGoogleOAuthConfigured } from "@/lib/oauth-config";

export default function LoginPage() {
  const googleOAuthConfigured = isGoogleOAuthConfigured();
  
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginForm googleOAuthConfigured={googleOAuthConfigured} />
    </Suspense>
  );
}
