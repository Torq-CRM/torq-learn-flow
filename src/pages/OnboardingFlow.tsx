export default function OnboardingFlow() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--torq-card)',
        border: '1px solid var(--torq-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 className="text-lg font-semibold" style={{ color: 'var(--torq-text)' }}>
        Onboarding
      </h3>
      <p className="text-sm mt-1" style={{ color: 'var(--torq-muted)' }}>
        Onboarding flow will appear here in Phase 2.
      </p>
    </div>
  );
}
