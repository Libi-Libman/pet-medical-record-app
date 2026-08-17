import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useMedicationDraft } from '@/context/medication-draft';

const presets = ['Once daily', 'Twice daily', 'As needed', 'Custom'];

export default function AddMedication() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { addDraftMed } = useMedicationDraft();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');

  const canAdd = name.trim().length > 0 && dose.trim().length > 0;

  const handleAdd = () => {
    addDraftMed({ name: name.trim(), dose: dose.trim(), frequency });
    if (from === 'capture') {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color="#2C2C2A" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Add medication</Text>
      </View>

      <View className="flex-1 px-4 pt-6 gap-4">
        <View>
          <Text className="text-xs text-gray-500 mb-1">Medication name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Carprofen"
            accessibilityLabel="Medication name"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Dose</Text>
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="e.g. 75mg"
            accessibilityLabel="Dose"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Frequency</Text>
          <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup">
            {presets.map((p) => (
              <Pressable
                key={p}
                onPress={() => setFrequency(p)}
                accessibilityRole="radio"
                accessibilityState={{ checked: frequency === p }}
                accessibilityLabel={p}
                className={`px-3 py-2 rounded-full border ${frequency === p ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${frequency === p ? 'text-white' : 'text-gray-700'}`}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View className="px-4 pb-6 pt-2">
        <Pressable
          disabled={!canAdd}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          accessibilityLabel="Add medication"
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canAdd ? 'bg-purple-600' : 'bg-gray-200'}`}
        >
          <Feather name="plus" size={16} color={canAdd ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canAdd ? 'text-white' : 'text-gray-400'}`}>Add medication</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}