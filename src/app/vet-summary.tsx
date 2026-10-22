import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { usePetAge } from '@/lib/dates/usePetAge';
import { useEpisodes, isActiveEpisode } from '@/lib/queries/useEpisodes';
import { useEvents } from '@/lib/queries/useEvents';
import { useAllergies } from '@/lib/queries/useAllergies';
import { useContacts } from '@/lib/queries/useContacts';
import { useMedications } from '@/lib/queries/useMedications';
import { formatDose } from '@/lib/medications/parseDose';
import { describeFrequency } from '@/lib/medications/frequency';

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function VetSummary() {
  const { data: pets, isLoading: petsLoading } = useOwnerPets();
  const pet = pets?.[0];
  const petAge = pet ? usePetAge(pet) : undefined;

  const { data: episodes } = useEpisodes(pet?.id);
  const activeEpisodes = (episodes ?? []).filter((e) => isActiveEpisode(e.status));

  const { data: events } = useEvents(pet?.id);
  const today = new Date();
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const recentEvents = (events ?? [])
    .filter((e) => e.date >= ninetyDaysAgo && e.date <= todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const surgicalHistory = (events ?? [])
    .filter((e) => e.type === 'procedure')
    .sort((a, b) => b.date.localeCompare(a.date));

  const { data: allergies } = useAllergies(pet?.id);
  const { data: contacts } = useContacts(pet?.id);
  const primaryContact = contacts?.find((c) => c.id === pet?.primaryContactId) ?? contacts?.find((c) => c.isPrimary);

  const { data: medications } = useMedications();
  const currentMedications = (medications ?? []).filter((m) => !m.endDate || m.endDate >= todayStr);

  if (petsLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-xs text-gray-400">Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Vet summary</Text>
      </View>

      {!pet ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-gray-500 text-center">
            No pet on file yet — add one from the pet list first.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ gap: 20, paddingBottom: 32 }}>
          {/* Header */}
          <View>
            <Text className="text-xl font-bold text-gray-900">{pet.name}</Text>
            <Text className="text-sm text-gray-600">
              {[
                pet.breed || pet.species,
                `${pet.sex === 'male' ? 'Male' : 'Female'}${pet.sterilized ? ` (${pet.sex === 'male' ? 'neutered' : 'spayed'})` : ''}`,
                petAge,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {pet.microchipNumber && (
              <Text className="text-xs text-gray-400 mt-0.5">Microchip: {pet.microchipNumber}</Text>
            )}
          </View>

          {/* Allergies - safety critical, top */}
          <View className="bg-red-50 border border-red-200 rounded-2xl p-3">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Feather name="alert-triangle" size={16} color="#991B1B" />
                <Text className="text-sm font-semibold text-red-900">Allergies</Text>
              </View>
              <Pressable onPress={() => router.push('/allergy-add' as any)} hitSlop={10}>
                <Feather name="plus-circle" size={16} color="#991B1B" />
              </Pressable>
            </View>
            {(allergies ?? []).length === 0 ? (
              <Text className="text-sm text-red-900">None recorded</Text>
            ) : (
              allergies!.map((a) => (
                <Text key={a.id} className="text-sm text-red-900">
                  {a.substance}
                  {a.reaction ? ` — ${a.reaction}` : ''}
                  {a.dateIdentified ? ` (${new Date(a.dateIdentified + 'T00:00:00').getFullYear()})` : ''}
                </Text>
              ))
            )}
          </View>

          {/* Current medications */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="package" size={16} color="#6B21A8" />
              <Text className="text-sm font-semibold text-purple-900">Current medications</Text>
            </View>
            {currentMedications.length === 0 ? (
              <Text className="text-sm text-gray-500">None</Text>
            ) : (
              <View className="bg-purple-50 border border-purple-100 rounded-2xl divide-y divide-purple-100">
                {currentMedications.map((m) => (
                  <View key={m.id} className="p-3">
                    <Text className="text-sm font-medium text-purple-900">
                      {m.name} {formatDose(m.dose, m.doseUnit)}
                    </Text>
                    <Text className="text-xs text-purple-700">
                      {describeFrequency(m.frequencyType, m.frequencyInterval)} · started{' '}
                      {formatDate(m.startDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Active conditions - one-line rollups */}
          <View>
            <Text className="text-sm font-semibold text-gray-900 mb-2">Active conditions</Text>
            {activeEpisodes.length === 0 ? (
              <Text className="text-sm text-gray-500">None</Text>
            ) : (
              <View className="gap-1.5">
                {activeEpisodes.map((ep) => (
                  <Text key={ep.id} className="text-sm text-gray-800">
                    • {ep.name}
                    {ep.currentStatusNote ? ` — ${ep.currentStatusNote}` : ''}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Surgical history */}
          <View>
            <Text className="text-sm font-semibold text-gray-900 mb-2">Surgical history</Text>
            {surgicalHistory.length === 0 ? (
              <Text className="text-sm text-gray-500">None recorded</Text>
            ) : (
              surgicalHistory.map((e) => (
                <Text key={e.id} className="text-sm text-gray-800">
                  {e.notes || e.treatment || 'Procedure'} — {formatDate(e.date)}
                </Text>
              ))
            )}
          </View>

          {/* Recent clinical events */}
          <View>
            <Text className="text-sm font-semibold text-gray-900 mb-2">Recent clinical events (90 days)</Text>
            {recentEvents.length === 0 ? (
              <Text className="text-sm text-gray-500">None</Text>
            ) : (
              <View className="gap-1.5">
                {recentEvents.map((e) => (
                  <Text key={e.id} className="text-sm text-gray-800">
                    {formatDate(e.date)} — {e.notes || e.diagnosis || e.treatment || e.type}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Primary contact */}
          <View className="bg-gray-50 rounded-2xl p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">Primary vet</Text>
              <Pressable onPress={() => router.push('/contact-add' as any)} hitSlop={10}>
                <Feather name="plus-circle" size={16} color="#404040" />
              </Pressable>
            </View>
            {primaryContact ? (
              <Text className="text-sm text-gray-700">
                {primaryContact.name}
                {primaryContact.clinicName ? ` — ${primaryContact.clinicName}` : ''}
              </Text>
            ) : (
              <Text className="text-sm text-gray-500">Not set</Text>
            )}
          </View>

          <Pressable onPress={() => router.push('/timeline')} className="flex-row items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600">
            <Feather name="clock" size={16} color="white" />
            <Text className="text-white font-medium text-sm">View full record</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
