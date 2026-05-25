import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Save, X } from "lucide-react";
import api from "../lib/api";

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [category, setCategory] = useState("clothing");
  const [variants, setVariants] = useState([]);

  // Image Upload States
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);

  useEffect(() => {
    async function loadProduct() {
      if (!isEdit) return;
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data?.success) {
          const product = res.data.product;
          setTitle(product.title);
          setDescription(product.description);
          setBasePrice(product.basePrice);
          setCategory(product.category);
          setVariants(product.variants || []);
          setExistingImages(product.images || []);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
        alert("Failed to load product details.");
        navigate("/products");
      } finally {
        setFetchLoading(false);
      }
    }
    loadProduct();
  }, [id, isEdit]);

  // Variant Controls
  const addVariantRow = () => {
    const defaultSku = `${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    setVariants([
      ...variants,
      { sku: defaultSku, sizeOrDimension: "M", color: "", additionalPrice: 0, stockCount: 10 },
    ]);
  };

  const removeVariantRow = (index) => {
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const updateVariantRow = (index, field, value) => {
    const updated = variants.map((v, idx) => {
      if (idx === index) {
        return { ...v, [field]: value };
      }
      return v;
    });
    setVariants(updated);
  };

  // Image Controls
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Max 5 images total
    const totalCurrentCount = existingImages.length - imagesToRemove.length + imageFiles.length + files.length;
    if (totalCurrentCount > 5) {
      alert("Maximum of 5 images allowed per product.");
      return;
    }

    setImageFiles([...imageFiles, ...files]);

    // Create previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const removeNewImage = (index) => {
    setImageFiles(imageFiles.filter((_, idx) => idx !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews(imagePreviews.filter((_, idx) => idx !== index));
  };

  const removeExistingImage = (url) => {
    setImagesToRemove([...imagesToRemove, url]);
  };

  const cancelRemoveExistingImage = (url) => {
    setImagesToRemove(imagesToRemove.filter((img) => img !== url));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (variants.length === 0) {
      alert("Please add at least one variant.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("basePrice", basePrice);
    formData.append("category", category);
    formData.append("variants", JSON.stringify(variants));

    if (isEdit) {
      formData.append("removeImages", JSON.stringify(imagesToRemove));
    }

    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      let res;
      if (isEdit) {
        res = await api.put(`/products/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (res.data?.success) {
        alert(isEdit ? "Product updated successfully!" : "Product created successfully!");
        navigate("/products");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#e94560] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back Button */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <Link to="/products" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to products</span>
        </Link>
        <h2 className="text-base font-bold text-white uppercase">{isEdit ? "Edit Product" : "New Product"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Product Info */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-white/5 pb-3">Basic Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product name"
                className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3 rounded-lg focus:outline-none focus:border-[#e94560]/40"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3 rounded-lg focus:outline-none focus:border-[#e94560]/40 text-text-secondary"
              >
                <option value="clothing">Clothing</option>
                <option value="wallpaper">Wallpaper</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product details..."
                className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3 rounded-lg focus:outline-none focus:border-[#e94560]/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Base Price (INR)</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#16213e]/40 border border-white/5 text-sm p-3 rounded-lg focus:outline-none focus:border-[#e94560]/40"
              />
            </div>
          </div>
        </div>

        {/* Image Uploader */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary border-b border-white/5 pb-3">Images (Max 5)</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {/* Existing Images */}
            {existingImages.map((url) => {
              const isRemoved = imagesToRemove.includes(url);
              return (
                <div key={url} className="aspect-square rounded-xl overflow-hidden bg-white/2 border border-white/5 relative group">
                  <img src={url} alt="Product" className={`h-full w-full object-cover ${isRemoved ? "opacity-25" : ""}`} />
                  {isRemoved ? (
                    <button
                      type="button"
                      onClick={() => cancelRemoveExistingImage(url)}
                      className="absolute inset-0 m-auto h-8 w-18 rounded bg-[#e94560] text-xs font-bold text-white flex items-center justify-center cursor-pointer"
                    >
                      Undo Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 hover:bg-black text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* New Upload Previews */}
            {imagePreviews.map((previewUrl, idx) => (
              <div key={previewUrl} className="aspect-square rounded-xl overflow-hidden bg-white/2 border border-white/5 relative group animate-in zoom-in-90">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 hover:bg-black text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Add Zone */}
            {(existingImages.length - imagesToRemove.length + imageFiles.length < 5) && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[#e94560]/30 hover:bg-white/2 flex flex-col items-center justify-center text-text-secondary hover:text-white transition-all cursor-pointer">
                <Upload className="h-6 w-6 mb-2 text-text-secondary/50" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Upload</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Variants Section */}
        <div className="glass rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Product Variants</h3>
            <button
              type="button"
              onClick={addVariantRow}
              className="flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#e94560]/95 font-semibold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Variant</span>
            </button>
          </div>

          {variants.length === 0 ? (
            <div className="py-8 text-center text-text-secondary text-xs italic">
              Please add at least one variant (e.g. Size: M, Stock: 10).
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-white/2 border border-white/5 relative group animate-in slide-in-from-top-3 duration-200">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">SKU</label>
                    <input
                      type="text"
                      required
                      value={variant.sku}
                      onChange={(e) => updateVariantRow(idx, "sku", e.target.value)}
                      placeholder="SKU"
                      className="w-full bg-[#16213e]/40 border border-white/5 text-xs p-2 rounded-lg text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Size / Dimension</label>
                    <input
                      type="text"
                      required
                      value={variant.sizeOrDimension}
                      onChange={(e) => updateVariantRow(idx, "sizeOrDimension", e.target.value)}
                      placeholder="e.g. M, 10x10"
                      className="w-full bg-[#16213e]/40 border border-white/5 text-xs p-2 rounded-lg text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Color (Optional)</label>
                    <input
                      type="text"
                      value={variant.color || ""}
                      onChange={(e) => updateVariantRow(idx, "color", e.target.value)}
                      placeholder="e.g. Red"
                      className="w-full bg-[#16213e]/40 border border-white/5 text-xs p-2 rounded-lg text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Add Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={variant.additionalPrice}
                      onChange={(e) => updateVariantRow(idx, "additionalPrice", Number(e.target.value))}
                      className="w-full bg-[#16213e]/40 border border-white/5 text-xs p-2 rounded-lg text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] text-text-secondary uppercase">Stock Count</label>
                    <input
                      type="number"
                      required
                      value={variant.stockCount}
                      onChange={(e) => updateVariantRow(idx, "stockCount", Number(e.target.value))}
                      className="w-full bg-[#16213e]/40 border border-white/5 text-xs p-2 rounded-lg text-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="p-2 text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#e94560] to-red-500 hover:opacity-95 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-[#e94560]/15 cursor-pointer h-14 text-sm"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-4.5 w-4.5" />
              <span>{isEdit ? "Save Changes" : "Create Product"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
