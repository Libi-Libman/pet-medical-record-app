import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePetAge } from '@/lib/dates/usePetAge';
import { OwnerPet } from '@/types/owner-pet';

type Props = {
  pet: OwnerPet;
  active?: boolean;
  onPress?: () => void;
};

export const PetCard = ({ pet, active = false, onPress }: Props) => {
  const age = usePetAge(pet);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, active && styles.cardActive]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="paw" size={26} color="#92400E" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.info}>
          {[pet.breed || pet.species, age].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {active ? (
        <View style={styles.activeBadge}>
          <Feather name="check" size={12} color="#1D4ED8" />
          <Text style={styles.activeBadgeText}>Showing</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: 'rgb(191 219 254)',
    backgroundColor: 'rgb(239 246 255)',
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
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgb(219 234 254)',
  },
  activeBadgeText: {
    color: 'rgb(29 78 216)',
    fontSize: 11,
    fontWeight: '600',
  },
});
