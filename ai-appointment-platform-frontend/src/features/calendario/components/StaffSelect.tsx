import React from 'react';
import { UserCheck } from 'lucide-react';
import type { Usuario } from '../../../types';

interface StaffSelectProps {
  staffList: Usuario[];
  selectedStaffId?: number;
  onSelect: (staffId?: number) => void;
}

export const StaffSelect = ({
  staffList,
  selectedStaffId,
  onSelect,
}: StaffSelectProps): React.JSX.Element | null => {
  if (staffList.length <= 1) return null;

  return (
    <div>
      <label className="block text-sm font-semibold text-txt mb-1.5">Asignar Staff</label>
      <div className="relative">
        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
        <select
          value={selectedStaffId ?? ''}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : undefined)}
          className="input-modern pl-10 appearance-none bg-surface"
        >
          <option value="">Sin asignar</option>
          {staffList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre} ({u.rol})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
