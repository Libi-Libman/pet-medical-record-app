import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export type EpisodeStatus = 'active' | 'chronic_active' | 'monitoring' | 'resolved';

export type EpisodeRow = {
  id: string;
  petId: string;
  name: string;
  category: string | null;
  status: EpisodeStatus;
  onsetDate: string | null;
  onsetPrecision: 'exact' | 'month' | 'year' | null;
  resolutionDate: string | null;
  currentStatusNote: string | null;
  createdAt: string;
};

const SELECT_COLUMNS =
  'id, petId:pet_id, name, category, status, onsetDate:onset_date, onsetPrecision:onset_precision, resolutionDate:resolution_date, currentStatusNote:current_status_note, createdAt:created_at';

export const useEpisodes = (petId: string | undefined) => {
  const { session, isMockSession } = useAuth();
  return useQuery({
    queryKey: ['episodes', 'pet', petId],
    enabled: !!session && !isMockSession && !!petId,
    queryFn: async (): Promise<EpisodeRow[]> => {
      const { data, error } = await supabase
        .from('episodes')
        .select(SELECT_COLUMNS)
        .eq('pet_id', petId)
        .order('onset_date', { ascending: false });
      if (error) throw error;
      return data as unknown as EpisodeRow[];
    },
  });
};

// "Active" for display purposes = anything not resolved — matches the
// active_episodes view's definition (status in active/chronic_active/monitoring).
export const isActiveEpisode = (status: EpisodeStatus) => status !== 'resolved';

export const insertEpisode = async (input: {
  petId: string;
  name: string;
  category: string | null;
  status: EpisodeStatus;
  onsetDate: string | null;
  currentStatusNote: string | null;
}): Promise<EpisodeRow> => {
  const { data, error } = await supabase
    .from('episodes')
    .insert({
      pet_id: input.petId,
      name: input.name,
      category: input.category,
      status: input.status,
      onset_date: input.onsetDate,
      current_status_note: input.currentStatusNote,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as EpisodeRow;
};

export const updateEpisode = async (
  id: string,
  input: {
    name: string;
    category: string | null;
    status: EpisodeStatus;
    onsetDate: string | null;
    currentStatusNote: string | null;
  }
): Promise<EpisodeRow> => {
  const { data, error } = await supabase
    .from('episodes')
    .update({
      name: input.name,
      category: input.category,
      status: input.status,
      onset_date: input.onsetDate,
      current_status_note: input.currentStatusNote,
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as EpisodeRow;
};

export const deleteEpisode = async (id: string): Promise<void> => {
  const { error } = await supabase.from('episodes').delete().eq('id', id);
  if (error) throw error;
};
