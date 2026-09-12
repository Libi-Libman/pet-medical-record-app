import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { insertPet } from '@/lib/queries/useOwnerPets';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Other'];

const dateToInput = (date: Date) => date.toISOString().split('T')[0];

export default function AddPet() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [sterilized, setSterilized] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await insertPet({
        name: name.trim(),
        species: species.toLowerCase(),
        breed: breed.trim() || null,
        sex,
        sterilized,
        birthDate: birthDate ? dateToInput(birthDate) : null,
        microchipNumber: microchipNumber.trim() || null,
      });
      if (session) {
        await queryClient.invalidateQueries({ queryKey: ['pets', 'owner', session.user.id] });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this pet.');
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
        <Text className="text-base font-semibold text-gray-900">Add a pet</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Luna"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Species</Text>
          <View className="flex-row gap-2">
            {SPECIES_OPTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpecies(s)}
                className={`px-3 py-2 rounded-full border ${species === s ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${species === s ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Breed</Text>
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="e.g. Labrador Retriever"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Sex</Text>
          <View className="flex-row gap-2">
            {(['male', 'female'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSex(s)}
                className={`px-3 py-2 rounded-full border ${sex === s ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium capitalize ${sex === s ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-2">Neutered / spayed</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSterilized(true)}
              className={`px-3 py-2 rounded-full border ${sterilized ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
            >
              <Text className={`text-xs font-medium ${sterilized ? 'text-white' : 'text-gray-700'}`}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => setSterilized(false)}
              className={`px-3 py-2 rounded-full border ${!sterilized ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
            >
              <Text className={`text-xs font-medium ${!sterilized ? 'text-white' : 'text-gray-700'}`}>No</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Birth date</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">
              {birthDate
                ? birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Not set'}
            </Text>
          </Pressable>
          {showPicker && (
            Platform.OS === 'web' ? (
              // @ts-ignore - raw HTML input, web only (matches capture.tsx's date input pattern)
              <input
                type="date"
                value={birthDate ? dateToInput(birthDate) : ''}
                max={dateToInput(new Date())}
                onChange={(e: any) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setBirthDate(new Date(y, m - 1, d));
                  setShowPicker(false);
                }}
                style={{
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 14,
                }}
              />
            ) : (
              <DateTimePicker
                value={birthDate ?? new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setBirthDate(selected);
                }}
              />
            )
          )}
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Microchip number</Text>
          <TextInput
            value={microchipNumber}
            onChangeText={setMicrochipNumber}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
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
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-2xl ${canSave ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <Feather name="plus" size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : 'Save pet'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
