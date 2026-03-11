import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileQuestion,
  Gift,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Shield,
  FileText,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { path: '/admin', hash: null, icon: LayoutDashboard, label: 'Overview' },
  { path: '/admin', hash: 'users', icon: Users, label: 'Users' },
  { path: '/admin', hash: 'partners', icon: Building2, label: 'Partners' },
  { path: '/admin/coupon-requests', hash: null, icon: FileQuestion, label: 'Coupon Requests' },
  { path: '/admin', hash: 'coupons', icon: Gift, label: 'Rewards' },
  { path: '/admin', hash: 'purchases', icon: Receipt, label: 'Transactions' },
  { path: '/admin/analytics', hash: null, icon: BarChart3, label: 'Analytics' },
  { path: '/admin/settings', hash: null, icon: Settings, label: 'System Settings' },
  { path: '/admin/partner-resources', hash: null, icon: FileText, label: 'Partner Resources' },
  { path: '/admin/partner-pitch', hash: null, icon: Presentation, label: 'Partner Pitch Deck' },
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'ADMIN') return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (item) => {
    if (item.path !== '/admin') return location.pathname === item.path;
    if (item.hash === null) return location.pathname === '/admin' && !location.hash;
    return location.pathname === '/admin' && location.hash === `#${item.hash}`;
  };

  const goTo = (item) => {
    setSidebarOpen(false);
    if (item.hash) navigate(`${item.path}#${item.hash}`);
    else navigate(item.path);
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-0.5 p-3">
      {ADMIN_NAV.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          className={cn(
            'justify-start min-h-11 rounded-xl font-medium',
            isActive(item) ? 'bg-primary/15 text-primary hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          )}
          onClick={() => goTo(item)}
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-white/10 bg-card shadow-sm">
        <div className="p-4 border-b border-white/5">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-foreground hover:opacity-90">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">Lynkr Admin</span>
          </button>
        </div>
        <NavContent />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-white/10 shadow-xl transition-transform lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Lynkr Admin</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><ChevronLeft className="w-5 h-5" /></Button>
        </div>
        <NavContent />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b border-white/5 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </Button>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
