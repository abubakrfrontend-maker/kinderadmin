import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import UnauthorizedPage from '@/pages/UnauthorizedPage';
import { Spinner } from '@/components/ui/Spinner';

// Lazy-loaded pages for code splitting (reduces initial bundle by ~60%)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ChildrenPage = lazy(() => import('@/pages/ChildrenPage'));
const GroupsPage = lazy(() => import('@/pages/GroupsPage'));
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'));
const FinancesPage = lazy(() => import('@/pages/FinancesPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AttendancePage = lazy(() => import('@/pages/AttendancePage'));
const HelpPage = lazy(() => import('@/pages/HelpPage'));
const ContractsPage = lazy(() => import('@/pages/ContractsPage'));
const ParentsPage = lazy(() => import('@/pages/ParentsPage'));
const ArchivePage = lazy(() => import('@/pages/ArchivePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <Spinner size="xl" className="text-sky-500" />
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-primary">
        <Spinner size="xl" className="text-sky-500" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/403" element={<UnauthorizedPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="/children" element={<ChildrenPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EmployeesPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/parents" element={<ParentsPage />} />
          <Route 
            path="/contracts" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ContractsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finances" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'accountant']}>
                <FinancesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AttendancePage />
              </ProtectedRoute>
            } 
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
