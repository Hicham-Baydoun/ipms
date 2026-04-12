/**
 * Generates a unique username from a display name.
 * Uses the first word of the name, lowercased and stripped of non-alphanumeric chars.
 * Appends a zero-padded suffix ("01", "02", ...) if the base is already taken.
 *
 * @param {string} name - Display name (e.g. "Hicham El Amrani")
 * @param {string[]} existingUsernames - Usernames already in use
 * @returns {string} Unique username (e.g. "hicham" or "hicham01")
 */
export const generateUsername = (name = '', existingUsernames = []) => {
  const base = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const taken = new Set(existingUsernames);

  if (!taken.has(base)) return base;

  for (let i = 1; i <= 99; i++) {
    const candidate = `${base}${String(i).padStart(2, '0')}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${base}${Date.now()}`;
};
