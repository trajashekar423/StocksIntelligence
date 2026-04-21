import { Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import PrivateRoute  from './routes/PrivateRoute';
import DashboardHome   from './pages/Dashboard';
import Customers       from './pages/Customers';
import Rewards         from './pages/Rewards';
import Transactions    from './pages/Transactions';
import Reports         from './pages/Reports';
import Invoices        from './pages/Invoices';
import Settings        from './pages/Settings';
import './App.css';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<Navigate to="/login" replace />} />

      {/* Protected — all dashboard routes share the layout */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard"    element={<DashboardHome />} />
        <Route path="/customers"    element={<Customers />} />
        <Route path="/rewards"      element={<Rewards />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/reports"      element={<Reports />} />
        <Route path="/invoices"     element={<Invoices />} />
        <Route path="/settings"     element={<Settings />} />
      </Route>
    </Routes>
  );
}
