import { format, formatDistanceToNow } from 'date-fns';

export const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDate = (date, pattern = 'MMM dd, yyyy') => {
  const parsed = toDate(date);
  if (!parsed) return '-';
  return format(parsed, pattern);
};

export const formatTime = (date, pattern = 'h:mm a') => {
  const parsed = toDate(date);
  if (!parsed) return '-';
  return format(parsed, pattern);
};

export const formatDateTime = (date) => {
  const parsed = toDate(date);
  if (!parsed) return '-';
  return format(parsed, 'MMM dd, yyyy h:mm a');
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

export const formatRelativeTime = (date) => {
  const parsed = toDate(date);
  if (!parsed) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true });
};

export const formatPhone = (phone) => {
  if (!phone) return '-';
  return phone;
};
