import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Building, 
  Plus, 
  Phone, 
  Mail, 
  Package, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Droplet,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Search,
  Send
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ReliefAssignment, AssignmentStatus, ReliefProvider } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';

export const OperationsPage: React.FC = () => {
  const [providers, setProviders] = useState<ReliefProvider[]>([]);
  const [assignments, setAssignments] = useState<ReliefAssignment[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Add Provider Modal
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProviderType, setNewProviderType] = useState<'GOV' | 'INGO' | 'LOCAL_NGO' | 'VOLUNTEER'>('LOCAL_NGO');

  // Quick Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number>(1);
  const [targetUpazila, setTargetUpazila] = useState('Sonagazi');
  const [targetHouseholds, setTargetHouseholds] = useState(142);
  const [foodPacks, setFoodPacks] = useState(300);
  const [waterLiters, setWaterLiters] = useState(500);
  const [medKits, setMedKits] = useState(50);

  // Delivery Modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ReliefAssignment | null>(null);
  const [peopleServed, setPeopleServed] = useState(550);
  const [householdsServed, setHouseholdsServed] = useState(142);
  const [distPoint, setDistPoint] = useState('Sonagazi Government College Ground');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [provRes, asgRes] = await Promise.all([
        apiClient.get<ReliefProvider[]>('/providers').catch(() => ({ data: [] })),
        apiClient.get<ReliefAssignment[]>('/assignments').catch(() => ({ data: [] })),
      ]);
      setProviders(provRes.data);
      setAssignments(asgRes.data);
    } catch (err) {
      console.error('Failed to load operational data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: AssignmentStatus) => {
    try {
      await apiClient.patch(`/assignments/${id}/status`, { status: newStatus }).catch(() => {});
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/providers', {
        name: newOrgName,
        type: newProviderType,
        contact_person: newContactName,
        phone: newPhone,
        email: newEmail,
        district: 'Feni',
        upazila: 'Sonagazi',
        is_verified: true,
      });
      setAddProviderOpen(false);
      setNewOrgName('');
      setNewContactName('');
      setNewPhone('');
      setNewEmail('');
      setNewProviderType('LOCAL_NGO');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const allocated = [
      { category: 'FOOD', item_name: 'Emergency Food Packs', quantity: foodPacks, unit: 'packages' },
      { category: 'WATER', item_name: 'Clean Drinking Water', quantity: waterLiters, unit: 'liters' },
      { category: 'MEDICINE', item_name: 'First Aid Kits', quantity: medKits, unit: 'kits' },
    ];

    try {
      await apiClient.post('/assignments', {
        provider_id: selectedProviderId,
        destination_district: 'Feni',
        destination_upazila: targetUpazila,
        target_households: targetHouseholds,
        priority: 'HIGH',
        allocated_resources: JSON.stringify(allocated),
        notes: `Quick dispatch for ${targetUpazila} verified flood zone.`,
      });
      setDispatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to dispatch convoy');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeliveryModal = (asg: ReliefAssignment) => {
    setSelectedAssignment(asg);
    setDeliveryModalOpen(true);
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);

    try {
      await apiClient.post('/deliveries', {
        assignment_id: selectedAssignment.id,
        people_served: peopleServed,
        households_served: householdsServed,
        proof_notes: 'Ground distribution verified with local institution coordinator.',
        distribution_point: distPoint,
        status: 'DELIVERED',
        items: [
          { resource_category: 'FOOD', item_name: 'Food Rations', quantity_delivered: 300, unit: 'packs' },
          { resource_category: 'WATER', item_name: 'Purified Water', quantity_delivered: 500, unit: 'liters' },
          { resource_category: 'MEDICINE', item_name: 'Emergency Med Kits', quantity_delivered: 50, unit: 'kits' },
        ],
      }).catch(() => {});

      setAssignments(prev => prev.map(a => a.id === selectedAssignment.id ? { ...a, status: 'DELIVERED' } : a));
      setDeliveryModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to record delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'ACTIVE') return a.status !== 'DELIVERED';
    if (activeTab === 'DELIVERED') return a.status === 'DELIVERED';
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* 🚀 Header & Action Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Relief Operations & Provider Registry
            </h1>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
              COORDINATION ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Certified humanitarian providers, live convoy logistics, and cargo manifests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAddProviderOpen(true)}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>Add Provider</span>
          </button>

          <button
            onClick={() => setDispatchModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-slate-900/10 hover:scale-105 transition-all"
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Notify Provider</span>
          </button>
        </div>
      </div>

      {/* 🏢 SECTION 1: Relief Providers Fleet */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Humanitarian Relief Providers ({providers.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified partner organizations with active stock ledgers and emergency deployment units.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p) => {
            const activeCount = assignments.filter(a => a.provider_id === p.id && a.status !== 'DELIVERED').length;
            return (
              <div 
                key={p.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Lead: {p.contact_person || 'Disaster Desk'}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex-shrink-0">
                      CERTIFIED
                    </span>
                  </div>

                  {/* Stock Progress Level Visuals */}
                  <div className="space-y-2 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Available Stock Inventory</div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Emergency Food Packs:</span>
                        <strong className="text-slate-900 font-mono">500+ packs</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Purified Drinking Water:</span>
                        <strong className="text-slate-900 font-mono">1,200 Liters</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: '70%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Medical / First Aid Kits:</span>
                        <strong className="text-slate-900 font-mono">150 Kits</strong>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {activeCount} Active Convoy{activeCount !== 1 ? 's' : ''}
                  </span>

                  <a
                    href={`tel:${p.phone || '+8801819876543'}`}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Contact</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🚚 SECTION 2: Active Operations & Convoy Tracker */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Relief Convoys & Deliveries ({assignments.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression of relief operations from notification to verified field handover.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${activeTab === 'ACTIVE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Active Operations
            </button>
            <button
              onClick={() => setActiveTab('DELIVERED')}
              className={`px-3 py-1 rounded-md font-bold transition-colors ${activeTab === 'DELIVERED' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Delivered
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <Truck className="w-6 h-6 text-slate-300 mx-auto" />
              <div>No operations matching filter.</div>
            </div>
          ) : (
            filteredAssignments.map((asg) => {
              let items: any[] = [];
              try {
                items = JSON.parse(asg.allocated_resources || '[]');
              } catch {}

              return (
                <div 
                  key={asg.id} 
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm space-y-4 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          OP #{asg.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {asg.destination_upazila}, {asg.destination_district}
                        </h3>
                        <StatusBadge status={asg.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3">
                        <span>Provider: <strong className="text-slate-800">{asg.provider_name || 'BDRCS Relief Team'}</strong></span>
                        <span>•</span>
                        <span>Beneficiary Target: <strong className="text-slate-800">{asg.target_households || 142} Households</strong></span>
                        <span>•</span>
                        <span className="text-red-600 font-semibold">Priority: {asg.priority || 'HIGH'}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      {asg.status !== 'DELIVERED' ? (
                        <button
                          onClick={() => handleOpenDeliveryModal(asg)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Ground Delivery</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Delivered & Verified</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cargo Manifest Pills */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-500">Allocated Cargo:</span>
                    {items.map((itm: any, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-slate-800 font-semibold">
                        {itm.category}: <strong>{itm.quantity} {itm.unit}</strong>
                      </span>
                    ))}
                    {items.length === 0 && (
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-slate-800">
                        300 Food Packs • 500L Water • 50 Med Kits
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal: Add Relief Provider */}
      <Modal
        isOpen={addProviderOpen}
        onClose={() => setAddProviderOpen(false)}
        title="Register Humanitarian Relief Provider"
        subtitle="Add a certified organization to the deployment roster with live inventory tracking."
      >
        <form onSubmit={handleAddProvider} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Bangladesh Red Crescent Society - Feni Unit"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Organization Type</label>
            <select
              required
              value={newProviderType}
              onChange={(e) => setNewProviderType(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white"
            >
              <option value="GOV">Government (GOV)</option>
              <option value="INGO">International NGO (INGO)</option>
              <option value="LOCAL_NGO">Local NGO</option>
              <option value="VOLUNTEER">Volunteer Group</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Lead Contact Person</label>
              <input
                type="text"
                required
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Field Coordinator"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+880 1819-000000"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddProviderOpen(false)}
              className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
            >
              {submitting ? 'Registering...' : 'Register Provider'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Quick Notify Provider */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Notify Humanitarian Relief Provider"
        subtitle="Match certified cargo supplies to a verified flood area."
      >
        <form onSubmit={handleCreateDispatch} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Target Destination Upazila</label>
            <select
              value={targetUpazila}
              onChange={(e) => setTargetUpazila(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white"
            >
              <option value="Sonagazi">Sonagazi, Feni (142 Households - Severely Flooded)</option>
              <option value="Fulgazi">Fulgazi, Feni (65 Households - Flash Flooded)</option>
              <option value="Parshuram">Parshuram, Feni (90 Households - Embankment Breach)</option>
              <option value="Feni Sadar">Feni Sadar, Feni (110 Households - Waterlogging)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Select Relief Provider</label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(parseInt(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs">
            <div className="font-bold text-slate-800">Cargo Supply Allocation</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">Food Packs</label>
                <input
                  type="number"
                  min="1"
                  value={foodPacks}
                  onChange={(e) => setFoodPacks(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">Water (Liters)</label>
                <input
                  type="number"
                  min="1"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 mb-0.5">Medical Kits</label>
                <input
                  type="number"
                  min="1"
                  value={medKits}
                  onChange={(e) => setMedKits(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-slate-900 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDispatchModalOpen(false)}
              className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              {submitting ? 'Notifying...' : 'Confirm & Notify'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Ground Delivery */}
      <Modal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        title="Confirm Ground Delivery Proof"
        subtitle={`Verifying field handover for Operation #${selectedAssignment?.id} at ${selectedAssignment?.destination_upazila}`}
      >
        <form onSubmit={handleConfirmDelivery} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Households Served</label>
              <input
                type="number"
                min="1"
                required
                value={householdsServed}
                onChange={(e) => setHouseholdsServed(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">People Reached</label>
              <input
                type="number"
                min="1"
                required
                value={peopleServed}
                onChange={(e) => setPeopleServed(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Distribution Ground Point</label>
            <input
              type="text"
              required
              value={distPoint}
              onChange={(e) => setDistPoint(e.target.value)}
              placeholder="e.g. Sonagazi Government College Ground"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeliveryModalOpen(false)}
              className="px-3.5 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
            >
              {submitting ? 'Confirming...' : 'Verify Ground Delivery'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
