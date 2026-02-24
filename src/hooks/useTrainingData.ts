import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTrainingData(locationId: string | null) {
  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['training-subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_subjects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery({
    queryKey: ['training-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['training-progress', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('location_id', locationId!);
      if (error) throw error;
      return data;
    },
    enabled: !!locationId,
  });

  return {
    subjects: subjects ?? [],
    videos: videos ?? [],
    progress: progress ?? [],
    loading: subjectsLoading || videosLoading || (!!locationId && progressLoading),
  };
}
