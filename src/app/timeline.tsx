import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

const episodes = ['All', 'Cruciate ligament rupture', 'Arthritis'];

const events = [
  {
    id: '1',
    date: 'Aug 10, 2026',
    type: 'visit',
    title: 'Follow-up exam',
    episode: 'Cruciate ligament rupture',
    complication: false,
  },
  {
    id: '2',
    date: 'Aug 3, 2026',
    type: 'complication',
    title: 'Swelling around incision site',
    episode: 'Cruciate ligament rupture',
    complication: true,
  },
  {
    id: '3',
    date: 'Jul 22, 2026',
    type: 'procedure',
    title: 'TPLO surgery',
    episode: 'Cruciate ligament rupture',
    complication: false,
  },
  {
    id: '4',
    date: 'Jul 15, 2026',
    type: 'visit',
    title: 'Diagnosis: cruciate ligament rupture',
    episode: 'Cruciate ligament rupture',
    complication: false,
  },
  {
    id: '5',
    date: 'Jun 28, 2026',
    type: 'note',
    title: 'Arthritis injection administered',
    episode: 'Arthritis',
    complication: false,
  },
  {
    id: '6',
    date: 'Jun 1, 2026',
    type: 'visit',
    title: 'Annual checkup',
    episode: null,
    complication: false,
  },
];

const typeIcon: Record<string, keyof typeof Feather.glyphMap> = {
  visit: 'user',
  note: 'edit-3',
  procedure: 'scissors',
  test: 'activity',
  complication: 'alert-triangle',
};

export default function Timeline() {
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? events : events.filter((e) => e.episode === filter);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Full timeline</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0 }}
        className="px-4 py-3"
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
      >
        {' '}
        {episodes.map((ep) => (
          <Pressable
            key={ep}
            onPress={() => setFilter(ep)}
            className={`rounded-full border px-3 py-1.5 ${filter === ep ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'}`}
          >
            <Text
              className={`text-xs font-medium ${filter === ep ? 'text-white' : 'text-gray-700'}`}
            >
              {ep}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
        {filtered.map((event) => (
          <View
            key={event.id}
            className={`flex-row gap-3 rounded-2xl border p-3 ${event.complication ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
          >
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${event.complication ? 'bg-red-100' : 'bg-gray-200'}`}
            >
              <Feather
                name={typeIcon[event.type]}
                size={16}
                color={event.complication ? '#991B1B' : '#5F5E5A'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">{event.date}</Text>
              <Text
                className={`text-sm font-medium ${event.complication ? 'text-red-900' : 'text-gray-900'}`}
              >
                {event.title}
              </Text>
              {event.episode && (
                <View className="mt-1 self-start rounded-full bg-gray-200 px-2 py-0.5">
                  <Text className="text-[10px] text-gray-700">{event.episode}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
