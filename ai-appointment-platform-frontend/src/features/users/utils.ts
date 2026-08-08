import type { User } from './types';

export const ROLE_BADGE_CLASS: Record<User['rol'], string> = {
  OWNER: 'badge badge-warning',
  ADMIN: 'badge badge-primary',
  STAFF: 'badge badge-info',
};

export const canUserModifyRow = (
  rowRole: User['rol'],
  viewerRole: 'OWNER' | 'ADMIN' | 'STAFF',
): boolean => {
  const isOwnerRow = rowRole === 'OWNER';
  return !isOwnerRow && (viewerRole === 'OWNER' || rowRole === 'STAFF');
};
