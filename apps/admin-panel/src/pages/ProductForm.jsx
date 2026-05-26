import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Save, X } from "lucide-react";
import api from "../lib/api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatSize = (bytes) => {
  if (!bytes) return "0 KB";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [category, setCategory] = useState("ethnic-wear");
  const [subcategory, setSubcategory] = useState("");
  const [collection, setCollection] = useState("");
  const [material, setMaterial] = useState("");
  const [gender, setGender] = useState("women");
  const [season, setSeason] = useState("");
  const [productStatus, setProductStatus] = useState("active");
  const [tags, setTags] = useState("");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [bestseller, setBestseller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [variants, setVariants] = useState([]);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageStatuses, setImageStatuses] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      if (!isEdit) return;
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data?.success) {
          const product = res.data.product;
          setTitle(product.title || "");
          setSlug(product.slug || "");
          setShortDescription(product.shortDescription || "");
          setDescription(product.description || "");
          setBasePrice(String(product.basePrice || ""));
          setCompareAtPrice(product.compareAtPrice ? String(product.compareAtPrice) : "");
          setCategory(product.category || "ethnic-wear");
          setSubcategory(product.subcategory || "");
          setCollection(product.collection || "");
          setMaterial(product.material || "");
          setGender(product.gender || "women");
          setSeason(product.season || "");
          setProductStatus(product.productStatus || "active");
          setTags((product.tags || []).join(", "));
          setFeatured(Boolean(product.featured));
          setTrending(Boolean(product.trending));
          setBestseller(Boolean(product.bestseller));
          setNewArrival(Boolean(product.newArrival));
          setVariants(product.variants || []);
          setExistingImages(product.images || []);
        }
      } catch {
        alert("Failed to load product details.");
        navigate("/products");
      } finally {
        setFetchLoading(false);
      }
    }
    loadProduct();
  }, [id, isEdit, navigate]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const addVariantRow = () => {
    const defaultSku = `${category.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    setVariants([
      ...variants,
      { sku: defaultSku, sizeOrDimension: "M", color: "", additionalPrice: 0, stockCount: 10 },
    ]);
  };

  const removeVariantRow = (index) => setVariants(variants.filter((_, idx) => idx !== index));

  const updateVariantRow = (index, field, value) => {
    setVariants(variants.map((v, idx) => (idx === index ? { ...v, [field]: value } : v)));
  };

  const validateIncomingFiles = (files) => {
    const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));
    if (invalidType) {
      setUploadError("Only JPG, PNG, and WEBP images are allowed.");
      return false;
    }

    const invalidSize = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (invalidSize) {
      setUploadError("Each image must be smaller than 5MB.");
      return false;
    }

    const totalCurrentCount = existingImages.length - imagesToRemove.length + imageFiles.length + files.length;
    if (totalCurrentCount > MAX_IMAGES) {
      setUploadError("Maximum of 5 images allowed per product.");
      return false;
    }

    return true;
  };

  const appendFiles = (files) => {
    if (!files.length) return;
    if (!validateIncomingFiles(files)) return;

    setUploadError("");
    setImageFiles((prev) => [...prev, ...files]);
    setImageStatuses((prev) => [...prev, ...files.map((file) => ({ name: file.name, status: "queued" }))]);
    setImagePreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleImageChange = (e) => {
    appendFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    appendFiles(Array.from(e.dataTransfer.files || []));
  };

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index));
    setImageStatuses((prev) => prev.filter((_, idx) => idx !== index));
    URL.revokeObjectURL(imagePreviews[index]);
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const removeExistingImage = (url) => setImagesToRemove([...imagesToRemove, url]);
  const cancelRemoveExistingImage = (url) => setImagesToRemove(imagesToRemove.filter((img) => img !== url));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (variants.length === 0) {
      alert("Please add at least one variant.");
      return;
    }

    if (!isEdit && imageFiles.length === 0) {
      setUploadError("Please upload at least one product image.");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setImageStatuses((prev) => prev.map((item) => ({ ...item, status: "uploading" })));

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("shortDescription", shortDescription);
    formData.append("description", description);
    formData.append("basePrice", basePrice);
    formData.append("compareAtPrice", compareAtPrice);
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("collection", collection);
    formData.append("material", material);
    formData.append("gender", gender);
    formData.append("season", season);
    formData.append("productStatus", productStatus);
    formData.append("tags", tags);
    formData.append("featured", String(featured));
    formData.append("trending", String(trending));
    formData.append("bestseller", String(bestseller));
    formData.append("newArrival", String(newArrival));
    formData.append("variants", JSON.stringify(variants));

    if (isEdit) formData.append("removeImages", JSON.stringify(imagesToRemove));
    imageFiles.forEach((file) => formData.append("images", file));

    try {
      const requestConfig = {
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      };

      const res = isEdit
        ? await api.put(`/products/${id}`, formData, requestConfig)
        : await api.post("/products", formData, requestConfig);

      if (res.data?.success) {
        alert(isEdit ? "Product updated successfully!" : "Product created successfully!");
        navigate("/products");
      }
    } catch (err) {
      setImageStatuses((prev) => prev.map((item) => ({ ...item, status: "failed" })));
      setUploadError(err.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 mx-auto max-w-5xl animate-in">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link to="/products" className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Back to products</Link>
        <h2 className="text-base font-bold uppercase text-slate-900">{isEdit ? "Edit Product" : "New Product"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="border-b border-slate-200 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-if-empty" className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <option value="sarees">Sarees</option>
                <option value="lehengas">Lehengas</option>
                <option value="kurtas-kurta-sets">Kurtas &amp; Kurta Sets</option>
                <option value="gowns">Gowns</option>
                <option value="fusion-wear">Fusion Wear</option>
                <option value="dupattas-accessories">Dupattas &amp; Accessories</option>
                <option value="seasonal-special">Seasonal / Special</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subcategory</label>
              <input type="text" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collection</label>
              <input type="text" value={collection} onChange={(e) => setCollection(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Material</label>
              <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selling Price (INR)</label>
              <input type="number" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Compare At Price</label>
              <input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
                <option value="kids">Kids</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <select value={productStatus} onChange={(e) => setProductStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Season</label>
              <input type="text" value={season} onChange={(e) => setSeason(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tags (comma separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Short Description</label>
            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" maxLength={220} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} /> Trending</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} /> Bestseller</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={newArrival} onChange={(e) => setNewArrival(e.target.checked)} /> New Arrival</label>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="border-b border-slate-200 pb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Images (Max 5)</h3>
          {uploadError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{uploadError}</div>}

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`block cursor-pointer rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-all ${isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300"}`}
          >
            <Upload className="mx-auto h-7 w-7 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-900">Drag and drop images here</p>
            <p className="mt-1 text-xs text-slate-500">or click to browse JPG, PNG, WEBP (max 5MB each)</p>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          </label>

          {loading && imageFiles.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Upload Progress</span><span className="font-semibold text-slate-900">{uploadProgress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400" style={{ width: `${uploadProgress}%` }} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {existingImages.map((url) => {
              const isRemoved = imagesToRemove.includes(url);
              return (
                <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group">
                  <img src={url} alt="Product" className={`h-full w-full object-cover ${isRemoved ? "opacity-25" : ""}`} />
                  {isRemoved ? (
                    <button type="button" onClick={() => cancelRemoveExistingImage(url)} className="absolute inset-0 m-auto h-8 rounded bg-indigo-600 px-2 text-xs font-bold text-white">Undo</button>
                  ) : (
                    <button type="button" onClick={() => removeExistingImage(url)} className="absolute right-1.5 top-1.5 rounded bg-slate-900/70 p-1 text-red-300 opacity-0 transition-opacity group-hover:opacity-100"><X className="h-4 w-4" /></button>
                  )}
                </div>
              );
            })}

            {imagePreviews.map((previewUrl, idx) => (
              <div key={previewUrl} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">{imageStatuses[idx]?.status || "queued"}</div>
                <div className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">{formatSize(imageFiles[idx]?.size)}</div>
                <button type="button" onClick={() => removeNewImage(idx)} className="absolute right-1.5 top-1.5 rounded bg-slate-900/70 p-1 text-red-300 opacity-0 transition-opacity group-hover:opacity-100"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Product Variants</h3>
            <button type="button" onClick={addVariantRow} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"><Plus className="h-4 w-4" />Add Variant</button>
          </div>

          {variants.length === 0 ? (
            <div className="py-8 text-center text-xs italic text-slate-500">Please add at least one variant.</div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <div key={idx} className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-12">
                  <div className="space-y-1 sm:col-span-3"><label className="text-[10px] uppercase text-slate-500">SKU</label><input type="text" required value={variant.sku} onChange={(e) => updateVariantRow(idx, "sku", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" /></div>
                  <div className="space-y-1 sm:col-span-2"><label className="text-[10px] uppercase text-slate-500">Size</label><input type="text" required value={variant.sizeOrDimension} onChange={(e) => updateVariantRow(idx, "sizeOrDimension", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" /></div>
                  <div className="space-y-1 sm:col-span-2"><label className="text-[10px] uppercase text-slate-500">Color</label><input type="text" value={variant.color || ""} onChange={(e) => updateVariantRow(idx, "color", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" /></div>
                  <div className="space-y-1 sm:col-span-2"><label className="text-[10px] uppercase text-slate-500">Add Price</label><input type="number" required value={variant.additionalPrice} onChange={(e) => updateVariantRow(idx, "additionalPrice", Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" /></div>
                  <div className="space-y-1 sm:col-span-2"><label className="text-[10px] uppercase text-slate-500">Stock</label><input type="number" required value={variant.stockCount} onChange={(e) => updateVariantRow(idx, "stockCount", Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs" /></div>
                  <div className="flex justify-end pb-1 sm:col-span-1"><button type="button" onClick={() => removeVariantRow(idx)} className="p-2 text-slate-500 hover:text-red-500" aria-label="Remove variant"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4.5 w-4.5" /><span>{isEdit ? "Save Changes" : "Create Product"}</span></>}
        </button>
      </form>
    </div>
  );
}
