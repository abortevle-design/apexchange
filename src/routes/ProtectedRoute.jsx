import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Protects banking routes so unauthenticated visitors are redirected to login.
export default function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-navy-200">Loading Apex exchange bank...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Redirect to Create PIN screen if user has no transferPin configured yet
  if (user && !user.transferPin && location.pathname !== '/create-pin') {
    return <Navigate to="/create-pin" replace />;
  }

  return <Outlet />;
}
