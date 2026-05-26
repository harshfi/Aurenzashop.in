import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Users, UserRound, X } from "lucide-react";
import api from "../lib/api";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (segment) params.append("segment", segment);

      const [listRes, analyticsRes] = await Promise.all([
        api.get(`/customers/admin/all?${params.toString()}`),
        api.get(`/customers/admin/analytics`),
      ]);

      if (listRes.data?.success) setCustomers(listRes.data.customers || []);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.analytics || null);
    } catch {
      setCustomers([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [search, segment]);

  useEffect(() => {
    const t = setTimeout(loadCustomers, 250);
    return () => clearTimeout(t);
  }, [loadCustomers]);

  const openProfile = async (id) => {
    setProfileLoading(true);
    setProfileOpen(true);
    try {
      const res = await api.get(`/customers/admin/${id}`);
      if (res.data?.success) setSelectedCustomer(res.data);
    } catch {
      setSelectedCustomer(null);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Total Customers</p><p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.totalCustomers || 0}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Active Buyers</p><p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.activeCustomers || 0}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Repeat Customers</p><p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.repeatCustomers || 0}</p></div>
        <div className="glass rounded-2xl p-5"><p className="text-xs uppercase tracking-wide text-slate-500">VIP Customers</p><p className="mt-1 text-2xl font-bold text-slate-900">{analytics?.vipCustomers || 0}</p></div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
          </div>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">All Segments</option>
            <option value="vip">VIP</option>
            <option value="repeat">Repeat</option>
            <option value="new">New</option>
            <option value="at-risk">At Risk</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
        ) : customers.length === 0 ? (
          <div className="py-14 text-center text-slate-500"><Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Segment</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Lifetime Value</th>
                  <th className="px-3 py-2">Last Order</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.email}</p>
                    </td>
                    <td className="px-3 py-3"><span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">{customer.segment}</span></td>
                    <td className="px-3 py-3">{customer.orderCount}</td>
                    <td className="px-3 py-3 font-semibold text-indigo-700">₹{Number(customer.lifetimeValue || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3">{formatDate(customer.lastOrderAt)}</td>
                    <td className="px-3 py-3 text-right"><button onClick={() => openProfile(customer._id)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Customer Profile</h3>
              <button onClick={() => setProfileOpen(false)} className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900"><X className="h-4 w-4" /></button>
            </div>

            {profileLoading ? (
              <div className="h-52 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
            ) : !selectedCustomer ? (
              <div className="py-20 text-center text-slate-500">Unable to load profile.</div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center"><UserRound className="h-5 w-5" /></div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedCustomer.customer.name}</p>
                      <p className="text-sm text-slate-500">{selectedCustomer.customer.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500">Segment:</span> {selectedCustomer.customer.segment}</div>
                    <div><span className="text-slate-500">Orders:</span> {selectedCustomer.customer.orderCount}</div>
                    <div><span className="text-slate-500">Lifetime Value:</span> ₹{Number(selectedCustomer.customer.lifetimeValue || 0).toLocaleString("en-IN")}</div>
                    <div><span className="text-slate-500">AOV:</span> ₹{Number(selectedCustomer.customer.averageOrderValue || 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent Orders</h4>
                  <div className="space-y-2">
                    {(selectedCustomer.recentOrders || []).map((order) => (
                      <div key={order._id} className="rounded-xl border border-slate-200 p-3">
                        <p className="font-mono text-xs font-bold text-slate-900">#{order._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{order.orderStatus}</span>
                          <span className="font-semibold text-indigo-700">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                    {(selectedCustomer.recentOrders || []).length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No orders yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
