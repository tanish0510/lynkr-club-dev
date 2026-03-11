import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import PartnerLanding from '@/pages/PartnerLanding';
import PartnerSEOPage from '@/pages/PartnerSEOPage';
import PartnerLoginPage from '@/pages/PartnerLoginPage';
import EnhancedPartnerDashboard from '@/pages/EnhancedPartnerDashboard';
import PartnerOrdersPage from '@/pages/PartnerOrdersPage';
import PartnerGrowthDashboard from '@/pages/partner/PartnerGrowthDashboard';
import PartnerRewardsPage from '@/pages/partner/PartnerRewardsPage';
import PartnerCampaignsPage from '@/pages/partner/PartnerCampaignsPage';
import PartnerCouponRequestsPage from '@/pages/partner/PartnerCouponRequestsPage';
import PartnerCustomersPage from '@/pages/partner/PartnerCustomersPage';
import PartnerAnalyticsPage from '@/pages/partner/PartnerAnalyticsPage';
import PartnerSettingsPage from '@/pages/partner/PartnerSettingsPage';
import PartnerFirstLoginPassword from '@/pages/PartnerFirstLoginPassword';
import PartnerDashboardLayout from '@/components/layouts/PartnerDashboardLayout';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminPanel from '@/pages/AdminPanel';
import AdminCouponRequests from '@/pages/admin/AdminCouponRequests';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminPartnerResources from '@/pages/admin/AdminPartnerResources';
import AdminPartnerPitchDeck from '@/pages/admin/AdminPartnerPitchDeck';
import AdminPartnerDemoMode from '@/pages/admin/AdminPartnerDemoMode';
import AdminPartnerDemoDashboard from '@/pages/admin/AdminPartnerDemoDashboard';
import PartnerDemoExperience from '@/pages/admin/PartnerDemoExperience';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import AIChatbot from '@/components/AIChatbot';
import MarketingLayout from '@/components/layouts/MarketingLayout';
import AppLayout from '@/components/layouts/AppLayout';
import BrandLoader from '@/components/BrandLoader';
import DocumentHead from '@/components/DocumentHead';
import '@/index.css';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const EnhancedAuthPage = lazy(() => import('@/pages/EnhancedAuthPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const UserDashboard = lazy(() => import('@/pages/UserDashboard'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage'));
const MyActivityPage = lazy(() => import('@/pages/MyActivityPage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isPartnerRoute = pathname.startsWith('/partner/dashboard') || pathname.startsWith('/partner-dashboard');
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/partner-demo') ||
    pathname.startsWith('/partner-demo-dashboard');

  if (loading) {
    return <BrandLoader label="Preparing your account..." />;
  }

  if (!user) {
    if (isPartnerRoute) return <Navigate to="/partner/login" replace />;
    if (isAdminRoute) return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === 'USER') return <Navigate to="/app/dashboard" replace />;
    if (user.role === 'PARTNER') return <Navigate to="/partner/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

const LoadingScreen = () => <BrandLoader label="Loading page..." />;

function AdminGate() {
  const { user, loading, logout } = useAuth();
  if (loading) return <BrandLoader label="Loading..." />;
  if (!user) return <AdminLoginPage />;
  if (user.role !== 'ADMIN') {
    logout();
    return <Navigate to="/" replace />;
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <DocumentHead />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<EnhancedAuthPage forcedMode="login" />} />
            <Route path="/signup" element={<EnhancedAuthPage forcedMode="signup" />} />
          </Route>

          {/* Legacy auth route */}
          <Route path="/auth" element={<Navigate to="/login" replace />} />

          {/* Partner public routes */}
          <Route path="/partner" element={<PartnerLanding />} />
          <Route path="/partners" element={<PartnerLanding />} />
          <Route path="/partners/:city/:businessType" element={<PartnerSEOPage />} />
          <Route path="/partner/login" element={<PartnerLoginPage />} />
          <Route path="/partners/login" element={<PartnerLoginPage />} />
          <Route path="/partner-program" element={<Navigate to="/partner" replace />} />
          <Route path="/partner-first-login" element={<PartnerFirstLoginPassword />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* User app routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="my-activity" element={<MyActivityPage />} />
            <Route path="ai" element={<AIInsightsPage />} />
            <Route path="profile" element={<SettingsPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy user paths */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/purchases" element={<Navigate to="/app/purchases" replace />} />
          <Route path="/rewards" element={<Navigate to="/app/rewards" replace />} />
          <Route path="/insights" element={<Navigate to="/app/ai" replace />} />
          <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
          <Route path="/community" element={<Navigate to="/app/community" replace />} />
          <Route path="/chat" element={<Navigate to="/app/chat" replace />} />

          {/* Partner dashboard at /partner/dashboard */}
          <Route
            path="/partner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PARTNER']}>
                <PartnerDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EnhancedPartnerDashboard />} />
            <Route path="growth" element={<PartnerGrowthDashboard />} />
            <Route path="orders" element={<PartnerOrdersPage />} />
            <Route path="rewards" element={<PartnerRewardsPage />} />
            <Route path="campaigns" element={<PartnerCampaignsPage />} />
            <Route path="coupon-requests" element={<PartnerCouponRequestsPage />} />
            <Route path="customers" element={<PartnerCustomersPage />} />
            <Route path="analytics" element={<PartnerAnalyticsPage />} />
            <Route path="settings" element={<PartnerSettingsPage />} />
          </Route>
          <Route path="/partner-dashboard" element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="/partner-dashboard/*" element={<Navigate to="/partner/dashboard" replace />} />
          <Route path="/partner-orders" element={<Navigate to="/partner/dashboard/orders" replace />} />

          <Route
            path="/admin/partner-pitch"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPartnerPitchDeck />
              </ProtectedRoute>
            }
          />
          <Route path="/partner-pitch" element={<AdminPartnerPitchDeck />} />
          <Route path="/partner-demo" element={<AdminPartnerDemoMode />} />
          <Route path="/partner-demo-dashboard" element={<AdminPartnerDemoDashboard />} />
          <Route path="/partner-demo-experience" element={<PartnerDemoExperience />} />

          {/* Admin: login or dashboard with sidebar */}
          <Route path="/admin" element={<AdminGate />}>
            <Route index element={<AdminPanel />} />
            <Route path="coupon-requests" element={<AdminCouponRequests />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="partner-resources" element={<AdminPartnerResources />} />
            <Route path="partner-pitch-deck" element={<Navigate to="/admin/partner-pitch" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      {/* AI Chatbot - Only for authenticated users */}
      {user && user.role === 'USER' && <AIChatbot />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="dark">
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;