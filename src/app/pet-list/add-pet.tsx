import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useActivePet } from '@/context/active-pet';
import { insertPet, updatePet, deletePet, uploadPetPhoto, setPetPhotoUrl } from '@/lib/queries/useOwnerPets';
import { toDateInput as dateToInput } from '@/lib/dates/format';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Other'];

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(existing?.photoUrl ?? null);
  // Web-only for now (see uploadPetPhoto) -- holds a freshly-picked file
  // until save, when it actually uploads.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
    setPhotoUrl(existing.photoUrl ?? null);
  }, [existing]);

  const canSave =
    name.trim().length > 0 && !!sex && !saving && !deleting && !uploadingPhoto && (isEditing || !!session);

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
      let petId = id;
      if (isEditing && petId) {
        await updatePet(petId, payload);
      } else {
        if (!session) throw new Error('You need to be signed in to add a pet.');
        const created = await insertPet(session.user.id, payload);
        petId = created.id;
      }

      // A newly-picked photo only uploads at save time -- for a brand new
      // pet there's no id to build the storage path from until the insert
      // above returns one.
      if (photoFile && petId && session) {
        setUploadingPhoto(true);
        try {
          const url = await uploadPetPhoto(session.user.id, petId, photoFile);
          await setPetPhotoUrl(petId, url);
        } finally {
          setUploadingPhoto(false);
        }
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
        <View className="items-center">
          <Text className="text-xs text-gray-500 mb-2 self-start">Photo</Text>
          <View className="h-24 w-24 rounded-full bg-gray-100 items-center justify-center overflow-hidden border border-gray-200">
            {photoPreview || photoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- web-only raw <img>, matches the raw <input> pattern used for date/time fields elsewhere
              <img
                src={photoPreview ?? photoUrl ?? undefined}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Feather name="camera" size={22} color="#9CA3AF" />
            )}
          </View>
          {Platform.OS === 'web' ? (
            <View className="mt-2 items-center gap-1">
              {/* @ts-ignore - raw HTML input, web only (this app is web-only for now; see src/lib/queries/useOwnerPets.ts's uploadPetPhoto) */}
              <input
                type="file"
                accept="image/*"
                onChange={(e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
                style={{ fontSize: 12 }}
              />
              {(photoPreview || photoUrl) && (
                <Pressable
                  onPress={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                    setPhotoUrl(null);
                  }}
                >
                  <Text className="text-xs text-red-700">Remove photo</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text className="mt-2 text-xs text-gray-400 text-center">
              Photo upload isn't available on this device yet -- add one from the web version for now.
            </Text>
          )}
        </View>

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
            {uploadingPhoto ? 'Uploading photo…' : saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save pet'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
