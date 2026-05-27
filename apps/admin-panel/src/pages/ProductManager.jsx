import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import api from "../lib/api";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (category) queryParams.append("category", category);
      if (search) queryParams.append("search", search);

      const res = await api.get(`/products?${queryParams.toString()}`);
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, category]);

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-sm pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-[#e94560]/50 focus:bg-white/10 transition-all text-white placeholder-white/30 shadow-inner"
            />
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-text-secondary group-focus-within:text-[#e94560] transition-colors" />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white/5 border border-white/10 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#e94560]/50 focus:bg-white/10 text-text-secondary transition-all shadow-inner appearance-none pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
          >
            <option value="" className="bg-[#121225]">All Categories</option>
            <option value="clothing" className="bg-[#121225]">Clothing</option>
            <option value="wallpaper" className="bg-[#121225]">Wallpaper</option>
          </select>
        </div>

        {/* Add Product Button */}
        <Link
          to="/products/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#e94560] to-[#c73a52] hover:from-[#f45d76] hover:to-[#d84860] text-white text-sm font-bold px-7 py-3 rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.3)] hover:shadow-[0_0_30px_rgba(233,69,96,0.5)] transition-all animate-hover-lift cursor-pointer"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="glass rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {loading ? (
          <div className="h-64 flex items-center justify-center relative z-10">
            <Loader2 className="h-8 w-8 text-[#e94560] animate-spin drop-shadow-[0_0_15px_rgba(233,69,96,0.5)]" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-text-secondary relative z-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Sparkles className="h-7 w-7 text-text-secondary/50" />
            </div>
            <p className="font-medium tracking-wide">No products found.</p>
            <p className="text-xs text-text-secondary/60 mt-1">Click "Add Product" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-text-secondary uppercase tracking-wider text-[10px] font-bold bg-white/[0.01]">
                  <th className="py-4 px-6 sm:px-8">Product</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Base Price</th>
                  <th className="py-4 px-6">Inventory</th>
                  <th className="py-4 px-6 sm:px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stockCount, 0) || 0;
                  return (
                    <tr key={product._id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group">
                      <td className="py-4 px-6 sm:px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-inner flex-shrink-0 relative">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-white/20" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white max-w-[200px] truncate">{product.title}</div>
                            <div className="text-[10px] text-text-secondary font-mono mt-0.5">{product._id.slice(-8).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        ₹{product.basePrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'}`} />
                          <span className="text-xs font-semibold text-white/90">{totalStock} in stock</span>
                          <span className="text-[10px] text-text-secondary">({product.variants?.length || 0} vars)</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 sm:px-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-400 text-text-secondary transition-all cursor-pointer shadow-sm"
                            aria-label="Edit product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.title)}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-text-secondary transition-all cursor-pointer shadow-sm"
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
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
