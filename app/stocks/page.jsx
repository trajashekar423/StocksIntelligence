'use client';

import dynamic from 'next/dynamic';
import DashboardLayout from '../../src/components/DashboardLayout';

const StocksPage = dynamic(() => import('../../src/views/Stocks'), {
  ssr: false,
  loading: () => (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading Stocks Intelligence...</span>
      </div>
    </div>
  ),
});

export default function Stocks() {
  return (
    <DashboardLayout>
      <StocksPage />
    </DashboardLayout>
  );
}
