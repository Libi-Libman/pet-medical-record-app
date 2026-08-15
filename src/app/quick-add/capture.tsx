import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';

export default function QuickAddCapture() {
  const [note, setNote] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const canSave = note.trim().length > 0 || hasPhoto;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Add entry</Text>
        <View style={{ width: 22 }} />
      </View>

      <View className="flex-1 px-4 pt-6 gap-4">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Date</Text>
          <View className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">Today, Aug 15</Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="text-xs text-gray-500 mb-1">What happened?</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="e.g. Limping on back left leg since this morning"
            className="flex-1 bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 140 }}
          />
        </View>

        <Pressable
          onPress={() => setHasPhoto(true)}
          className={`flex-row items-center gap-2.5 rounded-xl px-3 py-3 border ${hasPhoto ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
        >
          <Feather name="camera" size={18} color={hasPhoto ? '#1D4ED8' : '#5F5E5A'} />
          <Text className={`text-sm ${hasPhoto ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>
            {hasPhoto ? 'Photo attached' : 'Attach a photo (discharge letter, etc.)'}
          </Text>
        </Pressable>
      </View>

      <View className="px-4 pb-6 pt-2">
        <Pressable
          disabled={!canSave}
          onPress={() => router.push(hasPhoto ? '/quick-add/review' : '/')}
          className={`items-center py-3.5 rounded-2xl ${canSave ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}