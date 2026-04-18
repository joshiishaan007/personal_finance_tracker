import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function ServerError() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <span className="text-6xl" role="img" aria-label="error">⚡</span>
        <h1 className="text-3xl font-bold mt-4">Something went wrong</h1>
        <p className="text-slate-500 mt-2">Our servers hit a snag. Your data is safe — please try again.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
          <Button onClick={() => void navigate('/dashboard')}>← Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
