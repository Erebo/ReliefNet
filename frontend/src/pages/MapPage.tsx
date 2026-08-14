import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapLibreMap } from '../features/map/MapLibreMap';

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : 22.8468;
  const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : 91.3934;
  const zoom = searchParams.get('zoom') ? parseFloat(searchParams.get('zoom')!) : 11;

  return (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden relative">
      <MapLibreMap initialLat={lat} initialLon={lon} initialZoom={zoom} />
    </div>
  );
};
