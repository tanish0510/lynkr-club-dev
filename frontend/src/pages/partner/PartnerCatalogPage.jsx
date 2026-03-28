import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Package, Plus, Pencil, Trash2, ExternalLink, Copy,
  Image as ImageIcon, IndianRupee, Store, Upload, Loader2, X, Camera,
  Search, Grid3X3, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/utils/api';
import FAB from '@/components/partner/FAB';
import { PageSkeleton } from '@/components/partner/SkeletonPulse';

const CARD = 'rounded-2xl border border-white/[0.06] bg-[#0A0A0A]';
const fieldClass = 'mt-1.5 rounded-xl h-10 bg-transparent border-white/[0.08] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/30';
const textareaClass = 'mt-1.5 rounded-xl bg-transparent border-white/[0.08] text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500/30 resize-none';

const defaultForm = () => ({
  name: '', description: '', price: '', category: '',
  images: [], whatsapp_order_link: '', discount: '', tags: '', active: true,
});

const PartnerCatalogPage = () => {
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [logo, setLogo] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.get('/partner/catalog/overview');
      setOverview(res.data);
      if (res.data?.logo) setLogo(res.data.logo);
    } catch (_) { setOverview(null); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/partner/catalog/products');
      setProducts(res.data || []);
    } catch (_) { setProducts([]); }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchProducts()]);
      setLoading(false);
    };
    load();
  }, [fetchOverview, fetchProducts]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ['all', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const openAdd = () => { setEditingProduct(null); setForm(defaultForm()); setFormOpen(true); };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '', description: product.description || '',
      price: product.price != null ? String(product.price) : '',
      category: product.category || '',
      images: product.images?.length ? [...product.images] : [],
      whatsapp_order_link: product.whatsapp_order_link || '',
      discount: product.discount || '',
      tags: product.tags?.length ? product.tags.join(', ') : '',
      active: product.active !== false,
    });
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditingProduct(null); setForm(defaultForm()); };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post('/partner/catalog/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.url;
  };

  const handleFileUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map((f) => uploadImage(f)));
      setForm((prev) => ({ ...prev, images: [...prev.images.filter(Boolean), ...urls] }));
      toast.success(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded`);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Image upload failed'); }
    finally { setUploading(false); }
  };

  const removeImage = (index) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), description: form.description.trim(),
        price: parseFloat(form.price) || 0, category: form.category.trim(),
        images: form.images.filter(Boolean),
        whatsapp_order_link: form.whatsapp_order_link.trim(),
        discount: form.discount.trim() || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        active: form.active,
      };
      if (editingProduct) {
        await api.put(`/partner/catalog/products/${editingProduct.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/partner/catalog/products', payload);
        toast.success('Product added');
      }
      closeForm();
      await Promise.all([fetchOverview(), fetchProducts()]);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to save product'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setDeletingId(product.id);
    try {
      await api.delete(`/partner/catalog/products/${product.id}`);
      toast.success('Product deleted');
      await Promise.all([fetchOverview(), fetchProducts()]);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to delete'); }
    finally { setDeletingId(null); }
  };

  const handleLogoUpload = async (file) => {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/partner/logo/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogo(res.data.url);
      toast.success('Store logo updated');
    } catch (err) { toast.error(err?.response?.data?.detail || 'Logo upload failed'); }
    finally { setLogoUploading(false); }
  };

  const copyLink = () => {
    if (overview?.share_link) { navigator.clipboard.writeText(overview.share_link); toast.success('Link copied'); }
  };

  const openPreview = () => {
    if (overview?.catalog_slug) window.open(`${window.location.origin}/catalog/${overview.catalog_slug}`, '_blank', 'noopener,noreferrer');
    else toast.error('Catalog link not ready yet');
  };

  const productCount = overview?.total_products ?? 0;
  const activeCount = overview?.active_products ?? 0;
  const categoryCount = overview?.categories_count ?? 0;
  const storeUrl = overview?.share_link || '';

  if (loading && !overview) return <PageSkeleton />;

  return (
    <div className="max-w-5xl space-y-5 pb-10">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-heading text-foreground">Catalog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage products and share your storefront.</p>
        </div>
        <Button
          onClick={openAdd}
          variant="outline"
          className="rounded-xl h-9 px-3.5 text-sm gap-1.5 shrink-0 border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-foreground hidden sm:flex"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* ── STORE HEADER ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="p-4 flex items-center gap-3.5">
          <label className="relative group cursor-pointer shrink-0">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} disabled={logoUploading} />
            <div className="h-11 w-11 rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden flex items-center justify-center transition-all group-hover:border-white/[0.15]">
              {logoUploading ? (
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              ) : logo ? (
                <img src={resolveImageUrl(logo)} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <Store className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-2 w-2 text-white" />
            </div>
          </label>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Virtual Storefront</p>
            <p className="text-[11px] text-muted-foreground">Your public-facing catalog</p>
          </div>
          {storeUrl && (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={copyLink} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button onClick={openPreview} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors">
                <ExternalLink className="w-3 h-3" /> Preview
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-white/[0.06] divide-x divide-white/[0.06]">
          {[
            { label: 'Products', value: productCount, icon: Package, color: 'text-blue-400' },
            { label: 'Active', value: activeCount, icon: Grid3X3, color: 'text-emerald-400' },
            { label: 'Categories', value: categoryCount, icon: Grid3X3, color: 'text-violet-400' },
          ].map((s) => (
            <div key={s.label} className="py-2.5 px-3 flex items-center gap-2.5">
              <s.icon className={`w-3.5 h-3.5 ${s.color} shrink-0`} />
              <div>
                <p className="text-lg font-bold font-heading text-foreground tabular-nums leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {categories.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              const label = cat === 'all' ? 'All' : cat;
              const count = cat === 'all' ? products.length : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                  <span className={`tabular-nums ml-0.5 ${active ? 'text-blue-400' : 'text-muted-foreground/60'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="relative sm:ml-auto sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-8 h-8 rounded-full bg-white/[0.03] border-white/[0.08] text-sm placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      {filtered.length === 0 ? (
        <div className={`${CARD} py-16 text-center`}>
          <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">
            {products.length === 0 ? 'No products yet' : 'No matching products'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {products.length === 0 ? 'Add your first product to build your catalog.' : 'Try a different filter or search.'}
          </p>
          {products.length === 0 && (
            <Button
              onClick={openAdd}
              variant="outline"
              className="rounded-xl h-9 text-xs mt-5 gap-1.5 border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map((p) => {
            const imgUrl = p.images?.[0] || null;
            return (
              <div
                key={p.id}
                className={`${CARD} overflow-hidden group active:scale-[0.98] transition-all duration-200 hover:border-white/[0.12]`}
              >
                <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={resolveImageUrl(imgUrl)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList?.remove('hidden'); }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${imgUrl ? 'hidden' : ''}`}>
                    <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
                  </div>

                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80">
                      <Pencil className="h-3 w-3 text-white/70" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center hover:bg-red-500/80">
                      <Trash2 className="h-3 w-3 text-white/70" />
                    </button>
                  </div>

                  {p.category && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 backdrop-blur text-white/70 text-[10px] px-1.5 py-0.5 font-medium">
                      {p.category}
                    </span>
                  )}
                  {p.discount && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-emerald-500/80 text-white text-[10px] px-1.5 py-0.5 font-bold">
                      {p.discount}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="text-[12px] sm:text-sm font-semibold text-foreground truncate">{p.name}</h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-bold text-foreground flex items-center gap-0.5 text-xs sm:text-sm tabular-nums">
                      <IndianRupee className="w-3 h-3" />
                      {Number(p.price || 0).toLocaleString('en-IN')}
                    </span>
                    {!p.active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground font-medium">Off</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <FAB onClick={openAdd} label="Add" />

      {/* ── ADD / EDIT DIALOG ── */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-white/[0.08] bg-[#0A0A0A] p-0 gap-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06] text-left space-y-1">
            <DialogTitle className="text-base font-heading font-semibold text-foreground">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {editingProduct ? 'Update product details below.' : 'Fill in details to add a new product.'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground" htmlFor="p-name">Product name</label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Blue Cotton Shirt" className={fieldClass} required />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground" htmlFor="p-desc">Description</label>
              <Textarea id="p-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={2} className={`${textareaClass} min-h-[64px]`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="p-price">Price (₹)</label>
                <Input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="p-cat">Category</label>
                <Input id="p-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Clothing" className={fieldClass} />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="text-xs font-medium text-foreground">Product images</label>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 mb-2">First image is the main image.</p>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.images.map((url, i) => (
                    <div key={url + i} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                      <img src={resolveImageUrl(url)} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-center bg-blue-500/80 text-white py-px">Main</span>}
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] hover:border-white/[0.2] p-4 cursor-pointer transition-colors ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFileUpload(e.dataTransfer.files); }}
              >
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
                {uploading ? (
                  <><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-[11px] text-muted-foreground">Uploading...</span></>
                ) : (
                  <><Upload className="w-5 h-5 text-muted-foreground/40" /><span className="text-[11px] text-muted-foreground">Drag & drop or <span className="text-foreground font-medium">browse</span></span></>
                )}
              </label>
            </div>

            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground" htmlFor="p-wa">WhatsApp order link</label>
                <Input id="p-wa" type="url" value={form.whatsapp_order_link} onChange={(e) => setForm((f) => ({ ...f, whatsapp_order_link: e.target.value }))} placeholder="https://wa.me/..." className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground" htmlFor="p-disc">Discount</label>
                  <Input id="p-disc" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} placeholder="e.g. 10% off" className={fieldClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground" htmlFor="p-tags">Tags</label>
                  <Input id="p-tags" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="sale, new" className={fieldClass} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="p-active" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded border-white/[0.15] bg-transparent" />
                <label htmlFor="p-active" className="text-sm text-foreground cursor-pointer">Active (visible on catalog)</label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-3 border-t border-white/[0.06] px-0 pb-0">
              <Button type="button" variant="outline" onClick={closeForm} className="rounded-xl h-9 border-white/[0.1] bg-transparent hover:bg-white/[0.04]">
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading} className="rounded-xl h-9 gap-1.5 min-w-[120px] bg-blue-500 text-white hover:bg-blue-600">
                {saving ? 'Saving...' : editingProduct ? 'Update' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerCatalogPage;
