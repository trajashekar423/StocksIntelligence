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

export default function Sidebar({ collapsed, onToggle }) {
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
      {!collapsed && (
        <div className="sb-overlay d-md-none" onClick={onToggle} />
      )}

      <aside
        className={`sb-sidebar ${collapsed ? 'sb-collapsed' : ''}`}
        style={{
          background: theme.sidebarBg,
          color: theme.sidebarColor,
          width: collapsed ? theme.sidebarCollapsedWidth : theme.sidebarExpandedWidth,
          fontFamily: theme.fontFamily,
        }}
      >
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-logo">
            <span className="sb-logo-r">R</span>
          </div>
          {!collapsed && (
            <div className="sb-brand-text">
              <span className="sb-brand-name">RaNevra</span>
              <span className="sb-brand-sub">Merchant Portal</span>
            </div>
          )}
          <button className="sb-toggle d-none d-md-flex" onClick={onToggle} aria-label="Toggle sidebar">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed
                ? <path d="M9 18l6-6-6-6" />
                : <path d="M15 18l-6-6 6-6" />
              }
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <p className="sb-section-label">{!collapsed && 'MAIN MENU'}</p>
          {navItems.filter(item => item.visibility !== false).map(({ label, path, icon, color }) => {
            const Icon = getIcon(icon);
            const isActive = location.pathname === path;
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive: navActive }) =>
                  `sb-nav-item ${navActive || isActive ? 'sb-active' : ''}`
                }
                style={isActive ? {
                  background: theme.sidebarActiveBg,
                  color: theme.sidebarActiveColor,
                  ...(color ? { color } : {}),
                } : (color ? { color } : {})}
              >
                <span className="sb-icon"><Icon size={18} /></span>
                {!collapsed && <span className="sb-label">{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sb-footer">
          <button className="sb-nav-item sb-logout w-100" onClick={logout}>
            <span className="sb-icon"><Icons.FiLogOut size={18} /></span>
            {!collapsed && <span className="sb-label">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
