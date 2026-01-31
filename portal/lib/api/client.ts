import { auth } from '../firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requireAuth = true, headers: customHeaders, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (requireAuth && auth) {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// Typed API methods for portal (customer-facing endpoints only)
export const api = {
  // Documents
  documents: {
    list: (params?: { customerId?: string; taxYear?: number; page?: number; limit?: number }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/documents?${new URLSearchParams(params as any)}`),
    get: (id: string) => apiClient<any>(`/api/documents/${id}`),
    upload: async (file: File, customerId: string, taxYear: number, type?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('customerId', customerId);
      formData.append('taxYear', taxYear.toString());
      if (type) formData.append('type', type);

      const user = auth?.currentUser;
      const headers: HeadersInit = {};
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(error.message);
      }
      return response.json();
    },
  },

  // Tax Returns
  returns: {
    list: (params?: { customerId?: string; taxYear?: number; status?: string; page?: number; limit?: number }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/returns?${new URLSearchParams(params as any)}`),
    get: (id: string) => apiClient<any>(`/api/returns/${id}`),
  },

  // Health
  health: () => apiClient<{ status: string; timestamp: string }>('/api/health', { requireAuth: false }),
};
