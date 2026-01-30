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

  if (requireAuth) {
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

// Typed API methods
export const api = {
  // Customers
  customers: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/customers?${new URLSearchParams(params as any)}`),
    get: (id: string) => apiClient<any>(`/api/customers/${id}`),
    create: (data: any) =>
      apiClient<any>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiClient<any>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiClient<void>(`/api/customers/${id}`, { method: 'DELETE' }),
  },

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

      const user = auth.currentUser;
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
    delete: (id: string) => apiClient<void>(`/api/documents/${id}`, { method: 'DELETE' }),
  },

  // Tax Returns
  returns: {
    list: (params?: { customerId?: string; taxYear?: number; status?: string; page?: number; limit?: number }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/returns?${new URLSearchParams(params as any)}`),
    get: (id: string) => apiClient<any>(`/api/returns/${id}`),
    create: (data: any) =>
      apiClient<any>('/api/returns', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, notes?: string) =>
      apiClient<any>(`/api/returns/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
  },

  // Appointments
  appointments: {
    list: (params?: { customerId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/appointments?${new URLSearchParams(params as any)}`),
    get: (id: string) => apiClient<any>(`/api/appointments/${id}`),
    create: (data: any) =>
      apiClient<any>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiClient<any>(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiClient<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
  },

  // Communications
  communications: {
    list: (params?: { customerId?: string }) =>
      apiClient<{ data: any[]; meta: any }>(`/api/communications?${new URLSearchParams(params as any)}`),
    send: (data: any) =>
      apiClient<any>('/api/communications/send', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Kanban
  kanban: {
    list: (params?: { status?: string; workflow?: string }) =>
      apiClient<{ data: any[] }>(`/api/kanban?${new URLSearchParams(params as any)}`),
    create: (data: any) =>
      apiClient<any>('/api/kanban', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiClient<any>(`/api/kanban/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiClient<void>(`/api/kanban/${id}`, { method: 'DELETE' }),
  },

  // Workflows
  workflows: {
    list: () => apiClient<{ data: any[] }>('/api/workflows'),
    get: (id: string) => apiClient<any>(`/api/workflows/${id}`),
  },

  // Users
  users: {
    list: () => apiClient<{ data: any[] }>('/api/users'),
    me: () => apiClient<any>('/api/users/me'),
  },

  // Health
  health: () => apiClient<{ status: string; timestamp: string }>('/api/health', { requireAuth: false }),
};
