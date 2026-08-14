import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Users, 
  Package, 
  Droplet, 
  Search,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ReliefAssignment } from '../types';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [criticalAreas, setCriticalAreas] = useState<any[]>([]);
  const [activeOps, setActiveOps] = useState<ReliefAssignment[]>([]);
  const [priorityActions, setPriorityActions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'VERIFIED' | 'ASSIGNED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Mocked/Fetched stats
  const [stats, setStats] = useState({
    distressSignals: 18,
    verifiedHouseholds: 142,
    dispatchedCargo: 1250,
    activeConvoys: 1,
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        let reports: any[] = [];
        let assignments: ReliefAssignment[] = [];
        let signals: any[] = [];

        try {
          const res = await apiClient.get<any[]>('/reports?limit=100');
          reports = res.data || [];
        } catch {}

        try {
          const res = await apiClient.get<ReliefAssignment[]>('/assignments');
          assignments = res.data || [];
        } catch {}

        try {
          const res = await apiClient.get<any[]>('/verification/signals');
          signals = res.data || [];
        } catch {}

        // Populate Critical Areas with rich data
        const initialAreas = [
          {
            id: 'sonagazi',
            upazila: 'Sonagazi',
            district: 'Feni',
            flood_status: 'Severe Inundation',
            water_depth: '2.4 meters',
            danger_level: 85,
            reports_count: 18,
            households: 142,
            needs: ['Emergency Food', 'Clean Water', 'First Aid'],
            verification_status: 'VERIFICATION_REQUIRED',
            lat: 22.8468,
            lon: 91.3934,
            anchor_school: 'Sonagazi Government College',
          },
          {
            id: 'fulgazi',
            upazila: 'Fulgazi',
            district: 'Feni',
            flood_status: 'Critical Flash Flood',
            water_depth: '2.8 meters',
            danger_level: 92,
            reports_count: 8,
            households: 65,
            needs: ['Boat Evacuation', 'Dry Food'],
            verification_status: 'VERIFICATION_REQUIRED',
            lat: 23.1667,
            lon: 91.4333,
            anchor_school: 'Fulgazi Pilot High School',
          },
          {
            id: 'parshuram',
            upazila: 'Parshuram',
            district: 'Feni',
            flood_status: 'Embankment Breach',
            water_depth: '3.1 meters',
            danger_level: 95,
            reports_count: 12,
            households: 90,
            needs: ['Shelter Rations', 'Water Purification'],
            verification_status: 'NEEDS_VERIFICATION',
            lat: 23.2167,
            lon: 91.4500,
            anchor_school: 'Parshuram Govt College',
          },
          {
            id: 'feni-sadar',
            upazila: 'Feni Sadar',
            district: 'Feni',
            flood_status: 'Urban Waterlogging',
            water_depth: '1.6 meters',
            danger_level: 60,
            reports_count: 14,
            households: 110,
            needs: ['Drinking Water', 'Baby Food'],
            verification_status: 'NEEDS_VERIFICATION',
            lat: 23.0125,
            lon: 91.3989,
            anchor_school: 'Feni Model College',
          }
        ];

        setCriticalAreas(initialAreas);
        setActiveOps(assignments);

        if (assignments.length > 0) {
          setStats(prev => ({
            ...prev,
            activeConvoys: assignments.filter(a => a.status !== 'DELIVERED').length,
          }));
        }

        // Priority Action Cards
        setPriorityActions([
          {
            id: 1,
            urgency: 'CRITICAL',
            title: '18 Community Distress Requests in Sonagazi',
            subtitle: '142 families sheltered in Sonagazi Govt College require dry food & clean water.',
            actionLabel: 'Verify on Response Map',
            type: 'verify',
            link: '/map?lat=22.8468&lon=91.3934&zoom=13',
            badgeColor: 'bg-red-50 text-red-700 border-red-200',
            dotColor: 'bg-red-500',
          },
          {
            id: 2,
            urgency: 'HIGH PRIORITY',
            title: 'Parshuram Embankment Breach Alert',
            subtitle: '12 new reports. Local High School ready as cyclone verification hub.',
            actionLabel: 'Contact Local Authority',
            type: 'contact',
            link: '/map?lat=23.2167&lon=91.4500&zoom=13',
            badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
            dotColor: 'bg-orange-500',
          },
          {
            id: 3,
            urgency: 'ACTIVE OPERATION',
            title: 'BDRCS Speedboat Convoy #1 Dispatched',
            subtitle: '500 Food Packs & 300L Water approaching Sonagazi ground distribution point.',
            actionLabel: 'Track Live Delivery',
            type: 'track',
            link: '/operations',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            dotColor: 'bg-blue-500',
          }
        ]);
      } catch (err) {
        console.error('Error fetching overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  // Filtered areas
  const filteredAreas = criticalAreas.filter(area => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CRITICAL') return area.danger_level >= 85;
    if (activeFilter === 'VERIFIED') return area.verification_status === 'VERIFIED';
    if (activeFilter === 'ASSIGNED') return area.verification_status === 'ASSIGNED';
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 🔴 Top Live Emergency Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Active Disaster Operation
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-300 font-mono">Feni & Muhuri Basin Inundation</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Humanitarian Flood Relief Command
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time geospatial verification, local anchor coordination with schools/colleges, and relief convoy tracking across 4 flood-affected upazilas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/map')}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Response Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 📊 Interactive Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Distress Signals</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.distressSignals}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span>4 Upazilas Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Families</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.verifiedHouseholds}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Ground Verified</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Allocated Cargo</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.dispatchedCargo} <span className="text-xs font-medium text-slate-500">Units</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-700 font-semibold">
            <span>Food, Water & Med Kits</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Convoys</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.activeConvoys} <span className="text-xs font-medium text-slate-500">En Route</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Speedboat Unit Active</span>
          </div>
        </div>
      </div>

      {/* ⚡ Priority Actions Requiring Attention */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Priority Actions Requiring Attention
            </h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
              3 IMMEDIATE
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Real-time Emergency Feed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {priorityActions.map((act) => (
            <div
              key={act.id}
              onClick={() => navigate(act.link)}
              className="bg-white border border-slate-200 hover:border-slate-400 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${act.badgeColor}`}>
                    {act.urgency}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${act.dotColor} animate-pulse`} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                  {act.title}
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {act.subtitle}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-red-600">
                <span>{act.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🗺️ Current Critical Flood Areas (Interactive List & Filter Tabs) */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Critical Flood Zones & Anchor Institutions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any locality to inspect nearby schools, verify ground reports, and assign relief rations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Zones (4)
            </button>
            <button
              onClick={() => setActiveFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${activeFilter === 'CRITICAL' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Severe Depth (3)
            </button>
          </div>
        </div>

        {/* Zones Table / List */}
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              onClick={() => navigate(`/map?lat=${area.lat}&lon=${area.lon}&zoom=13&title=${encodeURIComponent(area.upazila)}`)}
              className="p-4 hover:bg-slate-50/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {area.upazila}, {area.district}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold">
                    {area.flood_status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span><strong>Water Depth:</strong> {area.water_depth}</span>
                  <span>•</span>
                  <span><strong>Reports:</strong> {area.reports_count} distress signals</span>
                  <span>•</span>
                  <span><strong>Affected:</strong> ~{area.households} families</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">Anchor: {area.anchor_school}</span>
                </div>

                {/* Primary Needs Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {area.needs.map((nd: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-medium text-slate-700">
                      {nd}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button & Inundation Meter */}
              <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Severity Index</div>
                  <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: `${area.danger_level}%` }} />
                  </div>
                </div>

                <button className="px-3 py-1.5 bg-slate-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Inspect on Map</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🚚 Active Operations & Convoy Fleet */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Relief Convoys ({activeOps.length || 1})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression of certified humanitarian delivery units.
            </p>
          </div>

          <button
            onClick={() => navigate('/operations')}
            className="text-xs font-bold text-slate-900 hover:text-red-600 flex items-center gap-1"
          >
            <span>Manage All Operations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">Operation #1 — Sonagazi, Feni</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                  IN TRANSIT
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Provider: <strong>Bangladesh Red Crescent Society (BDRCS) - Feni Unit</strong> • Target: 142 Households
              </div>
            </div>

            <button
              onClick={() => navigate('/operations')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Open Operations Deck →</span>
            </button>
          </div>

          {/* Stepper Display */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold pt-1">
            <div className="p-2 rounded-lg bg-slate-900 text-white">✓ 1. Assigned</div>
            <div className="p-2 rounded-lg bg-blue-600 text-white">✓ 2. Dispatched</div>
            <div className="p-2 rounded-lg bg-blue-700 text-white animate-pulse">🚚 3. In Transit</div>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-500">4. Ground Delivered</div>
          </div>
        </div>
      </section>
    </div>
  );
};
