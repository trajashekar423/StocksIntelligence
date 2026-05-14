import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dl-wrapper">
      <Sidebar
        collapsed={isDrawerMode ? false : collapsed}
        mobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <main className={`dl-content ${collapsed ? 'dl-content-collapsed' : ''}`}>
        <header className="dl-topbar">
          <button
            className="sb-toggle d-flex d-md-none"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="dl-topbar-right">
            <div className="dl-avatar">
              <span>BO</span>
            </div>
          </div>
        </header>

        <div className="dl-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
