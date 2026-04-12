export const validateName = (name) => {
  if (!name || name.trim().length < 2) return "Name must be at least 2 characters";
  if (name.trim().length > 50) return "Name must be less than 50 characters";
  if (!/^[a-zA-Z\s'-]+$/.test(name)) return "Name can only contain letters, spaces, hyphens and apostrophes";
  return null;
};

export const validateEmail = (email) => {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.length < 7 || cleaned.length > 15) return "Phone number must be 7-15 digits";
  if (!/^[\d\s\+\-]+$/.test(phone)) return "Phone can only contain digits, spaces, + and -";
  return null;
};

export const validateAge = (age) => {
  const numAge = parseInt(age);
  if (isNaN(numAge) || numAge < 0) return "Age must be a positive number";
  if (numAge > 120) return "Please enter a valid age";
  return null;
};

export const validateCapacity = (capacity) => {
  const numCap = parseInt(capacity);
  if (isNaN(numCap) || numCap < 1) return "Capacity must be at least 1";
  if (numCap > 500) return "Capacity cannot exceed 500";
  return null;
};

export const validateTextarea = (text, maxLength = 500) => {
  if (!text) return null;
  if (text.length > maxLength) return `Text must be less than ${maxLength} characters`;
  return null;
};

export const validateRequired = (value, fieldName = "Field") => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};
