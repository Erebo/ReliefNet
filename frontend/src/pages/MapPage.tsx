import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapLibreMap } from '../features/map/MapLibreMap';

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 22.8485;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : 91.3912;
  const zoom = searchParams.get('zoom') ? parseFloat(searchParams.get('zoom')!) : 13.5;
  const scenario = searchParams.get('scenario') || 'feni';
  const instId = searchParams.get('instId') ? parseInt(searchParams.get('instId')!) : undefined;
  const area = searchParams.get('area') || undefined;

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden relative">
      <MapLibreMap
        initialLat={lat}
        initialLon={lon}
        initialZoom={zoom}
        initialScenario={scenario}
        initialInstId={instId}
        initialArea={area}
      />
    </div>
  );
};
