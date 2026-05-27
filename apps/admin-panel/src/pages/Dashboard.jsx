import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, ClipboardList, Clock, Layers, Loader2, ArrowRight } from "lucide-react";
import api from "../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/orders/admin/stats");
        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentOrders(res.data.recentOrders || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#e94560] animate-spin drop-shadow-[0_0_15px_rgba(233,69,96,0.5)]" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "from-emerald-500/20 to-transparent",
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ClipboardList,
      color: "from-sky-500/20 to-transparent",
      iconColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "from-amber-500/20 to-transparent",
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Active Products",
      value: stats?.totalProducts || 0,
      icon: Layers,
      color: "from-[#e94560]/20 to-transparent",
      iconColor: "text-[#e94560] bg-[#e94560]/10 border-[#e94560]/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className={`glass rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden animate-hover-lift bg-gradient-to-br ${card.color} border-white/5 hover:border-white/10`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3.5 rounded-xl border ${card.iconColor} shadow-inner`}>
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-1 z-10">
                <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.15em]">{card.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5 relative z-10">
          <h3 className="font-bold text-white tracking-[0.1em] uppercase text-sm flex items-center gap-2">
            <div className="h-4 w-1 bg-[#e94560] rounded-full" />
            Recent Orders
          </h3>
          <Link to="/orders" className="flex items-center gap-1.5 text-xs text-[#e94560] hover:text-white transition-colors font-bold uppercase tracking-wider group">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-text-secondary uppercase tracking-wider text-[10px] font-bold bg-white/[0.01]">
                <th className="py-4 px-6 sm:px-8">Order ID</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Order Status</th>
                <th className="py-4 px-6 sm:px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-text-secondary">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium tracking-wide">No orders received yet.</p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr 
                    key={order._id} 
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer group" 
                    onClick={() => navigate(`/orders?id=${order._id}`)}
                  >
                    <td className="py-4 px-6 sm:px-8 font-mono font-bold text-white group-hover:text-[#e94560] transition-colors">
                      {order._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white/90">{order.user?.name}</td>
                    <td className="py-4 px-6 font-bold text-white">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        order.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" :
                        order.paymentStatus === "Failed" ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]" :
                        "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                      }`}>
                        {order.paymentStatus === "Paid" && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                        {order.paymentStatus === "Failed" && <div className="h-1.5 w-1.5 rounded-full bg-red-400" />}
                        {order.paymentStatus === "Pending" && <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        order.orderStatus === "Delivered" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]" :
                        order.orderStatus === "Cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]" :
                        "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]"
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 sm:px-8 text-right">
                      <span className="text-xs text-[#e94560] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                        Manage <ArrowRight className="h-3 w-3" />
                      </span>
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
