"use client";

import { useCartStore } from "@/store/cartStore";
import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const emptySubscribe = () => () => {};

function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const mounted = useHasMounted();
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  if (!mounted) return null;

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
        <Link href="/shop" className="px-8 py-4 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const buildOrderPayload = () => {
    const itemPayload = items.map((item) => ({
      productId: item.id,
      variantSku: item.variantSku || null,
      quantity: item.quantity,
    }));

    return {
      items: itemPayload,
      paymentMethod,
      customer: {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        providerId: null,
      },
      shippingAddress: {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.postalCode,
        phone: formData.phone,
      },
      couponCode: couponCode.trim() || null,
    };
  };

  const applyCoupon = async () => {
    const normalized = couponCode.trim();
    if (!normalized) {
      setCouponMessage("Enter a coupon code.");
      setDiscountAmount(0);
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");
    try {
      const res = await fetch(`${API_BASE}/orders/coupon/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: normalized,
          subTotalAmount: totalPrice,
          items: items.map((item) => ({ category: item.category, brand: item.brand })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid coupon code.");
      }

      setDiscountAmount(Number(data.discountAmount || 0));
      setCouponMessage(`Coupon applied. You saved ₹${Number(data.discountAmount || 0).toLocaleString("en-IN")}.`);
    } catch (err) {
      setDiscountAmount(0);
      setCouponMessage(err instanceof Error ? err.message : "Invalid coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setCouponMessage("Coupon removed.");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const createOrderRes = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        },
        credentials: "include",
        body: JSON.stringify(buildOrderPayload()),
      });

      const createOrderData = await createOrderRes.json();
      if (!createOrderRes.ok || !createOrderData.success) {
        throw new Error(createOrderData.message || "Failed to create order.");
      }

      if (paymentMethod === "cod") {
        setSuccess(true);
        clearCart();
        return;
      }

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Failed to load Razorpay Checkout.");
      }

      const razorpay = createOrderData.razorpay;
      if (!razorpay?.orderId || !razorpay?.keyId) {
        throw new Error("Razorpay order details are missing.");
      }

      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency || "INR",
        name: "Aurenza",
        description: "Premium Fashion Purchase",
        order_id: razorpay.orderId,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#4f46e5" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/orders/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed.");
            }

            setSuccess(true);
            clearCart();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed.");
          }
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
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
          {/* Checkout Form */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
            
            <form onSubmit={handleCheckout} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
              {/* Contact Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input type="email" id="email" required value={formData.email} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                    <input type="tel" id="phone" required value={formData.phone} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                    <input type="text" id="firstName" required value={formData.firstName} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                    <input type="text" id="lastName" required value={formData.lastName} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" id="address" required value={formData.address} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" id="city" required value={formData.city} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" id="state" required value={formData.state} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                    <input type="text" id="postalCode" required value={formData.postalCode} onChange={onInputChange} className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 h-12 px-4 border" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      paymentMethod === "razorpay"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Pay Online (Razorpay)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      paymentMethod === "cod"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-indigo-600 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-70 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Lock className="w-5 h-5 opacity-70" /> {paymentMethod === "razorpay" ? "Pay" : "Place COD Order"} ₹{finalTotal.toLocaleString("en-IN")}</>
                )}
              </button>
              {!session && (
                <p className="text-sm text-gray-500">
                  Signed-out checkout is enabled. For order tracking in profile,{" "}
                  <button type="button" onClick={() => signIn("google")} className="font-semibold text-indigo-600 hover:underline">
                    sign in with Google
                  </button>.
                </p>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              <ul className="space-y-4 mb-6 border-b pb-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden border bg-gray-50">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">₹{item.price * item.quantity}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p className="font-medium text-gray-900">₹{totalPrice.toLocaleString("en-IN")}</p>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <p>Coupon Discount</p>
                    <p className="font-medium text-emerald-600">-₹{discountAmount.toLocaleString("en-IN")}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p>Shipping</p>
                  <p className="font-medium text-green-600">Free</p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <label htmlFor="coupon" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600">Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE10"
                    className="h-10 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {couponLoading ? "Applying" : "Apply"}
                  </button>
                  {discountAmount > 0 && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="rounded-xl border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-white"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`mt-2 text-xs ${discountAmount > 0 ? "text-emerald-700" : "text-rose-700"}`}>{couponMessage}</p>
                )}
              </div>

              <div className="flex justify-between items-center border-t pt-6">
                <p className="text-base font-medium text-gray-900">Total</p>
                <p className="text-2xl font-bold text-gray-900">₹{finalTotal.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
