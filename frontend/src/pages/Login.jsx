import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/firebase';

export function Login({ onSuccess, onCancel }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, navigate, redirectPath, onSuccess]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login();
      trackEvent('login_requested', { provider: 'google' });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      trackEvent('login_failed', { message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to Equity Research AI</h1>
          <p className="text-text-secondary mb-8">
            Create your account with Google to access research, save history, and sync analytics.
          </p>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3"
          >
            <span className="text-xl">🔐</span>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          {onCancel && (
            <Button
              variant="ghost"
              className="w-full mt-3"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          {error && (
            <div className="mt-4 text-sm text-danger bg-danger/10 px-4 py-2 rounded">
              {error}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
