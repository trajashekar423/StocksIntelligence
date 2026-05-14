import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell, FiChevronDown, FiLogOut, FiMenu } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import sidebarConfig from '../config/sidebarConfig.json';
import { getUser } from '../utils/authStorage';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'BO';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getUserName(user) {
  return user?.name || user?.merchant_name || user?.business_name || user?.email || 'Business Owner';
}

function getUserEmail(user) {
  return user?.email_address || user?.email || 'owner@ranevra.com';
}

export default function Header({ onOpenMobileSidebar }) {
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const user = getUser();
  const userName = getUserName(user);
  const userEmail = getUserEmail(user);
  const userRole = user?.role || 'Store owner';

  const pageTitle = useMemo(() => {
    const activeItem = sidebarConfig.find((item) => (
      item.path?.toLowerCase() === location.pathname.toLowerCase()
    ));

    return activeItem?.label || 'Dashboard';
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="dl-topbar">
      <div className="dl-topbar-left">
        <button
          className="dl-mobile-menu d-flex d-md-none"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          type="button"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="dl-page-title">{pageTitle}</h1>
      </div>

      <div className="dl-topbar-right">
        <button className="dl-icon-btn" type="button" aria-label="Notifications">
          <FiBell size={19} />
        </button>

        <div className="dl-profile-wrap" ref={profileRef}>
          <button
            className={`dl-profile-btn ${menuOpen ? 'dl-profile-btn-open' : ''}`}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className="dl-avatar" aria-hidden="true">
              {user?.profile_image ? (
                <img src={user.profile_image} alt="" />
              ) : (
                <span>{getInitials(userName)}</span>
              )}
            </span>
            <span className="dl-profile-copy">
              <span className="dl-profile-name">{userName}</span>
              <span className="dl-profile-role">{userRole}</span>
            </span>
            <FiChevronDown className="dl-profile-arrow" size={16} />
          </button>

          {menuOpen && (
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
  );
}
