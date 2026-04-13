import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const usePermissions = () => {
  const { role } = useContext(AuthContext);
  const isStaffLike = role === 'Staff' || role === 'Supervisor';
  const isSupervisorOrAdmin = role === 'Supervisor' || role === 'Admin';

  return {
    role,
    isAdmin: role === 'Admin',
    isSupervisor: role === 'Supervisor',
    isStaff: isStaffLike,
    isGuardian: role === 'Guardian',
    canManageZones: role === 'Admin',
    canManageStaff: role === 'Admin',
    canCheckIn: isStaffLike || role === 'Admin',
    canCheckOut: isStaffLike || role === 'Admin',
    canActivateEmergency: isSupervisorOrAdmin,
    canViewReports: isSupervisorOrAdmin,
    canViewAuditLogs: isSupervisorOrAdmin,
    canEditPickup: role === 'Guardian',
    canViewMedicalInfo: isStaffLike || role === 'Admin',
    canReassignZones: isStaffLike || role === 'Admin',
    canScheduleSessions: role === 'Admin',
    canViewAllUsers: isStaffLike || role === 'Admin',
    canViewOwnChildrenOnly: role === 'Guardian'
  };
};
