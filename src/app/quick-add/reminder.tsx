import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

const presets = ['Morning', 'Evening', 'With meals', 'Custom'];

export default function QuickAddReminder() {
  const [selected, setSelected] = useState<string[]>(['Morning', 'With meals']);
  const [asNeeded, setAsNeeded] = useState(false);

  const toggle = (p: string) =>
    setSelected((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Set reminder</Text>
      </View>

      <View className="flex-1 px-4 pt-6 gap-6">
        <View className="bg-purple-50 border border-purple-100 rounded-2xl p-3">
          <Text className="text-sm font-medium text-purple-900">Carprofen 75mg</Text>
          <Text className="text-xs text-purple-700">Twice daily, with food</Text>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">When?</Text>
          <View className="flex-row flex-wrap gap-2">
            {presets.map((p) => (
              <Pressable
                key={p}
                onPress={() => toggle(p)}
                disabled={asNeeded}
                className={`px-3 py-2 rounded-full border ${selected.includes(p) && !asNeeded ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${selected.includes(p) && !asNeeded ? 'text-white' : 'text-gray-700'}`}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => setAsNeeded(!asNeeded)} className="flex-row items-center gap-2.5">
          <View className={`w-5 h-5 rounded-md border items-center justify-center ${asNeeded ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
            {asNeeded && <Feather name="check" size={12} color="white" />}
          </View>
          <Text className="text-sm text-gray-800">As-needed — don't set a reminder</Text>
        </Pressable>
      </View>

      <View className="px-4 pb-6 pt-2">
        <Pressable onPress={() => router.push('/')} className="items-center py-3.5 rounded-2xl bg-blue-600">
          <Text className="text-white font-semibold">Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}