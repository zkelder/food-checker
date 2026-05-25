import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderRules = [
  'Dairy',
  'Peanut',
  'Tree nut',
  'Egg',
  'Soy',
  'Wheat',
  'Gluten',
  'Fish',
  'Shellfish',
];

export default function PreferencesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Profile setup</Text>
          <Text style={styles.title}>Scan Preferences</Text>

          <Text style={styles.subtitle}>
            Choose what every scan should check. Next, this screen will sync
            with your existing profile API.
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>0</Text>
            <Text style={styles.summaryLabel}>selected</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{placeholderRules.length}</Text>
            <Text style={styles.summaryLabel}>available</Text>
          </View>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.sectionTitle}>Common allergens</Text>

          <View style={styles.rulesGrid}>
            {placeholderRules.map((rule) => (
              <Pressable key={rule} style={styles.rulePill}>
                <Text style={styles.ruleText}>{rule}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Next mobile step</Text>

          <Text style={styles.noticeText}>
            We’ll load real rules from GET /rules and save selected preferences
            through PUT /profile.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  page: {
    padding: 18,
    paddingBottom: 36,
    gap: 18,
  },
  header: {
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
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1.8,
    lineHeight: 40,
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryNumber: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  rulesCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    color: '#fdba74',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rulePill: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ruleText: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  noticeCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
  },
  noticeTitle: {
    color: '#fde68a',
    fontWeight: '900',
    marginBottom: 6,
  },
  noticeText: {
    color: '#d1d5db',
    lineHeight: 21,
  },
});