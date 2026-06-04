import { useCallback, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';
import {
  API_BASE_URL,
  getHealth,
  getHistory,
  getProfile,
} from '@/lib/api';
import { SUPABASE_CONFIG_ERROR, supabase } from '@/lib/supabase';
import {
  BETA_LINKS,
  DATA_DELETION_SUBJECT,
  FOOD_CHECKER_DISCLAIMER,
  SUPPORT_SUBJECT,
} from '@/constants/beta';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [selectedPreferenceCount, setSelectedPreferenceCount] = useState(0);
  const [scanHistoryCount, setScanHistoryCount] = useState(0);
  const [apiStatus, setApiStatus] = useState('Not checked');
  const [message, setMessage] = useState('');

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const loadAccountStatus = useCallback(async () => {
    setRefreshingStatus(true);

    try {
      const [profile, history, health] = await Promise.all([
        getProfile(),
        getHistory(),
        getHealth(),
      ]);

      setSelectedPreferenceCount(profile.selected_rules?.length ?? 0);
      setScanHistoryCount(history.length);
      setApiStatus(health.status === 'ok' ? 'Online' : health.status);
    } catch (error) {
      console.error('Account status refresh failed:', error);
      setApiStatus('Could not reach API');
    } finally {
      setRefreshingStatus(false);
    }
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setMessage('');

    if (SUPABASE_CONFIG_ERROR) {
      setMessage(SUPABASE_CONFIG_ERROR);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage(error.message);
      }

      setUserEmail(data.session?.user.email ?? null);

      if (data.session) {
        await loadAccountStatus();
      }
    } catch (error) {
      console.error('Session load failed:', error);
      setUserEmail(null);
      setMessage('Could not load the saved session. Try signing in again.');
    } finally {
      setLoading(false);
    }
  }, [loadAccountStatus]);

  useEffect(() => {
    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);

      if (session) {
        loadAccountStatus();
      } else {
        setSelectedPreferenceCount(0);
        setScanHistoryCount(0);
        setApiStatus('Not checked');
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadAccountStatus, loadSession]);

  async function signUp() {
    if (!email.trim() || !password) {
      setMessage('Enter an email and password.');
      return;
    }

    if (SUPABASE_CONFIG_ERROR) {
      setMessage(SUPABASE_CONFIG_ERROR);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Account created. Check your email if confirmation is enabled.');
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      setMessage('Could not create account. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    if (!email.trim() || !password) {
      setMessage('Enter an email and password.');
      return;
    }

    if (SUPABASE_CONFIG_ERROR) {
      setMessage(SUPABASE_CONFIG_ERROR);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed in.');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      setMessage('Could not sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed out.');
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      setMessage('Could not sign out. Please close and reopen the app.');
    } finally {
      setLoading(false);
    }
  }

  async function openUrlOrMessage(url: string, fallbackMessage: string) {
    if (!url) {
      setMessage(fallbackMessage);
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Could not open URL:', error);
      setMessage(fallbackMessage);
    }
  }

  const legalSupportSection = (
    <View style={styles.linksCard}>
      <Text style={styles.sectionTitle}>Legal & Support</Text>

      <Pressable
        style={styles.linkButton}
        onPress={() =>
          openUrlOrMessage(
            BETA_LINKS.privacyPolicyUrl,
            'Privacy Policy link is unavailable.',
          )
        }
      >
        <Text style={styles.linkButtonText}>Privacy Policy</Text>
      </Pressable>

      <Pressable
        style={styles.linkButton}
        onPress={() =>
          openUrlOrMessage(
            BETA_LINKS.termsDisclaimerUrl,
            'Terms & Disclaimer link is unavailable.',
          )
        }
      >
        <Text style={styles.linkButtonText}>Terms & Disclaimer</Text>
      </Pressable>

      <Pressable
        style={styles.linkButton}
        onPress={() =>
          openUrlOrMessage(
            BETA_LINKS.supportUrl,
            `${SUPPORT_SUBJECT} link is unavailable.`,
          )
        }
      >
        <Text style={styles.linkButtonText}>Support</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>{userEmail ? 'Account' : 'Sign in'}</Text>
          <Text style={styles.subtitle}>
            Auth is powered by Supabase. Once connected, preferences and scan
            history will be tied to your account.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Working...</Text>
            </View>
          ) : null}

          {userEmail ? (
            <>
              <Text style={styles.label}>Signed in as</Text>
              <Text style={styles.signedInEmail}>{userEmail}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {selectedPreferenceCount}
                  </Text>
                  <Text style={styles.statLabel}>Preferences</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{scanHistoryCount}</Text>
                  <Text style={styles.statLabel}>Scans</Text>
                </View>
              </View>

              <View style={styles.statusCard}>
                <Text style={styles.sectionTitle}>Beta diagnostics</Text>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>API status</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      apiStatus === 'Online'
                        ? styles.statusOnline
                        : styles.statusWarning,
                    ]}
                  >
                    {apiStatus}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Endpoint</Text>
                  <Text style={styles.statusValue}>{API_BASE_URL}</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>App version</Text>
                  <Text style={styles.statusValue}>{appVersion}</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Build</Text>
                  <Text style={styles.statusValue}>Beta</Text>
                </View>
              </View>

              <View style={styles.disclaimerCard}>
                <Text style={styles.sectionTitle}>Important disclaimer</Text>
                <Text style={styles.disclaimerText}>
                  {FOOD_CHECKER_DISCLAIMER}
                </Text>
              </View>

              {legalSupportSection}

              <Pressable
                style={styles.secondaryButton}
                onPress={loadAccountStatus}
                disabled={refreshingStatus}
              >
                {refreshingStatus ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    Refresh Account Status
                  </Text>
                )}
              </Pressable>

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
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={colors.textSubtle}
              />

              <Pressable style={styles.primaryButton} onPress={signIn}>
                <Text style={styles.buttonText}>Sign In</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={signUp}>
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </Pressable>
            </>
          )}

          {!userEmail ? legalSupportSection : null}

          {userEmail ? (
            <Pressable
              style={styles.linkButton}
              onPress={() =>
                openUrlOrMessage(
                  BETA_LINKS.supportUrl,
                  `${DATA_DELETION_SUBJECT} link is unavailable.`,
                )
              }
            >
              <Text style={styles.linkButtonText}>Request Data Deletion</Text>
            </Pressable>
          ) : null}

          {message ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const { colors } = AppTheme;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    padding: 18,
    gap: 18,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 12,
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    color: colors.text,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryStrong,
    marginTop: 8,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    marginTop: 12,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  signedInEmail: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusCard: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  statusRow: {
    gap: 4,
  },
  statusLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  statusValue: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 20,
  },
  statusOnline: {
    color: colors.success,
  },
  statusWarning: {
    color: colors.warning,
  },
  disclaimerCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningSoft,
  },
  disclaimerText: {
    color: colors.warning,
    fontWeight: '800',
    lineHeight: 20,
  },
  linksCard: {
    gap: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  messageCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningSoft,
  },
  messageText: {
    color: colors.warning,
    fontWeight: '800',
    lineHeight: 20,
  },
});
