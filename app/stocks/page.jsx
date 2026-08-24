'use client';

import DashboardLayout from '../../src/components/DashboardLayout';
import StocksPage from '../../src/views/Stocks';

export default function Stocks() {
  return (
    <DashboardLayout>
      <StocksPage />
    </DashboardLayout>
  );
}

