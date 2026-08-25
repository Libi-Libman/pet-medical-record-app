import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function VetSummary() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Vet summary</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ gap: 20, paddingBottom: 32 }}>
        {/* Header */}
        <View>
          <Text className="text-xl font-bold text-gray-900">Luna</Text>
          <Text className="text-sm text-gray-600">Golden Retriever · Female (spayed) · 4 years old · 28 kg</Text>
          <Text className="text-xs text-gray-400 mt-0.5">Microchip: 900215001234567</Text>
        </View>

        {/* Allergies - safety critical, top */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-3">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="alert-triangle" size={16} color="#991B1B" />
            <Text className="text-sm font-semibold text-red-900">Allergies</Text>
          </View>
          <Text className="text-sm text-red-900">Penicillin — hives, confirmed reaction (2024)</Text>
        </View>

        {/* Current medications */}
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="package" size={16} color="#6B21A8" />
            <Text className="text-sm font-semibold text-purple-900">Current medications</Text>
          </View>
          <View className="bg-purple-50 border border-purple-100 rounded-2xl divide-y divide-purple-100">
            <View className="p-3">
              <Text className="text-sm font-medium text-purple-900">Carprofen 75mg</Text>
              <Text className="text-xs text-purple-700">Twice daily, with food · started Jul 22</Text>
            </View>
            <View className="p-3">
              <Text className="text-sm font-medium text-purple-900">Cartrophen (injection)</Text>
              <Text className="text-xs text-purple-700">Every 3 weeks · ongoing</Text>
            </View>
          </View>
        </View>

        {/* Active conditions - one-line rollups */}
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Active conditions</Text>
          <View className="gap-1.5">
            <Text className="text-sm text-gray-800">• Cruciate ligament rupture (right) — post-op recovery, TPLO Jul 22</Text>
            <Text className="text-sm text-gray-800">• Arthritis — chronic, well managed</Text>
          </View>
        </View>

        {/* Restrictions */}
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Current restrictions</Text>
          <Text className="text-sm text-gray-800">Activity restricted — leash walks only, no jumping/stairs until Sep 1</Text>
        </View>

        {/* Surgical history */}
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Surgical history</Text>
          <Text className="text-sm text-gray-800">TPLO surgery, right hind leg — Jul 22, 2026</Text>
        </View>

        {/* Recent clinical events */}
        <View>
          <Text className="text-sm font-semibold text-gray-900 mb-2">Recent clinical events (90 days)</Text>
          <View className="gap-1.5">
            <Text className="text-sm text-gray-800">Aug 10 — Follow-up exam, healing well</Text>
            <Text className="text-sm text-red-800">Aug 3 — Swelling around incision site, resolved with antibiotics</Text>
            <Text className="text-sm text-gray-800">Jul 22 — TPLO surgery</Text>
          </View>
        </View>

        {/* Primary contact */}
        <View className="bg-gray-50 rounded-2xl p-3">
          <Text className="text-sm font-semibold text-gray-900">Primary vet</Text>
          <Text className="text-sm text-gray-700">Dr. Weber — Tierklinik Mitte, Berlin</Text>
        </View>

        <Pressable onPress={() => router.push('/timeline')} className="flex-row items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600">
          <Feather name="clock" size={16} color="white" />
          <Text className="text-white font-medium text-sm">View full record</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}