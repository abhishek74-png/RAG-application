import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthProvider.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { useAuth } from './hooks/useAuth.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { Loader2 } from 'lucide-react';

// Code Splitting - Lazy Load Routes
const Landing = lazy(() => import('./pages/Landing.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const AuthCallback = lazy(() => import('./pages/AuthCallback.tsx'));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout.tsx'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout.tsx'));
const Overview = lazy(() => import('./pages/dashboard/Overview.tsx'));
const Chat = lazy(() => import('./pages/dashboard/Chat.tsx'));
const Documents = lazy(() => import('./pages/dashboard/Documents.tsx'));
const Settings = lazy(() => import('./pages/dashboard/Settings.tsx'));
const Billing = lazy(() => import('./pages/dashboard/Billing.tsx'));
const Team = lazy(() => import('./pages/dashboard/Team.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.tsx'));

// Reusable Loading Skeleton
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-canvas">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-link" />
      <p className="text-[14px] text-mute font-medium animate-pulse">Loading module...</p>
    </div>
  </div>
);

// Wrapper to redirect authenticated users away from login
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="bottom-right" toastOptions={{ 
            style: { background: 'var(--ink)', color: 'var(--on-primary)', border: '1px solid var(--hairline)', fontSize: '14px', borderRadius: '8px' },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--canvas)' } },
            error: { iconTheme: { primary: 'var(--error)', secondary: 'var(--canvas)' } }
          }} />
          
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/auth/callback" 
                element={<AuthCallback />} 
              />
              
              {/* User Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Navigate to="/dashboard/overview" replace />} />
                  <Route path="overview" element={<Overview />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="team" element={<Team />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                </Route>
                
                {/* Admin Dashboard Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/analytics" replace />} />
                  <Route path=":view" element={<AdminDashboard />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
