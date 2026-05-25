"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="container mx-auto flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-gray-950">Sign in to Aurenza</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Access your profile, saved addresses, orders, and delivery tracking.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="mt-8 flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Continue with Google
        </button>
        <Link href="/shop" className="mt-5 inline-block text-sm font-medium text-indigo-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
