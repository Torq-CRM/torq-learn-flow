import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, BarChart2, Zap, Shield, Menu, X } from 'lucide-react';
import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { title: 'Training', path: '/training', icon: BookOpen },
  { title: 'Report', path: '/report', icon: BarChart2 },
  { title: 'Automation Planner', path: '/automation', icon: Zap },
  { title: 'Admin', path: '/admin', icon: Shield },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { locationId } = useLocationId();
  const location = useLocation();

  const linkSearch = locationId ? `?location_id=${locationId}` : '';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-[220px] flex flex-col
          border-r transition-transform duration-200
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'var(--torq-sidebar)',
          borderColor: 'var(--torq-sidebar-border)',
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold leading-tight">
                <span style={{ color: 'var(--torq-accent)' }}>Torq</span>
                <span style={{ color: 'var(--torq-text)' }}>Training</span>
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--torq-muted)' }}>
                Training Hub
              </p>
            </div>
            <button className="lg:hidden p-1" onClick={onClose}>
              <X size={18} style={{ color: 'var(--torq-muted)' }} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={`${item.path}${linkSearch}`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 h-11 rounded-lg text-[15px] transition-colors"
                style={{
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--torq-accent)' : 'var(--torq-text)',
                  background: isActive ? 'rgba(109,40,217,0.10)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--torq-accent)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--torq-border-light)';
                    e.currentTarget.style.color = 'var(--torq-text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--torq-text)';
                  }
                }}
              >
                <item.icon size={16} />
                <span>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {locationId && (
          <div className="px-5 pb-4 pt-2">
            <span
              className="font-mono text-[11px]"
              style={{ color: 'var(--torq-muted)' }}
            >
              {locationId}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
