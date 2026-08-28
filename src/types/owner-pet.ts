export type OwnerPet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: 'male' | 'female';
  sterilized: boolean;
  birthDate: string | null;
  microchipNumber: string | null;
  photoUrl: string | null;
  primaryContactId: string | null;
};
