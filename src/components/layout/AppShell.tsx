import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';
import { useAuth } from '@/contexts/AuthContext';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'var(--torq-surface-secondary)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 md:p-8" style={{ paddingBottom: isAdmin ? 68 : undefined }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
