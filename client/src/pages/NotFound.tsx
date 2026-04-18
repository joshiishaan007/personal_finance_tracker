import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <span className="text-6xl" role="img" aria-label="lost">🗺️</span>
        <h1 className="text-3xl font-bold mt-4">Page not found</h1>
        <p className="text-slate-500 mt-2">This page doesn't exist — but your finances are right where you left them.</p>
        <Button onClick={() => void navigate('/dashboard')} className="mt-6">← Back to Dashboard</Button>
      </div>
    </div>
  );
}
