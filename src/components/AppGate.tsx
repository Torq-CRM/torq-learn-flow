import { Navigate } from 'react-router-dom';
import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/layout/AppShell';
import NoLocationScreen from '@/pages/NoLocationScreen';

export default function AppGate() {
  const { locationId } = useLocationId();
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!locationId && !isAdmin) {
    return <NoLocationScreen />;
  }

  return <AppShell />;
}
