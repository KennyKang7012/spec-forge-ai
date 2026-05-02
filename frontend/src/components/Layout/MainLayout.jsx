import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        {/* 子路由（例如 Dashboard 的內容）會在這裡渲染 */}
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
