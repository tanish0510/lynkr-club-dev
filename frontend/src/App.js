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
import AppGate from '@/components/AppGate';
import LandingWithLoader from '@/components/LandingWithLoader';
import BrandLoader from '@/components/BrandLoader';
import DocumentHead from '@/components/DocumentHead';
import CookieBanner from '@/components/CookieBanner';
import '@/index.css';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const EnhancedAuthPage = lazy(() => import('@/pages/EnhancedAuthPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PurchasesPage = lazy(() => import('@/pages/PurchasesPage'));
const AIInsightsPage = lazy(() => import('@/pages/AIInsightsPage'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage'));
const MyActivityPage = lazy(() => import('@/pages/MyActivityPage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const InvitePage = lazy(() => import('@/pages/InvitePage'));
const PointsHistoryPage = lazy(() => import('@/pages/PointsHistoryPage'));
const RewardsHistoryPage = lazy(() => import('@/pages/RewardsHistoryPage'));
const InsightsPage = lazy(() => import('@/pages/InsightsPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PartnerCatalogPage = lazy(() => import('@/pages/partner/PartnerCatalogPage'));
const PublicCatalogPage = lazy(() => import('@/pages/PublicCatalogPage'));
const HomeHub = lazy(() => import('@/components/home/HomeHub'));
const CatalogPage = lazy(() => import('@/pages/CatalogPage'));
const DynamicCouponsPage = lazy(() => import('@/pages/DynamicCouponsPage'));
const GiftCardsPage = lazy(() => import('@/pages/GiftCardsPage'));
const AdminDynamicCoupons = lazy(() => import('@/pages/AdminDynamicCoupons'));
const ActivityTimelinePage = lazy(() => import('@/pages/ActivityTimelinePage'));

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isPartnerRoute = pathname.startsWith('/app/partner');
  const isAdminRoute =
    pathname.startsWith('/app/admin') ||
    pathname.startsWith('/partner-demo') ||
    pathname.startsWith('/partner-demo-dashboard');

  const loadingEl = (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
      <BrandLoader label="Preparing your account..." />
    </div>
  );

  if (loading) return loadingEl;

  if (!user) {
    const to = isPartnerRoute ? '/app/partner/login' : isAdminRoute ? '/app/admin' : '/app/login';
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
          <BrandLoader label="Redirecting to login..." />
        </div>
        <Navigate to={to} replace />
      </>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const to =
      user.role === 'USER' ? '/app/home'
        : user.role === 'PARTNER' ? '/app/partner'
          : user.role === 'ADMIN' ? '/app/admin'
            : '/';
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
          <BrandLoader label="Redirecting..." />
        </div>
        <Navigate to={to} replace />
      </>
    );
  }

  return children;
};

const LoadingScreen = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
    <BrandLoader label="Loading page..." />
  </div>
);

function AdminGate() {
  const { user, loading, logout } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
        <BrandLoader label="Loading..." />
      </div>
    );
  }
  if (!user) return <AdminLoginPage />;
  if (user.role !== 'ADMIN') {
    logout();
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
          <BrandLoader label="Redirecting..." />
        </div>
        <Navigate to="/" replace />
      </>
    );
  }
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

function AdminPanelDirect() {
  const { user, loading, logout } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background" aria-busy="true">
        <BrandLoader label="Loading..." />
      </div>
    );
  }
  if (!user) return <AdminLoginPage />;
  if (user.role !== 'ADMIN') {
    logout();
    return <Navigate to="/" replace />;
  }
  return <AdminPanel />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <DocumentHead />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Marketing website: loading animation then landing (no welcome card on /) */}
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<LandingWithLoader><LandingPage /></LandingWithLoader>} />
          </Route>

          <Route path="/auth" element={<Navigate to="/app/login" replace />} />

          {/* Partner marketing: canonical /partners */}
          <Route path="/partners" element={<PartnerLanding />} />
          <Route path="/partners/:city/:businessType" element={<PartnerSEOPage />} />
          <Route path="/partner" element={<Navigate to="/partners" replace />} />
          <Route path="/partner-program" element={<Navigate to="/partners" replace />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/catalog/:slug" element={<PublicCatalogPage />} />

          {/* App routes: define more specific /app/* before generic /app so partner login stays under /app */}
          <Route path="/app/login" element={<EnhancedAuthPage forcedMode="login" />} />
          <Route path="/app/signup" element={<EnhancedAuthPage forcedMode="signup" />} />
          <Route path="/app/partner/login" element={<PartnerLoginPage />} />
          <Route path="/app/partner/first-login" element={<PartnerFirstLoginPassword />} />
          <Route path="/partner-first-login" element={<Navigate to="/app/partner/first-login" replace />} />
          <Route path="/partners/login" element={<Navigate to="/app/partner/login" replace />} />
          <Route path="/partner/login" element={<Navigate to="/app/partner/login" replace />} />
          <Route path="/login" element={<Navigate to="/app/login" replace />} />
          <Route path="/signup" element={<Navigate to="/app/signup" replace />} />

          {/* Application: /app (user dashboard etc.) */}
          <Route
            path="/app"
            element={
              <AppGate>
                <ProtectedRoute allowedRoles={['USER']}>
                  <AppLayout />
                </ProtectedRoute>
              </AppGate>
            }
          >
            <Route index element={<Navigate to="/app/home" replace />} />
            <Route path="home" element={<HomeHub />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="my-activity" element={<MyActivityPage />} />
            <Route path="ai" element={<AIInsightsPage />} />
            <Route path="profile" element={<SettingsPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="invite" element={<InvitePage />} />
            <Route path="points" element={<PointsHistoryPage />} />
            <Route path="rewards/history" element={<RewardsHistoryPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="gift-cards" element={<GiftCardsPage />} />
            <Route path="dynamic-coupons" element={<DynamicCouponsPage />} />
            <Route path="activity-timeline" element={<ActivityTimelinePage />} />
          </Route>

          <Route
            path="/app/partner"
            element={
              <ProtectedRoute allowedRoles={['PARTNER']}>
                <PartnerDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EnhancedPartnerDashboard />} />
            <Route path="catalog" element={<PartnerCatalogPage />} />
            <Route path="growth" element={<PartnerGrowthDashboard />} />
            <Route path="orders" element={<PartnerOrdersPage />} />
            <Route path="rewards" element={<PartnerRewardsPage />} />
            <Route path="campaigns" element={<PartnerCampaignsPage />} />
            <Route path="coupon-requests" element={<PartnerCouponRequestsPage />} />
            <Route path="customers" element={<PartnerCustomersPage />} />
            <Route path="analytics" element={<PartnerAnalyticsPage />} />
            <Route path="settings" element={<PartnerSettingsPage />} />
          </Route>

          <Route path="/app/admin" element={<AdminPanelDirect />} />
          <Route path="/app/admin/*" element={<AdminGate />}>
            <Route path="coupon-requests" element={<AdminCouponRequests />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="partner-resources" element={<AdminPartnerResources />} />
            <Route path="partner-pitch" element={<AdminPartnerPitchDeck />} />
            <Route path="dynamic-coupons" element={<AdminDynamicCoupons />} />
          </Route>

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/app/home" replace />} />
          <Route path="/purchases" element={<Navigate to="/app/purchases" replace />} />
          <Route path="/rewards" element={<Navigate to="/app/rewards" replace />} />
          <Route path="/insights" element={<Navigate to="/app/ai" replace />} />
          <Route path="/settings" element={<Navigate to="/app/profile" replace />} />
          <Route path="/community" element={<Navigate to="/app/community" replace />} />
          <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
          <Route path="/partner/dashboard" element={<Navigate to="/app/partner" replace />} />
          <Route path="/partner/dashboard/*" element={<Navigate to="/app/partner" replace />} />
          <Route path="/partner-dashboard" element={<Navigate to="/app/partner" replace />} />
          <Route path="/partner-dashboard/*" element={<Navigate to="/app/partner" replace />} />
          <Route path="/partner-orders" element={<Navigate to="/app/partner/orders" replace />} />
          <Route path="/admin" element={<Navigate to="/app/admin" replace />} />
          <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />

          <Route path="/admin/partner-pitch" element={<Navigate to="/app/admin/partner-pitch" replace />} />
          <Route path="/partner-pitch" element={<AdminPartnerPitchDeck />} />
          <Route path="/partner-demo" element={<AdminPartnerDemoMode />} />
          <Route path="/partner-demo-dashboard" element={<AdminPartnerDemoDashboard />} />
          <Route path="/partner-demo-experience" element={<PartnerDemoExperience />} />

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
        <div className="min-h-screen bg-background">
          <AppRoutes />
          <Toaster position="top-right" richColors />
          <CookieBanner policyHref="/terms" policyLabel="cookie policy" />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;