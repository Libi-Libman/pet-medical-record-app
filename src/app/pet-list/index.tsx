import { PetCard } from '@/components/pet-list/PetCard';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PetList = () => {
  const { data: pets = [], isLoading } = useOwnerPets();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your pets</Text>
        <Pressable
          onPress={() => router.push('/pet-list/add-pet')}
          style={styles.addButton}
        >
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.addButtonText}>Add pet</Text>
        </Pressable>
      </View>

      {!isLoading && pets.length === 0 && (
        <Text style={styles.empty}>No pets yet — tap "Add pet" to get started.</Text>
      )}

      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgb(23 23 23)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgb(37 99 235)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    color: 'rgb(115 115 115)',
    fontSize: 13,
    paddingHorizontal: 8,
  },
});

export default PetList;
