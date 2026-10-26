import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/auth';

type Mode = 'signin' | 'signup' | 'forgot';

export default function Login() {
  const { signIn, signUp, requestPasswordReset, signInAsMockUser } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const passwordValid = password.length >= 8;
  const canSignIn = emailValid && password.length > 0;
  const canSignUp = emailValid && passwordValid && password === confirmPassword;
  const canRequestReset = emailValid;

  const resetMessages = () => {
    setError(null);
    setNotice(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    resetMessages();
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async () => {
    setBusy(true);
    resetMessages();
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(error);
    // On success, the auth state listener updates the session and the root layout
    // redirects away from /login automatically.
  };

  const handleSignUp = async () => {
    setBusy(true);
    resetMessages();
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsConfirmation) {
      setNotice('Account created. Check your email to confirm it, then come back and sign in.');
      setMode('signin');
      setPassword('');
      setConfirmPassword('');
    }
    // If no confirmation is required, the auth state listener signs the person in directly.
  };

  const handleRequestReset = async () => {
    setBusy(true);
    resetMessages();
    const { error } = await requestPasswordReset(email.trim());
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    setNotice('Check your email for a link to reset your password.');
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
            {mode === 'signup'
              ? 'Create an account to keep your pets’ records'
              : mode === 'forgot'
                ? 'Reset your password'
                : 'Sign in to see your pets’ records'}
          </Text>
        </View>

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

          {mode !== 'forgot' && (
            <View>
              <Text className="text-xs text-gray-500 mb-1">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
            </View>
          )}

          {mode === 'signup' && (
            <View>
              <Text className="text-xs text-gray-500 mb-1">Confirm password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-900"
              />
              {password.length > 0 && !passwordValid && (
                <Text className="text-xs text-amber-700 mt-1">Password must be at least 8 characters.</Text>
              )}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text className="text-xs text-red-600 mt-1">Passwords don't match.</Text>
              )}
            </View>
          )}

          {error && <Text className="text-xs text-red-600">{error}</Text>}
          {notice && <Text className="text-xs text-green-700">{notice}</Text>}

          {mode === 'signin' && (
            <Pressable
              disabled={!canSignIn || busy}
              onPress={handleSignIn}
              className={`items-center py-3.5 rounded-2xl ${canSignIn && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-semibold ${canSignIn ? 'text-white' : 'text-gray-400'}`}>Sign in</Text>
              )}
            </Pressable>
          )}

          {mode === 'signup' && (
            <Pressable
              disabled={!canSignUp || busy}
              onPress={handleSignUp}
              className={`items-center py-3.5 rounded-2xl ${canSignUp && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-semibold ${canSignUp ? 'text-white' : 'text-gray-400'}`}>
                  Create account
                </Text>
              )}
            </Pressable>
          )}

          {mode === 'forgot' && (
            <Pressable
              disabled={!canRequestReset || busy}
              onPress={handleRequestReset}
              className={`items-center py-3.5 rounded-2xl ${canRequestReset && !busy ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-semibold ${canRequestReset ? 'text-white' : 'text-gray-400'}`}>
                  Send reset link
                </Text>
              )}
            </Pressable>
          )}

          {mode === 'signin' && (
            <>
              <Pressable onPress={() => switchMode('forgot')} disabled={busy}>
                <Text className="text-xs text-blue-700 text-center">Forgot password?</Text>
              </Pressable>
              <Pressable onPress={() => switchMode('signup')} disabled={busy}>
                <Text className="text-xs text-blue-700 text-center">Don't have an account? Create one</Text>
              </Pressable>
            </>
          )}
          {mode === 'signup' && (
            <Pressable onPress={() => switchMode('signin')} disabled={busy}>
              <Text className="text-xs text-blue-700 text-center">Already have an account? Sign in</Text>
            </Pressable>
          )}
          {mode === 'forgot' && (
            <Pressable onPress={() => switchMode('signin')} disabled={busy}>
              <Text className="text-xs text-blue-700 text-center">Back to sign in</Text>
            </Pressable>
          )}
        </View>

        {__DEV__ && (
          <Pressable onPress={signInAsMockUser} className="items-center py-2">
            <Text className="text-xs text-gray-400">Continue with mock data (dev only)</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
