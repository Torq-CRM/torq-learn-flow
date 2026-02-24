import { useLocationId } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingGate } from '@/hooks/useOnboardingGate';
import AppShell from '@/components/layout/AppShell';
import NoLocationScreen from '@/pages/NoLocationScreen';
import OnboardingFlow from '@/pages/OnboardingFlow';

export default function AppGate() {
  const { locationId } = useLocationId();
  const { isAdmin, loading: authLoading } = useAuth();
  const { isComplete, loading: gateLoading, steps, progress } = useOnboardingGate(locationId);

  // Loading state — plain spinner, no layout chrome
  if (authLoading || gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin h-6 w-6 border-2 rounded-full"
          style={{ borderColor: 'var(--torq-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // No location and not admin → welcome screen
  if (!locationId && !isAdmin) {
    return <NoLocationScreen />;
  }

  // Admin bypasses onboarding entirely
  if (isAdmin) {
    return <AppShell />;
  }

  // Onboarding not complete → full-screen onboarding flow
  if (!isComplete && locationId) {
    return <OnboardingFlow steps={steps} progress={progress} locationId={locationId} />;
  }

  // All good → app shell
  return <AppShell />;
}
