import React, { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  House,
  ShoppingBag,
  Gift,
  Trophy,
  Sparkles,
  UserRound,
  LogOut,
  Menu,
  Ticket,
  LayoutDashboard,
  History,
} from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Logo from '@/components/Logo';
import AppAvatar from '@/components/Avatar';
import ThemeToggle from '@/components/ui/ThemeToggle';

const bottomNavItems = [
  { to: '/app/home', icon: House, label: 'Home' },
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/purchases', icon: ShoppingBag, label: 'Purchases' },
  { to: '/app/rewards', icon: Gift, label: 'Rewards' },
  { to: '/app/profile', icon: UserRound, label: 'Profile' },
];

const sideMenuItems = [
  { to: '/app/home', icon: House, label: 'Home' },
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/purchases', icon: ShoppingBag, label: 'Purchases' },
  { to: '/app/rewards', icon: Gift, label: 'Rewards' },
  { to: '/app/community', icon: Trophy, label: 'Community' },
  { to: '/app/chat', icon: Sparkles, label: 'AI' },
  { to: '/app/profile', icon: UserRound, label: 'Profile' },
];

const linkClassName = ({ isActive }) =>
  `text-[15px] font-semibold transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const goTo = (path) => { navigate(path); setMenuOpen(false); };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <button type="button" className="transition-opacity hover:opacity-90" onClick={() => navigate('/app/home')}>
              <Logo className="h-9 w-28 lg:h-10 lg:w-32" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex items-center gap-5 mr-2">
              {sideMenuItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClassName}>
                  <span id={`desktop-nav-${item.label.toLowerCase()}`}>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={() => navigate('/app/profile')}
              className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary/40 transition-all active:scale-95 touch-manipulation"
              aria-label="Settings"
            >
              <AppAvatar
                avatar={user?.avatar}
                profilePhoto={user?.profile_photo}
                username={user?.username}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] border-r border-border bg-background p-0 flex flex-col">
          <SheetHeader className="p-5 border-b border-border text-left shrink-0">
            <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="flex flex-col">
              {sideMenuItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => goTo(item.to)}
                  className="flex items-center gap-3.5 px-5 py-3.5 min-h-[48px] text-left text-[15px] font-medium text-foreground hover:bg-muted active:bg-muted transition-colors w-full touch-manipulation"
                >
                  <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="border-t border-border pt-2 pb-2 mt-2">
              <p className="px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">My activity</p>
              <button
                type="button"
                onClick={() => goTo('/app/gift-cards')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Gift className="h-5 w-5 shrink-0 text-muted-foreground" />
                Gift Cards
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/dynamic-coupons')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Sparkles className="h-5 w-5 shrink-0 text-muted-foreground" />
                Dynamic Coupons
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/my-activity')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Ticket className="h-5 w-5 shrink-0 text-muted-foreground" />
                My rewards redeemed
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/purchases')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ShoppingBag className="h-5 w-5 shrink-0 text-muted-foreground" />
                My purchases
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/activity-timeline')}
                className="flex items-center gap-3.5 w-full px-5 py-3.5 text-left text-[15px] font-medium text-foreground hover:bg-muted transition-colors"
              >
                <History className="h-5 w-5 shrink-0 text-muted-foreground" />
                Activity timeline
              </button>
            </div>
          </div>
          <div className="shrink-0 border-t border-border p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl" onClick={() => { setMenuOpen(false); handleLogout(); }}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="pb-24 lg:pb-8 min-h-[50vh]">
        <div key={location.pathname} className="animate-route-enter">
          <Suspense
            fallback={
              <div className="min-h-[40vh] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-auto border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-lg grid-cols-5 px-3 pt-1.5">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app/home'}
              className={({ isActive }) =>
                `group relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold tracking-wide transition-all duration-200 touch-manipulation ${
                  isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-x-1.5 inset-y-0.5 rounded-2xl bg-primary/10 transition-all duration-300" />
                  )}
                  <item.icon className={`relative z-10 h-5 w-5 transition-all duration-200 ${isActive ? 'scale-105' : ''}`} />
                  <span className="relative z-10" id={`mobile-nav-${item.label.toLowerCase()}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <PWAInstallPrompt />
    </div>
  );
};

export default AppLayout;
