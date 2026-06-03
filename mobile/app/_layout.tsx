import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import type { Session } from '@supabase/supabase-js';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SUPABASE_CONFIG_ERROR, supabase } from '@/lib/supabase';

import AuthScreen from './(tabs)/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

type StartupErrorBoundaryProps = {
  children: ReactNode;
};

type StartupErrorBoundaryState = {
  error: Error | null;
};

class StartupErrorBoundary extends Component<
  StartupErrorBoundaryProps,
  StartupErrorBoundaryState
> {
  state: StartupErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Startup render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.loadingPage}>
          <Text style={styles.errorTitle}>Food Checker could not start.</Text>
          <Text style={styles.loadingText}>Please close and reopen the app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('Food Checker startup: checking auth session');

    if (SUPABASE_CONFIG_ERROR) {
      setLoadingSession(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setLoadingSession(false);
    }).catch((error) => {
      console.error('Startup session check failed:', error);

      if (mounted) {
        setSession(null);
        setLoadingSession(false);
      }
    });

    let unsubscribe = () => {};

    try {
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setLoadingSession(false);
      });

      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      console.error('Auth state subscription failed:', error);
    }

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <StartupErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {loadingSession ? (
          <View style={styles.loadingPage}>
            <ActivityIndicator color="#fb923c" />
            <Text style={styles.loadingText}>Checking session...</Text>
          </View>
        ) : session ? (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        ) : (
          <AuthScreen />
        )}
        <StatusBar style="auto" />
      </ThemeProvider>
    </StartupErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#d1d5db',
    fontWeight: '800',
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
});
