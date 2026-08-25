import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PetCard } from './components/PetCard';

const PetList = () => {
  const { data: pets = [] } = useOwnerPets();

  return (
    <SafeAreaView style={styles.container}>
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
});

export default PetList;
