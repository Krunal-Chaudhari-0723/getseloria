'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock: number;
  images: string[];
}

const emptyForm = { name: '', description: '', originalPrice: '', discountPercent: '', category: '', stock: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/products/categories?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => { fetchProducts(); }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/products?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
    setLoading(false);
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setPreviewImages([]);
    setSelectedFiles([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      originalPrice: String(p.originalPrice ?? p.price),
      discountPercent: String(p.discountPercent ?? 0),
      category: p.category,
      stock: String(p.stock),
    });
    setPreviewImages(p.images || []);
    setSelectedFiles([]);
    setError('');
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`File too large: ${oversized.map(f => f.name).join(', ')} (max 10MB each)`);
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    // Only remove from selectedFiles if it's a newly added file
    const existingCount = editProduct ? (editProduct.images?.length || 0) : 0;
    if (index >= existingCount) {
      setSelectedFiles(prev => prev.filter((_, i) => i !== (index - existingCount)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Upload new files first
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const fd = new FormData();
        selectedFiles.forEach(f => fd.append('images', f));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const rawText = await uploadRes.text();
        const uploadData = rawText ? JSON.parse(rawText) : {};
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed — file may be too large (max 10MB)');
        uploadedUrls = uploadData.urls;
      }

      // Combine existing images (kept ones) with newly uploaded
      const existingKept = editProduct
        ? previewImages.filter(url => !url.startsWith('blob:'))
        : [];
      const finalImages = [...existingKept, ...uploadedUrls];

      const payload = {
        name: form.name,
        description: form.description,
        originalPrice: Number(form.originalPrice),
        discountPercent: Number(form.discountPercent) || 0,
        category: form.category,
        stock: Number(form.stock),
        images: finalImages,
      };

      const url = editProduct ? `/api/admin/products/${editProduct._id}` : '/api/admin/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const rawText = await res.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  const inputClass = "bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full";

  const originalPriceNum = Number(form.originalPrice) || 0;
  const discountNum = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const netPrice = Math.round((originalPriceNum - (originalPriceNum * discountNum) / 100) * 100) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#C8A96E] mb-1">Manage</p>
          <h1 className="text-2xl font-serif text-white">Products</h1>
          <p className="text-gray-400 mt-1 text-sm">{total} total products</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#7B2D42] text-white hover:bg-[#8A3048] transition-colors text-[10px] tracking-[0.3em] uppercase px-6 py-2.5">
          <PlusIcon className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] pl-10 pr-4 py-2.5 text-sm w-full"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d0d0d]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Category</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Price</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Stock</th>
                <th className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-white/5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-[#1a1a1a] animate-pulse w-full" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover border border-white/10" />
                      ) : (
                        <div className="h-10 w-10 bg-[#1a1a1a] border border-white/10 flex items-center justify-center">
                          <PhotoIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                      <span className="font-medium text-white">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{p.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#C8A96E]">₹{p.price.toLocaleString()}</span>
                      {!!p.discountPercent && (
                        <>
                          <span className="text-gray-500 line-through text-xs">₹{p.originalPrice?.toLocaleString()}</span>
                          <span className="text-green-500 text-xs">{p.discountPercent}% off</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs ${p.stock === 0 ? 'bg-red-900/30 text-red-400' : p.stock < 5 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-gray-400">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 text-sm transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-[10px] font-semibold tracking-[0.45em] text-white uppercase">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && <div className="bg-red-900/30 border border-red-500/20 text-red-400 p-3 text-sm">{error}</div>}

              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Original Price (₹) *</label>
                  <input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Discount (%)</label>
                  <input type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Net Price</label>
                  <div className={`${inputClass} flex items-center gap-2 text-[#C8A96E] font-semibold`}>
                    ₹{netPrice.toLocaleString('en-IN')}
                    {discountNum > 0 && (
                      <>
                        <span className="text-gray-500 line-through font-normal">₹{originalPriceNum.toLocaleString('en-IN')}</span>
                        <span className="text-green-500 text-xs font-normal">{discountNum}% off</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Category *</label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full">
                  <option value="" className="bg-[#1a1a1a]">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-[#1a1a1a]">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Description *</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-[#C8A96E] px-4 py-2.5 text-sm w-full resize-none" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Product Images</label>

                {/* Preview grid */}
                {previewImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {previewImages.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt="" className="h-20 w-full object-cover border border-white/10" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-white/20 p-6 text-center hover:border-[#C8A96E] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <PhotoIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Click to upload images</p>
                  <p className="text-xs text-gray-600 mt-1">PNG, JPG, WEBP up to 10MB each</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="border border-white/20 text-white hover:bg-white/5 text-[10px] tracking-[0.3em] uppercase px-6 py-2.5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="bg-[#7B2D42] text-white hover:bg-[#8A3048] disabled:opacity-50 text-[10px] tracking-[0.3em] uppercase px-6 py-2.5 transition-colors">
                {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
