import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMedicationDraft } from '@/context/medication-draft';

const Tag = () => (
  <View className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full bg-blue-100">
    <Feather name="file-text" size={10} color="#1D4ED8" />
    <Text className="text-xs text-blue-800 font-medium">from document</Text>
  </View>
);

export default function QuickAddReview() {
  const { draftMeds, addDraftMed, updateDraftMed, findDuplicateCandidate } = useMedicationDraft();
  const [extractedId, setExtractedId] = useState<string | null>(null);

  useEffect(() => {
    // TODO: replace with real document extraction. For now this simulates
    // what it would hand back, so the rest of the flow (editing, confirming,
    // setting a reminder) works against real data instead of a hardcoded
    // display string.
    const existing = draftMeds.find((m) => m.source === 'extracted_from_document');
    if (existing) {
      setExtractedId(existing.id);
      return;
    }
    const med = addDraftMed({
      name: 'Carprofen',
      dose: '75mg',
      frequency: 'Twice daily, with food',
      source: 'extracted_from_document',
    });
    setExtractedId(med.id);
    // Only run once per visit to this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractedMed = draftMeds.find((m) => m.id === extractedId);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <View>
          <Text className="text-base font-semibold text-gray-900">Review extracted details</Text>
          <Text className="text-xs text-gray-500">Everything here is editable</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View className="gap-1.5">
          <Tag />
          <Text className="text-xs text-gray-500">Visit date</Text>
          <Text className="text-sm text-gray-900">Aug 15, 2026</Text>
        </View>

        <View className="gap-1.5">
          <Tag />
          <Text className="text-xs text-gray-500">Clinic</Text>
          <Text className="text-sm text-gray-900">Tierklinik Mitte, Berlin</Text>
        </View>

        <View className="gap-1.5">
          <Tag />
          <Text className="text-xs text-gray-500">Diagnosis</Text>
          <Text className="text-sm text-gray-900">Post-op follow-up, healing well</Text>
        </View>

        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Medications found</Text>
          {extractedMed && (
            <View className="gap-2">
              <View className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
                <Tag />
                <View className="flex-row items-center gap-1.5 mt-1.5">
                  <TextInput
                    value={extractedMed.name}
                    onChangeText={(text) => updateDraftMed(extractedMed.id, { name: text })}
                    className="text-sm font-medium text-purple-900 flex-1 py-0.5"
                  />
                  <TextInput
                    value={extractedMed.dose}
                    onChangeText={(text) => updateDraftMed(extractedMed.id, { dose: text })}
                    className="text-sm font-medium text-purple-900 py-0.5"
                    style={{ minWidth: 64, textAlign: 'right' }}
                  />
                </View>
                <TextInput
                  value={extractedMed.frequency}
                  onChangeText={(text) => updateDraftMed(extractedMed.id, { frequency: text })}
                  className="text-xs text-purple-700 py-0.5"
                />
                <Pressable
                  onPress={() => {
                    const duplicate = findDuplicateCandidate(extractedMed.id);
                    if (duplicate) {
                      router.push({
                        pathname: '/quick-add/duplicate-check',
                        params: { manualId: duplicate.id, extractedId: extractedMed.id },
                      });
                      return;
                    }
                    router.push({
                      pathname: '/quick-add/reminder',
                      params: { medicationId: extractedMed.id },
                    });
                  }}
                  className="self-start mt-2 px-3 py-1.5 rounded-full bg-purple-600"
                >
                  <Text className="text-xs text-white font-medium">Confirm & set reminder</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
