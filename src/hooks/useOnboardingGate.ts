import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOnboardingGate(locationId: string | null) {
  const { data: steps, isLoading: stepsLoading } = useQuery({
    queryKey: ['onboarding-steps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['onboarding-progress', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('location_id', locationId!);
      if (error) throw error;
      return data;
    },
    enabled: !!locationId,
  });

  const loading = stepsLoading || (!!locationId && progressLoading);

  if (loading || !steps) {
    return { isComplete: false, loading: true, steps: [], progress: [] };
  }

  const completedStepIds = new Set(
    (progress ?? []).filter((p) => p.completed).map((p) => p.step_id)
  );

  const isComplete = steps.every((step) => completedStepIds.has(step.id));

  return { isComplete, loading: false, steps, progress: progress ?? [] };
}
