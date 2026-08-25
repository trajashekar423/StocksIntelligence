'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname() || '';
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const userName = getUserName(user);
  const userEmail = getUserEmail(user);
  const userRole = user?.role || 'Store owner';

  const pageTitle = useMemo(() => {
    if (pathname.startsWith('/trading')) return 'Groww Intraday Trading';
    if (pathname.startsWith('/stocks')) return 'Stocks Intelligence';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/transactions')) return 'Transactions';
    if (pathname.startsWith('/rewards')) return 'Rewards';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/invoices')) return 'Invoices';
    if (pathname.startsWith('/reports')) return 'Reports';
    return 'Stocks Intelligence';
  }, [pathname]);

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
          <Link
            href="/stocks"
            className={`dl-topbar-link ${pathname.startsWith('/stocks') ? 'active' : ''}`}
          >
            Stocks Intelligence
          </Link>
          <Link
            href="/trading"
            className={`dl-topbar-link ${pathname.startsWith('/trading') ? 'active' : ''}`}
          >
            ⚡ Groww Trading
          </Link>
        </nav>
      </div>
    </header>
  );
}
