import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { useEpisodes, EpisodeStatus } from '@/lib/queries/useEpisodes';
import { useEvents, useEpisodeEventLinks, EventRow } from '@/lib/queries/useEvents';
import { useMedications } from '@/lib/queries/useMedications';
import { formatDose } from '@/lib/medications/parseDose';
import { describeFrequency } from '@/lib/medications/frequency';

const statusLabel: Record<EpisodeStatus, string> = {
  active: 'Active · being treated',
  chronic_active: 'Chronic · ongoing',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
};

const statusBg: Record<EpisodeStatus, string> = {
  active: 'bg-amber-100',
  chronic_active: 'bg-green-100',
  monitoring: 'bg-blue-100',
  resolved: 'bg-neutral-100',
};

const statusText: Record<EpisodeStatus, string> = {
  active: 'text-amber-900',
  chronic_active: 'text-green-900',
  monitoring: 'text-blue-900',
  resolved: 'text-neutral-600',
};

const eventTypeIcon: Record<EventRow['type'], keyof typeof Feather.glyphMap> = {
  visit: 'user',
  note: 'edit-3',
  procedure: 'scissors',
  test: 'activity',
  appointment: 'calendar',
};

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function EpisodeDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: pets } = useOwnerPets();
  const petId = pets?.[0]?.id;

  const { data: episodes, isLoading: episodesLoading } = useEpisodes(petId);
  const episode = episodes?.find((e) => e.id === id);

  const { data: links } = useEpisodeEventLinks(petId);
  const linkedEventIds = new Set((links ?? []).filter((l) => l.episodeId === id).map((l) => l.eventId));

  const { data: events, isLoading: eventsLoading } = useEvents(petId);
  const episodeEvents = (events ?? [])
    .filter((e) => linkedEventIds.has(e.id))
    .sort((a, b) => b.date.localeCompare(a.date));

  const { data: medications } = useMedications();
  const episodeMeds = (medications ?? []).filter((m) => m.episodeId === id);

  if (episodesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-xs text-neutral-400">Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!episode) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="mb-4 mt-2 flex-row items-center justify-between px-4">
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#404040" />
          </Pressable>
          <Text className="text-xs text-neutral-400">Episode</Text>
          <View style={{ width: 18 }} />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-neutral-500 text-center">
            This condition couldn't be found — it may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#404040" />
          </Pressable>
          <Text className="text-xs text-neutral-400">Episode</Text>
          <View style={{ width: 18 }} />
        </View>

        <Text className="mb-2 text-lg font-semibold text-neutral-900">{episode.name}</Text>
        <View className="mb-4 flex-row flex-wrap items-center gap-1.5">
          <View className={`rounded-md px-2 py-0.5 ${statusBg[episode.status]}`}>
            <Text className={`text-xs ${statusText[episode.status]}`}>{statusLabel[episode.status]}</Text>
          </View>
          {episode.category && (
            <View className="rounded-md bg-neutral-100 px-2 py-0.5">
              <Text className="text-xs text-neutral-600">{episode.category}</Text>
            </View>
          )}
          {episode.onsetDate && (
            <Text className="text-xs text-neutral-400">Since {formatDate(episode.onsetDate)}</Text>
          )}
        </View>

        {episode.currentStatusNote && (
          <View className="mb-5 rounded-lg bg-neutral-50 px-3 py-2.5">
            <Text className="mb-0.5 text-xs text-neutral-400">Current status</Text>
            <Text className="text-xs text-neutral-600">{episode.currentStatusNote}</Text>
          </View>
        )}

        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-neutral-900">Timeline</Text>
          <Pressable
            onPress={() => router.push({ pathname: '/event-add' as any, params: { episodeId: episode.id } })}
            hitSlop={10}
          >
            <Feather name="plus-circle" size={16} color="#404040" />
          </Pressable>
        </View>
        <View className="mb-5 gap-3" style={{ marginTop: -12 }}>
          {eventsLoading ? (
            <Text className="text-xs text-neutral-400">Loading…</Text>
          ) : episodeEvents.length === 0 ? (
            <Text className="text-xs text-neutral-400">No events linked to this condition yet.</Text>
          ) : (
            episodeEvents.map((e) => (
              <View key={e.id} className="flex-row gap-2">
                <Feather name={eventTypeIcon[e.type]} size={14} color="#A3A3A3" style={{ marginTop: 1 }} />
                <View className="flex-1">
                  <Text className="text-xs text-neutral-900">
                    {e.notes || e.diagnosis || e.treatment || e.type}
                  </Text>
                  <Text className="text-xs text-neutral-400">
                    {formatDate(e.date)}
                    {e.clinicName ? ` · ${e.clinicName}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <Text className="mb-2 text-sm font-semibold text-neutral-900">Medications</Text>
        <View className="mb-5 gap-1.5">
          {episodeMeds.length === 0 ? (
            <Text className="text-xs text-neutral-400">No medications linked to this condition yet.</Text>
          ) : (
            episodeMeds.map((m) => {
              const isActive = !m.endDate || m.endDate >= new Date().toISOString().split('T')[0];
              return (
                <View
                  key={m.id}
                  className="flex-row items-center justify-between rounded-lg border border-neutral-200 px-2.5 py-2"
                >
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
                    <View>
                      <Text className="text-xs text-neutral-900">
                        {m.name} {formatDose(m.dose, m.doseUnit)}
                      </Text>
                      <Text className="text-xs text-neutral-400">
                        {describeFrequency(m.frequencyType, m.frequencyInterval)}
                      </Text>
                    </View>
                  </View>
                  <View className={`rounded-md px-2 py-0.5 ${isActive ? 'bg-blue-50' : 'bg-neutral-100'}`}>
                    <Text className={`text-xs ${isActive ? 'text-blue-900' : 'text-neutral-600'}`}>
                      {isActive ? 'active' : 'completed'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
