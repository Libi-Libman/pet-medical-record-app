import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

// Records an in-app account-deletion request (supabase/account-deletion-requests.sql).
// This is the in-app "initiate deletion" step App Store review requires —
// it does not delete any data itself. See that SQL file's comments for
// how a request actually gets processed today (manually, by the developer).
export const useAccountDeletion = () => {
  const { session } = useAuth();

  const requestDeletion = async (): Promise<{ error: string | null }> => {
    if (!session) return { error: 'Not signed in.' };
    const { error } = await supabase.from('account_deletion_requests').insert({
      owner_id: session.user.id,
      email: session.user.email,
    });
    return { error: error?.message ?? null };
  };

  return { requestDeletion };
};
