import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { insertAllergy } from '@/lib/queries/useAllergies';

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];
const dateToInput = (date: Date) => date.toISOString().split('T')[0];

export default function AddAllergy() {
  const { data: pets } = useOwnerPets();
  const petId = pets?.[0]?.id;
  const queryClient = useQueryClient();

  const [substance, setSubstance] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState<string | null>(null);
  const [dateIdentified, setDateIdentified] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = substance.trim().length > 0 && !!petId && !saving;

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      await insertAllergy({
        petId,
        substance: substance.trim(),
        reaction: reaction.trim() || null,
        severity: severity ? severity.toLowerCase() : null,
        dateIdentified: dateIdentified ? dateToInput(dateIdentified) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ['allergies', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this allergy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Add an allergy</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Substance</Text>
          <TextInput
            value={substance}
            onChangeText={setSubstance}
            placeholder="e.g. Penicillin"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Reaction</Text>
          <TextInput
            value={reaction}
            onChangeText={setReaction}
            placeholder="e.g. Hives, confirmed reaction"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-2">Severity</Text>
          <View className="flex-row gap-2">
            {SEVERITY_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSeverity((cur) => (cur === s ? null : s))}
                className={`px-3 py-2 rounded-full border ${severity === s ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${severity === s ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Date identified</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">
              {dateIdentified
                ? dateIdentified.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Not set'}
            </Text>
          </Pressable>
          {showPicker && (
            Platform.OS === 'web' ? (
              // @ts-ignore - raw HTML input, web only
              <input
                type="date"
                value={dateIdentified ? dateToInput(dateIdentified) : ''}
                max={dateToInput(new Date())}
                onChange={(e: any) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setDateIdentified(new Date(y, m - 1, d));
                  setShowPicker(false);
                }}
                style={{ marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }}
              />
            ) : (
              <DateTimePicker
                value={dateIdentified ?? new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setDateIdentified(selected);
                }}
              />
            )
          )}
        </View>
        {error && (
          <View className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <Text className="text-xs text-red-700">{error}</Text>
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-2">
        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canSave ? 'bg-red-600' : 'bg-gray-200'}`}
        >
          <Feather name="plus" size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : 'Save allergy'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
