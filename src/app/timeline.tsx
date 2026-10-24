import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useActivePet } from '@/context/active-pet';
import { useEpisodes } from '@/lib/queries/useEpisodes';
import { useEvents, useEpisodeEventLinks, EventRow } from '@/lib/queries/useEvents';

const typeIcon: Record<EventRow['type'], keyof typeof Feather.glyphMap> = {
  visit: 'user',
  note: 'edit-3',
  procedure: 'scissors',
  test: 'activity',
  appointment: 'calendar',
};

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// 'All' is a sentinel, not a real episode id — two conditions can share a
// name, so filtering by id (not name) is what keeps their timelines apart.
const ALL = 'All';

export default function Timeline() {
  const [filter, setFilter] = useState<string>(ALL);
  const { pet } = useActivePet();
  const petId = pet?.id;

  const { data: episodes } = useEpisodes(petId);
  const { data: events, isLoading } = useEvents(petId);
  const { data: links } = useEpisodeEventLinks(petId);

  const episodeNameById = new Map((episodes ?? []).map((e) => [e.id, e.name] as const));
  const episodeIdByEventId = new Map<string, string>();
  (links ?? []).forEach((link) => {
    if (episodeNameById.has(link.episodeId)) episodeIdByEventId.set(link.eventId, link.episodeId);
  });

  const filterOptions = [ALL, ...(episodes ?? []).map((e) => e.id)];
  const sorted = [...(events ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const filtered =
    filter === ALL ? sorted : sorted.filter((e) => episodeIdByEventId.get(e.id) === filter);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between gap-3 border-b border-gray-100 px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color="#2C2C2A" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Full timeline</Text>
        </View>
        <Pressable onPress={() => router.push('/event-add' as any)} hitSlop={10}>
          <Feather name="plus-circle" size={20} color="#2C2C2A" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} className="px-4 py-3" contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
        {filterOptions.map((optionId) => (
          <Pressable
            key={optionId}
            onPress={() => setFilter(optionId)}
            className={`rounded-full border px-3 py-1.5 ${filter === optionId ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}
          >
            <Text
              className={`text-xs font-medium ${filter === optionId ? 'text-white' : 'text-gray-700'}`}
            >
              {optionId === ALL ? ALL : episodeNameById.get(optionId)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
        {isLoading ? (
          <Text className="text-xs text-gray-400 px-1 py-4">Loading…</Text>
        ) : filtered.length === 0 ? (
          <Text className="text-xs text-gray-400 px-1 py-4">
            No events yet — tap + above to add one.
          </Text>
        ) : (
          filtered.map((event) => {
            const linkedEpisodeId = episodeIdByEventId.get(event.id);
            const episodeName = linkedEpisodeId ? episodeNameById.get(linkedEpisodeId) : undefined;
            const complication = event.type === 'note' && /complicat|reopen|infect/i.test(event.notes ?? '');
            return (
              <Pressable
                key={event.id}
                onPress={() => router.push({ pathname: '/event-add' as any, params: { id: event.id } })}
                className={`flex-row gap-3 rounded-2xl border p-3 ${complication ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
              >
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${complication ? 'bg-red-100' : 'bg-gray-200'}`}
                >
                  <Feather
                    name={typeIcon[event.type]}
                    size={16}
                    color={complication ? '#991B1B' : '#5F5E5A'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">
                    {formatDate(event.date)}
                    {event.status === 'cancelled' ? ' · Cancelled' : ''}
                  </Text>
                  <Text
                    className={`text-sm font-medium ${
                      event.status === 'cancelled'
                        ? 'text-gray-400 line-through'
                        : complication
                          ? 'text-red-900'
                          : 'text-gray-900'
                    }`}
                  >
                    {event.notes || event.diagnosis || event.treatment || event.type}
                  </Text>
                  {episodeName && (
                    <View className="mt-1 self-start rounded-full bg-gray-200 px-2 py-0.5">
                      <Text className="text-xs text-gray-700">{episodeName}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
