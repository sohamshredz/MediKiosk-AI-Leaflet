import React from 'react';
import { LeafletHospitalMap } from './LeafletHospitalMap';
import { RealHealthcareFacility } from './HospitalLocatorMap';

export interface GoogleHospitalMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  userLocation: { lat: number; lng: number } | null;
  facilities: RealHealthcareFacility[];
  selectedFacility: RealHealthcareFacility | null;
  onSelectFacility: (facility: RealHealthcareFacility) => void;
  activeRouteFacility: RealHealthcareFacility | null;
  travelMode?: 'ambulance' | 'car' | 'walk' | 'transit';
  onShowRoute: (facility: RealHealthcareFacility) => void;
  onBookToken: (facility: RealHealthcareFacility) => void;
  getDirectionsUrl: (facility: RealHealthcareFacility) => string;
}

export const GoogleHospitalMap: React.FC<GoogleHospitalMapProps> = (props) => {
  return <LeafletHospitalMap {...props} />;
};
