import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiBell, FiChevronDown, FiLogOut } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
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

export default function Header() {
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const user = getUser();
  const userName = getUserName(user);
  const userEmail = getUserEmail(user);
  const userRole = user?.role || 'Store owner';

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/stocks')) return 'Stocks';
    return 'Stocks';
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
        <h1 className="dl-page-title">{pageTitle}</h1>
        <nav className="dl-topbar-nav" aria-label="Primary navigation">
          <NavLink
            to="/stocks"
            className={({ isActive }) => `dl-topbar-link ${isActive ? 'active' : ''}`}
          >
            Stocks
          </NavLink>
        </nav>
      </div>

     
    </header>
  );
}
