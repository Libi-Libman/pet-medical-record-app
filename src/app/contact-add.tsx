import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerPets } from '@/lib/queries/useOwnerPets';
import { insertContact } from '@/lib/queries/useContacts';

export default function AddContact() {
  const { data: pets } = useOwnerPets();
  const petId = pets?.[0]?.id;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState<'primary' | 'specialist'>('primary');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !!petId && !saving;

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      await insertContact({
        petId,
        name: name.trim(),
        clinicName: clinicName.trim() || null,
        role,
        specialty: specialty.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: null,
        isPrimary: role === 'primary',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts', 'pet', petId] }),
        queryClient.invalidateQueries({ queryKey: ['pets', 'owner'] }),
      ]);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this contact.');
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
        <Text className="text-base font-semibold text-gray-900">Add a vet contact</Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Vet name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dr. Weber"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Clinic name</Text>
          <TextInput
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="e.g. Tierklinik Mitte"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-2">Role</Text>
          <View className="flex-row gap-2">
            {(['primary', 'specialist'] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={`px-3 py-2 rounded-full border ${role === r ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium capitalize ${role === r ? 'text-white' : 'text-gray-700'}`}>{r}</Text>
              </Pressable>
            ))}
          </View>
          {role === 'primary' && (
            <Text className="text-xs text-gray-400 mt-2">
              Setting this as primary will replace this pet's current primary vet.
            </Text>
          )}
        </View>
        {role === 'specialist' && (
          <View>
            <Text className="text-xs text-gray-500 mb-1">Specialty</Text>
            <TextInput
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g. Orthopedics"
              placeholderTextColor="#6B7280"
              className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
            />
          </View>
        )}
        <View>
          <Text className="text-xs text-gray-500 mb-1">Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            autoCapitalize="none"
            keyboardType="email-address"
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
            {saving ? 'Saving…' : 'Save contact'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
