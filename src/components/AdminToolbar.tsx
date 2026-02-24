import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function AdminToolbar() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  const handleExit = async () => {
    await signOut();
    navigate('/training');
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6"
      style={{
        height: 52,
        background: '#0F172A',
        borderTop: '1px solid rgba(109,40,217,0.3)',
        zIndex: 9999,
        animation: 'slide-up-toolbar 0.2s ease-out',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="rounded-full"
          style={{ width: 8, height: 8, background: '#6D28D9' }}
        />
        <span
          className="font-mono-torq text-[13px] hidden sm:inline"
          style={{ color: '#6D28D9' }}
        >
          Admin Mode
        </span>
      </div>
      <button
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#94A3B8' }}
        onClick={handleExit}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        aria-label="Exit Admin Mode"
      >
        <LogOut size={14} /> Exit Admin
      </button>
    </div>
  );
}
