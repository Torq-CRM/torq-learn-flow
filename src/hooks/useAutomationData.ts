import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAutomationData(locationId: string | null) {
  const { isAdmin } = useAuth();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['automation-boards', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_boards')
        .select('*, automation_columns(*, automation_cards(*))')
        .or(`location_id.is.null,location_id.eq.${locationId}`)
        .order('sort_order');
      if (error) throw error;

      // Sort columns and cards by sort_order
      return (data ?? []).map((board) => ({
        ...board,
        automation_columns: (board.automation_columns ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((col) => ({
            ...col,
            automation_cards: (col.automation_cards ?? [])
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
          })),
      }));
    },
    enabled: !!locationId || isAdmin,
  });

  return { boards: boards ?? [], loading: isLoading };
}
