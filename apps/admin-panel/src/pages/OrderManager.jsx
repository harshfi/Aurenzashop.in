import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2, ArrowLeft, Clock, MapPin, Truck, ChevronDown, ChevronUp, AlertCircle, Copy, Check, RefreshCw, ClipboardList } from "lucide-react";
import api from "../lib/api";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@aurenza/shared";

// Map shared constants to display labels
const formatStatusLabel = (status) => {
  if (!status) return "Unknown";
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const getOrderItemKey = (item, index) =>
  [
    item.product || item.productTitle || "item",
    item.variantSku || item.variantLabel || "variant",
    index,
  ].join("-");

export default function OrderManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOrderId = searchParams.get("id");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(selectedOrderId || null);
  const [refreshingTrackingId, setRefreshingTrackingId] = useState(null);
  const [copiedAwb, setCopiedAwb] = useState(null);

  useEffect(() => {
    loadOrders();
    if (selectedOrderId) {
      setExpandedOrderId(selectedOrderId);
    }
  }, [search, statusFilter, selectedOrderId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (search) queryParams.append("search", search);

      const res = await api.get(`/orders/admin/all?${queryParams.toString()}`);
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let res;
      if (newStatus === ORDER_STATUSES.PACKED) {
        res = await api.put(`/orders/admin/${orderId}/pack`);
      } else {
        res = await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
      }
      if (res.data?.success) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  ...res.data.order,
                }
              : order
          )
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status.");
    }
  };

  const handleToggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    if (expandedOrderId === orderId && selectedOrderId) {
      setSearchParams({});
    }
  };

  const handleCopyAwb = async (awb) => {
    try {
      await navigator.clipboard.writeText(awb);
      setCopiedAwb(awb);
      setTimeout(() => setCopiedAwb(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleRefreshTracking = async (orderId) => {
    setRefreshingTrackingId(orderId);
    try {
      const res = await api.get(`/orders/admin/${orderId}/tracking`);
      if (res.data?.success && res.data.tracking) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  orderStatus: res.data.tracking.orderStatus,
                  trackingHistory: res.data.tracking.trackingHistory,
                  delhiveryLive: res.data.tracking.delhiveryLive,
                  delhiveryError: res.data.tracking.delhiveryError,
                }
              : order
          )
        );
      }
    } catch (err) {
      console.error("Failed to refresh tracking:", err);
      alert("Failed to refresh tracking data from Delhivery.");
    } finally {
      setRefreshingTrackingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Search by ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-sm pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#e94560]/50 focus:bg-white/10 transition-all text-white placeholder-white/30 shadow-inner"
            />
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-text-secondary group-focus-within:text-[#e94560] transition-colors" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#e94560]/50 focus:bg-white/10 text-text-secondary transition-all shadow-inner appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="" className="bg-[#121225]">All Statuses</option>
            {Object.values(ORDER_STATUSES).map(status => (
              <option key={status} value={status} className="bg-[#121225]">{formatStatusLabel(status)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="glass rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {loading ? (
          <div className="h-64 flex items-center justify-center relative z-10">
            <Loader2 className="h-8 w-8 text-[#e94560] animate-spin drop-shadow-[0_0_15px_rgba(233,69,96,0.5)]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-text-secondary relative z-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <ClipboardList className="h-7 w-7 text-text-secondary/50" />
            </div>
            <p className="font-medium tracking-wide">No orders found.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 relative z-10">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const dateObj = new Date(order.createdAt);
              const formattedDate = Number.isNaN(dateObj.getTime())
                ? "Date unavailable"
                : new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(dateObj);

              const isPaid = order.paymentStatus === PAYMENT_STATUSES.PAID;
              
              // Status progression logic
              const nextStatusOptions = [];
              if (order.orderStatus === ORDER_STATUSES.PLACED) {
                nextStatusOptions.push({ value: ORDER_STATUSES.CONFIRMED, label: 'Confirm Order' });
                nextStatusOptions.push({ value: ORDER_STATUSES.CANCELLED, label: 'Cancel Order', destructive: true });
              } else if (order.orderStatus === ORDER_STATUSES.CONFIRMED) {
                nextStatusOptions.push({ value: ORDER_STATUSES.PACKED, label: 'Mark as Packed (Generate AWB)' });
              }
              // If packed, status becomes "shipped", "out_for_delivery", "delivered" via webhook automatically usually.

              return (
                <div key={order._id} className={`transition-colors ${isExpanded ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"}`}>
                  {/* Summary Row (Clickable) */}
                  <div
                    className="p-6 sm:px-8 cursor-pointer group"
                    onClick={() => handleToggleExpand(order._id)}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      <div className="flex items-start gap-5">
                        <div className="mt-1">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[#e94560]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-text-secondary group-hover:text-white transition-colors" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg text-white group-hover:text-[#e94560] transition-colors">
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                              isPaid ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                            }`}>
                              {isPaid && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                              {!isPaid && <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
                              {formatStatusLabel(order.paymentStatus)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                            <span className="font-medium text-white/80">{order.user?.name || order.user?.email || "Unknown User"}</span>
                            <span>•</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center ml-10 sm:ml-0 gap-2">
                        <span className="text-lg font-bold text-white">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          order.orderStatus === ORDER_STATUSES.DELIVERED ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" :
                          order.orderStatus === ORDER_STATUSES.CANCELLED ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]" :
                          "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                        }`}>
                          {formatStatusLabel(order.orderStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 sm:px-8 pb-8 pt-2 cursor-default animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1 & 2: Items & Shipping */}
                        <div className="lg:col-span-2 space-y-6">
                          
                          {/* AWB / Delhivery Tracking Section */}
                          <div className="bg-[#121225] border border-white/5 rounded-2xl p-5 shadow-inner">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <Truck className="h-4 w-4 text-[#e94560]" />
                                Shipping Logistics
                              </h4>
                              {order.delhiveryAWB && (
                                <button
                                  onClick={() => handleRefreshTracking(order._id)}
                                  disabled={refreshingTrackingId === order._id}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                                >
                                  <RefreshCw className={`h-3 w-3 ${refreshingTrackingId === order._id ? "animate-spin" : ""}`} />
                                  Refresh
                                </button>
                              )}
                            </div>

                            {order.delhiveryAWB ? (
                                <div className="space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1">Delhivery AWB Number</span>
                                      <div className="flex items-center gap-3">
                                      <span className="font-mono text-lg font-bold text-white tracking-widest">{order.delhiveryAWB}</span>
                                      <button 
                                        onClick={() => handleCopyAwb(order.delhiveryAWB)}
                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                                        title="Copy AWB"
                                      >
                                        {copiedAwb === order.delhiveryAWB ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                    </div>
                                  </div>

                                  {order.delhiveryError && (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                      {order.delhiveryError}
                                    </div>
                                  )}

                                  {order.delhiveryLive && (
                                    <div className="mt-4 sm:mt-0 text-left sm:text-right">
                                      <div className="inline-flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live Status</span>
                                      </div>
                                      <p className="text-sm font-semibold text-white mt-0.5">{order.delhiveryLive.status}</p>
                                      {order.delhiveryLive.location && (
                                        <p className="text-xs text-text-secondary flex items-center justify-start sm:justify-end gap-1 mt-0.5">
                                          <MapPin className="h-3 w-3" /> {order.delhiveryLive.location}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Tracking Timeline */}
                                {order.trackingHistory && order.trackingHistory.length > 0 && (
                                  <div className="mt-6 pt-4 border-t border-white/5">
                                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-4">Tracking Timeline</h5>
                                    <div className="space-y-0 relative before:absolute before:inset-0 before:ml-[7px] before:-translate-x-px before:h-full before:w-px before:bg-gradient-to-b before:from-[#e94560] before:via-white/10 before:to-transparent">
                                      {[...order.trackingHistory].reverse().map((entry, idx) => {
                                        const isLatest = idx === 0;
                                        return (
                                          <div key={idx} className="relative flex items-start gap-4 pb-6 last:pb-0">
                                            <div className={`mt-1 flex items-center justify-center w-3.5 h-3.5 rounded-full border-2 shrink-0 relative z-10 ${isLatest ? 'bg-[#e94560] border-[#e94560] ring-4 ring-[#e94560]/20' : 'bg-[#121225] border-white/20'}`} />
                                            <div>
                                              <p className={`text-sm font-bold ${isLatest ? 'text-white' : 'text-text-secondary'}`}>{entry.status}</p>
                                              {entry.location && (
                                                <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                                                  <MapPin className="h-3 w-3" /> {entry.location}
                                                </p>
                                              )}
                                              <p className="text-[10px] text-text-secondary/60 mt-1 font-medium">
                                                {new Date(entry.timestamp).toLocaleString("en-IN", {
                                                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-text-secondary">
                                <AlertCircle className="h-5 w-5 opacity-50" />
                                <p>Tracking ID (AWB) will be generated automatically when order is marked as Packed.</p>
                              </div>
                            )}
                          </div>

                          <div className="bg-[#121225] border border-white/5 rounded-2xl p-5 shadow-inner">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Order Items</h4>
                            <div className="space-y-4">
                              {order.items?.map((item, index) => (
                                <div key={getOrderItemKey(item, index)} className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                  <div className="h-16 w-16 bg-[#0f0f1a] rounded-xl overflow-hidden border border-white/5 shrink-0 shadow-inner">
                                    {item.productImage ? (
                                      <img src={item.productImage} alt={item.productTitle} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-[8px] text-text-secondary">No img</div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{item.productTitle}</p>
                                    <p className="text-[10px] text-text-secondary mt-1 tracking-wide">{item.variantLabel}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs font-semibold text-white/80">Qty: {item.quantity}</p>
                                      <p className="text-sm font-bold text-[#e94560]">₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Status Updates & Details */}
                        <div className="space-y-6">
                          {nextStatusOptions.length > 0 && (
                            <div className="bg-[#121225] border border-white/5 rounded-2xl p-5 shadow-inner">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Quick Actions</h4>
                              <div className="space-y-3">
                                {nextStatusOptions.map(option => (
                                  <button
                                    key={option.value}
                                    onClick={() => updateOrderStatus(order._id, option.value)}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                      option.destructive
                                        ? "bg-transparent border border-red-500/20 text-red-400 hover:bg-red-500/10"
                                        : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_20px_rgba(14,165,233,0.5)]"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-[#121225] border border-white/5 rounded-2xl p-5 shadow-inner">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Payment Info</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Method:</span>
                                <span className="font-bold text-white uppercase">{order.paymentMethod}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Amount:</span>
                                <span className="font-bold text-white">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                              </div>
                              {order.razorpayOrderId && (
                                <div className="pt-3 mt-1 border-t border-white/5">
                                  <span className="block text-[10px] uppercase tracking-widest text-text-secondary mb-1">Razorpay Order ID</span>
                                  <span className="font-mono text-xs font-semibold text-white/80 break-all">{order.razorpayOrderId}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-[#121225] border border-white/5 rounded-2xl p-5 shadow-inner">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Shipping Address</h4>
                            <div className="text-sm text-white/90 space-y-1.5 font-medium">
                              <p className="font-bold text-white mb-2">{order.user?.name || "Customer"}</p>
                              <p>{order.shippingAddress?.street}</p>
                              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                              <p>PIN: {order.shippingAddress?.pinCode}</p>
                              <p className="pt-2 text-text-secondary font-mono text-xs flex items-center gap-2">
                                <span className="uppercase tracking-widest text-[9px] font-bold">Tel:</span>
                                {order.shippingAddress?.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
