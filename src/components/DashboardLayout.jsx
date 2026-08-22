import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function DashboardLayout() {
  return (
    <div className="dl-wrapper">
      <main className="">
        <Header />

        <div className="dl-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
