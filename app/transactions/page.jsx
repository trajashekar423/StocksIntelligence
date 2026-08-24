'use client';

import DashboardLayout from '../../src/components/DashboardLayout';
import Transactions from '../../src/views/Transactions';

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <Transactions />
    </DashboardLayout>
  );
}

