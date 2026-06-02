import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadSession() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setMessage(error.message);
    }

    setUserEmail(data.session?.user.email ?? null);
    setLoading(false);
  }

  async function signUp() {
    if (!email.trim() || !password) {
      setMessage('Enter an email and password.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Account created. Check your email if confirmation is enabled.');
    }

    setLoading(false);
  }

  async function signIn() {
    if (!email.trim() || !password) {
      setMessage('Enter an email and password.');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Signed in.');
    }

    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Signed out.');
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>
            Auth is powered by Supabase. Once connected, preferences and scan
            history will be tied to your account.
          </Text>
        </View>

        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fb923c" />
              <Text style={styles.loadingText}>Working...</Text>
            </View>
          ) : null}

          {userEmail ? (
            <>
              <Text style={styles.label}>Signed in as</Text>
              <Text style={styles.signedInEmail}>{userEmail}</Text>

              <Pressable style={styles.dangerButton} onPress={signOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="#6b7280"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="#6b7280"
              />

              <Pressable style={styles.primaryButton} onPress={signIn}>
                <Text style={styles.buttonText}>Sign In</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={signUp}>
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </Pressable>
            </>
          )}

          {message ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  page: {
    flex: 1,
    padding: 18,
    gap: 18,
  },
  heroCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eyebrow: {
    color: '#fdba74',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.28)',
    gap: 12,
  },
  label: {
    color: '#fed7aa',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
    marginTop: 8,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dangerButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    marginTop: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontWeight: '900',
  },
  signedInEmail: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#d1d5db',
    fontWeight: '800',
  },
  messageCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
  },
  messageText: {
    color: '#fde68a',
    fontWeight: '800',
    lineHeight: 20,
  },
});
