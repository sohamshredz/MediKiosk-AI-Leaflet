import React from 'react';
import { LeafletAmbulanceMap } from './LeafletAmbulanceMap';
import { CalculatedRouteResult } from '../../services/locationService';

export interface GoogleAmbulanceMapProps {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  travelMode?: 'ambulance' | 'car' | 'walk' | 'transit';
  destinationName?: string;
  onRouteCalculated?: (info: CalculatedRouteResult) => void;
  onRouteError?: (errorMsg: string) => void;
  onLoading?: (isLoading: boolean) => void;
  isTrackingView?: boolean;
  retryTrigger?: number;
}

export const GoogleAmbulanceMap: React.FC<GoogleAmbulanceMapProps> = (props) => {
  return <LeafletAmbulanceMap {...props} />;
};
