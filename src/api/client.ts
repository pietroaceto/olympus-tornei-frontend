const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Errore ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.message === 'string') {
        message = body.message;
      }
    } catch {
      // corpo non JSON, si mantiene il messaggio di default
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export function apiDelete<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
