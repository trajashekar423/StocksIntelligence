'use client';

import Header from './Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="dl-wrapper">
      <main className="">
        <Header />

        <div className="dl-page">
          {children}
        </div>
      </main>
    </div>
  );
}
