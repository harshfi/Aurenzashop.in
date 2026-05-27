"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Clock3,
  LogOut,
  MapPin,
  Package,
  User,
  ChevronRight,
} from "lucide-react";
import { buildApiUrl } from "@/lib/api";

interface BuyerAddress {
  _id?: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  isDefault?: boolean;
}

interface BuyerProfile {
  name?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  addresses?: BuyerAddress[];
}

interface BuyerOrder {
  _id: string;
  totalAmount?: number;
  paymentStatus?: string | null;
  orderStatus?: string | null;
  createdAt?: string;
  delhiveryAWB?: string | null;
  items?: Array<{
    productTitle?: string;
    quantity?: number;
    variantLabel?: string;
    productImage?: string;
  }>;
}

function formatOrderDate(value?: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatusLabel(value?: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusColor(status?: string | null) {
  switch (status) {
    case "placed":
      return "bg-blue-100 text-blue-700";
    case "confirmed":
      return "bg-sky-100 text-sky-700";
    case "processing":
      return "bg-orange-100 text-orange-700";
    case "packed":
      return "bg-amber-100 text-amber-700";
    case "shipped":
    case "out_for_delivery":
      return "bg-purple-100 text-purple-700";
    case "delivered":
      return "bg-emerald-100 text-emerald-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.backendToken) {
      const timeoutId = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();

    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const headers = {
          Authorization: `Bearer ${session.backendToken}`,
        };

        const [profileResponse, ordersResponse] = await Promise.all([
          fetch(buildApiUrl("/api/auth/buyer/me"), {
            headers,
            signal: controller.signal,
            cache: "no-store",
          }),
          fetch(buildApiUrl("/api/orders/my-orders?limit=10"), {
            headers,
            signal: controller.signal,
            cache: "no-store",
          }),
        ]);

        if (!profileResponse.ok || !ordersResponse.ok) {
          throw new Error("Could not load buyer data.");
        }

        const profilePayload = await profileResponse.json();
        const ordersPayload = await ordersResponse.json();

        setProfile(profilePayload.user ?? null);
        setOrders(Array.isArray(ordersPayload.orders) ? ordersPayload.orders : []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load buyer profile:", error);
        setErrorMessage("We couldn't load your buyer profile right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [session?.backendToken]);

  if (status === "loading" || loading) {
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
        <button
          type="button"
          onClick={() => signIn(undefined, { callbackUrl: "/profile" })}
          className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 sm:p-12 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <Image
            src={profile?.avatarUrl || session.user?.image || "/placeholder-product.svg"}
            alt="Profile"
            width={96}
            height={96}
            className="h-24 w-24 rounded-full border-4 border-white shadow-sm"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile?.name || session.user?.name}</h1>
            <p className="text-indigo-600 font-medium">{profile?.email || session.user?.email}</p>
            {profile?.phone && <p className="mt-1 text-sm text-gray-500">{profile.phone}</p>}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="sm:ml-auto mt-4 sm:mt-0 flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 hover:text-red-600 font-medium transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="p-8 sm:p-12">
          {errorMessage && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              {errorMessage}
            </div>
          )}

          <div className="mb-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Saved Addresses
              </h2>

              {profile?.addresses && profile.addresses.length > 0 ? (
                <div className="space-y-4">
                  {profile.addresses.map((address) => (
                    <div key={address._id || `${address.street}-${address.pinCode}`} className="rounded-2xl bg-white p-4 border border-gray-100">
                      <p className="font-semibold text-gray-900">{address.street}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {address.city}, {address.state} {address.pinCode}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{address.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Your shipping details will appear here after your first completed checkout.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock3 className="w-5 h-5 text-indigo-600" /> Account Status
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Buyer backend connected and ready for live order creation.</p>
                <p>Razorpay checkout is available from the buyer checkout page.</p>
                <p>Recent orders sync directly from your MongoDB-backed API.</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Recent Orders
          </h2>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order._id}
                  href={`/profile/orders/${order._id}`}
                  className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{formatOrderDate(order.createdAt)}</p>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        {(order.items ?? []).slice(0, 3).map((item, index) => (
                          <p key={`${item.productTitle ?? "product"}-${index}`}>
                            {item.productTitle || "Product"} x {item.quantity ?? 1}
                            {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(order.totalAmount ?? 0).toLocaleString()}
                        </p>
                        <span className={`mt-2 inline-block text-xs font-semibold uppercase tracking-[0.15em] px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {formatStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
              <Link href="/shop" className="text-indigo-600 font-medium hover:underline">Start shopping</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
