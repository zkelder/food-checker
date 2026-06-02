import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getHistory } from '@/lib/api';
import type { ScanHistoryItem } from '@/lib/api';

function getVerdict(scan: ScanHistoryItem) {
  const matchCount = scan.result?.match_count || 0;
  const riskLevel = scan.result?.risk_level || 'none';

  if (matchCount === 0) {
    return {
      label: 'SAFE',
      style: styles.safeBadge,
    };
  }

  if (riskLevel === 'high') {
    return {
      label: 'AVOID',
      style: styles.avoidBadge,
    };
  }

  if (riskLevel === 'medium') {
    return {
      label: 'CAUTION',
      style: styles.cautionBadge,
    };
  }

  return {
    label: 'REVIEW',
    style: styles.reviewBadge,
  };
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleDateString();
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setErrorMessage('');

    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not load scan history. Make sure the FastAPI backend is running.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function refreshHistory() {
    setRefreshing(true);
    loadHistory();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshHistory} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Saved scans</Text>
          <Text style={styles.title}>Review History</Text>

          <Text style={styles.subtitle}>
            Past scans from your FastAPI backend appear here. Pull down to
            refresh after new scans.
          </Text>
        </View>

        <View style={styles.countCard}>
          <Text style={styles.countNumber}>{history.length}</Text>
          <Text style={styles.countLabel}>
            {history.length === 1 ? 'saved scan' : 'saved scans'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#fb923c" />
            <Text style={styles.stateText}>Loading scan history...</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No scans yet</Text>
            <Text style={styles.emptyText}>
              After your first label scan, the date, risk level, match count,
              and summary will appear here for quick review.
            </Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {history.map((scan) => {
            const verdict = getVerdict(scan);
            const rawText = scan.raw_text || '';

            return (
              <Pressable key={scan.id} style={styles.historyCard}>
                <View style={styles.row}>
                  <Text style={[styles.verdictBadge, verdict.style]}>
                    {verdict.label}
                  </Text>

                  <Text style={styles.dateText}>
                    {formatDate(scan.created_at)}
                  </Text>
                </View>

                {formatTime(scan.created_at) ? (
                  <Text style={styles.timeText}>
                    Scanned at {formatTime(scan.created_at)}
                  </Text>
                ) : null}

                <Text style={styles.summary}>
                  {scan.result?.summary || 'No summary available.'}
                </Text>

                <Text style={styles.rawText}>
                  {rawText.slice(0, 120)}
                  {rawText.length > 120 ? '...' : ''}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaPill}>
                    {scan.result?.match_count || 0} match
                  </Text>

                  <Text style={styles.metaPill}>
                    {scan.result?.risk_level || 'none'} risk
                  </Text>
                </View>
              </Pressable>
            );
          })}
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
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.22)',
  },
  countNumber: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  countLabel: {
    color: '#fed7aa',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  list: {
    gap: 14,
  },
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
    alignItems: 'flex-start',
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
  cautionBadge: {
    color: '#fde68a',
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  avoidBadge: {
    color: '#fecaca',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  dateText: {
    flex: 1,
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  rawText: {
    color: '#d1d5db',
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  stateCard: {
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stateText: {
    color: '#d1d5db',
    fontWeight: '800',
  },
  emptyCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyText: {
    color: '#d1d5db',
    lineHeight: 21,
  },
  errorCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  errorText: {
    color: '#fecaca',
    fontWeight: '800',
  },
});
