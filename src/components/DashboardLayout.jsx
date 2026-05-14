import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((c) => !c);
  };

  return (
    <div className="dl-wrapper">
      <Sidebar
        collapsed={mobileSidebarOpen ? false : collapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <main className={`dl-content ${collapsed ? 'dl-content-collapsed' : ''}`}>
        <Header onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />

        <div className="dl-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
