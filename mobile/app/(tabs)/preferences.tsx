import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile, getRules, updateProfile } from '@/lib/api';
import type { IngredientRule, RulesResponse } from '@/lib/api';
import { DEFAULT_SELECTED_RULES } from '../../lib/defaultRules';

const COMMON_ALLERGEN_IDS = [
  'milk',
  'peanut',
  'tree_nuts',
  'egg',
  'soy',
  'gluten',
  'fish',
  'shellfish',
];

export default function PreferencesScreen() {
  const [rules, setRules] = useState<RulesResponse>({});
  const [selectedRules, setSelectedRules] = useState<string[]>(DEFAULT_SELECTED_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoading(true);
    setErrorMessage('');

    try {
      const [rulesData, profileData] = await Promise.all([
        getRules(),
        getProfile(),
      ]);

      setRules(rulesData);
      setSelectedRules(profileData.selected_rules?.length ? profileData.selected_rules : DEFAULT_SELECTED_RULES);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        'Could not load preferences. Make sure the FastAPI backend is running.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSelectedRules(nextSelectedRules: string[]) {
    setSelectedRules(nextSelectedRules);
    setSaving(true);
    setErrorMessage('');

    try {
      await updateProfile(nextSelectedRules);
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not save preferences.');
    } finally {
      setSaving(false);
    }
  }

  function toggleRule(ruleId: string) {
    const nextSelectedRules = selectedRules.includes(ruleId)
      ? selectedRules.filter((id) => id !== ruleId)
      : [...selectedRules, ruleId];

    saveSelectedRules(nextSelectedRules);
  }

  function clearAll() {
    saveSelectedRules([]);
  }

  function selectCommonAllergens() {
    const availableCommonAllergens = COMMON_ALLERGEN_IDS.filter(
      (ruleId) => rules[ruleId],
    );

    saveSelectedRules(availableCommonAllergens);
  }

  function restoreRecommendedDefaults() {
    const availableDefaults = DEFAULT_SELECTED_RULES.filter(
      (ruleId) => rules[ruleId],
    );

    saveSelectedRules(availableDefaults);
  }

  const groupedRules = useMemo(() => {
    const groups: Record<string, (IngredientRule & { id: string })[]> = {};

    Object.entries(rules).forEach(([ruleId, ruleData]) => {
      const category = ruleData.category || 'general';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push({
        id: ruleId,
        ...ruleData,
      });
    });

    return groups;
  }, [rules]);

  const selectedRuleLabels = useMemo(() => {
    return selectedRules.map((ruleId) => {
      const rule = rules[ruleId];
      return rule?.display_name || rule?.label || ruleId;
    });
  }, [rules, selectedRules]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Profile setup</Text>
          <Text style={styles.title}>Scan Preferences</Text>

          <Text style={styles.subtitle}>
            Choose what every scan should check. These preferences are now
            loaded from and saved to your FastAPI profile API.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color="#fb923c" />
            <Text style={styles.stateText}>Loading preferences...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{selectedRules.length}</Text>
                <Text style={styles.summaryLabel}>selected</Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>
                  {Object.keys(rules).length}
                </Text>
                <Text style={styles.summaryLabel}>available</Text>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              <Pressable style={styles.secondaryButton} onPress={clearAll}>
                <Text style={styles.secondaryButtonText}>Clear All</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={selectCommonAllergens}
              >
                <Text style={styles.secondaryButtonText}>Common Allergens</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={restoreRecommendedDefaults}
              >
                <Text style={styles.secondaryButtonText}>Recommended</Text>
              </Pressable>
            </View>

            {saving ? (
              <View style={styles.savingCard}>
                <ActivityIndicator color="#fb923c" size="small" />
                <Text style={styles.savingText}>Saving preferences...</Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {selectedRules.length === 0 ? (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>No preferences selected</Text>
                <Text style={styles.noticeText}>
                  Scans will extract ingredient text, but they will not flag
                  ingredients until preferences are selected.
                </Text>
              </View>
            ) : (
              <View style={styles.selectedCard}>
                <Text style={styles.sectionTitle}>Currently checking</Text>

                <View style={styles.rulesGrid}>
                  {selectedRuleLabels.map((label) => (
                    <View key={label} style={styles.selectedPill}>
                      <Text style={styles.selectedPillText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {Object.entries(groupedRules).map(([category, categoryRules]) => (
              <View key={category} style={styles.rulesCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.sectionTitle}>
                    {category.replace('_', ' ')}
                  </Text>

                  <Text style={styles.categoryCount}>
                    {categoryRules.length} rules
                  </Text>
                </View>

                <View style={styles.rulesGrid}>
                  {categoryRules.map((rule) => {
                    const selected = selectedRules.includes(rule.id);
                    const label = rule.display_name || rule.label || rule.id;

                    return (
                      <Pressable
                        key={rule.id}
                        style={[
                          styles.rulePill,
                          selected ? styles.rulePillSelected : null,
                        ]}
                        onPress={() => toggleRule(rule.id)}
                      >
                        <Text
                          style={[
                            styles.ruleText,
                            selected ? styles.ruleTextSelected : null,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    minWidth: 120,
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
  rulesCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.22)',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  categoryCount: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#fdba74',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  rulePill: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rulePillSelected: {
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderColor: 'rgba(251, 146, 60, 0.5)',
  },
  ruleText: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  ruleTextSelected: {
    color: '#fed7aa',
  },
  selectedPill: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 146, 60, 0.16)',
  },
  selectedPillText: {
    color: '#fed7aa',
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
  savingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
  },
  savingText: {
    color: '#fed7aa',
    fontWeight: '800',
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
