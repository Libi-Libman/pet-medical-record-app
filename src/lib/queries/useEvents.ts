import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export type EventType = 'visit' | 'note' | 'procedure' | 'test' | 'appointment';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

export type EventRow = {
  id: string;
  petId: string;
  type: EventType;
  date: string;
  datePrecision: 'exact' | 'month' | 'year';
  clinicName: string | null;
  notes: string | null;
  symptoms: string | null;
  findings: string | null;
  diagnosis: string | null;
  treatment: string | null;
  source: 'owner_entered' | 'extracted_from_document';
  status: EventStatus | null;
  createdAt: string;
};

const SELECT_COLUMNS =
  'id, petId:pet_id, type, date, datePrecision:date_precision, clinicName:clinic_name, notes, symptoms, findings, diagnosis, treatment, source, status, createdAt:created_at';

export const useEvents = (petId: string | undefined) => {
  const { session, isMockSession } = useAuth();
  return useQuery({
    queryKey: ['events', 'pet', petId],
    enabled: !!session && !isMockSession && !!petId,
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from('events')
        .select(SELECT_COLUMNS)
        .eq('pet_id', petId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as unknown as EventRow[];
    },
  });
};

// Links between episodes and events (many-to-many junction table).
export const useEpisodeEventLinks = (petId: string | undefined) => {
  const { session, isMockSession } = useAuth();
  return useQuery({
    queryKey: ['episode-events', 'pet', petId],
    enabled: !!session && !isMockSession && !!petId,
    queryFn: async (): Promise<{ episodeId: string; eventId: string }[]> => {
      // episode_events has no pet_id of its own — go through episodes, which
      // RLS already scopes to the owner, so this stays correctly scoped too.
      const { data: episodeIds, error: episodesError } = await supabase
        .from('episodes')
        .select('id')
        .eq('pet_id', petId);
      if (episodesError) throw episodesError;
      const ids = (episodeIds ?? []).map((e) => e.id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('episode_events')
        .select('episodeId:episode_id, eventId:event_id')
        .in('episode_id', ids);
      if (error) throw error;
      return data as unknown as { episodeId: string; eventId: string }[];
    },
  });
};

export const insertEvent = async (input: {
  petId: string;
  type: EventType;
  date: string;
  clinicName: string | null;
  notes: string | null;
  diagnosis: string | null;
  treatment: string | null;
  status: EventStatus | null;
  episodeId?: string | null;
}): Promise<EventRow> => {
  const { data, error } = await supabase
    .from('events')
    .insert({
      pet_id: input.petId,
      type: input.type,
      date: input.date,
      clinic_name: input.clinicName,
      notes: input.notes,
      diagnosis: input.diagnosis,
      treatment: input.treatment,
      status: input.status,
      source: 'owner_entered',
    })
    .select(
      'id, petId:pet_id, type, date, datePrecision:date_precision, clinicName:clinic_name, notes, symptoms, findings, diagnosis, treatment, source, status, createdAt:created_at'
    )
    .single();
  if (error) throw error;
  const event = data as unknown as EventRow;

  if (input.episodeId) {
    const { error: linkError } = await supabase
      .from('episode_events')
      .insert({ episode_id: input.episodeId, event_id: event.id });
    if (linkError) throw linkError;
  }

  return event;
};

export const updateEvent = async (
  id: string,
  input: {
    type: EventType;
    date: string;
    clinicName: string | null;
    notes: string | null;
    diagnosis: string | null;
    treatment: string | null;
    status: EventStatus | null;
    episodeId?: string | null;
  }
): Promise<EventRow> => {
  const { data, error } = await supabase
    .from('events')
    .update({
      type: input.type,
      date: input.date,
      clinic_name: input.clinicName,
      notes: input.notes,
      diagnosis: input.diagnosis,
      treatment: input.treatment,
      status: input.status,
    })
    .eq('id', id)
    .select(
      'id, petId:pet_id, type, date, datePrecision:date_precision, clinicName:clinic_name, notes, symptoms, findings, diagnosis, treatment, source, status, createdAt:created_at'
    )
    .single();
  if (error) throw error;
  const event = data as unknown as EventRow;

  // Replace any existing episode link with whatever was chosen on save
  // (including none), rather than trying to diff old vs. new.
  const { error: unlinkError } = await supabase.from('episode_events').delete().eq('event_id', id);
  if (unlinkError) throw unlinkError;
  if (input.episodeId) {
    const { error: linkError } = await supabase
      .from('episode_events')
      .insert({ episode_id: input.episodeId, event_id: id });
    if (linkError) throw linkError;
  }

  return event;
};

export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
};
