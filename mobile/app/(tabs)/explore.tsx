import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const placeholderScans = [
  {
    id: 1,
    verdict: 'SAFE',
    summary: 'No selected preference matches were found.',
    date: 'Recent scan',
  },
  {
    id: 2,
    verdict: 'REVIEW',
    summary: 'Saved scan history will load from your FastAPI backend here.',
    date: 'Coming next',
  },
];

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Saved scans</Text>
          <Text style={styles.title}>Review History</Text>

          <Text style={styles.subtitle}>
            Past scans will appear here after the mobile client is connected to
            your existing history API.
          </Text>
        </View>

        <View style={styles.list}>
          {placeholderScans.map((scan) => (
            <View key={scan.id} style={styles.historyCard}>
              <View style={styles.row}>
                <Text
                  style={[
                    styles.verdictBadge,
                    scan.verdict === 'SAFE'
                      ? styles.safeBadge
                      : styles.reviewBadge,
                  ]}
                >
                  {scan.verdict}
                </Text>

                <Text style={styles.dateText}>{scan.date}</Text>
              </View>

              <Text style={styles.summary}>{scan.summary}</Text>
              <Text style={styles.meta}>Tap-to-reopen behavior comes next.</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  page: { padding: 18, paddingBottom: 36, gap: 18 },
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
  list: { gap: 14 },
  historyCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftColor: '#fb923c',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  verdictBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  safeBadge: {
    color: '#86efac',
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  reviewBadge: {
    color: '#fde68a',
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  dateText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  summary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  meta: { color: '#9ca3af', marginTop: 8, lineHeight: 20 },
});
