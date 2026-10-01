import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Transfer from './pages/Transfer';
import Payments from './pages/Payments';
import Cards from './pages/Cards';
import Savings from './pages/Savings';
import Investments from './pages/Investments';
import Loans from './pages/Loans';
import Budget from './pages/Budget';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Documents from './pages/Documents';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import CreatePin from './pages/CreatePin';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPendingTransfers from './pages/admin/AdminPendingTransfers';
import AdminApprovedTransfers from './pages/admin/AdminApprovedTransfers';
import AdminRejectedTransfers from './pages/admin/AdminRejectedTransfers';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import { useAuth } from './hooks/useAuth';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

      {/* Customer Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/create-pin" element={<CreatePin />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin Panel Routes */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pending-transfers" element={<AdminPendingTransfers />} />
          <Route path="approved-transfers" element={<AdminApprovedTransfers />} />
          <Route path="rejected-transfers" element={<AdminRejectedTransfers />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
