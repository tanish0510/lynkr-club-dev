import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Search, X, Globe, Heart, Package, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api, { resolveImageUrl } from '@/utils/api';

const StoreCard = ({ p, isFav, onToggleFav, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/20 active:scale-[0.98] text-left touch-manipulation"
  >
    {/* Favorite */}
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onToggleFav(p.id); }}
      onKeyDown={(e) => e.key === 'Enter' && (e.stopPropagation(), onToggleFav(p.id))}
      className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 hover:bg-background/80"
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`h-3.5 w-3.5 transition-colors duration-200 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
    </div>

    {/* Image */}
    <div className="relative w-full aspect-[4/3] bg-muted/40 overflow-hidden">
      {p.logo ? (
        <img
          src={resolveImageUrl(p.logo)}
          alt={p.business_name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Store className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
      {p.status === 'ACTIVE' && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/15 backdrop-blur-sm px-2 py-0.5">
          <Globe className="h-2.5 w-2.5 text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500">Live</span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="px-3 py-2.5 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-foreground truncate leading-snug">{p.business_name}</p>
        {p.category && (
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">{p.category}</p>
        )}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
    </div>
  </button>
);

const CatalogPage = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/partners/active');
        setPartners(res.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();

    (async () => {
      try {
        const res = await api.get('/user/favorite-stores');
        setFavoriteIds(res.data || []);
      } catch { /* silent */ }
    })();
  }, []);

  const toggleFavorite = async (partnerId) => {
    const isFav = favoriteIds.includes(partnerId);
    const store = partners.find(p => p.id === partnerId);
    const name = store?.business_name || 'Store';
    setFavoriteIds((prev) =>
      isFav ? prev.filter((id) => id !== partnerId) : [...prev, partnerId]
    );
    try {
      if (isFav) {
        await api.delete(`/user/favorite-stores/${partnerId}`);
        toast('Removed from favorites', { icon: '💔' });
      } else {
        await api.post(`/user/favorite-stores/${partnerId}`);
        toast(`${name} added to favorites`, { icon: '❤️' });
      }
    } catch {
      setFavoriteIds((prev) =>
        isFav ? [...prev, partnerId] : prev.filter((id) => id !== partnerId)
      );
      toast.error('Could not update favorites');
    }
  };

  const withCatalog = partners.filter((p) => p.catalog_slug);

  const categories = useMemo(() => {
    const cats = new Set();
    withCatalog.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [withCatalog]);

  const filtered = useMemo(() => {
    let list = withCatalog;
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter((p) =>
        (p.business_name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [withCatalog, activeCategory, query]);

  const favSet = new Set(favoriteIds);
  const favStores = filtered.filter((p) => favSet.has(p.id));
  const otherStores = filtered.filter((p) => !favSet.has(p.id));
  const hasFavs = favStores.length > 0;
  const getSlug = (p) => p.catalog_slug || p.id;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-2xl px-4 pt-5 pb-10 sm:pt-8 sm:pb-14 sm:px-6">

        {/* ── HEADER ── */}
        <div className="mb-5">
          <h1 className="text-lg font-heading font-bold text-foreground">Stores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse partner stores and discover products.</p>
        </div>

        {/* ── SEARCH ── */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stores..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* ── CATEGORY PILLS ── */}
        {categories.length > 0 && (
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

        {/* ── STORE COUNT ── */}
        {!loading && filtered.length > 0 && (
          <p className="text-[11px] text-muted-foreground font-medium mb-3">
            {filtered.length} store{filtered.length !== 1 ? 's' : ''} available
          </p>
        )}

        {/* ── GRID ── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-foreground font-semibold">
              {query || activeCategory ? 'No matching stores' : 'No stores available yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new partner stores.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorites */}
            {hasFavs && (
              <section>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-2.5 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  Favorites
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {favStores.map((p) => (
                    <StoreCard key={p.id} p={p} isFav onToggleFav={toggleFavorite} onClick={() => navigate(`/catalog/${getSlug(p)}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Other stores */}
            <section>
              {hasFavs && otherStores.length > 0 && (
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-2.5">All Stores</p>
              )}
              {!hasFavs && (
                <p className="text-[11px] text-muted-foreground mb-3">
                  Tap <Heart className="inline h-3 w-3 text-muted-foreground relative -top-px" /> to save your favorites
                </p>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {otherStores.map((p) => (
                  <StoreCard key={p.id} p={p} isFav={false} onToggleFav={toggleFavorite} onClick={() => navigate(`/catalog/${getSlug(p)}`)} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;
