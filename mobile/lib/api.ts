import { Platform } from 'react-native';

export const API_BASE_URL = 'http://localhost:8000';

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

export type MatchResponse = {
  ingredient: string;
  label: string;
  warning: string;
  severity: string;
  category: string;
};

export type AnalyzeResponse = {
  input_text: string;
  normalized_text: string;
  risk_level: string;
  summary: string;
  matches: MatchResponse[];
  match_count: number;
};

export type ScanHistoryItem = {
  id: number;
  raw_text: string;
  selected_rules: string[];
  result: AnalyzeResponse;
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

function getErrorMessage(errorData: unknown, fallback: string) {
  if (
    errorData &&
    typeof errorData === 'object' &&
    'detail' in errorData
  ) {
    const detail = (errorData as { detail: unknown }).detail;

    if (typeof detail === 'string') {
      return detail;
    }

    return JSON.stringify(detail);
  }

  return fallback;
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

export async function uploadScanImage(
  imageUri: string,
  selectedRules: string[],
): Promise<AnalyzeResponse> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(imageUri);
    const imageBlob = await imageResponse.blob();

    formData.append('file', imageBlob, 'ingredient-label.jpg');
  } else {
    formData.append('file', {
      uri: imageUri,
      name: 'ingredient-label.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
  }

  formData.append('selected_rules', JSON.stringify(selectedRules));

  const response = await fetch(`${API_BASE_URL}/scan/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      getErrorMessage(errorData, `Scan failed: ${response.status}`),
    );
  }

  return response.json();
}