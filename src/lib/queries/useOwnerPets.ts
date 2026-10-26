import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { OwnerPet } from '../../types/owner-pet';

const SELECT_COLUMNS =
  'id, name, species, breed, sex, sterilized, birthDate:birth_date, microchipNumber:microchip_number, photoUrl:photo_url, primaryContactId:primary_contact_id';

// No owner id passed in — RLS on the `pets` table restricts every query to
// `auth.uid() = owner_id` automatically (see supabase/rls-policies.sql).
// Disabled under the dev-only mock session — there's no real Supabase JWT
// to query with, so it would just come back empty via RLS anyway.
export const useOwnerPets = () => {
  const { session, isMockSession } = useAuth();

  return useQuery({
    queryKey: ['pets', 'owner', session?.user.id],
    enabled: !!session && !isMockSession,
    queryFn: async (): Promise<OwnerPet[]> => {
      const { data, error } = await supabase
        .from('pets')
        .select(SELECT_COLUMNS)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as OwnerPet[];
    },
  });
};

// `ownerId` is required and sent explicitly on every insert. The original
// plan (supabase/rls-policies.sql) was to have Postgres fill `owner_id` in
// automatically via `alter column owner_id set default auth.uid()`, but a
// live QA pass (Oct 24, 2026) found inserting a new pet failing with a 403
// — the RLS insert policy (`with check (auth.uid() = owner_id)`) rejects
// the row because no default ever populated `owner_id`, whether that's
// because the migration was never actually run against the live project or
// something else reset it. Rather than re-diagnose the SQL side blind,
// the app now sets `owner_id` itself at insert time — this satisfies the
// same RLS policy regardless of whether the column default exists.
export const insertPet = async (
  ownerId: string,
  input: {
    name: string;
    species: string;
    breed: string | null;
    sex: 'male' | 'female' | null;
    sterilized: boolean;
    birthDate: string | null;
    microchipNumber: string | null;
  }
): Promise<OwnerPet> => {
  const { data, error } = await supabase
    .from('pets')
    .insert({
      owner_id: ownerId,
      name: input.name,
      species: input.species,
      breed: input.breed,
      sex: input.sex,
      sterilized: input.sterilized,
      birth_date: input.birthDate,
      microchip_number: input.microchipNumber,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as OwnerPet;
};

export const updatePet = async (
  id: string,
  input: {
    name: string;
    species: string;
    breed: string | null;
    sex: 'male' | 'female' | null;
    sterilized: boolean;
    birthDate: string | null;
    microchipNumber: string | null;
  }
): Promise<OwnerPet> => {
  const { data, error } = await supabase
    .from('pets')
    .update({
      name: input.name,
      species: input.species,
      breed: input.breed,
      sex: input.sex,
      sterilized: input.sterilized,
      birth_date: input.birthDate,
      microchip_number: input.microchipNumber,
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;
  return data as unknown as OwnerPet;
};

// Postgres foreign-key-violation error code — surfaced as a clear message
// instead of the raw constraint error when a pet still has medical records
// (episodes, events, medications, etc.) pointing at it. Deliberately not
// attempting to cascade-delete across every related table here — that
// needs the real FK/cascade behavior confirmed first, not guessed.
const FOREIGN_KEY_VIOLATION = '23503';

export const deletePet = async (id: string): Promise<void> => {
  const { error } = await supabase.from('pets').delete().eq('id', id);
  if (error) {
    if ((error as { code?: string }).code === FOREIGN_KEY_VIOLATION) {
      throw new Error(
        'This pet still has medical records attached (conditions, events, medications, etc.) — those need to be removed first.'
      );
    }
    throw error;
  }
};
// Pet photo upload (QA finding #4: pets have had a `photo_url` column all
// along but no UI ever wrote to it). Web-only for now -- this app is still
// tested web-only (see claude/context-handoff.md), and a raw `<input
// type="file">` needs no new native dependency, unlike a real native image
// picker would. Requires the `pet-photos` Storage bucket + policies from
// supabase/pet-photos-storage.sql to have been run -- without that, this
// will fail with a bucket-not-found or RLS error, same as the pets-table
// 403 that prompted explicitly setting owner_id elsewhere in this file.
const PHOTO_BUCKET = 'pet-photos';

export const uploadPetPhoto = async (
  ownerId: string,
  petId: string,
  file: File
): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${ownerId}/${petId}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const setPetPhotoUrl = async (petId: string, photoUrl: string | null): Promise<void> => {
  const { error } = await supabase.from('pets').update({ photo_url: photoUrl }).eq('id', petId);
  if (error) throw error;
};
