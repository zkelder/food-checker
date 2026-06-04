import { Tabs } from 'expo-router';
import React from 'react';

import { AppTheme } from '@/constants/theme';

export default function TabLayout() {
  const { colors } = AppTheme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
          minHeight: 72,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Scan' }} />
      <Tabs.Screen name="explore" options={{ title: 'History' }} />
      <Tabs.Screen name="preferences" options={{ title: 'Preferences' }} />
      <Tabs.Screen name="auth" options={{ title: 'Account' }} />
    </Tabs>
  );
}
