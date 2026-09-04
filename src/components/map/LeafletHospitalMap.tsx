import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RealHealthcareFacility } from './HospitalLocatorMap';
import { isValidCoordinate, computeLiveRoute, computeKinematicRoute, normalizeRoutePoints } from '../../services/locationService';
import { useLanguage } from '../../context/LanguageContext';

interface LeafletHospitalMapProps {
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

export const LeafletHospitalMap: React.FC<LeafletHospitalMapProps> = ({
  center,
  zoom,
  userLocation,
  facilities,
  selectedFacility,
  onSelectFacility,
  activeRouteFacility,
  travelMode = 'car',
  onShowRoute,
  onBookToken,
  getDirectionsUrl
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Store callbacks in refs to avoid recreating markers on callback identity change
  const callbacksRef = useRef({
    onSelectFacility,
    onShowRoute,
    onBookToken,
    getDirectionsUrl
  });

  useEffect(() => {
    callbacksRef.current = {
      onSelectFacility,
      onShowRoute,
      onBookToken,
      getDirectionsUrl
    };
  });

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return;

    const validCenter = isValidCoordinate(center?.lat, center?.lng)
      ? [center.lat, center.lng] as L.LatLngExpression
      : [20.5937, 78.9629] as L.LatLngExpression;

    const validZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 13;

    // Create Map instance
    const map = L.map(containerRef.current, {
      center: validCenter,
      zoom: validZoom,
      zoomControl: false // We will add zoom control with a clean position
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Layer for facility markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapRef.current = map;

    // Invalidate size on initial mount after CSS renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // ResizeObserver to handle container shifts, flex expansions, or mobile viewport changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      markerMapRef.current.clear();
      userMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // 2. Pan/Zoom when center or zoom changes significantly
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isValidCoordinate(center?.lat, center?.lng)) {
      const currentCenter = map.getCenter();
      const latDiff = Math.abs(currentCenter.lat - center.lat);
      const lngDiff = Math.abs(currentCenter.lng - center.lng);
      const currentZoom = map.getZoom();

      if (latDiff > 0.001 || lngDiff > 0.001 || currentZoom !== zoom) {
        map.setView([center.lat, center.lng], zoom, { animate: true });
      }
    }
  }, [center?.lat, center?.lng, zoom]);

  // 3. Render or update User GPS Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      const userIcon = L.divIcon({
        className: 'user-gps-pulse-icon',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; transform: translate(-8px, -8px); cursor: pointer;">
            <span style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(20, 184, 166, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="width: 16px; height: 16px; border-radius: 9999px; background-color: #0F766E; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); display: flex; align-items: center; justify-content: center;">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: #ffffff;"></span>
            </span>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
          title: t('Your Current GPS Position (YOU ARE HERE)')
        }).addTo(map);

        marker.bindTooltip(t('Your Location (GPS)'), { direction: 'top', offset: [0, -10] });
        userMarkerRef.current = marker;
      }
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    }
  }, [userLocation?.lat, userLocation?.lng, t]);

  // 4. Render Hospital Facility Markers and Popups
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous markers
    markersLayer.clearLayers();
    markerMapRef.current.clear();

    facilities.forEach((facility, index) => {
      if (!facility || !isValidCoordinate(facility.lat, facility.lng)) return;

      const isSelected = selectedFacility?.id === facility.id;
      const isEmergency = Boolean(facility.isEmergencyVerified);

      const markerHtml = `
        <div style="
          width: ${isSelected ? '32px' : isEmergency ? '28px' : '24px'};
          height: ${isSelected ? '32px' : isEmergency ? '28px' : '24px'};
          border-radius: 9999px;
          background-color: ${isSelected ? '#e11d48' : isEmergency ? '#0f766e' : '#0d9488'};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: ${isSelected ? '12px' : isEmergency ? '11px' : '10px'};
          cursor: pointer;
          transition: transform 0.2s;
          transform: translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : ''};
          ${isSelected ? 'outline: 3px solid rgba(253, 164, 175, 0.7);' : ''}
        ">
          ${index + 1}
        </div>
      `;

      const facilityIcon = L.divIcon({
        className: 'hospital-marker-icon',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([facility.lat, facility.lng], {
        icon: facilityIcon,
        zIndexOffset: isSelected ? 500 : 100,
        title: `${facility.name} (${facility.distanceKm.toFixed(1)} km)`
      });

      // Build Popup Content Node
      const popupContainer = document.createElement('div');
      popupContainer.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      popupContainer.style.maxWidth = '250px';
      popupContainer.style.padding = '4px';

      popupContainer.innerHTML = `
        <div style="margin-bottom: 6px;">
          <h4 style="margin: 0; font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3;">${facility.name}</h4>
          <span style="display: block; font-size: 10px; font-weight: 600; color: #0f766e; margin-top: 2px;">${t(facility.typeLabel)}</span>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569; line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
          ${facility.address}
        </p>
        <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 500; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; background-color: ${facility.isEmergencyVerified ? '#ecfdf5' : '#f8fafc'}; color: ${facility.isEmergencyVerified ? '#065f46' : '#334155'}; border: 1px solid ${facility.isEmergencyVerified ? '#a7f3d0' : '#e2e8f0'};">
          <span>${facility.isEmergencyVerified ? t('Emergency capability: Verified') : t('Emergency capability: Not verified')}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: #334155; padding-top: 4px; border-top: 1px solid #f1f5f9; margin-bottom: 8px;">
          <span style="color: #0f766e;">${facility.distanceKm.toFixed(1)} km</span>
          <span style="color: #64748b;">${t(`~${facility.travelTimeMins} mins`)}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; gap: 4px;">
            <button id="popup-route-btn-${facility.id}" type="button" style="flex: 1; padding: 5px 8px; background-color: #0f766e; color: #ffffff; border: none; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              ${t('Show Route')}
            </button>
            <a href="${callbacksRef.current.getDirectionsUrl(facility)}" target="_blank" rel="noopener noreferrer" style="padding: 5px 8px; background-color: #f1f5f9; color: #334155; text-decoration: none; border-radius: 6px; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;">
              ${t('Maps')}
            </a>
          </div>
          <button id="popup-token-btn-${facility.id}" type="button" style="width: 100%; padding: 5px 8px; background-color: #f59e0b; color: #020617; border: none; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer;">
            ${t('Book OPD Token')}
          </button>
        </div>
      `;

      // Attach button event listeners inside popup
      popupContainer.querySelector(`#popup-route-btn-${facility.id}`)?.addEventListener('click', () => {
        callbacksRef.current.onShowRoute(facility);
      });

      popupContainer.querySelector(`#popup-token-btn-${facility.id}`)?.addEventListener('click', () => {
        callbacksRef.current.onBookToken(facility);
      });

      marker.bindPopup(popupContainer, {
        maxWidth: 250,
        minWidth: 220,
        offset: [0, -12]
      });

      marker.on('click', () => {
        callbacksRef.current.onSelectFacility(facility);
      });

      marker.addTo(markersLayer);
      markerMapRef.current.set(facility.id, marker);

      // If this facility is currently selected, open its popup
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }
    });
  }, [facilities, selectedFacility?.id, t]);

  // 5. Open popup and center when selectedFacility changes from outside (e.g. list click)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFacility) return;

    if (isValidCoordinate(selectedFacility.lat, selectedFacility.lng)) {
      map.panTo([selectedFacility.lat, selectedFacility.lng], { animate: true });
      const targetMarker = markerMapRef.current.get(selectedFacility.id);
      if (targetMarker && !targetMarker.isPopupOpen()) {
        targetMarker.openPopup();
      }
    }
  }, [selectedFacility?.id]);

  // 6. Draw Route Polyline when activeRouteFacility is set
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing route polyline if any
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!activeRouteFacility || !userLocation ||
        !isValidCoordinate(userLocation.lat, userLocation.lng) ||
        !isValidCoordinate(activeRouteFacility.lat, activeRouteFacility.lng)) {
      return;
    }

    let isCancelled = false;

    const strokeColor =
      travelMode === 'ambulance' ? '#e11d48' :
      travelMode === 'walk' ? '#2563eb' :
      travelMode === 'transit' ? '#7c3aed' : '#0F766E';

    const drawPolyline = (pts: Array<{ lat: number; lng: number }>, isDashed = false) => {
      if (isCancelled || !mapRef.current) return;

      const latlngs: L.LatLngExpression[] = pts.map(p => [p.lat, p.lng]);

      const polyline = L.polyline(latlngs, {
        color: strokeColor,
        weight: travelMode === 'walk' ? 4 : 5,
        opacity: 0.9,
        dashArray: isDashed ? '6, 8' : undefined
      }).addTo(mapRef.current);

      routeLayerRef.current = polyline;

      // Fit bounds with padding so the user and destination hospital are both in view
      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
      });
    };

    const fetchRoute = async () => {
      try {
        const result = await computeLiveRoute(
          userLocation,
          { lat: activeRouteFacility.lat, lng: activeRouteFacility.lng },
          travelMode
        );

        if (isCancelled) return;

        if (result && Array.isArray(result.points) && result.points.length > 0) {
          const validPts = normalizeRoutePoints(result.points);
          if (validPts.length >= 2) {
            drawPolyline(validPts, false);
            return;
          }
        }
      } catch (err) {
        console.warn('Leaflet Hospital map route notice, falling back to kinematic calculation:', err);
      }

      if (!isCancelled) {
        const fallback = computeKinematicRoute(
          userLocation,
          { lat: activeRouteFacility.lat, lng: activeRouteFacility.lng },
          travelMode
        );
        const validFallbackPts = normalizeRoutePoints(fallback.points);
        if (validFallbackPts.length >= 2) {
          drawPolyline(validFallbackPts, false);
        } else {
          drawPolyline([
            userLocation,
            { lat: activeRouteFacility.lat, lng: activeRouteFacility.lng }
          ], true);
        }
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    activeRouteFacility?.id,
    activeRouteFacility?.lat,
    activeRouteFacility?.lng,
    userLocation?.lat,
    userLocation?.lng,
    travelMode
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[350px] relative z-0 isolate rounded-2xl overflow-hidden shadow-xs bg-slate-100"
      style={{ minHeight: '350px' }}
    />
  );
};
