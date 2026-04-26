import { calculateAge } from './ageCalculator';

export const parseAgeRange = (ageGroup) => {
  if (ageGroup === "18+") return { min: 18, max: 120 };
  if (ageGroup === "Under 3") return { min: 0, max: 2 };
  
  const match = ageGroup.match(/(\d+)-(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return { min: 0, max: 120 };
};

export const isAgeEligibleForZone = (age, zoneAgeGroup) => {
  const { min, max } = parseAgeRange(zoneAgeGroup);
  return age >= min && age <= max;
};

export const getEligibleZones = (dateOfBirth, zones) => {
  const age = calculateAge(dateOfBirth);
  if (age === null) return [];
  
  return zones.filter(zone => {
    const isEligible = isAgeEligibleForZone(age, zone.ageGroup);
    const hasCapacity = zone.currentOccupancy < zone.capacity;
    return isEligible && hasCapacity && zone.isActive;
  });
};

export const getZoneCapacityStatus = (zone) => {
  const percentage = (zone.currentOccupancy / zone.capacity) * 100;
  if (percentage >= 90) return 'full';
  if (percentage >= 70) return 'near-capacity';
  return 'available';
};
