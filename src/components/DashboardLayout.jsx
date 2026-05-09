import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FiBell, FiChevronDown, FiLogOut, FiMenu } from 'react-icons/fi';
import Sidebar from './Sidebar';
import useAuth from '../hooks/useAuth';
import sidebarConfig from '../config/sidebarConfig.json';
import { getUser } from '../utils/authStorage';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);
  const { logout } = useAuth();
  const storedUser = getUser();

  const pageTitle = useMemo(() => {
    const currentItem = sidebarConfig.find((item) => (
      item.visibility !== false
      && item.path?.toLowerCase() === location.pathname.toLowerCase()
    ));

    return currentItem?.label || 'Dashboard';
  }, [location.pathname]);

  const userName = storedUser?.name || storedUser?.full_name || storedUser?.email || 'Business Owner';
  const userEmail = storedUser?.email || 'owner@ranevra.com';
  const userRole = storedUser?.role || storedUser?.user_type || 'Merchant Admin';
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="dl-wrapper">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className={`dl-content ${collapsed ? 'dl-content-collapsed' : ''}`}>
        <header className="dl-topbar">
          <div className="dl-topbar-left">
            <button
              className="dl-mobile-menu d-flex d-md-none"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>
            <h1 className="dl-page-title">{pageTitle}</h1>
          </div>

          <div className="dl-topbar-right">
            <button className="dl-icon-btn" type="button" aria-label="Notifications">
              <FiBell size={20} />
            </button>

            <div className="dl-profile-wrap" ref={profileRef}>
              <button
                className={`dl-profile-btn ${profileOpen ? 'dl-profile-btn-open' : ''}`}
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="dl-avatar">{initials || 'BO'}</span>
                <span className="dl-profile-copy">
                  <span className="dl-profile-name">{userName}</span>
                  <span className="dl-profile-role">{userRole}</span>
                </span>
                <FiChevronDown className="dl-profile-arrow" size={18} />
              </button>

              {profileOpen && (
                <div className="dl-profile-menu" role="menu">
                  <div className="dl-profile-menu-head">
                    <p className="dl-menu-name">{userName}</p>
                    <p className="dl-menu-email">{userEmail}</p>
                  </div>
                  <div className="dl-menu-divider" />
                  <button className="dl-signout-btn" type="button" onClick={logout} role="menuitem">
                    <FiLogOut size={17} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
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
