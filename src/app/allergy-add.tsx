import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useActivePet } from '@/context/active-pet';
import { useAllergies, insertAllergy, updateAllergy, deleteAllergy } from '@/lib/queries/useAllergies';
import { toDateInput as dateToInput } from '@/lib/dates/format';

const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AddAllergy() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { pet } = useActivePet();
  const petId = pet?.id;
  const { data: allergies } = useAllergies(petId);
  const existing = isEditing ? allergies?.find((a) => a.id === id) : undefined;
  const queryClient = useQueryClient();

  const [substance, setSubstance] = useState(existing?.substance ?? '');
  const [reaction, setReaction] = useState(existing?.reaction ?? '');
  const [severity, setSeverity] = useState<string | null>(
    existing?.severity ? capitalize(existing.severity) : null
  );
  const [dateIdentified, setDateIdentified] = useState<Date | null>(
    existing?.dateIdentified ? new Date(existing.dateIdentified + 'T00:00:00') : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `existing` can still be undefined at mount (allergies query not
  // resolved yet) — backfill once it arrives rather than leaving the form
  // blank forever.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    setSubstance(existing.substance);
    setReaction(existing.reaction ?? '');
    setSeverity(existing.severity ? capitalize(existing.severity) : null);
    setDateIdentified(existing.dateIdentified ? new Date(existing.dateIdentified + 'T00:00:00') : null);
  }, [existing]);

  const canSave = substance.trim().length > 0 && !!petId && !saving && !deleting;

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        substance: substance.trim(),
        reaction: reaction.trim() || null,
        severity: severity ? severity.toLowerCase() : null,
        dateIdentified: dateIdentified ? dateToInput(dateIdentified) : null,
      };
      if (isEditing && id) {
        await updateAllergy(id, payload);
      } else {
        await insertAllergy({ petId, ...payload });
      }
      await queryClient.invalidateQueries({ queryKey: ['allergies', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this allergy.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAllergy(id);
      await queryClient.invalidateQueries({ queryKey: ['allergies', 'pet', petId] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this allergy.');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore - web-only global
      if (typeof window !== 'undefined' && window.confirm('Delete this allergy? This cannot be undone.')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Delete this allergy?', 'This cannot be undone.', [
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
            {isEditing ? 'Edit allergy' : 'Add an allergy'}
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
                onValueChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setDateIdentified(selected);
                }}
                onDismiss={() => setShowPicker(false)}
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
          <Feather name={isEditing ? 'check' : 'plus'} size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save allergy'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
