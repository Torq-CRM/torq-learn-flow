import { useLocation } from 'react-router-dom';
import { BookOpen, BarChart2, Zap, Shield, Menu } from 'lucide-react';
import { useLocationId } from '@/contexts/LocationContext';
import { HEADER_CONFIG } from '@/lib/constants';

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  BarChart2,
  Zap,
  Shield,
};

interface HeaderBarProps {
  onMenuToggle: () => void;
}

export default function HeaderBar({ onMenuToggle }: HeaderBarProps) {
  const location = useLocation();
  const { locationId } = useLocationId();

  // Match route to config
  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const config = HEADER_CONFIG[basePath] || HEADER_CONFIG['/training'];
  const Icon = iconMap[config.icon] || BookOpen;

  return (
    <header
      className="flex items-center justify-between px-6 md:px-8"
      style={{
        background: 'linear-gradient(135deg, var(--torq-header-from), var(--torq-header-mid), var(--torq-header-to))',
        minHeight: '80px',
        padding: '20px 32px',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button className="lg:hidden mr-1" onClick={onMenuToggle}>
          <Menu size={22} className="text-white" />
        </button>

        {/* Icon container */}
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            background: 'rgba(255,255,255,0.15)',
          }}
        >
          <Icon size={24} className="text-white" />
        </div>

        <div>
          <h2 className="text-white text-2xl md:text-[32px] font-extrabold leading-tight">
            {config.title}
          </h2>
          <p className="text-white/70 text-sm md:text-base mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Location badge */}
      {locationId && (
        <span
          className="font-mono text-[11px] text-white px-3 py-1 rounded-full"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          {locationId}
        </span>
      )}
    </header>
  );
}
