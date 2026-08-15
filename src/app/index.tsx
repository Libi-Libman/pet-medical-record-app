import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row justify-between items-center mt-2 mb-4">
          <Text className="text-xs text-neutral-400">Good morning</Text>
          <Feather name="bell" size={18} color="#0C447C" />
        </View>

        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-14 h-14 rounded-full bg-amber-100 items-center justify-center">
            <MaterialCommunityIcons name="paw" size={26} color="#92400E" />
          </View>
          <View>
            <Text className="text-lg font-semibold text-neutral-900">Luna</Text>
            <Text className="text-xs text-neutral-500">Golden retriever · 7 years</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mb-5">
          <Pressable
            onPress={() => router.push('/quick-add/capture')}
            className="flex-1 h-10 rounded-lg bg-blue-50 border border-blue-300 items-center justify-center flex-row gap-1.5"
          >
            <Feather name="plus" size={15} color="#0C447C" />
            <Text className="text-xs font-semibold text-blue-900">Add entry</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/vet-summary')}
            className="flex-1 h-10 rounded-lg border border-blue-300 items-center justify-center flex-row gap-1.5"
          >
            <Feather name="file-text" size={15} color="#0C447C" />
            <Text className="text-xs font-semibold text-blue-900">Vet summary</Text>
          </Pressable>
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">How she's doing</Text>
        <View className="gap-2 mb-5">
          <Pressable
            onPress={() => router.push('/episode-detail')}
            className="flex-row items-center gap-2.5 bg-amber-100 rounded-2xl px-3 py-2.5"
          >
            <Feather name="activity" size={18} color="#92400E" />
            <View>
              <Text className="text-xs font-semibold text-amber-900">Cruciate ligament rupture</Text>
              <Text className="text-[11px] text-amber-900">Recovering · activity restricted</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/episode-detail')}
            className="flex-row items-center gap-2.5 bg-green-100 rounded-2xl px-3 py-2.5"
          >
            <Feather name="heart" size={18} color="#166534" />
            <View>
              <Text className="text-xs font-semibold text-green-900">Arthritis</Text>
              <Text className="text-[11px] text-green-900">Chronic, well managed · injection in 3 days</Text>
            </View>
          </Pressable>
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">Today's medications</Text>
        <View className="gap-1.5 mb-5">
          <View className="flex-row items-center gap-2.5 border border-neutral-200 rounded-lg px-2.5 py-2">
            <View className="w-7 h-7 rounded-full bg-purple-100 items-center justify-center">
              <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
            </View>
            <Text className="flex-1 text-xs text-neutral-900">Gabapentin · 8:00</Text>
            <Feather name="check-circle" size={18} color="#166534" />
          </View>
          <View className="flex-row items-center gap-2.5 border border-neutral-200 rounded-lg px-2.5 py-2">
            <View className="w-7 h-7 rounded-full bg-purple-100 items-center justify-center">
              <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
            </View>
            <Text className="flex-1 text-xs text-neutral-900">Gabapentin · 20:00</Text>
            <Feather name="circle" size={18} color="#A8A29E" />
          </View>
        </View>

        <Text className="text-sm font-semibold text-neutral-900 mb-2">Coming up</Text>
        <View className="flex-row items-center gap-2.5 bg-blue-50 rounded-2xl px-3 py-2.5 mb-5">
          <Feather name="calendar" size={18} color="#0C447C" />
          <View>
            <Text className="text-xs font-semibold text-blue-900">Follow-up recheck</Text>
            <Text className="text-[11px] text-blue-900">Tierklinik Schwabing · 20 Aug</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push('/timeline')} className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-neutral-900">Recent activity</Text>
          <Text className="text-xs text-blue-800">View all</Text>
        </Pressable>
        <View className="gap-1.5">
          <Text className="text-xs text-neutral-500">15 Jul · Sutures removed, wound reopened</Text>
          <Text className="text-xs text-neutral-500">2 Jul · Surgery performed</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}