import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.role) {
    return <Navigate to="/select-role" state={{ from: location }} replace />;
  }

  // Strictly block Guest / Demo users from Admin routes
  if (user.isGuest && allowedRoles?.length === 1 && allowedRoles[0] === 'admin') {
    return <Navigate to="/farmer/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'farmer' ? '/farmer/dashboard' : '/provider/dashboard'} replace />;
  }

  return children;
}
