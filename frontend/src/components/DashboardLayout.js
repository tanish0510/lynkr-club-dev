import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift, Settings, LogOut, LayoutDashboard, ShoppingBag, Users, Trophy } from 'lucide-react';
import Logo from '@/components/Logo';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // User navigation items
  const userNavItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/purchases', icon: ShoppingBag, label: 'Purchases' },
    { path: '/rewards', icon: Gift, label: 'Rewards' },
    { path: '/community', icon: Trophy, label: 'Community' },
    { path: '/insights', icon: Sparkles, label: 'AI Insights' },
    { path: '/settings', icon: Settings, label: 'Profile' },
  ];

  // Partner navigation items
  const partnerNavItems = [
    { path: '/partner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/partner/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { path: '/admin', icon: Users, label: 'Admin Panel' },
  ];

  const navItems = user.role === 'USER' ? userNavItems : 
                   user.role === 'PARTNER' ? partnerNavItems : 
                   adminNavItems;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header data-testid="common-header" className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div 
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate(user.role === 'USER' ? '/dashboard' : user.role === 'PARTNER' ? '/partner/dashboard' : '/admin')}
            >
              <Logo className="h-10 w-32" />
            </div>
            
            <nav className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  variant="ghost"
                  className={`hover:bg-white/5 rounded-full min-h-11 ${
                    isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-2 w-4 h-4" />
                  {item.label}
                </Button>
              ))}
              
              <Button
                data-testid="logout-button"
                variant="ghost"
                className="hover:bg-white/5 rounded-full min-h-11"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer data-testid="common-footer" className="hidden md:block border-t border-white/5 bg-background/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold font-heading mb-4">Lynkr</h3>
              <p className="text-sm text-muted-foreground">
                Premium mailbox-first rewards platform. Shop smart, earn automatically.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Rewards</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Partners</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Lynkr.club. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;