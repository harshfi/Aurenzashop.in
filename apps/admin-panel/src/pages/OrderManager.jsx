import React, { useState, useEffect } from "react";
import { Search, Loader2, Package, Truck, CheckCircle, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import api from "../lib/api";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Status modification states
  const [updatingId, setUpdatingId] = useState(null);
  const [weightMap, setWeightMap] = useState({}); // weight per order for Delhivery packing

  const loadOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append("status", statusFilter);
      if (paymentFilter) queryParams.append("paymentStatus", paymentFilter);

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

  useEffect(() => {
    loadOrders();
  }, [statusFilter, paymentFilter]);

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Placed": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Confirmed": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "Packed": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "Shipped": case "Out for Delivery": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Delivered": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-400 border border-red-500/20";
      default: return "bg-white/5 text-text-secondary border border-white/5";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#16213e]/40 border border-white/5 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 text-text-secondary transition-colors"
        >
          <option value="">All Order Statuses</option>
          <option value="Placed">Placed</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-[#16213e]/40 border border-white/5 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 text-text-secondary transition-colors"
        >
          <option value="">All Payment Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Orders log */}
      <div className="glass rounded-2xl border border-white/5 p-6 shadow-lg">
        {loading && orders.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#e94560] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-text-secondary italic space-y-2">
            <Package className="h-8 w-8 text-text-secondary/35 mx-auto" />
            <p>No orders found matching filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const isUpdating = updatingId === order._id;

              return (
                <div key={order._id} className="border border-white/5 rounded-xl overflow-hidden bg-white/2 hover:border-white/10 transition-colors">
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(order._id)}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer text-xs sm:text-sm select-none"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-text-secondary" /> : <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />}
                      <div>
                        <span className="font-mono font-bold text-white">#{order._id.slice(-8).toUpperCase()}</span>
                        <p className="text-[10px] text-text-secondary mt-0.5">{order.user?.name}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary">Amount</span>
                      <p className="font-bold text-accent mt-0.5">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                    </div>

                    <div>
                      <span className="text-text-secondary">Payment</span>
                      <div className="mt-0.5">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          order.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          order.paymentStatus === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary">Status</span>
                      <div className="mt-0.5">
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-text-secondary">Placed On</span>
                      <p className="font-semibold text-white mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Expansion Panel */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-top-3 duration-200">
                      {/* Left: Items list & address */}
                      <div className="lg:col-span-8 space-y-6">
                        {/* Items */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Items ordered</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-white/2 p-3 rounded-lg border border-white/5">
                                <div className="h-10 w-10 rounded overflow-hidden bg-[#16213e]/40 border border-white/5 flex-shrink-0">
                                  {item.productImage ? (
                                    <img src={item.productImage} alt={item.productTitle} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[7px] text-text-secondary">Aurenza</div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-white truncate">{item.productTitle}</p>
                                  <p className="text-[10px] text-text-secondary mt-0.5">{item.variantSku} — {item.variantLabel} × {item.quantity}</p>
                                </div>
                                <span className="text-xs font-bold text-accent">₹{(item.priceAtPurchase * item.quantity).toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Customer info</h4>
                            <div className="text-xs space-y-1 text-text-secondary">
                              <p className="text-white font-semibold">{order.user?.name}</p>
                              <p>✉️ {order.user?.email}</p>
                              <p>📞 {order.shippingAddress.phone}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Delivery Address</h4>
                            <div className="text-xs space-y-1 text-text-secondary">
                              <p className="text-white font-medium">{order.shippingAddress.street}</p>
                              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions & logistics */}
                      <div className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-l border-white/5 lg:pl-6 pt-6 lg:pt-0">
                        {/* Quick Status Control */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Quick Status Actions</h4>
                          
                          {isUpdating ? (
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                              <Loader2 className="h-4.5 w-4.5 text-accent animate-spin" />
                              <span>Updating order status...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {/* Conditionally show Pack & Generate AWB button */}
                              {order.orderStatus === "Placed" || order.orderStatus === "Confirmed" ? (
                                <div className="space-y-2 p-3 bg-secondary/15 rounded-xl border border-white/5">
                                  <label className="block text-[10px] uppercase font-bold text-text-secondary">Shipment weight (g)</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      value={weightMap[order._id] || 500}
                                      onChange={(e) => setWeightMap({ ...weightMap, [order._id]: Number(e.target.value) })}
                                      className="w-20 bg-[#0f0f1a] border border-white/5 text-xs p-1.5 rounded-lg text-white text-center"
                                    />
                                    <button
                                      onClick={() => handlePackOrder(order._id)}
                                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#e94560] hover:bg-[#e94560]/95 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-md cursor-pointer"
                                    >
                                      <Truck className="h-4 w-4" />
                                      <span>Pack & Generate AWB</span>
                                    </button>
                                  </div>
                                </div>
                              ) : null}

                              <div className="grid grid-cols-2 gap-2">
                                {order.orderStatus === "Placed" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "Confirmed")}
                                    className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Confirm Order
                                  </button>
                                )}
                                {order.orderStatus === "Packed" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "Shipped")}
                                    className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Ship Order
                                  </button>
                                )}
                                {(order.orderStatus === "Shipped" || order.orderStatus === "Out for Delivery") && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "Delivered")}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
                                  <button
                                    onClick={() => handleStatusUpdate(order._id, "Cancelled")}
                                    className="bg-red-500/5 hover:bg-red-500/15 text-red-400 border border-red-500/10 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delhivery scan logs */}
                        {order.trackingHistory && order.trackingHistory.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-white/5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tracking Logs</h4>
                            <div className="space-y-3 text-[11px] max-h-48 overflow-y-auto pr-1">
                              {order.trackingHistory.map((scan, idx) => (
                                <div key={idx} className="border-l-2 border-[#e94560]/20 pl-3 py-0.5 space-y-0.5">
                                  <p className="font-semibold text-white/95">{scan.status}</p>
                                  {scan.location && <p className="text-text-secondary">Location: {scan.location}</p>}
                                  <p className="text-[10px] text-text-secondary">{new Date(scan.timestamp).toLocaleString("en-IN")}</p>
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
