import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreInstance, Marker, NavigationControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Phone,
  CheckCircle2,
  Truck,
  ArrowLeft,
  X,
  ChevronDown,
  ShieldCheck,
  Package,
  Crosshair,
  ChevronRight,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Institution, FloodSimulation, ReliefAssignment, ReliefProvider } from '../../types';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useScenario } from '../../context/ScenarioContext';
import { useMapState } from '../../context/MapStateContext';

interface MapProps {
  initialLat?: number;
  initialLon?: number;
  initialZoom?: number;
  initialScenario?: string;
  initialInstId?: number;
  initialArea?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

// ─── Flood Scenario Definitions ──────────────────────────────────────────────
const FLOOD_SCENARIOS = [
  {
    id: 'feni',
    name: 'Feni & Muhuri River Flood',
    district: 'Feni',
    severity: 'CRITICAL',
    severityColor: 'bg-red-600',
    water_depth: '1.8 – 3.2 m',
    affected_population: 185000,
    affected_upazilas: ['Sonagazi', 'Feni Sadar', 'Parshuram', 'Fulgazi'],
    center: { lat: 22.95, lon: 91.41, zoom: 10.5 },
    polygon: {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [91.350, 22.780], [91.420, 22.780], [91.440, 22.840], [91.460, 22.920],
          [91.450, 23.080], [91.480, 23.180], [91.450, 23.250], [91.400, 23.230],
          [91.380, 23.120], [91.360, 23.000], [91.340, 22.890], [91.350, 22.780],
        ]],
      },
      properties: { name: 'Feni River Inundation Zone', severity: 'CRITICAL' },
    },
    institutions: [
      { id: 1, name: 'Sonagazi Government College', bangla_name: 'সোনাগাজী সরকারি কলেজ', type: 'COLLEGE', district: 'Feni', upazila: 'Sonagazi', union: 'Sonagazi Sadar', latitude: 22.8485, longitude: 91.3912, capacity_est: 1200, phone: '+880 1819-345678', email: 'principal@sonagazigovtcollege.edu.bd', address: 'College Road, Sonagazi, Feni' },
      { id: 2, name: 'Mangalkandi High School & Cyclone Shelter', bangla_name: 'মঙ্গলকান্দি উচ্চ বিদ্যালয়', type: 'SCHOOL', district: 'Feni', upazila: 'Sonagazi', union: 'Mangalkandi', latitude: 22.8610, longitude: 91.3780, capacity_est: 1500, phone: '+880 1817-678901', email: 'mangalkandi.school@gmail.com', address: 'Mangalkandi Union, Sonagazi, Feni' },
      { id: 3, name: 'Sonagazi Model High School', bangla_name: 'সোনাগাজী মডেল হাই স্কুল', type: 'SCHOOL', district: 'Feni', upazila: 'Sonagazi', union: 'Sonagazi Sadar', latitude: 22.8450, longitude: 91.3890, capacity_est: 850, phone: '+880 1818-567890', email: 'headmaster@sonagazimodel.edu.bd', address: 'Station Road, Sonagazi' },
      { id: 4, name: 'BDRCS Sonagazi Disaster Response Unit', bangla_name: 'বাংলাদেশ রেড ক্রিসেন্ট - সোনাগাজী', type: 'NGO', district: 'Feni', upazila: 'Sonagazi', union: 'Sonagazi Sadar', latitude: 22.8490, longitude: 91.3950, capacity_est: 500, phone: '+880 1819-876543', email: 'sonagazi@bdrcs.org', address: 'Red Crescent Disaster Response Unit, Sonagazi' },
      { id: 5, name: 'BRAC Relief Hub – Sonagazi', bangla_name: 'ব্র্যাক আঞ্চলিক অফিস', type: 'NGO', district: 'Feni', upazila: 'Sonagazi', union: 'Sonagazi Sadar', latitude: 22.8430, longitude: 91.3850, capacity_est: 400, phone: '+880 1713-009988', email: 'relief.sonagazi@brac.net', address: 'BRAC Complex, Sonagazi, Feni' },
      { id: 6, name: 'Parshuram Govt College', bangla_name: 'পরশুরাম সরকারি কলেজ', type: 'COLLEGE', district: 'Feni', upazila: 'Parshuram', union: 'Parshuram Sadar', latitude: 23.1980, longitude: 91.4400, capacity_est: 900, phone: '+880 1812-234567', email: 'principal@parshuramcollege.edu.bd', address: 'College Road, Parshuram, Feni' },
      { id: 7, name: 'Fulgazi Pilot High School', bangla_name: 'ফুলগাজী পাইলট হাই স্কুল', type: 'SCHOOL', district: 'Feni', upazila: 'Fulgazi', union: 'Fulgazi Sadar', latitude: 23.1560, longitude: 91.4200, capacity_est: 700, phone: '+880 1815-345678', email: 'head@fulgazipilot.edu.bd', address: 'Fulgazi Sadar, Feni' },
      { id: 8, name: 'As-Sunnah Foundation Relief Camp', bangla_name: 'আস-সুন্নাহ ফাউন্ডেশন', type: 'NGO', district: 'Feni', upazila: 'Sonagazi', union: 'Sonagazi Sadar', latitude: 22.8550, longitude: 91.3910, capacity_est: 700, phone: '+880 1977-112233', email: 'relief@assunnahfoundation.org', address: 'Central Eidgah Maidan, Sonagazi, Feni' },
    ],
  },
  {
    id: 'noakhali',
    name: 'Meghna Coastal Surge – Noakhali',
    district: 'Noakhali',
    severity: 'SEVERE',
    severityColor: 'bg-orange-600',
    water_depth: '1.2 – 2.0 m',
    affected_population: 94000,
    affected_upazilas: ['Companiganj', 'Senbagh', 'Subarnachar'],
    center: { lat: 22.76, lon: 91.22, zoom: 10.5 },
    polygon: {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [91.150, 22.650], [91.320, 22.650], [91.350, 22.760],
          [91.280, 22.880], [91.180, 22.850], [91.120, 22.720], [91.150, 22.650],
        ]],
      },
      properties: { name: 'Companiganj Tidal Inundation', severity: 'SEVERE' },
    },
    institutions: [
      { id: 10, name: 'Companiganj Govt High School', bangla_name: 'কোম্পানীগঞ্জ সরকারি উচ্চ বিদ্যালয়', type: 'SCHOOL', district: 'Noakhali', upazila: 'Companiganj', union: 'Companiganj Sadar', latitude: 22.7850, longitude: 91.2350, capacity_est: 1100, phone: '+880 1810-112233', email: 'head@companiganjhs.edu.bd', address: 'Companiganj Sadar, Noakhali' },
      { id: 11, name: 'Senbagh Degree College', bangla_name: 'সেনবাগ ডিগ্রি কলেজ', type: 'COLLEGE', district: 'Noakhali', upazila: 'Senbagh', union: 'Senbagh Sadar', latitude: 22.8100, longitude: 91.1800, capacity_est: 800, phone: '+880 1811-445566', email: 'principal@senbaghcollege.edu.bd', address: 'Senbagh, Noakhali' },
      { id: 12, name: 'BDRCS Noakhali District Unit', bangla_name: 'বাংলাদেশ রেড ক্রিসেন্ট - নোয়াখালী', type: 'NGO', district: 'Noakhali', upazila: 'Companiganj', union: 'Companiganj Sadar', latitude: 22.7700, longitude: 91.2200, capacity_est: 600, phone: '+880 1819-778899', email: 'noakhali@bdrcs.org', address: 'BDRCS Office, Companiganj, Noakhali' },
      { id: 13, name: 'Subarnachar Cyclone Shelter Primary School', bangla_name: 'সুবর্ণচর আশ্রয়কেন্দ্র বিদ্যালয়', type: 'SCHOOL', district: 'Noakhali', upazila: 'Subarnachar', union: 'Subarnachar Sadar', latitude: 22.7200, longitude: 91.2600, capacity_est: 1400, phone: '+880 1812-998877', email: 'subarnachar.school@gmail.com', address: 'Subarnachar, Noakhali' },
      { id: 14, name: 'BRAC Noakhali Coastal Response Hub', bangla_name: 'ব্র্যাক নোয়াখালী উপকূলীয় কেন্দ্র', type: 'NGO', district: 'Noakhali', upazila: 'Companiganj', union: 'Companiganj Sadar', latitude: 22.7950, longitude: 91.2100, capacity_est: 450, phone: '+880 1713-667788', email: 'noakhali@brac.net', address: 'BRAC Complex, Companiganj, Noakhali' },
    ],
  },
  {
    id: 'sylhet',
    name: 'Sylhet Surma River Flash Flood',
    district: 'Sylhet',
    severity: 'HIGH',
    severityColor: 'bg-amber-500',
    water_depth: '2.5 – 4.0 m',
    affected_population: 210000,
    affected_upazilas: ['Gowainghat', 'Companiganj', 'Jaintapur'],
    center: { lat: 25.07, lon: 91.93, zoom: 10.5 },
    polygon: {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [91.800, 24.960], [91.920, 24.950], [92.050, 25.000], [92.080, 25.100],
          [92.010, 25.180], [91.880, 25.170], [91.780, 25.100], [91.760, 25.020], [91.800, 24.960],
        ]],
      },
      properties: { name: 'Surma-Kushiyara Flash Inundation Zone', severity: 'HIGH' },
    },
    institutions: [
      { id: 20, name: 'Gowainghat Govt High School', bangla_name: 'গোয়াইনঘাট সরকারি উচ্চ বিদ্যালয়', type: 'SCHOOL', district: 'Sylhet', upazila: 'Gowainghat', union: 'Gowainghat Sadar', latitude: 25.0550, longitude: 91.9100, capacity_est: 1000, phone: '+880 1815-112233', email: 'head@gowainghaths.edu.bd', address: 'Gowainghat Sadar, Sylhet' },
      { id: 21, name: 'Jaintapur Degree College', bangla_name: 'জৈন্তাপুর ডিগ্রি কলেজ', type: 'COLLEGE', district: 'Sylhet', upazila: 'Jaintapur', union: 'Jaintapur Sadar', latitude: 25.0800, longitude: 92.0100, capacity_est: 750, phone: '+880 1816-445566', email: 'principal@jaintapurcollege.edu.bd', address: 'Jaintapur Sadar, Sylhet' },
      { id: 22, name: 'BDRCS Sylhet Haor Response Unit', bangla_name: 'বাংলাদেশ রেড ক্রিসেন্ট - সিলেট হাওর', type: 'NGO', district: 'Sylhet', upazila: 'Gowainghat', union: 'Gowainghat Sadar', latitude: 25.0350, longitude: 91.8900, capacity_est: 500, phone: '+880 1819-334455', email: 'sylhet.haor@bdrcs.org', address: 'BDRCS Haor Unit, Gowainghat, Sylhet' },
      { id: 23, name: 'Companiganj (Sylhet) Primary Shelter School', bangla_name: 'কোম্পানীগঞ্জ আশ্রয়কেন্দ্র বিদ্যালয়, সিলেট', type: 'SCHOOL', district: 'Sylhet', upazila: 'Companiganj', union: 'Companiganj Sadar', latitude: 25.0650, longitude: 91.9600, capacity_est: 1300, phone: '+880 1812-556677', email: 'companiganj.sylhet@gmail.com', address: 'Companiganj, Sylhet' },
      { id: 24, name: 'BRAC Sylhet Haor Flood Response Hub', bangla_name: 'ব্র্যাক সিলেট হাওর বন্যা কেন্দ্র', type: 'NGO', district: 'Sylhet', upazila: 'Gowainghat', union: 'Gowainghat Sadar', latitude: 25.0200, longitude: 91.9300, capacity_est: 380, phone: '+880 1713-889900', email: 'sylhet.haor@brac.net', address: 'BRAC Haor Centre, Gowainghat, Sylhet' },
    ],
  },
];

type PanelMode = 'AREA_OVERVIEW' | 'INSTITUTION_DETAILS' | 'VERIFY_FORM' | 'ASSIGN_RELIEF' | 'TRACK_OPERATION';

export const MapLibreMap: React.FC<MapProps> = ({
  initialLat,
  initialLon,
  initialZoom,
  initialScenario,
  initialInstId,
  initialArea,
}) => {
  const { activeScenarioId, setActiveScenarioId } = useScenario();
  const {
    mapViewState,
    setMapViewState,
    panelMode,
    setPanelMode,
    selectedInst,
    setSelectedInst,
    targetedPlaceName,
    setTargetedPlaceName,
    isOverlayOpen,
    setIsOverlayOpen,
    activeAssignment,
    setActiveAssignment,
    verifyCondition,
    setVerifyCondition,
    verifyNeeds,
    setVerifyNeeds,
    verifyPeople,
    setVerifyPeople,
    verifyChildren,
    setVerifyChildren,
    verifyNotes,
    setVerifyNotes,
    selectedProviderId,
    setSelectedProviderId,
    foodQuantity,
    setFoodQuantity,
    waterQuantity,
    setWaterQuantity,
    medQuantity,
    setMedQuantity,
  } = useMapState();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreInstance | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const areaMarkerRef = useRef<Marker | null>(null);

  const [showScenarioPicker, setShowScenarioPicker] = useState(false);

  const activeScenario = FLOOD_SCENARIOS.find(s => s.id === activeScenarioId) || FLOOD_SCENARIOS[0];

  // Local institutions from active scenario
  const [institutions, setInstitutions] = useState<any[]>(activeScenario.institutions);
  const [providers, setProviders] = useState<ReliefProvider[]>([]);

  const initialTargetInst = initialInstId 
    ? activeScenario.institutions.find(i => i.id === initialInstId)
    : null;

  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Sync initial props from URL navigation
  useEffect(() => {
    if (initialScenario && initialScenario !== activeScenarioId) {
      const scenario = FLOOD_SCENARIOS.find(s => s.id === initialScenario);
      if (scenario) {
        setActiveScenarioId(initialScenario);
        setInstitutions(scenario.institutions);
      }
    }
  }, [initialScenario]);

  useEffect(() => {
    if (initialInstId) {
      const scen = FLOOD_SCENARIOS.find(s => s.id === (initialScenario || activeScenarioId)) || FLOOD_SCENARIOS[0];
      const target = scen.institutions.find(i => i.id === initialInstId);
      if (target) {
        setSelectedInst(target);
        setPanelMode('INSTITUTION_DETAILS');
        setIsOverlayOpen(true);
        if (initialArea) setTargetedPlaceName(initialArea);
        if (map.current) {
          map.current.flyTo({ center: [target.longitude, target.latitude], zoom: 14.5, essential: true });
        }
      }
    }
  }, [initialInstId, initialScenario, initialArea, isMapLoaded]);

  // Load providers from API
  useEffect(() => {
    apiClient.get<ReliefProvider[]>('/providers').then(r => {
      if (r.data?.length) setProviders(r.data);
    }).catch(() => {});
  }, []);

  // ─── Switch scenario ────────────────────────────────────────────────────────
  const handleSelectScenario = (scenarioId: string) => {
    const scenario = FLOOD_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario || !map.current) return;

    setActiveScenarioId(scenarioId);
    setShowScenarioPicker(false);
    setInstitutions(scenario.institutions);
    setSelectedInst(null);
    setTargetedPlaceName(undefined);
    setPanelMode('AREA_OVERVIEW');
    setIsOverlayOpen(true);
    setMapViewState({
      lat: scenario.center.lat,
      lon: scenario.center.lon,
      zoom: scenario.center.zoom,
    });

    // Fly to the new area
    map.current.flyTo({
      center: [scenario.center.lon, scenario.center.lat],
      zoom: scenario.center.zoom,
      essential: true,
      duration: 1800,
    });

    // Re-render flood polygon
    renderScenarioPolygon(scenario, map.current);
  };

  const renderScenarioPolygon = (scenario: typeof FLOOD_SCENARIOS[0], mapInstance: MapLibreInstance) => {
    const geojsonData: any = {
      type: 'FeatureCollection',
      features: [scenario.polygon],
    };

    if (mapInstance.getSource('flood-zones')) {
      (mapInstance.getSource('flood-zones') as maplibregl.GeoJSONSource).setData(geojsonData);
    }
  };

  // ─── Initialize map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current) return;

    const startLat = initialLat ?? (initialTargetInst ? initialTargetInst.latitude : (mapViewState ? mapViewState.lat : activeScenario.center.lat));
    const startLon = initialLon ?? (initialTargetInst ? initialTargetInst.longitude : (mapViewState ? mapViewState.lon : activeScenario.center.lon));
    const startZoom = initialZoom ?? (initialTargetInst ? 14.2 : (mapViewState ? mapViewState.zoom : activeScenario.center.zoom));

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
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 19 }],
      },
      center: [startLon, startLat],
      zoom: startZoom,
      minZoom: 4.5,
      maxZoom: 18,
      renderWorldCopies: false,
      attributionControl: false,
    });

    mapInstance.addControl(new NavigationControl({ showCompass: false }), 'bottom-left');

    mapInstance.on('load', () => {
      map.current = mapInstance;
      setIsMapLoaded(true);

      // Add flood polygon source + layers once
      mapInstance.addSource('flood-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [activeScenario.polygon] },
      });

      mapInstance.addLayer({
        id: 'flood-zones-fill',
        type: 'fill',
        source: 'flood-zones',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.32 },
      });

      mapInstance.addLayer({
        id: 'flood-zones-line',
        type: 'line',
        source: 'flood-zones',
        paint: { 'line-color': '#dc2626', 'line-width': 3 },
      });

      mapInstance.on('moveend', () => {
        const center = mapInstance.getCenter();
        setMapViewState({
          lat: center.lat,
          lon: center.lng,
          zoom: mapInstance.getZoom(),
        });
      });

      if (initialTargetInst) {
        setSelectedInst(initialTargetInst);
        setPanelMode('INSTITUTION_DETAILS');
        setIsOverlayOpen(true);
      }

      mapInstance.on('click', 'flood-zones-fill', () => {
        setSelectedInst(null);
        setPanelMode('AREA_OVERVIEW');
        setIsOverlayOpen(true);
      });

      mapInstance.on('mouseenter', 'flood-zones-fill', () => {
        mapInstance.getCanvas().style.cursor = 'pointer';
      });
      mapInstance.on('mouseleave', 'flood-zones-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
      });
    });

    return () => { mapInstance.remove(); };
  }, []);

  // ─── Render markers when scenario or selection changes ──────────────────────
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (areaMarkerRef.current) { areaMarkerRef.current.remove(); areaMarkerRef.current = null; }

    const scenario = FLOOD_SCENARIOS.find(s => s.id === activeScenarioId) || FLOOD_SCENARIOS[0];

    // 🔴 Red area badge pin at center (absolute positioning so it stays fixed to coordinates)
    const redPin = document.createElement('div');
    redPin.className = 'absolute top-0 left-0 cursor-pointer flex flex-col items-center select-none z-20 group';
    redPin.innerHTML = `
      <div class="px-3 py-1.5 bg-red-600 border-2 border-white text-white rounded-lg text-xs font-black tracking-wide shadow-2xl flex items-center gap-2 group-hover:scale-110 group-hover:bg-red-700 transition-all">
        <span class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span>AFFECTED AREA — ${scenario.district}</span>
      </div>
      <div class="w-3 h-3 bg-red-600 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white"></div>
    `;
    redPin.addEventListener('click', () => {
      setSelectedInst(null);
      setPanelMode('AREA_OVERVIEW');
      setIsOverlayOpen(true);
    });

    areaMarkerRef.current = new maplibregl.Marker({ element: redPin, anchor: 'bottom', subpixelPositioning: true })
      .setLngLat([scenario.center.lon, scenario.center.lat])
      .addTo(map.current!);

    // 🟢 Green dots for each institution + 🚨 BLINKING RED EMERGENCY LIGHT on Targeted Location
    institutions.forEach(inst => {
      const el = document.createElement('div');
      const isSelected = selectedInst?.id === inst.id;
      el.className = 'absolute top-0 left-0 cursor-pointer group flex items-center justify-center p-3 z-30';
      
      if (isSelected) {
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <!-- Blinking Red Pulse Waves (Radar Range) -->
            <div class="absolute w-28 h-28 rounded-full bg-red-600/30 animate-ping pointer-events-none"></div>
            <div class="absolute w-16 h-16 rounded-full bg-red-600/60 animate-pulse pointer-events-none"></div>
            
            <!-- Floating Pointing Beacon Banner -->
            <div class="absolute -top-14 left-1/2 -translate-x-1/2 bg-red-600 border-2 border-white text-white text-[11px] font-black px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap animate-bounce z-40">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>🚨 ${targetedPlaceName || inst.union || inst.upazila || inst.name}</span>
            </div>

            <!-- Blinking Red Light Strobe Core -->
            <div class="relative w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-red-500 animate-pulse z-30">
              <div class="w-3 h-3 rounded-full bg-white animate-ping"></div>
            </div>
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="relative w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl group-hover:scale-150 group-hover:bg-emerald-600 transition-all flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <div class="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-2xl whitespace-nowrap z-30 pointer-events-none">
            ${inst.name}
          </div>
        `;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedInst(inst);
        setTargetedPlaceName(inst.union || inst.upazila || inst.name);
        setPanelMode('INSTITUTION_DETAILS');
        setIsOverlayOpen(true);
        map.current?.flyTo({ center: [inst.longitude, inst.latitude], zoom: 14.5, essential: true });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center', subpixelPositioning: true })
        .setLngLat([inst.longitude, inst.latitude])
        .addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [isMapLoaded, institutions, selectedInst, activeScenarioId, targetedPlaceName]);

  // Submit Verification
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setSubmittingVerify(true);
    try {
      await apiClient.post('/verification/records', {
        institution_id: selectedInst.id,
        upazila: activeScenario.affected_upazilas[0],
        district: activeScenario.district,
        reported_condition: verifyCondition,
        people_sheltered_est: verifyPeople + verifyChildren,
        verifier_notes: verifyNotes,
        contact_phone: selectedInst.phone,
      }).catch(() => {});
      setPanelMode('ASSIGN_RELIEF');
    } catch {}
    finally { setSubmittingVerify(false); }
  };

  // Submit Relief Assignment
  const handleAssignRelief = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAssign(true);
    const totalPeople = verifyPeople + verifyChildren;
    const estHouseholds = Math.max(1, Math.round(totalPeople / 4));
    try {
      const res = await apiClient.post<ReliefAssignment>('/assignments', {
        provider_id: selectedProviderId,
        destination_district: activeScenario.district,
        destination_upazila: activeScenario.affected_upazilas[0],
        target_households: estHouseholds,
        priority: 'HIGH',
        allocated_resources: JSON.stringify([
          { category: 'FOOD', item_name: 'Emergency Food Packs', quantity: foodQuantity, unit: 'packages' },
          { category: 'WATER', item_name: 'Clean Drinking Water', quantity: waterQuantity, unit: 'liters' },
          { category: 'MEDICINE', item_name: 'First Aid Kits', quantity: medQuantity, unit: 'kits' },
        ]),
      }).catch(() => ({
        data: { id: 1, status: 'ASSIGNED', provider_name: 'BDRCS Relief Team', target_households: estHouseholds } as ReliefAssignment
      }));
      setActiveAssignment(res.data);
      setPanelMode('TRACK_OPERATION');
    } catch {}
    finally { setSubmittingAssign(false); }
  };

  const handleAdvanceStatus = async (newStatus: any) => {
    if (!activeAssignment) return;
    await apiClient.patch(`/assignments/${activeAssignment.id}/status`, { status: newStatus }).catch(() => {});
    setActiveAssignment({ ...activeAssignment, status: newStatus });
  };

  const handleCompleteDelivery = async () => {
    if (!activeAssignment) return;
    const totalPeople = verifyPeople + verifyChildren;
    const estHouseholds = Math.max(1, Math.round(totalPeople / 4));
    await apiClient.post('/deliveries', {
      assignment_id: activeAssignment.id,
      people_served: totalPeople,
      households_served: estHouseholds,
      distribution_point: selectedInst?.name || `${activeScenario.district} Distribution Centre`,
      status: 'DELIVERED',
      items: [
        { resource_category: 'FOOD', item_name: 'Food Packs', quantity_delivered: foodQuantity, unit: 'packages' },
        { resource_category: 'WATER', item_name: 'Water', quantity_delivered: waterQuantity, unit: 'liters' },
        { resource_category: 'MEDICINE', item_name: 'Med Kits', quantity_delivered: medQuantity, unit: 'kits' },
      ],
    }).catch(() => {});
    setActiveAssignment({ ...activeAssignment, status: 'DELIVERED' });
  };

  const nearbyPoints = institutions
    .map(inst => ({
      ...inst,
      distance: calculateDistance(activeScenario.center.lat, activeScenario.center.lon, inst.latitude, inst.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);

  const severityBadge: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    SEVERE: 'bg-orange-100 text-orange-800 border-orange-300',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] min-h-[500px] overflow-hidden">
      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full bg-slate-100" style={{ width: '100%', height: '100%' }} />

      {/* ─── TOP-LEFT: Flood Scenario Selector Panel ─── */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2" style={{ minWidth: 260 }}>
        {/* Scenario Selector Button */}
        <div className="bg-white/97 backdrop-blur border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Active Scenario Header */}
          <button
            onClick={() => setShowScenarioPicker(p => !p)}
            className="w-full px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${activeScenario.severityColor} animate-pulse flex-shrink-0`} />
              <div className="text-left">
                <div className="text-xs font-black text-slate-900 leading-tight">{activeScenario.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{activeScenario.district} • {activeScenario.water_depth} depth</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${showScenarioPicker ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Scenario List */}
          {showScenarioPicker && (
            <div className="border-t border-slate-200 divide-y divide-slate-100">
              {FLOOD_SCENARIOS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario.id)}
                  className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left transition-colors ${
                    scenario.id === activeScenarioId ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${scenario.severityColor} flex-shrink-0`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{scenario.name}</div>
                    <div className={`text-[10px] ${scenario.id === activeScenarioId ? 'text-slate-300' : 'text-slate-500'}`}>
                      {scenario.district} • {scenario.severity} • {(scenario.affected_population / 1000).toFixed(0)}K affected
                    </div>
                  </div>
                  {scenario.id === activeScenarioId && (
                    <span className="ml-auto text-emerald-400 text-[10px] font-bold flex-shrink-0">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Go to Affected Area + Legend */}
        <div className="bg-white/97 backdrop-blur border border-slate-200 rounded-xl shadow-md p-3 space-y-2.5">
          <button
            onClick={() => {
              map.current?.flyTo({
                center: [activeScenario.center.lon, activeScenario.center.lat],
                zoom: activeScenario.center.zoom,
                essential: true,
              });
              setSelectedInst(null);
              setPanelMode('AREA_OVERVIEW');
              setIsOverlayOpen(true);
            }}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Go to Affected Area</span>
          </button>

          <div className="flex items-center gap-4 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500/40 border-2 border-red-600 inline-block" />
              <span className="text-red-700 font-bold">Flood Zone</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm inline-block" />
              <span className="text-emerald-700 font-bold">Verify Point</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── TOP-CENTER: Active Targeted Verification Point Banner ─── */}
      {selectedInst && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 backdrop-blur-md text-white border-2 border-red-500/80 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-in fade-in slide-in-from-top-2">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div className="text-xs text-left">
            <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">📍 Pointed From SMS Distress Signal</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-black text-sm text-white">{targetedPlaceName || selectedInst.union || selectedInst.upazila}</span>
              <span className="text-slate-400 text-xs font-medium">({selectedInst.district})</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5 font-medium">
              Verification Centre: <strong className="text-emerald-300 font-bold">{selectedInst.name}</strong>
            </span>
          </div>
          <button
            onClick={() => {
              map.current?.flyTo({ center: [selectedInst.longitude, selectedInst.latitude], zoom: 15, essential: true });
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors ml-1 cursor-pointer flex-shrink-0 shadow-sm"
          >
            <Crosshair className="w-3.5 h-3.5" /> Focus Pin
          </button>
        </div>
      )}

      {/* ─── TOP-RIGHT: Floating Verification & Command Tab ─── */}
      {isOverlayOpen && (
        <div className="absolute top-4 right-4 z-30 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5.5rem)] bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {panelMode !== 'AREA_OVERVIEW' && (
                <button
                  onClick={() => {
                    if (panelMode === 'VERIFY_FORM') setPanelMode('INSTITUTION_DETAILS');
                    else if (panelMode === 'INSTITUTION_DETAILS') { setSelectedInst(null); setPanelMode('AREA_OVERVIEW'); }
                    else setPanelMode('AREA_OVERVIEW');
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {panelMode === 'AREA_OVERVIEW' && <><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /><span>Flood Area Overview</span></>}
                  {panelMode === 'INSTITUTION_DETAILS' && <><span className="w-2 h-2 rounded-full bg-emerald-400" /><span>Contact & Verify</span></>}
                  {panelMode === 'VERIFY_FORM' && <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>Record Verification</span></>}
                  {panelMode === 'ASSIGN_RELIEF' && <><Send className="w-3.5 h-3.5 text-sky-400" /><span>Notify Relief Provider</span></>}
                  {panelMode === 'TRACK_OPERATION' && <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>Provider Notified</span></>}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {selectedInst?.name || `${activeScenario.district} — ${activeScenario.severity}`}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOverlayOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 text-xs flex-1">

            {/* AREA OVERVIEW */}
            {panelMode === 'AREA_OVERVIEW' && (
              <div className="space-y-3.5">
                {/* Scenario Stats */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{activeScenario.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadge[activeScenario.severity] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {activeScenario.severity}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-200">
                    <div className="text-center p-2 bg-white rounded-lg border border-red-100">
                      <div className="text-lg font-black text-red-600 font-mono">{(activeScenario.affected_population / 1000).toFixed(0)}K</div>
                      <div className="text-[10px] text-slate-500 font-semibold">People Affected</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg border border-red-100">
                      <div className="text-lg font-black text-orange-600 font-mono">{activeScenario.water_depth.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">Water Depth (m)</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold text-slate-800">Affected: </span>
                    {activeScenario.affected_upazilas.join(', ')}
                  </div>
                </div>

                {/* Verification Points List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                      Verification Points ({institutions.length})
                    </div>
                    <span className="text-[10px] text-slate-500">Click dot or row to contact</span>
                  </div>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {nearbyPoints.map(inst => (
                      <div
                        key={inst.id}
                        onClick={() => {
                          setSelectedInst(inst);
                          setPanelMode('INSTITUTION_DETAILS');
                          map.current?.flyTo({ center: [inst.longitude, inst.latitude], zoom: 13.5, essential: true });
                        }}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-900 text-[11px] truncate">{inst.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">{inst.distance}km</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* INSTITUTION DETAILS */}
            {panelMode === 'INSTITUTION_DETAILS' && selectedInst && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{selectedInst.name}</h3>
                      {selectedInst.bangla_name && <div className="text-xs text-slate-400 mt-0.5">{selectedInst.bangla_name}</div>}
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex-shrink-0 border border-emerald-200">
                      {selectedInst.type}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Address:</span>
                      <strong className="text-slate-900 text-right max-w-[65%]">{selectedInst.address || `${selectedInst.upazila}, ${selectedInst.district}`}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Capacity:</span>
                      <strong className="text-slate-900">~{selectedInst.capacity_est} persons</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Distance:</span>
                      <strong className="text-emerald-700">{calculateDistance(activeScenario.center.lat, activeScenario.center.lon, selectedInst.latitude, selectedInst.longitude)} km</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Contact Authority
                    </span>
                    <span className="font-mono font-bold text-xs text-emerald-800">{selectedInst.phone}</span>
                  </div>
                  <a
                    href={`tel:${selectedInst.phone}`}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Institution Now
                  </a>
                </div>

                <button
                  onClick={() => setPanelMode('VERIFY_FORM')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Verify Flood Situation with Institution →
                </button>
              </div>
            )}

            {/* VERIFY FORM */}
            {panelMode === 'VERIFY_FORM' && selectedInst && (
              <form onSubmit={handleConfirmVerification} className="space-y-3.5">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Flood Condition Reported</label>
                  <select value={verifyCondition} onChange={e => setVerifyCondition(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 bg-white">
                    <option value="SEVERELY_FLOODED">Severely Flooded — Families cut off</option>
                    <option value="PARTIALLY_FLOODED">Partially Flooded — Roads underwater</option>
                    <option value="EVACUATED">Evacuated to shelter</option>
                    <option value="SAFE">Safe / Receding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">Confirmed Urgent Needs</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Food', 'Drinking Water', 'Medicine', 'Shelter', 'Boat Evacuation'].map(need => (
                      <label key={need} className="flex items-center gap-1.5 text-slate-700 cursor-pointer text-xs">
                        <input type="checkbox" checked={verifyNeeds.includes(need)}
                          onChange={e => setVerifyNeeds(e.target.checked ? [...verifyNeeds, need] : verifyNeeds.filter(n => n !== need))}
                          className="rounded border-slate-300" />
                        {need}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">People (above 18)</label>
                    <input type="number" min="0" required value={verifyPeople}
                      onChange={e => setVerifyPeople(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 text-xs" />
                  </div>
                  <div>
                    <label className="block text-slate-800 font-bold mb-1">Children (below 18)</label>
                    <input type="number" min="0" required value={verifyChildren}
                      onChange={e => setVerifyChildren(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Field Observation Notes</label>
                  <textarea rows={2} value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)}
                    placeholder="Observations from contact person..."
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900 resize-none" />
                </div>

                <button type="submit" disabled={submittingVerify}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingVerify ? 'Submitting…' : 'Confirm Verification & Proceed'}
                </button>
              </form>
            )}

            {/* ASSIGN RELIEF */}
            {panelMode === 'ASSIGN_RELIEF' && (
              <form onSubmit={handleAssignRelief} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ground Verification Completed
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {activeScenario.district} • {verifyPeople} People (above 18) • {verifyChildren} Children (below 18)
                  </div>
                </div>

                <div>
                  <label className="block text-slate-800 font-bold mb-1">Select Relief Provider</label>
                  <select value={selectedProviderId} onChange={e => setSelectedProviderId(parseInt(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 bg-white">
                    {providers.length > 0 ? providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    )) : (
                      <>
                        <option value={1}>Bangladesh Red Crescent Society (BDRCS)</option>
                        <option value={2}>BRAC Humanitarian Response Team</option>
                        <option value={3}>As-Sunnah Foundation Flood Relief</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Cargo Allocation</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'Food Packs', val: foodQuantity, set: setFoodQuantity },
                      { label: 'Water (L)', val: waterQuantity, set: setWaterQuantity },
                      { label: 'Med Kits', val: medQuantity, set: setMedQuantity },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-[10px] text-slate-600 mb-0.5">{f.label}</label>
                        <input type="number" min="1" value={f.val}
                          onChange={e => f.set(parseInt(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 font-mono text-slate-900 text-xs" />
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={submittingAssign}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                  <Send className="w-4 h-4 text-sky-400" />
                  {submittingAssign ? 'Notifying Provider…' : 'Notify Provider'}
                </button>
              </form>
            )}

            {/* TRACK OPERATION */}
            {panelMode === 'TRACK_OPERATION' && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Provider Notified</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">Active</span>
                  </div>

                  <div className="text-xs space-y-1 pt-1 border-t border-slate-200">
                    <div className="flex justify-between text-slate-600"><span>Destination:</span><strong className="text-slate-900">{activeScenario.district}</strong></div>
                    <div className="flex justify-between text-slate-600"><span>Provider:</span><strong className="text-slate-900 text-right max-w-[60%] truncate">{activeAssignment?.provider_name || 'BDRCS Relief Unit'}</strong></div>
                    <div className="flex justify-between text-slate-600"><span>Cargo:</span><strong className="text-slate-900">{foodQuantity} Food · {waterQuantity}L Water</strong></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeAssignment?.status !== 'DELIVERED' && (
                    <>
                      <a
                        href={`tel:${selectedInst?.phone || '+880 1711-223344'}`}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Institution Now
                      </a>

                      <button onClick={handleCompleteDelivery}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirm Ground Delivery
                      </button>
                    </>
                  )}
                  {activeAssignment?.status === 'DELIVERED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-emerald-800 font-bold text-xs">
                      ✓ Delivery Confirmed & Verified on Ground
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reopen button when tab is closed */}
      {!isOverlayOpen && (
        <button
          onClick={() => setIsOverlayOpen(true)}
          className="absolute top-4 right-4 z-30 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span>Open Command Panel</span>
        </button>
      )}
    </div>
  );
};
