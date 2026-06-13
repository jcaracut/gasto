import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ProfileProvider, useProfile } from '@/contexts/ProfileContext';
import { ThemeProviderCustom, useTheme } from '@/contexts/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { isDark } = useTheme();
  const { hasOnboarded, isReady } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  // Gate the app behind onboarding: send first-time users to the welcome
  // screen, and bounce them to the tabs once they've picked a name.
  useEffect(() => {
    if (!isReady) return;
    const onWelcome = segments[0] === 'welcome';
    if (!hasOnboarded && !onWelcome) {
      router.replace('/welcome');
    } else if (hasOnboarded && onWelcome) {
      router.replace('/(tabs)');
    }
  }, [hasOnboarded, isReady, segments, router]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProviderCustom>
      <ProfileProvider>
        <RootNavigator />
      </ProfileProvider>
    </ThemeProviderCustom>
  );
}
