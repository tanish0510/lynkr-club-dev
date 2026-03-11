import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PARTNER_NAV = [
  { path: '/partner/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/partner/dashboard/growth', icon: TrendingUp, label: 'Growth Dashboard' },
  { path: '/partner/dashboard/orders', icon: Receipt, label: 'Transactions' },
  { path: '/partner/dashboard/coupon-requests', icon: FileQuestion, label: 'Coupon Requests' },
  { path: '/partner/dashboard/rewards', icon: Gift, label: 'Rewards' },
  { path: '/partner/dashboard/campaigns', icon: Megaphone, label: 'Campaigns' },
  { path: '/partner/dashboard/customers', icon: Users, label: 'Customers' },
  { path: '/partner/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/partner/dashboard/settings', icon: Settings, label: 'Settings' },
];

const PartnerDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'PARTNER') return null;

  const handleLogout = () => {
    logout();
    navigate('/partner');
  };

  const isActive = (path) => {
    if (path === '/partner/dashboard') return location.pathname === '/partner/dashboard';
    return location.pathname.startsWith(path);
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {PARTNER_NAV.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className={cn(
            'justify-start min-h-11 rounded-xl font-medium',
            isActive(item.path)
              ? 'bg-primary/15 text-primary hover:bg-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          )}
          onClick={() => {
            navigate(item.path);
            setSidebarOpen(false);
          }}
        >
          <item.icon className="mr-3 w-5 h-5 shrink-0" />
          {item.label}
        </Button>
      ))}
      <div className="mt-auto pt-4 border-t border-white/5">
        <Button
          variant="ghost"
          className="w-full justify-start min-h-11 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 w-5 h-5 shrink-0" />
          Log out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-card shadow-sm">
        <div className="p-4 border-b border-white/5">
          <button
            onClick={() => navigate('/partner/dashboard')}
            className="flex items-center gap-2 text-foreground hover:opacity-90"
          >
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">Lynkr Partner</span>
          </button>
        </div>
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-white/10 shadow-xl transition-transform lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Lynkr Partner</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b border-white/5 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerDashboardLayout;
