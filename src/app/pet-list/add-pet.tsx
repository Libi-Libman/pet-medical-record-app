import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useActivePet } from '@/context/active-pet';
import { insertPet, updatePet, deletePet } from '@/lib/queries/useOwnerPets';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Other'];

const dateToInput = (date: Date) => date.toISOString().split('T')[0];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AddPet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { session } = useAuth();
  const { pets } = useActivePet();
  const existing = isEditing ? pets.find((p) => p.id === id) : undefined;
  const queryClient = useQueryClient();

  const [name, setName] = useState(existing?.name ?? '');
  const [species, setSpecies] = useState(existing ? capitalize(existing.species) : 'Dog');
  const [breed, setBreed] = useState(existing?.breed ?? '');
  const [sex, setSex] = useState<'male' | 'female' | null>(existing?.sex ?? null);
  const [sterilized, setSterilized] = useState(existing?.sterilized ?? false);
  const [birthDate, setBirthDate] = useState<Date | null>(
    existing?.birthDate ? new Date(existing.birthDate + 'T00:00:00') : null
  );
  const [showPicker, setShowPicker] = useState(false);
  const [microchipNumber, setMicrochipNumber] = useState(existing?.microchipNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // `existing` can still be undefined at mount (the owner-pets query not
  // resolved yet — e.g. a direct page load on this URL) — the useState
  // initializers above only run once, so backfill the rest of the form
  // once it arrives rather than leaving it permanently blank.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    setName(existing.name);
    setSpecies(capitalize(existing.species));
    setBreed(existing.breed ?? '');
    setSex(existing.sex);
    setSterilized(existing.sterilized);
    setBirthDate(existing.birthDate ? new Date(existing.birthDate + 'T00:00:00') : null);
    setMicrochipNumber(existing.microchipNumber ?? '');
  }, [existing]);

  const canSave = name.trim().length > 0 && !!sex && !saving && !deleting;

  const invalidatePets = async () => {
    if (session) {
      await queryClient.invalidateQueries({ queryKey: ['pets', 'owner', session.user.id] });
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        species: species.toLowerCase(),
        breed: breed.trim() || null,
        sex,
        sterilized,
        birthDate: birthDate ? dateToInput(birthDate) : null,
        microchipNumber: microchipNumber.trim() || null,
      };
      if (isEditing && id) {
        await updatePet(id, payload);
      } else {
        await insertPet(payload);
      }
      await invalidatePets();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this pet.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePet(id);
      await invalidatePets();
      // The active-pet context falls back to another remaining pet on its
      // own once this pet drops out of the owner-pets query, so there's
      // nothing else to clean up here.
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this pet.');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    const message = `Delete ${existing?.name ?? 'this pet'}? This cannot be undone.`;
    if (Platform.OS === 'web') {
      // @ts-ignore - web-only global
      if (typeof window !== 'undefined' && window.confirm(message)) {
        doDelete();
      }
      return;
    }
    Alert.alert(`Delete ${existing?.name ?? 'this pet'}?`, 'This cannot be undone.', [
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
          <Text className="text-base font-semibold text-gray-900">{isEditing ? 'Edit pet' : 'Add a pet'}</Text>
        </View>
        {isEditing && (
          <Pressable onPress={handleDelete} hitSlop={10} disabled={deleting}>
            <Feather name="trash-2" size={18} color="#991B1B" />
          </Pressable>
        )}
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
          <Text className="text-xs text-gray-500 mb-2">Sex (required)</Text>
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
                onValueChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setBirthDate(selected);
                }}
                onDismiss={() => setShowPicker(false)}
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
          <Feather name={isEditing ? 'check' : 'plus'} size={16} color={canSave ? 'white' : '#9CA3AF'} />
          <Text className={`font-semibold ${canSave ? 'text-white' : 'text-gray-400'}`}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save pet'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
