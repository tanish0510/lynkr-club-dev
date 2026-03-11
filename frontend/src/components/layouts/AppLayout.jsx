import React, { useState } from 'react';
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
} from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Logo from '@/components/Logo';

const navItems = [
  { to: '/app/dashboard', icon: House, label: 'Home' },
  { to: '/app/purchases', icon: ShoppingBag, label: 'Purchases' },
  { to: '/app/rewards', icon: Gift, label: 'Rewards' },
  { to: '/app/community', icon: Trophy, label: 'Community' },
  { to: '/app/ai', icon: Sparkles, label: 'AI' },
  { to: '/app/profile', icon: UserRound, label: 'Profile' },
];

const linkClassName = ({ isActive }) =>
  `transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`;

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 lg:h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0 lg:h-11 lg:w-11"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 lg:h-5 lg:w-5" />
            </Button>
            <button
              type="button"
              className="transition-opacity hover:opacity-90"
              onClick={() => navigate('/app/dashboard')}
            >
              <Logo className="h-9 w-28 lg:h-10 lg:w-32" />
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-5">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                <span id={`desktop-nav-${item.label.toLowerCase()}`}>{item.label}</span>
              </NavLink>
            ))}
            <Button variant="ghost" className="h-11 rounded-full px-4" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] border-r border-white/10 bg-background p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-white/10 text-left shrink-0">
            <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-2">
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => goTo(item.to)}
                  className="flex items-center gap-3 px-4 py-3 text-left text-foreground hover:bg-white/5 transition-colors"
                >
                  <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="border-t border-white/10 pt-2 pb-2 mt-2">
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">My activity</p>
              <button
                type="button"
                onClick={() => goTo('/app/my-activity')}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-foreground hover:bg-white/5 transition-colors"
              >
                <Ticket className="h-5 w-5 shrink-0 text-muted-foreground" />
                My rewards redeemed
              </button>
              <button
                type="button"
                onClick={() => goTo('/app/purchases')}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-foreground hover:bg-white/5 transition-colors"
              >
                <ShoppingBag className="h-5 w-5 shrink-0 text-muted-foreground" />
                My purchases
              </button>
            </div>
          </div>
          <div className="shrink-0 border-t border-white/10 p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl" onClick={() => { setMenuOpen(false); handleLogout(); }}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="pb-24 lg:pb-8">
        <div key={location.pathname} className="animate-route-enter">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-auto border-t border-white/10 bg-background/95 backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto grid max-w-6xl grid-cols-6 px-2 pt-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `group relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[11px] transition-all duration-200 ${
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
                  <span id={`mobile-nav-${item.label.toLowerCase()}`}>{item.label}</span>
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
