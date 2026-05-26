"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, Package, LogOut, Truck, CheckCircle2, Clock3, Heart, History, MapPin, Save } from "lucide-react";

type OrderItem = {
  productTitle: string;
  variantLabel?: string;
  quantity: number;
  priceAtPurchase: number;
  productImage?: string;
};

type Order = {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  trackingHistory?: { status: string; location?: string; timestamp: string }[];
};

type Address = {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  isDefault?: boolean;
};

type AccountUser = {
  name: string;
  email: string;
  phone?: string | null;
  addresses?: Address[];
};

type ProductCard = {
  _id: string;
  title: string;
  basePrice: number;
  images: string[];
  category: string;
};

const statusClassMap: Record<string, string> = {
  placed: "bg-sky-100 text-sky-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const toTitle = (v = "") => v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const emptyAddress = (): Address => ({
  street: "",
  city: "",
  state: "",
  pinCode: "",
  phone: "",
  isDefault: false,
});

export default function ProfilePage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([emptyAddress()]);

  const [wishlistedProducts, setWishlistedProducts] = useState<ProductCard[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductCard[]>([]);

  const signedInEmail = session?.user?.email || "";

  useEffect(() => {
    async function loadOrders() {
      if (!signedInEmail) return;
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const res = await fetch("/api/orders", { method: "GET", cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load orders.");
        }
        setOrders(data.orders || []);
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : "Failed to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    }

    loadOrders();
  }, [signedInEmail]);

  useEffect(() => {
    async function loadProfile() {
      if (!signedInEmail) return;
      setProfileLoading(true);
      setProfileError("");

      try {
        const res = await fetch("/api/account", { method: "GET", cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load account profile.");
        }

        const user: AccountUser = data.user;
        setName(user.name || "");
        setPhone(user.phone || "");
        setAddresses(user.addresses?.length ? user.addresses : [emptyAddress()]);
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Unable to load profile details.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [signedInEmail]);

  useEffect(() => {
    async function loadLocalCollections() {
      if (typeof window === "undefined") return;

      const wishlistIds = JSON.parse(localStorage.getItem("aurenza_wishlist") || "[]");
      const recentIds = JSON.parse(localStorage.getItem("aurenza_recently_viewed") || "[]");

      const fetchByIds = async (ids: string[]) => {
        if (!ids.length) return [];
        const params = new URLSearchParams();
        params.set("ids", ids.join(","));
        params.set("limit", String(Math.min(ids.length, 24)));
        const res = await fetch(`/api/proxy-products?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) return [];

        const map = new Map((data.products || []).map((product: ProductCard) => [product._id, product]));
        return ids.map((id) => map.get(id)).filter(Boolean);
      };

      const [wishlistRows, recentRows] = await Promise.all([
        fetchByIds(wishlistIds),
        fetchByIds(recentIds),
      ]);

      setWishlistedProducts(wishlistRows as ProductCard[]);
      setRecentProducts(recentRows as ProductCard[]);
    }

    loadLocalCollections();
  }, [signedInEmail]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter((order) => order.orderStatus === "delivered").length;
    const processing = orders.filter((order) => ["placed", "processing", "shipped"].includes(order.orderStatus)).length;
    return { total, delivered, processing };
  }, [orders]);

  const onSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const cleanedAddresses = addresses
        .map((address) => ({
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          pinCode: address.pinCode.trim(),
          phone: address.phone.trim(),
          isDefault: Boolean(address.isDefault),
        }))
        .filter((address) => address.street && address.city && address.state && address.pinCode && address.phone);

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, addresses: cleanedAddresses }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-amber-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Not signed in</h2>
        <p className="text-slate-500 mb-8">Sign in to view your account, saved addresses, wishlist, and full order history.</p>
        <button type="button" onClick={() => signIn()} className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-6">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-r from-[#f8f1e8] via-[#f5efe7] to-[#fdf9f2] p-7 sm:p-10 shadow-[0_24px_60px_rgba(26,20,10,0.08)]">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <Image src={session.user?.image || "/placeholder.svg"} alt="Profile" width={88} height={88} className="h-22 w-22 rounded-full border-4 border-white shadow-sm" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700">Aurenza Account</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">{session.user?.name}</h1>
            <p className="text-amber-700 font-medium">{session.user?.email}</p>
          </div>
          <button onClick={() => signOut()} className="sm:ml-auto mt-3 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-white bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.processing}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats.delivered}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-700" /> Profile & Addresses</h2>
          {profileError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div>}
          {profileSuccess && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileSuccess}</div>}

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </div>

            {addresses.map((address, idx) => (
              <div key={`address-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <input placeholder="Street" value={address.street} onChange={(e) => setAddresses((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, street: e.target.value } : row))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="City" value={address.city} onChange={(e) => setAddresses((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, city: e.target.value } : row))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="State" value={address.state} onChange={(e) => setAddresses((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, state: e.target.value } : row))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="PIN Code" value={address.pinCode} onChange={(e) => setAddresses((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, pinCode: e.target.value } : row))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input placeholder="Phone" value={address.phone} onChange={(e) => setAddresses((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, phone: e.target.value } : row))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button type="button" onClick={() => setAddresses((prev) => [...prev, emptyAddress()])} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Add Address</button>
              {addresses.length > 1 && (
                <button type="button" onClick={() => setAddresses((prev) => prev.slice(0, -1))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Remove Last</button>
              )}
            </div>

            <button type="button" disabled={profileLoading} onClick={onSaveProfile} className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {profileLoading ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><Package className="w-5 h-5 text-amber-700" /> Order History</h2>

          {ordersLoading ? (
            <div className="py-16 flex justify-center"><div className="w-8 h-8 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin"></div></div>
          ) : ordersError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
              <p className="text-slate-500 mb-4">You have no orders yet.</p>
              <Link href="/shop" className="text-amber-700 font-medium hover:underline">Start shopping</Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-auto pr-1">
              {orders.map((order) => {
                const latestTrack = order.trackingHistory?.[order.trackingHistory.length - 1];
                const statusClass = statusClassMap[order.orderStatus] || "bg-slate-100 text-slate-700";

                return (
                  <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">Order ID</p>
                        <p className="font-mono font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wider text-slate-500">Placed On</p>
                        <p className="font-semibold text-slate-900">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClass}`}>{toTitle(order.orderStatus)}</span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : order.paymentStatus === "failed" ? "bg-red-100 text-red-700" : order.paymentStatus === "refunded" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"}`}>{toTitle(order.paymentStatus)}</span>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={`${order._id}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <p className="text-slate-800 truncate">{item.productTitle} <span className="text-slate-500">x{item.quantity}</span></p>
                          <p className="font-semibold text-slate-900">₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="text-sm text-slate-600 flex items-center gap-2">
                        {order.orderStatus === "delivered" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : order.orderStatus === "shipped" ? <Truck className="h-4 w-4 text-indigo-600" /> : <Clock3 className="h-4 w-4 text-amber-600" />}
                        <span>{latestTrack ? `${latestTrack.status}${latestTrack.location ? ` - ${latestTrack.location}` : ""}` : "Order update in progress"}</span>
                      </div>
                      <p className="text-lg font-bold text-amber-700">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-amber-700" /> Wishlist</h2>
          {wishlistedProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No wishlisted products yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {wishlistedProducts.slice(0, 4).map((product) => (
                <Link key={product._id} href={`/product/${product._id}`} className="rounded-xl border border-slate-200 p-3 hover:border-amber-300 transition-colors">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100">
                    <Image src={product.images?.[0] || "/placeholder.svg"} alt={product.title} fill sizes="240px" className="object-cover" />
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900">{product.title}</p>
                  <p className="text-sm font-bold text-amber-700">₹{product.basePrice.toLocaleString("en-IN")}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><History className="h-5 w-5 text-amber-700" /> Recently Viewed</h2>
          {recentProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No recently viewed products yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentProducts.slice(0, 4).map((product) => (
                <Link key={product._id} href={`/product/${product._id}`} className="rounded-xl border border-slate-200 p-3 hover:border-amber-300 transition-colors">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-slate-100">
                    <Image src={product.images?.[0] || "/placeholder.svg"} alt={product.title} fill sizes="240px" className="object-cover" />
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900">{product.title}</p>
                  <p className="text-sm font-bold text-amber-700">₹{product.basePrice.toLocaleString("en-IN")}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
