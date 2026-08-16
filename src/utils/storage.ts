/**
 * Safe runtime storage helper functions with versioning & migration support.
 */

/**
 * Safely migrates a legacy localStorage key to a new key.
 * If oldKey exists and newKey does not exist yet in storage, copies oldKey's value to newKey.
 * Always removes oldKey afterwards.
 */
export function migrateLegacyKey(oldKey: string, newKey: string): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  if (oldKey === newKey) return false;

  try {
    const legacyValue = localStorage.getItem(oldKey);
    if (legacyValue !== null) {
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacyValue);
      }
      localStorage.removeItem(oldKey);
      return true;
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
  return false;
}

/**
 * Safely retrieves and parses an item from localStorage.
 * Accepts an optional parseValidator to validate or transform the parsed value.
 */
export function getStoredItem<T>(
  key: string,
  fallback: T,
  parseValidator?: (parsed: unknown) => boolean | T | null | undefined
): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    if (parseValidator) {
      const validatorResult = parseValidator(parsed);
      if (typeof validatorResult === 'boolean') {
        return validatorResult ? (parsed as T) : fallback;
      }
      if (validatorResult !== null && validatorResult !== undefined) {
        return validatorResult as T;
      }
      return fallback;
    }

    return (parsed !== null && parsed !== undefined ? parsed : fallback) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely serializes and saves an item to localStorage.
 */
export function setStoredItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely removes an item from localStorage.
 */
export function removeStoredItem(key: string): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
