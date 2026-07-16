import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { OrgTree } from './pages/OrgTree';
import { CSVImport } from './pages/CSVImport';
import { Profile } from './pages/Profile';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('Super Admin' | 'HR Manager' | 'Employee')[];
}> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // If not allowed, redirect to employee's own profile page
    return <Navigate to={`/profile/${user._id}`} replace />;
  }

  return <>{children}</>;
};

// Layout Wrapper
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-8 md:p-12">
          {children}
        </div>
      </main>
    </div>
  );
};

export const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'Employee' ? (
              <Navigate to={`/profile/${user._id}`} replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            user.role === 'Employee' ? (
              <Navigate to={`/profile/${user._id}`} replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Register />
          )
        }
      />

      {/* Protected Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <AppLayout>
              <Employees />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hierarchy"
        element={
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager', 'Employee']}>
            <AppLayout>
              <OrgTree />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/csv-import"
        element={
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager']}>
            <AppLayout>
              <CSVImport />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute allowedRoles={['Super Admin', 'HR Manager', 'Employee']}>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Catch-all Redirect */}
      <Route
        path="*"
        element={
          user ? (
            user.role === 'Employee' ? (
              <Navigate to={`/profile/${user._id}`} replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
