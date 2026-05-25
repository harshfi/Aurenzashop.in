import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, ClipboardList, Clock, Layers, Loader2, ArrowRight } from "lucide-react";
import api from "../lib/api";

const toTitleCase = (value = "") =>
  value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/orders/admin/stats");
        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentOrders(res.data.recentOrders || []);
        }
      } catch {
        setStats(null);
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#e94560] animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ClipboardList,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      title: "Active Products",
      value: stats?.totalProducts || 0,
      icon: Layers,
      color: "text-[#e94560] bg-[#e94560]/10 border-[#e94560]/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass rounded-2xl border border-white/5 p-6 flex items-center justify-between shadow-lg">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{card.title}</span>
                <p className="text-2xl sm:text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`p-4 rounded-xl border ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl border border-white/5 p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="font-semibold text-white tracking-wide uppercase text-sm">Recent Orders</h3>
          <Link to="/orders" className="flex items-center gap-1.5 text-xs text-[#e94560] hover:underline font-semibold">
            <span>View All Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/5 text-text-secondary uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-secondary italic">
                    No orders received yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/5 last:border-0 hover:bg-white/2 cursor-pointer" onClick={() => navigate(`/orders?id=${order._id}`)}>
                    <td className="py-4 px-4 font-mono font-semibold text-white">{order._id.slice(-8).toUpperCase()}</td>
                    <td className="py-4 px-4 font-medium text-white">{order.user?.name}</td>
                    <td className="py-4 px-4 font-bold text-accent">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        order.paymentStatus === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                        {toTitleCase(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.orderStatus === "delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        order.orderStatus === "cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}>
                        {toTitleCase(order.orderStatus)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to="/orders"
                        className="text-xs text-[#e94560] hover:underline font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
