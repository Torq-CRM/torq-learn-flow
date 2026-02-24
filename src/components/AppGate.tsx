import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import AppShell from '@/components/layout/AppShell';
import NoLocationScreen from '@/pages/NoLocationScreen';
import OnboardingFlow from '@/pages/OnboardingFlow';

export default function AppGate() {
  const { locationId } = useLocationId();
  const { isAdmin, loading: authLoading } = useAuth();

  // Wait for auth only (with timeout fallback in AuthProvider)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin h-6 w-6 border-2 rounded-full"
          style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // Admin bypasses EVERYTHING — no location or onboarding required
  if (isAdmin) {
    return <AppShell />;
  }

  // No location and not admin → welcome screen
  if (!locationId) {
    return <NoLocationScreen />;
  }

  // Has location → check onboarding gate
  return <LocationGate locationId={locationId} />;
}

/** Separate component so onboarding hook only runs when locationId exists */
function LocationGate({ locationId }: { locationId: string }) {
  const { isComplete, loading, steps, progress } = useOnboardingGate(locationId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin h-6 w-6 border-2 rounded-full"
          style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // No steps configured or all complete → let them through
  if (isComplete || steps.length === 0) {
    return <AppShell />;
  }

  return <OnboardingFlow steps={steps} progress={progress} locationId={locationId} />;
}
