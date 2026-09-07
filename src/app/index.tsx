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

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { medications } = useMedicationDraft();

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

        <SectionHeader>How she's doing</SectionHeader>
        <View className="mb-5 gap-2">
           <ConditionCard
            status="recovering"
            icon="activity"
            title="Cruciate ligament rupture"
            subtitle="Recovering · activity restricted"
            onPress={() => router.push('/episode-detail')}
          />
          <ConditionCard
            status="chronic"
            icon="heart"
            title="Arthritis"
            subtitle="Chronic, well managed · injection in 3 days"
            onPress={() => router.push('/episode-detail')}
          />
        </View>

        <SectionHeader>Today's medications</SectionHeader>
        <View className="mb-5 gap-1.5">
          {medications.length === 0 && (
            <Text className="text-xs text-neutral-400 py-1">
              No medications added yet — use "Add a medication" below.
            </Text>
          )}
          {medications.map((med) =>
            med.reminder.asNeeded ? (
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
