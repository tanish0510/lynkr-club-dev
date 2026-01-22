import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/pages/LandingPage';
import EnhancedAuthPage from '@/pages/EnhancedAuthPage';
import OnboardingPage from '@/pages/OnboardingPage';
import UserDashboard from '@/pages/UserDashboard';
import AIInsightsPage from '@/pages/AIInsightsPage';
import RewardsPage from '@/pages/RewardsPage';
import SettingsPage from '@/pages/SettingsPage';
import ChatPage from '@/pages/ChatPage';
import PartnerLanding from '@/pages/PartnerLanding';
import PartnerDashboard from '@/pages/PartnerDashboard';
import AdminPanel from '@/pages/AdminPanel';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import AIChatbot from '@/components/AIChatbot';
import '@/index.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<EnhancedAuthPage />} />
        <Route path="/partner" element={<PartnerLanding />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* User Routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <AIInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <RewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['USER']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Partner Routes */}
        <Route
          path="/partner-dashboard"
          element={
            <ProtectedRoute allowedRoles={['PARTNER']}>
              <PartnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
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