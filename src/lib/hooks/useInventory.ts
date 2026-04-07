import { useState, useCallback } from 'react';

export type UseInventoryState = {
  loading: boolean;
  error: string | null;
  data: Record<string, any> | null;
};

export type UseInventoryReturn = UseInventoryState & {
  fetchInventory: (systemType?: string) => Promise<void>;
  syncSystem: (systemType: string, operation?: string) => Promise<void>;
  reset: () => void;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed');
  }
  return payload.data as T;
}

export function useInventory(): UseInventoryReturn {
  const [state, setState] = useState<UseInventoryState>({
    loading: false,
    error: null,
    data: null,
  });

  const fetchInventory = useCallback(async (systemType?: string) => {
    setState({ loading: true, error: null, data: null });
    try {
      const query = systemType ? `?systemType=${systemType}` : '';
      const data = await requestJson<Record<string, any>>(`/api/inventory${query}`);
      setState({ loading: false, error: null, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch inventory';
      setState({ loading: false, error: errorMessage, data: null });
    }
  }, []);

  const syncSystem = useCallback(async (systemType: string, operation?: string) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await requestJson<Record<string, any>>('/api/sync-data', {
        method: 'POST',
        body: JSON.stringify({ systemType, operation }),
      });
      setState({ loading: false, error: null, data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState({ loading: false, error: errorMessage, data: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    fetchInventory,
    syncSystem,
    reset,
  };
}
