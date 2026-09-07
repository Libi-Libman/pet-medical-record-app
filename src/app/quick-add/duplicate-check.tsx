import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMedicationDraft } from '@/context/medication-draft';

const SourceTag = ({ extracted }: { extracted: boolean }) => (
  <View
    className={`flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full ${
      extracted ? 'bg-blue-100' : 'bg-gray-100'
    }`}
  >
    <Feather
      name={extracted ? 'file-text' : 'edit-3'}
      size={10}
      color={extracted ? '#1D4ED8' : '#4B5563'}
    />
    <Text className={`text-xs font-medium ${extracted ? 'text-blue-800' : 'text-gray-700'}`}>
      {extracted ? 'from document' : 'you entered'}
    </Text>
  </View>
);

export default function DuplicateCheck() {
  const { manualId, extractedId } = useLocalSearchParams<{
    manualId?: string;
    extractedId?: string;
  }>();
  const { getDraftMed, removeDraftMed, clearDraftMeds } = useMedicationDraft();

  const manualMed = manualId ? getDraftMed(manualId) : undefined;
  const extractedMed = extractedId ? getDraftMed(extractedId) : undefined;

  const goToReminder = (id: string) =>
    router.replace({ pathname: '/quick-add/reminder', params: { medicationId: id } });

  const goHome = () => {
    clearDraftMeds();
    router.replace('/');
  };

  const handleSame = () => {
    // Keep the extracted entry (it came from the actual document) and drop
    // the manual duplicate, then set one reminder instead of two.
    if (manualMed) removeDraftMed(manualMed.id);
    if (extractedMed) goToReminder(extractedMed.id);
    else goHome();
  };

  const handleDifferent = () => {
    // Keep both — set a reminder for the extracted one first; the reminder
    // screen will chain to the manual one afterward since it's still
    // unconfirmed.
    if (extractedMed) goToReminder(extractedMed.id);
    else if (manualMed) goToReminder(manualMed.id);
    else goHome();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Possible duplicate</Text>
      </View>

      <View className="flex-1 px-4 pt-6 gap-4">
        <Text className="text-xs text-gray-500">
          This looks like a medication you already added. Is it the same one?
        </Text>

        {manualMed && (
          <View className="bg-gray-50 border border-gray-200 rounded-2xl p-3 gap-1">
            <SourceTag extracted={false} />
            <Text className="text-sm font-medium text-gray-900 mt-1">
              {manualMed.name} {manualMed.dose}
            </Text>
            <Text className="text-xs text-gray-600">{manualMed.frequency}</Text>
          </View>
        )}

        {extractedMed && (
          <View className="bg-purple-50 border border-purple-100 rounded-2xl p-3 gap-1">
            <SourceTag extracted />
            <Text className="text-sm font-medium text-purple-900 mt-1">
              {extractedMed.name} {extractedMed.dose}
            </Text>
            <Text className="text-xs text-purple-700">{extractedMed.frequency}</Text>
          </View>
        )}
      </View>

      <View className="px-4 pb-6 pt-2 gap-2">
        <Pressable onPress={handleSame} className="items-center py-3.5 rounded-2xl bg-purple-600">
          <Text className="text-white font-semibold">Yes, same medication</Text>
        </Pressable>
        <Pressable
          onPress={handleDifferent}
          className="items-center py-3.5 rounded-2xl border border-gray-300"
        >
          <Text className="text-gray-700 font-semibold">No, these are different</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
