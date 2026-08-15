import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const events = [
  { icon: 'edit-3', title: 'Sudden limping started', sub: 'Jun 5 · owner note', danger: false },
  { icon: 'activity', title: 'Exam: instability found, pain meds started', sub: 'Jun 6 · Tierklinik Schwabing', danger: false },
  { icon: 'activity', title: 'Rupture diagnosed', sub: 'Jun 17 · Tierklinik Schwabing', danger: false },
  { icon: 'scissors', title: 'Surgery performed', sub: 'Jul 2', danger: false },
  { icon: 'alert-triangle', title: 'Wound reopened, treated conservatively', sub: 'Jul 15 · complication', danger: true },
] as const;

const meds = [
  { name: 'Meloxicam', sub: '0.5ml · once daily · Jun 6-20', tag: 'completed', tagBg: 'bg-neutral-100', tagText: 'text-neutral-600' },
  { name: 'Gabapentin', sub: '100mg · twice daily · since Jul 2', tag: 'active', tagBg: 'bg-blue-50', tagText: 'text-blue-900' },
];

const docs = ['surgery_report.pdf', 'xray_jun17.jpg', 'discharge_jul15.pdf'];

export default function EpisodeDetail() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row justify-between items-center mt-2 mb-4">
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#404040" />
          </Pressable>
          <Text className="text-xs text-neutral-400">Episode</Text>
          <Feather name="edit-2" size={16} color="#404040" />
        </View>

        <Text className="text-lg font-semibold text-neutral-900 mb-2">Right cruciate ligament rupture</Text>
        <View className="flex-row items-center flex-wrap gap-1.5 mb-4">
          <View className="bg-amber-100 rounded-md px-2 py-0.5">
            <Text className="text-[11px] text-amber-900">Active · recovering</Text>
          </View>
          <View className="bg-neutral-100 rounded-md px-2 py-0.5">
            <Text className="text-[11px] text-neutral-600">Orthopedic</Text>
          </View>
          <Text className="text-[11px] text-neutral-400">Since Jun 2026</Text>
        </View>

        <View className="bg-neutral-50 rounded-lg px-3 py-2.5 mb-5">
          <Text className="text-[10px] text-neutral-400 mb-0.5">Current status</Text>
          <Text className="text-xs text-neutral-600">Recovering, activity restricted</Text>
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">Timeline</Text>
        <View className="gap-3 mb-5">
          {events.map((e) => (
            <View key={e.title} className="flex-row gap-2">
              <Feather name={e.icon as any} size={14} color={e.danger ? '#B91C1C' : '#A3A3A3'} style={{ marginTop: 1 }} />
              <View className="flex-1">
                <Text className={`text-xs ${e.danger ? 'text-red-700' : 'text-neutral-900'}`}>{e.title}</Text>
                <Text className="text-[10px] text-neutral-400">{e.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">Medications</Text>
        <View className="gap-1.5 mb-5">
          {meds.map((m) => (
            <View key={m.name} className="flex-row items-center justify-between border border-neutral-200 rounded-lg px-2.5 py-2">
              <View className="flex-row items-center gap-2">
                <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
                <View>
                  <Text className="text-xs text-neutral-900">{m.name}</Text>
                  <Text className="text-[10px] text-neutral-400">{m.sub}</Text>
                </View>
              </View>
              <View className={`${m.tagBg} rounded-md px-2 py-0.5`}>
                <Text className={`text-[10px] ${m.tagText}`}>{m.tag}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">Documents</Text>
        <View className="flex-row flex-wrap gap-2">
          {docs.map((d) => (
            <View key={d} className="items-center w-16 gap-1">
              <View className="w-13 h-13 bg-neutral-50 rounded-lg items-center justify-center" style={{ width: 52, height: 52 }}>
                <Feather name="file" size={20} color="#737373" />
              </View>
              <Text className="text-[9px] text-neutral-400 text-center" numberOfLines={2}>{d}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}