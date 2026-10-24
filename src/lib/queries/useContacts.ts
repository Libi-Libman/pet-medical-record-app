import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

export type ContactRow = {
  id: string;
  petId: string;
  name: string;
  clinicName: string | null;
  role: 'primary' | 'specialist' | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isPrimary: boolean;
};

const SELECT_COLUMNS =
  'id, petId:pet_id, name, clinicName:clinic_name, role, specialty, phone, email, address, isPrimary:is_primary';

export const useContacts = (petId: string | undefined) => {
  const { session, isMockSession } = useAuth();
  return useQuery({
    queryKey: ['contacts', 'pet', petId],
    enabled: !!session && !isMockSession && !!petId,
    queryFn: async (): Promise<ContactRow[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select(SELECT_COLUMNS)
        .eq('pet_id', petId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data as unknown as ContactRow[];
    },
  });
};

export const insertContact = async (input: {
  petId: string;
  name: string;
  clinicName: string | null;
  role: 'primary' | 'specialist';
  specialty: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isPrimary: boolean;
}): Promise<ContactRow> => {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      pet_id: input.petId,
      name: input.name,
      clinic_name: input.clinicName,
      role: input.role,
      specialty: input.specialty,
      phone: input.phone,
      email: input.email,
      address: input.address,
      is_primary: input.isPrimary,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  const contact = data as unknown as ContactRow;

  if (input.isPrimary) {
    const { error: petError } = await supabase
      .from('pets')
      .update({ primary_contact_id: contact.id })
      .eq('id', input.petId);
    if (petError) throw petError;
  }

  return contact;
};

export const updateContact = async (
  id: string,
  input: {
    petId: string;
    name: string;
    clinicName: string | null;
    role: 'primary' | 'specialist';
    specialty: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    isPrimary: boolean;
  }
): Promise<ContactRow> => {
  const { data, error } = await supabase
    .from('contacts')
    .update({
      name: input.name,
      clinic_name: input.clinicName,
      role: input.role,
      specialty: input.specialty,
      phone: input.phone,
      email: input.email,
      address: input.address,
      is_primary: input.isPrimary,
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  const contact = data as unknown as ContactRow;

  if (input.isPrimary) {
    const { error: petError } = await supabase
      .from('pets')
      .update({ primary_contact_id: contact.id })
      .eq('id', input.petId);
    if (petError) throw petError;

    // Clear the stale primary flag off whichever contact used to hold it,
    // so there's never more than one contact claiming role='primary' for
    // this pet at a time (pets.primary_contact_id is the source of truth,
    // but a contact's own row shouldn't keep claiming the role too).
    const { error: demoteError } = await supabase
      .from('contacts')
      .update({ role: 'specialist', is_primary: false })
      .eq('pet_id', input.petId)
      .eq('is_primary', true)
      .neq('id', contact.id);
    if (demoteError) throw demoteError;
  } else {
    // If this contact was the pet's primary vet and is no longer marked
    // primary, clear the pet's pointer rather than leaving it dangling on
    // a contact that no longer claims the role.
    const { data: pet, error: petFetchError } = await supabase
      .from('pets')
      .select('primary_contact_id')
      .eq('id', input.petId)
      .single();
    if (petFetchError) throw petFetchError;
    if (pet?.primary_contact_id === id) {
      const { error: clearError } = await supabase
        .from('pets')
        .update({ primary_contact_id: null })
        .eq('id', input.petId);
      if (clearError) throw clearError;
    }
  }

  return contact;
};

export const deleteContact = async (id: string, petId: string): Promise<void> => {
  // If this contact is the pet's current primary vet, clear the pointer
  // first — otherwise deleting it could fail on a foreign-key constraint,
  // or leave pets.primary_contact_id dangling if the constraint doesn't
  // enforce that.
  const { data: pet, error: petFetchError } = await supabase
    .from('pets')
    .select('primary_contact_id')
    .eq('id', petId)
    .single();
  if (petFetchError) throw petFetchError;
  if (pet?.primary_contact_id === id) {
    const { error: clearError } = await supabase
      .from('pets')
      .update({ primary_contact_id: null })
      .eq('id', petId);
    if (clearError) throw clearError;
  }

  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
};
