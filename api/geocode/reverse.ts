import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => void;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
  end: (cb?: () => void) => this;
}

const geoCache = new Map<string, { timestamp: number; payload: any }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const rawLat = body?.lat ?? body?.latitude ?? req.query?.lat;
    const rawLng = body?.lng ?? body?.longitude ?? req.query?.lng;

    const lat = Number(rawLat);
    const lng = Number(rawLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({
        success: false,
        error: 'Numeric lat and lng are required.'
      });
    }

    const cacheKey = `geo:rev:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cached = geoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) {
      return res.status(200).json(cached.payload);
    }

    // OpenStreetMap Nominatim reverse geocode
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MediKioskAI-HealthSystem/1.0 (Leaflet-OSM Geocoder)'
          },
          signal: AbortSignal.timeout(5000)
        }
      );

      if (osmRes.ok) {
        const osmData: any = await osmRes.json();
        const addr = osmData.address || {};
        const city = addr.city || addr.town || addr.municipality || addr.district || addr.county || 'Detected City';
        const state = addr.state || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
        const displayName = city ? (state ? `${city}, ${state}` : city) : (osmData.display_name || 'Detected Location');

        const payload = {
          success: true,
          displayName,
          location: {
            formattedAddress: osmData.display_name || `${city}, ${state}`,
            displayName,
            area,
            city,
            state,
            country: addr.country || 'India',
            latitude: lat,
            longitude: lng,
            isManual: false
          }
        };

        if (geoCache.size > 200) {
          const firstKey = geoCache.keys().next().value;
          if (firstKey) geoCache.delete(firstKey);
        }
        geoCache.set(cacheKey, { timestamp: Date.now(), payload });
        return res.status(200).json(payload);
      }
    } catch (osmErr) {
      console.warn('Nominatim reverse geocode notice:', osmErr);
    }

    // High-reliability graceful fallback for GPS coordinates
    const fallbackPayload = {
      success: true,
      displayName: 'Your Current GPS Location',
      location: {
        formattedAddress: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        displayName: 'Your Current GPS Location',
        area: 'Detected Area',
        city: 'Current Location',
        state: '',
        country: 'India',
        latitude: lat,
        longitude: lng,
        isManual: false
      }
    };

    return res.status(200).json(fallbackPayload);
  } catch (error: any) {
    console.error('Error in /api/geocode/reverse:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to reverse geocode coordinates'
    });
  }
}
