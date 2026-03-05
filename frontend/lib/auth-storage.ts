export const STORAGE_KEY = 'advisorai_admin_user';

export interface StoredAdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function storeAdminUser(user: StoredAdminUser): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

export function getStoredAdminUser(): StoredAdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as StoredAdminUser;
    return u?.id && u?.email && u?.role ? u : null;
  } catch {
    return null;
  }
}
