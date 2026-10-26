import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActivePet } from '@/context/active-pet';
import { useMedications, updateMedication, deleteMedication } from '@/lib/queries/useMedications';
import { FREQUENCY_PRESETS, getFrequencyPlan, describeFrequency } from '@/lib/medications/frequency';
import { parseDose, formatDose } from '@/lib/medications/parseDose';
import { todayInput } from '@/lib/dates/format';

// There's no edit/delete UI for medications yet (live QA, Oct 24 2026) --
// this closes that gap. "Discontinued" just sets end_date to today, same
// filter already used elsewhere (Home, vet-summary) to separate current
// from past medications -- no schema guessing, matches
// supabase/medications-schema-notes.md.
export default function MedicationEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { pet } = useActivePet();
  const { data: medications, isLoading } = useMedications(pet?.id);
  const existing = medications?.find((m) => m.id === id);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [times, setTimes] = useState<string[]>([]);
  const [discontinued, setDiscontinued] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same hydration-safe pattern as the other edit screens: `existing` can
  // still be undefined at mount (the medications query not resolved yet),
  // so backfill once it arrives instead of only seeding at mount.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    setName(existing.name);
    setDose(formatDose(existing.dose, existing.doseUnit));
    const label = describeFrequency(existing.frequencyType, existing.frequencyInterval);
    setFrequency(FREQUENCY_PRESETS.includes(label as (typeof FREQUENCY_PRESETS)[number]) ? label : 'Once daily');
    setTimes(existing.reminderTimes.map((t) => t.slice(0, 5)));
    setDiscontinued(!!existing.endDate && existing.endDate <= todayInput());
  }, [existing]);

  const plan = getFrequencyPlan(frequency);

  // Switching frequency preset changes how many reminder slots there are --
  // reset to that plan's defaults rather than leaving stale/mismatched times.
  const frequencyRef = useRef(frequency);
  useEffect(() => {
    if (frequencyRef.current === frequency) return;
    frequencyRef.current = frequency;
    setTimes(plan.defaultTimes);
    // plan is derived from frequency; only frequency changing should reset times.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequency]);

  const updateTime = (index: number, value: string) => {
    setTimes((cur) => cur.map((t, i) => (i === index ? value : t)));
  };

  const canSave = name.trim().length > 0 && dose.trim().length > 0 && !saving && !deleting;

  const invalidate = async () => {
    if (pet?.id) {
      await queryClient.invalidateQueries({ queryKey: ['medications', 'pet', pet.id] });
    }
  };

  const handleSave = async () => {
    if (!canSave || !id) return;
    setSaving(true);
    setError(null);
    try {
      const { dose: doseNum, doseUnit } = parseDose(dose.trim());
      await updateMedication(id, {
        name: name.trim(),
        dose: doseNum,
        doseUnit,
        frequencyType: plan.frequencyType,
        frequencyInterval: plan.frequencyInterval,
        reminderTimes: plan.requiresReminder ? times : [],
        endDate: discontinued ? (existing?.endDate && existing.endDate <= todayInput() ? existing.endDate : todayInput()) : null,
      });
      await invalidate();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this medication.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteMedication(id);
      await invalidate();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this medication.');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    const message = `Delete ${existing?.name ?? 'this medication'}? This cannot be undone.`;
    if (Platform.OS === 'web') {
      // @ts-ignore - web-only global
      if (typeof window !== 'undefined' && window.confirm(message)) {
        doDelete();
      }
      return;
    }
    Alert.alert(`Delete ${existing?.name ?? 'this medication'}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  if (!isLoading && id && medications && !existing) {
    // Query resolved and this id genuinely isn't in it -- e.g. tapped a
    // just-added medication before its real id replaced the local draft
    // id, or it was deleted elsewhere. Don't show a blank form forever.
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color="#2C2C2A" />
          </Pressable>
          <Text className="text-base font-semibold text-gray-900">Medication</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-gray-500 text-center">
            Couldn't find this medication -- it may have just been added and hasn't finished syncing yet,
            or it was removed. Go back and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={22} color="#2C2C2A" />
          </Pressable>
          <Text className="text-base font-semibold text-gray-900">Edit medication</Text>
        </View>
        <Pressable onPress={handleDelete} hitSlop={10} disabled={deleting}>
          <Feather name="trash-2" size={18} color="#991B1B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Medication name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Carprofen"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Dose</Text>
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="e.g. 75mg"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Frequency</Text>
          <View className="flex-row flex-wrap gap-2">
            {FREQUENCY_PRESETS.map((p) => (
              <Pressable
                key={p}
                onPress={() => setFrequency(p)}
                className={`px-3 py-2 rounded-full border ${frequency === p ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${frequency === p ? 'text-white' : 'text-gray-700'}`}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {plan.requiresReminder && (
          <View className="gap-3">
            <Text className="text-xs text-gray-500">Reminder times</Text>
            {plan.intakeLabels.map((label, index) => (
              <View
                key={label}
                className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-3 py-3"
              >
                <Text className="text-sm text-gray-800">{label}</Text>
                {Platform.OS === 'web' ? (
                  // @ts-ignore - raw HTML input, web only
                  <input
                    type="time"
                    value={times[index] ?? plan.defaultTimes[index]}
                    onChange={(e: any) => updateTime(index, e.target.value)}
                    style={{
                      padding: 6,
                      borderRadius: 8,
                      border: '1px solid #DDD6FE',
                      background: '#EDE9FE',
                      color: '#5B21B6',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Text className="px-3 py-1.5 rounded-lg bg-purple-100 text-sm font-semibold text-purple-900">
                    {times[index] ?? plan.defaultTimes[index]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setDiscontinued((cur) => !cur)}
          className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 border ${discontinued ? 'bg-neutral-100 border-neutral-300' : 'bg-white border-gray-200'}`}
        >
          <View className="flex-1 pr-2">
            <Text className="text-sm text-gray-800">Discontinued</Text>
            <Text className="text-xs text-gray-500">
              Stops showing on today's medications and current medications in the vet summary.
            </Text>
          </View>
          <Feather
            name={discontinued ? 'check-square' : 'square'}
            size={16}
            color={discontinued ? '#404040' : '#A3A3A3'}
          />
        </Pressable>

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
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canSave ? 'bg-purple-600' : 'bg-gray-200'}`}
        >
          <Feather name="check" size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : 'Save changes'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
