import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users, Building2, ShoppingBag, LogOut, CheckCircle2, XCircle, Gift, Pencil, Trash2,
  Plus, Copy, ChevronDown, Eye, EyeOff, Upload, X, Clock, RefreshCw, Search,
  LayoutDashboard, ArrowLeft, ArrowUpRight, ArrowDownRight, IndianRupee,
  TrendingUp, Activity, AlertTriangle, ChevronRight, Shield, Minus, Hash,
  FileText, Menu, BarChart3, Coins, Package, Flag, UserX, UserCheck,
} from 'lucide-react';
import api, { resolveImageUrl } from '@/utils/api';
import AppAvatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'partners', label: 'Partners', icon: Building2 },
  { id: 'coupons', label: 'Coupons', icon: Gift },
  { id: 'rewards', label: 'Rewards', icon: Coins },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const inputCls = 'w-full bg-[#1a1a1a] border border-white/[0.08] rounded-xl h-10 px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition-colors';
const cardCls = 'bg-[#121212] border border-white/[0.06] rounded-2xl';
const badgeCls = (color) => `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`;

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  VERIFIED: 'bg-emerald-500/15 text-emerald-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  FLAGGED: 'bg-orange-500/15 text-orange-400',
  ACTIVE: 'bg-emerald-500/15 text-emerald-400',
  PILOT: 'bg-blue-500/15 text-blue-400',
};

const fmt = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const CopyBtn = ({ text, label }) => (
  <button type="button" onClick={() => { navigator.clipboard.writeText(text); toast.success(`${label} copied`); }}
    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
    <Copy className="h-3 w-3" /> Copy
  </button>
);

const StatCard = ({ label, value, sub, icon: Icon, color = 'text-blue-400' }) => (
  <div className={`${cardCls} p-4`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] text-white/40 uppercase tracking-wider">{label}</span>
      {Icon && <Icon className={`h-4 w-4 ${color}`} />}
    </div>
    <p className="text-2xl font-bold text-white tabular-nums font-heading">{value}</p>
    {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
  </div>
);

const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
    <input className={`${inputCls} pl-9`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    {value && <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
  </div>
);

const FilterPill = ({ active, onClick, children, count }) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-white/[0.04] text-white/40 hover:text-white/60'}`}>
    {children}{count !== undefined && <span className="ml-1.5 tabular-nums">({count})</span>}
  </button>
);

// ─── Admin Panel ─────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const hashSection = (location.hash || '#').slice(1).toLowerCase();
  const activeSection = SECTIONS.find((s) => s.id === hashSection)?.id || 'overview';
  const setSection = (id) => navigate(`/app/admin#${id}`, { replace: true });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [activityPurchases, setActivityPurchases] = useState([]);
  const [activityRedemptions, setActivityRedemptions] = useState([]);

  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [partnerDetail, setPartnerDetail] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [usersRes, partnersRes, purchasesRes, couponsRes, redemptionsRes, activityRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/partners'),
        api.get('/admin/purchases'),
        api.get('/admin/coupons'),
        api.get('/admin/redemptions'),
        api.get('/admin/activity-feed?limit=100'),
      ]);
      setUsers(usersRes.data);
      setPartners(partnersRes.data);
      setPurchases(purchasesRes.data);
      setCoupons(couponsRes.data);
      setRedemptions(redemptionsRes.data);
      setActivityPurchases(activityRes.data.purchases || []);
      setActivityRedemptions(activityRes.data.redemptions || []);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleGlobalSearch = useCallback(async (q) => {
    setGlobalSearch(q);
    if (q.trim().length < 2) { setGlobalResults(null); return; }
    setSearchLoading(true);
    try {
      const res = await api.get(`/admin/search?q=${encodeURIComponent(q.trim())}`);
      setGlobalResults(res.data);
    } catch { /* ignore */ } finally { setSearchLoading(false); }
  }, []);

  const loadUserDetail = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/detail`);
      setUserDetail(res.data);
      setSelectedUser(userId);
    } catch { toast.error('Failed to load user detail'); }
  };

  const loadPartnerDetail = async (partnerId) => {
    try {
      const res = await api.get(`/admin/partners/${partnerId}/detail`);
      setPartnerDetail(res.data);
      setSelectedPartner(partnerId);
    } catch { toast.error('Failed to load partner detail'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading command center…</p>
        </div>
      </div>
    );
  }

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const partnerMap = Object.fromEntries(partners.map((p) => [p.id, p]));
  const now = new Date();
  const totalRevenue = purchases.filter((p) => p.status === 'VERIFIED').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const pendingCount = purchases.filter((p) => p.status === 'PENDING').length;
  const flaggedCount = purchases.filter((p) => p.status === 'FLAGGED').length;
  const activeCoupons = coupons.filter((c) => c.is_active && new Date(c.expiry_date) > now);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Lynkr Admin</p>
              <p className="text-[10px] text-white/30">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SECTIONS.map((s) => {
            const active = activeSection === s.id;
            const Icon = s.icon;
            let badge = null;
            if (s.id === 'purchases' && pendingCount > 0) badge = pendingCount;
            if (s.id === 'activity' && flaggedCount > 0) badge = flaggedCount;
            return (
              <button key={s.id} onClick={() => { setSection(s.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-blue-500/10 text-blue-400' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{s.label}</span>
                {badge && <span className="min-w-[20px] h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center px-1.5">{badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button onClick={() => { logout(); navigate('/app/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-14">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/40 hover:text-white"><Menu className="h-5 w-5" /></button>
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl h-9 pl-9 pr-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-blue-500/40 transition-colors"
                placeholder="Search users, partners, orders…" value={globalSearch} onChange={(e) => handleGlobalSearch(e.target.value)} />
              {globalSearch && (
                <button onClick={() => { setGlobalSearch(''); setGlobalResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {globalResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121212] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto z-50">
                  {searchLoading ? (
                    <p className="px-4 py-6 text-center text-white/30 text-sm">Searching…</p>
                  ) : (
                    <>
                      {globalResults.users?.length > 0 && (
                        <div className="p-3">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider px-1 mb-2">Users</p>
                          {globalResults.users.map((u) => (
                            <button key={u.id} onClick={() => { loadUserDetail(u.id); setSection('users'); setGlobalSearch(''); setGlobalResults(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left">
                              <AppAvatar avatar={u.avatar} username={u.username} className="h-7 w-7" />
                              <div className="min-w-0"><p className="text-sm text-white truncate">{u.username}</p><p className="text-[11px] text-white/30 truncate">{u.email}</p></div>
                              <span className="ml-auto text-xs text-blue-400 tabular-nums">{u.points} pts</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {globalResults.partners?.length > 0 && (
                        <div className="p-3 border-t border-white/[0.06]">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider px-1 mb-2">Partners</p>
                          {globalResults.partners.map((p) => (
                            <button key={p.id} onClick={() => { loadPartnerDetail(p.id); setSection('partners'); setGlobalSearch(''); setGlobalResults(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left">
                              <div className="h-7 w-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                                {p.logo ? <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-3.5 w-3.5 text-white/30" />}
                              </div>
                              <div className="min-w-0"><p className="text-sm text-white truncate">{p.business_name}</p><p className="text-[11px] text-white/30 truncate">{p.category}</p></div>
                              <span className={`ml-auto ${badgeCls(STATUS_COLORS[p.status] || 'bg-white/10 text-white/40')}`}>{p.status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {globalResults.purchases?.length > 0 && (
                        <div className="p-3 border-t border-white/[0.06]">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider px-1 mb-2">Purchases</p>
                          {globalResults.purchases.map((p) => (
                            <button key={p.id} onClick={() => { setSection('purchases'); setGlobalSearch(''); setGlobalResults(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left">
                              <Hash className="h-3.5 w-3.5 text-white/20 shrink-0" />
                              <div className="min-w-0"><p className="text-sm text-white truncate">{p.order_id}</p><p className="text-[11px] text-white/30 truncate">{p.brand} • ₹{p.amount}</p></div>
                              <span className={`ml-auto ${badgeCls(STATUS_COLORS[p.status] || '')}`}>{p.status}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!globalResults.users?.length && !globalResults.partners?.length && !globalResults.purchases?.length && (
                        <p className="px-4 py-6 text-center text-white/30 text-sm">No results for "{globalSearch}"</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-6 max-w-[1400px]">
          {activeSection === 'overview' && <OverviewSection users={users} partners={partners} purchases={purchases} coupons={coupons} activeCoupons={activeCoupons} totalRevenue={totalRevenue} pendingCount={pendingCount} flaggedCount={flaggedCount} redemptions={redemptions} partnerMap={partnerMap} userMap={userMap} onNavigate={setSection} />}
          {activeSection === 'purchases' && <PurchasesSection purchases={purchases} users={users} partners={partners} userMap={userMap} partnerMap={partnerMap} onRefresh={fetchAllData} />}
          {activeSection === 'users' && <UsersSection users={users} purchases={purchases} partnerMap={partnerMap} onRefresh={fetchAllData} selectedUser={selectedUser} setSelectedUser={setSelectedUser} userDetail={userDetail} setUserDetail={setUserDetail} loadUserDetail={loadUserDetail} />}
          {activeSection === 'partners' && <PartnersSection partners={partners} purchases={purchases} userMap={userMap} onRefresh={fetchAllData} selectedPartner={selectedPartner} setSelectedPartner={setSelectedPartner} partnerDetail={partnerDetail} setPartnerDetail={setPartnerDetail} loadPartnerDetail={loadPartnerDetail} />}
          {activeSection === 'coupons' && <CouponsSection coupons={coupons} partners={partners} onRefresh={fetchAllData} />}
          {activeSection === 'rewards' && <RewardsSection redemptions={redemptions} userMap={userMap} coupons={coupons} />}
          {activeSection === 'activity' && <ActivitySection activityPurchases={activityPurchases} activityRedemptions={activityRedemptions} userMap={userMap} partnerMap={partnerMap} />}
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════
const OverviewSection = ({ users, partners, purchases, coupons, activeCoupons, totalRevenue, pendingCount, flaggedCount, redemptions, partnerMap, userMap, onNavigate }) => {
  const verifiedPurchases = purchases.filter((p) => p.status === 'VERIFIED');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRevenue = verifiedPurchases.filter((p) => (p.verified_at || p.timestamp || '').slice(0, 10) === todayStr).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalPoints = users.reduce((s, u) => s + (u.points || 0), 0);

  const partnerRevenue = {};
  verifiedPurchases.forEach((p) => {
    if (p.partner_id) partnerRevenue[p.partner_id] = (partnerRevenue[p.partner_id] || 0) + (parseFloat(p.amount) || 0);
  });
  const topPartners = Object.entries(partnerRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

  const recentPurchases = [...purchases].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 6);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Revenue" value={fmt(totalRevenue)} sub={`Today: ${fmt(todayRevenue)}`} icon={IndianRupee} color="text-emerald-400" />
        <StatCard label="Users" value={users.length} icon={Users} />
        <StatCard label="Partners" value={partners.length} icon={Building2} color="text-purple-400" />
        <StatCard label="Transactions" value={purchases.length} sub={`${pendingCount} pending`} icon={ShoppingBag} color="text-yellow-400" />
        <StatCard label="Active Coupons" value={activeCoupons.length} sub={`${coupons.length} total`} icon={Gift} color="text-pink-400" />
        <StatCard label="Points Pool" value={totalPoints.toLocaleString()} icon={Coins} color="text-orange-400" />
      </div>

      {/* Action items */}
      {(pendingCount > 0 || flaggedCount > 0) && (
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" /> Needs Attention
          </h3>
          <div className="flex flex-wrap gap-3">
            {pendingCount > 0 && (
              <button onClick={() => onNavigate('purchases')} className="flex items-center gap-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-4 py-3 hover:bg-yellow-500/10 transition-colors">
                <ShoppingBag className="h-4 w-4 text-yellow-400" />
                <div className="text-left"><p className="text-sm font-medium text-white">{pendingCount} pending purchase{pendingCount !== 1 ? 's' : ''}</p><p className="text-[11px] text-white/30">Awaiting verification</p></div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>
            )}
            {flaggedCount > 0 && (
              <button onClick={() => onNavigate('purchases')} className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/10 rounded-xl px-4 py-3 hover:bg-orange-500/10 transition-colors">
                <Flag className="h-4 w-4 text-orange-400" />
                <div className="text-left"><p className="text-sm font-medium text-white">{flaggedCount} flagged order{flaggedCount !== 1 ? 's' : ''}</p><p className="text-[11px] text-white/30">Review required</p></div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Partners by Revenue */}
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Top Partners by Revenue</h3>
          <div className="space-y-3">
            {topPartners.map(([id, rev], i) => {
              const p = partnerMap[id];
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/20 w-4 tabular-nums">{i + 1}</span>
                  <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.06]">
                    {p?.logo ? <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-3.5 w-3.5 text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{p?.business_name || id.slice(0, 8)}</p></div>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(rev)}</span>
                </div>
              );
            })}
            {topPartners.length === 0 && <p className="text-sm text-white/20 text-center py-4">No revenue data yet</p>}
          </div>
        </div>

        {/* Top Users by Points */}
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Top Users by Points</h3>
          <div className="space-y-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-[11px] text-white/20 w-4 tabular-nums">{i + 1}</span>
                <AppAvatar avatar={u.avatar} username={u.username} className="h-8 w-8" />
                <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{u.username || u.email}</p></div>
                <span className="text-sm font-bold text-blue-400 tabular-nums">{(u.points || 0).toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={`${cardCls} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Recent Transactions</h3>
          <button onClick={() => onNavigate('purchases')} className="text-[11px] text-blue-400 hover:text-blue-300">View all →</button>
        </div>
        <div className="space-y-2">
          {recentPurchases.map((p) => {
            const u = userMap[p.user_id];
            const partner = partnerMap[p.partner_id];
            return (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <AppAvatar avatar={u?.avatar} username={u?.username} className="h-7 w-7" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate"><span className="text-white/60">{u?.username || 'Unknown'}</span> → <span className="text-white/60">{partner?.business_name || p.brand}</span></p>
                  <p className="text-[11px] text-white/20">#{p.order_id}</p>
                </div>
                <span className="text-sm font-medium text-white tabular-nums">₹{p.amount}</span>
                <span className={badgeCls(STATUS_COLORS[p.status] || '')}>{p.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PURCHASES
// ═══════════════════════════════════════════════════════════════
const PurchasesSection = ({ purchases, users, partners, userMap, partnerMap, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ user_id: '', partner_id: '', order_id: '', amount: '', brand: '' });
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let list = [...purchases].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    if (statusFilter !== 'ALL') list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.order_id || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (userMap[p.user_id]?.username || '').toLowerCase().includes(q) || (userMap[p.user_id]?.email || '').toLowerCase().includes(q));
    }
    return list;
  }, [purchases, statusFilter, search, userMap]);

  const counts = { ALL: purchases.length, PENDING: 0, VERIFIED: 0, REJECTED: 0, FLAGGED: 0 };
  purchases.forEach((p) => { if (counts[p.status] !== undefined) counts[p.status]++; });

  const handleVerify = async (id, action) => {
    try {
      await api.post(`/admin/verify-purchase/${id}?action=${action}`);
      toast.success(`Purchase ${action === 'VERIFY' ? 'verified' : 'rejected'}`);
      await onRefresh();
    } catch { toast.error('Action failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/purchases/${id}/status`, { status });
      toast.success('Status updated');
      await onRefresh();
    } catch { toast.error('Update failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/create-purchase', {
        user_id: createForm.user_id,
        partner_id: createForm.partner_id || undefined,
        order_id: createForm.order_id.trim(),
        amount: parseFloat(createForm.amount),
        brand: createForm.brand.trim() || undefined,
      });
      toast.success('Purchase created');
      setShowCreate(false);
      setCreateForm({ user_id: '', partner_id: '', order_id: '', amount: '', brand: '' });
      await onRefresh();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to create purchase'); }
    finally { setCreating(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Purchases</h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create Purchase
        </Button>
      </div>

      {showCreate && (
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white mb-4">Manual Purchase</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">User</label>
                <select className={inputCls} value={createForm.user_id} onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })} required>
                  <option value="">Select user…</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">Partner (optional)</label>
                <select className={inputCls} value={createForm.partner_id} onChange={(e) => setCreateForm({ ...createForm, partner_id: e.target.value })}>
                  <option value="">None</option>
                  {partners.map((p) => <option key={p.id} value={p.id}>{p.business_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input className={inputCls} placeholder="Order ID" value={createForm.order_id} onChange={(e) => setCreateForm({ ...createForm, order_id: e.target.value })} required />
              <input className={inputCls} type="number" min="1" step="0.01" placeholder="Amount (₹)" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })} required />
              <input className={inputCls} placeholder="Brand (auto from partner)" value={createForm.brand} onChange={(e) => setCreateForm({ ...createForm, brand: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="text-white/40 h-9">Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl bg-blue-500 hover:bg-blue-600 h-9 text-sm">{creating ? 'Creating…' : 'Create'}</Button>
            </div>
          </form>
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Search by order ID, brand, user…" />

      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED'].map((s) => (
          <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={counts[s]}>{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</FilterPill>
        ))}
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Order</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">User</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Partner</th>
                <th className="text-right text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Amount</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Status</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Date</th>
                <th className="text-right text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p) => {
                const u = userMap[p.user_id];
                const partner = partnerMap[p.partner_id];
                return (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs">#{p.order_id}</p>
                      <p className="text-[11px] text-white/20 truncate max-w-[120px]">{p.brand}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AppAvatar avatar={u?.avatar} username={u?.username} className="h-6 w-6" />
                        <span className="text-xs text-white/70 truncate max-w-[100px]">{u?.username || p.user_id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50 truncate max-w-[120px]">{partner?.business_name || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white tabular-nums">₹{p.amount}</td>
                    <td className="px-4 py-3"><span className={badgeCls(STATUS_COLORS[p.status] || '')}>{p.status}</span></td>
                    <td className="px-4 py-3 text-xs text-white/30 tabular-nums">{new Date(p.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleVerify(p.id, 'VERIFY')} className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors">Verify</button>
                            <button onClick={() => handleVerify(p.id, 'REJECT')} className="h-7 px-2.5 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors">Reject</button>
                          </>
                        )}
                        {p.status === 'FLAGGED' && (
                          <>
                            <button onClick={() => handleStatusChange(p.id, 'VERIFIED')} className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors">Approve</button>
                            <button onClick={() => handleStatusChange(p.id, 'REJECTED')} className="h-7 px-2.5 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors">Reject</button>
                          </>
                        )}
                        {(p.status === 'VERIFIED' || p.status === 'REJECTED') && (
                          <button onClick={() => handleStatusChange(p.id, 'PENDING')} className="h-7 px-2.5 rounded-lg bg-white/[0.04] text-white/40 text-[11px] font-medium hover:bg-white/[0.08] transition-colors">Reset</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-10">No purchases match your filters</p>}
          {filtered.length > 100 && <p className="text-center text-white/20 text-xs py-3">Showing first 100 of {filtered.length}</p>}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
const UsersSection = ({ users, purchases, partnerMap, onRefresh, selectedUser, setSelectedUser, userDetail, setUserDetail, loadUserDetail }) => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [pointsForm, setPointsForm] = useState({ userId: '', operation: 'add', points: '', reason: '' });
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q));
  }, [users, search]);

  const openPointsModal = (userId) => {
    setPointsForm({ userId, operation: 'add', points: '', reason: '' });
    setShowPointsModal(true);
  };

  const handlePointsUpdate = async () => {
    const pts = parseInt(pointsForm.points, 10);
    if (isNaN(pts) || pts < 0) { toast.error('Enter valid points'); return; }
    setSaving(true);
    try {
      await api.patch(`/admin/users/${pointsForm.userId}/points`, { operation: pointsForm.operation, points: pts, reason: pointsForm.reason || undefined });
      toast.success('Points updated');
      setShowPointsModal(false);
      await onRefresh();
      if (selectedUser === pointsForm.userId) loadUserDetail(pointsForm.userId);
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  if (selectedUser && userDetail) {
    const ud = userDetail.user;
    const uPurchases = userDetail.purchases || [];
    const uLedger = userDetail.ledger || [];
    const uRedemptions = userDetail.redemptions || [];
    return (
      <div className="space-y-5">
        <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </button>
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center gap-4 mb-5">
            <AppAvatar avatar={ud.avatar} username={ud.username} className="h-14 w-14" />
            <div className="flex-1">
              <h2 className="text-xl font-bold">{ud.full_name || ud.username}</h2>
              <p className="text-sm text-white/40">{ud.email}</p>
              <p className="text-xs text-white/20 mt-0.5">@{ud.username} • ID: {ud.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400 tabular-nums">{(ud.points || 0).toLocaleString()}</p>
              <p className="text-[11px] text-white/30">points balance</p>
              <button onClick={() => openPointsModal(ud.id)} className="mt-2 text-[11px] text-blue-400 hover:text-blue-300">Adjust Points</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{uPurchases.length}</p><p className="text-[11px] text-white/30">Purchases</p></div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{uRedemptions.length}</p><p className="text-[11px] text-white/30">Redemptions</p></div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">₹{uPurchases.filter((p) => p.status === 'VERIFIED').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0).toLocaleString('en-IN')}</p><p className="text-[11px] text-white/30">Total Spent</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={`${cardCls} p-5`}>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Purchase History</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {uPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div><p className="text-sm text-white">{p.brand}</p><p className="text-[11px] text-white/20">#{p.order_id}</p></div>
                  <div className="text-right"><p className="text-sm font-medium tabular-nums">₹{p.amount}</p><span className={badgeCls(STATUS_COLORS[p.status] || '')}>{p.status}</span></div>
                </div>
              ))}
              {uPurchases.length === 0 && <p className="text-sm text-white/20 text-center py-4">No purchases</p>}
            </div>
          </div>
          <div className={`${cardCls} p-5`}>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Points Ledger</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {uLedger.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div><p className="text-sm text-white">{l.description}</p><p className="text-[11px] text-white/20">{new Date(l.created_at).toLocaleString('en-IN')}</p></div>
                  <div className="text-right">
                    <p className={`text-sm font-medium tabular-nums ${l.type.includes('CREDIT') || l.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {l.type.includes('CREDIT') || l.type === 'CREDIT' ? '+' : '-'}{l.amount}
                    </p>
                    <p className="text-[11px] text-white/20 tabular-nums">bal: {l.balance_after}</p>
                  </div>
                </div>
              ))}
              {uLedger.length === 0 && <p className="text-sm text-white/20 text-center py-4">No ledger entries</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Users <span className="text-white/30 text-lg">({users.length})</span></h1>
        <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create User
        </Button>
      </div>

      {showCreate && <CreateUserInline onCreated={() => { onRefresh(); setShowCreate(false); }} />}

      <SearchBar value={search} onChange={setSearch} placeholder="Search by username, email, name…" />

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">User</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Email</th>
                <th className="text-right text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Points</th>
                <th className="text-right text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => loadUserDetail(u.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AppAvatar avatar={u.avatar} username={u.username} className="h-8 w-8" />
                      <div><p className="text-sm text-white font-medium">{u.username || u.full_name}</p><p className="text-[11px] text-white/20">{u.full_name}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">{u.email}</td>
                  <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-blue-400 tabular-nums">{(u.points || 0).toLocaleString()}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openPointsModal(u.id)} className="h-7 px-2.5 rounded-lg bg-white/[0.04] text-white/40 text-[11px] font-medium hover:bg-white/[0.08] transition-colors">Points</button>
                      <button onClick={() => loadUserDetail(u.id)} className="h-7 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-colors">Detail</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-10">No users found</p>}
        </div>
      </div>

      {showPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPointsModal(false)}>
          <div className={`${cardCls} p-6 w-full max-w-md mx-4`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Adjust Points</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['add', 'subtract', 'set'].map((op) => (
                  <button key={op} onClick={() => setPointsForm({ ...pointsForm, operation: op })}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${pointsForm.operation === op ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30' : 'bg-white/[0.04] text-white/40'}`}>
                    {op.charAt(0).toUpperCase() + op.slice(1)}
                  </button>
                ))}
              </div>
              <input className={inputCls} type="number" min="0" placeholder="Points" value={pointsForm.points} onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })} />
              <input className={inputCls} placeholder="Reason (optional)" value={pointsForm.reason} onChange={(e) => setPointsForm({ ...pointsForm, reason: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowPointsModal(false)} className="text-white/40 h-9">Cancel</Button>
                <Button onClick={handlePointsUpdate} disabled={saving} className="rounded-xl bg-blue-500 hover:bg-blue-600 h-9 text-sm">{saving ? 'Saving…' : 'Update'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateUserInline = ({ onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', username: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/create-user', { email: form.email.trim(), password: form.password, full_name: form.full_name.trim(), username: form.username.trim().toLowerCase() });
      setResult({ email: form.email.trim(), password: form.password, username: res.data.username });
      toast.success('User created');
      onCreated();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  if (result) {
    return (
      <div className={`${cardCls} p-5`}>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-400">User created</p>
          <div className="space-y-1.5 text-sm">
            {[['Email', result.email], ['Password', result.password], ['Username', result.username]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between"><span className="text-white/40">{l}</span><span className="flex items-center gap-2 font-mono text-white">{v} <CopyBtn text={v} label={l} /></span></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardCls} p-5`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          <input className={inputCls} placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} required minLength={3} maxLength={20} />
        </div>
        <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <div className="relative">
          <input className={inputCls} type={showPw ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={saving} className="rounded-xl bg-blue-500 hover:bg-blue-600 h-9 text-sm">{saving ? 'Creating…' : 'Create User'}</Button></div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PARTNERS
// ═══════════════════════════════════════════════════════════════
const PartnersSection = ({ partners, purchases, userMap, onRefresh, selectedPartner, setSelectedPartner, partnerDetail, setPartnerDetail, loadPartnerDetail }) => {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [returnWindowInputs, setReturnWindowInputs] = useState({});
  const [processingCredits, setProcessingCredits] = useState(false);

  const verifiedByPartner = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      if (p.status === 'VERIFIED' && p.partner_id) map[p.partner_id] = (map[p.partner_id] || 0) + (parseFloat(p.amount) || 0);
    });
    return map;
  }, [purchases]);

  const ordersByPartner = useMemo(() => {
    const map = {};
    purchases.forEach((p) => { if (p.partner_id) map[p.partner_id] = (map[p.partner_id] || 0) + 1; });
    return map;
  }, [purchases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return partners;
    const q = search.toLowerCase();
    return partners.filter((p) => (p.business_name || '').toLowerCase().includes(q) || (p.contact_email || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [partners, search]);

  const handleStatus = async (id, status) => {
    try { await api.post(`/admin/update-partner-status/${id}?new_status=${status}`); toast.success('Status updated'); await onRefresh(); } catch { toast.error('Failed'); }
  };

  const handleResetPw = async (id) => {
    if (!window.confirm('Reset this partner\'s password?')) return;
    try {
      const res = await api.post(`/admin/partners/${id}/reset-password`);
      toast.success(`Password reset. Temp: ${res.data?.temp_password}`);
      await onRefresh();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed'); }
  };

  const handleReturnWindow = async (id) => {
    const days = parseInt(returnWindowInputs[id] ?? '', 10);
    if (isNaN(days) || days < 0) { toast.error('Enter valid days (0+)'); return; }
    try {
      await api.post(`/admin/partners/${id}/return-window`, { days });
      toast.success(days === 0 ? 'Return window removed' : `Set to ${days} days`);
      await onRefresh();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed'); }
  };

  const handleProcessCredits = async () => {
    setProcessingCredits(true);
    try {
      const res = await api.post('/admin/process-pending-credits');
      toast.success(res.data?.processed > 0 ? `Processed ${res.data.processed} credits` : 'No pending credits');
    } catch { toast.error('Failed'); }
    finally { setProcessingCredits(false); }
  };

  if (selectedPartner && partnerDetail) {
    const pd = partnerDetail.partner;
    const pPurchases = partnerDetail.purchases || [];
    return (
      <div className="space-y-5">
        <button onClick={() => { setSelectedPartner(null); setPartnerDetail(null); }} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Partners
        </button>
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center gap-4 mb-5">
            <div className="h-14 w-14 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.06]">
              {pd.logo ? <img src={resolveImageUrl(pd.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-white/20" />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{pd.business_name}</h2>
              <p className="text-sm text-white/40">{pd.category} • {pd.contact_email}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{fmt(partnerDetail.total_revenue || 0)}</p>
              <p className="text-[11px] text-white/30">total revenue</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{pPurchases.length}</p><p className="text-[11px] text-white/30">Orders</p></div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{pPurchases.filter((p) => p.status === 'VERIFIED').length}</p><p className="text-[11px] text-white/30">Verified</p></div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{pPurchases.filter((p) => p.status === 'PENDING').length}</p><p className="text-[11px] text-white/30">Pending</p></div>
            <div className="bg-white/[0.03] rounded-xl p-3 text-center"><p className="text-lg font-bold tabular-nums">{pPurchases.filter((p) => p.status === 'FLAGGED').length}</p><p className="text-[11px] text-white/30">Flagged</p></div>
          </div>
        </div>

        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">All Orders</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {pPurchases.map((p) => {
              const u = userMap[p.user_id];
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <AppAvatar avatar={u?.avatar} username={u?.username} className="h-6 w-6" />
                    <div><p className="text-sm text-white">{u?.username || p.user_id.slice(0, 8)}</p><p className="text-[11px] text-white/20">#{p.order_id} • {new Date(p.timestamp).toLocaleDateString('en-IN')}</p></div>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium tabular-nums">₹{p.amount}</span><span className={badgeCls(STATUS_COLORS[p.status] || '')}>{p.status}</span></div>
                </div>
              );
            })}
            {pPurchases.length === 0 && <p className="text-sm text-white/20 text-center py-4">No orders</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Partners <span className="text-white/30 text-lg">({partners.length})</span></h1>
        <div className="flex gap-2">
          <Button onClick={handleProcessCredits} disabled={processingCredits} variant="outline" className="rounded-xl border-white/[0.08] h-9 text-sm text-white/60">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${processingCredits ? 'animate-spin' : ''}`} /> {processingCredits ? 'Processing…' : 'Process Credits'}
          </Button>
          <Button onClick={() => setShowCreate(!showCreate)} className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white h-9 text-sm">
            <Plus className="h-4 w-4 mr-1.5" /> Create Partner
          </Button>
        </div>
      </div>

      {showCreate && <CreatePartnerInline onCreated={() => { onRefresh(); setShowCreate(false); }} />}

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, category…" />

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className={`${cardCls} p-5`}>
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.06] cursor-pointer" onClick={() => loadPartnerDetail(p.id)}>
                {p.logo ? <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-white/20" />}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadPartnerDetail(p.id)}>
                <h4 className="text-sm font-semibold text-white">{p.business_name}</h4>
                <p className="text-[11px] text-white/30">{p.category} • {p.contact_email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">{fmt(verifiedByPartner[p.id] || 0)}</p>
                  <p className="text-[11px] text-white/20">{ordersByPartner[p.id] || 0} orders</p>
                </div>
                <span className={badgeCls(STATUS_COLORS[p.status] || 'bg-white/10 text-white/40')}>{p.status}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-wrap items-center gap-2">
              <button onClick={() => handleStatus(p.id, 'ACTIVE')} className="h-7 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors">Active</button>
              <button onClick={() => handleStatus(p.id, 'PILOT')} className="h-7 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-medium hover:bg-blue-500/20 transition-colors">Pilot</button>
              <button onClick={() => handleStatus(p.id, 'PENDING')} className="h-7 px-2.5 rounded-lg bg-yellow-500/10 text-yellow-400 text-[11px] font-medium hover:bg-yellow-500/20 transition-colors">Pending</button>
              <button onClick={() => handleResetPw(p.id)} className="h-7 px-2.5 rounded-lg bg-white/[0.04] text-white/40 text-[11px] font-medium hover:bg-white/[0.08] transition-colors">Reset PW</button>
              <button onClick={() => loadPartnerDetail(p.id)} className="h-7 px-2.5 rounded-lg bg-white/[0.04] text-white/40 text-[11px] font-medium hover:bg-white/[0.08] transition-colors">Details</button>

              <div className="flex items-center gap-1.5 ml-auto">
                <Clock className="h-3 w-3 text-white/20" />
                <span className="text-[11px] text-white/30">{(p.return_window_days || 0) === 0 ? 'Instant' : `${p.return_window_days}d`}</span>
                <input type="number" min="0" placeholder="days" value={returnWindowInputs[p.id] ?? ''}
                  onChange={(e) => setReturnWindowInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="w-14 bg-white/[0.04] border border-white/[0.06] rounded-lg h-7 px-2 text-[11px] text-white placeholder:text-white/20 outline-none tabular-nums" />
                <button onClick={() => handleReturnWindow(p.id)} className="h-7 px-2 rounded-lg bg-white/[0.04] text-white/40 text-[11px] hover:bg-white/[0.08] transition-colors">Set</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-10">No partners found</p>}
      </div>
    </div>
  );
};

const CreatePartnerInline = ({ onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ business_name: '', category: '', website: '', contact_email: '', contact_person: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { business_name: form.business_name.trim(), category: form.category.trim(), website: form.website.trim(), contact_email: form.contact_email.trim(), contact_person: form.contact_person.trim() };
      if (form.password.trim().length >= 8) payload.password = form.password.trim();
      const res = await api.post('/admin/create-partner', payload);
      setResult({ email: form.contact_email.trim(), password: res.data.temp_password, business_name: form.business_name.trim() });
      toast.success('Partner created');
      onCreated();
    } catch (err) { toast.error(err?.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  if (result) {
    return (
      <div className={`${cardCls} p-5`}>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-400">Partner created</p>
          <div className="space-y-1.5 text-sm">
            {[['Business', result.business_name], ['Email', result.email], ['Password', result.password]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between"><span className="text-white/40">{l}</span><span className="flex items-center gap-2 font-mono text-white">{v} <CopyBtn text={v} label={l} /></span></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardCls} p-5`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
          <input className={inputCls} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </div>
        <input className={inputCls} placeholder="Website URL" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} required />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inputCls} type="email" placeholder="Contact email (login)" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
          <input className={inputCls} placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required />
        </div>
        <div className="relative">
          <input className={inputCls} type={showPw ? 'text' : 'password'} placeholder="Password (optional, auto-generated if blank)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
        </div>
        <div className="flex justify-end"><Button type="submit" disabled={saving} className="rounded-xl bg-blue-500 hover:bg-blue-600 h-9 text-sm">{saving ? 'Creating…' : 'Create Partner'}</Button></div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════
const CouponsSection = ({ coupons, partners, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [search, setSearch] = useState('');
  const emptyForm = { partner_id: '', title: '', description: '', coupon_code: '', value_type: 'fixed', value: '', min_purchase: '', points_cost: '', expiry_date: '', total_quantity: '', is_active: true, brand_logo: '' };
  const [form, setForm] = useState(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ partner_id: c.partner_id, title: c.title, description: c.description, coupon_code: c.coupon_code, value_type: c.value_type, value: c.value, min_purchase: c.min_purchase ?? '', points_cost: c.points_cost, expiry_date: new Date(c.expiry_date).toISOString().slice(0, 16), total_quantity: c.total_quantity, is_active: c.is_active, brand_logo: c.brand_logo || '' });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/admin/coupons/upload-logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((prev) => ({ ...prev, brand_logo: res.data.url }));
      toast.success('Logo uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setLogoUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.partner_id) { toast.error('Select a partner'); return; }
    setCouponLoading(true);
    try {
      const payload = { partner_id: form.partner_id, title: form.title, description: form.description, coupon_code: form.coupon_code, value_type: form.value_type, value: Number(form.value), min_purchase: form.min_purchase === '' ? null : Number(form.min_purchase), points_cost: Number(form.points_cost), expiry_date: new Date(form.expiry_date).toISOString(), total_quantity: Number(form.total_quantity), is_active: form.is_active, brand_logo: form.brand_logo || null };
      if (editingId) { await api.patch(`/admin/coupons/${editingId}`, payload); toast.success('Updated'); }
      else { await api.post('/admin/coupons', payload); toast.success('Created'); }
      resetForm(); await onRefresh();
    } catch (err) { toast.error(err?.response?.data?.detail || err.message || 'Failed'); }
    finally { setCouponLoading(false); }
  };

  const toggleCoupon = async (c) => {
    try { await api.patch(`/admin/coupons/${c.id}`, { is_active: !c.is_active }); toast.success(c.is_active ? 'Deactivated' : 'Activated'); await onRefresh(); } catch { toast.error('Failed'); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await api.delete(`/admin/coupons/${id}`); toast.success('Deleted'); await onRefresh(); } catch { toast.error('Failed'); }
  };

  const now = new Date();
  const partnerMap = Object.fromEntries(partners.map((p) => [p.id, p]));

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter((c) => (c.title || '').toLowerCase().includes(q) || (c.coupon_code || '').toLowerCase().includes(q) || (partnerMap[c.partner_id]?.business_name || '').toLowerCase().includes(q));
  }, [coupons, search, partnerMap]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-heading">Coupons <span className="text-white/30 text-lg">({coupons.length})</span></h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-white mb-4">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <form className="space-y-3" onSubmit={handleSave}>
            <div>
              <p className="text-[11px] text-white/30 mb-2">Partner</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {partners.map((p) => (
                  <button key={p.id} type="button" onClick={() => setForm({ ...form, partner_id: p.id })}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${form.partner_id === p.id ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
                    <div className="h-7 w-7 rounded-lg shrink-0 overflow-hidden bg-white/[0.04] flex items-center justify-center">
                      {p.logo ? <img src={resolveImageUrl(p.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-3.5 w-3.5 text-white/20" />}
                    </div>
                    <span className="text-xs font-medium text-white truncate">{p.business_name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-white/30 mb-2">Brand Logo (optional)</p>
              <div className="flex items-center gap-3">
                {form.brand_logo && (
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/[0.06] shrink-0">
                    <img src={resolveImageUrl(form.brand_logo)} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setForm({ ...form, brand_logo: '' })} className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-2.5 w-2.5" /></button>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] transition-colors">
                  <Upload className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-[11px] text-white/30">{logoUploading ? 'Uploading…' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                </label>
              </div>
            </div>
            <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input className={inputCls} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <input className={`${inputCls} uppercase`} placeholder="Coupon code" value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} required />
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={form.value_type} onChange={(e) => setForm({ ...form, value_type: e.target.value })}>
                <option value="fixed">Fixed</option><option value="percentage">Percentage</option>
              </select>
              <input type="number" min="0" step="0.01" className={inputCls} placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" className={inputCls} placeholder="Min purchase" value={form.min_purchase} onChange={(e) => setForm({ ...form, min_purchase: e.target.value })} />
              <input type="number" min="1" className={inputCls} placeholder="Points cost" value={form.points_cost} onChange={(e) => setForm({ ...form, points_cost: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="datetime-local" className={inputCls} value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
              <input type="number" min="1" className={inputCls} placeholder="Quantity" value={form.total_quantity} onChange={(e) => setForm({ ...form, total_quantity: e.target.value })} required />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs inline-flex items-center gap-2 text-white/40">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
              </label>
              <div className="flex gap-2">
                {editingId && <Button type="button" variant="ghost" onClick={resetForm} className="text-white/40 h-9">Cancel</Button>}
                <Button type="submit" disabled={couponLoading} className="rounded-xl bg-blue-500 hover:bg-blue-600 h-9 text-sm">{couponLoading ? 'Saving…' : editingId ? 'Update' : 'Create'}</Button>
              </div>
            </div>
          </form>
        </div>

        <div className={`${cardCls} p-5`}>
          <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search coupons…" /></div>
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filtered.map((c) => {
              const cp = partnerMap[c.partner_id];
              return (
                <div key={c.id} className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.04]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg shrink-0 overflow-hidden bg-white/[0.04] flex items-center justify-center border border-white/[0.06]">
                        {(c.brand_logo || cp?.logo) ? <img src={resolveImageUrl(c.brand_logo || cp?.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-3.5 w-3.5 text-white/20" />}
                      </div>
                      <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{c.title}</p><p className="text-[11px] text-white/25 truncate">{c.coupon_code} • {cp?.business_name || c.partner_id}</p></div>
                    </div>
                    <span className={badgeCls(c.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-white/30')}>{c.is_active ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <p className="text-[11px] text-white/20 mt-2 tabular-nums">{c.points_cost} pts • {c.redeemed_count}/{c.total_quantity} used • exp {new Date(c.expiry_date).toLocaleDateString('en-IN')}</p>
                  <div className="mt-2.5 flex gap-1.5">
                    <button onClick={() => startEdit(c)} className="h-6 px-2 rounded-md bg-white/[0.04] text-white/40 text-[10px] hover:bg-white/[0.08] transition-colors">Edit</button>
                    <button onClick={() => toggleCoupon(c)} className="h-6 px-2 rounded-md bg-white/[0.04] text-white/40 text-[10px] hover:bg-white/[0.08] transition-colors">{c.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => deleteCoupon(c.id)} className="h-6 px-2 rounded-md bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20 transition-colors">Delete</button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-white/20 text-center py-8">No coupons</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// REWARDS
// ═══════════════════════════════════════════════════════════════
const RewardsSection = ({ redemptions, userMap, coupons }) => {
  const [search, setSearch] = useState('');
  const couponMap = Object.fromEntries(coupons.map((c) => [c.id, c]));

  const filtered = useMemo(() => {
    if (!search.trim()) return redemptions;
    const q = search.toLowerCase();
    return redemptions.filter((r) => (r.coupon_code || '').toLowerCase().includes(q) || (userMap[r.user_id]?.username || '').toLowerCase().includes(q));
  }, [redemptions, search, userMap]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-heading">Rewards & Redemptions <span className="text-white/30 text-lg">({redemptions.length})</span></h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Redemptions" value={redemptions.length} icon={Gift} color="text-pink-400" />
        <StatCard label="Points Spent" value={redemptions.reduce((s, r) => s + (r.points_deducted || 0), 0).toLocaleString()} icon={Coins} color="text-orange-400" />
        <StatCard label="Unique Users" value={new Set(redemptions.map((r) => r.user_id)).size} icon={Users} />
        <StatCard label="Unique Coupons" value={new Set(redemptions.map((r) => r.coupon_id)).size} icon={FileText} color="text-purple-400" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by coupon code, username…" />

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">User</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Coupon</th>
                <th className="text-right text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Points</th>
                <th className="text-left text-[11px] text-white/30 uppercase tracking-wider px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const u = userMap[r.user_id];
                const c = couponMap[r.coupon_id];
                return (
                  <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AppAvatar avatar={u?.avatar} username={u?.username} className="h-6 w-6" />
                        <span className="text-xs text-white/70">{u?.username || r.user_id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white font-medium">{c?.title || r.coupon_code}</p>
                      <p className="text-[11px] text-white/20">{r.coupon_code}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-orange-400 tabular-nums">-{r.points_deducted}</td>
                    <td className="px-4 py-3 text-xs text-white/30 tabular-nums">{new Date(r.redeemed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-white/20 text-sm py-10">No redemptions found</p>}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════
const ActivitySection = ({ activityPurchases, activityRedemptions, userMap, partnerMap }) => {
  const feed = useMemo(() => {
    const items = [];
    activityPurchases.forEach((p) => {
      const u = userMap[p.user_id];
      const partner = partnerMap[p.partner_id];
      items.push({
        id: p.id,
        type: p.status === 'FLAGGED' ? 'flag' : 'purchase',
        time: p.timestamp,
        text: p.status === 'FLAGGED'
          ? `Order #${p.order_id} was flagged at ${partner?.business_name || p.brand}`
          : `${u?.username || 'User'} placed order ₹${p.amount} at ${partner?.business_name || p.brand}`,
        status: p.status,
        avatar: u?.avatar,
        username: u?.username,
      });
    });
    activityRedemptions.forEach((r) => {
      const u = userMap[r.user_id];
      items.push({
        id: r.id,
        type: 'redemption',
        time: r.redeemed_at,
        text: `${u?.username || 'User'} redeemed ${r.coupon_code} for ${r.points_deducted} pts`,
        avatar: u?.avatar,
        username: u?.username,
      });
    });
    items.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    return items.slice(0, 100);
  }, [activityPurchases, activityRedemptions, userMap, partnerMap]);

  const flaggedItems = feed.filter((f) => f.type === 'flag');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-heading">System Activity</h1>

      {flaggedItems.length > 0 && (
        <div className={`${cardCls} p-5`}>
          <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4" /> Flagged Orders ({flaggedItems.length})
          </h3>
          <div className="space-y-2">
            {flaggedItems.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                <p className="text-sm text-white/70 flex-1">{f.text}</p>
                <span className="text-[11px] text-white/20 tabular-nums">{new Date(f.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${cardCls} p-5`}>
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Live Feed</h3>
        <div className="space-y-0">
          {feed.map((f) => (
            <div key={f.id} className="flex items-start gap-3 py-3 border-b border-white/[0.03] last:border-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                f.type === 'flag' ? 'bg-orange-500/10' : f.type === 'redemption' ? 'bg-pink-500/10' : 'bg-blue-500/10'
              }`}>
                {f.type === 'flag' ? <Flag className="h-3.5 w-3.5 text-orange-400" /> : f.type === 'redemption' ? <Gift className="h-3.5 w-3.5 text-pink-400" /> : <ShoppingBag className="h-3.5 w-3.5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70">{f.text}</p>
                <p className="text-[11px] text-white/20 mt-0.5 tabular-nums">{new Date(f.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {f.status && <span className={badgeCls(STATUS_COLORS[f.status] || '')}>{f.status}</span>}
            </div>
          ))}
          {feed.length === 0 && <p className="text-sm text-white/20 text-center py-8">No recent activity</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
