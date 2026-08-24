'use client';

import DashboardLayout from '../../src/components/DashboardLayout';
import Customers from '../../src/views/Customers';

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <Customers />
    </DashboardLayout>
  );
}

