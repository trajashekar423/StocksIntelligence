'use client';

import DashboardLayout from '@/src/components/DashboardLayout';
import IntradayTradingModule from '@/src/components/trading/IntradayTradingModule';

export default function TradingPage() {
  return (
    <DashboardLayout>
      <div className="py-2">
        <IntradayTradingModule />
      </div>
    </DashboardLayout>
  );
}

