export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export type IngredientRule = {
  display_name?: string;
  label?: string;
  category?: string;
  warning?: string;
  severity?: string;
  default_severity?: string;
  keywords?: string[];
};

export type RulesResponse = Record<string, IngredientRule>;

export type UserProfile = {
  id: number;
  user_id: string | null;
  selected_rules: string[];
  created_at: string;
  updated_at: string;
};

export type ScanHistoryItem = {
  id: number;
  raw_text: string;
  selected_rules: string[];
  result: {
    input_text?: string;
    normalized_text?: string;
    risk_level?: string;
    summary?: string;
    matches?: Array<{
      ingredient: string;
      label: string;
      warning: string;
      severity: string;
      category: string;
    }>;
    match_count?: number;
  };
  created_at: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export function getRules() {
  return request<RulesResponse>('/rules');
}

export function getProfile() {
  return request<UserProfile>('/profile');
}

export function updateProfile(selectedRules: string[]) {
  return request<UserProfile>('/profile', {
    method: 'PUT',
    body: JSON.stringify({
      selected_rules: selectedRules,
    }),
  });
}

export function getHistory() {
  return request<ScanHistoryItem[]>('/history');
}