import { useState, useEffect, useMemo } from 'react';
import { fetchCustomers } from '../services/customerService';
import HeaderSection from '../components/customers/HeaderSection';
import StatsCards from '../components/customers/StatsCards';
import CustomerTable from '../components/customers/CustomerTable';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [hideBlocked, setHideBlocked] = useState(false);

  useEffect(() => {
    fetchCustomers().then(setCustomers);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      if (hideBlocked && c.status === 'blocked') return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [customers, search, hideBlocked]);

  return (
    <div className="cm-page">
      <HeaderSection
        search={search}
        onSearch={setSearch}
        hideBlocked={hideBlocked}
        onToggleBlocked={() => setHideBlocked((v) => !v)}
      />
      <StatsCards customers={customers} />
      <CustomerTable customers={filtered} />
    </div>
  );
}
