import { Timestamp } from 'firebase/firestore';

export const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
};

export const toDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toTimestampOrNull = (value) => {
  const date = toDateValue(value);
  return date ? Timestamp.fromDate(date) : null;
};

export const cleanUndefined = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const mapZoneFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    zoneName: data.zoneName || '',
    ageGroup: data.ageGroup || '',
    activityType: data.activityType || '',
    capacity: Number(data.capacity || 0),
    currentOccupancy: Number(data.currentOccupancy || 0),
    isActive: Boolean(data.isActive),
    safetyRules: data.safetyRules || '',
    createdAt: toIsoString(data.createdAt)
  };
};

export const mapStaffFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    gender: data.gender || '',
    dateOfBirth: toIsoString(data.dateOfBirth),
    phone: data.phone || data.phoneNumber || '',
    phoneNumber: data.phoneNumber || data.phone || '',
    address: data.address || '',
    role: data.role || 'Staff',
    email: data.email || '',
    uid: data.uid || '',
    isActive: data.isActive !== false
  };
};

export const mapUserFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || data.fullName || '',
    fullName: data.fullName || data.name || '',
    dateOfBirth: toIsoString(data.dateOfBirth),
    gender: data.gender || '',
    guardianName: data.guardianName || '',
    guardianContact: data.guardianContact || '',
    guardianId: data.guardianUid || null,
    guardianUid: data.guardianUid || null,
    medicalInfo: data.medicalInfo || '',
    allergies: data.allergies || '',
    assignedZoneId: data.assignedZoneId || null,
    checkInTime: toIsoString(data.checkInTime),
    checkOutTime: toIsoString(data.checkOutTime),
    isCheckedIn: Boolean(data.isCheckedIn),
    braceletId: data.braceletId || null
  };
};

export const mapSessionFromFirestore = (doc) => {
  const data = doc.data();
  const staffId = data.staffId || (Array.isArray(data.assignedStaff) ? data.assignedStaff[0] : null);
  return {
    id: doc.id,
    zoneId: data.zoneId || '',
    startTime: toIsoString(data.startTime),
    endTime: toIsoString(data.endTime),
    assignedStaff: staffId ? [staffId] : [],
    staffId,
    sessionType: data.sessionType || 'General',
    maxParticipants: Number(data.maxParticipants || 0),
    currentParticipants: Number(data.currentParticipants || 0),
    status: data.status || 'scheduled'
  };
};

export const mapAttendanceFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId || '',
    zoneId: data.zoneId || '',
    checkInTime: toIsoString(data.checkInTime),
    checkOutTime: toIsoString(data.checkOutTime),
    eventType: data.eventType || 'Normal',
    staffId: data.staffId || '',
    userName: data.userName || '',
    zoneName: data.zoneName || '',
    duration: data.duration ?? null
  };
};

export const mapAuditFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    action: data.action || '',
    performedBy: data.performedBy || '',
    performedByName: data.performedByName || data.performedBy || '',
    targetId: data.targetId || '',
    targetName: data.targetName || data.targetId || '',
    targetType: data.targetType || '',
    details: data.details || '',
    timestamp: toIsoString(data.timestamp)
  };
};

export const mapGuardianFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    childrenIds: Array.isArray(data.childrenIds) ? data.childrenIds : [],
    authorizedPickup: Array.isArray(data.authorizedPickup) ? data.authorizedPickup : []
  };
};

export const mapBraceletFromFirestore = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId || null,
    issueDate: toIsoString(data.issueDate),
    expiryDate: toIsoString(data.expiryDate),
    isActive: data.isActive !== false
  };
};
