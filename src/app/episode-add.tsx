import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { insertEpisode, EpisodeStatus } from '@/lib/queries/useEpisodes';

const STATUS_OPTIONS: { value: EpisodeStatus; label: string }[] = [
  { value: 'active', label: 'Active · being treated' },
  { value: 'chronic_active', label: 'Chronic · ongoing' },
  { value: 'monitoring', label: 'Monitoring' },
];

const dateToInput = (date: Date) => date.toISOString().split('T')[0];

export default function AddEpisode() {
  const { data: pets } = useOwnerPets();
  const petId = pets?.[0]?.id;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<EpisodeStatus>('active');
  const [onsetDate, setOnsetDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !!petId && !saving;

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      await insertEpisode({
        petId,
        name: name.trim(),
        category: category.trim() || null,
        status,
        onsetDate: onsetDate ? dateToInput(onsetDate) : null,
        currentStatusNote: statusNote.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['episodes', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this condition.');
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
        <Text className="text-base font-semibold text-gray-900">Add a condition</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Condition name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cruciate ligament rupture"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Category</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Orthopedic"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                className={`px-3 py-2 rounded-full border ${status === opt.value ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${status === opt.value ? 'text-white' : 'text-gray-700'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Onset date</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">
              {onsetDate
                ? onsetDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Not set'}
            </Text>
          </Pressable>
          {showPicker && (
            Platform.OS === 'web' ? (
              // @ts-ignore - raw HTML input, web only (matches capture.tsx's date input pattern)
              <input
                type="date"
                value={onsetDate ? dateToInput(onsetDate) : ''}
                max={dateToInput(new Date())}
                onChange={(e: any) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setOnsetDate(new Date(y, m - 1, d));
                  setShowPicker(false);
                }}
                style={{ marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }}
              />
            ) : (
              <DateTimePicker
                value={onsetDate ?? new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setOnsetDate(selected);
                }}
              />
            )
          )}
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Current status note</Text>
          <TextInput
            value={statusNote}
            onChangeText={setStatusNote}
            multiline
            placeholder="e.g. Recovering, activity restricted"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 70 }}
          />
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
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canSave ? 'bg-amber-600' : 'bg-gray-200'}`}
        >
          <Feather name="plus" size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : 'Save condition'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
