import React from 'react';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['CRITICAL', 'CRITICAL_GAP', 'SEVERELY_FLOODED', 'REJECTED', 'CANCELLED'].includes(normalized)) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200';
  } else if (['SEVERE', 'RESPONSE_GAP', 'PARTIALLY_FLOODED', 'HIGH', 'WARNING', 'VERIFICATION_REQUIRED', 'UNVERIFIED', 'PENDING'].includes(normalized)) {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (['ASSIGNED', 'ACCEPTED', 'PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'IN_PROGRESS', 'ACTIVE'].includes(normalized)) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['DELIVERED', 'VERIFIED', 'RESOLVED', 'SAFE', 'LOW', 'SUCCESS', 'AVAILABLE', 'VERIFIED_NEED'].includes(normalized)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['DEMO_DATA', 'SIMULATION'].includes(normalized)) {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-300 font-mono text-[10px]';
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
