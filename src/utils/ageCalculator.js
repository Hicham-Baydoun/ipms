import { differenceInYears } from 'date-fns';

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  return differenceInYears(new Date(), new Date(dateOfBirth));
};

export const getAgeGroup = (age) => {
  if (age === null || age === undefined) return null;
  if (age < 3) return "Under 3";
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  if (age <= 12) return "9-12";
  if (age <= 17) return "13-17";
  return "18+";
};
