import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SectionHeader } from '@/components/section-header';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-4 mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-neutral-400">Good morning</Text>
          <Feather name="bell" size={18} color="#0C447C" />
        </View>

        <View className="mb-4 flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <MaterialCommunityIcons name="paw" size={26} color="#92400E" />
          </View>
          <View>
            <Text className="text-lg font-semibold text-neutral-900">Luna</Text>
            <Text className="text-xs text-neutral-500">Golden retriever · 7 years</Text>
          </View>
        </View>

        <View className="mb-5 flex-row gap-2">
          <Pressable
            onPress={() => {
               router.push('/quick-add/capture');
            }}
            className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50"
          >
            <Feather name="plus" size={15} color="#0C447C" />
            <Text className="text-xs font-semibold text-blue-900">Add entry</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/vet-summary')}
            className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-blue-300"
          >
            <Feather name="file-text" size={15} color="#0C447C" />
            <Text className="text-xs font-semibold text-blue-900">Vet summary</Text>
          </Pressable>
        </View>

        <SectionHeader>How she's doing</SectionHeader>
        <View className="mb-5 gap-2">
          <Pressable
            onPress={() => router.push('/episode-detail')}
            className="flex-row items-center gap-2.5 rounded-2xl bg-amber-100 px-3 py-2.5"
          >
            <Feather name="activity" size={18} color="#92400E" />
            <View>
              <Text className="text-xs font-semibold text-amber-900">
                Cruciate ligament rupture
              </Text>
              <Text className="text-xs text-amber-900">Recovering · activity restricted</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/episode-detail')}
            className="flex-row items-center gap-2.5 rounded-2xl bg-green-100 px-3 py-2.5"
          >
            <Feather name="heart" size={18} color="#166534" />
            <View>
              <Text className="text-xs font-semibold text-green-900">Arthritis</Text>
              <Text className="text-xs text-green-900">
                Chronic, well managed · injection in 3 days
              </Text>
            </View>
          </Pressable>
        </View>

        <SectionHeader>Today's medications</SectionHeader>
        <View className="mb-5 gap-1.5">
          <View className="flex-row items-center gap-2.5 rounded-lg border border-neutral-200 px-2.5 py-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-purple-100">
              <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
            </View>
            <Text className="flex-1 text-xs text-neutral-900">Gabapentin · 8:00</Text>
            <Feather name="check-circle" size={18} color="#166534" />
          </View>
          <View className="flex-row items-center gap-2.5 rounded-lg border border-neutral-200 px-2.5 py-2">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-purple-100">
              <MaterialCommunityIcons name="pill" size={13} color="#5B21B6" />
            </View>
            <Text className="flex-1 text-xs text-neutral-900">Gabapentin · 20:00</Text>
            <Feather name="circle" size={18} color="#A8A29E" />
          </View>
           <Pressable
              onPress={() => router.push('/quick-add/add-medication')}
              className="flex-row items-center gap-2 py-2"
            >
              <Feather name="plus-circle" size={16} color="#1D4ED8" />
              <Text className="text-xs text-blue-700 font-medium">Add a medication</Text>
            </Pressable>
        </View>
        <SectionHeader>Coming up</SectionHeader>
        <View className="mb-5 flex-row items-center gap-2.5 rounded-2xl bg-blue-50 px-3 py-2.5">
          <Feather name="calendar" size={18} color="#0C447C" />
          <View>
            <Text className="text-xs font-semibold text-blue-900">Follow-up recheck</Text>
            <Text className="text-xs text-blue-900">Tierklinik Schwabing · 20 Aug</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/timeline')}
          className="mb-2 flex-row items-center justify-between"
        >
          <SectionHeader>Recent activity</SectionHeader>
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
