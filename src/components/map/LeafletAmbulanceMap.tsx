import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { computeLiveRoute, computeKinematicRoute, CalculatedRouteResult, isValidCoordinate, normalizeRoutePoints } from '../../services/locationService';
import { useLanguage } from '../../context/LanguageContext';

interface LeafletAmbulanceMapProps {
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

export const LeafletAmbulanceMap: React.FC<LeafletAmbulanceMapProps> = ({
  origin,
  destination,
  travelMode = 'ambulance',
  destinationName = 'Destination Hospital',
  onRouteCalculated,
  onRouteError,
  onLoading,
  isTrackingView = false,
  retryTrigger = 0
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const callbacksRef = useRef({
    onRouteCalculated,
    onRouteError,
    onLoading
  });

  useEffect(() => {
    callbacksRef.current = {
      onRouteCalculated,
      onRouteError,
      onLoading
    };
  });

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    const validOrigin = origin && isValidCoordinate(origin.lat, origin.lng) ? origin : null;
    const validDest = destination && isValidCoordinate(destination.lat, destination.lng) ? destination : null;
    const initialCenter = validOrigin || validDest || { lat: 20.5937, lng: 78.9629 };

    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: validOrigin ? 14 : 11,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

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
      originMarkerRef.current = null;
      destMarkerRef.current = null;
      routePolylineRef.current = null;
    };
  }, []);

  // 2. Render Markers and Route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const validOrigin = origin && isValidCoordinate(origin.lat, origin.lng) ? origin : null;
    const validDestination = destination && isValidCoordinate(destination.lat, destination.lng) ? destination : null;

    // Origin Marker (Pickup GPS Location)
    if (validOrigin) {
      const originIcon = L.divIcon({
        className: 'ambulance-origin-icon',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-9px, -9px);">
            <span style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: rgba(20, 184, 166, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="width: 18px; height: 18px; border-radius: 9999px; background-color: #0F766E; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center;">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: #ffffff;"></span>
            </span>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      if (originMarkerRef.current) {
        originMarkerRef.current.setLatLng([validOrigin.lat, validOrigin.lng]);
      } else {
        originMarkerRef.current = L.marker([validOrigin.lat, validOrigin.lng], {
          icon: originIcon,
          zIndexOffset: 1000,
          title: t('Pickup Location (GPS)')
        }).addTo(map);
        originMarkerRef.current.bindTooltip(t('Pickup Location'), { direction: 'top', offset: [0, -10] });
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // Destination Marker (Hospital Emergency)
    if (validDestination) {
      const destIcon = L.divIcon({
        className: 'ambulance-dest-icon',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #e11d48; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 16px; transform: translate(-50%, -50%); outline: 2.5px solid rgba(254, 205, 211, 0.7);">
            +
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng([validDestination.lat, validDestination.lng]);
        destMarkerRef.current.setTooltipContent(destinationName);
      } else {
        destMarkerRef.current = L.marker([validDestination.lat, validDestination.lng], {
          icon: destIcon,
          zIndexOffset: 900,
          title: destinationName
        }).addTo(map);
        destMarkerRef.current.bindTooltip(destinationName, { direction: 'top', offset: [0, -16] });
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // Route calculation & polyline
    if (!validOrigin || !validDestination) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (validOrigin) {
        map.setView([validOrigin.lat, validOrigin.lng], 14);
      } else if (validDestination) {
        map.setView([validDestination.lat, validDestination.lng], 14);
      }
      return;
    }

    let isCancelled = false;
    const abortController = new AbortController();

    if (callbacksRef.current.onLoading) {
      callbacksRef.current.onLoading(true);
    }

    const strokeColor =
      travelMode === 'ambulance' ? '#E11D48' :
      travelMode === 'car' ? '#0D9488' :
      travelMode === 'walk' ? '#2563EB' : '#7C3AED';

    const renderRoute = (pts: Array<{ lat: number; lng: number }>, isDashed = false) => {
      if (isCancelled || !mapRef.current) return;

      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const latlngs: L.LatLngExpression[] = pts.map(p => [p.lat, p.lng]);

      const polyline = L.polyline(latlngs, {
        color: strokeColor,
        weight: travelMode === 'walk' ? 4 : 5,
        opacity: 0.9,
        dashArray: isDashed ? '6, 8' : undefined
      }).addTo(mapRef.current);

      routePolylineRef.current = polyline;

      const bounds = L.latLngBounds(latlngs);
      mapRef.current.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16
      });
    };

    const fetchRoute = async () => {
      try {
        const result = await computeLiveRoute(
          validOrigin,
          validDestination,
          travelMode,
          abortController.signal
        );

        if (isCancelled || abortController.signal.aborted) return;

        if (callbacksRef.current.onLoading) {
          callbacksRef.current.onLoading(false);
        }

        if (callbacksRef.current.onRouteCalculated) {
          callbacksRef.current.onRouteCalculated(result);
        }

        const validPts = normalizeRoutePoints(result.points);
        if (validPts.length >= 2) {
          renderRoute(validPts, false);
          return;
        }

        renderRoute([validOrigin, validDestination], true);
      } catch (err: any) {
        if (isCancelled || abortController.signal.aborted) return;

        if (callbacksRef.current.onLoading) {
          callbacksRef.current.onLoading(false);
        }

        console.warn('Leaflet live route notice, generating kinematic road ETA:', err);

        const fallback = computeKinematicRoute(validOrigin, validDestination, travelMode);

        if (callbacksRef.current.onRouteCalculated) {
          callbacksRef.current.onRouteCalculated(fallback);
        }

        const validFallbackPts = normalizeRoutePoints(fallback.points);
        if (validFallbackPts.length >= 2) {
          renderRoute(validFallbackPts, false);
        } else {
          renderRoute([validOrigin, validDestination], true);
        }
      }
    };

    fetchRoute();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
    destinationName,
    travelMode,
    isTrackingView,
    retryTrigger
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[190px] rounded-2xl overflow-hidden shadow-xs isolate bg-slate-100"
      style={{ minHeight: '190px' }}
    />
  );
};
