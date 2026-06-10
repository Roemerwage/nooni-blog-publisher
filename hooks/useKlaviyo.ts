import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const useKlaviyo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    setError(null);
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body) options.body = JSON.stringify(body);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API call failed');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // List Management
  const getLists = useCallback(async () => {
    return apiCall('/api/klaviyo/lists');
  }, [apiCall]);

  const subscribeToList = useCallback(
    async (email: string, listId: string, options?: any) => {
      return apiCall('/api/klaviyo/subscribe', 'POST', {
        email,
        listId,
        ...options,
      });
    },
    [apiCall]
  );

  const unsubscribeFromList = useCallback(
    async (email: string, listId: string) => {
      return apiCall('/api/klaviyo/unsubscribe', 'POST', { email, listId });
    },
    [apiCall]
  );

  // Flows
  const getFlows = useCallback(async () => {
    return apiCall('/api/klaviyo/flows');
  }, [apiCall]);

  // Triggers a metric-based flow by tracking an event.
  // In Klaviyo, create a flow with "Metric" trigger matching eventName.
  const triggerFlow = useCallback(
    async (eventName: string, email: string, properties?: any) => {
      return apiCall('/api/klaviyo/trigger-flow', 'POST', {
        eventName,
        email,
        properties,
      });
    },
    [apiCall]
  );

  // Event Tracking
  const trackEvent = useCallback(
    async (email: string, eventName: string, properties?: any) => {
      return apiCall('/api/klaviyo/track-event', 'POST', {
        email,
        eventName,
        properties,
      });
    },
    [apiCall]
  );

  // Profiles
  const getProfile = useCallback(async (email: string) => {
    return apiCall(`/api/klaviyo/profile/${encodeURIComponent(email)}`);
  }, [apiCall]);

  const updateProfile = useCallback(
    async (email: string, properties: any) => {
      return apiCall('/api/klaviyo/profile', 'POST', { email, properties });
    },
    [apiCall]
  );

  const createOrUpdateProfile = useCallback(
    async (email: string, data: { firstName?: string; lastName?: string; phoneNumber?: string; properties?: any }) => {
      return apiCall('/api/klaviyo/profile', 'POST', { email, ...data });
    },
    [apiCall]
  );

  const getSegments = useCallback(async () => {
    return apiCall('/api/klaviyo/segments');
  }, [apiCall]);

  return {
    loading,
    error,
    // List Management
    getLists,
    subscribeToList,
    unsubscribeFromList,
    // Flows
    getFlows,
    triggerFlow,
    // Event Tracking
    trackEvent,
    // Profiles
    getProfile,
    updateProfile,
    createOrUpdateProfile,
    // Segments
    getSegments,
  };
};
