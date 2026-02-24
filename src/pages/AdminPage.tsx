import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

function AdminSignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await signIn(result.data.email, result.data.password);
      toast.success('Signed in successfully');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div
        className="w-full max-w-sm p-8 rounded-2xl"
        style={{
          background: 'var(--torq-card)',
          border: '1px solid var(--torq-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ background: 'var(--torq-accent-light)' }}
          >
            <Shield size={22} style={{ color: 'var(--torq-accent)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--torq-text)' }}>Admin Sign In</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--torq-muted)' }}>
            Sign in with your admin credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--torq-text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-shadow focus:ring-2"
              style={{
                border: '1px solid var(--torq-border)',
                background: 'var(--torq-surface)',
                color: 'var(--torq-text)',
                boxShadow: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(109,40,217,0.2)')}
              onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              placeholder="you@torqcrm.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--torq-text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-shadow focus:ring-2"
              style={{
                border: '1px solid var(--torq-border)',
                background: 'var(--torq-surface)',
                color: 'var(--torq-text)',
                boxShadow: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 2px rgba(109,40,217,0.2)')}
              onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm font-medium" style={{ color: 'var(--torq-danger)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
            style={{
              background: submitting ? 'var(--torq-accent-hover)' : 'var(--torq-accent)',
              color: '#fff',
            }}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--torq-accent-hover)'; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = 'var(--torq-accent)'; }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!user) {
    return <AdminSignIn />;
  }

  if (!isAdmin) {
    return (
      <div
        className="rounded-2xl p-6 text-center max-w-md mx-auto mt-12"
        style={{
          background: 'var(--torq-card)',
          border: '1px solid var(--torq-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--torq-text)' }}>Access Denied</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--torq-muted)' }}>
          You don't have admin privileges. Signed in as {user.email}.
        </p>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--torq-border)', color: 'var(--torq-text)' }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--torq-border)', color: 'var(--torq-text)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--torq-border-light)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'var(--torq-card)',
          border: '1px solid var(--torq-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <h3 className="text-lg font-semibold" style={{ color: 'var(--torq-text)' }}>
          Admin Panel
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--torq-muted)' }}>
          Welcome, {user.user_metadata?.full_name || user.email}. Admin controls will appear here in Phase 5.
        </p>
      </div>
    </div>
  );
}
