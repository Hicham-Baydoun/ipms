// Facility-wide configuration — update these values without touching component code
export const FACILITY_CONFIG = {
  emergencyContact: import.meta.env.VITE_EMERGENCY_CONTACT || '+1-555-9999',
  facilityName: import.meta.env.VITE_FACILITY_NAME || 'Indoor Playground',
};
