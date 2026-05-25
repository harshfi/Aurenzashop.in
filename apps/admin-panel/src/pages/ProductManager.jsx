import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Loader2, Sparkles } from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#16213e]/40 border border-white/5 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 transition-colors"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-text-secondary" />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#16213e]/40 border border-white/5 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#e94560]/40 text-text-secondary transition-colors"
          >
            <option value="">All Categories</option>
            <option value="clothing">Clothing</option>
            <option value="wallpaper">Wallpaper</option>
          </select>
        </div>

        {/* Add Product Button */}
        <Link
          to="/products/new"
          className="flex items-center justify-center gap-2 bg-[#e94560] hover:bg-[#e94560]/90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Products Table */}
      <div className="glass rounded-2xl border border-white/5 p-6 shadow-lg">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#e94560] animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-text-secondary italic space-y-2">
            <Sparkles className="h-8 w-8 text-text-secondary/35 mx-auto" />
            <p>No products found. Click "Add Product" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/5 text-text-secondary uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Base Price</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + v.stockCount, 0) || 0;
                  return (
                    <tr key={product._id} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="py-3 px-4">
                        <div className="h-12 w-12 rounded-lg bg-[#16213e]/40 border border-white/5 overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[9px] text-text-secondary">Aurenza</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-[200px]">{product.title}</div>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold tracking-wider text-text-secondary">
                        {product.category}
                      </td>
                      <td className="py-3 px-4 font-bold text-accent">₹{product.basePrice.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-xs text-text-secondary">
                        {product.variants?.length || 0} variants ({totalStock} in stock)
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#e94560]/30 hover:text-white transition-colors cursor-pointer"
                            aria-label="Edit product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id, product.title)}
                            className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-red-500/30 hover:text-red-400 transition-colors cursor-pointer"
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
