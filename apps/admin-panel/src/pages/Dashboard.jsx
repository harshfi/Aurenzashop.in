import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, ClipboardList, Clock, Layers, Loader2, ArrowRight } from "lucide-react";
import api from "../lib/api";

const toTitleCase = (value = "") => value.split("_").join(" ").replace(/\b\w/g, (char) => char.toUpperCase());

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setError("");
        const res = await api.get("/orders/admin/stats");
        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentOrders(res.data.recentOrders || []);
        }
      } catch (err) {
        setStats(null);
        setRecentOrders([]);
        setError(err?.isAuthError ? "Admin session expired. Please sign in again." : (err?.response?.data?.message || "Failed to load dashboard stats."));
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  const statCards = [
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ClipboardList, color: "text-sky-600 bg-sky-50 border-sky-100" },
    { title: "Pending Orders", value: stats?.pendingOrders || 0, icon: Clock, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { title: "Active Products", value: stats?.totalProducts || 0, icon: Layers, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  ];

  return (
    <div className="space-y-8 animate-in">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass rounded-2xl p-6 flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{card.value}</p>
              </div>
              <div className={`p-4 rounded-xl border ${card.color}`}><Icon className="h-6 w-6" /></div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="font-semibold text-slate-900 tracking-wide uppercase text-sm">Recent Orders</h3>
          <Link to="/orders" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-semibold"><span>View All Orders</span><ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold"><th className="py-3 px-4">Order ID</th><th className="py-3 px-4">Customer</th><th className="py-3 px-4">Amount</th><th className="py-3 px-4">Payment</th><th className="py-3 px-4">Order Status</th><th className="py-3 px-4 text-right">Actions</th></tr></thead>
            <tbody>
              {recentOrders.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-400 italic">No orders received yet.</td></tr> : recentOrders.map((order) => (
                <tr key={order._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/orders?id=${order._id}`)}>
                  <td className="py-4 px-4 font-mono font-semibold text-slate-800">{order._id.slice(-8).toUpperCase()}</td>
                  <td className="py-4 px-4 font-medium text-slate-800">{order.user?.name}</td>
                  <td className="py-4 px-4 font-bold text-indigo-700">₹{order.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-4"><span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : order.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{toTitleCase(order.paymentStatus)}</span></td>
                  <td className="py-4 px-4"><span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${order.orderStatus === "delivered" ? "bg-emerald-100 text-emerald-700" : order.orderStatus === "cancelled" ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>{toTitleCase(order.orderStatus)}</span></td>
                  <td className="py-4 px-4 text-right"><Link to="/orders" className="text-xs text-indigo-600 hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
