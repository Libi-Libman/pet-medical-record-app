import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SectionHeader } from '@/components/section-header';
import { QuickActionButton } from '@/components/quick-action-button';
import { ConditionCard } from '@/components/condition-card';
import { MedicationRow } from '@/components/medication-row';
import { useAuth } from '@/context/auth';
import { useMedicationDraft } from '@/context/medication-draft';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { usePetAge } from '@/lib/dates/usePetAge';
import { useEpisodes, isActiveEpisode, EpisodeStatus } from '@/lib/queries/useEpisodes';
import { useEvents } from '@/lib/queries/useEvents';

const episodeCardStatus = (status: EpisodeStatus): 'recovering' | 'chronic' =>
  status === 'active' ? 'recovering' : 'chronic';

const episodeCardIcon = (category: string | null) => {
  if (category && /ortho|joint|bone|ligament/i.test(category)) return 'activity' as const;
  return 'heart' as const;
};

const formatEventDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { medications } = useMedicationDraft();
  const { data: pets, isLoading: petsLoading } = useOwnerPets();
  const pet = pets?.[0];
  const petAge = pet ? usePetAge(pet) : undefined;
  const petHowDoing = pet ? (pet.sex === 'male' ? "How he's doing" : "How she's doing") : "How they're doing";

  const { data: episodes, isLoading: episodesLoading } = useEpisodes(pet?.id);
  const activeEpisodes = (episodes ?? []).filter((e) => isActiveEpisode(e.status));

  const { data: events, isLoading: eventsLoading } = useEvents(pet?.id);
  const today = new Date().toISOString().split('T')[0];
  const nextAppointment = (events ?? [])
    .filter((e) => e.type === 'appointment' && e.status === 'scheduled' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const recentEvents = (events ?? [])
    .filter((e) => e.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-neutral-400">Good morning</Text>
          <View className="flex-row items-center gap-4">
            <Feather name="bell" size={18} color="#0C447C" />
            <Pressable onPress={signOut} hitSlop={10}>
              <Feather name="log-out" size={18} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/pet-list')}
          className="mb-4 flex-row items-center gap-3"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <MaterialCommunityIcons name="paw" size={26} color="#92400E" />
          </View>
          <View className="flex-1">
            {petsLoading ? (
              <Text className="text-sm text-neutral-400">Loading pet…</Text>
            ) : pet ? (
              <>
                <Text className="text-lg font-semibold text-neutral-900">{pet.name}</Text>
                <Text className="text-xs text-neutral-500">
                  {[pet.breed || pet.species, petAge].filter(Boolean).join(' · ')}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-neutral-900">No pet yet</Text>
                <Text className="text-xs text-blue-700">Tap to add one</Text>
              </>
            )}
          </View>
          <Feather name="chevron-right" size={18} color="#A8A29E" />
        </Pressable>

        <View className="mb-5 flex-row gap-2">
          <QuickActionButton
            icon="plus"
            label="Add entry"
            filled
            onPress={() => router.push('/quick-add/capture')}
          />
          <QuickActionButton
            icon="file-text"
            label="Vet summary"
            onPress={() => router.push('/vet-summary')}
          />
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <SectionHeader>{petHowDoing}</SectionHeader>
          <Pressable onPress={() => router.push('/episode-add' as any)} hitSlop={10}>
            <Feather name="plus-circle" size={16} color="#92400E" />
          </Pressable>
        </View>
        <View className="mb-5 gap-2">
          {episodesLoading ? (
            <Text className="text-xs text-neutral-400 py-1">Loading…</Text>
          ) : activeEpisodes.length === 0 ? (
            <Text className="text-xs text-neutral-400 py-1">
              No active conditions — tap + to add one.
            </Text>
          ) : (
            activeEpisodes.map((ep) => (
              <ConditionCard
                key={ep.id}
                status={episodeCardStatus(ep.status)}
                icon={episodeCardIcon(ep.category)}
                title={ep.name}
                subtitle={ep.currentStatusNote || ep.category || 'Ongoing'}
                onPress={() => router.push({ pathname: '/episode-detail', params: { id: ep.id } })}
              />
            ))
          )}
        </View>

        <SectionHeader>Today's medications</SectionHeader>
        <View className="mb-5 gap-1.5">
          {medications.length === 0 && (
            <Text className="text-xs text-neutral-400 py-1">
              No medications added yet — use "Add a medication" below.
            </Text>
          )}
          {medications.map((med) =>
            med.reminder.frequencyType === 'as_needed' ? (
              <MedicationRow key={med.id} name={`${med.name} ${med.dose}`} time="As needed" taken={false} />
            ) : med.reminder.times.length > 0 ? (
              med.reminder.times.map((time) => (
                <MedicationRow
                  key={`${med.id}-${time}`}
                  name={`${med.name} ${med.dose}`}
                  time={time}
                  taken={false}
                />
              ))
            ) : (
              <MedicationRow key={med.id} name={`${med.name} ${med.dose}`} time={med.frequency} taken={false} />
            )
          )}
          <Pressable
            onPress={() => router.push('/quick-add/add-medication')}
            className="flex-row items-center gap-2 py-2"
          >
            <Feather name="plus-circle" size={16} color="#1D4ED8" />
            <Text className="text-xs text-blue-700 font-medium">Add a medication</Text>
          </Pressable>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <SectionHeader>Coming up</SectionHeader>
          <Pressable onPress={() => router.push({ pathname: '/event-add' as any, params: { type: 'appointment' } })} hitSlop={10}>
            <Feather name="plus-circle" size={16} color="#0C447C" />
          </Pressable>
        </View>
        <View className="mb-5">
          {eventsLoading ? (
            <Text className="text-xs text-neutral-400 py-1">Loading…</Text>
          ) : nextAppointment ? (
            <View className="flex-row items-center gap-2.5 rounded-2xl bg-blue-50 px-3 py-2.5">
              <Feather name="calendar" size={18} color="#0C447C" />
              <View>
                <Text className="text-xs font-semibold text-blue-900">
                  {nextAppointment.notes || 'Appointment'}
                </Text>
                <Text className="text-xs text-blue-900">
                  {[nextAppointment.clinicName, formatEventDate(nextAppointment.date)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-xs text-neutral-400 py-1">
              No appointments scheduled — tap + to add one.
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push('/timeline')}
          className="mb-2 flex-row items-center justify-between"
        >
          <SectionHeader>Recent activity</SectionHeader>
          <Text className="text-xs text-blue-800">View all</Text>
        </Pressable>
        <View className="gap-1.5">
          {eventsLoading ? (
            <Text className="text-xs text-neutral-400 py-1">Loading…</Text>
          ) : recentEvents.length === 0 ? (
            <Text className="text-xs text-neutral-400 py-1">No activity yet.</Text>
          ) : (
            recentEvents.map((e) => (
              <Text key={e.id} className="text-xs text-neutral-500">
                {formatEventDate(e.date)} · {e.notes || e.diagnosis || e.type}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
