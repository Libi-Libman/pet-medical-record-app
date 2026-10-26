import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useAccountDeletion } from '@/lib/queries/useAccountDeletion';

export default function Settings() {
  const { session, signOut } = useAuth();
  const { requestDeletion } = useAccountDeletion();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  const handleConfirmDelete = async () => {
    setBusy(true);
    setError(null);
    const { error } = await requestDeletion();
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    setRequested(true);
  };

  const handleDoneAfterRequest = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-2 pb-4 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={20} color="#374151" />
        </Pressable>
        <Text className="text-base font-semibold text-gray-900">Settings</Text>
      </View>

      <View className="px-4 gap-6">
        <View className="gap-1">
          <Text className="text-xs text-gray-500">Signed in as</Text>
          <Text className="text-sm text-gray-900">{session?.user.email}</Text>
        </View>

        <Pressable onPress={signOut} className="flex-row items-center gap-2 py-2">
          <Feather name="log-out" size={16} color="#374151" />
          <Text className="text-sm text-gray-900">Sign out</Text>
        </Pressable>

        <View className="border-t border-gray-100 pt-6 gap-3">
          <Text className="text-sm font-semibold text-red-700">Delete account</Text>

          {!confirming && !requested && (
            <>
              <Text className="text-xs text-gray-500">
                Permanently deletes your account and every pet record associated with it.
                This can't be undone.
              </Text>
              <Pressable onPress={() => setConfirming(true)} className="items-start py-2">
                <Text className="text-sm text-red-600">Delete my account</Text>
              </Pressable>
            </>
          )}

          {confirming && !requested && (
            <View className="gap-3">
              <Text className="text-xs text-gray-700">
                This permanently deletes your account and all of your pets' records. We'll
                process the deletion within 30 days and email you a confirmation once it's
                done. This can't be undone — are you sure?
              </Text>
              {error && <Text className="text-xs text-red-600">{error}</Text>}
              <View className="flex-row gap-3">
                <Pressable
                  disabled={busy}
                  onPress={handleConfirmDelete}
                  className="items-center py-2.5 px-4 rounded-xl bg-red-600"
                >
                  {busy ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">
                      Yes, delete my account
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => setConfirming(false)}
                  className="items-center py-2.5 px-4 rounded-xl bg-gray-100"
                >
                  <Text className="text-sm text-gray-700">Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {requested && (
            <View className="gap-3">
              <Text className="text-xs text-gray-700">
                Your deletion request has been received. Your account and data will be
                deleted within 30 days, and we'll email you a confirmation once it's done.
              </Text>
              <Pressable
                onPress={handleDoneAfterRequest}
                className="items-center py-2.5 px-4 rounded-xl bg-gray-900 self-start"
              >
                <Text className="text-sm font-semibold text-white">Sign out</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
