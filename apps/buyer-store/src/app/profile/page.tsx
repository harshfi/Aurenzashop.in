"use client";

import { useSession, signOut } from "next-auth/react";
import { User, Package, Settings, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-indigo-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Not signed in</h2>
        <p className="text-gray-500 mb-8">Sign in to view your profile and orders.</p>
        <a href="/api/auth/signin" className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Profile */}
        <div className="p-8 sm:p-12 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <img
            src={session.user?.image || "/placeholder.jpg"}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{session.user?.name}</h1>
            <p className="text-indigo-600 font-medium">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="sm:ml-auto mt-4 sm:mt-0 flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 hover:text-red-600 font-medium transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="p-8 sm:p-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Recent Orders
          </h2>

          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <a href="/shop" className="text-indigo-600 font-medium hover:underline">Start shopping</a>
          </div>
        </div>
      </div>
    </div>
  );
}
