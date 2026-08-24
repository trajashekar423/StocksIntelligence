'use client';

import DashboardLayout from '../../src/components/DashboardLayout';
import Invoices from '../../src/views/Invoices';

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <Invoices />
    </DashboardLayout>
  );
}

