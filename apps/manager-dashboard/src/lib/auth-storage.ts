export const AUTH_TOKEN_KEY = 'axiom_token';
export const USER_PROFILE_KEY = 'axiom_user_profile';

/**
 * Returns the current JWT access token from localStorage.
 * Guarantees null if not set or invalid string ("null", "undefined").
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return null;
  }
  return token;
}

/**
 * Persists JWT token to localStorage.
 */
export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (token && token !== 'null' && token !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Clears stored auth tokens and user profile.
 */
export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(USER_PROFILE_KEY);
}

/**
 * Log out user and redirect to login page.
 */
export function logoutUser(): void {
  removeStoredToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
