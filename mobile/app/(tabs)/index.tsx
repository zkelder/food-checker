import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Scan home</Text>
          <Text style={styles.title}>Point, capture, check.</Text>

          <Text style={styles.subtitle}>
            Take a clear photo of the ingredients panel. Food Checker will
            extract the label text and compare it against your saved scan
            preferences.
          </Text>

          <View style={styles.preferencePill}>
            <Text style={styles.preferenceCount}>0</Text>
            <Text style={styles.preferenceText}>preferences active</Text>
          </View>
        </View>

        <View style={styles.scanCard}>
          <View style={styles.cameraCircle}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>

          <Text style={styles.cardTitle}>Open Camera</Text>

          <Text style={styles.cardText}>
            Camera upload will connect here next. For now, this confirms the
            native mobile shell is running.
          </Text>

          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Scan Ingredients</Text>
          </Pressable>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Next mobile step</Text>
          <Text style={styles.noticeText}>
            We’ll wire this button to Expo Image Picker, preview the photo, and
            upload it to your existing FastAPI OCR endpoint.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  page: { padding: 18, paddingBottom: 36, gap: 18 },
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
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 44,
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  preferencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginTop: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.24)',
  },
  preferenceCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fed7aa',
    backgroundColor: 'rgba(251, 146, 60, 0.22)',
    fontWeight: '900',
  },
  preferenceText: {
    color: '#fed7aa',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scanCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.34)',
  },
  cameraCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    marginBottom: 16,
  },
  cameraIcon: { fontSize: 38 },
  cardTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardText: {
    color: '#d1d5db',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    width: '100%',
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  noticeCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.22)',
  },
  noticeTitle: { color: '#fde68a', fontWeight: '900', marginBottom: 6 },
  noticeText: { color: '#d1d5db', lineHeight: 21 },
});
