import { View, Text, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMedicationDraft } from '@/context/medication-draft';
import { getFrequencyPlan } from '@/lib/medications/frequency';

const timeToDate = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const dateToTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export default function QuickAddReminder() {
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const { getDraftMed, setMedicationReminder, nextUnconfirmedMed, clearDraftMeds } =
    useMedicationDraft();

  const medication = medicationId ? getDraftMed(medicationId) : undefined;
  const plan = getFrequencyPlan(medication?.frequency ?? 'Once daily');

  const [times, setTimes] = useState<string[]>(plan.defaultTimes);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  // Reset to this medication's own defaults when chaining to the next one.
  useEffect(() => {
    setTimes(plan.defaultTimes);
    setPickerIndex(null);
    // plan is derived from medication, which changes with medicationId —
    // that's the only thing that should reset the times.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicationId]);

  const updateTime = (index: number, value: string) => {
    setTimes((cur) => cur.map((t, i) => (i === index ? value : t)));
  };

  const handleDone = () => {
    if (medication) {
      setMedicationReminder(medication.id, {
        times: plan.requiresReminder ? times : [],
        frequencyType: plan.frequencyType,
        frequencyInterval: plan.frequencyInterval,
      });
    }

    const next = nextUnconfirmedMed(medication?.id);
    if (next) {
      // Another medication from this session still needs a reminder —
      // chain straight to it instead of dropping back to Home.
      router.replace({ pathname: '/quick-add/reminder', params: { medicationId: next.id } });
      return;
    }

    clearDraftMeds();
    router.replace('/');
  };

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
          <Text className="text-sm font-medium text-purple-900">
            {medication ? `${medication.name} ${medication.dose}` : 'Medication'}
          </Text>
          <Text className="text-xs text-purple-700">{medication?.frequency ?? ''}</Text>
        </View>

        {plan.requiresReminder ? (
          <View className="gap-3">
            <Text className="text-xs text-gray-500">
              When would you like to be reminded? We've set default times — tap one to change it.
            </Text>
            {plan.intakeLabels.map((label, index) => (
              <View
                key={label}
                className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-3 py-3"
              >
                <Text className="text-sm text-gray-800">{label}</Text>
                {Platform.OS === 'web' ? (
                  // @ts-ignore - raw HTML input, web only (matches capture.tsx's date input pattern)
                  <input
                    type="time"
                    value={times[index]}
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
                  <Pressable
                    onPress={() => setPickerIndex(index)}
                    className="px-3 py-1.5 rounded-lg bg-purple-100"
                  >
                    <Text className="text-sm font-semibold text-purple-900">{times[index]}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-gray-50 rounded-2xl px-3 py-4">
            <Text className="text-sm text-gray-700">
              This is marked as-needed — no reminder will be set.
            </Text>
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && pickerIndex !== null && (
        <DateTimePicker
          value={timeToDate(times[pickerIndex])}
          mode="time"
          display="default"
          onChange={(_event, selected) => {
            const index = pickerIndex;
            setPickerIndex(null);
            if (selected && index !== null) {
              updateTime(index, dateToTime(selected));
            }
          }}
        />
      )}

      <View className="px-4 pb-6 pt-2">
        <Pressable onPress={handleDone} className="items-center py-3.5 rounded-2xl bg-blue-600">
          <Text className="text-white font-semibold">Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
