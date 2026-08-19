import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

const Tag = () => (
  <View className="flex-row items-center gap-1 self-start px-2 py-0.5 rounded-full bg-blue-100">
    <Feather name="file-text" size={10} color="#1D4ED8" />
    <Text className="text-xs text-blue-800 font-medium">from document</Text>
  </View>
);

export default function QuickAddReview() {
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
          <View className="gap-2">
            <View className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
              <Tag />
              <Text className="text-sm font-medium text-purple-900 mt-1">Carprofen 75mg</Text>
              <Text className="text-xs text-purple-700">Twice daily, with food</Text>
              <Pressable
                onPress={() => router.push('/quick-add/reminder')}
                className="self-start mt-2 px-3 py-1.5 rounded-full bg-purple-600"
              >
                <Text className="text-xs text-white font-medium">Confirm & set reminder</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}