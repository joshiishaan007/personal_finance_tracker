import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Analytics } from './pages/Analytics';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { NetWorth } from './pages/NetWorth';
import { ProfitLoss } from './pages/ProfitLoss';
import { Recurring } from './pages/Recurring';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton w-12 h-12 rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/onboarding" element={
        <RequireAuth><Onboarding /></RequireAuth>
      } />

      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/net-worth" element={<NetWorth />} />
        <Route path="/pl" element={<ProfitLoss />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="/500" element={<ServerError />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
