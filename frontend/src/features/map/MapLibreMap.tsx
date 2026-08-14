import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreInstance, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Building, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  ArrowLeft, 
  X, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Package,
  Crosshair,
  UserCheck,
} from 'lucide-react';
import { Institution, FloodSimulation, ReliefAssignment, ReliefProvider } from '../../types';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface MapProps {
  initialLat?: number;
  initialLon?: number;
  initialZoom?: number;
}

// Distance helper (Haversine formula in KM)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Initial Sonagazi institutions fallback
const DEFAULT_INSTITUTIONS: any[] = [
  {
    id: 1,
    name: 'Sonagazi Government College',
    bangla_name: 'সোনাগাজী সরকারি কলেজ',
    type: 'COLLEGE',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8485,
    longitude: 91.3912,
    capacity_est: 1200,
    phone: '+880 1819-345678',
    email: 'principal@sonagazigovtcollege.edu.bd',
    address: 'College Road, Sonagazi, Feni',
  },
  {
    id: 2,
    name: 'Sonagazi Islamia Fazil College',
    bangla_name: 'সোনাগাজী ইসলামিয়া ফাজিল মাদ্রাসা ও কলেজ',
    type: 'COLLEGE',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8520,
    longitude: 91.3980,
    capacity_est: 900,
    phone: '+880 1712-456789',
    email: 'info@sonagazi-islamia.edu.bd',
    address: 'Bazar Road, Sonagazi, Feni',
  },
  {
    id: 3,
    name: 'Sonagazi Model High School',
    bangla_name: 'সোনাগাজী মডেল হাই স্কুল',
    type: 'SCHOOL',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8450,
    longitude: 91.3890,
    capacity_est: 850,
    phone: '+880 1818-567890',
    email: 'headmaster@sonagazimodel.edu.bd',
    address: 'Station Road, Sonagazi',
  },
  {
    id: 4,
    name: 'Mangalkandi High School & Cyclone Shelter',
    bangla_name: 'মঙ্গলকান্দি উচ্চ বিদ্যালয় ও আশ্রয়কেন্দ্র',
    type: 'SCHOOL',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Mangalkandi',
    latitude: 22.8610,
    longitude: 91.3780,
    capacity_est: 1500,
    phone: '+880 1817-678901',
    email: 'mangalkandi.school@gmail.com',
    address: 'Mangalkandi Union, Sonagazi, Feni',
  },
  {
    id: 5,
    name: 'Char Chandia Government Primary School',
    bangla_name: 'চর চান্দিয়া সরকারি প্রাথমিক বিদ্যালয়',
    type: 'SCHOOL',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Char Chandia',
    latitude: 22.8250,
    longitude: 91.4120,
    capacity_est: 600,
    phone: '+880 1816-789012',
    email: 'charchandia.gps@gmail.com',
    address: 'Char Chandia, Sonagazi, Feni',
  },
  {
    id: 6,
    name: 'Bangladesh Red Crescent Society (BDRCS) - Sonagazi Unit',
    bangla_name: 'বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি - সোনাগাজী ইউনিট',
    type: 'NGO',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8490,
    longitude: 91.3950,
    capacity_est: 500,
    phone: '+880 1819-876543',
    email: 'sonagazi@bdrcs.org',
    address: 'Red Crescent Disaster Response Unit, Sonagazi',
  },
  {
    id: 7,
    name: 'BRAC Regional Office & Relief Hub',
    bangla_name: 'ব্র্যাক আঞ্চলিক অফিস ও ত্রাণ কেন্দ্র',
    type: 'NGO',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8430,
    longitude: 91.3850,
    capacity_est: 400,
    phone: '+880 1713-009988',
    email: 'relief.sonagazi@brac.net',
    address: 'BRAC Complex, Sonagazi, Feni',
  },
  {
    id: 8,
    name: 'As-Sunnah Foundation Relief Distribution Point',
    bangla_name: 'আস-সুন্নাহ ফাউন্ডেশন ত্রাণ বিতরণ ক্যাম্প',
    type: 'NGO',
    district: 'Feni',
    upazila: 'Sonagazi',
    union: 'Sonagazi Sadar',
    latitude: 22.8550,
    longitude: 91.3910,
    capacity_est: 700,
    phone: '+880 1977-112233',
    email: 'relief@assunnahfoundation.org',
    address: 'Central Eidgah Maidan, Sonagazi, Feni',
  },
];

// Default Sonagazi Flood Polygon Feature
const DEFAULT_SONAGAZI_POLYGON = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [91.350, 22.780],
        [91.420, 22.780],
        [91.440, 22.840],
        [91.460, 22.920],
        [91.450, 23.080],
        [91.480, 23.180],
        [91.450, 23.250],
        [91.400, 23.230],
        [91.380, 23.120],
        [91.360, 23.000],
        [91.340, 22.890],
        [91.350, 22.780],
      ],
    ],
  },
  properties: {
    name: 'Sonagazi-Muhuri Flash Inundation Zone',
    severity: 'CRITICAL',
    upazilas: 'Sonagazi, Feni Sadar, Parshuram, Fulgazi',
  },
};

type PanelMode = 'AREA_OVERVIEW' | 'INSTITUTION_DETAILS' | 'VERIFY_FORM' | 'ASSIGN_RELIEF' | 'TRACK_OPERATION';

export const MapLibreMap: React.FC<MapProps> = ({
  initialLat = 22.8468,
  initialLon = 91.3934,
  initialZoom = 11,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreInstance | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const areaMarkerRef = useRef<Marker | null>(null);

  // Datasets
  const [institutions, setInstitutions] = useState<Institution[]>(DEFAULT_INSTITUTIONS);
  const [floodSimulations, setFloodSimulations] = useState<FloodSimulation[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<ReliefAssignment | null>(null);
  const [providers, setProviders] = useState<ReliefProvider[]>([]);

  // Selected state
  const [selectedArea, setSelectedArea] = useState<any>({
    id: 1,
    upazila: 'Sonagazi',
    district: 'Feni',
    flood_status: 'Severe Flooding (1.8 - 3.2m depth)',
    reports_count: 18,
    households: 142,
    relief_status: 'VERIFICATION_REQUIRED',
    lat: 22.8468,
    lon: 91.3934,
  });

  const [selectedInst, setSelectedInst] = useState<Institution | null>(DEFAULT_INSTITUTIONS[3]); // Default to Mangalkandi High School
  const [panelMode, setPanelMode] = useState<PanelMode>('INSTITUTION_DETAILS');
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(true);

  // Verification Form State
  const [verifyCondition, setVerifyCondition] = useState<string>('SEVERELY_FLOODED');
  const [verifyNeeds, setVerifyNeeds] = useState<string[]>(['Food', 'Drinking Water', 'Medicine']);
  const [verifyPeople, setVerifyPeople] = useState<number>(550);
  const [verifyHouseholds, setVerifyHouseholds] = useState<number>(142);
  const [verifyNotes, setVerifyNotes] = useState<string>('School grounds partially submerged. 140+ families sheltering on second floor. Immediate dry food and clean water needed.');
  const [submittingVerify, setSubmittingVerify] = useState<boolean>(false);

  // Relief Assignment Form State
  const [selectedProviderId, setSelectedProviderId] = useState<number>(1);
  const [foodQuantity, setFoodQuantity] = useState<number>(300);
  const [waterQuantity, setWaterQuantity] = useState<number>(500);
  const [medQuantity, setMedQuantity] = useState<number>(50);
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // Center/Fly to Affected Area
  const handleFlyToAffectedZone = () => {
    if (map.current) {
      map.current.flyTo({
        center: [91.3934, 22.8468],
        zoom: 11.5,
        essential: true,
      });
      setSelectedInst(null);
      setPanelMode('AREA_OVERVIEW');
      setIsOverlayOpen(true);
    }
  };

  // Load Data from Backend
  const loadData = async () => {
    try {
      const [instRes, floodRes, asgRes, provRes] = await Promise.all([
        apiClient.get<Institution[]>('/institutions').catch(() => ({ data: DEFAULT_INSTITUTIONS })),
        apiClient.get<FloodSimulation[]>('/flood/simulations').catch(() => ({ data: [] })),
        apiClient.get<ReliefAssignment[]>('/assignments').catch(() => ({ data: [] })),
        apiClient.get<ReliefProvider[]>('/providers').catch(() => ({ data: [] })),
      ]);

      if (instRes.data && instRes.data.length > 0) setInstitutions(instRes.data);
      if (floodRes.data && floodRes.data.length > 0) setFloodSimulations(floodRes.data);
      if (provRes.data && provRes.data.length > 0) setProviders(provRes.data);

      const sonagaziAsg = asgRes.data.find(a => a.destination_upazila === 'Sonagazi');
      if (sonagaziAsg) {
        setActiveAssignment(sonagaziAsg);
        setSelectedArea((prev: any) => ({ ...prev, relief_status: sonagaziAsg.status }));
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [initialLon, initialLat],
      zoom: initialZoom,
      attributionControl: false
    });

    mapInstance.addControl(new NavigationControl({ showCompass: false }), 'bottom-left');

    mapInstance.on('load', () => {
      map.current = mapInstance;
      renderFloodPolygons();
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Render Red Flood Polygons
  const renderFloodPolygons = () => {
    if (!map.current) return;

    let features: any[] = [];

    if (floodSimulations.length > 0) {
      floodSimulations.forEach((s) => {
        if (!s.geojson_polygon) return;
        try {
          const parsed = typeof s.geojson_polygon === 'string' ? JSON.parse(s.geojson_polygon) : s.geojson_polygon;
          const upzString = typeof s.affected_upazilas === 'string' ? s.affected_upazilas : JSON.stringify(s.affected_upazilas);
          parsed.properties = {
            id: s.id,
            name: s.name,
            upazilas: upzString,
            severity: s.severity || 'CRITICAL',
          };
          features.push(parsed);
        } catch (err) {
          console.error('Error parsing polygon:', err);
        }
      });
    }

    if (features.length === 0) {
      features = [DEFAULT_SONAGAZI_POLYGON];
    }

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    if (map.current.getSource('flood-zones')) {
      (map.current.getSource('flood-zones') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.current.addSource('flood-zones', {
        type: 'geojson',
        data: geojsonData,
      });

      // 🔴 Solid Bright Red Fill
      map.current.addLayer({
        id: 'flood-zones-fill',
        type: 'fill',
        source: 'flood-zones',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.35,
        },
      });

      // 🔴 Bold Red Boundary
      map.current.addLayer({
        id: 'flood-zones-line',
        type: 'line',
        source: 'flood-zones',
        paint: {
          'line-color': '#dc2626',
          'line-width': 4,
        },
      });

      // Click on red flood area
      map.current.on('click', 'flood-zones-fill', () => {
        setSelectedInst(null);
        setPanelMode('AREA_OVERVIEW');
        setIsOverlayOpen(true);
      });

      map.current.on('mouseenter', 'flood-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'flood-zones-fill', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    }
  };

  useEffect(() => {
    if (map.current) {
      if (map.current.isStyleLoaded()) {
        renderFloodPolygons();
      } else {
        map.current.once('load', renderFloodPolygons);
      }
    }
  }, [floodSimulations]);

  // Render Markers: 🔴 Red Area Badge + 🟢 Green Verification Dots
  useEffect(() => {
    if (!map.current) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (areaMarkerRef.current) {
      areaMarkerRef.current.remove();
      areaMarkerRef.current = null;
    }

    // 1. 🔴 Red Affected Area Pin
    const redPin = document.createElement('div');
    redPin.className = 'cursor-pointer flex flex-col items-center select-none z-20 group';
    redPin.innerHTML = `
      <div class="px-3 py-1.5 bg-red-600 border-2 border-white text-white rounded-lg text-xs font-black tracking-wide shadow-2xl flex items-center gap-2 group-hover:scale-110 group-hover:bg-red-700 transition-all">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span>AFFECTED AREA (Sonagazi, Feni)</span>
      </div>
      <div class="w-3 h-3 bg-red-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white"></div>
    `;
    redPin.addEventListener('click', () => {
      setSelectedInst(null);
      setPanelMode('AREA_OVERVIEW');
      setIsOverlayOpen(true);
    });

    areaMarkerRef.current = new maplibregl.Marker({ element: redPin })
      .setLngLat([91.3934, 22.8468])
      .addTo(map.current);

    // 2. 🟢 Green Dots for All Verification Points (Schools, Colleges, NGOs)
    institutions.forEach((inst) => {
      const el = document.createElement('div');
      const isSelected = selectedInst?.id === inst.id;
      el.className = 'cursor-pointer group relative flex items-center justify-center p-2.5';

      el.innerHTML = `
        <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl group-hover:scale-150 group-hover:bg-emerald-600 transition-all flex items-center justify-center ${isSelected ? 'ring-4 ring-emerald-300 scale-125' : ''}">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
        <div class="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-2xl whitespace-nowrap z-30 pointer-events-none">
          ${inst.name}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleSelectInstitution(inst);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inst.longitude, inst.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [institutions, selectedInst]);

  // Selection Handler for Green Dot
  const handleSelectInstitution = (inst: Institution) => {
    setSelectedInst(inst);
    setPanelMode('INSTITUTION_DETAILS');
    setIsOverlayOpen(true);
    if (map.current) {
      map.current.flyTo({
        center: [inst.longitude, inst.latitude],
        zoom: 13.8,
        essential: true,
      });
    }
  };

  // Submit Verification Form
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst || !selectedArea) return;
    setSubmittingVerify(true);

    try {
      await apiClient.post('/verification/records', {
        institution_id: selectedInst.id,
        upazila: selectedArea.upazila,
        district: selectedArea.district,
        reported_condition: verifyCondition,
        people_sheltered_est: verifyPeople,
        water_level_est: '2.5 feet',
        access_road_status: 'Partially Submerged',
        contact_person: selectedInst.name,
        contact_phone: selectedInst.phone || '+8801819345678',
        verifier_notes: verifyNotes,
      }).catch(() => {});

      setSelectedArea((prev: any) => ({
        ...prev,
        relief_status: 'VERIFIED_NEED',
      }));

      setPanelMode('ASSIGN_RELIEF');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit verification');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Submit Relief Assignment
  const handleAssignRelief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea) return;
    setSubmittingAssign(true);

    const allocated = [
      { category: 'FOOD', item_name: 'Emergency Food Packs', quantity: foodQuantity, unit: 'packages' },
      { category: 'WATER', item_name: 'Clean Drinking Water', quantity: waterQuantity, unit: 'liters' },
      { category: 'MEDICINE', item_name: 'First Aid & Water Purification', quantity: medQuantity, unit: 'kits' },
    ];

    try {
      const res = await apiClient.post<ReliefAssignment>('/assignments', {
        provider_id: selectedProviderId,
        destination_district: selectedArea.district,
        destination_upazila: selectedArea.upazila,
        target_households: verifyHouseholds,
        priority: 'HIGH',
        allocated_resources: JSON.stringify(allocated),
        notes: `Relief dispatched based on ground verification at ${selectedInst?.name || 'Sonagazi College'}.`,
      }).catch(() => ({
        data: {
          id: 1,
          destination_upazila: 'Sonagazi',
          destination_district: 'Feni',
          status: 'ASSIGNED',
          provider_name: 'Bangladesh Red Crescent Society (BDRCS) - Feni Unit',
          target_households: 142,
          priority: 'HIGH',
        } as ReliefAssignment
      }));

      setActiveAssignment(res.data);
      setSelectedArea((prev: any) => ({
        ...prev,
        relief_status: 'ASSIGNED',
      }));

      setPanelMode('TRACK_OPERATION');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign relief');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Advance Operational Status
  const handleAdvanceStatus = async (newStatus: any) => {
    if (!activeAssignment) return;
    try {
      await apiClient.patch(`/assignments/${activeAssignment.id}/status`, {
        status: newStatus,
      }).catch(() => {});

      setActiveAssignment({
        ...activeAssignment,
        status: newStatus,
      });
      setSelectedArea((prev: any) => ({
        ...prev,
        relief_status: newStatus,
      }));
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update operation');
    }
  };

  // Complete Delivery
  const handleCompleteDelivery = async () => {
    if (!activeAssignment) return;
    try {
      await apiClient.post('/deliveries', {
        assignment_id: activeAssignment.id,
        people_served: verifyPeople,
        households_served: verifyHouseholds,
        distribution_point: selectedInst?.name || 'Sonagazi Government College Ground',
        proof_notes: 'Ground distribution verified with local headmaster and volunteer team.',
        status: 'DELIVERED',
        items: [
          { resource_category: 'FOOD', item_name: 'Food Packs', quantity_delivered: foodQuantity, unit: 'packages' },
          { resource_category: 'WATER', item_name: 'Water Liters', quantity_delivered: waterQuantity, unit: 'liters' },
          { resource_category: 'MEDICINE', item_name: 'Medical Kits', quantity_delivered: medQuantity, unit: 'kits' },
        ],
      }).catch(() => {});

      setActiveAssignment({
        ...activeAssignment,
        status: 'DELIVERED',
      });
      setSelectedArea((prev: any) => ({
        ...prev,
        relief_status: 'DELIVERED',
      }));
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to confirm delivery');
    }
  };

  // Nearby points calculation
  const nearbyPoints = institutions
    .map((inst) => ({
      ...inst,
      distance: calculateDistance(selectedArea.lat, selectedArea.lon, inst.latitude, inst.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] min-h-[500px] overflow-hidden">
      {/* Map Canvas (Full Screen) */}
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-slate-100" 
        style={{ width: '100%', height: '100%' }}
      />

      {/* Top-Left Legend & Navigation */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-md space-y-2 text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span>Feni & Muhuri Flood Response</span>
          </div>

          <button
            onClick={handleFlyToAffectedZone}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors"
          >
            <Crosshair className="w-3 h-3" />
            <span>Go to Affected Area</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-600 flex items-center gap-4 pt-1.5 border-t border-slate-100 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500/40 border-2 border-red-600 inline-block" />
            <strong className="text-red-700">Affected Area (Red Zone)</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm inline-block" />
            <strong className="text-emerald-700">Verification Point (Green Dot)</strong>
          </span>
        </div>
      </div>

      {/* 🚀 OVER-THE-MAP FLOATING VERIFICATION & CONTACT TAB */}
      {isOverlayOpen && (
        <div className="absolute top-4 right-4 z-30 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5.5rem)] bg-white border border-slate-300 shadow-2xl rounded-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Floating Tab Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {panelMode !== 'AREA_OVERVIEW' && (
                <button
                  onClick={() => {
                    if (panelMode === 'VERIFY_FORM') setPanelMode('INSTITUTION_DETAILS');
                    else setPanelMode('AREA_OVERVIEW');
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {panelMode === 'INSTITUTION_DETAILS' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Contact & Verify Institution</span>
                    </>
                  )}
                  {panelMode === 'VERIFY_FORM' && (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Record Ground Verification</span>
                    </>
                  )}
                  {panelMode === 'AREA_OVERVIEW' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Affected Locality Overview</span>
                    </>
                  )}
                  {panelMode === 'ASSIGN_RELIEF' && (
                    <>
                      <Truck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Assign Relief Provider</span>
                    </>
                  )}
                  {panelMode === 'TRACK_OPERATION' && (
                    <>
                      <Package className="w-3.5 h-3.5 text-sky-400" />
                      <span>Live Convoy Tracker</span>
                    </>
                  )}
                </div>
                <div className="text-[10px] text-slate-300">
                  {selectedInst?.name || `${selectedArea.upazila}, ${selectedArea.district}`}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOverlayOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Close Tab"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Tab Body */}
          <div className="p-4 overflow-y-auto space-y-4 text-xs">
            {/* 1. INSTITUTION CONTACT & VERIFY TAB (Shown on Green Dot Click) */}
            {panelMode === 'INSTITUTION_DETAILS' && selectedInst && (
              <div className="space-y-4">
                {/* Institution Title & Badge */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{selectedInst.name}</h3>
                      {selectedInst.bangla_name && (
                        <div className="text-xs text-slate-500 font-bangla">{selectedInst.bangla_name}</div>
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex-shrink-0">
                      VERIFICATION POINT
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Location:</span>
                      <strong className="text-slate-900">{selectedInst.address || `${selectedInst.upazila}, ${selectedInst.district}`}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Proximity:</span>
                      <strong className="text-emerald-700">
                        {calculateDistance(selectedArea.lat, selectedArea.lon, selectedInst.latitude, selectedInst.longitude)} km from cluster
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Capacity:</span>
                      <strong className="text-slate-900">~{selectedInst.capacity_est || 1000} persons</strong>
                    </div>
                  </div>
                </div>

                {/* Direct Contact Box with School */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Contact Local Authority</span>
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-900">
                      {selectedInst.phone || '+880 1817-678901'}
                    </span>
                  </div>

                  <a
                    href={`tel:${selectedInst.phone || '01817678901'}`}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call School / Center Now</span>
                  </a>
                </div>

                {/* Primary Action Button to Verify */}
                <button
                  onClick={() => setPanelMode('VERIFY_FORM')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Flood Situation with School →</span>
                </button>
              </div>
            )}

            {/* 2. RECORD VERIFICATION FORM (Tab Step 2) */}
            {panelMode === 'VERIFY_FORM' && selectedInst && (
              <form onSubmit={handleConfirmVerification} className="space-y-3.5">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Flood Condition Reported</label>
                  <select
                    value={verifyCondition}
                    onChange={(e) => setVerifyCondition(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    <option value="SEVERELY_FLOODED">Severely Flooded (Families cut off / Submerged)</option>
                    <option value="PARTIALLY_FLOODED">Partially Flooded (Roads underwater)</option>
                    <option value="EVACUATED">Evacuated to Shelter Center</option>
                    <option value="SAFE">Safe / Flood Water Receding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Confirmed Urgent Needs</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Food', 'Drinking Water', 'Medicine', 'Shelter', 'Boat Evacuation'].map((need) => (
                      <label key={need} className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={verifyNeeds.includes(need)}
                          onChange={(e) => {
                            if (e.target.checked) setVerifyNeeds([...verifyNeeds, need]);
                            else setVerifyNeeds(verifyNeeds.filter((n) => n !== need));
                          }}
                          className="rounded border-slate-300 text-slate-900"
                        />
                        <span>{need}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">People</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={verifyPeople}
                      onChange={(e) => setVerifyPeople(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Households</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={verifyHouseholds}
                      onChange={(e) => setVerifyHouseholds(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Field Observation Notes</label>
                  <textarea
                    rows={2}
                    required
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="Observations from contact person..."
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingVerify ? 'Submitting...' : 'Confirm Verification & Update Map'}</span>
                </button>
              </form>
            )}

            {/* 3. ASSIGN RELIEF (Tab Step 3) */}
            {panelMode === 'ASSIGN_RELIEF' && (
              <form onSubmit={handleAssignRelief} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <div className="font-bold text-emerald-900 text-xs">✓ Ground Verification Completed</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {selectedArea.upazila}, {selectedArea.district} • {verifyHouseholds} Households Verified
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Select Relief Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(parseInt(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 bg-white"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-md">
                  <div className="font-bold text-slate-800 text-[11px]">Cargo Quantity</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Food</label>
                      <input
                        type="number"
                        min="1"
                        value={foodQuantity}
                        onChange={(e) => setFoodQuantity(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded px-1.5 py-1 font-mono text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Water (L)</label>
                      <input
                        type="number"
                        min="1"
                        value={waterQuantity}
                        onChange={(e) => setWaterQuantity(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded px-1.5 py-1 font-mono text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 mb-0.5">Med Kits</label>
                      <input
                        type="number"
                        min="1"
                        value={medQuantity}
                        onChange={(e) => setMedQuantity(parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-300 rounded px-1.5 py-1 font-mono text-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Truck className="w-4 h-4 text-sky-400" />
                  <span>{submittingAssign ? 'Assigning...' : 'Dispatch Relief Convoy'}</span>
                </button>
              </form>
            )}

            {/* 4. TRACK OPERATION (Tab Step 4) */}
            {panelMode === 'TRACK_OPERATION' && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Operation #{activeAssignment?.id || 1}</span>
                    <StatusBadge status={activeAssignment?.status || 'IN_TRANSIT'} size="sm" />
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-bold pt-1">
                    <div className={`p-1 rounded ${['ASSIGNED', 'PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(activeAssignment?.status || '') ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      Assigned
                    </div>
                    <div className={`p-1 rounded ${['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(activeAssignment?.status || '') ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      Dispatched
                    </div>
                    <div className={`p-1 rounded ${['IN_TRANSIT', 'DELIVERED'].includes(activeAssignment?.status || '') ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      In Transit
                    </div>
                    <div className={`p-1 rounded ${activeAssignment?.status === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      Delivered
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-md text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Destination:</span>
                    <strong className="text-slate-900">{selectedArea.upazila}, {selectedArea.district}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Provider:</span>
                    <strong className="text-slate-900">{activeAssignment?.provider_name || 'BDRCS Relief Unit'}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Supplies:</span>
                    <strong className="text-slate-900">{foodQuantity} Food • {waterQuantity}L Water</strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  {activeAssignment?.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleAdvanceStatus('DISPATCHED')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs transition-colors"
                    >
                      Mark as Dispatched
                    </button>
                  )}

                  {activeAssignment?.status === 'DISPATCHED' && (
                    <button
                      onClick={() => handleAdvanceStatus('IN_TRANSIT')}
                      className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold text-xs transition-colors"
                    >
                      Mark In Transit
                    </button>
                  )}

                  {['DISPATCHED', 'IN_TRANSIT'].includes(activeAssignment?.status || '') && (
                    <button
                      onClick={handleCompleteDelivery}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Ground Delivery</span>
                    </button>
                  )}

                  {activeAssignment?.status === 'DELIVERED' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-center text-emerald-800 font-bold text-xs">
                      ✓ Delivery Confirmed & Verified
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. AFFECTED LOCALITY OVERVIEW (Shown on Red Area Pin Click) */}
            {panelMode === 'AREA_OVERVIEW' && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Flood Status:</span>
                    <strong className="text-red-600">{selectedArea.flood_status}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Reports:</span>
                    <strong className="text-slate-900">{selectedArea.reports_count} requests</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Affected Families:</span>
                    <strong className="text-slate-900">{selectedArea.households} households</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Click Any Green Dot to Contact:
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {nearbyPoints.map((inst) => (
                      <div
                        key={inst.id}
                        onClick={() => handleSelectInstitution(inst)}
                        className="p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-900 text-[11px] truncate max-w-[200px]">{inst.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{inst.distance} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
