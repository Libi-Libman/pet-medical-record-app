import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import '../../global.css';

import { MedicationDraftProvider } from '@/context/medication-draft';
import { initQueryClient } from '@/lib/query-client';
import { initTRPCClient, TRPCProvider } from '@/lib/trpc';
import { QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync();

const trpcClient = initTRPCClient();
const queryClient = initQueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <MedicationDraftProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </MedicationDraftProvider>
        </ThemeProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
