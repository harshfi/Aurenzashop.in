"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { buildApiUrl } from "@/lib/api";

interface TrackingEntry {
  status: string;
  location?: string;
  timestamp: string;
}

interface OrderItem {
  _id?: string;
  product: string;
  variantSku: string;
  quantity: number;
  priceAtPurchase: number;
  productTitle: string;
  productImage: string;
  variantLabel: string;
}

interface OrderDetails {
  _id: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  delhiveryAWB?: string | null;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
  };
  trackingHistory: TrackingEntry[];
  razorpayOrderId?: string;
}

interface TrackingInfo {
  orderStatus: string;
  awb: string | null;
  trackingHistory: TrackingEntry[];
  delhiveryLive?: {
    status: string;
    location: string;
    lastUpdated: string;
  } | null;
  delhiveryError?: string | null;
}

function formatOrderDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatusLabel(value?: string | null) {
  if (!value) return "Unknown";
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

function getOrderItemKey(item: OrderItem, index: number) {
  return [
    item.product || item.productTitle || "item",
    item.variantSku || item.variantLabel || "variant",
    index,
  ].join("-");
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { data: session } = useSession();
  const backendToken = session?.backendToken;
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [trackingData, setTrackingData] = useState<TrackingInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const refreshTracking = useCallback(async (orderId: string, token: string) => {
    try {
      setIsRefreshing(true);
      setTrackingError(null);

      const res = await fetch(buildApiUrl(`/api/orders/${orderId}/tracking`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.tracking) {
        throw new Error(data.message || "Failed to refresh tracking");
      }

      setTrackingData(data.tracking);
      setTrackingError(data.tracking.delhiveryError || null);

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: data.tracking.orderStatus,
              trackingHistory: data.tracking.trackingHistory,
            }
          : null
      );
    } catch (err: unknown) {
      console.error("Failed to refresh tracking", err);
      setTrackingError(err instanceof Error ? err.message : "Failed to refresh tracking");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!backendToken) return;

    const controller = new AbortController();

    async function fetchOrderDetails() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(buildApiUrl(`/api/orders/detail/${id}`), {
          headers: { Authorization: `Bearer ${backendToken}` },
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load order details");
        
        const data = await res.json();
        const foundOrder = data.order;
        
        if (!foundOrder) {
          throw new Error("Order not found");
        }
        
        setOrder(foundOrder);

        // If it has an AWB, trigger a tracking refresh automatically on load
        if (foundOrder.delhiveryAWB) {
          await refreshTracking(foundOrder._id, backendToken);
        } else {
          setTrackingData(null);
          setTrackingError(null);
        }

      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err.message || "An error occurred while fetching your order.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchOrderDetails();
    return () => controller.abort();
  }, [backendToken, id, refreshTracking]);

  const handleCopyAwb = async () => {
    if (!order?.delhiveryAWB) return;
    try {
      await navigator.clipboard.writeText(order.delhiveryAWB);
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "We couldn't find the order you're looking for."}</p>
        <Link href="/profile" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>
    );
  }

  // Use tracking data if refreshed, otherwise fallback to initial order data
  const history = trackingData?.trackingHistory || order.trackingHistory || [];
  const liveData = trackingData?.delhiveryLive;

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column */}
          <div className="flex-1 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order._id.slice(-6).toUpperCase()}</h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Placed on {formatOrderDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <span className={`inline-block text-xs font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}>
                  {formatStatusLabel(order.orderStatus)}
                </span>
                <span className="text-sm font-medium text-gray-500">
                  Total: <span className="text-gray-900 font-bold">₹{order.totalAmount.toLocaleString()}</span>
                </span>
              </div>
            </div>

            {/* Tracking & Timeline Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-indigo-900">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Tracking Details</h2>
                    {order.delhiveryAWB ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">AWB:</span>
                        <span className="font-mono font-semibold text-gray-900">{order.delhiveryAWB}</span>
                        <button onClick={handleCopyAwb} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Copy AWB">
                          {copiedAwb ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={`https://www.delhivery.com/track/package/${order.delhiveryAWB}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Track on Delhivery"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-1">Tracking ID pending</p>
                    )}
                  </div>
                </div>

                {order.delhiveryAWB && (
                  <button
                    onClick={() => refreshTracking(order._id, session!.backendToken!)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh Tracking"}
                  </button>
                )}
              </div>
              
              <div className="p-6 sm:p-8 bg-gray-50/50">
                {trackingError && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {trackingError}
                  </div>
                )}

                {liveData && (
                   <div className="mb-6 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                     <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                     <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Live Status</span>
                     <span className="text-sm font-medium text-gray-900 ml-1">{liveData.status}</span>
                     {liveData.location && <span className="text-sm text-gray-500">({liveData.location})</span>}
                   </div>
                )}

                {history.length > 0 ? (
                  <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-gray-200 before:to-transparent">
                    {[...history].reverse().map((entry, idx) => {
                      const isLatest = idx === 0;
                      return (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active pb-8">
                          {/* Icon */}
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${isLatest ? 'bg-indigo-600 border-indigo-100 ring-2 ring-indigo-50 z-10' : 'bg-white border-gray-200 z-10'}`}>
                            {isLatest && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                          </div>
                          
                          {/* Card */}
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm group-hover:border-indigo-100 transition-colors">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                              <h3 className={`font-bold ${isLatest ? 'text-indigo-900' : 'text-gray-700'}`}>{entry.status}</h3>
                              <time className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                {new Date(entry.timestamp).toLocaleString("en-IN", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </time>
                            </div>
                            {entry.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {entry.location}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tracking updates available yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Items ({order.items.length})</h2>
              </div>
              <ul className="divide-y divide-gray-50">
                {order.items.map((item, index) => (
                  <li key={getOrderItemKey(item, index)} className="p-6 sm:p-8 flex gap-4 sm:gap-6">
                    <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                      <Image
                        src={item.productImage || "/placeholder-product.svg"}
                        alt={item.productTitle}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 line-clamp-2">{item.productTitle}</h4>
                          <p className="text-sm text-gray-500 mt-1">{item.variantLabel}</p>
                        </div>
                        <p className="font-bold text-gray-900 whitespace-nowrap">
                          ₹{(item.priceAtPurchase * item.quantity).toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <p className="text-gray-500">Qty: <span className="font-medium text-gray-900">{item.quantity}</span></p>
                        <p className="text-gray-500">₹{item.priceAtPurchase.toLocaleString()} each</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
          </div>

          {/* Sidebar Column */}
          <div className="lg:w-80 space-y-6">
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" /> Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900 mb-2">{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>PIN: {order.shippingAddress.pinCode}</p>
                <p className="pt-2 text-gray-500">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium text-gray-900 uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formatStatusLabel(order.paymentStatus)}
                  </span>
                </div>
                {order.razorpayOrderId && (
                  <div className="pt-3 mt-3 border-t border-gray-50 break-all">
                    <span className="block text-xs text-gray-400 mb-1">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-600">{order.razorpayOrderId}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
