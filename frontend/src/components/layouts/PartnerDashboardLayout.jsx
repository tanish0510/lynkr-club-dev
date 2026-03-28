import React, { useState, useEffect, Suspense } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import BrandLoader from '@/components/BrandLoader';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Gift,
  FileQuestion,
  Megaphone,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Building2,
  Package,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { resolveImageUrl } from '@/utils/api';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { applyPaletteTheme } from '@/utils/avatarTheme';

const BOTTOM_NAV = [
  { to: '/app/partner', icon: LayoutDashboard, label: 'Home' },
  { to: '/app/partner/orders', icon: Receipt, label: 'Orders' },
  { to: '/app/partner/catalog', icon: Package, label: 'Catalog' },
  { to: '/app/partner/growth', icon: TrendingUp, label: 'Insights' },
  { to: '/app/partner/coupon-requests', icon: FileQuestion, label: 'Coupons' },
  { to: '/app/partner/settings', icon: Settings, label: 'Settings' },
];

const MENU_NAV = [
  { path: '/app/partner', icon: LayoutDashboard, label: 'Overview' },
  { path: '/app/partner/catalog', icon: Package, label: 'Catalog' },
  { path: '/app/partner/orders', icon: Receipt, label: 'Orders' },
  { path: '/app/partner/growth', icon: TrendingUp, label: 'Insights' },
  { path: '/app/partner/coupon-requests', icon: FileQuestion, label: 'Coupons' },
  { path: '/app/partner/rewards', icon: Gift, label: 'Rewards' },
  { path: '/app/partner/campaigns', icon: Megaphone, label: 'Campaigns' },
  { path: '/app/partner/customers', icon: Users, label: 'Customers' },
  { path: '/app/partner/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/app/partner/settings', icon: Settings, label: 'Settings' },
];

const DESKTOP_NAV = [
  { to: '/app/partner', label: 'Home' },
  { to: '/app/partner/orders', label: 'Orders' },
  { to: '/app/partner/catalog', label: 'Catalog' },
  { to: '/app/partner/growth', label: 'Insights' },
  { to: '/app/partner/coupon-requests', label: 'Coupons' },
  { to: '/app/partner/rewards', label: 'Rewards' },
];

const desktopLinkClass = ({ isActive }) =>
  `text-[15px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`;

const PartnerDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [partnerLogo, setPartnerLogo] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'PARTNER') return;
    if (user.partner_logo) {
      setPartnerLogo(user.partner_logo);
    } else {
      api.get('/partner/settings').then((res) => {
        const logo = res.data?.partner?.logo;
        if (logo) setPartnerLogo(logo);
        const palette = res.data?.partner?.extracted_palette;
        if (palette && palette.length > 0) applyPaletteTheme(palette);
      }).catch(() => {});
    }
  }, [user]);

  if (!user || user.role !== 'PARTNER') return <BrandLoader label="Loading partner area..." />;

  const handleLogout = () => {
    logout();
    navigate('/partners');
  };

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/app/partner') return location.pathname === '/app/partner';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 lg:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl shrink-0 touch-manipulation"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <button
              type="button"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
              onClick={() => navigate('/app/partner')}
            >
              {partnerLogo ? (
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-border shrink-0">
                  <img src={resolveImageUrl(partnerLogo)} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <Building2 className="w-5 h-5 text-primary" />
              )}
              <span className="font-heading font-bold text-base lg:text-lg">Lynkr Partner</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex items-center gap-5 mr-2">
              {DESKTOP_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/app/partner'} className={desktopLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={() => navigate('/app/partner/settings')}
              className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted transition-all active:scale-95 overflow-hidden"
              aria-label="Settings"
            >
              {partnerLogo ? (
                <img src={resolveImageUrl(partnerLogo)} alt="" className="w-full h-full object-cover" />
              ) : (
                <Settings className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── SLIDE-OUT MENU ── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] border-r border-border bg-background p-0 flex flex-col">
          <SheetHeader className="p-5 border-b border-border text-left shrink-0">
            <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
          </SheetHeader>

          <div className="px-4 py-3 border-b border-border">
            <div className="px-3 py-2.5 rounded-xl bg-muted border border-border">
              <p className="text-[11px] text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <nav className="flex flex-col">
              {MENU_NAV.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => goTo(item.path)}
                  className={cn(
                    'flex items-center gap-3.5 px-5 py-3.5 min-h-[48px] text-left text-[15px] font-medium transition-colors w-full touch-manipulation',
                    isActive(item.path)
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 shrink-0', isActive(item.path) ? 'text-primary' : 'text-muted-foreground')} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="border-t border-border pt-2 pb-2 mt-2">
              <p className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick access</p>
              <button
                type="button"
                onClick={() => goTo('/app/partner/rewards')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Ticket className="h-5 w-5 shrink-0 text-muted-foreground" />
                Reward campaigns
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/partner/customers')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
                Customer insights
              </button>
            </div>
          </div>

          <div className="shrink-0 border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl"
              onClick={() => { setMenuOpen(false); handleLogout(); }}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── PAGE CONTENT ── */}
      <main className="pb-24 lg:pb-8 min-h-[50vh]">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          <Suspense fallback={<BrandLoader label="Loading..." />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-6xl grid-cols-6 px-2 pt-1">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app/partner'}
              className={({ isActive }) =>
                `group relative flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-all duration-200 touch-manipulation ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-0 h-0.5 w-7 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-primary opacity-100' : 'opacity-0'
                    }`}
                  />
                  <item.icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default PartnerDashboardLayout;
