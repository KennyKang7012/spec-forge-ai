import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // 如果沒有登入，將使用者導向登入頁面
    return <Navigate to="/login" replace />;
  }

  // 如果已登入，渲染子路由 (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;
