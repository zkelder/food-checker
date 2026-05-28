import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fb923c',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
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