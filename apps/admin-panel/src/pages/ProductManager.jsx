import React, { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Loader2, Sparkles } from "lucide-react";
import api from "../lib/api";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const resolveImage = (product) =>
    product?.images?.[0] ||
    product?.galleryImages?.[0] ||
    product?.mainImage ||
    product?.hoverImage ||
    "";

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);
      if (status) queryParams.append("productStatus", status);
      if (search) queryParams.append("search", search);
      const res = await api.get(`/products/admin/all?${queryParams.toString()}`);
      if (res.data?.success) setProducts(res.data.products || []);
    } catch (err) {
      setProducts([]);
      setError(err?.isAuthError ? "Admin session expired. Please sign in again." : (err?.response?.data?.message || "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }, [category, search, status]);

  useEffect(() => {
    const t = setTimeout(() => loadProducts(), 300);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete product "${title}"?`)) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data?.success) {
        alert("Product deleted successfully.");
        loadProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 transition-colors" />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-white border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-500 transition-colors">
            <option value="">All Categories</option>
            <option value="sarees">Sarees</option>
            <option value="lehengas">Lehengas</option>
            <option value="kurtas-kurta-sets">Kurtas &amp; Kurta Sets</option>
            <option value="gowns">Gowns</option>
            <option value="fusion-wear">Fusion Wear</option>
            <option value="dupattas-accessories">Dupattas &amp; Accessories</option>
            <option value="seasonal-special">Seasonal / Special</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-slate-200 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-500 transition-colors">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Link to="/products/new" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer">
          <Plus className="h-4.5 w-4.5" />
          <span>Add Product</span>
        </Link>
      </div>

      <div className="glass rounded-2xl p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic space-y-2"><Sparkles className="h-8 w-8 text-slate-300 mx-auto" /><p>No products found. Click "Add Product" to get started.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold"><th className="py-3 px-4">Image</th><th className="py-3 px-4">Title</th><th className="py-3 px-4">Collection</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Base Price</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Variants</th><th className="py-3 px-4 text-right">Actions</th></tr></thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stockCount, 0) || 0;
                  const previewImage = resolveImage(product);
                  return (
                    <tr key={product._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4"><div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">{previewImage ? <img src={previewImage} alt={product.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-400">Aurenza</div>}</div></td>
                      <td className="py-3 px-4"><div className="font-semibold text-slate-800 truncate max-w-[200px]">{product.title}</div></td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">{product.collection || "-"}</td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider text-slate-500">{product.category}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">₹{product.basePrice.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4"><span className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${product.productStatus === "active" ? "bg-emerald-100 text-emerald-700" : product.productStatus === "archived" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"}`}>{product.productStatus || "active"}</span></td>
                      <td className="py-3 px-4 text-xs text-slate-500">{product.variants?.length || 0} variants ({totalStock} in stock)</td>
                      <td className="py-3 px-4 text-right"><div className="flex items-center justify-end gap-2.5"><Link to={`/products/${product._id}/edit`} className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-pointer" aria-label="Edit product"><Edit2 className="h-4 w-4" /></Link><button onClick={() => handleDelete(product._id, product.title)} className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer" aria-label="Delete product"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
