import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) void navigate('/dashboard', { replace: true });
  }, [user, isLoading, navigate]);

  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get('error');

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <span className="text-5xl">💜</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-3">FinBuddy</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your lifetime personal finance companion</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 text-sm rounded-lg">
            Sign-in failed. Please try again.
          </div>
        )}

        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-xs text-slate-400 mt-4">
          By continuing, you agree to use this app responsibly. No data is sold or shared.
        </p>
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        Free forever · Built for 30+ years of daily use
      </p>
    </div>
  );
}
