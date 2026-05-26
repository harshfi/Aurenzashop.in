import React, { useCallback, useState, useEffect } from "react";
import { Search, Loader2, Package, Truck, CheckCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import api from "../lib/api";

const toTitleCase = (value = "") =>
  value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Status modification states
  const [updatingId, setUpdatingId] = useState(null);
  const [weightMap, setWeightMap] = useState({}); // weight per order for Delhivery packing

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (paymentFilter) queryParams.append("paymentStatus", paymentFilter);

      const res = await api.get(`/orders/admin/all?${queryParams.toString()}`);
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      setOrders([]);
      if (err?.isAuthError) {
        setError("Admin session expired. Please sign in again.");
      } else {
        setError(err?.response?.data?.message || "Failed to load orders.");
      }
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handlePackOrder = async (id) => {
    const weight = weightMap[id] || 500;
    setUpdatingId(id);
    try {
      const res = await api.put(`/orders/admin/${id}/pack`, { weight });
      if (res.data?.success) {
        alert(`Order packed successfully! AWB: ${res.data.awb}`);
        loadOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to pack order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/orders/admin/${id}/status`, { status, location: "Aurenza Hub" });
      if (res.data?.success) {
        alert(`Order status updated to ${status}.`);
        loadOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRefund = async (id, totalAmount) => {
    const reason = prompt("Refund reason (required):", "Customer requested cancellation") || "";
    if (!reason.trim()) return;

    setUpdatingId(id);
    try {
      const res = await api.put(`/orders/admin/${id}/refund`, { amount: totalAmount, reason });
      if (res.data?.success) {
        alert("Refund processed successfully.");
        loadOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to process refund.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "placed": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "processing": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "shipped": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "delivered": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "cancelled": return "bg-red-500/10 text-red-400 border border-red-500/20";
      default: return "bg-white/5 text-slate-500 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-500 transition-colors"
        >
          <option value="">All Order Statuses</option>
          <option value="placed">Placed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-slate-100 border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-500 transition-colors"
        >
          <option value="">All Payment Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders log */}
      <div className="glass rounded-2xl border border-slate-200 p-6 shadow-lg">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading && orders.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic space-y-2">
            <Package className="h-8 w-8 text-slate-500/35 mx-auto" />
            <p>No orders found matching filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const isUpdating = updatingId === order._id;

              return (
                <div key={order._id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:border-white/10 transition-colors">
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(order._id)}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer text-xs sm:text-sm select-none"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
                      <div>
                        <span className="font-mono font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{order.user?.name}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Amount</span>
                      <p className="font-bold text-indigo-700 mt-0.5">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                    </div>

                    <div>
                      <span className="text-slate-500">Payment</span>
                      <div className="mt-0.5">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          order.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          order.paymentStatus === "refunded" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                          order.paymentStatus === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {toTitleCase(order.paymentStatus)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Status</span>
                      <div className="mt-0.5">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(order.orderStatus)}`}>
                          {toTitleCase(order.orderStatus)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500">Placed On</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Expansion Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-top-3 duration-200">
                      {/* Left: Items list & address */}
                      <div className="lg:col-span-8 space-y-6">
                        {/* Items */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Items ordered</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="h-10 w-10 rounded overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                  {item.productImage ? (
                                    <img src={item.productImage} alt={item.productTitle} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[7px] text-slate-500">Aurenza</div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-slate-900 truncate">{item.productTitle}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{item.variantSku} — {item.variantLabel} × {item.quantity}</p>
                                </div>
                                <span className="text-xs font-bold text-indigo-700">₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer info</h4>
                            <div className="text-xs space-y-1 text-slate-500">
                              <p className="text-slate-900 font-semibold">{order.user?.name}</p>
                              <p>✉️ {order.user?.email}</p>
                              <p>📞 {order.shippingAddress.phone}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery Address</h4>
                            <div className="text-xs space-y-1 text-slate-500">
                              <p className="text-slate-900 font-medium">{order.shippingAddress.street}</p>
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & logistics */}
                      <div className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-6 pt-6 lg:pt-0">
                        {/* Quick Status Control */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Status Actions</h4>
                          
                          {isUpdating ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Loader2 className="h-4.5 w-4.5 text-indigo-700 animate-spin" />
                              <span>Updating order status...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {/* Conditionally show Pack & Generate AWB button */}
                              {order.orderStatus === "placed" ? (
                                <div className="space-y-2 p-3 bg-secondary/15 rounded-xl border border-slate-200">
                                  <label className="block text-[10px] uppercase font-bold text-slate-500">Shipment weight (g)</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      value={weightMap[order._id] || 500}
                                      onChange={(e) => setWeightMap({ ...weightMap, [order._id]: Number(e.target.value) })}
                                      className="w-20 border border-slate-200 bg-white text-xs p-1.5 rounded-lg text-slate-900 text-center"
                                    />
                                    <button
                                      onClick={() => handlePackOrder(order._id)}
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-md cursor-pointer"
                                    >
                                      <Truck className="h-4 w-4" />
                                      <span>Pack & Generate AWB</span>
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              <div className="grid grid-cols-2 gap-2">
                                {order.orderStatus === "processing" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "shipped")}
                                    className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Ship Order
                                  </button>
                                )}
                                {order.orderStatus === "shipped" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "delivered")}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "cancelled")}
                                    className="bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/10 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                                {order.paymentStatus === "paid" && order.refundStatus !== "refunded" && (
                                  <button
                                    onClick={() => handleRefund(order._id, order.totalAmount)}
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Refund
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delhivery scan logs */}
                        {order.trackingHistory && order.trackingHistory.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-slate-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tracking Logs</h4>
                            <div className="space-y-3 text-[11px] max-h-48 overflow-y-auto pr-1">
                              {order.trackingHistory.map((scan, idx) => (
                                <div key={idx} className="border-l-2 border-indigo-200 pl-3 py-0.5 space-y-0.5">
                                  <p className="font-semibold text-slate-900/95">{scan.status}</p>
                                  {scan.location && <p className="text-slate-500">Location: {scan.location}</p>}
                                  <p className="text-[10px] text-slate-500">{new Date(scan.timestamp).toLocaleString("en-IN")}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
