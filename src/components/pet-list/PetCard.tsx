import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { usePetAge } from '@/lib/dates/usePetAge';
import { OwnerPet } from '@/types/owner-pet';

type Props = {
  pet: OwnerPet;
};

export const PetCard = ({ pet }: Props) => {
  const age = usePetAge(pet);

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="paw" size={26} color="#92400E" />
      </View>

      <View>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.info}>
          {pet.species} - {pet.breed} - {age}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgb(254 243 199)',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: 'rgb(23 23 23)',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: 600,
  },
  info: {
    color: 'rgb(115 115 115)',
    fontSize: 12,
    lineHeight: 16,
  },
});
