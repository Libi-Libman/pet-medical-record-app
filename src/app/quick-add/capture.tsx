import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMedicationDraft } from '@/context/medication-draft';


export default function QuickAddCapture() {
  const [note, setNote] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const { draftMeds, clearDraftMeds } = useMedicationDraft();
  const isToday = date.toDateString() === new Date().toDateString();
  const formattedDate = isToday
    ? `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const canSave = note.trim().length > 0 || hasPhoto || draftMeds.length > 0;

  const handleSave = () => {
    const goTo = hasPhoto ? '/quick-add/review' : '/';
    clearDraftMeds();
    router.push(goTo);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="x" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Add entry</Text>
        <View style={{ width: 22 }} />
      </View>

      <View className="flex-1 px-4 pt-6 gap-4">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Date</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">{formattedDate}</Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">What happened?</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="e.g. Limping on back left leg since this morning"
            placeholderTextColor="#6B7280"
            className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 120 }}
          />
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setHasPhoto(true)}
             className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 border ${hasPhoto ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
          >
            <Feather name="camera" size={16} color={hasPhoto ? '#1D4ED8' : '#5F5E5A'} />
            <Text className={`text-xs ${hasPhoto ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>
              {hasPhoto ? 'Photo attached' : 'Attach a photo'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/quick-add/add-medication?from=capture')}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 border bg-purple-50 border-purple-200"
          >
            <Feather name="plus-circle" size={16} color="#6B21A8" />
            <Text className="text-xs text-purple-900 font-medium">Add medication</Text>
          </Pressable>
        </View>

        {draftMeds.length > 0 && (
          <View className="gap-2">
            {draftMeds.map((med) => (
              <View key={med.id} className="flex-row items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                <Feather name="package" size={14} color="#6B21A8" />
                <Text className="text-xs text-purple-900 font-medium">{med.name} {med.dose}</Text>
                <Text className="text-xs text-purple-700">· {med.frequency}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="px-4 pb-6 pt-2">
        <Pressable
          disabled={!canSave}
          onPress={handleSave}
          className={`items-center py-3.5 rounded-2xl ${canSave ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}