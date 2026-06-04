import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';
import { analyzeText, getProfile, uploadScanImage } from '@/lib/api';
import type { AnalyzeResponse } from '@/lib/api';
import { FOOD_CHECKER_DISCLAIMER } from '@/constants/beta';
import { DEFAULT_SELECTED_RULES } from '../../lib/defaultRules';

const SCAN_STATUS_MESSAGES = [
  'Uploading image...',
  'Reading label...',
  'Checking selected concerns...',
];

const RESULT_REVIEW_COPY =
  'Review these matches against the product label. OCR and ingredient matching can be imperfect.';

function formatDisplayValue(value: string) {
  return value.replace(/_/g, ' ');
}

function getSeverityStyle(severity: string) {
  if (severity === 'high') {
    return styles.severityHigh;
  }

  if (severity === 'medium') {
    return styles.severityMedium;
  }

  return styles.severityLow;
}

function getVerdict(result: AnalyzeResponse | null) {
  if (!result || result.match_count === 0) {
    return {
      label: 'NO MATCHES',
      title: 'No selected concerns found',
      description:
        'No selected concerns were found in the extracted text. Always verify the ingredient label directly.',
      badgeStyle: styles.safeBadge,
      cardStyle: styles.safeResultCard,
    };
  }

  if (result.risk_level === 'high') {
    return {
      label: 'REVIEW',
      title: 'Selected concerns found',
      description: 'Review the matched ingredients against the product label.',
      badgeStyle: styles.avoidBadge,
      cardStyle: styles.avoidResultCard,
    };
  }

  if (result.risk_level === 'medium') {
    return {
      label: 'CAUTION',
      title: 'Selected concerns found',
      description: 'Review the matched ingredients against the product label.',
      badgeStyle: styles.cautionBadge,
      cardStyle: styles.cautionResultCard,
    };
  }

  return {
    label: 'REVIEW',
    title: 'Ingredient notes found',
    description: 'Review these lower-priority notes against the product label.',
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
  const router = useRouter();
  const [selectedRules, setSelectedRules] = useState<string[]>(DEFAULT_SELECTED_RULES);
  const [hasSavedPreferences, setHasSavedPreferences] = useState(true);
  const [imageUri, setImageUri] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [preparingImage, setPreparingImage] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [extractedTextDraft, setExtractedTextDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);
    setErrorMessage('');

    try {
      const profile = await getProfile();
      setHasSavedPreferences((profile.selected_rules?.length ?? 0) > 0);
      setSelectedRules(profile.selected_rules?.length ? profile.selected_rules : DEFAULT_SELECTED_RULES);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not load saved preferences. You can still scan with the recommended defaults.',
      );
    } finally {
      setLoadingProfile(false);
    }
  }

  function clearScan() {
    setImageUri('');
    setResult(null);
    setShowExtractedText(false);
    setExtractedTextDraft('');
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
    setScanStatus(SCAN_STATUS_MESSAGES[0]);
    setErrorMessage('');
    setResult(null);

    const statusTimers = [
      setTimeout(() => setScanStatus(SCAN_STATUS_MESSAGES[1]), 1200),
      setTimeout(() => setScanStatus(SCAN_STATUS_MESSAGES[2]), 3600),
    ];

    try {
      const scanResult = await uploadScanImage(imageUri, selectedRules);
      setResult(scanResult);
      setExtractedTextDraft(
        scanResult.normalized_text || scanResult.input_text || '',
      );
      setShowExtractedText(Boolean(scanResult.ocr_warning));
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not finish this scan. Try a clearer, closer label photo.',
      );
    } finally {
      statusTimers.forEach(clearTimeout);
      setScanStatus('');
      setScanning(false);
    }
  }

  async function analyzeEditedText() {
    const text = extractedTextDraft.trim();

    if (!text) {
      setErrorMessage('Add ingredient text before re-checking concerns.');
      return;
    }

    setAnalyzingText(true);
    setErrorMessage('');

    try {
      const textResult = await analyzeText(text, selectedRules);
      setResult(textResult);
      setExtractedTextDraft(textResult.normalized_text || text);
      setShowExtractedText(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not re-check this text. Try again in a moment.',
      );
    } finally {
      setAnalyzingText(false);
    }
  }

  const verdict = getVerdict(result);
  const busy = scanning || preparingImage || analyzingText;
  const groupedMatches = useMemo(() => {
    if (!result?.matches.length) {
      return [];
    }

    const groups: Record<string, typeof result.matches> = {};

    result.matches.forEach((match) => {
      const groupKey = `${formatDisplayValue(match.severity)} ${formatDisplayValue(match.category)}`;
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(match);
    });

    return Object.entries(groups);
  }, [result]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Food Checker</Text>
          <Text style={styles.title}>Scan an ingredient label.</Text>

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
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Loading scan preferences...</Text>
          </View>
        ) : null}

        {!loadingProfile && !hasSavedPreferences ? (
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>
              Choose your ingredient concerns before your first scan.
            </Text>
            <Text style={styles.onboardingText}>
              Recommended defaults are active for now. Save your own preference
              list to make every scan feel personal.
            </Text>

            <Pressable
              style={styles.onboardingButton}
              onPress={() => router.push('/preferences')}
            >
              <Text style={styles.onboardingButtonText}>
                Go to Preferences
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.scanCard}>
          <View style={styles.cameraCircle}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>

          <Text style={styles.cardTitle}>Scan Ingredient Label</Text>

          <Text style={styles.cardText}>
            Take a new photo or choose one from your library. Food Checker will
            prepare the image for OCR and compare the extracted text with your
            selected rules.
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
              <ActivityIndicator color={colors.primary} />
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
              <View style={styles.scanLoadingRow}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.primaryButtonText}>
                  {scanStatus || 'Scanning...'}
                </Text>
              </View>
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

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important disclaimer</Text>
          <Text style={styles.disclaimerText}>{FOOD_CHECKER_DISCLAIMER}</Text>
        </View>

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
            <Text style={styles.resultHelperText}>{RESULT_REVIEW_COPY}</Text>

            {result.ocr_warning ? (
              <View style={styles.ocrWarningCard}>
                <Text style={styles.ocrWarningTitle}>
                  Scan may need review
                </Text>
                <Text style={styles.ocrWarningText}>
                  {result.ocr_warning}
                </Text>
                <Text style={styles.ocrWarningText}>
                  Try a clearer, closer photo if results look wrong.
                </Text>
              </View>
            ) : null}

            <View style={styles.ocrReviewCard}>
              <Pressable
                style={styles.ocrReviewHeader}
                onPress={() => setShowExtractedText(!showExtractedText)}
              >
                <Text style={styles.ocrReviewTitle}>
                  Review extracted text
                </Text>
                <Text style={styles.ocrReviewToggle}>
                  {showExtractedText ? 'Hide' : 'Show'}
                </Text>
              </Pressable>

              {showExtractedText ? (
                <>
                  <Text style={styles.ocrReviewHelp}>
                    If OCR missed or misread words, edit the text below and
                    re-check selected concerns.
                  </Text>

                  <TextInput
                    style={styles.ocrTextInput}
                    value={extractedTextDraft}
                    onChangeText={setExtractedTextDraft}
                    multiline
                    placeholder="Extracted ingredient text"
                    placeholderTextColor={colors.textSubtle}
                  />

                  <Pressable
                    style={[
                      styles.ocrAnalyzeButton,
                      analyzingText && styles.primaryButtonDisabled,
                    ]}
                    onPress={analyzeEditedText}
                    disabled={analyzingText}
                  >
                    {analyzingText ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <Text style={styles.ocrAnalyzeButtonText}>
                        Re-check Edited Text
                      </Text>
                    )}
                  </Pressable>
                </>
              ) : null}
            </View>

            {result.matches.length > 0 ? (
              <View style={styles.matchesList}>
                {groupedMatches.map(([groupName, matches]) => (
                  <View key={groupName} style={styles.matchGroup}>
                    <Text style={styles.matchGroupTitle}>{groupName}</Text>

                    {matches.map((match, index) => (
                      <View
                        key={`${match.ingredient}-${index}`}
                        style={styles.matchCard}
                      >
                        <View style={styles.matchTopline}>
                          <Text style={styles.matchLabel}>{match.label}</Text>
                          <Text
                            style={[
                              styles.matchSeverity,
                              getSeverityStyle(match.severity),
                            ]}
                          >
                            {formatDisplayValue(match.severity)}
                          </Text>
                        </View>

                        {match.ingredient ? (
                          <Text style={styles.matchIngredient}>
                            Matched ingredient: {match.ingredient}
                          </Text>
                        ) : null}

                        <Text style={styles.matchWarning}>
                          {match.warning ||
                            'This ingredient matched one of your preferences.'}
                        </Text>

                        {match.category ? (
                          <Text style={styles.matchMeta}>
                            Category: {formatDisplayValue(match.category)}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyResultCard}>
                <Text style={styles.emptyResultTitle}>
                  No selected concerns were found in the extracted text.
                </Text>
                <Text style={styles.emptyResultText}>
                  Always verify the ingredient label directly. You can review
                  the extracted text or adjust preferences any time.
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
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
    padding: 18,
    paddingBottom: 36,
    gap: 18,
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
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 44,
  },
  subtitle: {
    color: colors.textMuted,
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
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  preferenceCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    fontWeight: '900',
  },
  preferenceText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scanCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  cameraCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 16,
  },
  cameraIcon: {
    fontSize: 38,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardText: {
    color: colors.textMuted,
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
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
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
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    fontWeight: '800',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  clearButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  primaryButton: {
    width: '100%',
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryStrong,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  scanLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onboardingCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  onboardingTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
  },
  onboardingText: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: 8,
  },
  onboardingButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.primaryStrong,
    marginTop: 14,
  },
  onboardingButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  noticeCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningSoft,
  },
  noticeTitle: {
    color: colors.warning,
    fontWeight: '900',
    marginBottom: 6,
  },
  noticeText: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  disclaimerCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningSoft,
  },
  disclaimerTitle: {
    color: colors.warning,
    fontWeight: '900',
    marginBottom: 6,
  },
  disclaimerText: {
    color: colors.textMuted,
    lineHeight: 21,
  },
  errorCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerSoft,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
  },
  stateCard: {
    width: '100%',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  stateText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  resultCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.cardSoft,
  },
  safeResultCard: {
    borderColor: colors.successSoft,
  },
  cautionResultCard: {
    borderColor: colors.warningSoft,
  },
  avoidResultCard: {
    borderColor: colors.dangerSoft,
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
    color: colors.success,
    backgroundColor: colors.successSoft,
  },
  cautionBadge: {
    color: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  reviewBadge: {
    color: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  avoidBadge: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  resultDescription: {
    color: colors.textMuted,
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
    backgroundColor: colors.cardSoft,
  },
  resultSummaryNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  resultSummaryLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  resultSummary: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 16,
  },
  resultHelperText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 8,
  },
  matchesList: {
    gap: 12,
    marginTop: 16,
  },
  matchGroup: {
    gap: 10,
  },
  matchGroupTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  matchCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchTopline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  matchLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 24,
  },
  matchSeverity: {
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 12,
    lineHeight: 16,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: 104,
    textAlign: 'center',
  },
  severityHigh: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  severityMedium: {
    color: colors.warning,
    backgroundColor: colors.warningSoft,
  },
  severityLow: {
    color: colors.success,
    backgroundColor: colors.successSoft,
  },
  matchIngredient: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 19,
    marginBottom: 8,
  },
  matchWarning: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  matchMeta: {
    color: colors.textSubtle,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ocrWarningCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningSoft,
    marginTop: 16,
  },
  ocrWarningTitle: {
    color: colors.warning,
    fontWeight: '900',
    marginBottom: 6,
  },
  ocrWarningText: {
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 4,
  },
  ocrReviewCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 16,
  },
  ocrReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ocrReviewTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  ocrReviewToggle: {
    color: colors.primary,
    fontWeight: '900',
  },
  ocrReviewHelp: {
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 10,
  },
  ocrTextInput: {
    minHeight: 140,
    color: colors.text,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    textAlignVertical: 'top',
  },
  ocrAnalyzeButton: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryStrong,
    marginTop: 12,
  },
  ocrAnalyzeButtonText: {
    color: colors.text,
    fontWeight: '900',
  },
  emptyResultCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successSoft,
    marginTop: 16,
  },
  emptyResultTitle: {
    color: colors.success,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyResultText: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
