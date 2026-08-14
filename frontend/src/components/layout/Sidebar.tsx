import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  FileText,
  CheckCircle2,
  Users2,
  Truck,
  School,
  AlertTriangle,
  MessageSquare,
  History,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  bangla: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', bangla: 'সারসংক্ষেপ', path: '/', icon: LayoutDashboard },
  { name: 'Interactive Map', bangla: 'ম্যাপ ও জিআইএস', path: '/map', icon: Map },
  { name: 'Community Reports', bangla: 'ত্রাণ রিপোর্ট', path: '/reports', icon: FileText },
  { name: 'Verification', bangla: 'সরেজমিনে যাচাই', path: '/verification', icon: CheckCircle2 },
  { name: 'Relief Providers', bangla: 'দাতা সংস্থা', path: '/providers', icon: Users2 },
  { name: 'Relief Operations', bangla: 'ডেলিভারি ট্র্যাকিং', path: '/operations', icon: Truck },
  { name: 'Institutions', bangla: 'স্কুল ও কলেজ', path: '/institutions', icon: School },
  { name: 'Gap Detection', bangla: 'ঘাটতি শনাক্তকরণ', path: '/gaps', icon: AlertTriangle, badge: 'AUTO', badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-800' },
  { name: 'SMS Center', bangla: 'এসএমএস সিমুলেটর', path: '/sms', icon: MessageSquare, badge: 'LIVE', badgeColor: 'bg-sky-900/60 text-sky-300 border-sky-800' },
  { name: 'Audit Log', bangla: 'কার্যক্রম ইতিহাস', path: '/audit', icon: History },
  { name: 'Settings', bangla: 'সেটিংস', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col justify-between p-3 select-none flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          Command Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-[10px] text-slate-500 font-bangla leading-none mt-0.5">
                    {item.bangla}
                  </span>
                </div>
              </div>
              {item.badge && (
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold', item.badgeColor)}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="mt-4 pt-3 border-t border-slate-900 px-3 py-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            GIS Engine Active
          </span>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-mono">
          PostGIS + MapLibre GL
        </div>
      </div>
    </aside>
  );
};
