"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { ArrowLeft, AlertCircle, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCartHydrated } from "@/store/useCartHydrated";
import { buildApiUrl } from "@/lib/api";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type PaymentMethod = "razorpay" | "cod";

interface CheckoutFormState {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

const initialFormState: CheckoutFormState = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
};

let razorpayScriptPromise: Promise<boolean> | null = null;

function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const hydrated = useCartHydrated();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const nameParts = splitFullName(session.user.name);
    const frameId = window.requestAnimationFrame(() => {
      setForm((current) => ({
        ...current,
        email: current.email || session.user?.email || "",
        firstName: current.firstName || nameParts.firstName,
        lastName: current.lastName || nameParts.lastName,
      }));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [session?.user]);

  useEffect(() => {
    if (!session?.backendToken) {
      return;
    }

    const controller = new AbortController();
    const defaultNames = splitFullName(session.user?.name);

    async function loadBuyerProfile() {
      try {
        const response = await fetch(buildApiUrl("/api/auth/buyer/me"), {
          headers: {
            Authorization: `Bearer ${session.backendToken}`,
          },
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const user = payload.user ?? {};
        const userAddresses = Array.isArray(user.addresses) ? user.addresses : [];
        const defaultAddress = userAddresses.find((address: { isDefault?: boolean }) => address.isDefault) || userAddresses[0];
        const buyerNames = splitFullName(user.name);

        setForm((current) => ({
          email: user.email || current.email,
          phone: user.phone || defaultAddress?.phone || current.phone,
          firstName: current.firstName || buyerNames.firstName || defaultNames.firstName,
          lastName: current.lastName || buyerNames.lastName || defaultNames.lastName,
          address: defaultAddress?.street || current.address,
          city: defaultAddress?.city || current.city,
          state: defaultAddress?.state || current.state,
          postalCode: defaultAddress?.pinCode || current.postalCode,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn("Could not preload buyer profile", error);
        }
      }
    }

    loadBuyerProfile();

    return () => controller.abort();
  }, [session?.backendToken, session?.user?.name]);

  if (!hydrated) {
    return null;
  }

  if (items.length === 0 && !success) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <Link href="/shop" className="mt-4 inline-block text-indigo-600 font-medium hover:underline">Return to Shop</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Thank you for your purchase. We have received your order and will send you an update when it ships.
        </p>
        <Link href="/profile" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
          View Orders
        </Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!session?.backendToken) {
      setErrorMessage("Please sign in before placing your order.");
      return;
    }

    setLoading(true);

    try {
      const shippingAddress = {
        street: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pinCode: form.postalCode.trim(),
        phone: form.phone.trim(),
      };

      const orderResponse = await fetch(buildApiUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantSku: item.variantSku,
            quantity: item.quantity,
          })),
          shippingAddress,
          paymentMethod,
        }),
      });

      const orderPayload = await orderResponse.json();

      if (!orderResponse.ok || !orderPayload.success) {
        throw new Error(orderPayload.message || "We couldn't create your order.");
      }

      if (paymentMethod === "cod") {
        clearCart();
        setSuccess(true);
        return;
      }

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const razorpayConfig = orderPayload.razorpay;
      if (!razorpayConfig?.orderId || !razorpayConfig?.keyId) {
        throw new Error("Razorpay is not configured correctly on the backend.");
      }

      const razorpayCheckout = new window.Razorpay({
        key: razorpayConfig.keyId,
        amount: razorpayConfig.amount,
        currency: razorpayConfig.currency || "INR",
        name: "Aurenza",
        description: "Aurenza order payment",
        order_id: razorpayConfig.orderId,
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#4f46e5",
        },
        handler: async (paymentResponse: Record<string, string>) => {
          try {
            const verifyResponse = await fetch(buildApiUrl("/api/orders/verify-payment"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.backendToken}`,
              },
              body: JSON.stringify(paymentResponse),
            });

            const verifyPayload = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyPayload.success) {
              throw new Error(verifyPayload.message || "Payment verification failed.");
            }

            clearCart();
            setSuccess(true);
          } catch (error: any) {
            setErrorMessage(error?.message || "Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      razorpayCheckout.open();
      return;
    } catch (error: any) {
      setErrorMessage(error?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="container mx-auto px-4 py-8">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

            {status !== "authenticated" ? (
              <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                    <ShieldCheck className="w-5 h-5" />
                    Sign in required
                  </div>
                  <p className="mt-2 text-sm text-indigo-900/75">
                    Sign in to sync your buyer record, save shipping details, and complete Razorpay payment securely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signIn(undefined, { callbackUrl: "/checkout" })}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-4 text-white font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Sign in to continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                {errorMessage && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-800 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                      <input
                        type="tel"
                        id="phone"
                        required
                        value={form.phone}
                        onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <input
                        type="text"
                        id="firstName"
                        required
                        value={form.firstName}
                        onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <input
                        type="text"
                        id="lastName"
                        required
                        value={form.lastName}
                        onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        id="address"
                        required
                        value={form.address}
                        onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        id="city"
                        required
                        value={form.city}
                        onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        id="state"
                        required
                        value={form.state}
                        onChange={(e) => setForm((current) => ({ ...current, state: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                      <input
                        type="text"
                        id="postalCode"
                        required
                        value={form.postalCode}
                        onChange={(e) => setForm((current) => ({ ...current, postalCode: e.target.value }))}
                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("razorpay")}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        paymentMethod === "razorpay"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold">Razorpay</p>
                      <p className="mt-1 text-sm">UPI, cards, netbanking, wallets</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        paymentMethod === "cod"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold">Cash on Delivery</p>
                      <p className="mt-1 text-sm">Fallback option for local delivery</p>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-indigo-600 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-5 h-5 opacity-70" />
                      {paymentMethod === "razorpay"
                        ? `Pay ₹${totalPrice().toLocaleString()}`
                        : `Place COD order · ₹${totalPrice().toLocaleString()}`}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="lg:w-96">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              <ul className="space-y-4 mb-6 border-b pb-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-50">
                      <Image
                        src={item.image || "/placeholder-product.svg"}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.variantLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">₹{item.price * item.quantity}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p className="font-medium text-gray-900">₹{totalPrice().toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p className="font-medium text-green-600">Free</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-6">
                <p className="text-base font-medium text-gray-900">Total</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalPrice().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
