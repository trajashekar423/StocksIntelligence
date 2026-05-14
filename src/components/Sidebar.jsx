import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import sidebarConfig from '../config/sidebarConfig.json';
import themeConfig from '../config/themeConfig.json';
import * as Icons from 'react-icons/fi';

// Map icon name from config to react-icons/fi (Feather Icons)
function getIcon(iconName) {
  const map = {
    users: Icons.FiUsers,
    gift: Icons.FiGift,
    'credit-card': Icons.FiCreditCard,
    settings: Icons.FiSettings,
    'log-in': Icons.FiLogIn,
    dashboard: Icons.FiGrid,
  };
  return map[iconName] || Icons.FiCircle;
}

export default function Sidebar({ collapsed, mobileOpen = false, onToggle, onClose }) {
  const location = useLocation();
  const [navItems, setNavItems] = useState([]);
  const [theme, setTheme] = useState({});
  const { logout } = useAuth();

  useEffect(() => {
    setNavItems(sidebarConfig);
    setTheme(themeConfig);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sb-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        id="dashboard-sidebar"
        className={`sidebar sb-sidebar d-flex flex-column p-3 ${collapsed ? 'sb-collapsed' : ''} ${mobileOpen ? 'sb-mobile-open' : ''}`}
        style={{
          color: theme.sidebarColor,
          width: collapsed ? theme.sidebarCollapsedWidth : theme.sidebarExpandedWidth,
          fontFamily: theme.fontFamily,
        }}
      >
        {/* Brand */}
        <div className="sb-brand d-flex align-items-center gap-3">
          <div className="sb-logo">
            <span className="sb-logo-r">R</span>
          </div>
          {!collapsed && (
            <div className="sb-brand-text">
              <span className="sb-brand-name">RaNevra</span>
              <span className="sb-brand-sub">Merchant Portal</span>
            </div>
          )}
          
        </div>

        {/* Nav */}
        <nav className="sb-nav d-flex flex-column gap-2">
          <p className="sb-section-label text-muted small fw-bold">{!collapsed && 'MAIN MENU'}</p>
          {navItems.filter(item => item.visibility !== false).map(({ label, path, icon, color }) => {
            const Icon = getIcon(icon);
            const isActive = location.pathname === path;
            return (
              <div key={path} className={label === 'Settings' ? 'sb-admin-group' : undefined}>
                {label === 'Settings' && (
                  <p className="sb-section-label sb-admin-label text-muted small fw-bold">
                    {!collapsed && 'ADMIN'}
                  </p>
                )}
                <NavLink
                  to={path}
                  onClick={onClose}
                  className={({ isActive: navActive }) =>
                    `sidebar-item sb-nav-item d-flex align-items-center gap-2 rounded-3 fw-semibold ${navActive || isActive ? 'active sb-active' : ''}`
                  }
                  style={isActive ? {
                    color: theme.sidebarActiveColor,
                    ...(color ? { color } : {}),
                  } : (color ? { color } : {})}
                >
                  <span className="sb-icon"><Icon size={18} /></span>
                  {!collapsed && <span className="sb-label">{label}</span>}
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sb-footer mt-auto">
          <button className="sidebar-item sb-nav-item sb-logout d-flex align-items-center gap-2 rounded-3 fw-semibold w-100" onClick={logout}>
            <span className="sb-icon"><Icons.FiLogOut size={18} /></span>
            {!collapsed && <span className="sb-label">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
