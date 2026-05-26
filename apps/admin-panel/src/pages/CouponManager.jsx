import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Trash2, Edit2, TicketPercent } from "lucide-react";
import api from "../lib/api";

const initialForm = {
  code: "",
  type: "percent",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  usagePerUser: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  applicableCategories: "",
  applicableBrands: "",
  description: "",
};

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);

      const res = await api.get(`/coupons/admin/all?${params.toString()}`);
      if (res.data?.success) setCoupons(res.data.coupons || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(loadCoupons, 250);
    return () => clearTimeout(t);
  }, [loadCoupons]);

  const discountLabel = useMemo(() => {
    if (!form.value) return "";
    return form.type === "percent" ? `${form.value}%` : `₹${form.value}`;
  }, [form.type, form.value]);

  const handleEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || "",
      type: coupon.type || "percent",
      value: String(coupon.value ?? ""),
      minOrderAmount: String(coupon.minOrderAmount ?? ""),
      maxDiscountAmount: String(coupon.maxDiscountAmount ?? ""),
      usageLimit: String(coupon.usageLimit ?? ""),
      usagePerUser: String(coupon.usagePerUser ?? ""),
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
      endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 16) : "",
      isActive: Boolean(coupon.isActive),
      applicableCategories: (coupon.applicableCategories || []).join(", "),
      applicableBrands: (coupon.applicableBrands || []).join(", "),
      description: coupon.description || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value || 0),
      minOrderAmount: Number(form.minOrderAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usagePerUser: form.usagePerUser ? Number(form.usagePerUser) : null,
      applicableCategories: form.applicableCategories
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      applicableBrands: form.applicableBrands
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };

    try {
      if (editingId) {
        await api.put(`/coupons/admin/${editingId}`, payload);
      } else {
        await api.post(`/coupons/admin`, payload);
      }
      resetForm();
      loadCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete coupon ${code}?`)) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      loadCoupons();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="glass rounded-2xl p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{editingId ? "Edit Coupon" : "Create Coupon"}</h3>
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{discountLabel || "New"}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input placeholder="Code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="percent">Percent</option>
                <option value="flat">Flat</option>
              </select>
              <input type="number" placeholder="Value" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} required className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Min order amount" value={form.minOrderAmount} onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Max discount" value={form.maxDiscountAmount} onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Usage limit" value={form.usageLimit} onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Per user limit" value={form.usagePerUser} onChange={(e) => setForm((p) => ({ ...p, usagePerUser: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Active
              </label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>

            <input placeholder="Applicable categories (comma separated)" value={form.applicableCategories} onChange={(e) => setForm((p) => ({ ...p, applicableCategories: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <input placeholder="Applicable brands (comma separated)" value={form.applicableBrands} onChange={(e) => setForm((p) => ({ ...p, applicableBrands: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" rows={3} />

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}</button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
            </div>
          </form>
        </div>

        <div className="glass rounded-2xl p-6 lg:col-span-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coupons" className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>
          ) : coupons.length === 0 ? (
            <div className="py-14 text-center text-slate-500"><TicketPercent className="mx-auto mb-2 h-8 w-8 text-slate-300" />No coupons found.</div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-900">{coupon.code}</p>
                      <p className="text-xs text-slate-500">{coupon.type === "percent" ? `${coupon.value}%` : `₹${coupon.value}`} · Used {coupon.usedCount || 0}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{coupon.isActive ? "active" : "inactive"}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => handleEdit(coupon)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-indigo-700"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(coupon._id, coupon.code)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
