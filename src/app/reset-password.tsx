import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

// The reset-password link Supabase emails (see auth.tsx's requestPasswordReset)
// carries short-lived recovery tokens as a URL fragment, e.g.
// petapp://reset-password#access_token=...&refresh_token=...&type=recovery
// Our Supabase client has detectSessionInUrl: false (chosen to avoid
// surprises on native), so this screen turns those tokens into a real
// session itself via setSession before letting anyone pick a new password.
function parseTokensFromUrl(url: string): { access_token: string; refresh_token: string } | null {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return null;
  const params = new URLSearchParams(url.slice(hashIndex + 1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export default function ResetPassword() {
  const { completePasswordReset } = useAuth();
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const establishSession = async (url: string | null) => {
      const tokens = url ? parseTokensFromUrl(url) : null;
      if (!tokens) {
        setStatus('invalid');
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      setStatus(error ? 'invalid' : 'ready');
    };

    if (Platform.OS === 'web') {
      establishSession(typeof window !== 'undefined' ? window.location.href : null);
    } else {
      // Not live-verified on native yet — there's no dev build to test a real
      // deep link against (see repo-audit notes on native testing being
      // blocked). This mirrors the standard Expo Linking pattern for
      // cold-start deep links; worth a real click-through once a dev build exists.
      Linking.getInitialURL().then(establishSession);
    }

    const subscription = Linking.addEventListener('url', ({ url }) => establishSession(url));
    return () => subscription.remove();
  }, []);

  const passwordValid = password.length >= 8;
  const canSubmit = passwordValid && password === confirmPassword;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const { error } = await completePasswordReset(password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    setDone(true);
  };

  if (status === 'checking') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (status === 'invalid') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center px-6 gap-4">
          <Text className="text-sm text-gray-900 text-center">
            This password reset link is invalid or has expired.
          </Text>
          <Pressable onPress={() => router.replace('/login')} className="items-center py-3">
            <Text className="text-sm text-blue-700">Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center px-6 gap-4">
          <Text className="text-sm text-gray-900 text-center">Your password has been updated.</Text>
          <Pressable
            onPress={() => router.replace('/')}
            className="items-center py-3 rounded-2xl bg-blue-600"
          >
            <Text className="text-sm font-semibold text-white">Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-lg font-semibold text-gray-900 text-center">Set a new password</Text>
        <View>
          <Text className="text-xs text-gray-500 mb-1">New password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor="#6B7280"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        <View>
          <Text className="text-xs text-gray-500 mb-1">Confirm new password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your new password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
          />
        </View>
        {password.length > 0 && !passwordValid && (
          <Text className="text-xs text-amber-700">Password must be at least 8 characters.</Text>
        )}
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text className="text-xs text-red-600">Passwords don't match.</Text>
        )}
        {error && <Text className="text-xs text-red-600">{error}</Text>}
        <Pressable
          disabled={!canSubmit || busy}
          onPress={handleSubmit}
          className={`items-center py-3.5 rounded-2xl ${canSubmit && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-semibold ${canSubmit ? 'text-white' : 'text-gray-400'}`}>
              Update password
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
