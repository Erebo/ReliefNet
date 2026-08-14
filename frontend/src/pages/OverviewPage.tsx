import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, ShieldCheck, Package, Truck, CheckCircle2,
  Clock, AlertTriangle, ChevronRight, MapPin, ArrowRight,
  ChevronDown, Circle, Play, RefreshCw, Cpu, AlertOctagon,
  Anchor, X
} from 'lucide-react';

// ─── Flood Scenarios ──────────────────────────────────────────────────────────
const FLOOD_SCENARIOS = [
  {
    id: 'feni',
    name: 'Feni & Muhuri River Flood',
    district: 'Feni',
    badge: 'bg-red-600',
    border: 'border-red-200',
    bg: 'bg-red-50',
    text: 'text-red-700',
    severity: 'CRITICAL',
    lat: 22.95, lon: 91.41,
  },
  {
    id: 'noakhali',
    name: 'Meghna Coastal Surge',
    district: 'Noakhali',
    badge: 'bg-orange-500',
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    severity: 'SEVERE',
    lat: 22.76, lon: 91.22,
  },
  {
    id: 'sylhet',
    name: 'Sylhet Surma Flash Flood',
    district: 'Sylhet',
    badge: 'bg-amber-500',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    severity: 'HIGH',
    lat: 25.07, lon: 91.93,
  },
];

const INITIAL_SMS: Record<string, any[]> = {
  feni: [
    { id: 1, from: '+880 1712-334455', area: 'Sonagazi Sadar', time: '2h ago', message: 'Amar bari 4 foot pani. 6 jon manus shelter dorkaar. Khaabar nai.', needs: ['Food', 'Shelter'], status: 'PENDING' },
    { id: 2, from: '+880 1819-556677', area: 'Mangalkandi, Sonagazi', time: '3h ago', message: 'School er niche 2 feet pani. 20+ family school e ache. Pani khaabar dorkaar.', needs: ['Water', 'Food'], status: 'PENDING' },
    { id: 3, from: '+880 1612-778899', area: 'Char Chandia', time: '5h ago', message: 'Embankment venge geche. Noushabar dorkar. Bacha manush trap hoise.', needs: ['Boat Evacuation', 'Medicine'], status: 'VERIFIED' },
    { id: 4, from: '+880 1815-990011', area: 'Parshuram Sadar', time: '6h ago', message: 'Ghore pani uthse. Shishu o bridhho manush shelter dorkaar.', needs: ['Food', 'Medicine'], status: 'VERIFIED' },
  ],
  noakhali: [
    { id: 5, from: '+880 1713-112233', area: 'Companiganj Sadar', time: '4h ago', message: 'Tidal bore eshe sob shesh. Boats dorkar fori tahole bachanao.', needs: ['Boat Evacuation', 'Food'], status: 'PENDING' },
    { id: 6, from: '+880 1817-445566', area: 'Senbagh', time: '7h ago', message: 'Pani 3 feet. Oshudh nai. Babies ache.', needs: ['Medicine', 'Water'], status: 'VERIFIED' },
  ],
  sylhet: [
    { id: 7, from: '+880 1615-667788', area: 'Gowainghat', time: '1h ago', message: 'Haor beshi pani. Nouka na hole ber howa jayena. Khaabar shesh.', needs: ['Boat Evacuation', 'Food'], status: 'PENDING' },
    { id: 8, from: '+880 1918-889900', area: 'Jaintapur', time: '2h ago', message: 'School building te 40+ family. Khaabar paani kichui nai.', needs: ['Food', 'Water'], status: 'PENDING' },
    { id: 9, from: '+880 1714-001122', area: 'Companiganj (Sylhet)', time: '4h ago', message: 'Bishwas korben na, ghor soho shob dube geche.', needs: ['Shelter', 'Food', 'Medicine'], status: 'VERIFIED' },
  ],
};

const INITIAL_RELIEF_STATUS: Record<string, any[]> = {
  feni: [
    { id: 1, area: 'Char Chandia, Sonagazi', households: 32, needs: ['Boat Evacuation', 'Medicine'], status: 'AWAITING_RELIEF', relief_by: null },
    { id: 2, area: 'Parshuram Sadar', households: 47, needs: ['Food', 'Medicine'], status: 'AWAITING_RELIEF', relief_by: null },
    { id: 3, area: 'Mangalkandi, Sonagazi', households: 21, needs: ['Water', 'Food'], status: 'RELIEF_DISPATCHED', relief_by: 'BDRCS Feni Unit' },
    { id: 4, area: 'Sonagazi Sadar', households: 58, needs: ['Food', 'Shelter'], status: 'DELIVERED', relief_by: 'As-Sunnah Foundation' },
  ],
  noakhali: [
    { id: 5, area: 'Senbagh', households: 21, needs: ['Medicine', 'Water'], status: 'AWAITING_RELIEF', relief_by: null },
    { id: 6, area: 'Companiganj Sadar', households: 42, needs: ['Boat Evacuation', 'Food'], status: 'RELIEF_DISPATCHED', relief_by: 'BRAC Noakhali Unit' },
  ],
  sylhet: [
    { id: 7, area: 'Companiganj (Sylhet)', households: 71, needs: ['Shelter', 'Food', 'Medicine'], status: 'AWAITING_RELIEF', relief_by: null },
    { id: 8, area: 'Gowainghat', households: 88, needs: ['Boat Evacuation', 'Food'], status: 'AWAITING_RELIEF', relief_by: null },
  ],
};

const STATUS_CONFIG = {
  PENDING:           { label: 'Pending Review', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  VERIFIED:          { label: 'Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  AWAITING_RELIEF:   { label: 'Awaiting Relief', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  RELIEF_DISPATCHED: { label: 'Relief Dispatched', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DELIVERED:         { label: 'Delivered ✓', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
};

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('feni');
  const [showPicker, setShowPicker] = useState(false);

  // Live state
  const [smsData, setSmsData] = useState(INITIAL_SMS);
  const [reliefData, setReliefData] = useState(INITIAL_RELIEF_STATUS);

  // Multithreading Simulation State
  const [isProcessingThreads, setIsProcessingThreads] = useState(false);
  const [threadLogs, setThreadLogs] = useState<string[]>([]);
  const [showThreadPanel, setShowThreadPanel] = useState(false);

  // Error Handling Modals & Toasts
  const [errorModal, setErrorModal] = useState<{ title: string; type: string; message: string; resolution: string } | null>(null);
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);

  const scenario = FLOOD_SCENARIOS.find(s => s.id === activeId) || FLOOD_SCENARIOS[0];
  const smsMessages = smsData[activeId] || [];
  const reliefList   = reliefData[activeId] || [];

  const pendingCount  = smsMessages.filter(m => m.status === 'PENDING').length;
  const verifiedCount = smsMessages.filter(m => m.status === 'VERIFIED').length;
  const awaitingCount = reliefList.filter(r => r.status === 'AWAITING_RELIEF').length;
  const dispatchedCount = reliefList.filter(r => ['RELIEF_DISPATCHED', 'DELIVERED'].includes(r.status)).length;

  // 1. Multithreaded Ingestion Simulation
  const handleRunThreadedSMSIngestion = () => {
    setIsProcessingThreads(true);
    setShowThreadPanel(true);
    setThreadLogs([]);

    const newLogs: string[] = [];
    const addLog = (msg: string) => {
      newLogs.push(msg);
      setThreadLogs([...newLogs]);
    };

    addLog('[ThreadPool] Initializing 3 SMSProcessorWorker threads...');

    setTimeout(() => {
      addLog('[WorkerThread-Feni] Ingesting SMS from Sonagazi: "+880 1799-445566: Water reached rooftop. 12 people trapped"');
    }, 400);

    setTimeout(() => {
      addLog('[WorkerThread-Noakhali] Ingesting SMS from Companiganj: "+880 1888-223344: Need food rations and water purification"');
    }, 800);

    setTimeout(() => {
      addLog('[WorkerThread-Sylhet] Validation error: "INVALID_PHONE: 017999 - Missing +880 country code" (InvalidDistressSignalException caught)');
    }, 1200);

    setTimeout(() => {
      addLog('[ThreadPool] Ingestion completed. 2 new distress signals queued for ground verification.');
      setIsProcessingThreads(false);

      // Append new message into current scenario
      const newMsg = {
        id: Date.now(),
        from: '+880 1799-445566',
        area: 'Sonagazi North Union',
        time: 'Just now',
        message: 'Water reached rooftop. 12 people trapped on roof. Need immediate rescue boat.',
        needs: ['Boat Evacuation', 'Food'],
        status: 'PENDING',
      };

      setSmsData(prev => ({
        ...prev,
        [activeId]: [newMsg, ...(prev[activeId] || [])]
      }));
    }, 1800);
  };

  // 2. Error Handling Simulation: Unverified Dispatch Attempt
  const handleTriggerUnverifiedError = () => {
    setErrorModal({
      type: 'UnverifiedAreaException (Checked Exception)',
      title: 'Relief Dispatch Blocked by System Rule',
      message: "Attempted to dispatch relief convoy to an area with status 'PENDING'. Business rule prohibits dispatch without ground truth verification.",
      resolution: 'Resolve by contacting the local School/College/NGO on the map to verify conditions before dispatching cargo.'
    });
  };

  // 3. Error Handling Simulation: Submerged Highway -> Boat Fallback
  const handleTriggerRoadSubmergedError = () => {
    setFallbackToast('RoadSubmergedException: Main highway submerged under 4.5ft floodwater! Auto-fallback activated: Dispatching Army Rescue Boats.');
    setTimeout(() => setFallbackToast(null), 6000);
  };

  // 4. Verification Action
  const handleVerifyMessage = (id: number, areaName: string) => {
    setSmsData(prev => ({
      ...prev,
      [activeId]: prev[activeId].map(m => m.id === id ? { ...m, status: 'VERIFIED' } : m)
    }));

    // Add to Relief Need List
    const existing = reliefData[activeId].find(r => r.area === areaName);
    if (!existing) {
      const newNeed = {
        id: Date.now(),
        area: areaName,
        households: 28,
        needs: ['Emergency Food', 'Clean Water'],
        status: 'AWAITING_RELIEF',
        relief_by: null
      };
      setReliefData(prev => ({
        ...prev,
        [activeId]: [newNeed, ...prev[activeId]]
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-7">

      {/* ── Submerged Road Fallback Toast ───────────────────────────── */}
      {fallbackToast && (
        <div className="bg-amber-900 border-2 border-amber-400 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-in fade-in duration-200">
          <Anchor className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-200 flex items-center gap-2">
              <span>⚠ RoadSubmergedException Handled</span>
              <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-1.5 py-0.5 rounded">REROUTED</span>
            </div>
            <p className="mt-0.5 text-amber-100">{fallbackToast}</p>
          </div>
          <button onClick={() => setFallbackToast(null)} className="text-amber-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">Active Response</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Command Overview & Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">SMS Ingestion (Multithreaded) → Verification → Relief Need List → Convoy Dispatch</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunThreadedSMSIngestion}
            disabled={isProcessingThreads}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5" />
            {isProcessingThreads ? 'Workers Running...' : 'Simulate Thread Ingestion'}
          </button>

          <button
            onClick={() => navigate('/map')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" /> Map <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Multithreaded Worker Telemetry Panel ─────────────────────── */}
      {showThreadPanel && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Java Multithreading Engine: SMSProcessorPool
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">3 Active Worker Threads</span>
              <button onClick={() => setShowThreadPanel(false)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-3 font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto border border-slate-800">
            {threadLogs.map((log, idx) => (
              <div key={idx} className={`${log.includes('ERROR') || log.includes('Exception') ? 'text-red-400' : log.includes('Successfully') ? 'text-emerald-400' : 'text-slate-300'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scenario Picker & Error Handling Test Strip ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Scenario Picker */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(p => !p)}
            className={`flex items-center gap-3 px-4 py-2.5 bg-white border-2 ${scenario.border} rounded-xl shadow-sm hover:shadow-md transition-all text-left`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${scenario.badge} animate-pulse flex-shrink-0`} />
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900">{scenario.name}</div>
              <div className="text-[10px] text-slate-500">{scenario.district} · {scenario.severity}</div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-2 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
          </button>

          {showPicker && (
            <div className="absolute top-full mt-1 left-0 z-30 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
              {FLOOD_SCENARIOS.map(s => (
                <button key={s.id} onClick={() => { setActiveId(s.id); setShowPicker(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${s.id === activeId ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'}`}>
                  <span className={`w-2 h-2 rounded-full ${s.badge} flex-shrink-0`} />
                  <div>
                    <div className="text-xs font-bold">{s.name}</div>
                    <div className={`text-[10px] ${s.id === activeId ? 'text-slate-300' : 'text-slate-500'}`}>{s.district} · {s.severity}</div>
                  </div>
                  {s.id === activeId && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Java Exception Simulators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Test Java Exceptions:</span>
          <button
            onClick={handleTriggerUnverifiedError}
            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold transition-colors"
          >
            Trigger UnverifiedAreaException
          </button>
          <button
            onClick={handleTriggerRoadSubmergedError}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-bold transition-colors"
          >
            Trigger RoadSubmergedException
          </button>
        </div>
      </div>

      {/* ── Pipeline Summary KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: MessageSquare, label: 'SMS Ingested', value: smsMessages.length, sub: 'via Multi-threaded pool', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: ShieldCheck,   label: 'Pending Verification', value: pendingCount, sub: 'needs ground check', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: AlertTriangle, label: 'Relief Need List', value: awaitingCount, sub: 'verified, awaiting convoy', color: 'text-red-600', bg: 'bg-red-50' },
          { icon: Truck,         label: 'Convoys Active', value: dispatchedCount, sub: 'in transit / delivered', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{k.label}</span>
              <span className={`${k.bg} ${k.color} p-1.5 rounded-lg`}><k.icon className="w-3.5 h-3.5" /></span>
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{k.value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── STEP 1: SMS Inbox (Ingested via Threading) ──────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">SMS Distress Inbox</h2>
              <p className="text-[11px] text-slate-500">Real-time distress messages from flood victims</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Thread-Safe Ingestion Queue</span>
        </div>

        <div className="space-y-2">
          {smsMessages.map(msg => {
            const sc = STATUS_CONFIG[msg.status as keyof typeof STATUS_CONFIG];
            return (
              <div key={msg.id} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-start gap-3 hover:border-slate-300 transition-colors">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center mt-0.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{msg.area}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.from}</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 italic">
                    "{msg.message}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {msg.needs.map((nd: string) => (
                      <span key={nd} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-medium">{nd}</span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold flex items-center gap-1 ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>

                  {msg.status === 'PENDING' && (
                    <button
                      onClick={() => handleVerifyMessage(msg.id, msg.area)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <ShieldCheck className="w-3 h-3" /> Quick Verify
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STEP 2: Relief Need List ──────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">Relief Need List</h2>
              <p className="text-[11px] text-slate-500">Verified zones ready for cargo assignment</p>
            </div>
          </div>
          <button onClick={() => navigate('/operations')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            Fleet Operations <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 grid grid-cols-12 gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Verified Location</div>
            <div className="col-span-2 text-center">Households</div>
            <div className="col-span-3">Urgent Needs</div>
            <div className="col-span-3 text-right">Relief Status</div>
          </div>

          {reliefList.map((row, i) => {
            const sc = STATUS_CONFIG[row.status as keyof typeof STATUS_CONFIG];
            return (
              <div key={row.id}
                className={`px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs transition-colors hover:bg-slate-50/80 ${i < reliefList.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full ${sc.dot} flex-shrink-0`} />
                  <span className="font-bold text-slate-900 truncate">{row.area}</span>
                </div>

                <div className="col-span-2 text-center font-black text-slate-900 font-mono">~{row.households}</div>

                <div className="col-span-3 flex flex-wrap gap-1">
                  {row.needs.map((nd: string) => (
                    <span key={nd} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium">{nd}</span>
                  ))}
                </div>

                <div className="col-span-3 flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold whitespace-nowrap ${sc.color}`}>{sc.label}</span>
                  {row.relief_by && (
                    <span className="text-[9px] text-slate-500 text-right">by {row.relief_by}</span>
                  )}
                  {row.status === 'AWAITING_RELIEF' && (
                    <button onClick={() => navigate('/operations')}
                      className="text-[9px] text-blue-600 hover:text-blue-800 font-bold underline">
                      Assign Convoy →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Error Handling Modal (Checked Exception Demonstration) ──── */}
      {errorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {errorModal.type}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">{errorModal.title}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {errorModal.message}
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <strong className="block font-bold mb-0.5 text-emerald-950">Resolution / Recovery:</strong>
              {errorModal.resolution}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Acknowledge Exception
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
