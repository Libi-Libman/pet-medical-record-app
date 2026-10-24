import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { useAuth } from '@/context/auth';
import { OwnerPet } from '@/types/owner-pet';

// Which pet the rest of the app shows. Previously every screen just read
// pets[0] (the oldest pet on file) — fine with one pet, but it meant a
// second pet's data was permanently unreachable through normal navigation.
// This persists the chosen pet per-device so it survives app restarts, and
// falls back to the oldest pet whenever nothing's been chosen yet or the
// chosen pet no longer exists (deleted, or a different account signed in).
const STORAGE_KEY = 'active-pet-id';

type ActivePetContextType = {
  pet: OwnerPet | undefined;
  pets: OwnerPet[];
  petsLoading: boolean;
  setActivePetId: (id: string) => void;
};

const ActivePetContext = createContext<ActivePetContextType | undefined>(undefined);

export function ActivePetProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { data: pets, isLoading: petsLoading } = useOwnerPets();
  const [activePetId, setActivePetIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setActivePetIdState(stored))
      .finally(() => setHydrated(true));
  }, []);

  // A different account (or signing out) shouldn't keep the previous
  // owner's selection around in memory for this app session.
  useEffect(() => {
    if (!session) setActivePetIdState(null);
  }, [session]);

  const setActivePetId = (id: string) => {
    setActivePetIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
      // Non-fatal — worst case the choice doesn't survive a restart.
    });
  };

  const list = pets ?? [];
  const storedMatch = hydrated && activePetId ? list.find((p) => p.id === activePetId) : undefined;
  const pet = storedMatch ?? list[0];

  return (
    <ActivePetContext.Provider value={{ pet, pets: list, petsLoading, setActivePetId }}>
      {children}
    </ActivePetContext.Provider>
  );
}

export function useActivePet() {
  const ctx = useContext(ActivePetContext);
  if (!ctx) throw new Error('useActivePet must be used within ActivePetProvider');
  return ctx;
}
