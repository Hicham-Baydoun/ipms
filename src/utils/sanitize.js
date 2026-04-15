import DOMPurify from 'dompurify';

export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  // Strip all HTML/JS, then trim whitespace
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};
