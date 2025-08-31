import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-2048-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // Allow access if user is logged in OR if user is a guest
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export { ProtectedRoute };