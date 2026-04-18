import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
