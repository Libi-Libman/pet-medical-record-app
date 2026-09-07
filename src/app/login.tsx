import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';

export default function Login() {
  const { sendCode, verifyCode, signInAsMockUser } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSendCode = email.trim().length > 3 && email.includes('@');
  const canVerify = code.trim().length >= 6;

  const handleSendCode = async () => {
    setBusy(true);
    setError(null);
    const { error } = await sendCode(email.trim());
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    setStep('code');
  };

  const handleVerify = async () => {
    setBusy(true);
    setError(null);
    const { error } = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (error) setError(error);
    // On success, the auth state listener updates the session and the root layout
    // redirects away from /login automatically.
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="items-center gap-2 mb-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Feather name="heart" size={24} color="#92400E" />
          </View>
          <Text className="text-lg font-semibold text-gray-900">Pet medical record</Text>
          <Text className="text-xs text-gray-500 text-center">
            Sign in to see your pets' records
          </Text>
        </View>

        {step === 'email' ? (
          <View className="gap-3">
            <View>
              <Text className="text-xs text-gray-500 mb-1">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
            {error && <Text className="text-xs text-red-600">{error}</Text>}
            <Pressable
              disabled={!canSendCode || busy}
              onPress={handleSendCode}
              className={`items-center py-3.5 rounded-2xl ${canSendCode && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-semibold ${canSendCode ? 'text-white' : 'text-gray-400'}`}>
                  Send code
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-xs text-gray-500">
              We sent a 6-digit code to {email}. Enter it below.
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#6B7280"
              keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
              maxLength={6}
              className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900 tracking-widest"
            />
            {error && <Text className="text-xs text-red-600">{error}</Text>}
            <Pressable
              disabled={!canVerify || busy}
              onPress={handleVerify}
              className={`items-center py-3.5 rounded-2xl ${canVerify && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-semibold ${canVerify ? 'text-white' : 'text-gray-400'}`}>
                  Verify & sign in
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStep('email')} disabled={busy}>
              <Text className="text-xs text-blue-700 text-center">Use a different email</Text>
            </Pressable>
          </View>
        )}

        {__DEV__ && (
          <Pressable onPress={signInAsMockUser} className="items-center py-2">
            <Text className="text-xs text-gray-400">Continue with mock data (dev only)</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
