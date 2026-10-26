import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useActivePet } from '@/context/active-pet';
import { useEpisodes, insertEpisode, updateEpisode, deleteEpisode, EpisodeStatus } from '@/lib/queries/useEpisodes';
import { toDateInput as dateToInput } from '@/lib/dates/format';

const STATUS_OPTIONS: { value: EpisodeStatus; label: string }[] = [
  { value: 'active', label: 'Active · being treated' },
  { value: 'chronic_active', label: 'Chronic · ongoing' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
];


export default function AddEpisode() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { pet } = useActivePet();
  const petId = pet?.id;
  const { data: episodes } = useEpisodes(petId);
  const existing = isEditing ? episodes?.find((e) => e.id === id) : undefined;
  const queryClient = useQueryClient();

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [status, setStatus] = useState<EpisodeStatus>(existing?.status ?? 'active');
  const [onsetDate, setOnsetDate] = useState<Date | null>(
    existing?.onsetDate ? new Date(existing.onsetDate + 'T00:00:00') : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [statusNote, setStatusNote] = useState(existing?.currentStatusNote ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `existing` can still be undefined at mount (e.g. the episodes query
  // hasn't resolved yet — a direct page load/refresh on this URL rather
  // than navigating here from a screen that already had it cached). The
  // useState initializers above only run once, so without this the form
  // would stay blank forever once the real data arrives. Only backfills
  // once, so it doesn't clobber edits already in progress.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    setName(existing.name);
    setCategory(existing.category ?? '');
    setStatus(existing.status);
    setOnsetDate(existing.onsetDate ? new Date(existing.onsetDate + 'T00:00:00') : null);
    setStatusNote(existing.currentStatusNote ?? '');
  }, [existing]);

  const canSave = name.trim().length > 0 && !!petId && !saving && !deleting;

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        status,
        onsetDate: onsetDate ? dateToInput(onsetDate) : null,
        currentStatusNote: statusNote.trim() || null,
      };
      if (isEditing && id) {
        await updateEpisode(id, payload);
      } else {
        await insertEpisode({ petId, ...payload });
      }
      await queryClient.invalidateQueries({ queryKey: ['episodes', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this condition.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEpisode(id);
      await queryClient.invalidateQueries({ queryKey: ['episodes', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this condition.');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore - web-only global
      if (typeof window !== 'undefined' && window.confirm('Delete this condition? This cannot be undone.')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Delete this condition?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color="#2C2C2A" />
          </Pressable>
          <Text className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit condition' : 'Add a condition'}
          </Text>
        </View>
        {isEditing && (
          <Pressable onPress={handleDelete} hitSlop={10} disabled={deleting}>
            <Feather name="trash-2" size={18} color="#991B1B" />
          </Pressable>
        )}
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
                onValueChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setOnsetDate(selected);
                }}
                onDismiss={() => setShowPicker(false)}
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
          <Feather name={isEditing ? 'check' : 'plus'} size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save condition'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
