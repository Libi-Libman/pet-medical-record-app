import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import "../../global.css";

import { AuthProvider, useAuth } from '@/context/auth';
import { MedicationDraftProvider } from '@/context/medication-draft';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return null; // splash screen is still up

  SplashScreen.hideAsync();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="episode-detail" />
        <Stack.Screen name="timeline" />
        <Stack.Screen name="vet-summary" />
        <Stack.Screen name="quick-add/capture" />
        <Stack.Screen name="quick-add/add-medication" />
        <Stack.Screen name="quick-add/review" />
        <Stack.Screen name="quick-add/reminder" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <MedicationDraftProvider>
          <RootNavigator />
        </MedicationDraftProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}