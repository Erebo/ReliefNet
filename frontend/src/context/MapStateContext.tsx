import React, { createContext, useContext, useState } from 'react';
import { ReliefAssignment } from '../types';

export type PanelMode = 'AREA_OVERVIEW' | 'INSTITUTION_DETAILS' | 'VERIFY_FORM' | 'ASSIGN_RELIEF' | 'TRACK_OPERATION';

export interface MapViewState {
  lat: number;
  lon: number;
  zoom: number;
}

interface MapStateContextType {
  // Map View
  mapViewState: MapViewState | null;
  setMapViewState: (state: MapViewState | null | ((prev: MapViewState | null) => MapViewState | null)) => void;

  // Command Panel State
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
  selectedInst: any | null;
  setSelectedInst: (inst: any | null) => void;
  targetedPlaceName: string | undefined;
  setTargetedPlaceName: (name: string | undefined) => void;
  isOverlayOpen: boolean;
  setIsOverlayOpen: (open: boolean) => void;
  activeAssignment: ReliefAssignment | null;
  setActiveAssignment: (asg: ReliefAssignment | null) => void;

  // Verification Form State
  verifyCondition: string;
  setVerifyCondition: (cond: string) => void;
  verifyNeeds: string[];
  setVerifyNeeds: React.Dispatch<React.SetStateAction<string[]>>;
  verifyPeople: number;
  setVerifyPeople: (p: number) => void;
  verifyChildren: number;
  setVerifyChildren: (c: number) => void;
  verifyNotes: string;
  setVerifyNotes: (notes: string) => void;

  // Assignment Form State
  selectedProviderId: number;
  setSelectedProviderId: (id: number) => void;
  foodQuantity: number;
  setFoodQuantity: (q: number) => void;
  waterQuantity: number;
  setWaterQuantity: (q: number) => void;
  medQuantity: number;
  setMedQuantity: (q: number) => void;
}

const MapStateContext = createContext<MapStateContextType | undefined>(undefined);

export const MapStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Map View
  const [mapViewState, setMapViewState] = useState<MapViewState | null>(null);

  // Command Panel State
  const [panelMode, setPanelMode] = useState<PanelMode>('AREA_OVERVIEW');
  const [selectedInst, setSelectedInst] = useState<any | null>(null);
  const [targetedPlaceName, setTargetedPlaceName] = useState<string | undefined>(undefined);
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState<ReliefAssignment | null>(null);

  // Verification Form State
  const [verifyCondition, setVerifyCondition] = useState('SEVERELY_FLOODED');
  const [verifyNeeds, setVerifyNeeds] = useState<string[]>(['Food', 'Drinking Water', 'Medicine']);
  const [verifyPeople, setVerifyPeople] = useState(380);
  const [verifyChildren, setVerifyChildren] = useState(170);
  const [verifyNotes, setVerifyNotes] = useState('');

  // Assignment Form State
  const [selectedProviderId, setSelectedProviderId] = useState(1);
  const [foodQuantity, setFoodQuantity] = useState(300);
  const [waterQuantity, setWaterQuantity] = useState(500);
  const [medQuantity, setMedQuantity] = useState(50);

  return (
    <MapStateContext.Provider
      value={{
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
      }}
    >
      {children}
    </MapStateContext.Provider>
  );
};

export const useMapState = () => {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error('useMapState must be used within a MapStateProvider');
  }
  return context;
};
