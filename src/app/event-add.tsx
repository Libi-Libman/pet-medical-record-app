import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { useEpisodes } from '@/lib/queries/useEpisodes';
import { insertEvent, EventType, EventStatus } from '@/lib/queries/useEvents';

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'visit', label: 'Vet visit' },
  { value: 'note', label: 'Note' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'test', label: 'Test' },
  { value: 'appointment', label: 'Appointment' },
];

const dateToInput = (date: Date) => date.toISOString().split('T')[0];

export default function AddEvent() {
  const { type: initialType, episodeId: initialEpisodeId } = useLocalSearchParams<{ type?: EventType; episodeId?: string }>();
  const { data: pets } = useOwnerPets();
  const petId = pets?.[0]?.id;
  const { data: episodes } = useEpisodes(petId);
  const queryClient = useQueryClient();

  const [type, setType] = useState<EventType>(initialType ?? 'note');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [episodeId, setEpisodeId] = useState<string | null>(initialEpisodeId ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAppointment = type === 'appointment';
  const canSave = !!petId && !saving && (notes.trim().length > 0 || diagnosis.trim().length > 0 || isAppointment);

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      const status: EventStatus | null = isAppointment ? 'scheduled' : 'completed';
      await insertEvent({
        petId,
        type,
        date: dateToInput(date),
        clinicName: clinicName.trim() || null,
        notes: notes.trim() || null,
        diagnosis: diagnosis.trim() || null,
        treatment: treatment.trim() || null,
        status,
        episodeId,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'pet', petId] }),
        queryClient.invalidateQueries({ queryKey: ['episode-events', 'pet', petId] }),
      ]);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this entry.');
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
        <Text className="text-base font-semibold text-gray-900">
          {isAppointment ? 'Add appointment' : 'Add timeline entry'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-2">Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                className={`px-3 py-2 rounded-full border ${type === opt.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${type === opt.value ? 'text-white' : 'text-gray-700'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">{isAppointment ? 'Appointment date' : 'Date'}</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">
              {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </Pressable>
          {showPicker && (
            Platform.OS === 'web' ? (
              // @ts-ignore - raw HTML input, web only (matches capture.tsx's date input pattern)
              <input
                type="date"
                value={dateToInput(date)}
                onChange={(e: any) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setDate(new Date(y, m - 1, d));
                  setShowPicker(false);
                }}
                style={{ marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }}
              />
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setDate(selected);
                }}
              />
            )
          )}
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Clinic</Text>
          <TextInput
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={isAppointment ? 'e.g. Follow-up recheck' : 'What happened?'}
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 90 }}
          />
        </View>

        {!isAppointment && (
          <>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Diagnosis</Text>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Optional"
                placeholderTextColor="#6B7280"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Treatment</Text>
              <TextInput
                value={treatment}
                onChangeText={setTreatment}
                placeholder="Optional"
                placeholderTextColor="#6B7280"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
          </>
        )}

        {episodes && episodes.length > 0 && (
          <View>
            <Text className="text-xs text-gray-500 mb-2">Link to a condition (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {episodes.map((ep) => (
                <Pressable
                  key={ep.id}
                  onPress={() => setEpisodeId((cur) => (cur === ep.id ? null : ep.id))}
                  className={`px-3 py-2 rounded-full border ${episodeId === ep.id ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`text-xs font-medium ${episodeId === ep.id ? 'text-white' : 'text-gray-700'}`}>
                    {ep.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

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
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canSave ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <Feather name="plus" size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : isAppointment ? 'Save appointment' : 'Save entry'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
