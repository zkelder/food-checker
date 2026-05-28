import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile, uploadScanImage } from '@/lib/api';
import type { AnalyzeResponse } from '@/lib/api';

function getVerdict(result: AnalyzeResponse | null) {
  if (!result || result.match_count === 0) {
    return {
      label: 'SAFE',
      title: 'Looks clear',
      description: 'No selected preference matches were found.',
      badgeStyle: styles.safeBadge,
      cardStyle: styles.safeResultCard,
    };
  }

  if (result.risk_level === 'high') {
    return {
      label: 'AVOID',
      title: 'Ingredients flagged',
      description:
        'This label contains ingredients that match high-risk preferences.',
      badgeStyle: styles.avoidBadge,
      cardStyle: styles.avoidResultCard,
    };
  }

  if (result.risk_level === 'medium') {
    return {
      label: 'CAUTION',
      title: 'Ingredients flagged',
      description: 'This label contains ingredients that may need attention.',
      badgeStyle: styles.cautionBadge,
      cardStyle: styles.cautionResultCard,
    };
  }

  return {
    label: 'REVIEW',
    title: 'Ingredients flagged',
    description: 'This label contains lower-priority ingredient notes.',
    badgeStyle: styles.reviewBadge,
    cardStyle: styles.cautionResultCard,
  };
}

async function prepareImageForUpload(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: 1800,
        },
      },
    ],
    {
      compress: 0.85,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

export default function ScanScreen() {
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [preparingImage, setPreparingImage] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);
    setErrorMessage('');

    try {
      const profile = await getProfile();
      setSelectedRules(profile.selected_rules || []);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not load scan preferences. Make sure the backend is running.',
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  function clearScan() {
    setImageUri('');
    setResult(null);
    setErrorMessage('');
  }

  async function choosePhoto() {
    setErrorMessage('');
    setResult(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Photo library permission is required to choose a label.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]?.uri) {
      return;
    }

    setPreparingImage(true);

    try {
      const preparedUri = await prepareImageForUpload(
        pickerResult.assets[0].uri,
      );
      setImageUri(preparedUri);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not prepare this image. Try a different label photo.',
      );
    } finally {
      setPreparingImage(false);
    }
  }

  async function takePhoto() {
    setErrorMessage('');
    setResult(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage('Camera permission is required to scan a label.');
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
    });

    if (pickerResult.canceled || !pickerResult.assets[0]?.uri) {
      return;
    }

    setPreparingImage(true);

    try {
      const preparedUri = await prepareImageForUpload(
        pickerResult.assets[0].uri,
      );
      setImageUri(preparedUri);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not prepare this image. Try a clearer label photo.',
      );
    } finally {
      setPreparingImage(false);
    }
  }

  async function scanSelectedImage() {
    if (!imageUri) {
      setErrorMessage('Choose or take a label photo first.');
      return;
    }

    setScanning(true);
    setErrorMessage('');
    setResult(null);

    try {
      const scanResult = await uploadScanImage(imageUri, selectedRules);
      setResult(scanResult);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not scan this image. Try a clearer label photo.',
      );
    } finally {
      setScanning(false);
    }
  }

  const verdict = getVerdict(result);
  const busy = scanning || preparingImage;

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
            <Text style={styles.preferenceCount}>{selectedRules.length}</Text>
            <Text style={styles.preferenceText}>
              {selectedRules.length === 1
                ? 'preference active'
                : 'preferences active'}
            </Text>
          </View>
        </View>

        {loadingProfile ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#fb923c" />
            <Text style={styles.stateText}>Loading scan preferences...</Text>
          </View>
        ) : null}

        <View style={styles.scanCard}>
          <View style={styles.cameraCircle}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>

          <Text style={styles.cardTitle}>Scan Ingredient Label</Text>

          <Text style={styles.cardText}>
            Take a new photo or choose one from your library. Food Checker will
            shrink the image for faster OCR before sending it to the backend.
          </Text>

          <View style={styles.actionGrid}>
            <Pressable
              style={[styles.secondaryButton, busy && styles.disabledButton]}
              onPress={takePhoto}
              disabled={busy}
            >
              <Text style={styles.secondaryButtonText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, busy && styles.disabledButton]}
              onPress={choosePhoto}
              disabled={busy}
            >
              <Text style={styles.secondaryButtonText}>Choose Photo</Text>
            </Pressable>
          </View>

          {preparingImage ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#fb923c" />
              <Text style={styles.stateText}>
                Preparing image for faster OCR...
              </Text>
            </View>
          ) : null}

          {imageUri ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />

              <View style={styles.previewFooter}>
                <Text style={styles.previewText}>
                  Compressed photo ready to scan
                </Text>

                <Pressable style={styles.clearButton} onPress={clearScan}>
                  <Text style={styles.clearButtonText}>
                    {result ? 'Scan Another' : 'Clear'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              (!imageUri || busy) && styles.primaryButtonDisabled,
            ]}
            onPress={scanSelectedImage}
            disabled={!imageUri || busy}
          >
            {scanning ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Scan Ingredients</Text>
            )}
          </Pressable>
        </View>

        {selectedRules.length === 0 ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>No preferences selected</Text>
            <Text style={styles.noticeText}>
              Scans will extract ingredient text, but they will not flag
              ingredients until preferences are selected.
            </Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {result ? (
          <View style={[styles.resultCard, verdict.cardStyle]}>
            <Text style={[styles.verdictBadge, verdict.badgeStyle]}>
              {verdict.label}
            </Text>

            <Text style={styles.resultTitle}>{verdict.title}</Text>
            <Text style={styles.resultDescription}>{verdict.description}</Text>

            <View style={styles.resultSummaryGrid}>
              <View style={styles.resultSummaryBox}>
                <Text style={styles.resultSummaryNumber}>
                  {result.match_count}
                </Text>
                <Text style={styles.resultSummaryLabel}>matches</Text>
              </View>

              <View style={styles.resultSummaryBox}>
                <Text style={styles.resultSummaryNumber}>
                  {result.risk_level}
                </Text>
                <Text style={styles.resultSummaryLabel}>risk</Text>
              </View>
            </View>

            <Text style={styles.resultSummary}>{result.summary}</Text>

            {result.matches.length > 0 ? (
              <View style={styles.matchesList}>
                {result.matches.map((match, index) => (
                  <View
                    key={`${match.ingredient}-${index}`}
                    style={styles.matchCard}
                  >
                    <View style={styles.matchTopline}>
                      <Text style={styles.matchLabel}>{match.label}</Text>
                      <Text style={styles.matchSeverity}>
                        {match.severity}
                      </Text>
                    </View>

                    <Text style={styles.matchWarning}>
                      {match.warning ||
                        'This ingredient matched one of your preferences.'}
                    </Text>

                    <Text style={styles.matchMeta}>
                      Matched: {match.ingredient} • Category: {match.category}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
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
  cameraIcon: {
    fontSize: 38,
  },
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
  actionGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  previewCard: {
    width: '100%',
    marginBottom: 14,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewImage: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
  },
  previewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
  },
  previewText: {
    flex: 1,
    color: '#d1d5db',
    fontWeight: '800',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  clearButtonText: {
    color: '#f8fafc',
    fontWeight: '900',
  },
  primaryButton: {
    width: '100%',
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ea580c',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
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
  noticeTitle: {
    color: '#fde68a',
    fontWeight: '900',
    marginBottom: 6,
  },
  noticeText: {
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
  stateCard: {
    width: '100%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  stateText: {
    color: '#d1d5db',
    fontWeight: '800',
  },
  resultCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  safeResultCard: {
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  cautionResultCard: {
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  avoidResultCard: {
    borderColor: 'rgba(239, 68, 68, 0.32)',
  },
  verdictBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  safeBadge: {
    color: '#86efac',
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
  },
  cautionBadge: {
    color: '#fde68a',
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  reviewBadge: {
    color: '#fde68a',
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
  },
  avoidBadge: {
    color: '#fecaca',
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  resultDescription: {
    color: '#d1d5db',
    lineHeight: 22,
    marginTop: 8,
  },
  resultSummaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resultSummaryBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  resultSummaryNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  resultSummaryLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  resultSummary: {
    color: '#ffffff',
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 16,
  },
  matchesList: {
    gap: 12,
    marginTop: 16,
  },
  matchCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matchTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  matchLabel: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  matchSeverity: {
    color: '#fdba74',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  matchWarning: {
    color: '#d1d5db',
    lineHeight: 20,
  },
  matchMeta: {
    color: '#9ca3af',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
});