import { useNavigate } from 'react-router-dom';

export default function NoLocationScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--torq-surface)' }}
    >
      {/* Purple radial glows */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--torq-accent) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--torq-accent) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-[480px] mx-4 p-8 rounded-2xl text-center"
        style={{
          background: 'var(--torq-card)',
          border: '1px solid var(--torq-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Branding */}
        <div className="mb-6">
          <h1 className="text-lg font-extrabold">
            <span style={{ color: 'var(--torq-accent)' }}>Torq</span>
            <span style={{ color: 'var(--torq-text)' }}>Training</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--torq-muted)' }}>
            Training Hub
          </p>
        </div>

        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--torq-text)' }}>
          Welcome to TorqTraining
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--torq-text-secondary)' }}>
          To access your training hub, use the link provided by your Torq representative.
        </p>

        <button
          onClick={() => navigate('/admin')}
          className="text-sm font-medium transition-colors"
          style={{ color: 'var(--torq-accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--torq-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--torq-accent)')}
        >
          Admin? Sign in →
        </button>
      </div>
    </div>
  );
}
