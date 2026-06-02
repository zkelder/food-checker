import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://54.159.60.186:8000';

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
  user_id?: string;
  raw_text: string;
  selected_rules: string[];
  result: AnalyzeResponse;
  created_at: string;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getErrorMessage(errorData: unknown, fallback: string) {
  if (errorData && typeof errorData === 'object' && 'detail' in errorData) {
    const detail = (errorData as { detail: unknown }).detail;

    if (typeof detail === 'string') {
      return detail;
    }

    return JSON.stringify(detail);
  }

  return fallback;
}

function getNetworkErrorMessage(path: string) {
  if (path === '/scan/image') {
    return (
      'Could not reach the scan server. Check your connection and try again. ' +
      'If this keeps happening, try a closer photo of only the ingredients panel.'
    );
  }

  if (path === '/profile') {
    return 'Could not load preferences. Check your connection and try again.';
  }

  if (path === '/history') {
    return 'Could not load scan history. Check your connection and try again.';
  }

  if (path === '/rules') {
    return 'Could not load ingredient rules. Check your connection and try again.';
  }

  return 'Could not reach the server. Check your connection and try again.';
}

function getStatusFallback(path: string, status: number) {
  if (path === '/scan/image') {
    if (status === 408) {
      return 'OCR timed out. Try a clearer, closer photo of the ingredients label.';
    }

    if (status === 400) {
      return 'Could not read this image. Try a clearer photo of only the ingredients panel.';
    }

    if (status >= 500) {
      return 'The scan server had trouble reading this image. Try a closer, clearer label photo.';
    }

    return `Scan failed: ${status}`;
  }

  if (status === 401) {
    return 'Please sign in again.';
  }

  if (status >= 500) {
    return 'The server had a problem. Try again in a moment.';
  }

  return `Request failed: ${status}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  const authHeaders = await getAuthHeaders();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error(error);
    throw new Error(getNetworkErrorMessage(path));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      getErrorMessage(errorData, getStatusFallback(path, response.status)),
    );
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

export async function uploadScanImage(
  imageUri: string,
  selectedRules: string[],
): Promise<AnalyzeResponse> {
  const formData = new FormData();

  try {
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
  } catch (error) {
    console.error(error);
    throw new Error(
      'Could not prepare this image for upload. Try a different label photo.',
    );
  }

  let response: Response;
  const authHeaders = await getAuthHeaders();

  try {
    response = await fetch(`${API_BASE_URL}/scan/image`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
  } catch (error) {
    console.error(error);
    throw new Error(getNetworkErrorMessage('/scan/image'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      getErrorMessage(
        errorData,
        getStatusFallback('/scan/image', response.status),
      ),
    );
  }

  return response.json();
}