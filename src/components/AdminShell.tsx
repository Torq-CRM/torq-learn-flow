import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/layout/AppShell';
import AdminPage from '@/pages/AdminPage';

export default function AdminShell() {
  const { user, isAdmin, loading } = useAuth();

  // If not authenticated or not admin, render AdminPage directly (login/access denied screens)
  if (loading || !user || !isAdmin) {
    return <AdminPage />;
  }

  // Authenticated admin → render inside AppShell
  return <AppShell />;
}
