import { getStoredToken, removeStoredToken } from './auth-storage';

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Reusable authenticated fetch helper for Manager Dashboard.
 *
 * Guarantees:
 *  1. Retrieves valid token via getStoredToken()
 *  2. NEVER sends 'Authorization: Bearer null'
 *  3. On 401 Unauthorized response, clears storage and notifies caller
 */
export async function authFetch(
  input: string | URL,
  init?: AuthFetchOptions,
): Promise<Response> {
  const options: RequestInit = { ...init };
  const headers = new Headers(options.headers || {});

  if (!init?.skipAuth) {
    const token = getStoredToken();
    if (!token) {
      removeStoredToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please login again.');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  options.headers = headers;

  const res = await fetch(input, options);

  if (res.status === 401 && !init?.skipAuth) {
    removeStoredToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  return res;
}
