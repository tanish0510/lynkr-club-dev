import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Image as ImageIcon, IndianRupee, MessageCircle,
  Search, X, Store, Package, Heart, Globe, Grid3X3, ChevronRight, Clock,
} from 'lucide-react';
import api, { resolveImageUrl } from '@/utils/api';
import { getStoredToken } from '@/utils/sessionStorage';
import Logo from '@/components/Logo';

const ProductCard = ({ product }) => {
  const imgUrl = product.images?.[0] || null;
  const waLink = (product.whatsapp_order_link || '').trim();

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full transition-all duration-200 hover:border-primary/20">
      <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
        {imgUrl ? (
          <img
            src={resolveImageUrl(imgUrl)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList?.remove('hidden'); }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${imgUrl ? 'hidden' : ''}`}>
          <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
        </div>
        {product.category && (
          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-background/60 backdrop-blur-sm text-[10px] font-medium text-muted-foreground">
            {product.category}
          </span>
        )}
        {product.discount && (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-[10px] font-bold text-white">
            {product.discount}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col min-w-0">
        <h3 className="text-[13px] font-bold text-foreground leading-snug truncate">{product.name}</h3>
        {product.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
        )}
        <div className="mt-auto pt-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-foreground flex items-center gap-0.5 text-sm tabular-nums">
            <IndianRupee className="w-3 h-3" />
            {Number(product.price || 0).toLocaleString('en-IN')}
          </span>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors touch-manipulation"
            >
              <MessageCircle className="w-3 h-3" />
              Order
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicCatalogPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const isLoggedIn = Boolean(getStoredToken());

  useEffect(() => {
    if (!slug) { setError('Store not found'); setLoading(false); return; }
    (async () => {
      try {
        const res = await api.get(`/catalog/public/${slug}`);
        setData(res.data);
        setError(null);
        if (isLoggedIn && res.data?.partner?.id) {
          try {
            const favRes = await api.get('/user/favorite-stores');
            setIsFav((favRes.data || []).includes(res.data.partner.id));
          } catch { /* silent */ }
        }
      } catch (err) {
        setError(err?.response?.status === 404 ? 'Store not found' : 'Failed to load store');
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, isLoggedIn]);

  const toggleFav = async () => {
    if (!data?.partner?.id) return;
    const partnerId = data.partner.id;
    const wasFav = isFav;
    setIsFav(!wasFav);
    try {
      if (wasFav) await api.delete(`/user/favorite-stores/${partnerId}`);
      else await api.post(`/user/favorite-stores/${partnerId}`);
    } catch {
      setIsFav(wasFav);
    }
  };

  const products = data?.products || [];
  const partner = data?.partner;
  const storeName = partner?.business_name || 'Store';

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategory, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground mt-4">Loading store...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Store className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-foreground font-semibold mb-1">{error || 'Store not found'}</p>
        <p className="text-xs text-muted-foreground mb-5">This store may have been removed or is unavailable.</p>
        <Button variant="outline" className="rounded-xl text-sm" onClick={() => navigate('/app/catalog')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> All Stores
        </Button>
      </div>
    );
  }

  const activeCount = products.filter((p) => p.active !== false).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/catalog')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors touch-manipulation shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            All Stores
          </button>
          <button type="button" onClick={() => navigate('/')} className="transition-opacity hover:opacity-80">
            <Logo className="h-7 w-20" />
          </button>
          <div className="w-16" aria-hidden />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-6 pb-12 sm:px-6">
        {/* ── STORE BANNER ── */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
          <div className="p-4 flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-muted/50 shrink-0 overflow-hidden flex items-center justify-center border border-border">
              {partner?.logo ? (
                <img src={resolveImageUrl(partner.logo)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-heading font-bold text-foreground leading-tight truncate">{storeName}</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {products.length} product{products.length !== 1 ? 's' : ''}
                {categories.length > 0 && ` · ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
              </p>
            </div>
            {isLoggedIn && (
              <button
                type="button"
                onClick={toggleFav}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 touch-manipulation hover:bg-muted/50"
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart className={`h-4 w-4 transition-colors duration-200 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
            {[
              { label: 'Products', value: products.length },
              { label: 'Active', value: activeCount },
              { label: 'Categories', value: categories.length },
            ].map((s) => (
              <div key={s.label} className="py-2 px-3 text-center">
                <p className="text-sm font-bold font-heading text-foreground tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {partner?.return_window_days > 0 && (
            <div className="border-t border-border px-4 py-2 flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Points credited {partner.return_window_days} day{partner.return_window_days !== 1 ? 's' : ''} after order verification
              </p>
            </div>
          )}
        </section>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-foreground font-semibold">No products yet</p>
            <p className="text-xs text-muted-foreground mt-1">This store hasn't added products to their catalog.</p>
          </div>
        ) : (
          <>
            {/* ── SEARCH + FILTERS ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search in ${storeName}...`}
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/30"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
              <div className="mb-5 flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all touch-manipulation ${
                    !activeCategory
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all touch-manipulation ${
                      activeCategory === cat
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Result count */}
            {filtered.length > 0 && filtered.length !== products.length && (
              <p className="text-[11px] text-muted-foreground mb-3">
                Showing {filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* ── PRODUCT GRID ── */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                <p className="text-sm text-foreground font-semibold">No products match your search</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different keyword or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-4 text-center">
        <button type="button" onClick={() => navigate('/')} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          Powered by Lynkr
        </button>
      </footer>
    </div>
  );
};

export default PublicCatalogPage;
