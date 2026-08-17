import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import "../../global.css";

import { MedicationDraftProvider } from '@/context/medication-draft';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MedicationDraftProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </MedicationDraftProvider>
    </ThemeProvider>
  );
}