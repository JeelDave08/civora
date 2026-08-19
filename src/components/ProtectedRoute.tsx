import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuth();

  const activeToken = token || localStorage.getItem('token');
  let activeUser = user;
  if (!activeUser) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser && storedUser !== 'undefined') {
        activeUser = JSON.parse(storedUser);
      }
    } catch (e) {}
  }

  if (!activeToken || !activeUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (activeUser.role || '').toLowerCase();
  const hasAccess = allowedRoles.some(r => r.toLowerCase() === userRole);

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
