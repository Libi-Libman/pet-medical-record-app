import { View, Text, TextInput, Pressable, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { useActivePet } from '@/context/active-pet';
import { useEpisodes } from '@/lib/queries/useEpisodes';
import {
  useEvents,
  useEpisodeEventLinks,
  insertEvent,
  updateEvent,
  deleteEvent,
  EventType,
  EventStatus,
} from '@/lib/queries/useEvents';

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'visit', label: 'Vet visit' },
  { value: 'note', label: 'Note' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'test', label: 'Test' },
  { value: 'appointment', label: 'Appointment' },
];

const dateToInput = (date: Date) => date.toISOString().split('T')[0];

export default function AddEvent() {
  const { id, type: initialType, episodeId: initialEpisodeId } = useLocalSearchParams<{
    id?: string;
    type?: EventType;
    episodeId?: string;
  }>();
  const isEditing = !!id;

  const { pet } = useActivePet();
  const petId = pet?.id;
  const { data: episodes } = useEpisodes(petId);
  const { data: events } = useEvents(petId);
  const { data: links } = useEpisodeEventLinks(petId);
  const existing = isEditing ? events?.find((e) => e.id === id) : undefined;
  const existingLink = isEditing ? links?.find((l) => l.eventId === id) : undefined;
  const queryClient = useQueryClient();

  const [type, setType] = useState<EventType>(existing?.type ?? initialType ?? 'note');
  const [date, setDate] = useState(existing ? new Date(existing.date + 'T00:00:00') : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [clinicName, setClinicName] = useState(existing?.clinicName ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [diagnosis, setDiagnosis] = useState(existing?.diagnosis ?? '');
  const [treatment, setTreatment] = useState(existing?.treatment ?? '');
  const [episodeId, setEpisodeId] = useState<string | null>(initialEpisodeId ?? null);
  const [cancelled, setCancelled] = useState(existing?.status === 'cancelled');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The existing link loads asynchronously (a second query), so seed the
  // episode selection once it arrives rather than only at mount.
  useEffect(() => {
    if (isEditing && existingLink) setEpisodeId(existingLink.episodeId);
  }, [isEditing, existingLink?.episodeId]);

  // `existing` can still be undefined at mount (events query not resolved
  // yet, e.g. a direct page load on this URL) — the useState initializers
  // above only run once, so backfill the rest of the form once it arrives.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || !existing) return;
    hydratedRef.current = true;
    setType(existing.type);
    setDate(new Date(existing.date + 'T00:00:00'));
    setClinicName(existing.clinicName ?? '');
    setNotes(existing.notes ?? '');
    setDiagnosis(existing.diagnosis ?? '');
    setTreatment(existing.treatment ?? '');
    setCancelled(existing.status === 'cancelled');
  }, [existing]);

  const isAppointment = type === 'appointment';
  const canSave =
    !!petId && !saving && !deleting && (notes.trim().length > 0 || diagnosis.trim().length > 0 || isAppointment);

  const handleSave = async () => {
    if (!canSave || !petId) return;
    setSaving(true);
    setError(null);
    try {
      // Any event dated in the future is still "scheduled" regardless of
      // type, not just appointments — a visit or test booked ahead of time
      // shouldn't be marked completed before it happens. An explicit
      // "cancelled" mark always wins, and editing without touching it
      // keeps it cancelled rather than silently flipping back to
      // scheduled/completed.
      const status: EventStatus = cancelled
        ? 'cancelled'
        : dateToInput(date) > dateToInput(new Date())
          ? 'scheduled'
          : 'completed';
      const payload = {
        type,
        date: dateToInput(date),
        clinicName: clinicName.trim() || null,
        notes: notes.trim() || null,
        diagnosis: diagnosis.trim() || null,
        treatment: treatment.trim() || null,
        status,
        episodeId,
      };
      if (isEditing && id) {
        await updateEvent(id, payload);
      } else {
        await insertEvent({ petId, ...payload });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'pet', petId] }),
        queryClient.invalidateQueries({ queryKey: ['episode-events', 'pet', petId] }),
      ]);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this entry.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteEvent(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', 'pet', petId] }),
        queryClient.invalidateQueries({ queryKey: ['episode-events', 'pet', petId] }),
      ]);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this entry.');
      setDeleting(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore - web-only global
      if (typeof window !== 'undefined' && window.confirm('Delete this entry? This cannot be undone.')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
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
            {isEditing ? 'Edit entry' : isAppointment ? 'Add appointment' : 'Add timeline entry'}
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
          <Text className="text-xs text-gray-500 mb-2">Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setType(opt.value)}
                className={`px-3 py-2 rounded-full border ${type === opt.value ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
              >
                <Text className={`text-xs font-medium ${type === opt.value ? 'text-white' : 'text-gray-700'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">{isAppointment ? 'Appointment date' : 'Date'}</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5"
          >
            <Feather name="calendar" size={16} color="#5F5E5A" />
            <Text className="text-sm text-gray-900">
              {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </Pressable>
          {showPicker && (
            Platform.OS === 'web' ? (
              // @ts-ignore - raw HTML input, web only (matches capture.tsx's date input pattern)
              <input
                type="date"
                value={dateToInput(date)}
                onChange={(e: any) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setDate(new Date(y, m - 1, d));
                  setShowPicker(false);
                }}
                style={{ marginTop: 8, padding: 8, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14 }}
              />
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onValueChange={(_event, selected) => {
                  setShowPicker(false);
                  if (selected) setDate(selected);
                }}
                onDismiss={() => setShowPicker(false)}
              />
            )
          )}
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Clinic</Text>
          <TextInput
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="Optional"
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>

        <View>
          <Text className="text-xs text-gray-500 mb-1">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={isAppointment ? 'e.g. Follow-up recheck' : 'What happened?'}
            placeholderTextColor="#6B7280"
            className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-900"
            style={{ textAlignVertical: 'top', minHeight: 90 }}
          />
        </View>

        {!isAppointment && (
          <>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Diagnosis</Text>
              <TextInput
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="Optional"
                placeholderTextColor="#6B7280"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 mb-1">Treatment</Text>
              <TextInput
                value={treatment}
                onChangeText={setTreatment}
                placeholder="Optional"
                placeholderTextColor="#6B7280"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
          </>
        )}

        {episodes && episodes.length > 0 && (
          <View>
            <Text className="text-xs text-gray-500 mb-2">Link to a condition (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {episodes.map((ep) => (
                <Pressable
                  key={ep.id}
                  onPress={() => setEpisodeId((cur) => (cur === ep.id ? null : ep.id))}
                  className={`px-3 py-2 rounded-full border ${episodeId === ep.id ? 'bg-amber-600 border-amber-600' : 'bg-white border-gray-300'}`}
                >
                  <Text className={`text-xs font-medium ${episodeId === ep.id ? 'text-white' : 'text-gray-700'}`}>
                    {ep.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {isEditing && (isAppointment || existing?.status === 'scheduled' || existing?.status === 'cancelled') && (
          <Pressable
            onPress={() => setCancelled((cur) => !cur)}
            className={`flex-row items-center justify-between rounded-xl px-3 py-2.5 border ${cancelled ? 'bg-neutral-100 border-neutral-300' : 'bg-white border-gray-200'}`}
          >
            <Text className="text-sm text-gray-800">Cancelled</Text>
            <Feather name={cancelled ? 'check-square' : 'square'} size={16} color={cancelled ? '#404040' : '#A3A3A3'} />
          </Pressable>
        )}

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
            {saving ? 'Saving…' : isEditing ? 'Save changes' : isAppointment ? 'Save appointment' : 'Save entry'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
